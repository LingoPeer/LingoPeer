import { useEffect, useState } from 'react';
import roadmapData from '../data/roadmap.json';
import { useAuth } from '../auth/AuthContext';
import "./SideBar.css"

export default function SideBar(){
    const { auth, refreshProfile } = useAuth();
    const [data] = useState(roadmapData);
    const [IsActive, setIsActive] = useState(false);

    useEffect(() => {
      refreshProfile();
    }, [refreshProfile]);

    const goalText =
      auth.profile?.roadmap?.content?.vocabulary_goals?.[0] || data.goal;
    const levelText = auth.profile?.level?.cefr || 'Level';
    const xpPct = Math.min(100, auth.profile?.analytics?.xp_progress_percent ?? 0);
    const streakDays = auth.profile?.analytics?.streak_days ?? 0;
    const xpTotal = auth.profile?.analytics?.xp_total ?? 0;

    return(
    <aside className="roadmap-sidebar">
            {/* SideNavBar Component */}
            <div className="sidebar-top">
            <div className="current-goal-section">
                <h3 className="current-goal-label">Current Goal</h3>
                <p className="current-goal-text">{goalText}</p>
            </div>
            <nav className="sidebar-nav">
                <a className={`sidebar-nav-item ${IsActive ? 'active' : ''}`} href="/dashboard" onClick={() => setIsActive(true)}>
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
                </a>
                <a className="sidebar-nav-item" href="/roadmap">
                <span className="material-symbols-outlined filled-icon">map</span>
                <span>My Roadmap</span>
                </a>
                <a className="sidebar-nav-item" href="/notepad">
                <span className="material-symbols-outlined">style</span>
                <span>Note Pad</span>
                </a>
                <a className="sidebar-nav-item" href="/community">
                <span className="material-symbols-outlined">groups</span>
                <span>Community</span>
                </a>
                <a className="sidebar-nav-item" href="/analytics">
                <span className="material-symbols-outlined">bar_chart</span>
                <span>Statistics</span>
                </a>
                <a className="sidebar-nav-item" href="/leaderboard">
                <span className="material-symbols-outlined">bar_chart</span>
                <span>LeaderBoard</span>
                </a>
            </nav>
            </div>
            <div className="sidebar-bottom">
            <div className="progressRoadmap-card">
                <div className="progressRoadmap-header">
                <span className="progressRoadmap-level">{levelText}</span>
                <span className="progressRoadmap-percentage">{xpPct}%</span>
                </div>
                <div className="progressRoadmap-bar-container">
                <div className="progressRoadmap-bar-fill" style={{width: `${xpPct}%`}}></div>
                </div>
                <p className="streak-info">
                <span className="material-symbols-outlined streak-icon filled-icon">local_fire_department</span>
                {streakDays} day streak · {xpTotal.toLocaleString()} XP
                </p>
            </div>
            <button className="help-button">Help Center</button>
            </div>
       </aside>
    )
}
