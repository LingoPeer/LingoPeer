import {
  createNote,
  listNotesForUser,
  getNoteForUser,
  updateNoteForUser,
  deleteNoteForUser,
} from '../models/Note.js';
import { AppError } from '../utils/AppError.js';

export const listNotes = async (req, res) => {
  const notes = await listNotesForUser(req.user.id);
  res.json({ success: true, notes });
};

export const postNote = async (req, res) => {
  const { title, body } = req.body;
  const note = await createNote({
    userId: req.user.id,
    title,
    body: body ?? '',
  });
  res.status(201).json({ success: true, note });
};

export const getNote = async (req, res) => {
  const note = await getNoteForUser(req.params.noteId, req.user.id);
  if (!note) {
    throw new AppError('Note not found', 404, 'NOT_FOUND');
  }
  res.json({ success: true, note });
};

export const patchNote = async (req, res) => {
  const { title, body } = req.body;
  const note = await updateNoteForUser(req.params.noteId, req.user.id, { title, body });
  if (!note) {
    throw new AppError('Note not found', 404, 'NOT_FOUND');
  }
  res.json({ success: true, note });
};

export const removeNote = async (req, res) => {
  const row = await deleteNoteForUser(req.params.noteId, req.user.id);
  if (!row) {
    throw new AppError('Note not found', 404, 'NOT_FOUND');
  }
  res.json({ success: true, message: 'Deleted' });
};
