import pool from '../config/db.js';
import { getStripe } from '../config/stripe.js';
import { logger } from '../utils/logger.js';
import { tierForPriceId } from '../utils/billingPrices.js';
import {
  tryInsertStripeEvent,
  upsertSubscriptionRow,
  setUserPlanTier,
  setUserStripeCustomerId,
  setUserOrganization,
  setOrganizationStripeCustomer,
  createOrganization,
  addOrganizationMember,
  applyPlanTierToOrgMembers,
  findSubscriptionByStripeId,
  deleteSubscriptionRow,
} from '../models/Billing.js';

function unixToDate(sec) {
  if (sec == null) return null;
  return new Date(sec * 1000);
}

function subscriptionPayload(sub) {
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id ?? item?.plan?.id;
  return {
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    status: sub.status,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    currentPeriodStart: unixToDate(sub.current_period_start),
    currentPeriodEnd: unixToDate(sub.current_period_end),
    trialEnd: unixToDate(sub.trial_end),
  };
}

async function syncSubscriptionToDb({ userId, organizationId, sub }) {
  const p = subscriptionPayload(sub);
  await upsertSubscriptionRow({
    userId: userId ?? null,
    organizationId: organizationId ?? null,
    ...p,
  });
}

async function applyTierForActiveSubscription(sub) {
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.id;
  const tier = tierForPriceId(priceId);
  const active = sub.status === 'active' || sub.status === 'trialing';
  const row = await findSubscriptionByStripeId(sub.id);
  if (!row) return;
  if (active && !tier) {
    logger.warn('Stripe subscription price id not mapped to tier', { priceId });
    return;
  }
  const effectiveTier = active ? tier : 'free';
  if (row.user_id) {
    await setUserPlanTier(row.user_id, effectiveTier);
  }
  if (row.organization_id) {
    await applyPlanTierToOrgMembers(row.organization_id, effectiveTier);
  }
}

/**
 * Handle `checkout.session.completed` for subscription checkouts.
 */
export async function handleCheckoutSessionCompleted(session) {
  if (session.mode !== 'subscription' || !session.subscription) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(String(session.subscription), {
    expand: ['items.data.price'],
  });

  const userId = session.client_reference_id || session.metadata?.user_id;
  if (!userId) {
    logger.error('checkout.session.completed missing user reference', { sessionId: session.id });
    return;
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const flow = session.metadata?.flow || 'individual';
  const p = subscriptionPayload(sub);

  if (flow === 'school') {
    const orgName = String(session.metadata?.org_name || 'Organization').slice(0, 255);
    const item = sub.items?.data?.[0];
    const qty = Math.max(1, Number(item?.quantity) || 1);

    const org = await createOrganization({
      name: orgName,
      billingEmail: session.customer_email || null,
      seatQuantity: qty,
    });
    if (customerId) {
      await setOrganizationStripeCustomer(org.id, customerId);
    }
    await addOrganizationMember({ organizationId: org.id, userId, role: 'admin' });
    await setUserOrganization(userId, org.id);
    await syncSubscriptionToDb({ userId: null, organizationId: org.id, sub });
    await applyPlanTierToOrgMembers(org.id, tierForPriceId(p.stripePriceId) ?? 'school');
    logger.info('School org created from checkout', { orgId: org.id, userId, seats: qty });
    return;
  }

  if (customerId) {
    await setUserStripeCustomerId(userId, customerId);
  }
  await syncSubscriptionToDb({ userId, organizationId: null, sub });
  const tier = tierForPriceId(p.stripePriceId);
  if (tier) {
    const active = sub.status === 'active' || sub.status === 'trialing';
    await setUserPlanTier(userId, active ? tier : 'free');
  }
}

export async function handleSubscriptionUpdated(sub) {
  let row = await findSubscriptionByStripeId(sub.id);
  if (!row && sub.metadata?.user_id && sub.metadata?.flow !== 'school') {
    await syncSubscriptionToDb({ userId: sub.metadata.user_id, organizationId: null, sub });
    row = await findSubscriptionByStripeId(sub.id);
  }
  if (!row) {
    logger.warn('subscription.updated for unknown local subscription', { id: sub.id });
    return;
  }
  const p = subscriptionPayload(sub);
  await upsertSubscriptionRow({
    userId: row.user_id,
    organizationId: row.organization_id,
    ...p,
  });
  await applyTierForActiveSubscription(sub);
}

export async function handleSubscriptionDeleted(sub) {
  const row = await findSubscriptionByStripeId(sub.id);
  if (!row) return;
  if (row.organization_id) {
    await applyPlanTierToOrgMembers(row.organization_id, 'free');
  }
  if (row.user_id) {
    await setUserPlanTier(row.user_id, 'free');
  }
  await deleteSubscriptionRow(sub.id);
}

export async function processStripeWebhookEvent(event) {
  const firstTime = await tryInsertStripeEvent(event.id, event.type, event.data?.object ?? {});
  if (!firstTime) {
    return { skipped: true };
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.paid':
      // Optional: record payments row from event.data.object
      break;
    case 'invoice.payment_failed': {
      const inv = event.data.object;
      const customerId = typeof inv.customer === 'string' ? inv.customer : null;
      if (customerId) {
        const { rows } = await pool.query(`SELECT id FROM users WHERE stripe_customer_id = $1`, [
          customerId,
        ]);
        if (rows[0]) logger.warn('Stripe invoice payment failed', { userId: rows[0].id });
      }
      break;
    }
    default:
      break;
  }
  return { skipped: false };
}
