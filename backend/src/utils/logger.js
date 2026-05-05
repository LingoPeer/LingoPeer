/**
 * Lightweight structured logger (console-based; swap for Winston/Pino in prod).
 */
const level = process.env.LOG_LEVEL || 'info';

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = levels[level] ?? 2;

function log(lvl, msg, meta) {
  if (levels[lvl] > current) return;
  const line = meta !== undefined ? `${msg} ${JSON.stringify(meta)}` : msg;
  const fn = lvl === 'error' ? console.error : console.log;
  fn(`[${new Date().toISOString()}] [${lvl.toUpperCase()}] ${line}`);
}

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
