import Stripe from 'stripe';

let _stripe;

export function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export function getStripeWebhookSecret() {
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return s;
}
