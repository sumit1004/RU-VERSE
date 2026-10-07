import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import coordinatorService from '../../services/coordinatorService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/admin.css';

export default function AdminCoordinators() {
  const { hasPermission, currentUser } = useAuth();

  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

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
  const [savingEvents, setSavingEvents] = useState(false);

  // Password Reset Modal
  const [pwdTarget, setPwdTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);

  const canCreate = hasPermission('coordinators.create') || currentUser?.role?.slug === 'admin';
  const canEdit = hasPermission('coordinators.edit') || currentUser?.role?.slug === 'admin';

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
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
      showNotification('error', err.message || 'Failed to fetch coordinators.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatus, page, limit]);

  useEffect(() => {
    loadCoordinators();
  }, [loadCoordinators]);

  // Create Coordinator Handler
  const handleCreateCoordinator = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await coordinatorService.createCoordinator(createForm);
      showNotification('success', `Coordinator "${createForm.name}" created successfully.`);
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', status: 'ACTIVE' });
      loadCoordinators();
    } catch (err) {
      showNotification('error', err.message || 'Failed to create coordinator.');
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
      showNotification('error', err.message || 'Failed to load permissions.');
    }
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!permTarget) return;

    try {
      setSavingPerms(true);
      await coordinatorService.updatePermissions(permTarget.id, selectedPermSlugs);
      showNotification('success', `Permissions updated for ${permTarget.name}.`);
      setPermTarget(null);
      loadCoordinators();
    } catch (err) {
      showNotification('error', err.message || 'Failed to save permissions.');
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
    } catch (err) {
      showNotification('error', err.message || 'Failed to load event assignments.');
    }
  };

  const handleSaveEvents = async (e) => {
    e.preventDefault();
    if (!eventTarget) return;

    try {
      setSavingEvents(true);
      await coordinatorService.updateEvents(eventTarget.id, selectedEventIds);
      showNotification('success', `Assigned events updated for ${eventTarget.name}.`);
      setEventTarget(null);
      loadCoordinators();
    } catch (err) {
      showNotification('error', err.message || 'Failed to save event assignments.');
    } finally {
      setSavingEvents(false);
    }
  };

  // Status Toggle
  const handleToggleStatus = async (coord) => {
    const nextStatus = coord.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await coordinatorService.updateCoordinator(coord.id, { status: nextStatus });
      showNotification('success', `Coordinator ${coord.name} is now ${nextStatus}.`);
      loadCoordinators();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update status.');
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!pwdTarget || !newPassword) return;

    try {
      setResettingPwd(true);
      await coordinatorService.resetPassword(pwdTarget.id, newPassword);
      showNotification('success', `Password reset successfully for ${pwdTarget.name}.`);
      setPwdTarget(null);
      setNewPassword('');
    } catch (err) {
      showNotification('error', err.message || 'Failed to reset password.');
    } finally {
      setResettingPwd(false);
    }
  };

  // Group permissions by module
  const permsByModule = allPerms.reduce((acc, p) => {
    const mod = p.module ? p.module.toUpperCase() : 'GENERAL';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

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
          <h1 className="admin-page-title">Event Coordinators</h1>
          <p className="admin-page-desc">
            Manage coordinator accounts, granular module permissions, and event assignments
          </p>
        </div>

        <div className="admin-header-actions">
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <span>+ Add Coordinator</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="admin-card admin-filters-card" style={{ marginBottom: '24px' }}>
        <div className="admin-filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Search Coordinators</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Name or email..."
              className="admin-input"
            />
          </div>

          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Account Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="admin-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coordinators Table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: 'var(--admin-text-muted)' }}>Loading coordinators...</p>
          </div>
        ) : coordinators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👥</div>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>No Coordinators Found</h3>
            <p style={{ color: 'var(--admin-text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
              {search || selectedStatus !== 'ALL'
                ? 'No coordinators match your search criteria.'
                : 'No coordinator accounts created yet. Click "+ Add Coordinator" above.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Coordinator</th>
                  <th>Status</th>
                  <th>Permissions</th>
                  <th>Assigned Events</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coordinators.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{c.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--admin-text-dim)' }}>{c.email}</div>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${c.status === 'ACTIVE' ? 'published' : 'archived'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleOpenPerms(c)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <span>🔑 {c.permissions?.length || 0} Permissions</span>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleOpenEvents(c)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <span>🎪 {c.assignedEvents?.length || 0} Events</span>
                      </button>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                      {c.lastLoginAt
                        ? new Date(c.lastLoginAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : 'Never'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          to={`/admin/coordinators/${c.id}`}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                        >
                          <span>View</span>
                        </Link>

                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setPwdTarget(c);
                                setNewPassword('');
                              }}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              title="Reset Password"
                            >
                              <span>🔑 Reset</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(c)}
                              className="admin-btn admin-btn-sm"
                              style={{
                                background: c.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: c.status === 'ACTIVE' ? '#f87171' : '#34d399',
                                border: `1px solid ${c.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                              }}
                              title={c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            >
                              <span>{c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coordinator Modal */}
      {showCreateModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '480px' }}>
            <h3 style={{ color: '#fff', margin: '0 0 8px' }}>Create Event Coordinator</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: '0 0 20px' }}>
              Create an administrative user with scoped permissions.
            </p>

            <form onSubmit={handleCreateCoordinator}>
              <div className="admin-form-group">
                <label className="admin-label">Full Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Alex Mercer"
                  required
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Email Address *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="coordinator@ruverse.in"
                  required
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Password * (Min 8 characters)</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Initial Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  className="admin-select"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="admin-btn admin-btn-secondary"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="admin-btn admin-btn-primary"
                >
                  <span>{creating ? 'Creating...' : 'Create Coordinator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {permTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#fff', margin: '0 0 6px' }}>Manage Permissions</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Assign granular permissions for <strong>{permTarget.name}</strong> ({permTarget.email})
            </p>

            <form onSubmit={handleSavePermissions} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '20px' }}>
                {Object.entries(permsByModule).map(([mod, perms]) => (
                  <div key={mod} style={{ marginBottom: '18px', background: 'var(--admin-bg-elevated)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                      {mod}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {perms.map((p) => {
                        const isChecked = selectedPermSlugs.includes(p.slug);
                        return (
                          <label key={p.slug} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
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
                              style={{ marginTop: '2px' }}
                            />
                            <div>
                              <div style={{ fontWeight: 500, color: isChecked ? '#fff' : '#94a3b8' }}>{p.name}</div>
                              {p.description && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-dim)' }}>{p.description}</div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--admin-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setPermTarget(null)}
                  disabled={savingPerms}
                  className="admin-btn admin-btn-secondary"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={savingPerms}
                  className="admin-btn admin-btn-primary"
                >
                  <span>{savingPerms ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Events Modal */}
      {eventTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#fff', margin: '0 0 6px' }}>Assign Festival Events</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Select which events <strong>{eventTarget.name}</strong> is authorized to coordinate.
            </p>

            <form onSubmit={handleSaveEvents} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', marginBottom: '20px' }}>
                {allEvents.length === 0 ? (
                  <p style={{ color: 'var(--admin-text-dim)' }}>No events available to assign.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {allEvents.map((ev) => {
                      const isAssigned = selectedEventIds.includes(ev.id);
                      return (
                        <label
                          key={ev.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: isAssigned ? 'rgba(99, 102, 241, 0.12)' : 'var(--admin-bg-elevated)',
                            border: `1px solid ${isAssigned ? 'rgba(99, 102, 241, 0.35)' : 'var(--admin-border-subtle)'}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEventIds([...selectedEventIds, ev.id]);
                                } else {
                                  setSelectedEventIds(selectedEventIds.filter((id) => id !== ev.id));
                                }
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, color: isAssigned ? '#fff' : '#cbd5e1' }}>{ev.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-dim)' }}>
                                {ev.category?.name || 'Festival Event'} • {ev.venue}
                              </div>
                            </div>
                          </div>
                          <span className={`admin-status-badge ${ev.isPublished ? 'published' : 'draft'}`} style={{ fontSize: '0.7rem' }}>
                            {ev.isPublished ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--admin-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setEventTarget(null)}
                  disabled={savingEvents}
                  className="admin-btn admin-btn-secondary"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={savingEvents}
                  className="admin-btn admin-btn-primary"
                >
                  <span>{savingEvents ? 'Saving...' : 'Save Assignments'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {pwdTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
            <h3 style={{ color: '#fff', margin: '0 0 8px' }}>Reset Password</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.88rem', margin: '0 0 20px' }}>
              Set new password for <strong>{pwdTarget.name}</strong> ({pwdTarget.email})
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="admin-form-group">
                <label className="admin-label">New Password * (Min 8 characters)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setPwdTarget(null)}
                  disabled={resettingPwd}
                  className="admin-btn admin-btn-secondary"
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={resettingPwd}
                  className="admin-btn admin-btn-primary"
                >
                  <span>{resettingPwd ? 'Resetting...' : 'Reset Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
