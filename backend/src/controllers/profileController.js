import { findUserById } from '../models/User.js';
import { getLatestUserLevel } from '../models/UserLevel.js';
import { getLatestRoadmap } from '../models/Roadmap.js';
import { listProgressForUser, aggregateProgressStats } from '../models/Progress.js';
import { listLessonsForUser } from '../models/Lesson.js';
import { countNotesForUser } from '../models/Note.js';
import {
  getUserXpBreakdown,
  listUserActivityUtcDates,
  xpMilestoneProgress,
} from '../models/LearningStats.js';
import { computeStreakFromUtcDates } from '../utils/streakUtil.js';
import { AppError } from '../utils/AppError.js';

/**
 * GET /api/me/profile — user snapshot, level, roadmap, progress & analytics.
 */
export const getMyProfile = async (req, res) => {
  const userId = req.user.id;
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const [level, roadmap, progressRows, stats, lessons, notesCount, xpBreakdown, activityDates] =
    await Promise.all([
      getLatestUserLevel(userId),
      getLatestRoadmap(userId),
      listProgressForUser(userId, { limit: 50 }),
      aggregateProgressStats(userId),
      listLessonsForUser(userId, { limit: 20 }),
      countNotesForUser(userId),
      getUserXpBreakdown(userId),
      listUserActivityUtcDates(userId),
    ]);

  const streak = computeStreakFromUtcDates(activityDates);
  const xpMeta = xpMilestoneProgress(xpBreakdown.totalXp);

  res.json({
    success: true,
    profile: {
      user: { ...user, avatar: user.avatar || null },
      level: level
        ? {
            cefr: level.level,
            weak_areas: level.weak_areas,
            summary: level.ai_summary,
            assessed_at: level.created_at,
          }
        : null,
      roadmap: roadmap
        ? { id: roadmap.id, level: roadmap.level, content: roadmap.content, created_at: roadmap.created_at }
        : null,
      analytics: {
        lessons_completed: stats?.lessons_completed ?? 0,
        average_score:
          stats?.avg_score != null ? Math.round(Number(stats.avg_score) * 100) / 100 : null,
        recent_progress: progressRows,
        notes_count: notesCount,
        xp_total: xpBreakdown.totalXp,
        xp_lesson: xpBreakdown.lessonXp,
        xp_notes: xpBreakdown.noteXp,
        xp_next_milestone: xpMeta.xp_next_milestone,
        xp_progress_percent: xpMeta.xp_progress_percent,
        xp_segment_size: xpMeta.xp_segment_size,
        streak_days: streak.streak_days,
        streak_last_activity_date: streak.last_activity_date,
      },
      lessons_preview: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        week_index: l.week_index,
        created_at: l.created_at,
      })),
    },
  });
};
