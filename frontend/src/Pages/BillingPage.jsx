import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import './BillingPage.css';

export default function BillingPage() {
  const navigate = useNavigate();
  const [plansData, setPlansData] = useState(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch('/api/billing/plans', { auth: false });
        if (!cancelled) setPlansData(data);
      } catch {
        if (!cancelled) setPlansData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = async (priceId, flow) => {
    if (!priceId) {
      setPayError('This plan price is not configured yet.');
      return;
    }
    setPayBusy(true);
    setPayError('');
    try {
      const data = await apiFetch('/api/billing/checkout', {
        method: 'POST',
        body: { priceId, flow },
      });
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Checkout unavailable');
    } finally {
      setPayBusy(false);
    }
  };

  const individual = plansData?.plans?.find((p) => p.id === 'individual');
  const school = plansData?.plans?.find((p) => p.id === 'school');

  return (
    <div className="billing-root">
      <header className="billing-header">
        <div className="billing-logo">
          <img src="/lingopeer logo 2.png" alt="LingoPeer logo" className="billing-logo-image" />
        </div>
        <nav className="billing-nav">
          <button type="button" onClick={() => navigate('/roadmap')}>Roadmap</button>
          <button type="button" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button type="button" onClick={() => navigate('/notepad')}>Notes</button>
        </nav>
      </header>
      <main className="billing-page-main">
        <Link to="/roadmap" className="billing-back-link">
          ← Back to roadmap
        </Link>
        <h1 className="billing-title">Plans & billing</h1>
        <p className="billing-subtitle">Simple pricing with clear features.</p>
        {payError ? <p className="billing-error">{payError}</p> : null}

        <div className="billing-plan-grid">
          <section className="billing-plan-card">
            <h2>Free</h2>
            <p className="billing-price">$0</p>
            <ul className="billing-feature-list">
              <li>Week 1 lessons</li>
              <li>Basic learning flow</li>
              <li>Limited AI tutor usage</li>
            </ul>
          </section>

          <section className="billing-plan-card billing-plan-card--featured">
            <h2>Individual</h2>
            <p className="billing-price">$12.99<span>/month</span></p>
            <ul className="billing-feature-list">
              <li>All lessons and levels</li>
              <li>Personalized AI roadmap</li>
              <li>Progress analytics + AI-generated lessons</li>
            </ul>
            <button
              type="button"
              className="billing-btn billing-btn-primary"
              onClick={() => startCheckout(individual?.stripe_price_monthly, 'individual')}
              disabled={payBusy}
            >
              Pay Individual
            </button>
          </section>

          <section className="billing-plan-card billing-plan-card--org">
            <h2>School / Org</h2>
            <p className="billing-price">$8<span>/seat</span></p>
            <ul className="billing-feature-list">
              <li>Multi-user student management</li>
              <li>Admin controls and dashboard</li>
              <li>Group reporting and insights</li>
            </ul>
            <button
              type="button"
              className="billing-btn billing-btn-primary"
              onClick={() => startCheckout(school?.stripe_price_seat_monthly, 'school')}
              disabled={payBusy}
            >
              Pay School / Org
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
