import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import registrationService from '../../services/registrationService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Toast from '../../components/admin/Toast.jsx';
import '../../styles/admin.css';

export default function AdminRegistrationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, currentUser } = useAuth();
  const isAdmin = currentUser?.role?.slug === 'admin';

  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Status Change State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingReg, setDeletingReg] = useState(false);

  const canEdit = hasPermission('registrations.edit') || isAdmin;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
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
      setStatusNotes(res.statusNotes || '');
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
      showToast('success', `Status updated to ${newStatus}.`);
      setShowStatusModal(false);
      loadRegistration();
    } catch (err) {
      showToast('error', err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteRegistration = async () => {
    try {
      setDeletingReg(true);
      await registrationService.deleteRegistration(registration.id);
      navigate('/admin/registrations');
    } catch (err) {
      showToast('error', err.message || 'Failed to delete registration.');
      setShowDeleteModal(false);
    } finally {
      setDeletingReg(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
        Loading registration details...
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div>
        <div className="admin-page-header">
          <Link to="/admin/registrations" className="admin-btn admin-btn-ghost admin-btn-sm">
            ← Back to Registrations
          </Link>
        </div>
        <div className="admin-form-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--ad-danger-text)', margin: '0 0 0.5rem 0' }}>Registration Not Found</h2>
          <p style={{ color: 'var(--ad-text-muted)', margin: 0 }}>
            {error || 'The requested registration record could not be retrieved.'}
          </p>
        </div>
      </div>
    );
  }

  const participants = registration.participants || [];

  return (
    <div>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ marginBottom: '0.35rem' }}>
            <Link to="/admin/registrations" style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', textDecoration: 'none' }}>
              ← Back to Registrations
            </Link>
          </div>
          <h1 className="admin-page-title" style={{ fontFamily: 'var(--ad-font-mono)' }}>
            {registration.registrationNumber}
          </h1>
          <p className="admin-page-subtitle">
            {registration.event?.title} • Submitted {new Date(registration.submittedAt).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <StatusBadge status={registration.status} />
          {canEdit && (
            <>
              <button
                onClick={() => setShowStatusModal(true)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                Update Status
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="admin-btn admin-btn-danger admin-btn-sm"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Information Bar */}
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Registration Overview</h3>
        <div className="admin-form-grid-2" style={{ marginTop: '0.75rem', gap: '0.75rem 1.5rem' }}>
          <div>
            <span className="admin-label">Event Name</span>
            <div style={{ fontSize: '0.875rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              {registration.event?.title}
            </div>
          </div>
          <div>
            <span className="admin-label">Registration Type</span>
            <div style={{ marginTop: '0.15rem' }}>
              <StatusBadge status={registration.registrationType} />
            </div>
          </div>
          {registration.teamName && (
            <div>
              <span className="admin-label">Team Name</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
                {registration.teamName}
              </div>
            </div>
          )}
          <div>
            <span className="admin-label">Total Participants</span>
            <div style={{ fontSize: '0.875rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              {participants.length} member{participants.length === 1 ? '' : 's'}
            </div>
          </div>
          {registration.statusNotes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="admin-label">Status Notes</span>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-secondary)', marginTop: '0.15rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: 'var(--ad-radius-sm)' }}>
                {registration.statusNotes}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Participants List */}
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">
          Participant Records ({participants.length})
        </h3>
        <p className="admin-form-section-desc">
          Individual attendee contact details and form field responses.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {participants.map((p, idx) => (
            <div
              key={p.id || idx}
              style={{
                border: '1px solid var(--ad-border-subtle)',
                borderRadius: 'var(--ad-radius-sm)',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ad-accent)' }}>
                  {idx === 0 && registration.teamName ? 'Team Leader' : `Participant #${idx + 1}`}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>
                  Order: {p.participantOrder || idx + 1}
                </span>
              </div>

              <div className="admin-form-grid-2" style={{ gap: '0.75rem 1.5rem' }}>
                <div>
                  <span className="admin-label">Full Name</span>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ad-text-primary)' }}>
                    {p.fullName}
                  </div>
                </div>
                <div>
                  <span className="admin-label">Email Address</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--ad-text-primary)' }}>
                    {p.email}
                  </div>
                </div>
                <div>
                  <span className="admin-label">Mobile Number</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--ad-text-primary)' }}>
                    {p.mobile}
                  </div>
                </div>
                <div>
                  <span className="admin-label">College / Institution</span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--ad-text-primary)' }}>
                    {p.college}
                  </div>
                </div>

                {/* Custom Participant Fields if any */}
                {p.fieldValues && p.fieldValues.length > 0 && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--ad-border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ad-text-muted)', marginBottom: '0.5rem' }}>
                      Additional Responses
                    </div>
                    <div className="admin-form-grid-2" style={{ gap: '0.5rem 1.5rem' }}>
                      {p.fieldValues.map((fv) => (
                        <div key={fv.id}>
                          <span className="admin-label">{fv.fieldKey?.replace(/_/g, ' ')}</span>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-secondary)' }}>
                            {fv.value || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registration Level Custom Fields (if any) */}
      {registration.fieldValues && registration.fieldValues.length > 0 && (
        <div className="admin-form-section">
          <h3 className="admin-form-section-title">Registration Submission Details</h3>
          <div className="admin-form-grid-2" style={{ marginTop: '0.75rem' }}>
            {registration.fieldValues.map((rfv) => (
              <div key={rfv.id}>
                <span className="admin-label">{rfv.fieldKey?.replace(/_/g, ' ')}</span>
                <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
                  {rfv.value || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Update Status — {registration.registrationNumber}</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleStatusUpdate}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">Status</label>
                  <select
                    className="admin-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="WAITLISTED">WAITLISTED</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Status Change Notes</label>
                  <textarea
                    className="admin-textarea"
                    rows="3"
                    placeholder="Enter reason or verification notes..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  {updatingStatus ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE REGISTRATION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: 'var(--ad-danger-text)' }}>
                Delete Registration
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="admin-modal-close">×</button>
            </div>

            <div className="admin-modal-body">
              <p style={{ color: 'var(--ad-text-primary)', margin: '0 0 0.5rem 0' }}>
                Are you sure you want to permanently delete registration <strong>#{registration.registrationNumber}</strong> for <strong>"{registration.event?.title}"</strong>?
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ad-text-muted)', margin: 0, lineHeight: 1.5 }}>
                This action will delete all participant entries, dynamic form field responses, and verification records associated with this registration. This action cannot be undone.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="admin-btn admin-btn-secondary admin-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingReg}
                onClick={handleDeleteRegistration}
                className="admin-btn admin-btn-danger admin-btn-sm"
              >
                {deletingReg ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
