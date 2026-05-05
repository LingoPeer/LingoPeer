/**
 * LLM-backed placement, evaluation, roadmap, and lessons (Google Gemini).
 * File name kept for stable imports across controllers.
 */
import { getGeminiClient, getGeminiModelName } from '../config/gemini.js';
import { parseJsonFromModel } from '../utils/parseJsonFromModel.js';
import { logger } from '../utils/logger.js';

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function placementQuestionCount() {
  const n = parseInt(process.env.AI_PLACEMENT_QUESTION_COUNT || '12', 10);
  return Number.isFinite(n) && n >= 6 && n <= 24 ? n : 12;
}

function isRetryableGeminiError(err) {
  const m = String(err?.message || '');
  return (
    m.includes('429') ||
    m.includes('Too Many Requests') ||
    m.includes('RESOURCE_EXHAUSTED') ||
    m.includes('Quota exceeded') ||
    m.includes('exceeded your current quota') ||
    m.includes('QuotaFailure')
  );
}

function parseRetryDelayMs(message) {
  const s = String(message);
  const m = s.match(/retry in ([\d.]+)\s*s/i);
  if (m) {
    return Math.min(120000, Math.max(2000, parseFloat(m[1], 10) * 1000));
  }
  const sec = s.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
  if (sec) {
    return Math.min(120000, Math.max(2000, parseInt(sec[1], 10) * 1000));
  }
  return null;
}

async function chatJsonOnce({ system, user, temperature }) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    systemInstruction: system,
    generationConfig: {
      temperature,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(user);
  const text = result.response.text();
  return parseJsonFromModel(text);
}

/**
 * Ask Gemini for strict JSON; retry a few times on rate limits.
 */
