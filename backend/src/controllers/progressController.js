import { insertProgress } from '../models/Progress.js';
import { getLessonForUser } from '../models/Lesson.js';
import { AppError } from '../utils/AppError.js';

/**
 * POST /api/progress
 * Body: { lessonId?, score?, weakAreas?, metadata? }
 */
export const recordProgress = async (req, res) => {
  const userId = req.user.id;
  const { lessonId, score, weakAreas, metadata } = req.body;

  if (lessonId) {
    const lesson = await getLessonForUser(lessonId, userId);
    if (!lesson) {
      throw new AppError('Lesson not found', 404, 'NOT_FOUND');
    }
  }

  const row = await insertProgress({
    userId,
    lessonId: lessonId || null,
    score,
    weakAreas,
    metadata,
  });

  res.status(201).json({ success: true, progress: row });
};
