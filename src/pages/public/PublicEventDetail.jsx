import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import {
  formatISTDate,
  formatISTTime,
  formatISTDateTime,
  formatDateRange,
  formatTimeRange,
  getRegistrationStatus,
} from '../../utils/eventDateTime';
import './eventDetail.css';

export default function PublicEventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventService.getPublicEventBySlug(slug);
      if (!data) {
        setError('Event not found or is currently not published for public access.');
      } else {
        setEvent(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load event details. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [slug]);

  // SPA navigation back to homepage events section without full reload
  const handleBackToHome = (e) => {
    e.preventDefault();
    // Mark session so intro/gate is bypassed
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ruverse_entered', 'true');
    }
    navigate('/', {
      state: { targetSection: 'events', fromPublicDetail: true },
    });
  };

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="public-event-detail-page">
        <div className="event-detail-container">
          <div className="event-detail-loading-box">
            <div className="event-detail-spinner" />
            <span style={{ fontSize: '0.875rem', letterSpacing: '0.08em', color: '#94a3b8', fontFamily: 'monospace' }}>
              RETRIEVING EVENT PROFILE // RUVERSE 2026...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error || !event) {
    return (
      <div className="public-event-detail-page">
        <div className="event-detail-container">
          <div className="event-detail-error-card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#fb7185', fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 800 }}>
              Event Unavailable
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.9375rem' }}>
              {error || 'The requested event could not be located in the festival manifest.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={loadEvent} className="event-reg-cta-btn" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
                ↻ Try Again
              </button>
              <button onClick={handleBackToHome} className="event-back-btn" style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}>
                ← Return to RUVERSE Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate authoritative registration availability status
  const statusInfo = getRegistrationStatus(event);

  // Formatted date and time strings
  const formattedDates = formatDateRange(event.startDateTime, event.endDateTime);
  const formattedTimes = formatTimeRange(event.startDateTime, event.endDateTime);
  const registrationTypeLabel =
    event.registrationType === 'TEAM'
      ? `Team · ${event.teamMinSize || 2}–${event.teamMaxSize || 4} Members`
      : event.registrationType === 'BOTH'
      ? `Individual / Team (${event.teamMinSize || 2}–${event.teamMaxSize || 4})`
      : 'Individual Entry';

  return (
    <div className="public-event-detail-page">
      <div className="event-detail-container">
        {/* 1. Top Navigation Bar */}
        <div className="event-detail-top-nav">
          <button onClick={handleBackToHome} className="event-back-btn" aria-label="Return to RUVERSE 2026 Home">
            <span>← Back to RUVERSE 2026</span>
          </button>
          <span className="event-brand-indicator">RUVERSE 2026 // EVENT MANIFEST</span>
        </div>

        {/* 2. Hero Header Card */}
        <div className="event-hero-card">
          <div className="event-hero-meta-row">
            {event.category?.name && (
              <span className="event-category-chip">{event.category.name}</span>
            )}
            {event.isFeatured && (
              <span className="event-featured-chip">★ FEATURED ARENA</span>
            )}
            <span className={`event-status-badge is-${statusInfo.badgeClass}`}>
              <span className="event-status-dot" />
              <span>{statusInfo.badgeText}</span>
            </span>
          </div>

          <h1 className="event-hero-title">{event.title}</h1>

          {event.shortDescription && (
            <p className="event-hero-tagline">{event.shortDescription}</p>
          )}

          {/* Core Specification Grid */}
          <div className="event-specs-grid">
            <div className="event-spec-item">
              <span className="event-spec-label">Venue</span>
              <span className="event-spec-value">📍 {event.venue || 'TBD'}</span>
            </div>

            <div className="event-spec-item">
              <span className="event-spec-label">Date</span>
              <span className="event-spec-value">📅 {formattedDates || 'FEB 2026'}</span>
            </div>

            {formattedTimes && (
              <div className="event-spec-item">
                <span className="event-spec-label">Time</span>
                <span className="event-spec-value">⏰ {formattedTimes}</span>
              </div>
            )}

            <div className="event-spec-item">
              <span className="event-spec-label">Registration</span>
              <span className="event-spec-value">👥 {registrationTypeLabel}</span>
            </div>

            {event.registrationLimit && (
              <div className="event-spec-item">
                <span className="event-spec-label">Capacity</span>
                <span className="event-spec-value">🎟️ {event.registrationLimit} Slots Max</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. About This Event */}
        <div className="event-editorial-section">
          <h2 className="event-section-heading">About This Event</h2>
          <div className="event-description-body">
            {event.description || 'Full event specifications and briefing will be announced shortly.'}
          </div>
        </div>

        {/* 4. Event Information Parameters */}
        <div className="event-editorial-section">
          <h2 className="event-section-heading">Event Details & Schedule</h2>
          <div className="event-details-table">
            <div className="event-detail-row">
              <span className="event-detail-label">Location / Arena</span>
              <span className="event-detail-val">{event.venue || 'Campus Arena'}</span>
            </div>

            {event.startDateTime && (
              <div className="event-detail-row">
                <span className="event-detail-label">Event Starts</span>
                <span className="event-detail-val">{formatISTDateTime(event.startDateTime)} (IST)</span>
              </div>
            )}

            {event.endDateTime && (
              <div className="event-detail-row">
                <span className="event-detail-label">Event Ends</span>
                <span className="event-detail-val">{formatISTDateTime(event.endDateTime)} (IST)</span>
              </div>
            )}

            {event.registrationStart && (
              <div className="event-detail-row">
                <span className="event-detail-label">Registration Window Opens</span>
                <span className="event-detail-val">{formatISTDateTime(event.registrationStart)} (IST)</span>
              </div>
            )}

            {event.registrationEnd && (
              <div className="event-detail-row">
                <span className="event-detail-label">Registration Deadline</span>
                <span className="event-detail-val">{formatISTDateTime(event.registrationEnd)} (IST)</span>
              </div>
            )}

            <div className="event-detail-row">
              <span className="event-detail-label">Participation Eligibility</span>
              <span className="event-detail-val">
                {event.isOpenForAll !== false ? 'Open to All College & University Students' : 'Restricted Eligibility Arena'}
              </span>
            </div>

            <div className="event-detail-row">
              <span className="event-detail-label">Registration Mode</span>
              <span className="event-detail-val">
                {event.registrationMode === 'EXTERNAL' ? 'External Registration' : 'RUVERSE Official Direct Portal'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Registration Action Console */}
        <div className="event-reg-console">
          <div className="event-reg-info">
            <h3 className="event-reg-status-title">{statusInfo.headline}</h3>
            <p className="event-reg-status-desc">{statusInfo.message}</p>
          </div>

          <div>
            {event.registrationMode === 'EXTERNAL' && event.registrationLink ? (
              <a
                href={event.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="event-reg-cta-btn"
              >
                Register via External Portal ↗
              </a>
            ) : statusInfo.canRegister ? (
              <Link to={`/events/${event.slug}/register`} className="event-reg-cta-btn">
                {statusInfo.buttonLabel}
              </Link>
            ) : (
              <button disabled className="event-reg-cta-btn is-disabled" title={statusInfo.message}>
                {statusInfo.buttonLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
