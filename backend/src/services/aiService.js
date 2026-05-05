/**
 * Facade for AI features (Gemini implementation lives in openaiService.js for import stability).
 */
export {
  generatePlacementExam,
  evaluatePlacementWithAI,
  generateRoadmapAI,
  generateLessonAI,
} from './openaiService.js';
