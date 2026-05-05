const LS_KEYS = {
  auth: 'lp_auth',
  progress: 'lp_progress',
};

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const defaultAuth = {
  isLoggedIn: false,
  token: null,
  user: null,
  profile: null,
  pendingExam: null,
  placementCompleted: false,
  level: null,
  firstLoginAt: null,
};

export function getAuthState() {
  const raw = readJson(LS_KEYS.auth, null);
  if (!raw || typeof raw !== 'object') {
    return { ...defaultAuth };
  }
  const merged = { ...defaultAuth, ...raw };
  merged.isLoggedIn = Boolean(merged.token);
  return merged;
}

export function setAuthState(next) {
  writeJson(LS_KEYS.auth, next);
}

export function getProgressState() {
  return readJson(LS_KEYS.progress, {
    unitTestsCompleted: {},
  });
}

export function setProgressState(next) {
  writeJson(LS_KEYS.progress, next);
}

export { LS_KEYS };
