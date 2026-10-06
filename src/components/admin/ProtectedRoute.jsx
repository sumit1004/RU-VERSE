import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-scope" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'admin-spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Verifying authorization...</p>
          <style>{`
            @keyframes admin-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="admin-scope" style={{ minHeight: '100vh', padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: '#f87171' }}>Access Denied</h2>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
          You do not have permission ({requiredPermission}) to access this page.
        </p>
      </div>
    );
  }

  return children;
}
