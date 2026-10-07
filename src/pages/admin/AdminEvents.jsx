import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function AdminEvents() {
  const { hasPermission } = useAuth();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Archive Confirm Modal
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const canCreate = hasPermission('events.create');
  const canEdit = hasPermission('events.edit');
  const canArchive = hasPermission('events.archive');
  const canManageForms = hasPermission('forms.view');

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsData, categoriesData] = await Promise.all([
        eventService.getAdminEvents({
          search,
          categoryId: selectedCategory,
          status: selectedStatus,
          registrationType: selectedType,
          includeArchived,
        }),
        categoryService.getAdminCategories(),
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (err) {
      showNotification('error', err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus, selectedType, includeArchived]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePublish = async (event) => {
    try {
      const nextState = !event.isPublished;
      await eventService.patchPublish(event.id, nextState);
      showNotification('success', `Event "${event.title}" ${nextState ? 'published' : 'unpublished'} successfully.`);
      await loadData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update publication status.');
    }
  };

  const handleToggleActive = async (event) => {
    try {
      const nextState = !event.isActive;
      await eventService.patchStatus(event.id, nextState);
      showNotification('success', `Event "${event.title}" ${nextState ? 'activated' : 'deactivated'} successfully.`);
      await loadData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update active status.');
    }
  };

  const handleToggleFeatured = async (event) => {
    try {
      const nextState = !event.isFeatured;
      await eventService.patchFeatured(event.id, nextState);
      showNotification('success', `Event "${event.title}" ${nextState ? 'marked as featured' : 'unmarked as featured'}.`);
      await loadData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update featured flag.');
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      setIsArchiving(true);
      const willArchive = !archiveTarget.archivedAt;
      await eventService.patchArchive(archiveTarget.id, willArchive);
      showNotification('success', `Event "${archiveTarget.title}" ${willArchive ? 'archived' : 'restored'} successfully.`);
      setArchiveTarget(null);
      await loadData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to archive event.');
    } finally {
      setIsArchiving(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN': return 'admin-badge-open';
      case 'UPCOMING': return 'admin-badge-upcoming';
      case 'CLOSED': return 'admin-badge-closed';
      case 'ARCHIVED': return 'admin-badge-archived';
      default: return 'admin-badge-draft';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0' }}>
            Event Management
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9375rem' }}>
            Create, configure, schedule, and publish RUVERSE festival events
          </p>
        </div>

        {canCreate && (
          <Link to="/admin/events/create" className="admin-btn admin-btn-primary">
            <span>+ Create Event</span>
          </Link>
        )}
      </div>

      {notification && (
        <div className={`admin-alert ${notification.type === 'success' ? 'admin-alert-success' : 'admin-alert-danger'}`}>
          {notification.message}
        </div>
      )}

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <input
          type="text"
          className="admin-form-input admin-filter-input"
          placeholder="🔍 Search event title, slug, venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="admin-form-select admin-filter-select"
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
          className="admin-form-select admin-filter-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="TEAM">Team</option>
          <option value="BOTH">Individual / Team</option>
        </select>

        <select
          className="admin-form-select admin-filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Deactivated</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <label className="admin-checkbox-label" style={{ fontSize: '0.8125rem' }}>
          <input
            type="checkbox"
            className="admin-checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          <span>Include Archived</span>
        </label>
      </div>

      {/* Events Table */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ margin: '0 0 1rem 0' }}>No festival events match your search/filters.</p>
            {canCreate && (
              <Link to="/admin/events/create" className="admin-btn admin-btn-primary admin-btn-sm">
                Create First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event & Category</th>
                  <th>Venue & Dates</th>
                  <th>Registration Type</th>
                  <th>Status</th>
                  <th>Form</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9375rem' }}>
                          {ev.title}
                        </div>
                        {ev.isFeatured && (
                          <span style={{ fontSize: '0.6875rem', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.4)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                            ★ FEATURED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        <span style={{ color: '#818cf8', fontWeight: 600 }}>{ev.category?.name}</span> • <code>{ev.slug}</code>
                      </div>
                    </td>

                    <td>
                      <div style={{ color: '#e2e8f0', fontSize: '0.8125rem', fontWeight: 600 }}>
                        📍 {ev.venue}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        📅 {new Date(ev.startDateTime).toLocaleDateString()}
                      </div>
                    </td>

                    <td>
                      <span className="admin-badge-type">
                        {ev.registrationType}
                        {ev.registrationType === 'TEAM' && ev.teamMinSize && ` (${ev.teamMinSize}-${ev.teamMaxSize})`}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span className={`admin-badge ${getStatusBadgeClass(ev.registrationStatus)}`}>
                          {ev.registrationStatus}
                        </span>
                        {!ev.isPublished && (
                          <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>(Draft)</span>
                        )}
                        {ev.isPublished && !ev.isActive && (
                          <span style={{ fontSize: '0.6875rem', color: '#f87171' }}>(Inactive)</span>
                        )}
                      </div>
                    </td>

                    <td>
                      {canManageForms ? (
                        <Link
                          to={`/admin/events/${ev.id}/form`}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        >
                          📋 Form Builder
                        </Link>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Locked</span>
                      )}
                    </td>

                    <td>
                      <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <Link
                          to={`/admin/events/${ev.id}`}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="View event details"
                        >
                          View
                        </Link>

                        {canEdit && (
                          <>
                            <Link
                              to={`/admin/events/${ev.id}/edit`}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              title="Edit event settings"
                            >
                              Edit
                            </Link>

                            <button
                              onClick={() => handleTogglePublish(ev)}
                              className={`admin-btn admin-btn-sm ${ev.isPublished ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                              title={ev.isPublished ? 'Unpublish event' : 'Publish event to live site'}
                            >
                              {ev.isPublished ? 'Unpublish' : 'Publish'}
                            </button>

                            <button
                              onClick={() => handleToggleFeatured(ev)}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              title={ev.isFeatured ? 'Unset featured' : 'Set featured'}
                            >
                              {ev.isFeatured ? '★' : '☆'}
                            </button>
                          </>
                        )}

                        {canArchive && (
                          <button
                            onClick={() => setArchiveTarget(ev)}
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            title={ev.archivedAt ? 'Restore event' : 'Archive event safely'}
                          >
                            {ev.archivedAt ? 'Restore' : 'Archive'}
                          </button>
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

      {/* Archive / Restore Confirmation Modal */}
      {archiveTarget && (
        <div className="admin-modal-backdrop" onClick={() => setArchiveTarget(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: archiveTarget.archivedAt ? '#34d399' : '#f87171' }}>
                {archiveTarget.archivedAt ? 'Confirm Event Restoration' : 'Confirm Event Archive'}
              </h3>
              <button className="admin-modal-close" onClick={() => setArchiveTarget(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: '#f1f5f9', margin: '0 0 1rem 0' }}>
                Are you sure you want to {archiveTarget.archivedAt ? 'restore' : 'archive'} the event <strong>"{archiveTarget.title}"</strong>?
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                {archiveTarget.archivedAt
                  ? 'Restoring will remove the archive status and allow publishing again.'
                  : 'Archiving hides the event from public listings and prevents registrations without permanently destroying records.'}
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setArchiveTarget(null)}
                disabled={isArchiving}
              >
                Cancel
              </button>
              <button
                className={`admin-btn ${archiveTarget.archivedAt ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                onClick={handleArchive}
                disabled={isArchiving}
              >
                {isArchiving ? 'Processing...' : (archiveTarget.archivedAt ? 'Restore Event' : 'Archive Event')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
