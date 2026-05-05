import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import './AiChat.css';

const STORAGE_PREFIX = 'lp_ai_chat_messages_';
const MAX_STORED = 120;

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId != null ? String(userId) : 'anon'}`;
}

function loadMessages(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string',
      )
      .map((m) => ({
        id: String(m.id || `${m.ts || Date.now()}`),
        role: m.role,
        content: m.content,
        ts: typeof m.ts === 'number' ? m.ts : Date.now(),
      }));
  } catch {
    return [];
  }
}

function saveMessages(key, messages) {
  const trimmed = messages.slice(-MAX_STORED);
  localStorage.setItem(key, JSON.stringify(trimmed));
}

function formatChatError(err) {
  const raw = err instanceof Error ? err.message : String(err);
  if (/429|quota|RESOURCE_EXHAUSTED|QuotaFailure|Too Many Requests/i.test(raw)) {
    return raw.length < 280
      ? raw
      : 'Google Gemini rate limit or quota reached. Wait a minute and try again, or use a stable model (e.g. gemini-2.0-flash) in the server .env.';
  }
  if (raw.length > 240 || /GoogleGenerativeAI|generativelanguage\.googleapis/i.test(raw)) {
    return 'Could not reach the AI. Check your connection and server Gemini settings.';
  }
  return raw;
}

export default function AiChat() {
  const { auth } = useAuth();
  const userId = auth.user?.id ?? null;
  const key = useMemo(() => storageKey(userId), [userId]);
  const level = auth.profile?.level?.cefr ?? auth.level ?? undefined;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const loggedIn = Boolean(auth.isLoggedIn && auth.token);

  useEffect(() => {
    setMessages(loadMessages(key));
  }, [key]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages, sending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const persist = useCallback(
    (next) => {
      setMessages(next);
      saveMessages(key, next);
    },
    [key],
  );

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (!loggedIn) {
      setError('Sign in to chat with the tutor.');
      return;
    }
    setError('');
    setInput('');

    const userMsg = {
      id: newId(),
      role: 'user',
      content: text,
      ts: Date.now(),
    };
    const history = messages.map(({ role, content }) => ({ role, content }));
    const nextAfterUser = [...messages, userMsg];
    persist(nextAfterUser);
    setSending(true);

    try {
      const data = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: {
          message: text,
          history,
          ...(level ? { level } : {}),
        },
      });
      const reply = String(data.reply ?? '').trim() || 'Sorry, I could not generate a reply.';
      const assistantMsg = {
        id: newId(),
        role: 'assistant',
        content: reply,
        ts: Date.now(),
      };
      persist([...nextAfterUser, assistantMsg]);
    } catch (e) {
      setError(formatChatError(e));
    } finally {
      setSending(false);
    }
  };

  const clearHistory = () => {
    if (!window.confirm('Clear all messages in this chat?')) return;
    persist([]);
    setError('');
  };

  return (
    <div className="ai-chat-root">
      {open && (
        <div
          className="ai-chat-backdrop"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`ai-chat-panel ${open ? 'ai-chat-panel--open' : ''}`}
        role="dialog"
        aria-label="English tutor chat"
        aria-hidden={!open}
      >
        <div className="ai-chat-header">
          <div className="ai-chat-header-text">
            <span className="ai-chat-title">AI English tutor</span>
            <span className="ai-chat-sub">Your history is saved on this device</span>
          </div>
          <div className="ai-chat-header-actions">
            <button
              type="button"
              className="ai-chat-icon-btn"
              onClick={clearHistory}
              title="Clear history"
              aria-label="Clear chat history"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
            <button
              type="button"
              className="ai-chat-icon-btn"
              onClick={() => setOpen(false)}
              title="Close"
              aria-label="Close chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="ai-chat-messages" ref={listRef}>
          {!loggedIn && (
            <p className="ai-chat-hint">Sign in to ask the AI tutor questions. Your past chats will appear here after you log in.</p>
          )}
          {messages.length === 0 && loggedIn && (
            <p className="ai-chat-hint">
              Ask about grammar, vocabulary, how to say something, or practice ideas. This chat is saved on your browser so you can read it anytime.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`ai-chat-bubble ai-chat-bubble--${m.role}`}
            >
              <span className="ai-chat-bubble-label">{m.role === 'user' ? 'You' : 'Tutor'}</span>
              <div className="ai-chat-bubble-text">{m.content}</div>
            </div>
          ))}
          {sending && (
            <div className="ai-chat-bubble ai-chat-bubble--assistant ai-chat-typing">
              <span className="ai-chat-bubble-label">Tutor</span>
              <span className="ai-chat-dots" aria-live="polite">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}
        </div>

        {error && <div className="ai-chat-error" role="alert">{error}</div>}

        <div className="ai-chat-composer">
          <textarea
            className="ai-chat-input"
            rows={2}
            placeholder={loggedIn ? 'Message…' : 'Sign in to chat'}
            value={input}
            disabled={!loggedIn || sending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            className="ai-chat-send"
            disabled={!loggedIn || sending || !input.trim()}
            onClick={send}
          >
            Send
          </button>
        </div>
      </div>

      <button
        type="button"
        className="fab"
        aria-label="Open AI tutor chat"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="30" height="40" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="6" width="16" height="12" rx="3" fill="currentColor" />
          <circle cx="9" cy="12" r="1.5" fill="#0f172a" />
          <circle cx="15" cy="12" r="1.5" fill="#0f172a" />
          <rect x="11" y="2" width="2" height="4" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
