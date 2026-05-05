import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './LessonPage.css';
import NavBar from '../components/NavBar';
import AiChat from '../components/AiChat';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [weekLessons, setWeekLessons] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exerciseChoice, setExerciseChoice] = useState({});

  useEffect(() => {
    setExerciseChoice({});
  }, [lessonId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch(`/api/lessons/${lessonId}`);
        if (cancelled) return;
        const currentLesson = data.lesson;
        setLesson(currentLesson);

        try {
          const listData = await apiFetch('/api/lessons?limit=100');
          if (cancelled) return;
          const sameWeekLessons = (listData.lessons || [])
            .filter((item) => String(item.week_index) === String(currentLesson.week_index))
            .sort((a, b) => Number(a.sort_index) - Number(b.sort_index));
          setWeekLessons(sameWeekLessons.length ? sameWeekLessons : [currentLesson]);
        } catch {
          if (!cancelled) {
            setWeekLessons(currentLesson ? [currentLesson] : []);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load lesson');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const content = lesson?.content || {};
  const explanationParagraphs = String(content.explanation || '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const currentWeekLessonIndex = weekLessons.findIndex((item) => String(item.id) === String(lesson?.id));
  const nextWeekLesson = currentWeekLessonIndex >= 0 ? weekLessons[currentWeekLessonIndex + 1] : null;

  const handleComplete = async () => {
    try {
      await apiFetch('/api/progress', {
        method: 'POST',
        body: {
          lessonId: lesson.id,
          score: 100,
          weakAreas: [],
          metadata: { source: 'lesson_page' },
        },
      });
      await refreshProfile();
      if (nextWeekLesson) {
        navigate(`/lesson/${nextWeekLesson.id}`);
        return;
      }
      navigate('/roadmap');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save progress');
    }
  };

  if (loading) {
    return (
      <>
        <NavBar fixed />
        <div className="app-container" style={{ padding: 48 }}>
          <p>Loading lesson…</p>
        </div>
      </>
    );
  }

  if (error || !lesson) {
    return (
      <>
        <NavBar fixed />
        <div className="app-container" style={{ padding: 48 }}>
          <p>{error || 'Lesson not found'}</p>
          <button type="button" className="nav-btn next-btn" onClick={() => navigate('/roadmap')}>
            Back to roadmap
          </button>
        </div>
      </>
    );
  }

  const examples = Array.isArray(content.examples) ? content.examples : [];

  return (
    <>
      <NavBar fixed />
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>AI lesson</h2>
            <p className="sidebar-subtitle">Week {lesson.week_index}</p>
          </div>
          <nav className="lessons-nav">
            {weekLessons.map((weekLesson, index) => {
              const isActive = String(weekLesson.id) === String(lesson.id);
              return (
                <button
                  key={weekLesson.id}
                  type="button"
                  className={`lesson-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (!isActive) navigate(`/lesson/${weekLesson.id}`);
                  }}
                  disabled={isActive}
                >
                  <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span>
                  <div className="lesson-info">
                    <h3>{weekLesson.title}</h3>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="main-content sidebar-open">
          <div className="progress-header">
            <div className="progress-info">
              <span className="progress-label">{lesson.title}</span>
            </div>
          </div>

          <div className="lesson-header">
            <h1 className="lesson-title">{lesson.title}</h1>
            <p className="lesson-subtitle">Personalized content from your roadmap</p>
          </div>

          <section className="section">
            <h2 className="section-title">Explanation</h2>
            {explanationParagraphs.map((para) => (
              <p key={para.slice(0, 40)} className="explanation-text">
                {para}
              </p>
            ))}
          </section>

          {examples.length > 0 ? (
            <section className="section">
              <h2 className="section-title">Examples</h2>
              <div className="examples-grid">
                {examples.map((ex, index) => {
                  const sentence = String(ex.sentence || '');
                  const highlight = ex.highlight ? String(ex.highlight) : '';
                  const parts = highlight && sentence.includes(highlight) ? sentence.split(highlight) : [sentence, ''];
                  return (
                    <div key={index} className="example-card">
                      <div className="example-header">
                        <span className="example-category">Example</span>
                      </div>
                      <p className="example-sentence">
                        {highlight && parts.length > 1 ? (
                          <>
                            {parts[0]}
                            <span className="highlighted">{highlight}</span>
                            {parts[1]}
                          </>
                        ) : (
                          sentence
                        )}
                      </p>
                      {ex.note ? <p className="example-description">{ex.note}</p> : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
{/* 
          {Array.isArray(content.exercises) && content.exercises.length > 0 ? (
            <section className="section">
              <h2 className="section-title">Practice</h2>
              {content.exercises.map((ex, i) => {
                if (ex.type !== 'mcq' || !Array.isArray(ex.options)) return null;
                const picked = exerciseChoice[i];
                const correct = picked === ex.correctIndex;
                return (
                  <div key={i} className="marker-card" style={{ marginBottom: 16 }}>
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>{ex.prompt}</p>
                    <div className="quiz-options" style={{ flexDirection: 'column', gap: 8 }}>
                      {ex.options.map((opt, j) => (
                        <button
                          key={j}
                          type="button"
                          className={`quiz-option ${picked === j ? 'selected' : ''}`}
                          style={{ textAlign: 'left', cursor: 'pointer' }}
                          onClick={() => setExerciseChoice((prev) => ({ ...prev, [i]: j }))}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {picked !== undefined ? (
                      <p className="example-description" style={{ marginTop: 8 }}>
                        {correct ? 'Correct.' : 'Not quite — review the explanation above.'}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </section>
          ) : null} */}

          {Array.isArray(content.exercises) && content.exercises.length > 0 && (
            <section className="section">
              <h2 className="section-title">Practice</h2>

              {content.exercises
                .filter(ex => ex.type === 'mcq' && Array.isArray(ex.options))
                .map((ex, i) => {
                  const picked = exerciseChoice[i];
                  const isAnswered = picked !== undefined;
                  const isCorrect = picked === ex.correctIndex;

                  return (
                    <div key={i} className="quiz-card">
                      <p className="quiz-question">{ex.prompt}</p>

                      <div className="quiz-options">
                        {ex.options.map((opt, j) => {
                          const isSelected = picked === j;

                          return (
                            <button
                              key={j}
                              type="button"
                              className={`quiz-option 
                                ${isSelected ? 'selected' : ''} 
                                ${isAnswered && j === ex.correctIndex ? 'correct' : ''} 
                                ${isAnswered && isSelected && !isCorrect ? 'wrong' : ''}`}
                              onClick={() =>
                                setExerciseChoice(prev => ({ ...prev, [i]: j }))
                              }
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <p className={`quiz-feedback ${isCorrect ? 'success' : 'error'}`}>
                          {isCorrect
                            ? '✅ Correct!'
                            : '❌ Not quite — review the explanation above.'}
                        </p>
                      )}
                    </div>
                  );
                })}
            </section>
          )}

          <div className="lesson-navigation">
            <button type="button" className="nav-btn prev-btn" onClick={() => navigate('/roadmap')}>
              Back to roadmap
            </button>
            <button type="button" className="nav-btn next-btn" onClick={handleComplete}>
              {nextWeekLesson ? 'Next lesson' : 'Finish week'}
            </button>
          </div>
          <AiChat />
        </main>
      </div>
    </>
  );
}
