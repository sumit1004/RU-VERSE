import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import registrationService from '../../services/registrationService.js';
import { eventService } from '../../services/eventService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Toast from '../../components/admin/Toast.jsx';
import '../../styles/admin.css';

export default function AdminRegistrations() {
  const { eventId: urlEventId } = useParams();
  const { hasPermission, currentUser } = useAuth();
  const isAdmin = currentUser?.role?.slug === 'admin';

  const [registrations, setRegistrations] = useState([]);
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0, rejected: 0 });
  const [events, setEvents] = useState([]);
  const [selectedEventObj, setSelectedEventObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedEventId, setSelectedEventId] = useState(urlEventId || '');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  // Status Change Modal
  const [activeModalReg, setActiveModalReg] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete Registration Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingReg, setDeletingReg] = useState(false);

  const canEdit = hasPermission('registrations.edit') || isAdmin;
  const canExport = hasPermission('registrations.export') || isAdmin;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch available events for filtering
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventService.getAdminEvents({ limit: 100 });
        const list = Array.isArray(res) ? res : [];
        setEvents(list);
        if (selectedEventId) {
          const match = list.find((ev) => String(ev.id) === String(selectedEventId));
          setSelectedEventObj(match || null);
        } else {
          setSelectedEventObj(null);
        }
      } catch (err) {
        console.error('Failed to load events for filter:', err);
      }
    };
    fetchEvents();
  }, [selectedEventId]);

  // 2. Fetch registrations
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
      showToast('error', err.message || 'Failed to fetch registrations.');
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, selectedStatus, selectedType, search, page]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  // Handle Event Selector change
  const handleEventChange = (e) => {
    const eid = e.target.value;
    setSelectedEventId(eid);
    setPage(1);
    const match = events.find((ev) => String(ev.id) === String(eid));
    setSelectedEventObj(match || null);
  };

  // Event-Specific or Global Excel Export
  const handleExport = async () => {
    if (!canExport) {
      showToast('error', 'You do not have permission to export registrations.');
      return;
    }

    try {
      setExporting(true);
      const query = new URLSearchParams();
      if (selectedEventId) query.append('eventId', selectedEventId);
      if (selectedStatus && selectedStatus !== 'ALL') query.append('status', selectedStatus);
      if (selectedType && selectedType !== 'ALL') query.append('registrationType', selectedType);

      const res = await fetch(`/api/admin/registrations/export?${query.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Export failed.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const eventNameSanitized = selectedEventObj ? selectedEventObj.slug : 'all_events';
      a.download = `registrations_${eventNameSanitized}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast('success', 'Registration export downloaded successfully.');
    } catch (err) {
      showToast('error', err.message || 'Failed to export registrations.');
    } finally {
      setExporting(false);
    }
  };

  // Status Modal Submit
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!activeModalReg || !newStatus) return;

    try {
      setUpdatingStatus(true);
      await registrationService.updateRegistrationStatus(activeModalReg.id, newStatus, statusNotes);
      showToast('success', `Registration ${activeModalReg.registrationNumber} status changed to ${newStatus}.`);
      setActiveModalReg(null);
      setNewStatus('');
      setStatusNotes('');
      loadRegistrations();
    } catch (err) {
      showToast('error', err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Registration
  const handleDeleteRegistration = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingReg(true);
      await registrationService.deleteRegistration(deleteTarget.id);
      showToast('success', `Registration ${deleteTarget.registrationNumber} deleted successfully.`);
      setDeleteTarget(null);
      if (registrations.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        loadRegistrations();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to delete registration.');
    } finally {
      setDeletingReg(false);
    }
  };

  return (
    <div>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Registrations
          </h1>
          <p className="admin-page-subtitle">
            Manage attendee submissions, review team bounds, update confirmation statuses, and export datasets.
          </p>
        </div>

        {canExport && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="admin-btn admin-btn-success admin-btn-sm"
          >
            <span>{exporting ? 'Exporting...' : '↓ Export Dataset (.csv)'}</span>
          </button>
        )}
      </div>

      {/* Metric Strip */}
      <div className="admin-metric-strip">
        <div className="admin-metric-item">
          <span>Total:</span>
          <strong>{summary.total}</strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Confirmed:</span>
          <strong style={{ color: 'var(--ad-success-text)' }}>{summary.confirmed}</strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Pending:</span>
          <strong style={{ color: 'var(--ad-warning-text)' }}>{summary.pending}</strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Cancelled / Rejected:</span>
          <strong style={{ color: 'var(--ad-danger-text)' }}>{summary.cancelled + summary.rejected}</strong>
        </div>
      </div>

      {/* Event Context Workspace Banner (When an event is selected) */}
      {selectedEventObj && (
        <div className="admin-event-workspace-bar">
          <div className="admin-event-workspace-info">
            <div className="admin-event-workspace-title">
              {selectedEventObj.title}
            </div>
            <div className="admin-event-workspace-meta">
              Venue: {selectedEventObj.venue || 'Main Campus'} • Type: {selectedEventObj.registrationType} • Capacity: {selectedEventObj.registrationLimit || 'Unlimited'}
            </div>
          </div>
          {canExport && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              <span>Export {selectedEventObj.title} (.csv)</span>
            </button>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          {/* Search Input */}
          <div className="admin-search-wrapper">
            <input
              type="text"
              className="admin-input admin-search-input"
              placeholder="Search by reg #, participant, team..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Event Filter Select */}
          <select
            className="admin-select"
            value={selectedEventId}
            onChange={handleEventChange}
          >
            <option value="">All Events ({events.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            className="admin-select"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
            <option value="WAITLISTED">Waitlisted</option>
          </select>

          {/* Registration Type Select */}
          <select
            className="admin-select"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="TEAM">Team</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          {(search || selectedEventId || selectedStatus !== 'ALL' || selectedType !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedEventId('');
                setSelectedStatus('ALL');
                setSelectedType('ALL');
                setSelectedEventObj(null);
                setPage(1);
              }}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Registrations Data Table */}
      {loading ? (
        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
          Loading registrations...
        </div>
      ) : registrations.length === 0 ? (
        <div className="admin-table-container">
          <div className="admin-empty-state">
            <div className="admin-empty-title">No registrations found</div>
            <div className="admin-empty-desc">
              {search || selectedEventId || selectedStatus !== 'ALL'
                ? 'Try adjusting your search keywords or filter criteria.'
                : 'Registrations will appear here as soon as participants submit the event registration form.'}
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reg #</th>
                <th>Event</th>
                <th>Type</th>
                <th>Participant / Team</th>
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
                const participantCount = reg.participants?.length || 1;
                const submittedDate = reg.submittedAt
                  ? new Date(reg.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—';

                return (
                  <tr key={reg.id}>
                    {/* Reg # */}
                    <td style={{ fontFamily: 'var(--ad-font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                      <Link
                        to={`/admin/registrations/${reg.id}`}
                        style={{ color: 'var(--ad-text-primary)', textDecoration: 'none' }}
                      >
                        {reg.registrationNumber}
                      </Link>
                    </td>

                    {/* Event */}
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--ad-text-secondary)' }}>{reg.event?.title || '—'}</span>
                    </td>

                    {/* Type */}
                    <td>
                      <StatusBadge status={reg.registrationType} />
                    </td>

                    {/* Participant / Team */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{reg.teamName || primary.fullName || '—'}</div>
                      {reg.teamName && primary.fullName && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>
                          Leader: {primary.fullName}
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>
                      <div>{primary.email || '—'}</div>
                      <div>{primary.mobile || ''}</div>
                    </td>

                    {/* Members Count */}
                    <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-secondary)' }}>
                      {participantCount} {participantCount === 1 ? 'member' : 'members'}
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={reg.status} />
                    </td>

                    {/* Date */}
                    <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', whiteSpace: 'nowrap' }}>
                      {submittedDate}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                        <Link
                          to={`/admin/registrations/${reg.id}`}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                        >
                          View
                        </Link>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => {
                                setActiveModalReg(reg);
                                setNewStatus(reg.status);
                                statusNotes && setStatusNotes(reg.statusNotes || '');
                              }}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                            >
                              Status
                            </button>
                            <button
                              onClick={() => setDeleteTarget(reg)}
                              className="admin-btn admin-btn-ghost admin-btn-sm"
                              style={{ color: 'var(--ad-danger-text)' }}
                              title="Delete Registration"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <span>
                Page {page} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Update Modal */}
      {activeModalReg && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Update Status — {activeModalReg.registrationNumber}</h3>
              <button
                onClick={() => setActiveModalReg(null)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleStatusUpdate}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">Registration Status</label>
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
                  <label className="admin-label">Internal Notes (Optional)</label>
                  <textarea
                    className="admin-textarea"
                    rows="3"
                    placeholder="Add operational notes regarding this status change..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setActiveModalReg(null)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  {updatingStatus ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE REGISTRATION CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: 'var(--ad-danger-text)' }}>
                Delete Registration
              </h3>
              <button onClick={() => setDeleteTarget(null)} className="admin-modal-close">×</button>
            </div>

            <div className="admin-modal-body">
              <p style={{ color: 'var(--ad-text-primary)', margin: '0 0 0.5rem 0' }}>
                Are you sure you want to permanently delete registration <strong>#{deleteTarget.registrationNumber}</strong> for event <strong>"{deleteTarget.event?.title}"</strong>?
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ad-text-muted)', margin: 0, lineHeight: 1.5 }}>
                This will delete all participant entries, questionnaire field responses, and verification logs associated with this registration number. This action cannot be undone.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
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
