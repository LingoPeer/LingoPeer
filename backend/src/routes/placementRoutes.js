import express from 'express';
import { body } from 'express-validator';
import { submitPlacement } from '../controllers/placementController.js';
import { handleValidationErrors } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aiLimiter } from '../middlewares/rateLimits.js';

const router = express.Router();

router.post(
  '/submit',
  aiLimiter,
  [
    body('examId').isUUID().withMessage('Valid examId required'),
    body('answers').isArray({ min: 1 }).withMessage('answers array required'),
    body('answers.*.questionId').notEmpty(),
    body('answers.*.selectedIndex').isInt({ min: 0, max: 3 }),
  ],
  handleValidationErrors,
  asyncHandler(submitPlacement),
);

export default router;
