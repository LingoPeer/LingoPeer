import pool from '../config/db.js';
import { tierForPriceId } from '../utils/billingPrices.js';

export async function getUserPlanRow(userId) {
  const { rows } = await pool.query(
    `SELECT id, plan_tier, stripe_customer_id, organization_id FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function setUserStripeCustomerId(userId, stripeCustomerId) {
  await pool.query(`UPDATE users SET stripe_customer_id = $2 WHERE id = $1`, [userId, stripeCustomerId]);
}

export async function setUserPlanTier(userId, planTier) {
  await pool.query(`UPDATE users SET plan_tier = $2 WHERE id = $1`, [userId, planTier]);
}

export async function setUserOrganization(userId, organizationId) {
  await pool.query(`UPDATE users SET organization_id = $2 WHERE id = $1`, [userId, organizationId]);
}

export async function tryInsertStripeEvent(id, type, payload) {
  const { rowCount } = await pool.query(
    `INSERT INTO stripe_events (id, type, payload) VALUES ($1, $2, $3::jsonb) ON CONFLICT (id) DO NOTHING`,
    [id, type, JSON.stringify(payload)],
  );
  return rowCount > 0;
}

export async function upsertSubscriptionRow({
  userId,
  organizationId,
  stripeSubscriptionId,
  stripePriceId,
  status,
  cancelAtPeriodEnd,
  currentPeriodStart,
  currentPeriodEnd,
  trialEnd,
}) {
  const { rows } = await pool.query(
    `
    INSERT INTO subscriptions (
      user_id, organization_id, stripe_subscription_id, stripe_price_id, status,
      cancel_at_period_end, current_period_start, current_period_end, trial_end, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW())
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      stripe_price_id = EXCLUDED.stripe_price_id,
      status = EXCLUDED.status,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      trial_end = EXCLUDED.trial_end,
      updated_at = NOW()
    RETURNING *;
    `,
    [
      userId ?? null,
      organizationId ?? null,
      stripeSubscriptionId,
      stripePriceId,
      status,
      cancelAtPeriodEnd,
      currentPeriodStart,
      currentPeriodEnd,
      trialEnd,
    ],
  );
  return rows[0];
}

export async function findSubscriptionByStripeId(stripeSubscriptionId) {
  const { rows } = await pool.query(`SELECT * FROM subscriptions WHERE stripe_subscription_id = $1`, [
    stripeSubscriptionId,
  ]);
  return rows[0] ?? null;
}

export async function deleteSubscriptionRow(stripeSubscriptionId) {
  await pool.query(`DELETE FROM subscriptions WHERE stripe_subscription_id = $1`, [stripeSubscriptionId]);
}

export async function createOrganization({ name, billingEmail, seatQuantity = 1 }) {
  const { rows } = await pool.query(
    `INSERT INTO organizations (name, billing_email, seat_quantity) VALUES ($1, $2, $3) RETURNING *`,
    [name, billingEmail || null, seatQuantity],
  );
  return rows[0];
}

export async function setOrganizationStripeCustomer(organizationId, stripeCustomerId) {
  await pool.query(`UPDATE organizations SET stripe_customer_id = $2 WHERE id = $1`, [
    organizationId,
    stripeCustomerId,
  ]);
}

export async function addOrganizationMember({ organizationId, userId, role }) {
  await pool.query(
    `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [organizationId, userId, role],
  );
}

export async function listOrganizationMemberUserIds(organizationId) {
  const { rows } = await pool.query(
    `SELECT user_id FROM organization_members WHERE organization_id = $1`,
    [organizationId],
  );
  return rows.map((r) => r.user_id);
}

export async function applyPlanTierToOrgMembers(organizationId, planTier) {
  const ids = await listOrganizationMemberUserIds(organizationId);
  if (!ids.length) return;
  await pool.query(`UPDATE users SET plan_tier = $2 WHERE id = ANY($1::uuid[])`, [ids, planTier]);
}

export async function getBillingSummaryForUser(userId) {
  const user = await getUserPlanRow(userId);
  if (!user) return null;

  let sub = null;
  if (user.organization_id) {
    const r = await pool.query(
      `SELECT s.* FROM subscriptions s WHERE s.organization_id = $1 ORDER BY s.updated_at DESC LIMIT 1`,
      [user.organization_id],
    );
    sub = r.rows[0] ?? null;
  } else {
    const r = await pool.query(
      `SELECT s.* FROM subscriptions s WHERE s.user_id = $1 ORDER BY s.updated_at DESC LIMIT 1`,
      [userId],
    );
    sub = r.rows[0] ?? null;
  }

  const fullAccess = user.plan_tier === 'individual' || user.plan_tier === 'school';
  const maxLessonWeek = fullAccess ? null : 1;

  return {
    plan_tier: user.plan_tier,
    full_access: fullAccess,
    max_lesson_week: maxLessonWeek,
    organization_id: user.organization_id,
    subscription: sub
      ? {
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: sub.current_period_end,
          trial_end: sub.trial_end,
          stripe_price_id: sub.stripe_price_id,
        }
      : null,
  };
}

export async function getAiChatUsageForUtcDay(userId, usageDate) {
  const { rows } = await pool.query(
    `SELECT message_count FROM ai_chat_daily_usage WHERE user_id = $1 AND usage_date = $2`,
    [userId, usageDate],
  );
  return rows[0]?.message_count ?? 0;
}

export async function incrementAiChatUsage(userId, usageDate) {
  await pool.query(
    `
    INSERT INTO ai_chat_daily_usage (user_id, usage_date, message_count)
    VALUES ($1, $2, 1)
    ON CONFLICT (user_id, usage_date) DO UPDATE SET message_count = ai_chat_daily_usage.message_count + 1
    `,
    [userId, usageDate],
  );
}

/** Derive tier from Stripe price id; falls back to user's current tier if unknown. */
export async function resolveTierFromStripePrice(priceId, fallbackTier = 'free') {
  return tierForPriceId(priceId) ?? fallbackTier;
}

export async function getOrganizationForUser(userId) {
  const { rows } = await pool.query(
    `
    SELECT o.*, om.role AS my_role
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = $1
    LIMIT 1
    `,
    [userId],
  );
  return rows[0] ?? null;
}

export async function countOrganizationMembers(organizationId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM organization_members WHERE organization_id = $1`,
    [organizationId],
  );
  return rows[0]?.c ?? 0;
}
