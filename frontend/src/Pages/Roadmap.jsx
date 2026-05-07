import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import roadmapData from '../data/roadmap.json';
import NavBar from '../components/NavBar';
import AiChat from '../components/AiChat';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import './Roadmap.css';
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';

/** Map backend profile.roadmap.content into the UI shape expected by this page. */
function buildUiFromProfile(profile) {
  const content = profile?.roadmap?.content;
  const cefr = profile?.level?.cefr || profile?.roadmap?.level;
  if (!content?.weekly_plan?.length) return null;
  const weeks = content.weekly_plan;
  const goal =
    (content.vocabulary_goals && content.vocabulary_goals[0]) ||
    `CEFR ${cefr || ''} — your personalized plan`;
  const units = weeks.map((w, i) => ({
    id: w.week ?? i + 1,
    status: i === 0 ? 'current' : 'locked',
    title: `Week ${w.week}: ${w.focus || 'Focus'}`,
    description: (w.sessions || []).join(' · ') || '',
    icon: 'menu_book',
    lessons: (w.sessions || []).map((s, j) => ({
      id: j + 1,
      title: s,
      content: null,
      progress: 0,
      completed: false,
    })),
    topics: w.sessions || [],
  }));
  units.push({
    id: 999,
    status: 'locked',
    title: 'Certification & mastery',
    description:
      (content.practice_tasks || []).slice(0, 3).join(' · ') || 'Final speaking & review.',
    icon: 'emoji_events',
    lessons: [],
    topics: content.grammar_topics || content.practice_tasks || [],
  });
  return { goal, progress: 0, streak: 0, units };
}

/**
 * Attach API lessons and dynamic unit status: first week with incomplete lessons = current;
 * earlier weeks with lessons = completed; later = locked.
 */
function buildDisplayUnits(dataUnits, apiLessons, completedLessonIds) {
  if (!dataUnits?.length) return [];
  const content = dataUnits.slice(0, -1);
  const tail = dataUnits.at(-1);

  const weekLessonsFor = (weekId) =>
    apiLessons
      .filter((l) => String(l.week_index) === String(weekId))
      .sort((a, b) => Number(a.sort_index) - Number(b.sort_index));

  let assignedCurrent = false;
  const middle = content.map((unit) => {
    const weekLessons = weekLessonsFor(unit.id);
    if (weekLessons.length === 0) {
      return { ...unit, weekLessons, status: unit.status };
    }
    const allDone = weekLessons.every((l) => completedLessonIds.has(String(l.id)));
    let status;
    if (allDone) {
      status = 'completed';
    } else if (!assignedCurrent) {
      status = 'current';
      assignedCurrent = true;
    } else {
      status = 'locked';
    }
    return { ...unit, weekLessons, status };
  });

  return [...middle, tail];
}

