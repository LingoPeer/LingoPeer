const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const ROADMAP_TOPICS = {
  A1: [
    'Daily routines and introductions',
    'Family, home, and basic descriptions',
    'Shopping and simple transactions',
    'Directions and transport basics',
    'Food, restaurants, and preferences',
    'Health and daily habits',
    'Simple plans and invitations',
    'Review and confidence practice',
  ],
  A2: [
    'Personal experiences and routines',
    'Travel plans and common situations',
    'Work and study communication',
    'Past events and storytelling',
    'Comparisons and choices',
    'Future plans and intentions',
    'Problem solving in daily life',
    'Review and applied communication',
  ],
  B1: [
    'Opinions and structured arguments',
    'Workplace communication essentials',
    'Narrative tenses and storytelling',
    'Academic and learning communication',
    'Requests, negotiation, and tone',
    'Media, trends, and discussion',
    'Presentations and speaking fluency',
    'Review and independent expression',
  ],
  B2: [
    'Advanced discussion and argumentation',
    'Professional writing and email tone',
    'Complex grammar in context',
    'Debate, persuasion, and clarity',
    'Cross-cultural communication',
    'Critical reading and summarizing',
    'Formal speaking and presentations',
    'Review and performance practice',
  ],
  C1: [
    'Nuanced opinions and precision',
    'Leadership and workplace influence',
    'Advanced writing styles',
    'Academic discourse and synthesis',
    'Complex listening and response',
    'Negotiation and diplomatic language',
    'Public speaking and rhetorical control',
    'Review and mastery integration',
  ],
  C2: [
    'Native-like flexibility and control',
    'Subtle style and register shifts',
    'High-level argument and critique',
    'Expert writing and editorial refinement',
    'Advanced discourse management',
    'Specialized domain communication',
    'Performance-level speaking precision',
    'Review and full proficiency mastery',
  ],
};

const COMMON_GRAMMAR = {
  A1: ['Present simple', 'Articles', 'Pronouns', 'Basic prepositions', 'Can/cannot'],
  A2: ['Past simple', 'Comparatives', 'Future with going to', 'Present continuous', 'Countable/uncountable'],
  B1: ['Present perfect', 'Conditionals (0/1)', 'Relative clauses', 'Reported speech basics', 'Modals for advice'],
  B2: ['Conditionals (2/3)', 'Passive voice', 'Complex clauses', 'Advanced modals', 'Inversion basics'],
  C1: ['Discourse markers', 'Nominalization', 'Cleft sentences', 'Hedging language', 'Advanced conditionals'],
  C2: ['Register control', 'Stylistic inversion', 'Ellipsis/substitution', 'Rhetorical structures', 'Precision grammar'],
};

function levelOrDefault(level) {
  return LEVELS.includes(level) ? level : 'A1';
}

function lessonKindFromTitle(title) {
  const s = String(title || '').toLowerCase();
  if (s.startsWith('grammar drills')) return 'grammar';
  if (s.startsWith('speaking + vocabulary')) return 'speaking';
  return 'reading';
}

function lessonSubjectFromTitle(title, fallback) {
  const raw = String(title || '');
  const parts = raw.split(':');
  if (parts.length > 1) return parts.slice(1).join(':').trim() || fallback;
  return fallback;
}

