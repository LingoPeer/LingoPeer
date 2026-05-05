import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

let _genAI;
let _previewModelWarned = false;

/**
 * Google Gemini client (API key from GEMINI_API_KEY).
 */
export function getGeminiClient() {
  if (_genAI) return _genAI;
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    logger.error('GEMINI_API_KEY is not set');
    throw new Error('Gemini is not configured');
  }
  _genAI = new GoogleGenerativeAI(key);
  return _genAI;
}

export function getGeminiModelName() {
  const name = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  if (!_previewModelWarned && /preview/i.test(name)) {
    _previewModelWarned = true;
    logger.warn(
      'GEMINI_MODEL looks like a preview id; stable ids (e.g. gemini-2.0-flash) often behave better with quotas.',
    );
  }
  return name;
}
