import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { categoryService } from '../../services/categoryService';
import '../../styles/admin.css';

export default function AdminEventCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Form Fields State
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [venue, setVenue] = useState('');

  // Schedules (ISO-compatible local datetime strings)
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

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        // Load active public categories
        const cats = await categoryService.getPublicCategories();
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load categories.');
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e, shouldPublish = false) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const errors = {};
    if (!title.trim()) errors.title = 'Event title is required.';
    if (!description.trim()) errors.description = 'Event description is required.';
    if (!categoryId) errors.categoryId = 'Category selection is required.';
    if (!venue.trim()) errors.venue = 'Venue location is required.';
    if (!startDateTime) errors.startDateTime = 'Event start date/time is required.';
    if (!endDateTime) errors.endDateTime = 'Event end date/time is required.';
    if (!registrationStart) errors.registrationStart = 'Registration start date/time is required.';
    if (!registrationEnd) errors.registrationEnd = 'Registration end date/time is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage('Please fix the highlighted errors before saving.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        shortDescription: shortDescription.trim() || null,
        description: description.trim(),
        categoryId: parseInt(categoryId, 10),
        venue: venue.trim(),
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        registrationStart: new Date(registrationStart).toISOString(),
        registrationEnd: new Date(registrationEnd).toISOString(),
        registrationType,
        teamMinSize: (registrationType === 'TEAM' || registrationType === 'BOTH') ? parseInt(teamMinSize, 10) : null,
        teamMaxSize: (registrationType === 'TEAM' || registrationType === 'BOTH') ? parseInt(teamMaxSize, 10) : null,
        registrationLimit: registrationLimit ? parseInt(registrationLimit, 10) : null,
        displayOrder: parseInt(displayOrder, 10) || 0,
        isFeatured,
        isOpenForAll,
        isActive,
        isPublished: shouldPublish || isPublished,
      };

      const event = await eventService.createEvent(payload);
      navigate(`/admin/events/${event.id}`, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create event.');
      if (err.errors) {
        setFieldErrors(err.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/admin/events" style={{ color: '#818cf8', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '0.5rem' }}>
            ← Back to Events
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: 0 }}>
            Create New Event
          </h1>
        </div>
      </div>

      {errorMessage && (
        <div className="admin-alert admin-alert-danger">
          {errorMessage}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* 1. Basic Information */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">1. Basic Information</h2>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="ev-title">
              Event Title *
            </label>
            <input
              id="ev-title"
              type="text"
              className="admin-form-input"
              placeholder="e.g. Starship Combat Robotics, AI Hackathon 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {fieldErrors.title && <div className="admin-form-error">{fieldErrors.title}</div>}
          </div>

          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="ev-cat">
                Category *
              </label>
              <select
                id="ev-cat"
                className="admin-form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {loading && <option value="">Loading categories...</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && <div className="admin-form-error">{fieldErrors.categoryId}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="ev-venue">
                Venue / Stage *
              </label>
              <input
                id="ev-venue"
                type="text"
                className="admin-form-input"
                placeholder="e.g. Main Arena, Cosmic Lab 3, Auditorium"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
              {fieldErrors.venue && <div className="admin-form-error">{fieldErrors.venue}</div>}
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="ev-shortdesc">
              Short Description (Catchphrase / Summary)
            </label>
            <input
              id="ev-shortdesc"
              type="text"
              className="admin-form-input"
              placeholder="e.g. 36-hour autonomous agent coding marathon with grand prizes"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              maxLength={255}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="ev-desc">
              Full Event Description & Rules *
            </label>
            <textarea
              id="ev-desc"
              rows="5"
              className="admin-form-textarea"
              placeholder="Comprehensive event details, guidelines, rules, and problem statement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            {fieldErrors.description && <div className="admin-form-error">{fieldErrors.description}</div>}
          </div>
        </div>

        {/* 2. Schedule */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">2. Event Schedule</h2>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="ev-start">
                Event Starts *
              </label>
              <input
                id="ev-start"
                type="datetime-local"
                className="admin-form-input"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                required
              />
              {fieldErrors.startDateTime && <div className="admin-form-error">{fieldErrors.startDateTime}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="ev-end">
                Event Ends *
              </label>
              <input
                id="ev-end"
                type="datetime-local"
                className="admin-form-input"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                required
              />
              {fieldErrors.endDateTime && <div className="admin-form-error">{fieldErrors.endDateTime}</div>}
            </div>
          </div>
        </div>

        {/* 3. Registration Window */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">3. Registration Window</h2>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="reg-start">
                Registration Opens *
              </label>
              <input
                id="reg-start"
                type="datetime-local"
                className="admin-form-input"
                value={registrationStart}
                onChange={(e) => setRegistrationStart(e.target.value)}
                required
              />
              {fieldErrors.registrationStart && <div className="admin-form-error">{fieldErrors.registrationStart}</div>}
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="reg-end">
                Registration Closes *
              </label>
              <input
                id="reg-end"
                type="datetime-local"
                className="admin-form-input"
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
                required
              />
              {fieldErrors.registrationEnd && <div className="admin-form-error">{fieldErrors.registrationEnd}</div>}
            </div>
          </div>
        </div>

        {/* 4. Registration Type & Team Configuration */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">4. Participation & Team Configuration</h2>

          <div className="admin-form-group">
            <label className="admin-form-label">Registration Type *</label>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <label className="admin-checkbox-label">
                <input
                  type="radio"
                  name="regType"
                  value="INDIVIDUAL"
                  checked={registrationType === 'INDIVIDUAL'}
                  onChange={() => setRegistrationType('INDIVIDUAL')}
                />
                <span>Individual Only</span>
              </label>

              <label className="admin-checkbox-label">
                <input
                  type="radio"
                  name="regType"
                  value="TEAM"
                  checked={registrationType === 'TEAM'}
                  onChange={() => setRegistrationType('TEAM')}
                />
                <span>Team Only</span>
              </label>

              <label className="admin-checkbox-label">
                <input
                  type="radio"
                  name="regType"
                  value="BOTH"
                  checked={registrationType === 'BOTH'}
                  onChange={() => setRegistrationType('BOTH')}
                />
                <span>Individual or Team (Both)</span>
              </label>
            </div>
          </div>

          {/* Conditional Team Settings */}
          {(registrationType === 'TEAM' || registrationType === 'BOTH') && (
            <div className="admin-grid-2" style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--admin-bg-elevated)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border-subtle)' }}>
              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-form-label" htmlFor="team-min">
                  Minimum Team Members *
                </label>
                <input
                  id="team-min"
                  type="number"
                  min="1"
                  className="admin-form-input"
                  value={teamMinSize}
                  onChange={(e) => setTeamMinSize(e.target.value)}
                  required
                />
                {fieldErrors.teamMinSize && <div className="admin-form-error">{fieldErrors.teamMinSize}</div>}
              </div>

              <div className="admin-form-group" style={{ margin: 0 }}>
                <label className="admin-form-label" htmlFor="team-max">
                  Maximum Team Members *
                </label>
                <input
                  id="team-max"
                  type="number"
                  min={teamMinSize || 1}
                  className="admin-form-input"
                  value={teamMaxSize}
                  onChange={(e) => setTeamMaxSize(e.target.value)}
                  required
                />
                {fieldErrors.teamMaxSize && <div className="admin-form-error">{fieldErrors.teamMaxSize}</div>}
              </div>
            </div>
          )}
        </div>

        {/* 5. Additional Event Settings */}
        <div className="admin-form-section">
          <h2 className="admin-form-section-title">5. Event Visibility & Limits</h2>

          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="reg-limit">
                Registration Capacity Limit (Optional)
              </label>
              <input
                id="reg-limit"
                type="number"
                min="1"
                className="admin-form-input"
                placeholder="Leave blank for unlimited"
                value={registrationLimit}
                onChange={(e) => setRegistrationLimit(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="disp-order">
                Display Order
              </label>
              <input
                id="disp-order"
                type="number"
                className="admin-form-input"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                className="admin-checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span>★ Mark as Featured Event (Highlights on festival landing page)</span>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                className="admin-checkbox"
                checked={isOpenForAll}
                onChange={(e) => setIsOpenForAll(e.target.checked)}
              />
              <span>🌐 Open for All (Available to external universities & attendees)</span>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                className="admin-checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Active (Status switch for overall festival visibility)</span>
            </label>
          </div>
        </div>

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <Link to="/admin/events" className="admin-btn admin-btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="admin-btn admin-btn-secondary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save & Publish Live'}
          </button>
        </div>
      </form>
    </div>
  );
}
