import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: 'Email address is required.' }));
      return;
    }
    if (!password) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password is required.' }));
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-scope admin-login-wrapper">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <span className="admin-login-badge">Portal Access</span>
          <h1 className="admin-login-title">RUVERSE ADMIN</h1>
          <p className="admin-login-subtitle">
            Sign in with your festival administrator or coordinator credentials
          </p>
        </div>

        {errorMessage && (
          <div className="admin-alert admin-alert-danger">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="admin-email">
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              className="admin-form-input"
              placeholder="admin@ruverse.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
            {fieldErrors.email && (
              <div className="admin-form-error">{fieldErrors.email}</div>
            )}
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="admin-form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
            {fieldErrors.password && (
              <div className="admin-form-error">{fieldErrors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary admin-btn-full"
            disabled={isSubmitting}
            style={{ marginTop: '1rem' }}
          >
            {isSubmitting ? 'Authenticating...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}
