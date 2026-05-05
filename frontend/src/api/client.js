const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const DEFAULT_TIMEOUT_MS = (() => {
  const n = parseInt(import.meta.env.VITE_API_TIMEOUT_MS ?? '12000', 10);
  return Number.isFinite(n) && n > 0 ? Math.min(120000, n) : 12000;
})();

function getToken() {
  try {
    const raw = localStorage.getItem('lp_auth');
    if (!raw) return null;
    const a = JSON.parse(raw);
    return a?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * JSON fetch to the backend. Sends Bearer token when present (unless `auth: false`).
 */
export async function apiFetch(path, { method = 'GET', body, token, auth = true } = {}) {
  const t = auth ? token ?? getToken() : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${BASE.replace(/\/$/, '')}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      const err = new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS}ms`);
      err.status = 408;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { BASE as API_BASE_URL };

export async function uploadFile(path, file, { token } = {}) {
  const t = token ?? getToken();
  const form = new FormData();
  form.append('avatar', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${BASE.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: {
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: form,
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      const err = new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS}ms`);
      err.status = 408;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
