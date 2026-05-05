import express from 'express';
import { query } from 'express-validator';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { handleValidationErrors } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get(
  '/',
  [query('limit').optional().isInt({ min: 1, max: 200 })],
  handleValidationErrors,
  asyncHandler(getLeaderboard),
);

export default router;