const GRAMMAR_PROFILES = {
  'Present simple': {
    explanation: [
      'The present simple is used for routines, habits, facts, and things that are generally true.',
      "For most verbs, use the base form. With he, she, and it, add '-s' or '-es' to the verb.",
      'Common time markers include every day, usually, often, sometimes, and always.',
    ],
    examples: [
      ['She walks to work every morning.', 'walks', "We add '-s' because the subject is 'she'."],
      ['They usually study after dinner.', 'usually study', 'This sentence describes a regular habit.'],
      ['Water boils at 100 degrees Celsius.', 'boils', 'The present simple is also used for facts.'],
    ],
    exercises: [
      {
        prompt: 'Choose the correct sentence.',
        options: ['He go to school every day.', 'He goes to school every day.', 'He going to school every day.', 'He gone to school every day.'],
        correctIndex: 1,
      },
      {
        prompt: 'Which option completes the sentence correctly? "My parents ___ in Cape Town."',
        options: ['lives', 'living', 'live', 'has lived'],
        correctIndex: 2,
      },
      {
        prompt: 'Which sentence expresses a general truth?',
        options: ['I am watching TV now.', 'The sun rises in the east.', 'She was cooking dinner.', 'They will travel tomorrow.'],
        correctIndex: 1,
      },
    ],
  },
  'Present continuous': {
    explanation: [
      'The present continuous is used for actions happening now or around the present time.',
      "It is formed with the verb 'be' plus the main verb ending in '-ing'.",
      'It can also describe temporary situations or changing conditions.',
    ],
    examples: [
      ['I am reading an article right now.', 'am reading', 'This action is happening at the moment of speaking.'],
      ['They are staying with friends this week.', 'are staying', 'This shows a temporary arrangement.'],
      ['The weather is getting colder.', 'is getting', 'The present continuous can describe change over time.'],
    ],
    exercises: [
      {
        prompt: 'Choose the correct sentence.',
        options: ['She study now.', 'She is studying now.', 'She studies now.', 'She studied now.'],
        correctIndex: 1,
      },
      {
        prompt: 'Complete the sentence: "We ___ for the bus at the moment."',
        options: ['wait', 'waited', 'are waiting', 'have waited'],
        correctIndex: 2,
      },
      {
        prompt: 'Which sentence describes a temporary situation?',
        options: ['He works in a bank.', 'She is living with her aunt this month.', 'Birds fly.', 'Water freezes at 0°C.'],
        correctIndex: 1,
      },
    ],
  },
  'Past simple': {
    explanation: [
      'The past simple is used for actions that started and finished at a definite time in the past.',
      "Regular verbs usually end in '-ed', while irregular verbs change form completely.",
      'Common time markers include yesterday, last week, in 2022, and two days ago.',
    ],
    examples: [
      ['We visited the museum last Saturday.', 'visited', 'The action was completed in the past.'],
      ['She went home early.', 'went', 'This is an irregular past simple form.'],
      ["They didn't enjoy the film.", "didn't enjoy", 'Negatives use did not + base verb.'],
    ],
    exercises: [
      {
        prompt: 'Choose the correct sentence.',
        options: ['I goed to the market.', 'I went to the market.', 'I go to the market yesterday.', 'I going to the market.'],
        correctIndex: 1,
      },
      {
        prompt: 'Which word completes the sentence? "She ___ her homework before dinner."',
        options: ['finish', 'finishes', 'finished', 'is finishing'],
        correctIndex: 2,
      },
      {
        prompt: 'Which sentence is negative in the past simple?',
        options: ["He didn't call me.", 'He not called me.', "He doesn't called me.", 'He was not call me.'],
        correctIndex: 0,
      },
    ],
  },
  Comparatives: {
    explanation: [
      'Comparative adjectives are used to compare two people, things, or situations.',
      "Short adjectives usually take '-er' and are followed by 'than' (faster than, smaller than).",
      "Long adjectives usually use 'more' before the adjective (more interesting, more expensive). Irregular forms include better, worse, and farther/further.",
    ],
    examples: [
      ['My new laptop is faster than my old one.', 'faster than', "Short adjectives often take '-er' in the comparative form."],
      ['This gold watch is more expensive than the silver one.', 'more expensive than', "For longer adjectives, use 'more' instead of adding '-er'."],
      ['The city is much noisier than the countryside.', 'noisier than', "For adjectives ending in 'y', change 'y' to 'i' and add '-er'."],
    ],
    exercises: [
      {
        prompt: 'The blue suitcase is ___ than the red one.',
        options: ['heavyer', 'more heavy', 'heavier', 'most heavy'],
        correctIndex: 2,
      },
      {
        prompt: 'Choose the correct comparative sentence.',
        options: [
          'This book is interestinger than that one.',
          'This book is more interesting than that one.',
          'This book is most interesting than that one.',
          'This book is interesting than that one.',
        ],
        correctIndex: 1,
      },
      {
        prompt: 'Which sentence uses an irregular comparative correctly?',
        options: [
          'My results are gooder this term.',
          'Today is badder than yesterday.',
          'Her second essay is better than the first one.',
          'This route is more far than the other one.',
        ],
        correctIndex: 2,
      },
    ],
  },
  'Countable/uncountable': {
    explanation: [
      'Countable nouns can be counted individually: one apple, two apples, three apples.',
      'Uncountable nouns are treated as a mass and do not usually have a plural form: water, advice, information.',
      'Use many/few with countable nouns and much/little with uncountable nouns.',
    ],
    examples: [
      ['There are many books on the table.', 'many books', 'Books are countable, so we use many.'],
      ['We have little time left.', 'little time', 'Time is uncountable here, so we use little.'],
      ['She gave me some useful advice.', 'some useful advice', 'Advice is uncountable and does not take a plural form.'],
    ],
    exercises: [
      {
        prompt: 'Choose the correct sentence.',
        options: ['I need many information.', 'I need some information.', 'I need an information.', 'I need a few information.'],
        correctIndex: 1,
      },
      {
        prompt: 'Which option completes the sentence correctly? "There are ___ chairs in the room."',
        options: ['much', 'little', 'many', 'less'],
        correctIndex: 2,
      },
      {
        prompt: 'Which noun is usually uncountable?',
        options: ['apple', 'coin', 'advice', 'chair'],
        correctIndex: 2,
      },
    ],
  },
  'Future with going to': {
    explanation: [
      "We use 'going to' for future plans, intentions, and predictions based on present evidence.",
      "The structure is subject + be + going to + base verb.",
      "It is common when the speaker has already decided to do something.",
    ],
    examples: [
      ['I am going to study tonight.', 'am going to study', 'This expresses a plan or intention.'],
      ['They are going to move next month.', 'are going to move', 'The decision has already been made.'],
      ['Look at those clouds. It is going to rain.', 'is going to rain', 'This is a prediction based on evidence.'],
    ],
    exercises: [
      {
        prompt: 'Choose the correct sentence.',
        options: ['She going to travel tomorrow.', 'She is going travel tomorrow.', 'She is going to travel tomorrow.', 'She goes to travel tomorrow.'],
        correctIndex: 2,
      },
      {
        prompt: 'Which sentence shows a prediction based on evidence?',
        options: ['I think one day I will be famous.', 'We are going to visit grandma next week.', 'Look at that broken shelf. It is going to fall.', 'She studies every weekend.'],
        correctIndex: 2,
      },
      {
        prompt: 'Complete the sentence: "We ___ buy a new phone next month."',
        options: ['going to', 'are going to', 'is going to', 'will going to'],
        correctIndex: 1,
      },
    ],
  },
  'Present perfect': {
    explanation: [
      'The present perfect connects the past with the present.',
      "It is often used for life experiences, recent results, and actions that started in the past and continue now.",
      "The structure is subject + have/has + past participle. Common time markers include already, yet, ever, never, since, and for.",
    ],
    examples: [
      ['I have visited Nairobi twice.', 'have visited', 'This describes an experience at some time before now.'],
      ['She has already finished her report.', 'has already finished', 'The action is complete and relevant now.'],
      ['We have lived here for six years.', 'have lived', 'This action started in the past and still continues.'],
    ],
    exercises: [
      {
        prompt: 'Choose the correct sentence.',
        options: ['He have finished his homework.', 'He has finished his homework.', 'He has finish his homework.', 'He finished already his homework.'],
        correctIndex: 1,
      },
      {
        prompt: 'Which sentence shows a life experience?',
        options: ['I have eaten lunch at 1 pm yesterday.', 'I have never flown in a helicopter.', 'I am eating lunch now.', 'I ate lunch already.'],
        correctIndex: 1,
      },
      {
        prompt: 'Complete the sentence: "They ___ known each other for years."',
        options: ['has', 'have', 'having', 'had'],
        correctIndex: 1,
      },
    ],
  },
};

