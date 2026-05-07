import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { initGoogleAuth, renderGoogleButton } from '../utils/googleAuth';
import './RegisterPage.css';
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

function calculatePasswordStrength(pwd) {
  if (!pwd) return { strength: 'Weak', percentage: 0, color: '#ef4444' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[a-z]/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
  if (score <= 2) return { strength: 'Weak', percentage: 33, color: '#ef4444' };
  if (score <= 4) return { strength: 'Medium', percentage: 66, color: '#3b82f6' };
  return { strength: 'Strong', percentage: 100, color: '#22c55e' };
}

export default function RegisterPage() {
  const { register, googleLogin, logout, isAuthenticating, authError } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = useRef(null);

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

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      const result = await register({ name: fullName, email, password });
      if (!result.success) {
        alert(result.message || 'Registration failed.');
        logout();
        return;
      }
      navigate('/placement-test', { replace: true });
    } catch (err) {
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <>
      {/* Inline Navbar */}
      <header className="register-navbar">
        <Link to="/">
        <div className="register-navbar-brand">
          <img
            src="/lingopeer%20logo.png"
            alt="LingoPeer logo"
            className="register-navbar-logo"
          />
        </div>
        </Link>
        <div className="register-navbar-right">
          <span>Already have an account?</span>
          <button
            type="button"
            className="register-link"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            Log In
          </button>
        </div>
      </header>

      <div className="register-root">
        <div className="register-card">
          <h1 className="register-title">Start Your Journey</h1>
          <p className="register-subtitle">Personalized language learning powered by AI.</p>

          <form className="register-form" onSubmit={handleSubmit}>
            {/* Full Name */}
            <label className="register-label">
              <span>Full Name</span>
              <input
                type="text"
                className="register-input"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>

            {/* Email */}
            <label className="register-label">
              <span>Email Address</span>
              <input
                type="email"
                className="register-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            {/* Password */}
            <label className="register-label">
              <span>Password</span>
              <div className="register-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="register-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '42px' }}
                  required
                />
                <button
                  type="button"
                  className="register-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {password && (
                <div className="register-strength">
                  <div className="register-strength-bar">
                    <div
                      className="register-strength-fill"
                      style={{ width: `${strength.percentage}%`, background: strength.color }}
                    />
                  </div>
                  <p className="register-strength-text">
                    Strength: <span style={{ color: strength.color }}>{strength.strength}</span>
                  </p>
                </div>
              )}
            </label>

            {/* Confirm Password */}
            <label className="register-label">
              <span>Confirm Password</span>
              <div className="register-input-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="register-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingRight: '42px' }}
                  required
                />
                <button
                  type="button"
                  className="register-eye-btn"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </label>

            {authError ? <p className="login-error-text">{authError}</p> : null}

            <button type="submit" className="register-primary-btn" disabled={isAuthenticating}>
              {isAuthenticating ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="register-divider">
            <span />
            <p>OR SIGN UP WITH</p>
            <span />
          </div>

          <div className="register-google-wrapper">
            <div ref={googleBtnRef} className="google-btn-container" style={{ opacity: googleReady ? 1 : 0 }} />
            {!googleReady && (
              <div className="google-btn-skeleton">
                <GoogleIcon />
                <span>Continue with Google</span>
              </div>
            )}
          </div>

          <p className="register-bottom-text">
            By signing up, you agree to our{' '}
            <button type="button" className="register-link">Terms of Service</button>{' '}
            and{' '}
            <button type="button" className="register-link">Privacy Policy</button>.
          </p>
        </div>

        <p className="register-footer-text">© 2024 AI English Lab. All rights reserved.</p>
      </div>
      <Footer />
    </>
  );
}