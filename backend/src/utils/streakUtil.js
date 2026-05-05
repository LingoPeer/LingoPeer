/**
 * Streak from distinct UTC calendar days (YYYY-MM-DD), newest first.
 * Counts consecutive days ending today or yesterday (standard learning-app behavior).
 */
export function formatUtcDateString(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addUtcDays(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + delta * 86400000;
  return formatUtcDateString(new Date(t));
}

/** @param {string[]} descDateStrings unique YYYY-MM-DD, descending */
export function computeStreakFromUtcDates(descDateStrings) {
  if (!descDateStrings?.length) {
    return { streak_days: 0, last_activity_date: null };
  }
  const sorted = [...new Set(descDateStrings)].sort((a, b) => b.localeCompare(a));
  const head = sorted[0];
  const today = formatUtcDateString(new Date());
  const yesterday = addUtcDays(today, -1);
  if (head !== today && head !== yesterday) {
    return { streak_days: 0, last_activity_date: head };
  }
  let streak = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const expected = addUtcDays(sorted[i - 1], -1);
    if (sorted[i] === expected) streak += 1;
    else break;
  }
  return { streak_days: streak, last_activity_date: head };
}

export function pgDateToUtcString(pgVal) {
  if (pgVal == null) return null;
  if (typeof pgVal === 'string') return pgVal.slice(0, 10);
  if (pgVal instanceof Date) return formatUtcDateString(pgVal);
  return String(pgVal).slice(0, 10);
}
