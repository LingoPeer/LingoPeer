import express from 'express';
import { body } from 'express-validator';
import { postChat } from '../controllers/aiChatController.js';
import { handleValidationErrors } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aiLimiter } from '../middlewares/rateLimits.js';

const router = express.Router();

router.post(
  '/chat',
  aiLimiter,
  [
    body('message').isString().trim().notEmpty().isLength({ max: 4000 }),
    body('level').optional().isString().isLength({ max: 4 }),
    body('history').optional().isArray(),
  ],
  handleValidationErrors,
  asyncHandler(postChat),
);

export default router;
