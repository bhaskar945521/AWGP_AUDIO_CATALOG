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
      <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        Developed by <span style={{ color: 'var(--saffron)', fontWeight: '600' }}>Bhaskar</span>
      </div>
    </footer>
  );
}
