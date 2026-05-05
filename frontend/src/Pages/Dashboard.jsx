import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import NavBar from '../components/NavBar';
import AiChat from '../components/AiChat';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import { useAuth } from '../auth/AuthContext';

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

function nextCefr(level) {
  if (!level) return null;
  const i = CEFR_ORDER.indexOf(level);
  if (i === -1 || i === CEFR_ORDER.length - 1) return null;
  return CEFR_ORDER[i + 1];
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function openFloatingTutor() {
  document.querySelector('.fab')?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { auth, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const p = auth.profile;
  const displayName = p?.user?.username || auth.user?.username || 'Learner';
  const level = p?.level?.cefr || auth.level || null;
  const nextLevel = nextCefr(level);
  const lessonsDone = p?.analytics?.lessons_completed ?? 0;
  const avgScore = p?.analytics?.average_score;
  const notesCount = p?.analytics?.notes_count ?? 0;
  const firstLesson = p?.lessons_preview?.[0];

  const xpTotal = p?.analytics?.xp_total ?? 0;
  const xpNextMilestone = p?.analytics?.xp_next_milestone ?? 500;
  const xpSegment = p?.analytics?.xp_segment_size ?? 500;
  const progressPct = Math.min(100, p?.analytics?.xp_progress_percent ?? 0);
  const streakDays = p?.analytics?.streak_days ?? 0;
  const xpLesson = p?.analytics?.xp_lesson ?? 0;
  const xpNotes = p?.analytics?.xp_notes ?? 0;

  const heroSub = useMemo(() => {
    if (level && nextLevel) {
      const scoreHint =
        avgScore != null
          ? ` Your average lesson score is ${Math.round(Number(avgScore))}%.`
          : '';
      return (
        <>
          You are placed at <span className="dashboard-link">{level}</span>. Keep building skills toward{' '}
          <span className="dashboard-link">{nextLevel}</span>.{scoreHint}
        </>
      );
    }
    if (level) {
      return (
        <>
          You are placed at <span className="dashboard-link">{level}</span>. Complete lessons on your roadmap to go further.
        </>
      );
    }
    return <>Finish the placement test to unlock your level and personalized roadmap.</>;
  }, [level, nextLevel, avgScore]);

  const weeklyActivity = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const list = p?.analytics?.recent_progress;
    if (!Array.isArray(list)) {
      return [20, 25, 20, 30, 25, 15, 10];
    }
    for (const row of list) {
      if (!row?.created_at) continue;
      const d = new Date(row.created_at);
      const wd = d.getUTCDay();
      const monIdx = wd === 0 ? 6 : wd - 1;
      counts[monIdx] += 1;
    }
    const max = Math.max(1, ...counts);
    return counts.map((c) => Math.min(95, Math.round((c / max) * 85) + 10));
  }, [p?.analytics?.recent_progress]);

  const memberLabel = p?.user?.created_at
    ? new Date(p.user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <>
      <NavBar />
      <div className="root">
        <SideBar />
        <div className="dashboard-root">
          <div className="dashboard-hero-row">
            <div className="dashboard-hero-text">
              <h1 className="dashboard-greeting">
                {timeGreeting()}, {displayName}!
              </h1>
              <p className="dashboard-hero-sub">{heroSub}</p>
              {memberLabel && (
                <p className="dashboard-hero-meta">Member since {memberLabel}</p>
              )}
            </div>
            <button
              type="button"
              className="dashboard-action-primary"
              onClick={() => navigate('/roadmap')}
            >
              Go to roadmap
            </button>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card large">
              <div className="dashboard-card-header">
                <span className="dashboard-card-title">Learning progress</span>
                <span className="dashboard-level-badge">
                  {level ? `LEVEL ${level}` : 'LEVEL —'}
                </span>
              </div>
              <div className="dashboard-progress-row">
                <span className="dashboard-progress-label">Total XP · progress to next milestone</span>
                <span className="dashboard-progress-value">
                  {xpTotal.toLocaleString()} / {xpNextMilestone.toLocaleString()} XP
                </span>
              </div>
              <div className="dashboard-progress-bar thick">
                <div
                  className="dashboard-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="dashboard-progress-note">
                {xpLesson.toLocaleString()} XP from lessons · {xpNotes.toLocaleString()} from notes ({xpSegment} XP per milestone).{' '}
                {lessonsDone} lesson{lessonsDone === 1 ? '' : 's'} completed
                {avgScore != null ? ` · avg score ${Math.round(Number(avgScore))}%` : ''}.
                {Array.isArray(p?.level?.weak_areas) && p.level.weak_areas.length > 0
                  ? ` Focus areas: ${p.level.weak_areas.slice(0, 3).join(', ')}.`
                  : ''}
              </div>
            </div>

            <div className="dashboard-side">
              <div className="dashboard-card stat">
                <div className="dashboard-stat-title">Lessons completed</div>
                <div className="dashboard-stat-value">{lessonsDone}</div>
                <div className="dashboard-stat-sub">Across your roadmap</div>
              </div>
              <div className="dashboard-card stat">
                <div className="dashboard-stat-title">Day streak</div>
                <div className="dashboard-stat-value">{streakDays}</div>
                <div className="dashboard-stat-sub">
                  {streakDays === 0
                    ? 'Complete a lesson or save a note today (UTC)'
                    : 'Consecutive days with lesson or note activity'}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-section-title">Learning Hub</div>
          <div className="dashboard-hub-grid">
            <div className="dashboard-hub-card hub-primary">
              <div className="dashboard-hub-pill large pill-blue">
                <span className="material-symbols-outlined">play_circle</span>
              </div>
              <div className="dashboard-hub-title">Continue learning</div>
              <div className="dashboard-hub-sub">
                {firstLesson?.title || 'Open your roadmap to start or continue a lesson'}
              </div>
              <button
                type="button"
                className="dashboard-hub-button"
                onClick={() => navigate('/roadmap')}
                style={{ cursor: 'pointer' }}
              >
                {firstLesson ? 'Resume' : 'Open roadmap'}
              </button>
            </div>
            <div className="dashboard-hub-card">
              <div className="dashboard-hub-pill large pill-purple">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div className="dashboard-hub-title">AI tutor</div>
              <div className="dashboard-hub-sub">Quick questions & practice tips</div>
              <button
                type="button"
                className="dashboard-outline-button"
                onClick={openFloatingTutor}
              >
                Open chat
              </button>
            </div>
            <div className="dashboard-hub-card">
              <div className="dashboard-hub-pill large pill-green">
                <span className="material-symbols-outlined">note_stack</span>
              </div>
              <div className="dashboard-hub-title">Notes</div>
              <div className="dashboard-hub-sub">Review saved vocabulary & ideas</div>
              <button
                type="button"
                className="dashboard-outline-button"
                onClick={() => navigate('/notepad')}
              >
                Open notebook
              </button>
            </div>
          </div>

          <div className="dashboard-footer-row">
            <div className="dashboard-subsection">
              <div className="dashboard-subsection-header">
                <span>Snapshot</span>
              </div>
              <div className="dashboard-badges-row">
                <div className="dashboard-badge">
                  <span className="material-symbols-outlined">school</span>
                  <span>{level || 'Level pending'}</span>
                </div>
                <div className="dashboard-badge">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>{lessonsDone} lessons</span>
                </div>
                <div className="dashboard-badge">
                  <span className="material-symbols-outlined">edit_note</span>
                  <span>{notesCount} notes</span>
                </div>
                <div className="dashboard-badge">
                  <span className="material-symbols-outlined">local_fire_department</span>
                  <span>{streakDays}d streak</span>
                </div>
              </div>
            </div>
            <div className="dashboard-subsection">
              <div className="dashboard-subsection-header">
                <span>Weekly rhythm (recent lessons, UTC)</span>
              </div>
              <div className="dashboard-activity-chart">
                <div className="weekly-bars">
                  {weeklyActivity.map((v, i) => (
                    <div className="weekly-bar" key={i}>
                      <div className="weekly-bar-fill" style={{ height: `${v}%` }} />
                    </div>
                  ))}
                </div>
                <div className="weekly-labels">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>Th</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AiChat />
      </div>
      <Footer />
    </>
  );
}
