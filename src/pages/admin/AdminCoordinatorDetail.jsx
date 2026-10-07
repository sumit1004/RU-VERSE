import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import coordinatorService from '../../services/coordinatorService.js';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
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
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
        Loading coordinator details...
      </div>
    );
  }

  if (error || !coordinator) {
    return (
      <div>
        <div className="admin-page-header">
          <Link to="/admin/coordinators" className="admin-btn admin-btn-ghost admin-btn-sm">
            ← Back to Coordinators
          </Link>
        </div>
        <div className="admin-form-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--ad-danger-text)', margin: '0 0 0.5rem 0' }}>Coordinator Not Found</h2>
          <p style={{ color: 'var(--ad-text-muted)', margin: 0 }}>
            {error || 'The requested coordinator profile could not be retrieved.'}
          </p>
        </div>
      </div>
    );
  }

  const assignedEvents = coordinator.assignedEvents || [];
  const permissions = coordinator.permissions || [];

  return (
    <div style={{ maxWidth: '840px' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ marginBottom: '0.35rem' }}>
            <Link to="/admin/coordinators" style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', textDecoration: 'none' }}>
              ← Back to Coordinators
            </Link>
          </div>
          <h1 className="admin-page-title">
            {coordinator.name}
          </h1>
          <p className="admin-page-subtitle">
            {coordinator.email} • Scoped Event Coordinator Profile
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <StatusBadge status={coordinator.status} />
        </div>
      </div>

      {/* Basic Info */}
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Account Information</h3>
        <div className="admin-form-grid-2" style={{ marginTop: '0.75rem', gap: '0.75rem 1.5rem' }}>
          <div>
            <span className="admin-label">Full Name</span>
            <div style={{ fontSize: '0.875rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              {coordinator.name}
            </div>
          </div>
          <div>
            <span className="admin-label">Email Address</span>
            <div style={{ fontSize: '0.875rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              {coordinator.email}
            </div>
          </div>
          <div>
            <span className="admin-label">Role</span>
            <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              {coordinator.role?.name || 'Coordinator'}
            </div>
          </div>
          <div>
            <span className="admin-label">Account Created</span>
            <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              {new Date(coordinator.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Events */}
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">
          Assigned Festival Events ({assignedEvents.length})
        </h3>
        <p className="admin-form-section-desc">
          Events this coordinator is authorized to manage and access attendee registrations for.
        </p>

        {assignedEvents.length === 0 ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-muted)' }}>
            No festival events currently assigned to this coordinator.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {assignedEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--ad-radius-sm)',
                  border: '1px solid var(--ad-border-subtle)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ad-text-primary)' }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', marginTop: '0.2rem' }}>
                  {ev.category?.name} • 📍 {ev.venue || 'TBD'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Granted Permissions */}
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">
          Granted Permissions ({permissions.length})
        </h3>
        <p className="admin-form-section-desc">
          Operational system privileges assigned to this coordinator.
        </p>

        {permissions.length === 0 ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-muted)' }}>
            No explicit user permissions granted.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {permissions.map((p) => (
              <span
                key={p.id}
                style={{
                  background: 'var(--ad-accent-subtle)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--ad-radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}
              >
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
