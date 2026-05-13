import "./Footer.css"

export default function Footer(){
    return (
        <footer className="landing-footer">
      <div className="footer-container">
        <div className="footer-col footer-brand">
          <div className="footer-logo">
            {/* You can put an svg or img here */}
            <span>LingoPeer</span>
          </div>
          <div className="footer-desc">
            The AI-first platform dedicated to making language mastery accessible to everyone, everywhere.
          </div>
          <div className="footer-socials">
            {/* Placeholder icons, add real svgs/imgs as needed */}
            <span className="footer-social-icon">🌐</span>
            <span className="footer-social-icon">🐦</span>
            <span className="footer-social-icon">🔗</span>
          </div>
        </div>
        <div className="footer-col">
          <div className="footer-heading">Product</div>
          <ul className="footer-links">
            <li><a href="#">AI Tutor</a></li>
            <li><a href="#">Roadmaps</a></li>
            <li><a href="#">Level Test</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <div className="footer-heading">Company</div>
          <ul className="footer-links">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="/help-center">Contact</a></li>
          </ul>
        </div>
        <div className="footer-col footer-newsletter">
          <div className="footer-heading">Newsletter</div>
          <div className="footer-newsletter-desc">Get learning tips and updates.</div>
          <div className="footer-newsletter-form">
            <input type="email" placeholder="Email address" className="footer-newsletter-input" />
            <button className="footer-newsletter-button">Subscribe</button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-left">
          © 2026 LingoPeer. All rights reserved.
        </div>
        <div className="footer-bottom-right">
          <a href="#" className="footer-policy-link">Privacy Policy</a>
          <span className="footer-separator">|</span>
          <a href="#" className="footer-policy-link">Terms of Service</a>
        </div>
      </div>
    </footer>
    )
}