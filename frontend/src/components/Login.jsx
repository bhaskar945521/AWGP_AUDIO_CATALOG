import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, token } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
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

      <div className="login-card">
        {/* Top saffron accent bar */}
        <div className="login-card-accent" />

        <div className="login-card-body">
          {/* Logo & Heading */}
          <div className="login-header">
            <div className="login-logo-wrap">
              <Logo />
            </div>
            <h1 className="login-title">Admin Console</h1>
            <p className="login-subtitle">AWGP Audio Hub Management</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="login-error">
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <i className="fas fa-user" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  placeholder="Username"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  placeholder="Password"
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

            <button
              type="submit"
              disabled={loading}
              className="login-btn"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <div className="login-footer-line" />
            <p className="login-footer-text">
              <i className="fas fa-shield-alt" />
              Authorized personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

