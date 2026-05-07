import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { initGoogleAuth, renderGoogleButton } from '../utils/googleAuth';
import './LoginPage.css';
import Footer from '../components/Footer';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);


const EyeIcon = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  if (document.getElementById('google-identity-script')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function LoginPage() {
  const { auth, login, googleLogin, isAuthenticating, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!auth.isLoggedIn || location.pathname !== '/login') return;
    if (!auth.placementCompleted) navigate('/placement-test', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [auth.isLoggedIn, auth.placementCompleted, location.pathname, navigate]);

  const googleLoginRef = useRef(googleLogin);
  googleLoginRef.current = googleLogin;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    initGoogleAuth(GOOGLE_CLIENT_ID, async (response) => {
      if (!response?.credential) return;
      const result = await googleLoginRef.current(response.credential);
      if (!result.success) return;
      if (!result.placementCompleted) navigateRef.current('/placement-test', { replace: true });
      else navigateRef.current('/dashboard', { replace: true });
    }).then(() => {
      if (cancelled) return;
      if (googleBtnRef.current) {
        const ok = renderGoogleButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: '100%',
        });
        if (ok) setGoogleReady(true);
      }
    }).catch(() => {
      // Google script failed to load; leave button as-is
    });

    return () => { cancelled = true; };
  }, []);

  const from = location.state?.from;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login({ email, password });
    if (!result.success) return;

    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (!result.placementCompleted) navigate('/placement-test', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  return (
    <>
      {/* Inline Navbar */}
      <header className="login-navbar">
        <Link to="/">
        <div className="login-navbar-brand">
          <img
            src="/lingopeer%20logo.png"
            alt="LingoPeer logo"
            className="login-navbar-logo"
          />
        </div>
        </Link>
        <div className="login-navbar-right">
          <span>Don't have an account?</span>
          <button type="button" className="login-link" onClick={() => navigate('/register')}>
            Sign Up
          </button>
        </div>
      </header>

      <div className="login-root">
        <div className="login-card">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Log in to continue your AI-powered English journey.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email */}
            <label className="login-label">
              <span>Email Address</span>
              <input
                type="email"
                className="login-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            {/* Password */}
            <label className="login-label">
              <div className="login-label-row">
                <span>Password</span>
                <button type="button" className="login-link login-forgot">
                  Forgot password?
                </button>
              </div>
              <div className="login-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  style={{ paddingRight: '42px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            {authError ? <p className="login-error-text">{authError}</p> : null}

            <button type="submit" className="login-primary-btn" disabled={isAuthenticating}>
              {isAuthenticating ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="login-divider">
            <span />
            <p>OR CONTINUE WITH</p>
            <span />
          </div>

          <div className="login-google-wrapper">
            <div ref={googleBtnRef} className="google-btn-container" style={{ opacity: googleReady ? 1 : 0 }} />
            {!googleReady && (
              <div className="google-btn-skeleton">
                <GoogleIcon />
                <span>Continue with Google</span>
              </div>
            )}
          </div>

          <p className="login-bottom-text">
            Don't have an account?{' '}
            <button type="button" className="login-link" onClick={() => navigate('/register')}>
              Sign up for free
            </button>
          </p>
        </div>

        <p className="login-footer-text">© 2024 AI English Lab. All rights reserved.</p>
      </div>
      <Footer />
    </>
  );
}