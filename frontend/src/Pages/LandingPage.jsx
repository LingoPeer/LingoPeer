import './LandingPage.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import fastTrackLearning from '../assets/fast-track-learning.jpeg';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleTakeTest = () => {
    navigate('/register');
  };

  const handlePricingAction = (plan) => {
    if (plan === 'free') navigate('/register');
    else if (plan === 'individual') navigate('/register');
    else navigate('/login');
  };

  return (
    <div className="landing-root">

      {/* {this is the temp nav bar - remove it and replace with the NavBar component} */}
      <header className="landing-header">
        <div className="landing-logo">
          <img
            src="/lingopeer logo 2.png"
            alt="LingoPeer logo"
            className="landing-logo-image"
          />
        </div>

        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#about">About</a>
        </nav>

        <div className="landing-header-actions">
          <button className="landing-link-button" onClick={handleLogin}>Login</button>
          <button className="landing-outline-button" onClick={handleGetStarted}>
            Get Started
          </button>
        </div>
      </header>
{/* {this is the main content of the landing page} */}
      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-left">
            <div className="landing-pill">NEXT-GEN LANGUAGE TECH</div>

            <h1 className="landing-title">
              Learn English <span className="landing-title-highlight">Smarter</span> with AI
            </h1>

            <p className="landing-subtitle">
              Master English through personalized conversations and a curriculum that adapts to your pace. No
              more generic lessons—just focused practice that feels natural.
            </p>

            <div className="landing-cta-row">
              <button className="landing-primary-button" onClick={handleGetStarted}>
                Start Your Journey
              </button>
              <button className="landing-secondary-button" onClick={handleTakeTest}>Take Free Test</button>
            </div>

            <div className="landing-social-proof">
              <div className="landing-avatars">
                <div className="avatar-circle avatar-1" />
                <div className="avatar-circle avatar-2" />
                <div className="avatar-circle avatar-3" />
              </div>
              <div className="landing-social-text">
                <span className="landing-social-label">Joined by 10,000+ fluent speakers</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-right">
            <div className="landing-hero-card">
              <div className="landing-hero-image-wrapper">
                <img
                  className="landing-hero-image"
                  src="https://images.pexels.com/photos/1181395/pexels-photo-1181395.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="People learning English"
                />

                <div className="landing-score-badge">
                  <div className="badge-indicator" />
                  <div className="badge-text">
                    <span className="badge-label">Pronunciation</span>
                    <span className="badge-score">Perfect Score! 98%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

    <main>
      <section className="landing-why-section">
        <span className="landing-why-eyebrow">WHY LingoPeer?</span>
        <h2 className="landing-why-title">
          Experience the Future of <br /> Language Learning
        </h2>
        <p className="landing-why-subtitle">
          Our AI-powered platform provides the tools you need to reach fluency faster through immersion and real-time correction.
        </p>
        <div className="landing-why-cards">
          <div className="landing-why-card">
            <div className="landing-why-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="8" fill="#EEF3FF"/><g><rect x="8" y="7" width="12" height="3" rx="1" fill="#2563EB"/><rect x="8" y="13" width="8" height="3" rx="1" fill="#2563EB"/><rect x="8" y="19" width="5" height="3" rx="1" fill="#2563EB"/></g></svg>
            </div>
            <h3 className="landing-why-card-title">24/7 AI Tutor</h3>
            <p className="landing-why-card-text">
              Practice speaking anytime with our intelligent tutor that understands context and nuance. No more scheduling anxiety.
            </p>
          </div>
          <div className="landing-why-card">
            <div className="landing-why-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="8" fill="#EEF3FF"/><g><rect x="10" y="7" width="8" height="3" rx="1" fill="#2563EB"/><rect x="10" y="14" width="8" height="3" rx="1" fill="#2563EB"/></g></svg>
            </div>
            <h3 className="landing-why-card-title">Personalized Roadmap</h3>
            <p className="landing-why-card-text">
              A curriculum that evolves with your progress, focusing on your specific weaknesses and professional goals.
            </p>
          </div>
          <div className="landing-why-card">
            <div className="landing-why-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="8" fill="#EEF3FF"/><g><path d="M8 20l6-10 6 10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="14" cy="18" r="1" fill="#2563EB"/></g></svg>
            </div>
            <h3 className="landing-why-card-title">Instant Feedback</h3>
            <p className="landing-why-card-text">
              Receive immediate corrections on grammar, pronunciation, and vocabulary usage during every conversation session.
            </p>
          </div>
        </div>
      </section>
    </main>

    <section className="landing-path-section">
      <div className="landing-path-container">
        <div className="landing-path-image-card">
          <img
            src={fastTrackLearning}
            alt="Student fast-tracking learning"
            className="landing-path-image"
          />
          <div className="landing-path-caption">
            <span className="landing-path-caption-title">Fast-track your learning.</span>
            <span className="landing-path-caption-subtitle">
              90% of students reach B2 level in 6 months.
            </span>
          </div>
        </div>
        <div className="landing-path-content">
          <h2 className="landing-path-title">
            Your Path to Fluency
          </h2>
          <p className="landing-path-desc">
            We guide you through every step of your language journey with precision.
          </p>
          <ol className="landing-path-steps">
            <li className="landing-path-step active">
              <span className="landing-path-step-icon">
                <svg width="24" height="24" fill="none"><circle cx="12" cy="12" r="12" fill="#2563EB"/><rect x="8" y="11" width="8" height="2" rx="1" fill="#fff"/></svg>
              </span>
              <div>
                <div className="landing-path-step-title">Placement Test</div>
                <div className="landing-path-step-desc">Our 15-minute diagnostic identifies your exact starting CEFR level.</div>
              </div>
            </li>
            <li className="landing-path-step current">
              <span className="landing-path-step-icon">
                <svg width="24" height="24" fill="none"><circle cx="12" cy="12" r="12" fill="#2563EB" fillOpacity="0.13"/><circle cx="12" cy="12" r="5" fill="#2563EB"/></svg>
              </span>
              <div>
                <div className="landing-path-step-title">Skill Analysis</div>
                <div className="landing-path-step-desc">AI maps out your vocabulary gaps and grammar blind spots.</div>
              </div>
            </li>
            <li className="landing-path-step">
              <span className="landing-path-step-icon">
                <svg width="24" height="24" fill="none"><circle cx="12" cy="12" r="12" fill="#E0E7EF"/><circle cx="12" cy="12" r="5" fill="#A9AFB8"/></svg>
              </span>
              <div>
                <div className="landing-path-step-title">Daily Interaction</div>
                <div className="landing-path-step-desc">15-minute interactive sessions designed to fit into your busy schedule.</div>
              </div>
            </li>
            <li className="landing-path-step">
              <span className="landing-path-step-icon">
                <svg width="24" height="24" fill="none"><circle cx="12" cy="12" r="12" fill="#E0E7EF"/><path d="M8 12l3 3 5-5" stroke="#A9AFB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <div>
                <div className="landing-path-step-title">Total Fluency</div>
                <div className="landing-path-step-desc">Achieve natural flow in both casual and professional environments.</div>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <section id="pricing" className="landing-pricing-section">
      <div className="landing-pricing-header">
        <span className="landing-why-eyebrow">Pricing</span>
        <h2 className="landing-pricing-title">Choose your plan</h2>
        <p className="landing-pricing-subtitle">
          Start free, then unlock full AI learning and organization tools when you are ready.
        </p>
      </div>
      <div className="landing-pricing-grid">
        <article className="landing-pricing-card">
          <h3>Free</h3>
          <p className="landing-pricing-price">$0</p>
          <ul>
            <li>Week 1 lessons</li>
            <li>Basic learning flow</li>
            <li>Limited AI tutor usage</li>
          </ul>
          <button className="landing-secondary-button landing-pricing-btn" onClick={() => handlePricingAction('free')}>
            Start free
          </button>
        </article>

        <article className="landing-pricing-card landing-pricing-card-featured">
          <div className="landing-pricing-badge">Most popular</div>
          <h3>Individual</h3>
          <p className="landing-pricing-price">$12.99<span>/month</span></p>
          <ul>
            <li>All lessons and levels</li>
            <li>Personalized AI roadmap</li>
            <li>Progress analytics + AI-generated lessons</li>
          </ul>
          <button className="landing-primary-button landing-pricing-btn" onClick={() => handlePricingAction('individual')}>
            Get individual
          </button>
        </article>

        <article className="landing-pricing-card">
          <h3>School / Organization</h3>
          <p className="landing-pricing-price">$8<span>/seat</span></p>
          <ul>
            <li>Multi-user student management</li>
            <li>Admin controls and dashboard</li>
            <li>Group reporting and insights</li>
          </ul>
          <button className="landing-outline-button landing-pricing-btn" onClick={() => handlePricingAction('school')}>
            Contact / Login
          </button>
        </article>
      </div>
    </section>

    <section className="landing-diagnostic-cta-section">
      <div className="landing-diagnostic-cta-card">
        <h2 className="landing-diagnostic-cta-title">
          Ready to find your English<br />level?
        </h2>
        <p className="landing-diagnostic-cta-desc">
          Take our 15-minute diagnostic test to see where you stand and get your custom plan.
        </p>
        <button className="landing-diagnostic-cta-button" onClick={handleTakeTest}>
          Take Free Test Now
        </button>
        <div className="landing-diagnostic-cta-note">
          No credit card required
        </div>
      </div>
    </section>

    <Footer />

      {/*  */}
    </div>
  );
}