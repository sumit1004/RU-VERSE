import React, { useState } from 'react';
import { formatEventDates } from '../../data/eventsData';

/**
 * EventCard Component:
 * - Pure data renderer for an event.
 * - Zero event-specific hardcoded conditions.
 * - Handles image display with fallback placeholder.
 * - Formats dates and category tags dynamically.
 * - Handles registration link state.
 */
export default function EventCard({ event, categoryLabelMap = {} }) {
  const [imageError, setImageError] = useState(false);
  const hasUrl = Boolean(event.registrationUrl && event.registrationUrl.trim() !== '');
  const formattedDate = formatEventDates(event.dates);

  // Normalize categories array
  const eventCategories = Array.isArray(event.categories)
    ? event.categories
    : event.category
    ? [event.category]
    : [];

  return (
    <article className="event-card">
      {/* Sci-Fi Decorative Frame Corners */}
      <div className="card-corner c-top-l" aria-hidden="true" />
      <div className="card-corner c-top-r" aria-hidden="true" />

      {/* Optional Card Image with Fallback */}
      {event.image && !imageError ? (
        <div className="event-card-media">
          <img
            src={event.image}
            alt={event.title}
            className="event-card-img"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <div className="event-card-media-overlay" />
        </div>
      ) : null}

      {/* Card Header: Number, Date & Category Badges */}
      <div className="event-card-header">
        <span className="event-card-num">
          {event.number ? `// ${event.number}` : '// 00'}
        </span>

        <div className="event-card-badges">
          {formattedDate && (
            <span className="event-card-date-badge">{formattedDate}</span>
          )}
          {eventCategories.map((catId) => (
            <span key={catId} className="event-card-category">
              {categoryLabelMap[catId] || catId}
            </span>
          ))}
        </div>
      </div>

      {/* Card Body */}
      <div className="event-card-body">
        <h3 className="event-card-title">{event.title}</h3>
        {event.tagline && (
          <div className="event-card-tagline">{event.tagline}</div>
        )}
        <p className="event-card-desc">{event.description}</p>
      </div>

      {/* Card Footer / Action Button */}
      <div className="event-card-footer">
        {hasUrl ? (
          <a
            href={event.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="event-card-btn"
            aria-label={`Register for ${event.title}`}
          >
            <span>REGISTER</span>
            <span className="card-btn-arrow" aria-hidden="true">→</span>
          </a>
        ) : (
          <button
            type="button"
            className="event-card-btn disabled"
            disabled
            aria-label={`Registration opening soon for ${event.title}`}
          >
            <span>REGISTRATION SOON</span>
          </button>
        )}
      </div>
    </article>
  );
}
