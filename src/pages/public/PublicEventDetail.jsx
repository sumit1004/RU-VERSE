import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import '../../styles/admin.css';

export default function PublicEventDetail() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegModal, setShowRegModal] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        const data = await eventService.getPublicEventBySlug(slug);
        if (!data) {
          setError('Event not found or registration is currently unavailable.');
        } else {
          setEvent(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className="admin-scope" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0d14' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>Loading event details...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="admin-scope" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: '#0a0d14' }}>
        <h1 style={{ color: '#f87171', fontSize: '1.75rem', marginBottom: '1rem' }}>Event Unavailable</h1>
        <p style={{ color: '#94a3b8', maxWidth: '480px', marginBottom: '2rem' }}>{error}</p>
        <Link to="/" className="admin-btn admin-btn-primary">
          ← Return to RUVERSE Home
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-scope" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top center, #1e1b4b 0%, #0a0d14 70%)', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link to="/" style={{ color: '#818cf8', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem', fontWeight: 600 }}>
          ← Back to RUVERSE 2026 Home
        </Link>

        <div className="admin-card" style={{ background: '#111726', padding: '2.5rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase' }}>
              {event.category?.name}
            </span>
            {event.isFeatured && (
              <span style={{ fontSize: '0.8125rem', color: '#facc15', background: 'rgba(234, 179, 8, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 700 }}>
                ★ FEATURED EVENT
              </span>
            )}
            <span className={`admin-badge admin-badge-${event.registrationStatus.toLowerCase()}`}>
              {event.registrationStatus}
            </span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', margin: '0 0 1rem 0', lineHeight: 1.2 }}>
            {event.title}
          </h1>

          {event.shortDescription && (
            <p style={{ color: '#cbd5e1', fontSize: '1.125rem', margin: '0 0 1.75rem 0', lineHeight: 1.6 }}>
              {event.shortDescription}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border-subtle)', marginBottom: '2rem' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Venue</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '0.25rem' }}>📍 {event.venue}</div>
            </div>

            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Event Date</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '0.25rem' }}>
                📅 {new Date(event.startDateTime).toLocaleDateString()}
              </div>
            </div>

            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Registration Type</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '0.25rem' }}>
                {event.registrationType}
                {event.teamMinSize && ` (${event.teamMinSize}-${event.teamMaxSize} members)`}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              About This Event
            </h3>
            <div style={{ color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {event.description}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--admin-bg-elevated)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border-subtle)', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Registration Deadline</div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9375rem' }}>
                {new Date(event.registrationEnd).toLocaleString()}
              </div>
            </div>

            {event.registrationMode === 'EXTERNAL' && event.registrationLink ? (
              <a
                href={event.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Register via External Form ↗
              </a>
            ) : (
              <Link
                to={`/events/${event.slug}/register`}
                className="admin-btn admin-btn-primary"
                style={{
                  textDecoration: 'none',
                  pointerEvents: event.registrationStatus !== 'OPEN' ? 'none' : 'auto',
                  opacity: event.registrationStatus !== 'OPEN' ? 0.6 : 1,
                }}
              >
                {event.registrationStatus === 'OPEN'
                  ? 'Register Now 🚀'
                  : event.registrationStatus === 'UPCOMING'
                  ? 'Registration Opening Soon'
                  : 'Registration Closed'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Controlled Notice for Registration Modal */}
      {showRegModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowRegModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Registration System</h3>
              <button className="admin-modal-close" onClick={() => setShowRegModal(false)}>×</button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>⚡</span>
              <h4 style={{ color: '#fff', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                Dynamic Registration System Ready
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                The event registration form schema for <strong>{event.title}</strong> has been configured by festival administrators. Public attendee submissions will be live in Phase 5.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowRegModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
