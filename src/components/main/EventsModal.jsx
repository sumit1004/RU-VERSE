import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { eventsData } from '../../data/eventsData';
import './EventsModal.css';

/**
 * EventsModal Component:
 * - Interactive event database manifest for RUVERSE 2026
 * - Uses React Portal to render directly to document.body for clean stacking & pointer events
 * - Sibling backdrop & modal panel with stopPropagation
 * - Active Google Form links with target="_blank" rel="noopener noreferrer"
 * - Graceful disabled state for events awaiting registration URLs
 * - Zero impact on 3D spaceship scene, camera, lighting, or transforms
 */
export default function EventsModal({ isOpen, onClose }) {
  const closeBtnRef = useRef(null);
  const modalRef = useRef(null);

  // Manage body scroll lock and keyboard ESC listener
  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Focus close button on mount
    if (closeBtnRef.current) {
      closeBtnRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalElement = (
    <div
      className="events-modal-overlay"
      role="presentation"
    >
      {/* Sibling Backdrop */}
      <div
        className="events-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Panel */}
      <div
        ref={modalRef}
        className="events-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="events-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner Technical Brackets */}
        <div className="modal-corner top-l" />
        <div className="modal-corner top-r" />
        <div className="modal-corner btm-l" />
        <div className="modal-corner btm-r" />

        {/* Modal Header */}
        <div className="events-modal-header">
          <div className="modal-header-left">
            <div className="modal-tag">
              <span className="modal-tag-dot" />
              <span>EVENT DATABASE // 2026</span>
            </div>
            <h2 id="events-modal-title" className="events-modal-title">RUVERSE EVENTS</h2>
            <p className="events-modal-subtitle">Explore the galaxy of events.</p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            className="events-modal-close"
            onClick={onClose}
            aria-label="Close events"
          >
            <span>CLOSE</span>
            <span className="close-x" aria-hidden="true">×</span>
          </button>
        </div>

        {/* Event List Manifest (Internally Scrollable) */}
        <div className="events-modal-content">
          {eventsData.map((event) => {
            const hasUrl = Boolean(event.registrationUrl && event.registrationUrl.trim() !== '');

            return (
              <article key={event.id} className="events-modal-row">
                <div className="event-row-left">
                  <span className="event-num">{event.number}</span>
                  <div className="event-content">
                    <div className="event-title-wrap">
                      <h3 className="event-row-title">{event.title}</h3>
                      {event.category && (
                        <span className="event-category-badge">{event.category}</span>
                      )}
                    </div>
                    <p className="event-row-desc">{event.description}</p>
                  </div>
                </div>

                <div className="event-row-right">
                  {hasUrl ? (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="event-register-button"
                      aria-label={`Register for ${event.title}`}
                    >
                      <span>REGISTER</span>
                      <span className="reg-arrow" aria-hidden="true">→</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="event-register-button disabled"
                      disabled
                      aria-label={`Registration opening soon for ${event.title}`}
                    >
                      <span>REGISTRATION SOON</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="events-modal-footer">
          <span className="modal-footer-brand">RUVERSE 2026 // RUNGTA INTERNATIONAL SKILLS UNIVERSITY</span>
          <span>OFFICIAL EVENT REGISTRATION MANIFEST</span>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? ReactDOM.createPortal(modalElement, document.body)
    : modalElement;
}
