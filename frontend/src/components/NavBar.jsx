import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { uploadFile, API_BASE_URL } from '../api/client';
import Notifications from './Notifications.jsx';
import './NavBar.css';

function initialsFromName(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function NavBar({ fixed = false, onMenuClick }) {
  const { auth, logout, updateAvatar } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const displayName = auth.profile?.user?.username || auth.user?.username || 'Learner';
  const email = auth.user?.email || auth.profile?.user?.email || '';
  const userAvatar = auth.user?.avatar || auth.profile?.user?.avatar || null;
  const avatarUrl = userAvatar ? (userAvatar.startsWith('http') ? userAvatar : `${API_BASE_URL}${userAvatar.startsWith('/') ? '' : '/'}${userAvatar}`) : null;

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handleAvatarClick = () => {
    setMenuOpen(false);
    setProfileModalOpen(true);
  };

  const handleMobileMenu = () => {
    if (onMenuClick) {
      onMenuClick();
      return;
    }
    window.dispatchEvent(new Event('sidebar:toggle'));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const data = await uploadFile('/api/me/avatar', file);
      if (data.success && data.avatar) {
        updateAvatar(data.avatar);
        // Refresh profile to ensure all components get updated avatar
        await auth.refreshProfile();
      }
      setProfileModalOpen(false);
    } catch (err) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <header className={`roadmap-header ${fixed ? 'roadmap-header--fixed' : ''}`}>
      <div className="header-left">
        <button type="button" className="mobile-menu-button" aria-label="Toggle sidebar" onClick={handleMobileMenu}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Link to="/" className="header-left-link">
          <img
            src="/lingopeer%20logo.png"
            alt="LingoPeer logo"
            className="brand-logo-image"
          />
        </Link>
      </div>
      <div className="dashboard-header">
        <div className="dashboard-search">
          <span className="material-symbols-outlined">search</span>
          <input
            className="dashboard-search-input"
            placeholder="Search courses, tutors, or vocabulary..."
            aria-label="Search"
          />
        </div>
      </div>
      <div className="header-right">
        <nav className="header-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/roadmap">Roadmap</Link>
          <Link to="/community">Community</Link>
        </nav>
        <div className="header-actions" ref={menuRef}>
          <Notifications />
          <button type="button" className="icon-button nav-settings-button" aria-label="Settings" onClick={() => setProfileModalOpen(true)}>
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button
            type="button"
            className="user-avatar user-avatar--button"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((o) => !o)}
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {!avatarUrl && <span className="user-avatar-initials" onClick={handleAvatarClick}>{initialsFromName(displayName)}</span>}
          </button>
          {menuOpen && (
            <div className="profile-menu" role="menu">
              <div className="profile-menu-header">
                <span className="profile-menu-name">{displayName}</span>
                {email ? <span className="profile-menu-email">{email}</span> : null}
              </div>
              <div className="profile-menu-divider" />
              <Link
                to="/dashboard"
                className="profile-menu-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <span className="material-symbols-outlined">person</span>
                Dashboard
              </Link>
              <button type="button" className="profile-menu-item profile-menu-item--danger" role="menuitem" onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {profileModalOpen && (
        <div className="profile-modal-overlay" onClick={() => setProfileModalOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Profile Settings</h3>
              <button type="button" className="profile-modal-close" onClick={() => setProfileModalOpen(false)}>×</button>
            </div>
            <div className="profile-modal-body">
              <div className="profile-modal-avatar" onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} />
                ) : (
                  <span>{initialsFromName(displayName)}</span>
                )}
                <div className="profile-modal-avatar-overlay">Change</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <p className="profile-modal-name">{displayName}</p>
              {email && <p className="profile-modal-email">{email}</p>}
              <button
                type="button"
                className="profile-modal-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Upload New Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
