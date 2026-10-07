import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-scope" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'radial-gradient(circle at top center, #111726 0%, #090b10 70%)' }}>
      <div style={{ width: '100%', maxWidth: '380px', background: 'var(--ad-bg-surface)', border: '1px solid var(--ad-border-light)', borderRadius: 'var(--ad-radius-lg)', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: 'var(--ad-radius-sm)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>
            RU
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ad-text-primary)', margin: '0 0 0.25rem 0' }}>
            RUVERSE Operations
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ad-text-muted)', margin: 0 }}>
            Festival Admin & Coordinator Portal
          </p>
        </div>

        {errorMessage && (
          <div style={{ padding: '0.65rem 0.85rem', background: 'var(--ad-danger-bg)', color: 'var(--ad-danger-text)', border: '1px solid var(--ad-danger-border)', borderRadius: 'var(--ad-radius-sm)', marginBottom: '1.25rem', fontSize: '0.8125rem' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="admin-email">
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              className="admin-input"
              placeholder="admin@ruverse.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="admin-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.65rem' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
