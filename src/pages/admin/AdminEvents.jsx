import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/admin/StatusBadge';
import Toast from '../../components/admin/Toast';
import '../../styles/admin.css';

export default function AdminEvents() {
  const { hasPermission, currentUser } = useAuth();
  const isAdmin = currentUser?.role?.slug === 'admin';

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Archive & Delete Confirm Modals
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission('events.create') || isAdmin;
  const canEdit = hasPermission('events.edit') || isAdmin;
  const canArchive = hasPermission('events.archive') || isAdmin;
  const canDelete = hasPermission('events.archive') || isAdmin;
  const canManageForms = hasPermission('forms.view') || isAdmin;
  const canViewRegs = hasPermission('registrations.view') || isAdmin;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsData, categoriesData] = await Promise.all([
        eventService.getAdminEvents({
          search: search.trim() || undefined,
          categoryId: selectedCategory || undefined,
          status: selectedStatus || undefined,
          registrationType: selectedType || undefined,
          includeArchived,
        }),
        categoryService.getAdminCategories(),
      ]);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      showToast('error', err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus, selectedType, includeArchived]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePublish = async (event) => {
    try {
      await eventService.patchEventPublish(event.id, !event.isPublished);
      showToast('success', `"${event.title}" is now ${!event.isPublished ? 'Published' : 'Draft'}.`);
      loadData();
    } catch (err) {
      showToast('error', err.message || 'Failed to update publish status.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      setIsArchiving(true);
      await eventService.patchArchive(archiveTarget.id, true);
      showToast('success', `"${archiveTarget.title}" has been archived.`);
      setArchiveTarget(null);
      loadData();
    } catch (err) {
      showToast('error', err.message || 'Failed to archive event.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (event) => {
    try {
      await eventService.patchArchive(event.id, false);
      showToast('success', `"${event.title}" has been restored from archive.`);
      loadData();
    } catch (err) {
      showToast('error', err.message || 'Failed to restore event.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await eventService.deleteEvent(deleteTarget.id);
      showToast('success', `"${deleteTarget.title}" has been permanently deleted.`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete event.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Festival Events
          </h1>
          <p className="admin-page-subtitle">
            Configure competitions, venues, registration rules, team bounds, and dynamic forms.
          </p>
        </div>

        {canCreate && (
          <Link to="/admin/events/create" className="admin-btn admin-btn-primary admin-btn-sm">
            + New Event
          </Link>
        )}
      </div>

      {/* Metric Strip */}
      <div className="admin-metric-strip">
        <div className="admin-metric-item">
          <span>Total Events:</span>
          <strong>{events.length}</strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Published Live:</span>
          <strong style={{ color: 'var(--ad-success-text)' }}>
            {events.filter((e) => e.isPublished && !e.archivedAt).length}
          </strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Drafts:</span>
          <strong style={{ color: 'var(--ad-warning-text)' }}>
            {events.filter((e) => !e.isPublished && !e.archivedAt).length}
          </strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Archived:</span>
          <strong style={{ color: 'var(--ad-neutral-text)' }}>
            {events.filter((e) => e.archivedAt).length}
          </strong>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search-wrapper">
            <input
              type="text"
              className="admin-input admin-search-input"
              placeholder="Search by event title, venue, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="admin-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="TEAM">Team</option>
          </select>

          <select
            className="admin-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>

          <label className="admin-checkbox-item" style={{ marginLeft: '0.25rem' }}>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--ad-text-secondary)' }}>Include Archived</span>
          </label>
        </div>

        <div className="admin-toolbar-right">
          {(search || selectedCategory || selectedType || selectedStatus || includeArchived) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('');
                setSelectedType('');
                setSelectedStatus('');
                setIncludeArchived(false);
              }}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Events Table */}
      {loading ? (
        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="admin-table-container">
          <div className="admin-empty-state">
            <div className="admin-empty-title">No events found</div>
            <div className="admin-empty-desc">Create your first event competition or adjust your filter selection.</div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Category</th>
                <th>Venue & Dates</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const startDateStr = ev.startDateTime
                  ? new Date(ev.startDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'TBD';

                return (
                  <tr key={ev.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        <Link to={`/admin/events/${ev.id}`} style={{ color: 'var(--ad-text-primary)', textDecoration: 'none' }}>
                          {ev.title}
                        </Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>
                        /{ev.slug}
                      </div>
                    </td>
                    <td style={{ color: 'var(--ad-text-secondary)' }}>
                      {ev.category?.name || '—'}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)' }}>{ev.venue || 'TBD'}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>{startDateStr}</div>
                    </td>
                    <td>
                      <StatusBadge status={ev.registrationType} />
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-secondary)' }}>
                      {ev.registrationLimit ? `${ev.registrationLimit} max` : 'Unlimited'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <StatusBadge status={ev.archivedAt ? 'ARCHIVED' : ev.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="admin-table-actions" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Link to={`/admin/events/${ev.id}`} className="admin-btn admin-btn-ghost admin-btn-sm">
                          View
                        </Link>

                        {canViewRegs && (
                          <Link to={`/admin/events/${ev.id}/registrations`} className="admin-btn admin-btn-secondary admin-btn-sm" title="View Registrations">
                            Regs
                          </Link>
                        )}

                        {canManageForms && (
                          <Link to={`/admin/events/${ev.id}/form`} className="admin-btn admin-btn-secondary admin-btn-sm" title="Configure Registration Form">
                            Form
                          </Link>
                        )}

                        {canEdit && (
                          <Link to={`/admin/events/${ev.id}/edit`} className="admin-btn admin-btn-ghost admin-btn-sm">
                            Edit
                          </Link>
                        )}

                        {canEdit && !ev.archivedAt && (
                          <button
                            onClick={() => handleTogglePublish(ev)}
                            className={`admin-btn admin-btn-sm ${ev.isPublished ? 'admin-btn-secondary' : 'admin-btn-success'}`}
                          >
                            {ev.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                        )}

                        {canArchive && !ev.archivedAt && (
                          <button
                            onClick={() => setArchiveTarget(ev)}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            title="Archive Event"
                          >
                            Archive
                          </button>
                        )}

                        {canArchive && ev.archivedAt && (
                          <button
                            onClick={() => handleRestore(ev)}
                            className="admin-btn admin-btn-success admin-btn-sm"
                            title="Restore Event from Archive"
                          >
                            Restore
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(ev)}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            style={{ color: 'var(--ad-danger-text)' }}
                            title="Delete Event Permanently"
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
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {archiveTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Archive Event</h3>
              <button onClick={() => setArchiveTarget(null)} className="admin-modal-close">×</button>
            </div>

            <div className="admin-modal-body">
              <p style={{ color: 'var(--ad-text-primary)', margin: '0 0 0.5rem 0' }}>
                Are you sure you want to archive <strong>{archiveTarget.title}</strong>?
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', margin: 0 }}>
                This event will be unpublished and hidden from public portal schedules while historical registration datasets remain preserved.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button type="button" onClick={() => setArchiveTarget(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={handleArchive}
                className="admin-btn admin-btn-primary admin-btn-sm"
              >
                {isArchiving ? 'Archiving...' : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: 'var(--ad-danger-text)' }}>Delete Event</h3>
              <button onClick={() => setDeleteTarget(null)} className="admin-modal-close">×</button>
            </div>

            <div className="admin-modal-body">
              <p style={{ color: 'var(--ad-text-primary)', margin: '0 0 0.5rem 0' }}>
                Are you sure you want to permanently delete <strong>{deleteTarget.title}</strong>?
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', margin: 0 }}>
                This action is irreversible. It will delete the event, its custom registration form builder schema, and coordinator assignments. Events with active registrations must be archived instead.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button type="button" onClick={() => setDeleteTarget(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="admin-btn admin-btn-danger admin-btn-sm"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
