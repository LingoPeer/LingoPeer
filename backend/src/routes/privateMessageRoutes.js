import express from 'express';
import multer from 'multer';
import {
  getPrivateMessages,
  sendPrivateText,
  sendPrivateVoice,
} from '../controllers/privateMessageController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.get('/:requestId/messages', asyncHandler(getPrivateMessages));
router.post('/:requestId/text', asyncHandler(sendPrivateText));
router.post('/:requestId/voice', upload.single('audio'), asyncHandler(sendPrivateVoice));

export default router;
