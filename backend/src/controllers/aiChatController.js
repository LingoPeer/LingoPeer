import { tutorChatReply } from '../services/openaiService.js';
import { AppError } from '../utils/AppError.js';
import {
  friendlyGeminiQuotaMessage,
  isGeminiQuotaOrRateLimitError,
} from '../utils/geminiQuotaFallback.js';

const MAX_MESSAGE = 4000;
const MAX_HISTORY = 40;

function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw.slice(-MAX_HISTORY)) {
    const role = item?.role;
    const content = String(item?.content ?? '').trim();
    if (!content || (role !== 'user' && role !== 'assistant')) continue;
    out.push({ role, content: content.slice(0, MAX_MESSAGE) });
  }
  return out;
}

/**
 * POST /api/ai/chat
 * body: { message, history?: { role, content }[], level?: string }
 */
export const postChat = async (req, res) => {
  const message = String(req.body?.message ?? '').trim();
  if (!message) {
    throw new AppError('Message is required', 400, 'VALIDATION');
  }
  if (message.length > MAX_MESSAGE) {
    throw new AppError(`Message too long (max ${MAX_MESSAGE} characters)`, 400, 'VALIDATION');
  }

  const history = normalizeHistory(req.body?.history);
  const level =
    typeof req.body?.level === 'string' && req.body.level.length <= 4
      ? req.body.level.toUpperCase()
      : undefined;

  try {
    const reply = await tutorChatReply({ userMessage: message, history, level });
    res.json({ success: true, reply });
  } catch (err) {
    if (isGeminiQuotaOrRateLimitError(err)) {
      throw new AppError(friendlyGeminiQuotaMessage(), 429, 'AI_QUOTA');
    }
    const raw = String(err?.message || '');
    if (raw.length > 400) {
      throw new AppError(
        'The AI service returned an error. Check GEMINI_API_KEY and GEMINI_MODEL in the server logs.',
        502,
        'AI_ERROR',
      );
    }
    throw err;
  }
};