export default function Roadmap() {
  const { auth, refreshProfile } = useAuth();
  const data = useMemo(() => {
    const fromApi = buildUiFromProfile(auth.profile);
    return fromApi || roadmapData;
  }, [auth.profile]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiLessons, setApiLessons] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const loadLessons = useCallback(async () => {
    try {
      const d = await apiFetch('/api/lessons?limit=100');
      setApiLessons(d.lessons || []);
    } catch {
      setApiLessons([]);
    }
  }, []);

  const completedLessonIds = useMemo(() => {
    const s = new Set();
    const rows = auth.profile?.analytics?.recent_progress ?? [];
    for (const r of rows) {
      if (r.lesson_id) s.add(String(r.lesson_id));
    }
    return s;
  }, [auth.profile]);

  const displayUnits = useMemo(
    () => buildDisplayUnits(data.units, apiLessons, completedLessonIds),
    [data.units, apiLessons, completedLessonIds],
  );

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons, auth.profile?.roadmap?.id]);

  // Poll for lessons if none are found and placement is completed
  useEffect(() => {
    if (auth.placementCompleted && apiLessons.length === 0) {
      const id = setInterval(() => {
        loadLessons();
        refreshProfile();
      }, 5000);
      return () => clearInterval(id);
    }
  }, [auth.placementCompleted, apiLessons.length, loadLessons, refreshProfile]);

  useEffect(() => {
    if (location.pathname !== '/roadmap') return;
    refreshProfile();
    loadLessons();
  }, [location.pathname, location.key, refreshProfile, loadLessons]);

  const view = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const v = params.get('view');
    if (!v || v === 'roadmap') return 'roadmap';
    if (v === 'dashboard') return 'dashboard';
    if (v === 'analytics' || v === 'statistics') return 'statistics';
    return 'roadmap';
  }, [location.search]);

  const timelineUnits = displayUnits.slice(0, -1);
  const currentUnitIndex = timelineUnits.findIndex((u) => u.status === 'current');
  const completedUnitsCount = timelineUnits.filter((u) => u.status === 'completed').length;
  const totalUnits = displayUnits.length;
  const activePathHeight =
    currentUnitIndex >= 0
      ? `${((currentUnitIndex + 0.5) / (totalUnits + 1)) * 100}%`
      : `${(completedUnitsCount / (totalUnits + 1)) * 100}%`;

  const handleResume = useCallback(async () => {
    // 1. Try to find the first incomplete lesson in current unit
    for (const unit of displayUnits) {
      if (unit.status !== 'current' || !unit.weekLessons?.length) continue;
      const wl = unit.weekLessons;
      for (let i = 0; i < wl.length; i += 1) {
        const le = wl[i];
        if (!completedLessonIds.has(String(le.id))) {
          navigate(`/lesson/${le.id}`);
          return;
        }
      }
    }
    // 2. Fallback: find any incomplete lesson in any completed unit (unlikely but safe)
    const allIncomplete = apiLessons
      .filter((l) => !completedLessonIds.has(String(l.id)))
      .sort((a, b) => Number(a.week_index) - Number(b.week_index) || Number(a.sort_index) - Number(b.sort_index));

    if (allIncomplete[0]) {
      navigate(`/lesson/${allIncomplete[0].id}`);
      return;
    }

    // 3. If no incomplete lessons, maybe we just finished everything or none generated yet
    if (apiLessons.length === 0) {
      // Try one quick refresh before giving up
      const d = await apiFetch('/api/lessons?limit=100');
      if (d.lessons?.length > 0) {
        setApiLessons(d.lessons);
        navigate(`/lesson/${d.lessons[0].id}`);
        return;
      }
      alert('Your personalized lessons are being generated. Please wait a few seconds and try again!');
    } else {
      // Everything is completed?
      const sorted = [...apiLessons].sort((a, b) => Number(a.week_index) - Number(b.week_index) || Number(a.sort_index) - Number(b.sort_index));
      navigate(`/lesson/${sorted[0].id}`);
    }
  }, [displayUnits, apiLessons, completedLessonIds, navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="roadmap-container">
      <NavBar onMenuClick={() => setSidebarOpen(true)} />

      <main className="roadmap-main">
        <SideBar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="roadmap-content">
          <div className="content-wrapper">
            {view === 'dashboard' ? (
              <Dashboard />
            ) : view === 'statistics' ? (
              <Analytics />
            ) : (
              <>
                <div className="page-header">
                  <div className="page-title-section">
                    <h1 className="page-title">Your Learning Roadmap</h1>
                    <p className="page-subtitle">
                      {auth.profile?.level?.cefr
                        ? `Your level: ${auth.profile.level.cefr} · Complete lessons in order to unlock the next`
                        : 'Personalized path through conversational AI'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                    {apiLessons.length === 0 && auth.placementCompleted ? (
                      <div className="generating-indicator">
                        <div className="ai-loader-small" />
                        <span>Loading your predefined lessons...</span>
                      </div>
                    ) : (
                      <button type="button" className="resume-button" onClick={handleResume}>
                        <span className="material-symbols-outlined">play_arrow</span>
                        Continue learning
                      </button>
                    )}
                  </div>
                </div>
                <div className="roadmap-section">
                  <div className="timeline-background" />
                  <div
                    className="timeline-active"
                    style={{ height: activePathHeight }}
                  />
                  <div className="units-container">
                    {timelineUnits.map((unit) => {
                      const isCompleted = unit.status === 'completed';
                      const isCurrent = unit.status === 'current';
                      const weekLessons = unit.weekLessons || [];
                      const hasApiLessons = weekLessons.length > 0;

                      const doneInWeek = hasApiLessons
                        ? weekLessons.filter((l) => completedLessonIds.has(String(l.id))).length
                        : 0;
                      const lessonTotal = hasApiLessons
                        ? weekLessons.length
                        : Math.max(unit?.topics?.length || 0, unit?.lessons?.length || 0, 1);

                      const legacyCompleted = (unit?.lessons || []).filter(
                        (lesson) => lesson.progress === 100,
                      ).length;
                      const showProgressCount = hasApiLessons ? doneInWeek : legacyCompleted;
                      const progressPct = Math.round((showProgressCount / lessonTotal) * 100);

                      return (
                        <div key={unit.id} className="unit-row">
                          <div className="unit-marker-container">
                            {isCompleted ? (
                              <div className="unit-marker marker-completed">
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontWeight: 'bold' }}
                                >
                                  check
                                </span>
                              </div>
                            ) : isCurrent ? (
                              <div className="unit-marker marker-current">
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontWeight: 'bold' }}
                                >
                                  map
                                </span>
                              </div>
                            ) : (
                              <div className="unit-marker marker-locked">
                                <span className="material-symbols-outlined">lock</span>
                              </div>
                            )}
                          </div>
                          <div
                            className={`unit-card ${isCompleted ? 'completed' : isCurrent ? 'current' : 'locked'}`}
                          >
                            <div className="unit-header">
                              <div className="unit-title-section">
                                <span
                                  className={`material-symbols-outlined unit-icon ${isCurrent ? 'current' : ''}`}
                                >
                                  {unit.icon}
                                </span>
                                <h4 className={`unit-title ${isCurrent ? 'current' : ''}`}>
                                   {unit.title}
                                </h4>
                              </div>
                              <span
                                className={`unit-badge ${
                                  isCompleted
                                    ? 'badge-completed'
                                    : isCurrent
                                      ? 'badge-current'
                                      : 'badge-locked'
                                }`}
                              >
                                {isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Locked'}
                              </span>
                            </div>
                            <p className={`unit-description ${isCurrent ? 'current' : ''}`}>
                              {unit.description}
                            </p>

                            {hasApiLessons ? (
                              <>
                                {(isCurrent || isCompleted) && (
                                  <div className="unit-progress-section">
                                    <div className="unit-progress-header">
                                      <span>Unit progress</span>
                                      <span>
                                        {doneInWeek} / {lessonTotal} lessons
                                      </span>
                                    </div>
                                    <div className="unit-progress-bar">
                                      <div
                                        className="unit-progress-fill"
                                        style={{ width: `${progressPct}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                                <div className="topics-grid" style={{ marginTop: 14 }}>
                                  {weekLessons.map((lesson, idx) => {
                                    const done = completedLessonIds.has(String(lesson.id));
                                    const prevDone = weekLessons
                                      .slice(0, idx)
                                      .every((l) => completedLessonIds.has(String(l.id)));
                                    const effectiveUnlocked =
                                      isCompleted || (isCurrent && prevDone);

                                    let cardClass = 'topic-card locked';
                                    if (done) cardClass = 'topic-card completed';
                                    else if (effectiveUnlocked) cardClass = 'topic-card current';

                                    return (
                                      <div key={lesson.id} className={cardClass}>
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            flex: 1,
                                            minWidth: 0,
                                          }}
                                        >
                                          {done ? (
                                            <span className="material-symbols-outlined topic-icon">
                                              check_circle
                                            </span>
                                          ) : effectiveUnlocked ? (
                                            <span className="material-symbols-outlined topic-icon current">
                                              radio_button_checked
                                            </span>
                                          ) : (
                                            <span className="material-symbols-outlined topic-icon locked">
                                              lock
                                            </span>
                                          )}
                                          <span
                                            className={`topic-text ${effectiveUnlocked && !done ? 'current' : ''}`}
                                          >
                                            {lesson.title}
                                          </span>
                                        </div>
                                        {done ? (
                                          <button
                                            type="button"
                                            className="start-button"
                                            onClick={() => navigate(`/lesson/${lesson.id}`)}
                                          >
                                            Review
                                          </button>
                                        ) : effectiveUnlocked ? (
                                          <button
                                            type="button"
                                            className="start-button"
                                            onClick={() => navigate(`/lesson/${lesson.id}`)}
                                          >
                                            START
                                          </button>
                                        ) : (
                                          <button type="button" className="start-button" disabled>
                                            Locked
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : isCurrent && unit.topics ? (
                              <>
                                <div className="unit-progress-section">
                                  <div className="unit-progress-header">
                                    <span>Overall Unit Progress</span>
                                    <span>
                                      {legacyCompleted} / {lessonTotal} Lessons
                                    </span>
                                  </div>
                                  <div className="unit-progress-bar">
                                    <div
                                      className="unit-progress-fill"
                                      style={{
                                        width: `${Math.round((legacyCompleted / lessonTotal) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="topics-grid">
                                  {unit.topics.map((topic, topicIndex) => {
                                    const isCompletedTopic = topicIndex < legacyCompleted;
                                    const isCurrentTopic = topicIndex === legacyCompleted;
                                    return (
                                      <div
                                        key={topicIndex}
                                        className={`topic-card ${
                                          isCompletedTopic
                                            ? 'completed'
                                            : isCurrentTopic
                                              ? 'current'
                                              : 'locked'
                                        }`}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          {isCompletedTopic ? (
                                            <span className="material-symbols-outlined topic-icon">
                                              check_circle
                                            </span>
                                          ) : isCurrentTopic ? (
                                            <span className="material-symbols-outlined topic-icon current">
                                              radio_button_checked
                                            </span>
                                          ) : (
                                            <span className="material-symbols-outlined topic-icon locked">
                                              radio_button_unchecked
                                            </span>
                                          )}
                                          <span
                                            className={`topic-text ${isCurrentTopic ? 'current' : ''}`}
                                          >
                                            {topic}
                                          </span>
                                        </div>
                                        {isCurrentTopic && (
                                          <button type="button" className="start-button" onClick={handleResume}>
                                            START
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              <div className="unit-stats">
                                {isCompleted && (
                                  <>
                                    <span className="stat-badge">
                                      {unit.lessons?.length ?? 0} Lessons
                                    </span>
                                    <span className="stat-badge">Perfect Score</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="completion-section">
                  <div className="completion-icon">
                    <span className="material-symbols-outlined">emoji_events</span>
                  </div>
                  <h3 className="completion-title">{displayUnits.at(-1).title}</h3>
                  <p className="completion-description">{displayUnits.at(-1).description}</p>
                  <div className="completion-features">
                    <div className="completion-feature">
                      <div className="completion-feature-icon">
                        <span className="material-symbols-outlined">workspace_premium</span>
                      </div>
                      <span className="completion-feature-label">Certification</span>
                    </div>
                    <div className="completion-feature">
                      <div className="completion-feature-icon">
                        <span className="material-symbols-outlined">forum</span>
                      </div>
                      <span className="completion-feature-label">Debate Room</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <AiChat />
      </main>
      <Footer />
    </div>
  );
}
