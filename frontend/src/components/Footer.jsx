import React from 'react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo size={34} />
          <div>
            <div className="footer-brand-name">AWGP Audio Hub</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Shantikunj, Haridwar</div>
          </div>
        </div>

        <div className="footer-copy">
          © {new Date().getFullYear()} AWGP. All rights reserved.
        </div>

        <div className="footer-links">
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Use</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  );
}
