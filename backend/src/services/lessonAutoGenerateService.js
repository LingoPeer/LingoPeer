import { insertLesson } from '../models/Lesson.js';
import { generateLessonAI } from './openaiService.js';
import { logger } from '../utils/logger.js';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Pause between lesson generations to stay under Gemini free-tier requests/minute. */
function lessonGenerateSpacingMs() {
  const n = parseInt(process.env.AUTO_LESSON_GENERATE_DELAY_MS || '3500', 10);
  if (!Number.isFinite(n) || n < 0) return 3500;
  return Math.min(60000, n);
}

/**
 * How many roadmap weeks get AI lessons after placement (default 6, max = weekly_plan length).
 */
function weekCountToGenerate(roadmapContent) {
  const plan = roadmapContent?.weekly_plan;
  const maxFromRoadmap = Array.isArray(plan) && plan.length > 0 ? plan.length : 8;
  const envN = parseInt(process.env.AUTO_ROADMAP_LESSON_WEEKS || '6', 10);
  const n = Number.isFinite(envN) ? envN : 6;
  return Math.max(1, Math.min(maxFromRoadmap, Math.min(12, n)));
}

/**
 * How many distinct AI lessons to create per week (default 4). Increase for denser weeks (max 12).
 */
function lessonsPerWeekToGenerate() {
  const envN = parseInt(process.env.AUTO_LESSONS_PER_WEEK || '4', 10);
  const n = Number.isFinite(envN) ? envN : 4;
  return Math.max(1, Math.min(12, n));
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/**
 * Fallback lesson content when AI generation fails.
 */
function getFallbackLessonContent(level, weekIndex, lessonIndex) {
  return {
    title: `${level} Practice - Week ${weekIndex} #${lessonIndex}`,
    explanation: `This is a practice lesson for ${level} English. Focus on core grammar and vocabulary appropriate for your level.`,
    examples: [
      { english: 'I study English every day.', translation: 'I study English every day.' },
      { english: 'Practice makes progress.', translation: 'Practice makes progress.' },
    ],
    exercises: [
      {
        type: 'multiple_choice',
        question: `Choose the correct form for ${level} level.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        explanation: 'This is a fallback exercise.',
      },
    ],
  };
}

/**
 * After a roadmap is saved, generate multiple AI lessons per week (first N weeks) aligned with the roadmap.
 */
export async function generateInitialLessonsAfterRoadmap({
  userId,
  roadmapId,
  roadmapContent,
  level,
  options = {},
}) {
  const totalWeeks = weekCountToGenerate(roadmapContent);
  const startWeek = clampInt(options.startWeek, 1, totalWeeks, 1);
  const maxWeeks = clampInt(options.maxWeeks, 1, totalWeeks, totalWeeks);
  const finalWeek = Math.min(totalWeeks, startWeek + maxWeeks - 1);
  const perWeek = clampInt(options.perWeek, 1, 12, lessonsPerWeekToGenerate());
  const spacingMs =
    options.spacingMs == null ? lessonGenerateSpacingMs() : clampInt(options.spacingMs, 0, 60000, 0);
  const useFallbackOnly = options.useFallbackOnly === true;
  const previousTitles = [];
  const created = [];
  let firstLesson = true;

  for (let weekIndex = startWeek; weekIndex <= finalWeek; weekIndex += 1) {
    for (let sortIndex = 0; sortIndex < perWeek; sortIndex += 1) {
      if (!firstLesson) {
        await delay(spacingMs);
      }
      firstLesson = false;
      try {
        if (useFallbackOnly) {
          throw new Error('fallback_only_mode');
        }
        const lessonPayload = await generateLessonAI({
          level,
          roadmapContent,
          weekIndex,
          lessonIndex: sortIndex + 1,
          previousTitles,
        });
        const row = await insertLesson({
          userId,
          roadmapId,
          weekIndex,
          sortIndex,
          title: lessonPayload.title,
          content: lessonPayload,
        });
        previousTitles.push(lessonPayload.title);
        created.push(row);
      } catch (err) {
        logger.error(`Auto lesson AI failed, using fallback for week ${weekIndex} #${sortIndex + 1}`, {
          message: err.message,
        });
        try {
          const fallback = getFallbackLessonContent(level, weekIndex, sortIndex + 1);
          const row = await insertLesson({
            userId,
            roadmapId,
            weekIndex,
            sortIndex,
            title: fallback.title,
            content: fallback,
          });
          created.push(row);
        } catch (innerErr) {
          logger.error('Fallback lesson insertion also failed', { message: innerErr.message });
        }
      }
    }
  }

  return created;
}
