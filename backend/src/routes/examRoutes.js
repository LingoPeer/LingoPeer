import express from 'express';
import { getCurrentExam } from '../controllers/examController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/current', asyncHandler(getCurrentExam));

export default router;
