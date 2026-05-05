import express from 'express';
import { body, query } from 'express-validator';
import { generateLesson, listLessons, getLesson } from '../controllers/lessonController.js';
import { handleValidationErrors } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aiLimiter } from '../middlewares/rateLimits.js';

const router = express.Router();

router.post(
  '/generate',
  aiLimiter,
  [
    query('weekIndex').optional().isInt({ min: 1, max: 52 }),
    body('weekIndex').optional().isInt({ min: 1, max: 52 }),
  ],
  handleValidationErrors,
  asyncHandler(generateLesson),
);

router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  handleValidationErrors,
  asyncHandler(listLessons),
);

router.get('/:lessonId', asyncHandler(getLesson));

export default router;
