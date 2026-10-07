import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { categoryService } from '../../services/categoryService';
import Toast from '../../components/admin/Toast';
import '../../styles/admin.css';

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
}

export default function AdminEventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [venue, setVenue] = useState('');

  // Schedules
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [registrationStart, setRegistrationStart] = useState('');
  const [registrationEnd, setRegistrationEnd] = useState('');

  // Registration Type & Team Settings
  const [registrationType, setRegistrationType] = useState('INDIVIDUAL');
  const [teamMinSize, setTeamMinSize] = useState(2);
  const [teamMaxSize, setTeamMaxSize] = useState(4);

  // Settings & Toggles
  const [registrationLimit, setRegistrationLimit] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOpenForAll, setIsOpenForAll] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadEventAndCategories = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const [eventData, cats] = await Promise.all([
        eventService.getAdminEventById(id),
        categoryService.getAdminCategories(),
      ]);

      const catList = Array.isArray(cats) ? cats : [];
      setCategories(catList);

      if (!eventData) {
        setLoadError({ status: 404, message: 'The requested event could not be found.' });
        return;
      }

      setTitle(eventData.title || '');
      setSlug(eventData.slug || '');
      setShortDescription(eventData.shortDescription || '');
      setDescription(eventData.description || '');
      setCategoryId(eventData.categoryId || (catList.length > 0 ? catList[0].id : ''));
      setVenue(eventData.venue || '');

      setStartDateTime(formatDateForInput(eventData.startDateTime));
      setEndDateTime(formatDateForInput(eventData.endDateTime));
      setRegistrationStart(formatDateForInput(eventData.registrationStart));
      setRegistrationEnd(formatDateForInput(eventData.registrationEnd));

      setRegistrationType(eventData.registrationType || 'INDIVIDUAL');
      setTeamMinSize(eventData.teamMinSize || 2);
      setTeamMaxSize(eventData.teamMaxSize || 4);

      setRegistrationLimit(eventData.registrationLimit ? String(eventData.registrationLimit) : '');
      setDisplayOrder(eventData.displayOrder || 0);
      setIsFeatured(Boolean(eventData.isFeatured));
      setIsOpenForAll(Boolean(eventData.isOpenForAll));
      setIsActive(Boolean(eventData.isActive));
      setIsPublished(Boolean(eventData.isPublished));
    } catch (err) {
      if (err.status === 404) {
        setLoadError({ status: 404, message: 'The requested event could not be found.' });
      } else if (err.status === 403) {
        setLoadError({ status: 403, message: 'You do not have permission to edit this event.' });
      } else if (err.status === 401) {
        setLoadError({ status: 401, message: 'Your session has expired. Please log in again.' });
      } else {
        setLoadError({ status: err.status || 500, message: err.message || 'Failed to load event details.' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadEventAndCategories();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('error', 'Event title is required.');
      return;
    }
    if (!description.trim()) {
      showToast('error', 'Event description is required.');
      return;
    }
    if (!venue.trim()) {
      showToast('error', 'Venue location is required.');
      return;
    }
    if (!startDateTime) {
      showToast('error', 'Event start date/time is required.');
      return;
    }
    if (!endDateTime) {
      showToast('error', 'Event end date/time is required.');
      return;
    }
    if (new Date(endDateTime) < new Date(startDateTime)) {
      showToast('error', 'Event end time must be after start time.');
      return;
    }
    if (!registrationStart) {
      showToast('error', 'Registration start date/time is required.');
      return;
    }
    if (!registrationEnd) {
      showToast('error', 'Registration deadline is required.');
      return;
    }
    if (new Date(registrationEnd) < new Date(registrationStart)) {
      showToast('error', 'Registration deadline must be after registration start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim(),
        categoryId: Number(categoryId),
        venue: venue.trim(),
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        registrationStart: new Date(registrationStart).toISOString(),
        registrationEnd: new Date(registrationEnd).toISOString(),
        registrationType,
        teamMinSize: registrationType === 'TEAM' ? Number(teamMinSize) : null,
        teamMaxSize: registrationType === 'TEAM' ? Number(teamMaxSize) : null,
        registrationLimit: registrationLimit ? Number(registrationLimit) : null,
        displayOrder: Number(displayOrder) || 0,
        isFeatured,
        isOpenForAll,
        isActive,
        isPublished,
      };

      await eventService.updateEvent(id, payload);
      showToast('success', 'Event updated successfully.');
      setTimeout(() => {
        navigate(`/admin/events/${id}`);
      }, 700);
    } catch (err) {
      showToast('error', err.message || 'Failed to update event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
        Loading event configuration...
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <div className="admin-page-header">
          <Link to="/admin/events" className="admin-btn admin-btn-ghost admin-btn-sm">
            ← Back to Events
          </Link>
        </div>
        <div className="admin-form-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--ad-danger-text)', margin: '0 0 0.5rem 0' }}>
            {loadError.status === 404 ? 'Event Not Found' : loadError.status === 403 ? 'Access Denied' : 'Unable to Load Event'}
          </h2>
          <p style={{ color: 'var(--ad-text-muted)', margin: '0 0 1.5rem 0' }}>
            {loadError.message}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/admin/events" className="admin-btn admin-btn-secondary admin-btn-sm">
              Back to Events
            </Link>
            {loadError.status !== 404 && (
              <button onClick={loadEventAndCategories} className="admin-btn admin-btn-primary admin-btn-sm">
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px' }}>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ marginBottom: '0.35rem' }}>
            <Link to={`/admin/events/${id}`} style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', textDecoration: 'none' }}>
              ← Back to Event Overview
            </Link>
          </div>
          <h1 className="admin-page-title">
            Edit Event — {title}
          </h1>
          <p className="admin-page-subtitle">
            Update event scheduling, arena rules, team bounds, and live portal visibility.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/admin/events/${id}/form`} className="admin-btn admin-btn-secondary admin-btn-sm">
            Form Builder
          </Link>
          <Link to={`/admin/events/${id}/registrations`} className="admin-btn admin-btn-secondary admin-btn-sm">
            View Registrations
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Event Identity */}
        <div className="admin-form-section">
          <h3 className="admin-form-section-title">1. Event Details</h3>
          <p className="admin-form-section-desc">Primary name, category, slug, and location.</p>

          <div className="admin-form-grid-2">
            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Event Title *</label>
              <input
                type="text"
                className="admin-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Category *</label>
              <select
                className="admin-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{!c.isActive ? ' (Inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Venue Location *</label>
              <input
                type="text"
                className="admin-input"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Slug</label>
              <input
                type="text"
                className="admin-input"
                value={slug}
                disabled
                style={{ opacity: 0.6, fontFamily: 'var(--ad-font-mono)' }}
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Short Tagline</label>
              <input
                type="text"
                className="admin-input"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Full Description *</label>
              <textarea
                className="admin-textarea"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Schedules */}
        <div className="admin-form-section">
          <h3 className="admin-form-section-title">2. Scheduling</h3>
          <p className="admin-form-section-desc">Event timeline and participant registration window.</p>

          <div className="admin-form-grid-2">
            <div className="admin-form-group">
              <label className="admin-label">Event Start Date & Time *</label>
              <input
                type="datetime-local"
                className="admin-input"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Event End Date & Time *</label>
              <input
                type="datetime-local"
                className="admin-input"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Registration Opens *</label>
              <input
                type="datetime-local"
                className="admin-input"
                value={registrationStart}
                onChange={(e) => setRegistrationStart(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Registration Deadline *</label>
              <input
                type="datetime-local"
                className="admin-input"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Registration Rules */}
        <div className="admin-form-section">
          <h3 className="admin-form-section-title">3. Registration Settings</h3>
          <p className="admin-form-section-desc">Participation rules, team bounds, and capacity limits.</p>

          <div className="admin-form-grid-2">
            <div className="admin-form-group">
              <label className="admin-label">Registration Type</label>
              <select
                className="admin-select"
                value={registrationType}
                onChange={(e) => setRegistrationType(e.target.value)}
              >
                <option value="INDIVIDUAL">INDIVIDUAL</option>
                <option value="TEAM">TEAM</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Capacity Limit (Optional)</label>
              <input
                type="number"
                className="admin-input"
                placeholder="Leave blank for unlimited"
                value={registrationLimit}
                onChange={(e) => setRegistrationLimit(e.target.value)}
              />
            </div>

            {registrationType === 'TEAM' && (
              <>
                <div className="admin-form-group">
                  <label className="admin-label">Min Team Members</label>
                  <input
                    type="number"
                    min="1"
                    className="admin-input"
                    value={teamMinSize}
                    onChange={(e) => setTeamMinSize(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Max Team Members</label>
                  <input
                    type="number"
                    min="1"
                    className="admin-input"
                    value={teamMaxSize}
                    onChange={(e) => setTeamMaxSize(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="admin-form-group">
              <label className="admin-label">Display Order</label>
              <input
                type="number"
                className="admin-input"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Visibility & Status */}
        <div className="admin-form-section">
          <h3 className="admin-form-section-title">4. Visibility & Status</h3>
          <div className="admin-checkbox-group" style={{ marginTop: '0.5rem' }}>
            <label className="admin-checkbox-item">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <div>
                <strong>Published Live</strong>
                <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>
                  Visible to attendees on the public RUVERSE schedule and open for registration.
                </div>
              </div>
            </label>

            <label className="admin-checkbox-item">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <div>
                <strong>Featured Event</strong>
                <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>
                  Highlighted on the festival homepage.
                </div>
              </div>
            </label>

            <label className="admin-checkbox-item">
              <input
                type="checkbox"
                checked={isOpenForAll}
                onChange={(e) => setIsOpenForAll(e.target.checked)}
              />
              <div>
                <strong>Open For All Colleges</strong>
                <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>
                  External university participants permitted.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Link to={`/admin/events/${id}`} className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-btn admin-btn-primary"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
