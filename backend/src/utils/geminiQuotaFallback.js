/** Shared helpers for offline / quota fallback when Gemini returns 429. */

export function geminiQuotaFallbackEnabled() {
  const v = process.env.GEMINI_QUOTA_FALLBACK;
  if (v === 'false' || v === '0') return false;
  return true;
}

export function isGeminiQuotaOrRateLimitError(err) {
  const m = String(err?.message || '');
  return (
    m.includes('429') ||
    m.includes('quota') ||
    m.includes('Quota exceeded') ||
    m.includes('exceeded your current quota') ||
    m.includes('Too Many Requests') ||
    m.includes('RESOURCE_EXHAUSTED') ||
    m.includes('QuotaFailure')
  );
}

/** Short message for API clients (avoid dumping raw Google JSON). */
export function friendlyGeminiQuotaMessage() {
  return (
    'Google Gemini rate limit or free-tier quota was reached (often ~20 requests per minute). ' +
    'Wait 1–2 minutes and try again. Tip: set GEMINI_MODEL to a stable model like gemini-2.0-flash, ' +
    'reduce AUTO_LESSONS_PER_WEEK, or add spacing with AUTO_LESSON_GENERATE_DELAY_MS.'
  );
}

export function inferCefrFromPercent(pct) {
  const p = Number(pct) || 0;
  if (p < 25) return 'A1';
  if (p < 45) return 'A2';
  if (p < 65) return 'B1';
  if (p < 85) return 'B2';
  if (p < 97) return 'C1';
  return 'C2';
}

export function getMinimalRoadmap(level) {
  return {
    weekly_plan: Array.from({ length: 8 }, (_, i) => ({
      week: i + 1,
      focus: `${level} — core skills (week ${i + 1})`,
      sessions: ['Reading 20 min', 'Grammar drills', 'Vocabulary + speaking'],
    })),
    grammar_topics: ['Verb tenses', 'Articles', 'Conditionals', 'Modals', 'Prepositions'],
    vocabulary_goals: ['Core verbs', 'Collocations', 'Everyday phrases'],
    practice_tasks: ['Journal 5 sentences', 'Listen & repeat', 'Review weak answers'],
  };
}
