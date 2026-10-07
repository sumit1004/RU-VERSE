import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import '../../styles/admin.css';

export default function AdminEventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        const data = await eventService.getAdminEvent(id);
        setEvent(data);
      } catch (err) {
        setError(err.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading event details...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="admin-alert admin-alert-danger">
        {error || 'Event not found.'}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/admin/events" style={{ color: '#818cf8', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '0.5rem' }}>
            ← Back to All Events
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: 0 }}>
              {event.title}
            </h1>
            {event.isFeatured && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.4)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                ★ FEATURED
              </span>
            )}
            <span className={`admin-badge ${event.isPublished ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
              {event.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to={`/admin/events/${id}/form`} className="admin-btn admin-btn-primary">
            📋 Dynamic Form Builder
          </Link>
          <Link to={`/admin/events/${id}/edit`} className="admin-btn admin-btn-secondary">
            Edit Event
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="admin-grid-2">
        {/* Left Column: Event Core Info */}
        <div className="admin-card">
          <h2 className="admin-card-title" style={{ marginBottom: '1rem' }}>Event Overview</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div className="admin-stat-label">Category</div>
              <div style={{ fontWeight: 600, color: '#818cf8' }}>{event.category?.name}</div>
            </div>

            <div>
              <div className="admin-stat-label">Public Slug / URL</div>
              <code style={{ color: '#38bdf8', background: 'rgba(14, 165, 233, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                /events/{event.slug}
              </code>
            </div>

            <div>
              <div className="admin-stat-label">Venue / Stage</div>
              <div style={{ color: '#fff', fontWeight: 600 }}>📍 {event.venue}</div>
            </div>

            {event.shortDescription && (
              <div>
                <div className="admin-stat-label">Short Summary</div>
                <div style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>{event.shortDescription}</div>
              </div>
            )}

            <div>
              <div className="admin-stat-label">Description & Rules</div>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem', whiteSpace: 'pre-line', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border-subtle)' }}>
                {event.description}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule & Registration Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="admin-card">
            <h2 className="admin-card-title" style={{ marginBottom: '1rem' }}>Dates & Schedule</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div className="admin-stat-label">Event Timeline</div>
                <div style={{ color: '#fff', fontSize: '0.875rem' }}>
                  <strong>Starts:</strong> {new Date(event.startDateTime).toLocaleString()}<br />
                  <strong>Ends:</strong> {new Date(event.endDateTime).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="admin-stat-label">Registration Window</div>
                <div style={{ color: '#fff', fontSize: '0.875rem' }}>
                  <strong>Opens:</strong> {new Date(event.registrationStart).toLocaleString()}<br />
                  <strong>Closes:</strong> {new Date(event.registrationEnd).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="admin-stat-label">Live Registration Status</div>
                <span className={`admin-badge admin-badge-${event.registrationStatus.toLowerCase()}`}>
                  {event.registrationStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h2 className="admin-card-title" style={{ marginBottom: '1rem' }}>Participation Rules</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Registration Type:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{event.registrationType}</span>
              </div>

              {event.teamMinSize && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Team Size Bounds:</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{event.teamMinSize} to {event.teamMaxSize} members</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Capacity Limit:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{event.registrationLimit || 'Unlimited'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Open for All Universities:</span>
                <span style={{ fontWeight: 600, color: event.isOpenForAll ? '#34d399' : '#f87171' }}>
                  {event.isOpenForAll ? 'Yes' : 'Restricted'}
                </span>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            <div>Created by: <strong style={{ color: '#cbd5e1' }}>{event.creator?.name || 'System Admin'}</strong> ({new Date(event.createdAt).toLocaleDateString()})</div>
            {event.updater && (
              <div style={{ marginTop: '0.25rem' }}>Last updated by: <strong style={{ color: '#cbd5e1' }}>{event.updater.name}</strong> ({new Date(event.updatedAt).toLocaleDateString()})</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
