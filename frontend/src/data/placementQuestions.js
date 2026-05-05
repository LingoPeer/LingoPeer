export const placementQuestions = [
  {
    id: 'q1',
    section: 'Reading & Grammar',
    prompt: 'Select the best option to complete the sentence.',
    sentence: 'If I ____ known you were coming, I would have baked a cake.',
    options: ['have', 'had', 'would have', 'am'],
    correctIndex: 1,
    levelHint: 'B1',
  },
  {
    id: 'q2',
    section: 'Reading & Grammar',
    prompt: 'Choose the correct form.',
    sentence: 'She ____ to the gym every morning.',
    options: ['go', 'goes', 'going', 'gone'],
    correctIndex: 1,
    levelHint: 'A1',
  },
  {
    id: 'q3',
    section: 'Vocabulary',
    prompt: 'Choose the closest meaning.',
    sentence: '“Huge” means ____.',
    options: ['tiny', 'angry', 'very big', 'careful'],
    correctIndex: 2,
    levelHint: 'A1',
  },
  {
    id: 'q4',
    section: 'Reading & Grammar',
    prompt: 'Choose the correct option.',
    sentence: 'I have lived here ____ 2019.',
    options: ['for', 'since', 'during', 'until'],
    correctIndex: 1,
    levelHint: 'A2',
  },
  {
    id: 'q5',
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
    levelHint: 'A2',
  },
  {
    id: 'q6',
    section: 'Reading & Grammar',
    prompt: 'Choose the best option.',
    sentence: 'By the time we arrived, the movie ____.',
    options: ['started', 'has started', 'had started', 'starts'],
    correctIndex: 2,
    levelHint: 'B1',
  },
  {
    id: 'q7',
    section: 'Vocabulary',
    prompt: 'Pick the best word.',
    sentence: 'This plan is ____; it could work very well.',
    options: ['promising', 'boring', 'noisy', 'furious'],
    correctIndex: 0,
    levelHint: 'B1',
  },
  {
    id: 'q8',
    section: 'Grammar',
    prompt: 'Choose the best option.',
    sentence: 'If I ____ more time, I would learn another language.',
    options: ['have', 'had', 'will have', 'would have'],
    correctIndex: 1,
    levelHint: 'B1',
  },
  {
    id: 'q9',
    section: 'Reading & Grammar',
    prompt: 'Choose the best option.',
    sentence: 'Not only ____ late, but he also forgot the documents.',
    options: ['he arrived', 'did he arrive', 'he did arrive', 'arrived he'],
    correctIndex: 1,
    levelHint: 'B2',
  },
  {
    id: 'q10',
    section: 'Grammar',
    prompt: 'Choose the best option.',
    sentence: 'Hardly ____ when it started to rain.',
    options: ['we had left', 'had we left', 'we left', 'did we left'],
    correctIndex: 1,
    levelHint: 'B2',
  },
];

export function scoreToCefr(score, total) {
  const pct = total === 0 ? 0 : score / total;
  if (pct < 0.35) return 'A1';
  if (pct < 0.55) return 'A2';
  if (pct < 0.75) return 'B1';
  if (pct < 0.9) return 'B2';
  return 'C1';
}

