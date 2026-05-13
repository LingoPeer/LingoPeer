import { useEffect, useMemo, useState } from 'react';
import roadmapData from '../data/roadmap.json';
import { useAuth } from '../auth/AuthContext';
import { NavLink } from 'react-router-dom';
import "./SideBar.css"

export default function SideBar({ open, onClose }){
    const { auth, refreshProfile } = useAuth();
    const [data] = useState(roadmapData);
    const [isInternalOpen, setIsInternalOpen] = useState(false);
    const isControlled = typeof open === 'boolean';
    const isOpen = isControlled ? open : isInternalOpen;

    const closeSidebar = useMemo(() => {
      return () => {
        if (isControlled) {
          onClose?.();
        } else {
          setIsInternalOpen(false);
        }
      };
    }, [isControlled, onClose]);

    const toggleSidebar = useMemo(() => {
      return () => {
        if (isControlled) {
          if (isOpen) onClose?.();
        } else {
          setIsInternalOpen((prev) => !prev);
        }
      };
    }, [isControlled, isOpen, onClose]);

    useEffect(() => {
      refreshProfile();
    }, [refreshProfile]);

    useEffect(() => {
      const onToggle = () => toggleSidebar();
      const onClose = () => closeSidebar();
      const onOpen = () => {
        if (isControlled) return;
        setIsInternalOpen(true);
      };
      const onResize = () => {
        if (window.innerWidth > 1024 && !isControlled) {
          setIsInternalOpen(false);
        }
      };

      window.addEventListener('sidebar:toggle', onToggle);
      window.addEventListener('sidebar:close', onClose);
      window.addEventListener('sidebar:open', onOpen);
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('sidebar:toggle', onToggle);
        window.removeEventListener('sidebar:close', onClose);
        window.removeEventListener('sidebar:open', onOpen);
        window.removeEventListener('resize', onResize);
      };
    }, [closeSidebar, isControlled, toggleSidebar]);

    const goalText =
      auth.profile?.roadmap?.content?.vocabulary_goals?.[0] || data.goal;
    const levelText = auth.profile?.level?.cefr || 'Level';
    const xpPct = Math.min(100, auth.profile?.analytics?.xp_progress_percent ?? 0);
    const streakDays = auth.profile?.analytics?.streak_days ?? 0;
    const xpTotal = auth.profile?.analytics?.xp_total ?? 0;

    return(
    <>
    {isOpen && <div className="sidebar-overlay open" onClick={closeSidebar} />}
    <aside className={`roadmap-sidebar ${isOpen ? 'is-open' : ''}`}>
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
                  onClick={closeSidebar}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  <span>Dashboard</span>
                </NavLink>
                <NavLink 
                  to="/roadmap" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <span className="material-symbols-outlined">map</span>
                  <span>Roadmap</span>
                </NavLink>
                <NavLink 
                  to="/notepad" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <span className="material-symbols-outlined">style</span>
                  <span>Note Pad</span>
                </NavLink>
                <NavLink 
                  to="/community" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <span className="material-symbols-outlined">groups</span>
                  <span>Community</span>
                </NavLink>
                <NavLink 
                  to="/analytics" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
                >
                  <span className="material-symbols-outlined">bar_chart</span>
                  <span>Statistics</span>
                </NavLink>
                <NavLink 
                  to="/leaderboard" 
                  className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={closeSidebar}
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
            <NavLink
              to="/help-center"
              className="help-button"
              onClick={closeSidebar}
            >
              Help Center
            </NavLink>
            </div>
       </aside>
       </>
    )
}
