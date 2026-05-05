import express from 'express';
import {
  sendPracticeRequest,
  listMyRequests,
  listIncomingPending,
  respondToRequest,
  cancelRequest,
} from '../controllers/practiceRequestController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/', asyncHandler(sendPracticeRequest));
router.get('/', asyncHandler(listMyRequests));
router.get('/incoming', asyncHandler(listIncomingPending));
router.patch('/:id/respond', asyncHandler(respondToRequest));
router.delete('/:id', asyncHandler(cancelRequest));

export default router;
