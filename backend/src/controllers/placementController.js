import { findExamByIdForUser, markExamCompleted } from '../models/Exam.js';
import { insertExamAnswer } from '../models/ExamAnswer.js';
import { insertUserLevel } from '../models/UserLevel.js';
import { insertRoadmap } from '../models/Roadmap.js';
import { insertLesson } from '../models/Lesson.js';
import { withTransaction } from '../db/transaction.js';
import { AppError } from '../utils/AppError.js';
import { inferCefrFromPercent } from '../utils/geminiQuotaFallback.js';
import { logger } from '../utils/logger.js';
import {
  getPredefinedRoadmapForLevel,
  buildPredefinedLessonsForRoadmap,
} from '../data/predefinedRoadmaps.js';

function objectivePercent(questions, answers) {
  const byId = new Map(
    answers.map((a) => [String(a.questionId), Number(a.selectedIndex)]),
  );
  if (!questions.length) return 0;
  let correct = 0;
  for (const q of questions) {
    if (byId.get(String(q.id)) === q.correctIndex) correct += 1;
  }
  return (correct / questions.length) * 100;
}

function objectiveCounts(questions, answers) {
  const byId = new Map(
    answers.map((a) => [String(a.questionId), Number(a.selectedIndex)]),
  );
  const total = Array.isArray(questions) ? questions.length : 0;
  if (!total) return { correct: 0, total: 0 };
  let correct = 0;
  for (const q of questions) {
    if (byId.get(String(q.id)) === q.correctIndex) correct += 1;
  }
  return { correct, total };
}

function nowMs() {
  return Date.now();
}

function elapsed(startMs) {
  return Date.now() - startMs;
}

/**
 * POST /api/placement/submit
 * Body: { examId, answers: [{ questionId, selectedIndex }] }
 */
export const submitPlacement = async (req, res) => {
  const requestStartMs = nowMs();
  const userId = req.user.id;
  const { examId, answers } = req.body;
  logger.info('placement.request_received', { userId, examId });

  if (!examId || !Array.isArray(answers)) {
    throw new AppError('examId and answers[] are required', 400, 'VALIDATION');
  }

  const exam = await findExamByIdForUser(examId, userId);
  if (!exam) {
    throw new AppError('Exam not found', 404, 'NOT_FOUND');
  }
  if (exam.status !== 'pending') {
    throw new AppError('This exam was already submitted', 409, 'CONFLICT');
  }

  const questions = Array.isArray(exam.questions) ? exam.questions : [];
  const objPct = objectivePercent(questions, answers);
  const counts = objectiveCounts(questions, answers);
  const objectiveScorePercent = Math.round(objPct * 100) / 100;
  const baselineLevel = inferCefrFromPercent(objPct);
  logger.info('placement.scoring_completed', {
    userId,
    examId,
    correct: counts.correct,
    total: counts.total,
    objective_percent: objectiveScorePercent,
    baselineLevel,
    elapsedMs: elapsed(requestStartMs),
  });

  const enrichedAnswers = answers.map((a) => {
    const q = questions.find((x) => String(x.id) === String(a.questionId));
    return {
      questionId: a.questionId,
      selectedIndex: a.selectedIndex,
      correct:
        q != null ? Number(a.selectedIndex) === q.correctIndex : null,
    };
  });

  let roadmapRow;
  const roadmapContent = getPredefinedRoadmapForLevel(baselineLevel);
  let lessonsCreated = 0;
  await withTransaction(async (client) => {
    await insertExamAnswer(
      {
        examId,
        userId,
        answers: enrichedAnswers,
        rawScore: objPct,
      },
      client,
    );
    await insertUserLevel(
      {
        userId,
        examId,
        level: baselineLevel,
        weakAreas: [],
        aiSummary: null,
      },
      client,
    );
    await markExamCompleted(examId, client);
    roadmapRow = await insertRoadmap(
      {
        userId,
        level: baselineLevel,
        content: roadmapContent,
      },
      client,
    );

    const predefinedLessons = buildPredefinedLessonsForRoadmap(
      baselineLevel,
      roadmapContent,
    );
    for (const lesson of predefinedLessons) {
      await insertLesson(
        {
          userId,
          roadmapId: roadmapRow.id,
          weekIndex: lesson.weekIndex,
          sortIndex: lesson.sortIndex,
          title: lesson.title,
          content: lesson.content,
        },
        client,
      );
      lessonsCreated += 1;
    }
  });
  logger.info('placement.database_save_completed', {
    userId,
    examId,
    lessonsCreated,
    elapsedMs: elapsed(requestStartMs),
  });

  res.json({
    success: true,
    level: baselineLevel,
    summary: 'Score calculated. Predefined roadmap and lessons loaded.',
    scores: {
      correct: counts.correct,
      total: counts.total,
      objective_percent: objectiveScorePercent,
    },
    roadmap: {
      id: roadmapRow.id,
      level: roadmapRow.level,
      content: roadmapRow.content,
      created_at: roadmapRow.created_at,
      source: 'predefined',
    },
    lessonsStatus: 'ready',
    aiFeedbackStatus: 'optional',
    lessonsCount: lessonsCreated,
  });
  logger.info('placement.response_sent', { userId, examId, elapsedMs: elapsed(requestStartMs) });
};
