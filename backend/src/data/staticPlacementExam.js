/**
 * Offline placement items used when Gemini returns 429 / quota errors (see GEMINI_QUOTA_FALLBACK).
 */
const BASE = [
  {
    section: 'Reading & Grammar',
    prompt: 'Select the best option to complete the sentence.',
    sentence: 'If I ____ known you were coming, I would have baked a cake.',
    options: ['have', 'had', 'would have', 'am'],
    correctIndex: 1,
  },
  {
    section: 'Reading & Grammar',
    prompt: 'Choose the correct form.',
    sentence: 'She ____ to the gym every morning.',
    options: ['go', 'goes', 'going', 'gone'],
    correctIndex: 1,
  },
  {
    section: 'Vocabulary',
    prompt: 'Choose the closest meaning.',
    sentence: '“Huge” means ____.',
    options: ['tiny', 'angry', 'very big', 'careful'],
    correctIndex: 2,
  },
  {
    section: 'Reading & Grammar',
    prompt: 'Choose the correct option.',
    sentence: 'I have lived here ____ 2019.',
    options: ['for', 'since', 'during', 'until'],
    correctIndex: 1,
  },
  {
    section: 'Grammar',
    prompt: 'Choose the correct sentence.',
    sentence: '',
    options: [
      "He don't like coffee.",
      "He doesn’t likes coffee.",
      "He doesn’t like coffee.",
      "He not like coffee.",
    ],
    correctIndex: 2,
  },
  {
    section: 'Reading & Grammar',
    prompt: 'Choose the best option.',
    sentence: 'By the time we arrived, the movie ____.',
    options: ['started', 'has started', 'had started', 'starts'],
    correctIndex: 2,
  },
  {
    section: 'Vocabulary',
    prompt: 'Pick the best word.',
    sentence: 'This plan is ____; it could work very well.',
    options: ['promising', 'boring', 'noisy', 'furious'],
    correctIndex: 0,
  },
  {
    section: 'Grammar',
    prompt: 'Choose the best option.',
    sentence: 'If I ____ more time, I would learn another language.',
    options: ['have', 'had', 'will have', 'would have'],
    correctIndex: 1,
  },
  {
    section: 'Reading & Grammar',
    prompt: 'Choose the best option.',
    sentence: 'Not only ____ late, but he also forgot the documents.',
    options: ['he arrived', 'did he arrive', 'he did arrive', 'arrived he'],
    correctIndex: 1,
  },
  {
    section: 'Grammar',
    prompt: 'Choose the best option.',
    sentence: 'Hardly ____ when it started to rain.',
    options: ['we had left', 'had we left', 'we left', 'did we left'],
    correctIndex: 1,
  },
];

function targetCount() {
  const n = parseInt(process.env.AI_PLACEMENT_QUESTION_COUNT || '12', 10);
  return Number.isFinite(n) && n >= 6 && n <= 24 ? n : 12;
}

export function getStaticPlacementQuestions() {
  const n = targetCount();
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const src = BASE[i % BASE.length];
    out.push({
      ...src,
      id: `q${i + 1}`,
      options: [...src.options],
    });
  }
  return out;
}
