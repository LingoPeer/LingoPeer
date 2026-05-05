import { findPendingExamForUser } from '../models/Exam.js';
import { toPublicExamQuestions } from '../utils/examPublic.js';
import { AppError } from '../utils/AppError.js';

/**
 * GET /api/exams/current — pending placement exam for the authenticated user.
 */
export const getCurrentExam = async (req, res) => {
  const exam = await findPendingExamForUser(req.user.id);
  if (!exam) {
    throw new AppError('No pending placement exam', 404, 'NOT_FOUND');
  }

  res.json({
    success: true,
    exam: {
      id: exam.id,
      title: exam.title,
      status: exam.status,
      questions: toPublicExamQuestions(exam.questions),
      created_at: exam.created_at,
    },
  });
};
