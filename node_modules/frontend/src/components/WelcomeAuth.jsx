import React, { useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function WelcomeAuth() {
  const { publicLogin, publicRegister } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await publicLogin(loginEmail, loginPassword);
      if (success) {
        toast.success('Signed in successfully!');
      } else {
        setError('Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await publicRegister(registerName, registerEmail, registerPassword);
      if (success) {
        toast.success('Account created successfully!');
      } else {
        setError('Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background elements */}
      <div className="login-bg-decor login-bg-decor--1" />
      <div className="login-bg-decor login-bg-decor--2" />
      <div className="login-bg-decor login-bg-decor--3" />

      <div className="login-card" style={{ maxWidth: '440px' }}>
        {/* Top saffron accent bar */}
        <div className="login-card-accent" />

        <div className="login-card-body">
          {/* Logo & Heading */}
          <div className="login-header" style={{ marginBottom: 20 }}>
            <div className="login-logo-wrap">
              <Logo size={48} />
            </div>
            <h1 className="login-title">AWGP Audio Hub</h1>
            <p className="login-subtitle">Spiritual Catalog & Media Archive</p>
          </div>

          {/* Form Selector Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <button
              onClick={() => { setIsLoginTab(true); setError(''); }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: isLoginTab ? '2px solid var(--saffron)' : 'none',
                fontWeight: isLoginTab ? 'bold' : 'normal',
                color: isLoginTab ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setError(''); }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: !isLoginTab ? '2px solid var(--saffron)' : 'none',
                fontWeight: !isLoginTab ? 'bold' : 'normal',
                color: !isLoginTab ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-error">
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          {isLoginTab ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="login-field">
                <label className="login-label">Email Address</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <i className="fas fa-envelope" />
                  </span>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="login-input"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <i className="fas fa-lock" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="login-input"
                    placeholder="Enter password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-btn" style={{ marginTop: '8px' }}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="login-form">
              <div className="login-field">
                <label className="login-label">Full Name</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <i className="fas fa-user" />
                  </span>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="login-input"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Email Address</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <i className="fas fa-envelope" />
                  </span>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="login-input"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <i className="fas fa-lock" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="login-input"
                    placeholder="Choose password"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Confirm Password</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <i className="fas fa-lock" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="login-input"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-btn" style={{ marginTop: '8px' }}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="login-footer" style={{ marginTop: 24 }}>
            <div className="login-footer-line" />
            <p className="login-footer-text">
              <i className="fas fa-headphones" />
              Tune into spiritual frequencies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
