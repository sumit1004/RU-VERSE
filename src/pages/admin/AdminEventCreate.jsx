import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { categoryService } from '../../services/categoryService';
import Toast from '../../components/admin/Toast';
import '../../styles/admin.css';

export default function AdminEventCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Fields State
  const [title, setTitle] = useState('');
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
  const [isPublished, setIsPublished] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        let list = [];
        try {
          const cats = await categoryService.getAdminCategories();
          list = Array.isArray(cats) ? cats : [];
        } catch {
          // Fallback to public categories if coordinator/user lacks categories.admin permission
          const pubCats = await categoryService.getCategories();
          list = Array.isArray(pubCats) ? pubCats : [];
        }

        const activeCats = list.filter((c) => c.isActive);
        const available = activeCats.length > 0 ? activeCats : list;
        setCategories(available);
        if (available.length > 0) {
          setCategoryId(available[0].id);
        }
      } catch (err) {
        showToast('error', 'Failed to load categories.');
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleStartDateChange = (val) => {
    setStartDateTime(val);
    if (val && !endDateTime) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        d.setHours(d.getHours() + 2);
        const pad = (n) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setEndDateTime(formatted);
      }
    }
    if (val && !registrationEnd) {
      setRegistrationEnd(val);
    }
  };

  const handleSubmit = async (e, publishStatus = false) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!title.trim()) errors.title = 'Event title is required.';
    if (!description.trim()) errors.description = 'Event description is required.';
    if (!categoryId) errors.categoryId = 'Please select a category.';
    if (!venue.trim()) errors.venue = 'Venue location is required.';
    if (!startDateTime) errors.startDateTime = 'Event start date/time is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('error', Object.values(errors)[0]);
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
        endDateTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
        registrationStart: registrationStart ? new Date(registrationStart).toISOString() : undefined,
        registrationEnd: registrationEnd ? new Date(registrationEnd).toISOString() : undefined,
        registrationType,
        teamMinSize: registrationType === 'TEAM' ? Number(teamMinSize) : null,
        teamMaxSize: registrationType === 'TEAM' ? Number(teamMaxSize) : null,
        registrationLimit: registrationLimit ? Number(registrationLimit) : null,
        displayOrder: Number(displayOrder) || 0,
        isFeatured,
        isOpenForAll,
        isActive: true,
        isPublished: publishStatus,
      };

      const res = await eventService.createEvent(payload);
      showToast('success', `Event "${res.title}" created successfully.`);
      setTimeout(() => {
        navigate(`/admin/events/${res.id}`);
      }, 800);
    } catch (err) {
      console.error('Event creation error:', err);
      if (err.errors && typeof err.errors === 'object') {
        setFieldErrors(err.errors);
        const errorMessages = Object.values(err.errors).join(' ');
        showToast('error', errorMessages || err.message || 'Validation failed for event data.');
      } else {
        showToast('error', err.message || 'Failed to create event.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px' }}>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ marginBottom: '0.35rem' }}>
            <Link to="/admin/events" style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', textDecoration: 'none' }}>
              ← Back to Events
            </Link>
          </div>
          <h1 className="admin-page-title">
            Create Event
          </h1>
          <p className="admin-page-subtitle">
            Configure festival arena rules, competition team bounds, schedules, and live publishing parameters.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, isPublished)}>
        {/* Section 1: Basic Information */}
        <div className="admin-form-section">
          <h3 className="admin-form-section-title">1. Event Details</h3>
          <p className="admin-form-section-desc">Primary event identity, category assignment, and venue.</p>

          <div className="admin-form-grid-2">
            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Event Title *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. AI Autonomous Hackathon 2026"
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
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Venue Location *</label>
              <input
                type="text"
                className="admin-input"
                placeholder="e.g. Main Auditorium / Tech Arena Alpha"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Short Tagline (Optional)</label>
              <input
                type="text"
                className="admin-input"
                placeholder="One-line hook for portal cards..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>

            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Full Description *</label>
              <textarea
                className="admin-textarea"
                rows="4"
                placeholder="Detailed event overview, rules, prizes, and instructions..."
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
          <p className="admin-form-section-desc">Event execution timeline and attendee registration window.</p>

          <div className="admin-form-grid-2">
            <div className="admin-form-group">
              <label className="admin-label">Event Start Date & Time *</label>
              <input
                type="datetime-local"
                className={`admin-input ${fieldErrors.startDateTime ? 'is-invalid' : ''}`}
                value={startDateTime}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
              {fieldErrors.startDateTime && (
                <div style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '4px' }}>
                  {fieldErrors.startDateTime}
                </div>
              )}
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Event End Date & Time</label>
              <input
                type="datetime-local"
                className={`admin-input ${fieldErrors.endDateTime ? 'is-invalid' : ''}`}
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
              {fieldErrors.endDateTime && (
                <div style={{ color: '#f43f5e', fontSize: '0.75rem', marginTop: '4px' }}>
                  {fieldErrors.endDateTime}
                </div>
              )}
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Registration Opens</label>
              <input
                type="datetime-local"
                className={`admin-input ${fieldErrors.registrationStart ? 'is-invalid' : ''}`}
                value={registrationStart}
                onChange={(e) => setRegistrationStart(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Registration Deadline</label>
              <input
                type="datetime-local"
                className="admin-input"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Registration Rules */}
        <div className="admin-form-section">
          <h3 className="admin-form-section-title">3. Registration Settings</h3>
          <p className="admin-form-section-desc">Individual vs Team participation bounds and capacity limits.</p>

          <div className="admin-form-grid-2">
            <div className="admin-form-group">
              <label className="admin-label">Registration Type</label>
              <select
                className="admin-select"
                value={registrationType}
                onChange={(e) => setRegistrationType(e.target.value)}
              >
                <option value="INDIVIDUAL">INDIVIDUAL (Solo participant)</option>
                <option value="TEAM">TEAM (Squad / Group)</option>
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
          <h3 className="admin-form-section-title">4. Visibility</h3>
          <div className="admin-checkbox-group" style={{ marginTop: '0.5rem' }}>
            <label className="admin-checkbox-item">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <div>
                <strong>Featured Event</strong>
                <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>
                  Highlighted prominently on the public RUVERSE festival schedule.
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
                  Permits inter-college and external university participants to register.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Link to="/admin/events" className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, false)}
            className="admin-btn admin-btn-secondary"
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, true)}
            className="admin-btn admin-btn-primary"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Event Live'}
          </button>
        </div>
      </form>
    </div>
  );
}
