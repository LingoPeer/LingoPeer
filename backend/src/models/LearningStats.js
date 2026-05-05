import pool from '../config/db.js';
import {
  computeStreakFromUtcDates,
  pgDateToUtcString,
} from '../utils/streakUtil.js';

const XP_LESSON_BASE = 100;
const XP_LESSON_SCORE_FACTOR = 0.8;
const XP_LESSON_SCORE_CAP = 80;
const XP_PER_NOTE = 12;
const XP_SEGMENT = 500;

/** Per-row XP contribution in SQL (progress table). */
const LESSON_XP_ROW = `
  CASE
    WHEN lesson_id IS NULL THEN 0
    ELSE ${XP_LESSON_BASE} + LEAST(${XP_LESSON_SCORE_CAP}, FLOOR(COALESCE(score, 0) * ${XP_LESSON_SCORE_FACTOR})::int)
  END
`;

const USER_TOTALS_CTE = `
  WITH lesson_xp AS (
    SELECT user_id, COALESCE(SUM(${LESSON_XP_ROW}), 0)::bigint AS xp
    FROM progress
    GROUP BY user_id
  ),
  note_xp AS (
    SELECT user_id, (COUNT(*) * ${XP_PER_NOTE})::bigint AS xp
    FROM notes
    GROUP BY user_id
  ),
  user_totals AS (
    SELECT
      u.id,
      u.username,
      (COALESCE(l.xp, 0) + COALESCE(n.xp, 0))::bigint AS total_xp
    FROM users u
    LEFT JOIN lesson_xp l ON l.user_id = u.id
    LEFT JOIN note_xp n ON n.user_id = u.id
  )
`;

export async function getUserXpBreakdown(userId) {
  const lessonSql = `
    SELECT COALESCE(SUM(${LESSON_XP_ROW}), 0)::bigint AS xp
    FROM progress
    WHERE user_id = $1;
  `;
  const notesSql = `SELECT COUNT(*)::int AS n FROM notes WHERE user_id = $1`;
  const [lr, nr] = await Promise.all([
    pool.query(lessonSql, [userId]),
    pool.query(notesSql, [userId]),
  ]);
  const lessonXp = Number(lr.rows[0]?.xp || 0);
  const noteCount = nr.rows[0]?.n ?? 0;
  const noteXp = noteCount * XP_PER_NOTE;
  return {
    lessonXp,
    noteXp,
    notesCount: noteCount,
    totalXp: lessonXp + noteXp,
  };
}

export async function listUserActivityUtcDates(userId) {
  const sql = `
    SELECT DISTINCT ((ts AT TIME ZONE 'UTC')::date) AS d
    FROM (
      SELECT created_at AS ts FROM progress WHERE user_id = $1 AND lesson_id IS NOT NULL
      UNION ALL
      SELECT updated_at AS ts FROM notes WHERE user_id = $1
    ) z
    ORDER BY d DESC;
  `;
  const { rows } = await pool.query(sql, [userId]);
  return rows.map((r) => pgDateToUtcString(r.d)).filter(Boolean);
}

export function xpMilestoneProgress(totalXp) {
  const t = Math.max(0, Number(totalXp) || 0);
  const nextMilestone =
    t === 0 ? XP_SEGMENT : Math.ceil((t + 1) / XP_SEGMENT) * XP_SEGMENT;
  const prevMilestone = nextMilestone - XP_SEGMENT;
  const inSegment = t - prevMilestone;
  const pct = Math.min(100, Math.round((inSegment / XP_SEGMENT) * 100));
  return {
    xp_next_milestone: nextMilestone,
    xp_progress_percent: pct,
    xp_in_current_segment: inSegment,
    xp_segment_size: XP_SEGMENT,
  };
}

export async function listLeaderboardByXp({ limit = 50 } = {}) {
  const cap = Math.min(200, Math.max(1, limit));
  const sql = `
    ${USER_TOTALS_CTE}
    SELECT id, username, total_xp
    FROM user_totals
    ORDER BY total_xp DESC, username ASC
    LIMIT $1;
  `;
  const { rows } = await pool.query(sql, [cap]);
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    total_xp: Number(r.total_xp),
  }));
}

export async function getUserXpRank(userId) {
  const sql = `
    ${USER_TOTALS_CTE},
    ranked AS (
      SELECT id, total_xp,
        ROW_NUMBER() OVER (ORDER BY total_xp DESC, username ASC)::int AS rank
      FROM user_totals
    )
    SELECT r.rank, r.total_xp AS xp,
      (SELECT COUNT(*)::int FROM user_totals) AS total_users
    FROM ranked r
    WHERE r.id = $1;
  `;
  const { rows } = await pool.query(sql, [userId]);
  const row = rows[0];
  if (!row) {
    return { rank: 1, total_users: 0, xp: 0 };
  }
  return {
    rank: Number(row.rank || 1),
    total_users: Number(row.total_users || 0),
    xp: Number(row.xp || 0),
  };
}

export async function getStreaksForUserIds(userIds) {
  if (!userIds.length) return new Map();
  const sql = `
    SELECT user_id, ((ts AT TIME ZONE 'UTC')::date) AS d
    FROM (
      SELECT user_id, created_at AS ts FROM progress
      WHERE lesson_id IS NOT NULL AND user_id = ANY($1::uuid[])
      UNION ALL
      SELECT user_id, updated_at AS ts FROM notes
      WHERE user_id = ANY($1::uuid[])
    ) z
    GROUP BY user_id, ((ts AT TIME ZONE 'UTC')::date)
    ORDER BY user_id, d DESC;
  `;
  const { rows } = await pool.query(sql, [userIds]);
  const byUser = new Map();
  for (const r of rows) {
    const uid = r.user_id;
    const ds = pgDateToUtcString(r.d);
    if (!ds) continue;
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid).push(ds);
  }
  const out = new Map();
  for (const [uid, dates] of byUser) {
    const uniqueDesc = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
    out.set(uid, computeStreakFromUtcDates(uniqueDesc).streak_days);
  }
  for (const uid of userIds) {
    if (!out.has(uid)) out.set(uid, 0);
  }
  return out;
}
