import { getLatestRoadmap } from '../models/Roadmap.js';
import {
  insertLesson,
  listLessonsForUser,
  getLessonForUser,
  countLessonsForUserWeek,
} from '../models/Lesson.js';
import { getLatestUserLevel } from '../models/UserLevel.js';
import { AppError } from '../utils/AppError.js';
import {
  buildPredefinedLessonsForRoadmap,
  getPredefinedRoadmapForLevel,
  normalizeLessonContentShape,
} from '../data/predefinedRoadmaps.js';

/**
 * POST /api/lessons/generate
 * Query: weekIndex (default 1)
 */
export const generateLesson = async (req, res) => {
  const userId = req.user.id;
  const weekIndex = Math.max(1, parseInt(req.query.weekIndex ?? req.body.weekIndex ?? '1', 10) || 1);

  const roadmap = await getLatestRoadmap(userId);
  if (!roadmap) {
    throw new AppError('Complete placement first to unlock lessons', 403, 'NO_ROADMAP');
  }

  const levelRow = await getLatestUserLevel(userId);
  const level = levelRow?.level || roadmap.level;
  const fallbackRoadmap = getPredefinedRoadmapForLevel(level);
  const sourceRoadmap = roadmap.content?.weekly_plan?.length ? roadmap.content : fallbackRoadmap;
  const predefined = buildPredefinedLessonsForRoadmap(level, sourceRoadmap)
    .filter((x) => x.weekIndex === weekIndex);

  const sortIndex = await countLessonsForUserWeek(userId, weekIndex);
  const lesson = predefined[sortIndex] || predefined[predefined.length - 1] || {
    weekIndex,
    sortIndex,
    title: `${level} Practice ${sortIndex + 1}`,
    content: {
      title: `${level} Practice ${sortIndex + 1}`,
      explanation: `Predefined extra practice for ${level}.`,
      examples: [],
      exercises: [],
    },
  };

  const row = await insertLesson({
    userId,
    roadmapId: roadmap.id,
    weekIndex: lesson.weekIndex,
    sortIndex: sortIndex,
    title: lesson.title,
    content: lesson.content,
  });

  res.status(201).json({
    success: true,
    lesson: {
      id: row.id,
      week_index: row.week_index,
      sort_index: row.sort_index,
      title: row.title,
      content: normalizeLessonContentShape(row.content, {
        level,
        weekIndex: row.week_index,
        title: row.title,
      }),
      created_at: row.created_at,
    },
  });
};

/**
 * GET /api/lessons
 */
export const listLessons = async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '50', 10) || 50));
  const offset = Math.max(0, parseInt(req.query.offset ?? '0', 10) || 0);
  const levelRow = await getLatestUserLevel(req.user.id);
  const currentLevel = levelRow?.level || 'A1';
  let rows = await listLessonsForUser(req.user.id, { limit, offset });

  // Backfill path for existing users: roadmap exists, but no lessons were generated yet.
  if (rows.length === 0) {
    const roadmap = await getLatestRoadmap(req.user.id);
    if (roadmap) {
      const level = currentLevel || roadmap.level;
      const fallbackRoadmap = getPredefinedRoadmapForLevel(level);
      const sourceRoadmap = roadmap.content?.weekly_plan?.length ? roadmap.content : fallbackRoadmap;
      const predefined = buildPredefinedLessonsForRoadmap(level, sourceRoadmap);
      for (const lesson of predefined) {
        await insertLesson({
          userId: req.user.id,
          roadmapId: roadmap.id,
          weekIndex: lesson.weekIndex,
          sortIndex: lesson.sortIndex,
          title: lesson.title,
          content: lesson.content,
        });
      }
      rows = await listLessonsForUser(req.user.id, { limit, offset });
    }
  }

  res.json({
    success: true,
    lessons: rows.map((row) => ({
      ...row,
      content: normalizeLessonContentShape(row.content, {
        level: currentLevel,
        weekIndex: row.week_index,
        title: row.title,
      }),
    })),
  });
};

/**
 * GET /api/lessons/:lessonId
 */
export const getLesson = async (req, res) => {
  const row = await getLessonForUser(req.params.lessonId, req.user.id);
  if (!row) {
    throw new AppError('Lesson not found', 404, 'NOT_FOUND');
  }
  const levelRow = await getLatestUserLevel(req.user.id);
  res.json({
    success: true,
    lesson: {
      ...row,
      content: normalizeLessonContentShape(row.content, {
        level: levelRow?.level || 'A1',
        weekIndex: row.week_index,
        title: row.title,
      }),
    },
  });
};
