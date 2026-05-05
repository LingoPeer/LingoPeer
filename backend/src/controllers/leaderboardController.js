import {
  getStreaksForUserIds,
  getUserXpRank,
  listLeaderboardByXp,
} from '../models/LearningStats.js';

/**
 * GET /api/leaderboard?limit=50
 */
export const getLeaderboard = async (req, res) => {
  const raw = parseInt(req.query.limit ?? '50', 10);
  const limit = Number.isFinite(raw) ? raw : 50;
  const rows = await listLeaderboardByXp({ limit });
  const me = req.user.id;
  const ids = [...new Set([...rows.map((r) => r.id), me])];
  const streakMap = await getStreaksForUserIds(ids);

  const leaderboard = rows.map((r, i) => ({
    rank: i + 1,
    user_id: r.id,
    username: r.username,
    xp: r.total_xp,
    streak_days: streakMap.get(r.id) ?? 0,
    is_you: r.id === me,
  }));

  const you = await getUserXpRank(me);
  const streak_days = streakMap.get(me) ?? 0;

  res.json({
    success: true,
    leaderboard,
    you: {
      rank: you.rank,
      xp: you.xp,
      streak_days,
      total_users: you.total_users,
      in_top: leaderboard.some((e) => e.is_you),
    },
  });
};
