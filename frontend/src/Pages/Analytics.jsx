import React, { useEffect } from 'react';
import './Analytics.css';
import NavBar from '../components/NavBar';
import AiChat from '../components/AiChat';
import SideBar from '../components/SideBar';
import Footer from '../components/Footer';
import { useAuth } from '../auth/AuthContext';

export default function Analytics() {
  const { auth, refreshProfile } = useAuth();

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const p = auth.profile;
  const userName = p?.user?.username || 'Learner';
  const level = p?.level?.cefr || '—';
  const memberSince = p?.user?.created_at
    ? new Date(p.user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : '—';
  const lessonsDone = p?.analytics?.lessons_completed ?? 0;
  const avgScore =
    p?.analytics?.average_score != null ? `${Math.round(Number(p.analytics.average_score))}%` : '—';
  const notesCount = p?.analytics?.notes_count ?? 0;
  const weakHint = Array.isArray(p?.level?.weak_areas)
    ? p.level.weak_areas.slice(0, 3).join(' · ')
    : 'Complete lessons to build more analytics.';

  const perfData = [
    { month: 'JAN', value: 40 },
    { month: 'FEB', value: 60 },
    { month: 'MAR', value: 50 },
    { month: 'APR', value: 75 },
    { month: 'MAY', value: 90 },
    { month: 'JUN', value: 85 },
  ];
  const badges = [
    { id: 1, icon: 'workspace_premium', color: '#f59e0b' },
    { id: 2, icon: 'menu_book', color: '#60a5fa' },
    { id: 3, icon: 'verified', color: '#22c55e' },
    { id: 4, icon: 'auto_awesome', color: '#a78bfa' },
    { id: 5, icon: 'psychology_alt', color: '#fb7185' },
    { id: 6, icon: 'translate', color: '#34d399' },
    { id: 7, icon: 'school', color: '#93c5fd' },
  ];
  const recentProgress = Array.isArray(p?.analytics?.recent_progress)
    ? p.analytics.recent_progress.slice(0, 8)
    : [];
  const milestoneRows = recentProgress.map((row) => ({
    title: row.lesson_title || 'Progress',
    score: row.score != null ? String(row.score) : '—',
    date: row.created_at
      ? new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '—',
    cert: 'View',
  }));
  return (
    <>
      <NavBar />
    <div className='root'>
      <SideBar />
    <div className="analytics-root">
      <div className="analytics-header">
        {/* <div className="analytics-search">
          <span className="material-symbols-outlined">search</span>
          <input className="analytics-search-input" placeholder="Search analytics or milestones..." />
        </div> */}
      </div>

      <div className="analytics-profile">
        <div className='profile-root'>
          <div className="analytics-avatar"></div>
            <div className="analytics-profile-info">
            <div className="analytics-profile-name">{userName}</div>
            <div className="analytics-profile-sub">
              CEFR {level} • Member since {memberSince}
            </div>
          </div>
        </div>
        <div className="analytics-header-actions">
          <button className="analytics-secondary-button">Edit Profile</button>
          <button className="analytics-primary-button">Share Stats</button>
        </div>
      </div>

      <div className="analytics-stats-grid">
        <div className="analytics-card stat">
          <div className="analytics-stat-header">
            <span className="material-symbols-outlined analytics-stat-icon flame">local_fire_department</span>
            <span className="analytics-stat-label">Lessons completed</span>
          </div>
          <div className="analytics-stat-value">{lessonsDone}</div>
          <div className="analytics-stat-sub">Recorded via API</div>
        </div>
        <div className="analytics-card stat">
          <div className="analytics-stat-header">
            <span className="material-symbols-outlined analytics-stat-icon xp">workspace_premium</span>
            <span className="analytics-stat-label">Avg. score</span>
          </div>
          <div className="analytics-stat-value">{avgScore}</div>
          <div className="analytics-stat-sub">From progress entries</div>
        </div>
        <div className="analytics-card stat">
          <div className="analytics-stat-header">
            <span className="material-symbols-outlined analytics-stat-icon vocab">menu_book</span>
            <span className="analytics-stat-label">Notepad</span>
          </div>
          <div className="analytics-stat-value">{notesCount}</div>
          <div className="analytics-stat-sub">Saved notes</div>
        </div>
        <div className="analytics-card stat">
          <div className="analytics-stat-header">
            <span className="material-symbols-outlined analytics-stat-icon hours">schedule</span>
            <span className="analytics-stat-label">Level</span>
          </div>
          <div className="analytics-stat-value">{level}</div>
          <div className="analytics-stat-sub">From placement</div>
        </div>
      </div>

      <div className="analytics-main-grid">
        <div className="analytics-card chart">
          <div className="analytics-card-header">
            <span>Performance Over Time</span>
            <span className="analytics-chip">Last 6 Months</span>
          </div>
          <div className="analytics-bars">
            {perfData.map((d) => (
              <div className="analytics-bar" key={d.month}>
                <div className="analytics-bar-fill" style={{height: `${d.value}%`}}>
                  <div className="analytics-bar-tooltip">{d.value}</div>
                </div>
                <div className="analytics-bar-base"></div>
              </div>
            ))}
          </div>
          <div className="analytics-months">
            {perfData.map((d) => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </div>

        <div className="analytics-card skills">
          <div className="analytics-card-header">
            <span>Skill Breakdown</span>
          </div>
          <div className="analytics-skill">
            <span>Listening</span>
            <div className="analytics-skill-bar"><div style={{width: '92%'}}></div></div>
            <span className="analytics-skill-value">92%</span>
          </div>
          <div className="analytics-skill">
            <span>Reading</span>
            <div className="analytics-skill-bar"><div style={{width: '85%'}}></div></div>
            <span className="analytics-skill-value">85%</span>
          </div>
          <div className="analytics-skill">
            <span>Writing</span>
            <div className="analytics-skill-bar"><div style={{width: '68%'}}></div></div>
            <span className="analytics-skill-value">68%</span>
          </div>
          <div className="analytics-skill">
            <span>Speaking</span>
            <div className="analytics-skill-bar"><div style={{width: '74%'}}></div></div>
            <span className="analytics-skill-value">74%</span>
          </div>
          <div className="analytics-insight">
            <div className="analytics-insight-title">AI Insight</div>
            <div className="analytics-insight-text">{weakHint}</div>
          </div>
        </div>
      </div>

      <div className="analytics-bottom-grid">
        <div className="analytics-card badges-card">
          <div className="analytics-card-header">
            <span>Earned Badges</span>
          </div>
          <div className="analytics-badges-icons">
            {badges.slice(0,6).map(b => (
              <div className="badge-icon" key={b.id} style={{borderColor: b.color}}>
                <span className="material-symbols-outlined" style={{color: b.color}}>{b.icon}</span>
              </div>
            ))}
          </div>
        </div>
               <div className="analytics-card">
          <div className="analytics-card-header">
            <span>Milestone Log</span>
          </div>

          {/* Table wrapper (scroll only inside this card on mobile) */}
          <div className="analytics-milestone-table-wrap">
            <div className="analytics-milestone-table" >
              {/* Header */}
              <div className="analytics-milestone-head">
                <span>Milestone Achieved</span>
                <span>Score</span>
                <span>Date</span>
                <span className="analytics-milestone-right">Certificate</span>
              </div>

              {/* Body */}
              <div className="analytics-milestone-body">
                {milestoneRows.map((r, i) => (
                  <div className="analytics-milestone-row" key={i}>
                    <span className="analytics-milestone-title">{r.title}</span>
                    <span className="analytics-milestone-score">Score {r.score}</span>
                    <span className="analytics-milestone-date">{r.date}</span>
                    <a className="analytics-milestone-cert analytics-milestone-right" href="#">
                      {r.cert}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AiChat />
    </div>
    </div>
      <Footer />
    </>
  );
}
