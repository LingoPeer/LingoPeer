import { useMemo, useState, useEffect } from 'react';
import './Quiz.css';

function letterForIndex(i) {
  return String.fromCharCode(65 + i);
}

function Timer({ seconds }) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return (
    <div className="quiz-timer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {m}:{s}
    </div>
  );
}

export default function QuizRunner({
  brandTitle = 'AI English Placement',
  questions,
  onFinish,
  onDone,
  allowBack = true,
  initialSeconds = 900,
  /** When "none", do not use correctIndex (server grades). Show answered count instead. */
  gradingMode = 'local',
  submitResult = null,
  onRefreshFeedback,
  refreshingFeedback = false,
}) {
  const total = questions.length;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [done]);

  const q = questions[idx];
  const selected = answers[q.id];
  const pct = Math.round(((idx + 1) / total) * 100);

  const score = useMemo(() => {
    if (gradingMode === 'none') return null;
    let s = 0;
    for (const qq of questions) {
      if (answers[qq.id] === qq.correctIndex) s += 1;
    }
    return s;
  }, [answers, questions, gradingMode]);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((id) => typeof answers[id] === 'number').length,
    [answers],
  );

  const canGoPrev = allowBack && idx > 0 && !done;
  const canGoNext = !done && typeof selected === 'number';

  const finish = async () => {
    const result = { score, total, answers, answeredCount };
    setFinalResult(result);
    if (onFinish) {
      setFinishing(true);
      try {
        await onFinish(result);
      } catch (e) {
        setFinishing(false);
        alert(e instanceof Error ? e.message : 'Something went wrong');
        return;
      } finally {
        setFinishing(false);
      }
    }
    setDone(true);
  };

  return (
    <div className="quiz-root">
      <div className="quiz-container">

        {/* Top bar */}
        <div className="quiz-topbar">
          <div className="quiz-brand">
            <div className="quiz-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="quiz-brand-name">{brandTitle}</span>
          </div>

          <Timer seconds={timeLeft} />

          <div className="quiz-topbar-actions">
            <button className="quiz-action-btn primary">Save &amp; Exit</button>
            <button className="quiz-action-btn icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Progress card */}
        <div className="quiz-progress-card">
          <div className="quiz-progress-header">
            <span className="quiz-progress-label">
              {!done ? `Question ${idx + 1} of ${total}` : 'Completed'}
            </span>
            <span className="quiz-pct-label">{done ? '100' : pct}% Complete</span>
          </div>
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${done ? 100 : pct}%` }} />
          </div>
          {!done && q.section && (
            <div className="quiz-section-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              {q.section}
            </div>
          )}
        </div>

        {/* Main card */}
        <div className="quiz-card">
          {!done ? (
            <>
              <div className="quiz-section-label">{q.sectionLabel || 'Reading & Grammar'}</div>
              <div className="quiz-question-title">{q.prompt}</div>
              {q.sentence ? <p className="quiz-sentence">"{q.sentence}"</p> : null}

              <div className="quiz-options">
                {q.options.map((opt, i) => {
                  const isSelected = selected === i;
                  return (
                    <div
                      key={opt}
                      role="button"
                      tabIndex={0}
                      className={`quiz-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setAnswers((prev) => ({ ...prev, [q.id]: i }));
                      }}
                    >
                      <div className="opt-left">
                        <div className={`opt-bullet ${isSelected ? 'selected' : ''}`}>
                          {isSelected ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : letterForIndex(i)}
                        </div>
                        <span className="opt-text">{opt}</span>
                      </div>
                      {isSelected && (
                        <div className="opt-check">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="quiz-footer">
                <button className="quiz-nav-btn" disabled={!canGoPrev} onClick={() => setIdx((v) => Math.max(0, v - 1))}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  Previous
                </button>

                <div className="quiz-help">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  AI evaluates your responses in real-time
                </div>

                {idx < total - 1 ? (
                  <button className="quiz-nav-btn primary" disabled={!canGoNext} onClick={() => setIdx((v) => Math.min(total - 1, v + 1))}>
                    Next Question
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                ) : (
                  <button className="quiz-nav-btn primary" disabled={!canGoNext || finishing} onClick={finish}>
                    {finishing ? 'Submitting…' : 'Finish'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="quiz-result">
              <div className="quiz-result-header">
                <div className="quiz-result-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h3>Test Completed!</h3>
                <p>We've analyzed your performance to determine your English level.</p>
              </div>

              {submitResult ? (
                <div className="quiz-level-card">
                  <div className="quiz-level-badge">
                    <span className="quiz-level-text">{submitResult.level}</span>
                    <span className="quiz-level-label">Your Level</span>
                  </div>
                  <div className="quiz-result-details">
                    <div className="result-metric">
                      <span className="metric-value">{submitResult.scores?.correct} / {submitResult.scores?.total}</span>
                      <span className="metric-label">Correct Answers</span>
                    </div>
                    <div className="result-metric">
                      <span className="metric-value">{submitResult.scores?.objective_percent}%</span>
                      <span className="metric-label">Accuracy</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="quiz-result-metrics">
                  {gradingMode === 'none' ? (
                    <span className="quiz-chip">
                      <span className="quiz-chip-label">Answered</span>
                      <span className="quiz-chip-value">{answeredCount} / {total}</span>
                    </span>
                  ) : (
                    <>
                      <span className="quiz-chip">
                        <span className="quiz-chip-label">Score</span>
                        <span className="quiz-chip-value">{score} / {total}</span>
                      </span>
                      <span className="quiz-chip">
                        <span className="quiz-chip-label">Accuracy</span>
                        <span className="quiz-chip-value">{Math.round((score / total) * 100)}%</span>
                      </span>
                    </>
                  )}
                </div>
              )}

              {submitResult?.summary && (
                <div className="quiz-result-summary">
                  <p>{submitResult.summary}</p>
                </div>
              )}

              {submitResult?.aiFeedbackStatus === 'pending' ? (
                <div className="quiz-ai-status">
                  <div className="ai-loader" />
                  <span>AI is building your personalized lessons...</span>
                  <button
                    type="button"
                    className="quiz-refresh-btn"
                    disabled={refreshingFeedback}
                    onClick={() => onRefreshFeedback?.()}
                  >
                    {refreshingFeedback ? 'Updating...' : 'Check Status'}
                  </button>
                </div>
              ) : null}

              <div className="quiz-result-actions">
                <button className="quiz-nav-btn primary large" onClick={() => onDone?.(finalResult ?? { score, total, answers })}>
                  Start Learning Roadmap
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}