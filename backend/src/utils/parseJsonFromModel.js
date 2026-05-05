/**
 * OpenAI sometimes wraps JSON in markdown fences; normalize to a plain object.
 */
export function parseJsonFromModel(raw) {
  if (raw == null) throw new Error('Empty model response');
  let text = String(raw).trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) text = fence[1].trim();
  return JSON.parse(text);
}
