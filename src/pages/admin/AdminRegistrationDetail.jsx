import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import registrationService from '../../services/registrationService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/admin.css';

export default function AdminRegistrationDetail() {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Status Change State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const canEdit = hasPermission('registrations.edit');

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    loadRegistration();
  }, [id]);

  const loadRegistration = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await registrationService.getRegistration(id);
      setRegistration(res);
      setNewStatus(res.status);
    } catch (err) {
      console.error('Failed to load registration details:', err);
      setError(err.message || 'Failed to load registration details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    try {
      setUpdatingStatus(true);
      await registrationService.updateRegistrationStatus(registration.id, newStatus, statusNotes);
      showNotification('success', `Status updated to ${newStatus}.`);
      setShowStatusModal(false);
      loadRegistration();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="admin-status-badge published">CONFIRMED</span>;
      case 'PENDING':
        return <span className="admin-status-badge upcoming">PENDING</span>;
      case 'CANCELLED':
        return <span className="admin-status-badge archived">CANCELLED</span>;
      case 'REJECTED':
        return <span className="admin-status-badge draft">REJECTED</span>;
      default:
        return <span className="admin-status-badge draft">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="admin-events-page">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--admin-text-muted)' }}>Loading registration snapshot record...</p>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="admin-events-page">
        <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: 'var(--admin-status-danger-text)', marginBottom: '12px' }}>Registration Not Found</h2>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '24px' }}>
            {error || 'The requested registration record could not be retrieved.'}
          </p>
          <Link to="/admin/registrations" className="admin-btn admin-btn-primary">
            <span>← Back to Registrations</span>
          </Link>
        </div>
      </div>
    );
  }

  const { event, form, participants = [], fieldValues = [] } = registration;

  return (
    <div className="admin-events-page">
      {/* Notifications */}
      {notification && (
        <div className={`admin-notification ${notification.type === 'error' ? 'error' : 'success'}`}>
          <span>{notification.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Link
              to="/admin/registrations"
              style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              ← Registrations
            </Link>
            <span style={{ color: 'var(--admin-border-subtle)' }}>/</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>
              {registration.registrationNumber}
            </span>
          </div>
          <h1 className="admin-page-title" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
            {registration.registrationNumber}
          </h1>
          <p className="admin-page-desc">
            Submitted for <strong>{event?.title}</strong> on{' '}
            {new Date(registration.submittedAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>

        <div className="admin-header-actions">
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowStatusModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <span>Update Status</span>
            </button>
          )}

          <Link to={`/admin/events/${event?.id}/registrations`} className="admin-btn admin-btn-secondary">
            <span>Event Registrations</span>
          </Link>
        </div>
      </div>

      {/* Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Registration State Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Registration Status</h3>
            {getStatusBadge(registration.status)}
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Entry Type:</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{registration.registrationType}</span>
            </div>

            {registration.teamName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--admin-text-muted)' }}>Team Name:</span>
                <span style={{ fontWeight: 600, color: '#c084fc' }}>{registration.teamName}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Form Snapshot:</span>
              <span style={{ fontWeight: 500, color: 'var(--admin-text-main)' }}>
                Form #{registration.formId} (Version {registration.formVersion})
              </span>
            </div>

            {registration.cancelledAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--admin-status-danger-text)' }}>Cancelled On:</span>
                <span style={{ color: 'var(--admin-status-danger-text)' }}>
                  {new Date(registration.cancelledAt).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Event Summary Card */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Event Information</h3>
            {event?.category && (
              <span className="admin-badge">{event.category.name}</span>
            )}
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Title:</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{event?.title}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Venue:</span>
              <span style={{ color: 'var(--admin-text-main)' }}>{event?.venue}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--admin-text-muted)' }}>Event Date:</span>
              <span style={{ color: 'var(--admin-text-main)' }}>
                {event?.startDateTime ? new Date(event.startDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Registration-level Snapshot Fields */}
      {fieldValues.length > 0 && (
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <h3 className="admin-card-title">Registration Questionnaire (Snapshot)</h3>
          </div>
          <div className="admin-card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {fieldValues.map((fv) => (
                <div key={fv.id} style={{ background: 'var(--admin-bg-elevated)', padding: '12px 16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {fv.fieldLabel}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
                    {fv.value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Participants List */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            Participants ({participants.length} Member{participants.length === 1 ? '' : 's'})
          </h3>
        </div>
        <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {participants.map((p, idx) => (
            <div
              key={p.id}
              style={{
                background: 'var(--admin-bg-elevated)',
                border: '1px solid var(--admin-border-subtle)',
                borderRadius: '10px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--admin-border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {p.participantOrder || idx + 1}
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>
                      {p.fullName}
                      {idx === 0 && registration.registrationType === 'TEAM' && (
                        <span style={{ fontSize: '0.75rem', marginLeft: '8px', color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                          Team Leader
                        </span>
                      )}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Fixed Baseline Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: p.fieldValues?.length > 0 ? '16px' : '0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>EMAIL ADDRESS</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-main)', marginTop: '2px' }}>
                    {p.email}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>MOBILE NUMBER</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-main)', marginTop: '2px' }}>
                    {p.mobile}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>COLLEGE / INSTITUTION</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-main)', marginTop: '2px' }}>
                    {p.college}
                  </div>
                </div>
              </div>

              {/* Custom Participant Fields Snapshot */}
              {p.fieldValues && p.fieldValues.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--admin-border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Custom Participant Snapshot
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {p.fieldValues.map((cfv) => (
                      <div key={cfv.id}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>
                          {cfv.fieldLabel}
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#fff', marginTop: '2px', wordBreak: 'break-word' }}>
                          {cfv.value || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
            <h3 style={{ color: '#fff', margin: '0 0 8px' }}>Update Registration Status</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: '0 0 20px' }}>
              Registration <strong>{registration.registrationNumber}</strong>
            </p>

            <form onSubmit={handleStatusUpdate}>
              <div className="admin-form-group">
                <label className="admin-label">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="admin-select"
                  required
                >
                  <option value="CONFIRMED">CONFIRMED (Admitted)</option>
                  <option value="PENDING">PENDING (Under Review)</option>
                  <option value="WAITLISTED">WAITLISTED (Queue)</option>
                  <option value="CANCELLED">CANCELLED (Safe cancellation)</option>
                  <option value="REJECTED">REJECTED (Invalid / Disqualified)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Reason / Notes (Optional)</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Provide reason for audit log..."
                  className="admin-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  disabled={updatingStatus}
                  className="admin-btn admin-btn-secondary"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="admin-btn admin-btn-primary"
                >
                  <span>{updatingStatus ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
