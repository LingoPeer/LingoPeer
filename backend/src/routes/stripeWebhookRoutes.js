import express from 'express';
import { getStripe, getStripeWebhookSecret } from '../config/stripe.js';
import { processStripeWebhookEvent } from '../services/stripeWebhookService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, getStripeWebhookSecret());
  } catch (err) {
    return res.status(400).send(`Webhook signature: ${String(err.message)}`);
  }
  try {
    await processStripeWebhookEvent(event);
  } catch (err) {
    logger.error('Stripe webhook handler failed', { message: err.message });
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
  res.json({ received: true });
});

export default router;
