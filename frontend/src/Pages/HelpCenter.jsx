import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './HelpCenter.css';
import { useAuth } from '../auth/AuthContext';

const SUPPORT_EMAIL = 'wteam8064@gmail.com';

function isProbablyValidEmail(value) {
  if (!value) return false;
  // Simple validation to prevent obvious typos.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export default function HelpCenter() {
  const { auth } = useAuth();

  const initialEmail = useMemo(() => {
    return auth.user?.email || auth.profile?.user?.email || '';
  }, [auth.profile?.user?.email, auth.user?.email]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [subject, setSubject] = useState('Help Center - Message');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openMailClient = () => {
    const to = SUPPORT_EMAIL;

    const safeName = name ? String(name).trim() : '';
    const safeEmail = email ? String(email).trim() : '';
    const safeSubject = subject ? String(subject).trim() : 'Help Center - Message';
    const safeMessage = message ? String(message).trim() : '';

    const bodyLines = [
      'Hello LingoPeer team,',
      '',
      safeMessage,
      '',
      '---',
      `From: ${safeName || 'User'}`,
      `Email: ${safeEmail || '(not provided)'}`,
    ];

    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      safeSubject,
    )}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.location.href = mailto;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');

    const safeMessage = message.trim();
    if (safeMessage.length < 10) {
      setError('Please write a bit more (at least 10 characters).');
      return;
    }

    if (!isProbablyValidEmail(email)) {
      setError('Please enter a valid email address so we can reply.');
      return;
    }

    setSubmitting(true);
    // Give the UI a beat before switching apps.
    setTimeout(() => {
      openMailClient();
      setSubmitting(false);
    }, 50);
  };

  return (
    <>
      <NavBar />
      <div className="help-root">
        <div className="help-container">
          <header className="help-header">
            <div>
              <h1 className="help-title">Help Center</h1>
              <p className="help-subtitle">
                Tell us what you need and we’ll respond via email.
              </p>
            </div>
          </header>

          <div className="help-grid">
            <section className="help-card" aria-label="Contact form">
              <form className="help-form" onSubmit={onSubmit}>
                <div className="help-field">
                  <label className="help-label" htmlFor="help-name">
                    Name (optional)
                  </label>
                  <input
                    id="help-name"
                    className="help-input"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    autoComplete="name"
                  />
                </div>

                <div className="help-field">
                  <label className="help-label" htmlFor="help-email">
                    Email
                  </label>
                  <input
                    id="help-email"
                    className="help-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="help-field">
                  <label className="help-label" htmlFor="help-subject">
                    Subject
                  </label>
                  <input
                    id="help-subject"
                    className="help-input"
                    type="text"
                    placeholder="What is this about?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="help-field">
                  <label className="help-label" htmlFor="help-message">
                    Message
                  </label>
                  <textarea
                    id="help-message"
                    className="help-textarea"
                    placeholder="Write your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={submitting}
                    rows={8}
                    required
                  />
                </div>

                {error ? <div className="help-error">{error}</div> : null}

                <button className="help-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Opening email...' : 'Send message'}
                </button>

                <p className="help-smallprint">
                  Contact email: <a className="help-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </p>
              </form>
            </section>

            <aside className="help-side">
              <div className="help-side-card">
                <div className="help-side-title">Quick tips</div>
                <ul className="help-side-list">
                  <li>Include what you were trying to do.</li>
                  <li>Tell us the exact error message (if any).</li>
                  <li>Share steps to reproduce if it’s a bug.</li>
                </ul>

                <div className="help-side-divider" />

                <div className="help-side-note">
                  Prefer browsing? Return to <Link to="/dashboard">Dashboard</Link>.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

