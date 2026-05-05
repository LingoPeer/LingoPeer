import express from 'express';
import { body } from 'express-validator';
import { recordProgress } from '../controllers/progressController.js';
import { handleValidationErrors } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post(
  '/',
  [
    body('lessonId').optional().isUUID(),
    body('score').optional().isFloat({ min: 0, max: 100 }),
    body('weakAreas').optional().isArray(),
    body('metadata').optional().isObject(),
  ],
  handleValidationErrors,
  asyncHandler(recordProgress),
);

export default router;
