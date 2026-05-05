import express from 'express';
import multer from 'multer';
import { query, body } from 'express-validator';
import {
  getCommunityMessages,
  uploadCommunityVoice,
} from '../controllers/communityController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { handleValidationErrors } from '../middlewares/validate.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

router.get(
  '/messages',
  [
    query('room').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  asyncHandler(getCommunityMessages),
);

router.post(
  '/voice',
  upload.single('audio'),
  [
    body('room').optional().isString(),
    body('duration').optional().isFloat({ min: 0, max: 3600 }),
  ],
  handleValidationErrors,
  asyncHandler(uploadCommunityVoice),
);

export default router;