function findGrammarProfile(topic) {
  const raw = String(topic || '').trim();
  return GRAMMAR_PROFILES[raw] || null;
}

function buildReadingLesson({ level, focus, sessionTitle }) {
  return {
    title: sessionTitle,
    explanation:
      `This ${level} reading lesson focuses on ${focus}. ` +
      `You will practice identifying the main idea, understanding supporting detail, and noticing useful language in context.\n\n` +
      `As you read, try to notice how key words connect to the writer's purpose. Ask yourself what the writer wants the reader to understand, and which sentence carries the central message.\n\n` +
      `Strong readers do not translate every word. Instead, they use topic clues, sentence patterns, and repeated ideas to build meaning step by step.`,
    examples: [
      {
        sentence: `A short text about ${focus.toLowerCase()} usually contains one clear main idea and several supporting details.`,
        highlight: 'main idea',
        note: 'The main idea is the most important message in the text.',
      },
      {
        sentence: `When a writer repeats important vocabulary about ${focus.toLowerCase()}, it often signals the central topic.`,
        highlight: 'central topic',
        note: 'Repeated words often help you identify the focus of a paragraph.',
      },
      {
        sentence: 'A good reader checks the title, the first sentence, and the final sentence for clues.',
        highlight: 'for clues',
        note: 'These positions often contain useful summary information.',
      },
    ],
    exercises: [
      {
        type: 'mcq',
        prompt: `When reading a passage about ${focus.toLowerCase()}, what should you identify first?`,
        options: [
          'The main idea',
          'Every unknown word',
          'The longest sentence',
          'The writer’s full biography',
        ],
        correctIndex: 0,
      },
      {
        type: 'mcq',
        prompt: 'Which strategy helps you understand a text more efficiently?',
        options: [
          'Focus only on grammar mistakes',
          'Look for repeated ideas and key words',
          'Ignore the title completely',
          'Memorize every sentence in order',
        ],
        correctIndex: 1,
      },
      {
        type: 'mcq',
        prompt: 'What usually supports the main idea in a reading passage?',
        options: [
          'Random opinions',
          'Supporting details and examples',
          'Only difficult vocabulary',
          'A list of unrelated verbs',
        ],
        correctIndex: 1,
      },
    ],
  };
}

