import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getMyOrganization } from '../controllers/orgController.js';

const router = express.Router();

router.get('/', asyncHandler(getMyOrganization));

export default router;
