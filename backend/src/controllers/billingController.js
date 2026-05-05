import { getStripe } from '../config/stripe.js';
import { AppError } from '../utils/AppError.js';
import { getBillingSummaryForUser, getUserPlanRow } from '../models/Billing.js';
import pool from '../config/db.js';
import { getAllowedCheckoutPriceIds, assertPriceAllowed, getSchoolPriceIds } from '../utils/billingPrices.js';

function frontendBaseUrl() {
  return (process.env.FRONTEND_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
}

export const getPlans = async (req, res) => {
  res.json({
    success: true,
    plans: [
      {
        id: 'free',
        name: 'Free',
        price_monthly_cents: 0,
        features: ['Week 1 lessons only', 'Basic placement', 'Limited AI tutor (daily cap)'],
      },
      {
        id: 'individual',
        name: 'Individual',
        stripe_price_monthly: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY || null,
        stripe_price_yearly: process.env.STRIPE_PRICE_INDIVIDUAL_YEARLY || null,
        trial_days: parseInt(process.env.STRIPE_TRIAL_DAYS || '0', 10) || 0,
        features: ['Full lesson library', 'AI roadmap & generated lessons', 'Progress & analytics'],
      },
      {
        id: 'school',
        name: 'School / Organization',
        stripe_price_seat_monthly: process.env.STRIPE_PRICE_SCHOOL_SEAT_MONTHLY || null,
        stripe_price_seat_yearly: process.env.STRIPE_PRICE_SCHOOL_SEAT_YEARLY || null,
        min_seats: parseInt(process.env.SCHOOL_CHECKOUT_MIN_SEATS || '1', 10) || 1,
        features: ['Per-seat billing', 'Org admin (MVP: purchaser)', 'Group analytics (coming soon)'],
      },
    ],
    checkout_configured: getAllowedCheckoutPriceIds().length > 0,
  });
};

export const getMyBilling = async (req, res) => {
  const summary = await getBillingSummaryForUser(req.user.id);
  res.json({ success: true, billing: summary });
};

export const createCheckoutSession = async (req, res) => {
  const userId = req.user.id;
  const { priceId, flow = 'individual', orgName, quantity } = req.body ?? {};

  if (!priceId || typeof priceId !== 'string') {
    throw new AppError('priceId is required', 400, 'VALIDATION');
  }
  try {
    assertPriceAllowed(priceId);
  } catch (e) {
    throw new AppError(e.message || 'Invalid price', 400, 'BILLING_CONFIG');
  }

  const isSchoolPrice = getSchoolPriceIds().includes(priceId);
  if (flow === 'school' && !isSchoolPrice) {
    throw new AppError('School checkout requires a school seat price id', 400, 'VALIDATION');
  }
  if (flow !== 'school' && isSchoolPrice) {
    throw new AppError('Use flow=school with school seat prices', 400, 'VALIDATION');
  }

  const stripe = getStripe();
  const userRow = await getUserPlanRow(userId);
  if (!userRow) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const base = frontendBaseUrl();
  const metadata = {
    user_id: String(userId),
    flow: flow === 'school' ? 'school' : 'individual',
  };
  if (flow === 'school') {
    metadata.org_name = String(orgName || 'My organization').slice(0, 255);
  }

  const qty =
    flow === 'school'
      ? Math.min(
          500,
          Math.max(
            parseInt(process.env.SCHOOL_CHECKOUT_MIN_SEATS || '1', 10) || 1,
            parseInt(quantity ?? '1', 10) || 1,
          ),
        )
      : 1;

  const sessionConfig = {
    mode: 'subscription',
    client_reference_id: String(userId),
    ...(flow === 'school' || !userRow.stripe_customer_id
      ? { customer_email: req.user.email }
      : { customer: userRow.stripe_customer_id }),
    line_items: [{ price: priceId, quantity: qty }],
    success_url: `${base}/billing?checkout=success`,
    cancel_url: `${base}/billing?checkout=cancel`,
    metadata,
    subscription_data: {
      metadata: {
        user_id: String(userId),
        flow: flow === 'school' ? 'school' : 'individual',
      },
    },
  };

  const trialDays = parseInt(process.env.STRIPE_TRIAL_DAYS || '0', 10);
  if (trialDays > 0 && flow !== 'school') {
    sessionConfig.subscription_data.trial_period_days = trialDays;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  if (!session.url) {
    throw new AppError('Stripe did not return a checkout URL', 502, 'STRIPE');
  }
  res.json({ success: true, url: session.url });
};

export const createPortalSession = async (req, res) => {
  const userId = req.user.id;
  const userRow = await getUserPlanRow(userId);
  if (!userRow) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  let customerId = userRow.stripe_customer_id;
  if (userRow.organization_id && userRow.plan_tier === 'school') {
    const { rows } = await pool.query(
      `SELECT stripe_customer_id FROM organizations WHERE id = $1`,
      [userRow.organization_id],
    );
    customerId = rows[0]?.stripe_customer_id || customerId;
  }

  if (!customerId) {
    throw new AppError('No Stripe customer on file. Subscribe once from the billing page first.', 400, 'NO_CUSTOMER');
  }

  const stripe = getStripe();
  const base = frontendBaseUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${base}/billing`,
  });
  res.json({ success: true, url: session.url });
};
