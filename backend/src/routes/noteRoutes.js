import express from 'express';
import { body } from 'express-validator';
import {
  listNotes,
  postNote,
  getNote,
  patchNote,
  removeNote,
} from '../controllers/noteController.js';
import { handleValidationErrors } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', asyncHandler(listNotes));

router.post(
  '/',
  [
    body('title').optional().isString().isLength({ max: 500 }),
    body('body').optional().isString(),
  ],
  handleValidationErrors,
  asyncHandler(postNote),
);

router.get('/:noteId', asyncHandler(getNote));

router.patch(
  '/:noteId',
  [
    body('title').optional().isString().isLength({ max: 500 }),
    body('body').optional().isString(),
  ],
  handleValidationErrors,
  asyncHandler(patchNote),
);

router.delete('/:noteId', asyncHandler(removeNote));

export default router;
