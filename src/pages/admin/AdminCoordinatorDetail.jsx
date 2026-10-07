import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import coordinatorService from '../../services/coordinatorService.js';
import '../../styles/admin.css';

export default function AdminCoordinatorDetail() {
  const { id } = useParams();
  const [coordinator, setCoordinator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCoordinator();
  }, [id]);

  const loadCoordinator = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await coordinatorService.getCoordinator(id);
      setCoordinator(res);
    } catch (err) {
      console.error('Failed to load coordinator detail:', err);
      setError(err.message || 'Coordinator account not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-events-page">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--admin-text-muted)' }}>Loading coordinator details...</p>
        </div>
      </div>
    );
  }

  if (error || !coordinator) {
    return (
      <div className="admin-events-page">
        <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: 'var(--admin-status-danger-text)', marginBottom: '12px' }}>Coordinator Not Found</h2>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '24px' }}>
            {error || 'The requested coordinator account could not be found.'}
          </p>
          <Link to="/admin/coordinators" className="admin-btn admin-btn-primary">
            <span>← Back to Coordinators</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-events-page">
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Link to="/admin/coordinators" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
              ← Coordinators
            </Link>
            <span style={{ color: 'var(--admin-border-subtle)' }}>/</span>
            <span style={{ fontWeight: 600, color: '#6366f1' }}>{coordinator.name}</span>
          </div>
          <h1 className="admin-page-title">{coordinator.name}</h1>
          <p className="admin-page-desc">{coordinator.email}</p>
        </div>

        <div className="admin-header-actions">
          <Link to="/admin/coordinators" className="admin-btn admin-btn-secondary">
            <span>Back to List</span>
          </Link>
        </div>
      </div>

      {/* Profile Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Account Information</h3>
            <span className={`admin-status-badge ${coordinator.status === 'ACTIVE' ? 'published' : 'archived'}`}>
              {coordinator.status}
            </span>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Role:</span>
              <span style={{ fontWeight: 600, color: '#c084fc' }}>{coordinator.role?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Created On:</span>
              <span style={{ color: 'var(--admin-text-main)' }}>
                {new Date(coordinator.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Last Login:</span>
              <span style={{ color: 'var(--admin-text-main)' }}>
                {coordinator.lastLoginAt ? new Date(coordinator.lastLoginAt).toLocaleString('en-IN') : 'Never'}
              </span>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Authorization Summary</h3>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Assigned Permissions:</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }}>{coordinator.permissions?.length || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Assigned Festival Events:</span>
              <span style={{ fontWeight: 700, color: '#34d399' }}>{coordinator.assignedEvents?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Granted Permissions ({coordinator.permissions?.length || 0})</h3>
        </div>
        <div className="admin-card-body">
          {coordinator.permissions?.length === 0 ? (
            <p style={{ color: 'var(--admin-text-dim)' }}>No specific permissions granted yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {coordinator.permissions.map((p) => (
                <div key={p.id} style={{ background: 'var(--admin-bg-elevated)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {p.slug}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assigned Events */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Assigned Events ({coordinator.assignedEvents?.length || 0})</h3>
        </div>
        <div className="admin-card-body">
          {coordinator.assignedEvents?.length === 0 ? (
            <p style={{ color: 'var(--admin-text-dim)' }}>No events assigned to this coordinator.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {coordinator.assignedEvents.map((ev) => (
                <div key={ev.id} style={{ background: 'var(--admin-bg-elevated)', padding: '14px', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{ev.title}</div>
                    <span className={`admin-status-badge ${ev.isPublished ? 'published' : 'draft'}`} style={{ fontSize: '0.68rem' }}>
                      {ev.isPublished ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-dim)' }}>
                    📍 {ev.venue}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
