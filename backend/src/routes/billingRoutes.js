import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getMyBilling,
  createCheckoutSession,
  createPortalSession,
} from '../controllers/billingController.js';

const router = express.Router();

router.get('/summary', asyncHandler(getMyBilling));
router.post('/checkout', asyncHandler(createCheckoutSession));
router.post('/portal', asyncHandler(createPortalSession));

export default router;