function buildSpeakingLesson({ level, focus, sessionTitle }) {
  return {
    title: sessionTitle,
    explanation:
      `This ${level} speaking and vocabulary lesson focuses on ${focus}. ` +
      `The goal is to help you express ideas more clearly, organize short responses, and use topic-based vocabulary naturally.\n\n` +
      `A strong spoken answer usually has three parts: introduce the idea, add a reason or example, and finish with a clear conclusion. This structure makes your speech easier to follow.\n\n` +
      `Instead of using the same basic words repeatedly, try to recycle useful phrases connected to ${focus.toLowerCase()} so your response sounds more precise and confident.`,
    examples: [
      {
        sentence: `When I talk about ${focus.toLowerCase()}, I try to give one clear opinion and one supporting example.`,
        highlight: 'one supporting example',
        note: 'Examples make your spoken response stronger and easier to understand.',
      },
      {
        sentence: 'Useful vocabulary becomes more natural when you repeat it in short speaking tasks.',
        highlight: 'more natural',
        note: 'Repeating phrases in context helps move them into active vocabulary.',
      },
      {
        sentence: 'A clear answer is usually better than a long but confusing answer.',
        highlight: 'clear answer',
        note: 'Clarity matters more than speaking for a long time without structure.',
      },
    ],
    exercises: [
      {
        type: 'mcq',
        prompt: 'What makes a spoken answer easier to follow?',
        options: [
          'Using one very long sentence',
          'Organizing the answer with a clear idea and example',
          'Changing topic in every sentence',
          'Avoiding topic vocabulary',
        ],
        correctIndex: 1,
      },
      {
        type: 'mcq',
        prompt: `Which phrase sounds most natural when discussing ${focus.toLowerCase()}?`,
        options: [
          'In my opinion, this is a useful approach.',
          'My opinion are this useful approach.',
          'In opinion me this approach useful.',
          'I opinion this approach very usefully.',
        ],
        correctIndex: 0,
      },
      {
        type: 'mcq',
        prompt: 'What is a good way to improve active vocabulary?',
        options: [
          'Use new words once and never review them',
          'Memorize only isolated words without context',
          'Practice key phrases in short speaking responses',
          'Avoid speaking until every word is perfect',
        ],
        correctIndex: 2,
      },
    ],
  };
}

export function getPredefinedRoadmapForLevel(level) {
  const safeLevel = levelOrDefault(level);
  const topics = ROADMAP_TOPICS[safeLevel];
  const grammar = COMMON_GRAMMAR[safeLevel];

  return {
    weekly_plan: topics.map((focus, i) => ({
      week: i + 1,
      focus,
      sessions: [
        `Reading: ${focus}`,
        `Grammar drills: ${grammar[i % grammar.length]}`,
        `Speaking + vocabulary: ${focus}`,
      ],
    })),
    grammar_topics: grammar,
    vocabulary_goals: [
      `${safeLevel} core collocations`,
      `${safeLevel} topic-based active vocabulary`,
      `${safeLevel} listening-to-speaking transfer`,
    ],
    practice_tasks: [
      'Write a short daily reflection',
      'Shadow and repeat a short audio',
      'Review incorrect answers and retry',
    ],
  };
}