async function chatJson({ system, user, temperature = 0.35 }) {
  const maxAttempts = Math.min(5, Math.max(1, parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10)));
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await chatJsonOnce({ system, user, temperature });
    } catch (err) {
      lastErr = err;
      if (!isRetryableGeminiError(err) || attempt >= maxAttempts) {
        throw err;
      }
      const delay =
        parseRetryDelayMs(err.message) ?? Math.min(25000, 4000 * attempt);
      logger.warn(`Gemini rate limited; retry ${attempt}/${maxAttempts} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function chatTextOnce({ system, user, temperature = 0.55 }) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: getGeminiModelName(),
    systemInstruction: system,
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
    },
  });
  const result = await model.generateContent(user);
  const text = result.response.text();
  return typeof text === 'string' ? text.trim() : '';
}

/**
 * Plain-text Gemini completion with rate-limit retries.
 */
async function chatText({ system, user, temperature = 0.55 }) {
  const maxAttempts = Math.min(5, Math.max(1, parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10)));
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await chatTextOnce({ system, user, temperature });
    } catch (err) {
      lastErr = err;
      if (!isRetryableGeminiError(err) || attempt >= maxAttempts) {
        throw err;
      }
      const delay =
        parseRetryDelayMs(err.message) ?? Math.min(25000, 4000 * attempt);
      logger.warn(`Gemini rate limited (chat); retry ${attempt}/${maxAttempts} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/**
 * Conversational English tutor (plain text). `history` is prior turns excluding the latest user message.
 */
export async function tutorChatReply({ userMessage, history = [], level }) {
  const levelHint = level && CEFR.includes(level) ? level : 'not specified';
  const system = `You are a warm, patient English language tutor. Help with grammar, vocabulary, usage, writing, speaking tips, and learning strategies. Be concise unless the learner asks for depth. If the learner writes in another language, you may briefly bridge into English. Learner CEFR level (if known): ${levelHint}. Do not claim to grade official exams or replace a human teacher for high-stakes decisions.`;

  const safeHistory = Array.isArray(history) ? history.slice(-32) : [];
  const blocks = [];
  for (const m of safeHistory) {
    const role = m?.role;
    const content = String(m?.content ?? '').slice(0, 4000);
    if (!content) continue;
    if (role === 'user') blocks.push(`Learner:\n${content}`);
    else if (role === 'assistant') blocks.push(`Tutor:\n${content}`);
  }
  blocks.push(`Learner:\n${String(userMessage).slice(0, 4000)}`);
  const user = `${blocks.join('\n\n')}\n\nRespond as Tutor:`;

  try {
    const reply = await chatText({ system, user, temperature: 0.55 });
    if (!reply) {
      throw new Error('Empty model response');
    }
    return reply;
  } catch (err) {
    logger.error('tutorChatReply failed', { message: err.message });
    throw err;
  }
}

export async function generatePlacementExam() {
  const count = placementQuestionCount();
  const system = `You are an expert English language assessor. Output ONLY valid JSON.
Schema:
{
  "questions": [
    {
      "id": "q1",
      "section": "Grammar" | "Vocabulary" | "Reading",
      "prompt": "short instruction",
      "sentence": "optional context sentence or empty string",
      "options": ["exactly 4 distinct strings"],
      "correctIndex": 0-3
    }
  ]
}
Rules:
- Exactly ${count} questions.
- Mix difficulties from A1 through C1 (some easy, some hard).
- Each question must have exactly 4 options; correctIndex is 0-based.
- IDs must be unique strings like "q1","q2",...`;

  try {
    const data = await chatJson({
      system,
      user: `Create ${count} original multiple-choice items for an English placement test.`,
      temperature: 0.55,
    });
    const questions = Array.isArray(data.questions) ? data.questions : [];
    if (questions.length < 6) {
      throw new Error('Too few questions from model');
    }
    return questions.slice(0, count).map((q, i) => ({
      id: String(q.id || `q${i + 1}`),
      section: String(q.section || 'Grammar'),
      prompt: String(q.prompt || ''),
      sentence: q.sentence != null ? String(q.sentence) : '',
      options: Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [],
      correctIndex: Math.min(3, Math.max(0, parseInt(q.correctIndex, 10) || 0)),
    }));
  } catch (err) {
    logger.error('generatePlacementExam failed', { message: err.message });
    throw err;
  }
}

export async function evaluatePlacementWithAI({ questions, answers }) {
  const system = `You assess English proficiency. Output ONLY valid JSON:
{
  "level": one of ${JSON.stringify(CEFR)},
  "weak_areas": ["2-6 short strings, skill areas to improve"],
  "summary": "2-4 sentences of encouraging feedback",
  "score_percent": number 0-100 (approximate based on performance and question difficulty)
}
Be fair: use both objective correctness and overall patterns.`;

  const payload = { questions, answers };
  const user = `Evaluate this placement test:\n${JSON.stringify(payload)}`;

  const data = await chatJson({ system, user, temperature: 0.25 });
  const level = CEFR.includes(data.level) ? data.level : 'A2';
  const weak_areas = Array.isArray(data.weak_areas)
    ? data.weak_areas.map(String).slice(0, 8)
    : [];
  const summary = String(data.summary || '');
  const score_percent = Math.min(
    100,
    Math.max(0, Number(data.score_percent) || 0),
  );
  return { level, weak_areas, summary, score_percent };
}

export async function generateRoadmapAI({ level, weakAreas, username }) {
  const system = `You are an English curriculum designer. Output ONLY valid JSON:
{
  "weekly_plan": [
    { "week": 1, "focus": "string", "sessions": ["3-5 concrete session ideas"] }
  ],
  "grammar_topics": ["6-10 topics"],
  "vocabulary_goals": ["5-8 measurable goals"],
  "practice_tasks": ["6-10 short actionable tasks"]
}
Include 8 weeks in weekly_plan. Tailor to the learner level and weak areas.`;

  const user = `Learner display name: ${username || 'Student'}
CEFR level: ${level}
Weak areas: ${JSON.stringify(weakAreas || [])}`;

  const data = await chatJson({ system, user, temperature: 0.45 });
  return {
    weekly_plan: Array.isArray(data.weekly_plan) ? data.weekly_plan : [],
    grammar_topics: Array.isArray(data.grammar_topics) ? data.grammar_topics : [],
    vocabulary_goals: Array.isArray(data.vocabulary_goals) ? data.vocabulary_goals : [],
    practice_tasks: Array.isArray(data.practice_tasks) ? data.practice_tasks : [],
  };
}

export async function generateLessonAI({
  level,
  roadmapContent,
  weekIndex,
  lessonIndex,
  previousTitles = [],
}) {
  const system = `You create ESL lesson JSON. Output ONLY valid JSON:
{
  "title": "string",
  "explanation": "clear teaching text (can use \\n for paragraphs)",
  "examples": [ { "sentence": "string", "highlight": "optional phrase", "note": "why it matters" } ],
  "exercises": [
    {
      "type": "mcq",
      "prompt": "string",
      "options": ["4 strings"],
      "correctIndex": 0-3
    }
  ]
}
Include 3-5 examples and 4-6 exercises (mostly mcq). Do not repeat titles from previousTitles.`;

  const user = `Level: ${level}
Week number: ${weekIndex}
Lesson number this week: ${lessonIndex}
Already generated lesson titles to avoid: ${JSON.stringify(previousTitles)}
Roadmap context:\n${JSON.stringify(roadmapContent).slice(0, 12000)}`;

  const data = await chatJson({ system, user, temperature: 0.5 });
  return {
    title: String(data.title || `Week ${weekIndex} Lesson`),
    explanation: String(data.explanation || ''),
    examples: Array.isArray(data.examples) ? data.examples : [],
    exercises: Array.isArray(data.exercises) ? data.exercises : [],
  };
}
