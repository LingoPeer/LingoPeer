import express from 'express';
import multer from 'multer';
import { getMyProfile } from '../controllers/profileController.js';
import { uploadAvatar, getPublicUser } from '../controllers/profileUpdateController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/profile', asyncHandler(getMyProfile));
router.post('/avatar', upload.single('avatar'), asyncHandler(uploadAvatar));
router.get('/users/:id', asyncHandler(getPublicUser));

export default router;