function buildLessonContent({ level, weekIndex, sessionTitle, focus }) {
  const kind = lessonKindFromTitle(sessionTitle);
  const grammarTopic = lessonSubjectFromTitle(
    sessionTitle,
    COMMON_GRAMMAR[levelOrDefault(level)][
      (weekIndex - 1) % COMMON_GRAMMAR[levelOrDefault(level)].length
    ],
  );

  if (kind === 'grammar') {
    const profile = findGrammarProfile(grammarTopic);
    if (profile) {
      return {
        title: sessionTitle,
        explanation: profile.explanation.join('\n\n'),
        examples: profile.examples.map(([sentence, highlight, note]) => ({
          sentence,
          highlight,
          note,
        })),
        exercises: profile.exercises.map((exercise) => ({
          type: 'mcq',
          prompt: exercise.prompt,
          options: exercise.options,
          correctIndex: exercise.correctIndex,
        })),
      };
    }
  }

  if (kind === 'speaking') {
    return buildSpeakingLesson({ level, focus, sessionTitle });
  }

  return buildReadingLesson({ level, focus, sessionTitle });
}

function looksGenericContent(content) {
  const explanation = String(content?.explanation || '');
  const examples = Array.isArray(content?.examples) ? content.examples : [];
  const exercises = Array.isArray(content?.exercises) ? content.exercises : [];
  return (
    explanation.startsWith('This predefined') ||
    examples.length < 2 ||
    exercises.length < 2 ||
    exercises.some((ex) => Array.isArray(ex?.options) && ex.options.some((opt) => /^Option [A-D]$/i.test(String(opt))))
  );
}

export function normalizeLessonContentShape(content, context = {}) {
  const safe = content && typeof content === 'object' ? content : {};
  const examples = Array.isArray(safe.examples)
    ? safe.examples.map((ex) => ({
        sentence: String(
          ex?.sentence ??
          ex?.english ??
          ex?.text ??
          ''
        ),
        highlight: String(
          ex?.highlight ??
          ex?.highlighted ??
          ''
        ),
        note: String(
          ex?.note ??
          ex?.description ??
          ex?.translation ??
          ''
        ),
      })).filter((ex) => ex.sentence)
    : [];

  const exercises = Array.isArray(safe.exercises)
    ? safe.exercises.map((ex) => ({
        type: ex?.type === 'multiple_choice' ? 'mcq' : String(ex?.type || 'mcq'),
        prompt: String(ex?.prompt ?? ex?.question ?? ''),
        options: Array.isArray(ex?.options) ? ex.options.map(String) : [],
        correctIndex: Number.isFinite(Number(ex?.correctIndex)) ? Number(ex.correctIndex) : 0,
      })).filter((ex) => ex.type === 'mcq' && ex.prompt && ex.options.length > 0)
    : [];

  return {
    ...safe,
    title: String(safe.title || ''),
    explanation: String(safe.explanation || ''),
    examples,
    exercises,
  };

  if (looksGenericContent(normalized)) {
    return buildLessonContent({
      level: levelOrDefault(context.level || 'A1'),
      weekIndex: Number(context.weekIndex) || 1,
      sessionTitle: String(context.title || normalized.title || `Lesson ${context.weekIndex || 1}`),
      focus: String(context.focus || lessonSubjectFromTitle(context.title || normalized.title || '', `week ${context.weekIndex || 1}`)),
    });
  }

  return normalized;
}

export function buildPredefinedLessonsForRoadmap(level, roadmapContent) {
  const safeLevel = levelOrDefault(level);
  const plan = Array.isArray(roadmapContent?.weekly_plan) ? roadmapContent.weekly_plan : [];
  const lessons = [];

  for (const week of plan) {
    const weekIndex = Number(week.week) || 1;
    const focus = String(week.focus || `${safeLevel} focus week ${weekIndex}`);
    const sessions = Array.isArray(week.sessions) && week.sessions.length
      ? week.sessions
      : [`Reading: ${focus}`, 'Grammar drills', `Speaking + vocabulary: ${focus}`];

    sessions.forEach((sessionTitle, idx) => {
      const title = String(sessionTitle || `${safeLevel} Practice ${idx + 1}`);
      lessons.push({
        weekIndex,
        sortIndex: idx,
        title,
        content: buildLessonContent({
          level: safeLevel,
          weekIndex,
          sessionTitle: title,
          focus,
        }),
      });
    });
  }

  return lessons;
}
