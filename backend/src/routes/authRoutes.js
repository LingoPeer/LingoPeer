import express from 'express';
import { body } from 'express-validator';
import { loginUser, registerUser } from '../controllers/authController.js';
import { googleLogin } from '../controllers/googleAuthController.js';
import { handleValidationErrors } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aiLimiter } from '../middlewares/rateLimits.js';

const router = express.Router();

router.post(
  '/login',
  [
    body('password').trim().notEmpty().withMessage('Password is required'),
    body('email').optional().trim(),
    body('username').optional().trim(),
    body('identifier').optional().trim(),
  ],
  handleValidationErrors,
  (req, res, next) => {
    const { email, username, identifier } = req.body;
    if (!identifier && !email && !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, username, or identifier is required',
      });
    }
    next();
  },
  asyncHandler(loginUser),
);

router.post(
  '/register',
  aiLimiter,
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  handleValidationErrors,
  (req, res, next) => {
    const raw = req.body.fullName ?? req.body.name ?? req.body.username ?? '';
    if (!String(raw).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name (username) is required',
      });
    }
    next();
  },
  asyncHandler(registerUser),
);

router.post('/google', asyncHandler(googleLogin));

export default router;
