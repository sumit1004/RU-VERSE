import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import coordinatorService from '../../services/coordinatorService.js';
import { eventService } from '../../services/eventService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Toast from '../../components/admin/Toast.jsx';
import '../../styles/admin.css';

export default function AdminCoordinators() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role?.slug === 'admin';

  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 25;

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    status: 'ACTIVE',
    permissions: ['dashboard.view', 'events.view', 'forms.view', 'registrations.view'],
    eventIds: [],
  });
  const [creating, setCreating] = useState(false);

  // Permissions Modal
  const [permTarget, setPermTarget] = useState(null);
  const [allPerms, setAllPerms] = useState([]);
  const [selectedPermSlugs, setSelectedPermSlugs] = useState([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Events Modal
  const [eventTarget, setEventTarget] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [eventFilterTerm, setEventFilterTerm] = useState('');
  const [savingEvents, setSavingEvents] = useState(false);

  // Password Reset Modal
  const [pwdTarget, setPwdTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);

  // Delete Coordinator Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingCoord, setDeletingCoord] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCoordinators = useCallback(async () => {
    try {
      setLoading(true);
      const res = await coordinatorService.getCoordinators({
        search: search.trim() || undefined,
        status: selectedStatus,
        page,
        limit,
      });

      setCoordinators(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load coordinators:', err);
      showToast('error', err.message || 'Failed to fetch coordinators.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatus, page]);

  useEffect(() => {
    loadCoordinators();
  }, [loadCoordinators]);

  // Load events & perms for create modal on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const evts = await eventService.getAdminEvents({ limit: 100 });
        setAllEvents(Array.isArray(evts) ? evts : []);
      } catch (e) {
        console.error('Error loading events:', e);
      }
    }
    loadMeta();
  }, []);

  // Create Coordinator Handler
  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await coordinatorService.createCoordinator(createForm);
      showToast('success', `Coordinator "${createForm.name}" created successfully.`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        status: 'ACTIVE',
        permissions: ['dashboard.view', 'events.view', 'forms.view', 'registrations.view'],
        eventIds: [],
      });
      loadCoordinators();
    } catch (err) {
      showToast('error', err.message || 'Failed to create coordinator.');
    } finally {
      setCreating(false);
    }
  };

  // Open Permissions Modal
  const handleOpenPerms = async (coord) => {
    try {
      setPermTarget(coord);
      const res = await coordinatorService.getPermissions(coord.id);
      setAllPerms(res.allPermissions || []);
      setSelectedPermSlugs(res.assignedSlugs || []);
    } catch (err) {
      showToast('error', 'Failed to load permissions matrix.');
    }
  };

  // Save Permissions
  const handleSavePerms = async (e) => {
    e.preventDefault();
    if (!permTarget) return;

    try {
      setSavingPerms(true);
      await coordinatorService.updatePermissions(permTarget.id, selectedPermSlugs);
      showToast('success', `Permissions updated for ${permTarget.name}.`);
      setPermTarget(null);
      loadCoordinators();
    } catch (err) {
      showToast('error', err.message || 'Failed to update permissions.');
    } finally {
      setSavingPerms(false);
    }
  };

  // Open Events Modal
  const handleOpenEvents = async (coord) => {
    try {
      setEventTarget(coord);
      const res = await coordinatorService.getEvents(coord.id);
      setAllEvents(res.allEvents || []);
      setSelectedEventIds(res.assignedEventIds || []);
      setEventFilterTerm('');
    } catch (err) {
      showToast('error', 'Failed to load coordinator event assignments.');
    }
  };

  // Save Events
  const handleSaveEvents = async (e) => {
    e.preventDefault();
    if (!eventTarget) return;

    try {
      setSavingEvents(true);
      await coordinatorService.updateEvents(eventTarget.id, selectedEventIds);
      showToast('success', `Event assignments updated for ${eventTarget.name}.`);
      setEventTarget(null);
      loadCoordinators();
    } catch (err) {
      showToast('error', err.message || 'Failed to update event assignments.');
    } finally {
      setSavingEvents(false);
    }
  };

  // Password Reset Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!pwdTarget || !newPassword) return;

    try {
      setResettingPwd(true);
      await coordinatorService.resetPassword(pwdTarget.id, newPassword);
      showToast('success', `Password reset for ${pwdTarget.name}.`);
      setPwdTarget(null);
      setNewPassword('');
    } catch (err) {
      showToast('error', err.message || 'Failed to reset password.');
    } finally {
      setResettingPwd(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (coord) => {
    const newStat = coord.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await coordinatorService.updateCoordinator(coord.id, { status: newStat });
      showToast('success', `Coordinator ${coord.name} set to ${newStat}.`);
      loadCoordinators();
    } catch (err) {
      showToast('error', err.message || 'Failed to update coordinator status.');
    }
  };

  // Delete Coordinator
  const handleDeleteCoordinator = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingCoord(true);
      await coordinatorService.deleteCoordinator(deleteTarget.id);
      showToast('success', `Coordinator "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      loadCoordinators();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete coordinator.');
    } finally {
      setDeletingCoord(false);
    }
  };

  // Group permissions by module
  const groupedPerms = allPerms.reduce((acc, p) => {
    const mod = p.module || 'General';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <div>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Coordinator Management
          </h1>
          <p className="admin-page-subtitle">
            Create event managers, assign granular permissions, and scope festival event access boundaries.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            + Add Coordinator
          </button>
        )}
      </div>

      {/* Metric Strip */}
      <div className="admin-metric-strip">
        <div className="admin-metric-item">
          <span>Total Coordinators:</span>
          <strong>{coordinators.length}</strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Active:</span>
          <strong style={{ color: 'var(--ad-success-text)' }}>
            {coordinators.filter((c) => c.status === 'ACTIVE').length}
          </strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Inactive:</span>
          <strong style={{ color: 'var(--ad-danger-text)' }}>
            {coordinators.filter((c) => c.status === 'INACTIVE').length}
          </strong>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-wrapper">
            <input
              type="text"
              className="admin-input admin-search-input"
              placeholder="Search coordinators by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="admin-select"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="admin-toolbar-right">
          {(search || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedStatus('ALL');
                setPage(1);
              }}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Coordinators Table */}
      {loading ? (
        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
          Loading coordinators...
        </div>
      ) : coordinators.length === 0 ? (
        <div className="admin-table-container">
          <div className="admin-empty-state">
            <div className="admin-empty-title">No coordinators found</div>
            <div className="admin-empty-desc">
              Create an administrative user with scoped permissions to delegate festival arena operations.
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Coordinator</th>
                <th>Status</th>
                <th>Assigned Events</th>
                <th>Permissions</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coordinators.map((coord) => {
                const assignedEvts = coord.assignedEvents || [];
                const perms = coord.permissions || [];
                return (
                  <tr key={coord.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        <Link to={`/admin/coordinators/${coord.id}`} style={{ color: 'var(--ad-text-primary)', textDecoration: 'none' }}>
                          {coord.name}
                        </Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>{coord.email}</div>
                    </td>
                    <td>
                      <StatusBadge status={coord.status} />
                    </td>
                    <td>
                      {assignedEvts.length === 0 ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ad-text-dim)' }}>None assigned</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', maxWidth: '240px' }}>
                          {assignedEvts.slice(0, 2).map((ev) => (
                            <span key={ev.id} style={{ fontSize: '0.6875rem', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.45rem', borderRadius: 'var(--ad-radius-xs)', color: 'var(--ad-text-secondary)' }}>
                              {ev.title}
                            </span>
                          ))}
                          {assignedEvts.length > 2 && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>
                              +{assignedEvts.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ad-text-secondary)' }}>
                        {perms.length} permission{perms.length === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(coord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEvents(coord)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="Assign Events"
                        >
                          Events
                        </button>
                        <button
                          onClick={() => handleOpenPerms(coord)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="Assign Permissions"
                        >
                          Permissions
                        </button>
                        <button
                          onClick={() => {
                            setPwdTarget(coord);
                            setNewPassword('');
                          }}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="Reset Password"
                        >
                          Password
                        </button>
                        <button
                          onClick={() => handleToggleStatus(coord)}
                          className={`admin-btn admin-btn-sm ${coord.status === 'ACTIVE' ? 'admin-btn-danger' : 'admin-btn-success'}`}
                        >
                          {coord.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(coord)}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            style={{ color: 'var(--ad-danger-text)' }}
                            title="Delete Coordinator"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span>Page {page} of {totalPages}</span>
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

      {/* CREATE COORDINATOR MODAL */}
      {showCreateModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create Coordinator</h3>
              <button onClick={() => setShowCreateModal(false)} className="admin-modal-close">×</button>
            </div>

            <form onSubmit={handleCreateCoordinator}>
              <div className="admin-modal-body">
                {/* 1. Basic Information */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ad-text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem 0' }}>
                    1. Basic Information
                  </h4>
                  <div className="admin-form-grid-2">
                    <div className="admin-form-group">
                      <label className="admin-label">Full Name</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Alex Johnson"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Email Address</label>
                      <input
                        type="email"
                        className="admin-input"
                        placeholder="coord@ruverse.in"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Password</label>
                      <input
                        type="password"
                        className="admin-input"
                        placeholder="Min. 8 characters"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Account Status</label>
                      <select
                        className="admin-select"
                        value={createForm.status}
                        onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Assigned Events */}
                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ad-text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem 0' }}>
                    2. Event Access Assignment
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', margin: '0 0 0.75rem 0' }}>
                    Select the festival events this coordinator is authorized to manage.
                  </p>

                  <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--ad-border-subtle)', borderRadius: 'var(--ad-radius-sm)', padding: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      {allEvents.map((ev) => {
                        const checked = createForm.eventIds.includes(ev.id);
                        return (
                          <label key={ev.id} className="admin-checkbox-item">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCreateForm({ ...createForm, eventIds: [...createForm.eventIds, ev.id] });
                                } else {
                                  setCreateForm({ ...createForm, eventIds: createForm.eventIds.filter((id) => id !== ev.id) });
                                }
                              }}
                            />
                            <span>{ev.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="admin-btn admin-btn-secondary admin-btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="admin-btn admin-btn-primary admin-btn-sm">
                  {creating ? 'Creating...' : 'Create Coordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERMISSIONS MATRIX MODAL */}
      {permTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Permissions — {permTarget.name}</h3>
              <button onClick={() => setPermTarget(null)} className="admin-modal-close">×</button>
            </div>

            <form onSubmit={handleSavePerms}>
              <div className="admin-modal-body">
                <p style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', margin: '0 0 1rem 0' }}>
                  Enable or disable specific system actions for this coordinator account.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {Object.entries(groupedPerms).map(([moduleName, perms]) => (
                    <div key={moduleName} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--ad-radius-sm)', border: '1px solid var(--ad-border-subtle)' }}>
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ad-accent)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.65rem 0' }}>
                        {moduleName}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        {perms.map((p) => {
                          const isChecked = selectedPermSlugs.includes(p.slug);
                          return (
                            <label key={p.id} className="admin-checkbox-item">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPermSlugs([...selectedPermSlugs, p.slug]);
                                  } else {
                                    setSelectedPermSlugs(selectedPermSlugs.filter((s) => s !== p.slug));
                                  }
                                }}
                              />
                              <div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)' }}>{p.name}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>{p.slug}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setPermTarget(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={savingPerms} className="admin-btn admin-btn-primary admin-btn-sm">
                  {savingPerms ? 'Saving...' : 'Save Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT ASSIGNMENT MODAL */}
      {eventTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Assigned Events — {eventTarget.name}</h3>
              <button onClick={() => setEventTarget(null)} className="admin-modal-close">×</button>
            </div>

            <form onSubmit={handleSaveEvents}>
              <div className="admin-modal-body">
                <div className="admin-search-wrapper" style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="text"
                    className="admin-input admin-search-input"
                    placeholder="Search events to assign..."
                    value={eventFilterTerm}
                    onChange={(e) => setEventFilterTerm(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--ad-border-subtle)', borderRadius: 'var(--ad-radius-sm)', padding: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {allEvents
                      .filter((ev) => !eventFilterTerm || ev.title.toLowerCase().includes(eventFilterTerm.toLowerCase()))
                      .map((ev) => {
                        const isChecked = selectedEventIds.includes(ev.id);
                        return (
                          <label key={ev.id} className="admin-checkbox-item">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEventIds([...selectedEventIds, ev.id]);
                                } else {
                                  setSelectedEventIds(selectedEventIds.filter((id) => id !== ev.id));
                                }
                              }}
                            />
                            <div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)' }}>{ev.title}</div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>
                                {ev.category?.name} • {ev.venue || 'TBD'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setEventTarget(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={savingEvents} className="admin-btn admin-btn-primary admin-btn-sm">
                  {savingEvents ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {pwdTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Reset Password — {pwdTarget.name}</h3>
              <button onClick={() => setPwdTarget(null)} className="admin-modal-close">×</button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">New Password</label>
                  <input
                    type="password"
                    className="admin-input"
                    placeholder="Enter new strong password (min. 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <span className="admin-helper-text">
                    The coordinator will need to authenticate with this new password on their next login.
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setPwdTarget(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={resettingPwd} className="admin-btn admin-btn-primary admin-btn-sm">
                  {resettingPwd ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE COORDINATOR CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: 'var(--ad-danger-text)' }}>
                Delete Coordinator
              </h3>
              <button onClick={() => setDeleteTarget(null)} className="admin-modal-close">×</button>
            </div>

            <div className="admin-modal-body">
              <p style={{ color: 'var(--ad-text-primary)', margin: '0 0 0.5rem 0' }}>
                Are you sure you want to permanently delete coordinator <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ad-text-muted)', margin: 0, lineHeight: 1.5 }}>
                This action will revoke all access permissions, unassign them from events, and permanently remove the account credentials. This action cannot be undone.
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
                disabled={deletingCoord}
                onClick={handleDeleteCoordinator}
                className="admin-btn admin-btn-danger admin-btn-sm"
              >
                {deletingCoord ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
