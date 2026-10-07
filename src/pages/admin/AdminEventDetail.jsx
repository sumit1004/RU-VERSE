import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import StatusBadge from '../../components/admin/StatusBadge';
import '../../styles/admin.css';

export default function AdminEventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await eventService.getAdminEventById(id);
      if (!data) {
        setLoadError({ status: 404, message: 'The requested event could not be found.' });
      } else {
        setEvent(data);
      }
    } catch (err) {
      if (err.status === 404) {
        setLoadError({ status: 404, message: 'The requested event could not be found.' });
      } else if (err.status === 403) {
        setLoadError({ status: 403, message: 'You do not have permission to view this event.' });
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
      loadEvent();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
        Loading event details...
      </div>
    );
  }

  if (loadError || !event) {
    const errorInfo = loadError || { status: 404, message: 'The requested event could not be found.' };
    return (
      <div>
        <div className="admin-page-header">
          <Link to="/admin/events" className="admin-btn admin-btn-ghost admin-btn-sm">
            ← Back to Events
          </Link>
        </div>
        <div className="admin-form-section" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--ad-danger-text)', margin: '0 0 0.5rem 0' }}>
            {errorInfo.status === 404 ? 'Event Not Found' : errorInfo.status === 403 ? 'Access Denied' : 'Unable to Load Event'}
          </h2>
          <p style={{ color: 'var(--ad-text-muted)', margin: '0 0 1.5rem 0' }}>
            {errorInfo.message}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/admin/events" className="admin-btn admin-btn-secondary admin-btn-sm">
              Back to Events
            </Link>
            {errorInfo.status !== 404 && (
              <button onClick={loadEvent} className="admin-btn admin-btn-primary admin-btn-sm">
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
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ marginBottom: '0.35rem' }}>
            <Link to="/admin/events" style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', textDecoration: 'none' }}>
              ← Back to Events
            </Link>
          </div>
          <h1 className="admin-page-title">
            {event.title}
          </h1>
          <p className="admin-page-subtitle">
            /{event.slug} • {event.category?.name || 'Uncategorized'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={event.isPublished ? 'PUBLISHED' : 'DRAFT'} />
          {event.isFeatured && <StatusBadge status="ACTIVE" label="★ FEATURED" />}

          <Link to={`/admin/events/${id}/form`} className="admin-btn admin-btn-secondary admin-btn-sm">
            Form Builder 📝
          </Link>
          <Link to={`/admin/events/${id}/registrations`} className="admin-btn admin-btn-secondary admin-btn-sm">
            Registrations
          </Link>
          <Link to={`/admin/events/${id}/edit`} className="admin-btn admin-btn-primary admin-btn-sm">
            Edit
          </Link>
        </div>
      </div>

      {/* Overview Info */}
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Event Overview</h3>
        <div className="admin-form-grid-2" style={{ marginTop: '0.75rem', gap: '0.75rem 1.5rem' }}>
          <div>
            <span className="admin-label">Venue Location</span>
            <div style={{ fontSize: '0.875rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              📍 {event.venue || 'TBD'}
            </div>
          </div>
          <div>
            <span className="admin-label">Registration Type</span>
            <div style={{ marginTop: '0.15rem' }}>
              <StatusBadge status={event.registrationType} />
            </div>
          </div>
          <div>
            <span className="admin-label">Event Date & Time</span>
            <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              📅 {event.startDateTime ? new Date(event.startDateTime).toLocaleString() : 'TBD'}
            </div>
          </div>
          <div>
            <span className="admin-label">Capacity Limit</span>
            <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              {event.registrationLimit ? `${event.registrationLimit} participants max` : 'Unlimited'}
            </div>
          </div>
          {event.registrationType === 'TEAM' && (
            <div>
              <span className="admin-label">Team Bounds</span>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
                {event.teamMinSize || 1} to {event.teamMaxSize || 4} members
              </div>
            </div>
          )}
          <div>
            <span className="admin-label">Eligibility</span>
            <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', marginTop: '0.15rem' }}>
              {event.isOpenForAll ? 'Open to all colleges' : 'Internal campus only'}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Event Description</h3>
        {event.shortDescription && (
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ad-text-secondary)', marginBottom: '0.75rem' }}>
            {event.shortDescription}
          </div>
        )}
        <div style={{ fontSize: '0.8125rem', color: 'var(--ad-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {event.description}
        </div>
      </div>
    </div>
  );
}
