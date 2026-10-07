import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import registrationService from '../../services/registrationService.js';
import { eventService } from '../../services/eventService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/admin.css';

export default function AdminRegistrations() {
  const { eventId } = useParams();
  const { hasPermission } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0, rejected: 0 });
  const [events, setEvents] = useState([]);
  const [selectedEventObj, setSelectedEventObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(eventId || '');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(25);

  // Status Modal / Action state
  const [activeModalReg, setActiveModalReg] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const canEdit = hasPermission('registrations.edit');

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load events for filter dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getAdminEvents({ limit: 100 });
        setEvents(res || []);
        if (eventId) {
          const match = res.find((ev) => String(ev.id) === String(eventId));
          setSelectedEventObj(match || null);
        }
      } catch (err) {
        console.error('Failed to load events for filter:', err);
      }
    };
    fetchEvents();
  }, [eventId]);

  // Load registrations
  const loadRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await registrationService.getRegistrations({
        eventId: selectedEventId || undefined,
        status: selectedStatus,
        registrationType: selectedType,
        search: search.trim() || undefined,
        page,
        limit,
      });

      setRegistrations(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
      showNotification('error', err.message || 'Failed to fetch registrations.');
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, selectedStatus, selectedType, search, page, limit]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!activeModalReg || !newStatus) return;

    try {
      setUpdatingStatus(true);
      await registrationService.updateRegistrationStatus(activeModalReg.id, newStatus, statusNotes);
      showNotification('success', `Registration ${activeModalReg.registrationNumber} status changed to ${newStatus}.`);
      setActiveModalReg(null);
      setNewStatus('');
      setStatusNotes('');
      loadRegistrations();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update registration status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleQuickCancel = async (reg) => {
    if (!window.confirm(`Are you sure you want to cancel registration ${reg.registrationNumber}?`)) {
      return;
    }

    try {
      await registrationService.cancelRegistration(reg.id, 'Cancelled by administrator');
      showNotification('success', `Registration ${reg.registrationNumber} was cancelled safely.`);
      loadRegistrations();
    } catch (err) {
      showNotification('error', err.message || 'Failed to cancel registration.');
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
          <h1 className="admin-page-title">
            {selectedEventObj ? `${selectedEventObj.title} — Registrations` : 'Attendee Registrations'}
          </h1>
          <p className="admin-page-desc">
            {selectedEventObj
              ? `Manage and monitor submissions for ${selectedEventObj.title}`
              : 'Real-time attendee registrations, team submissions, and validation records'}
          </p>
        </div>

        <div className="admin-header-actions">
          {selectedEventObj && (
            <Link to="/admin/registrations" className="admin-btn admin-btn-secondary">
              <span>← View All Events</span>
            </Link>
          )}

          <button
            type="button"
            disabled
            className="admin-btn admin-btn-secondary"
            title="Excel & CSV export will be unlocked in Phase 7"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <span>📊 Export to Excel (Phase 7)</span>
          </button>
        </div>
      </div>

      {/* Real-time Summary Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-title">Total Submissions</div>
          <div className="admin-stat-value">{summary.total}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-title">Confirmed</div>
          <div className="admin-stat-value" style={{ color: '#34d399' }}>{summary.confirmed}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-title">Pending Review</div>
          <div className="admin-stat-value" style={{ color: '#fbbf24' }}>{summary.pending}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-title">Cancelled / Inactive</div>
          <div className="admin-stat-value" style={{ color: '#f87171' }}>{summary.cancelled}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="admin-card admin-filters-card" style={{ marginBottom: '24px' }}>
        <div className="admin-filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {/* Search */}
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Search Registrations</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Reg ID, Team, Name, Email..."
              className="admin-input"
            />
          </div>

          {/* Event Filter */}
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setPage(1);
              }}
              className="admin-select"
            >
              <option value="">All Events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="admin-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Registration Type Filter */}
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="admin-select"
            >
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="TEAM">Team</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: 'var(--admin-text-muted)' }}>Loading registrations database...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>No Registrations Found</h3>
            <p style={{ color: 'var(--admin-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
              {search || selectedEventId || selectedStatus !== 'ALL' || selectedType !== 'ALL'
                ? 'No registrations matched your search and filter criteria.'
                : 'No attendees have registered for events yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reg #</th>
                    <th>Event</th>
                    <th>Type / Team</th>
                    <th>Primary Participant</th>
                    <th>Contact</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => {
                    const primary = reg.participants?.[0] || {};
                    return (
                      <tr key={reg.id}>
                        <td>
                          <Link
                            to={`/admin/registrations/${reg.id}`}
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#6366f1',
                              textDecoration: 'none',
                            }}
                          >
                            {reg.registrationNumber}
                          </Link>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>
                            {reg.event?.title || 'Unknown Event'}
                          </div>
                          {reg.event?.category && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>
                              {reg.event.category.name}
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className="admin-badge"
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              background: reg.registrationType === 'TEAM' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              color: reg.registrationType === 'TEAM' ? '#c084fc' : '#38bdf8',
                              border: `1px solid ${reg.registrationType === 'TEAM' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                            }}
                          >
                            {reg.registrationType}
                          </span>
                          {reg.teamName && (
                            <div style={{ fontWeight: 600, marginTop: '4px', fontSize: '0.85rem', color: '#fff' }}>
                              {reg.teamName}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: '#fff' }}>{primary.fullName || '—'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-dim)' }}>
                            {primary.college || '—'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-main)' }}>
                            {primary.email || '—'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-dim)' }}>
                            {primary.mobile || '—'}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#fff' }}>
                            {reg.participants?.length || 1}
                          </span>
                        </td>
                        <td>{getStatusBadge(reg.status)}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(reg.submittedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <Link
                              to={`/admin/registrations/${reg.id}`}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                            >
                              <span>View</span>
                            </Link>

                            {canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveModalReg(reg);
                                    setNewStatus(reg.status);
                                  }}
                                  className="admin-btn admin-btn-secondary admin-btn-sm"
                                  title="Change Status"
                                >
                                  <span>Status</span>
                                </button>

                                {reg.status !== 'CANCELLED' && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickCancel(reg)}
                                    className="admin-btn admin-btn-sm"
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                    title="Cancel Registration"
                                  >
                                    <span>✕</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--admin-border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                  Page {page} of {totalPages} ({summary.total} total items)
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    <span>← Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                  >
                    <span>Next →</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Change Status Modal */}
      {activeModalReg && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
            <h3 style={{ color: '#fff', margin: '0 0 8px' }}>
              Update Registration Status
            </h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: '0 0 20px' }}>
              Updating status for <strong>{activeModalReg.registrationNumber}</strong> ({activeModalReg.teamName || activeModalReg.participants?.[0]?.fullName})
            </p>

            <form onSubmit={handleStatusUpdate}>
              <div className="admin-form-group">
                <label className="admin-label">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="admin-select"
                  required
                >
                  <option value="CONFIRMED">CONFIRMED (Valid / Admitted)</option>
                  <option value="PENDING">PENDING (Under Review)</option>
                  <option value="WAITLISTED">WAITLISTED (Capacity Queue)</option>
                  <option value="CANCELLED">CANCELLED (Safe cancellation)</option>
                  <option value="REJECTED">REJECTED (Invalid entry)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Admin Notes (Optional)</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Reason for status change..."
                  className="admin-input"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModalReg(null)}
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
                  <span>{updatingStatus ? 'Updating...' : 'Save Status'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
