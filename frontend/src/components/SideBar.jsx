import { useEffect, useState } from 'react';
import roadmapData from '../data/roadmap.json';
import { useAuth } from '../auth/AuthContext';
import { NavLink } from 'react-router-dom';
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
                <NavLink 
                  to="/dashboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  <span>Dashboard</span>
                </NavLink>
                <NavLink 
                  to="/roadmap" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined">map</span>
                  <span>Roadmap</span>
                </NavLink>
                <NavLink 
                  to="/notepad" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined">style</span>
                  <span>Note Pad</span>
                </NavLink>
                <NavLink 
                  to="/community" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined">groups</span>
                  <span>Community</span>
                </NavLink>
                <NavLink 
                  to="/analytics" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined">bar_chart</span>
                  <span>Statistics</span>
                </NavLink>
                <NavLink 
                  to="/leaderboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="material-symbols-outlined">bar_chart</span>
                  <span>LeaderBoard</span>
                </NavLink>
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
