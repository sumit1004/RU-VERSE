import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../../services/categoryService';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { coordinatorService } from '../../services/coordinatorService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function AdminDashboard() {
  const { currentUser, hasPermission } = useAuth();
  const isAdmin = currentUser?.role?.slug === 'admin';

  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [coordinatorsCount, setCoordinatorsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const promises = [
          eventService.getAdminEvents({ includeArchived: true }).catch(() => []),
        ];

        if (isAdmin || hasPermission('categories.view')) {
          promises.push(categoryService.getAdminCategories().catch(() => []));
        } else {
          promises.push(Promise.resolve([]));
        }

        if (isAdmin || hasPermission('registrations.view')) {
          promises.push(registrationService.getRegistrations({ limit: 100 }).catch(() => ({ registrations: [] })));
        } else {
          promises.push(Promise.resolve({ registrations: [] }));
        }

        if (isAdmin) {
          promises.push(coordinatorService.getCoordinators().catch(() => ({ coordinators: [] })));
        } else {
          promises.push(Promise.resolve({ coordinators: [] }));
        }

        const [evts, cats, regsRes, coordsRes] = await Promise.all(promises);
        setEvents(Array.isArray(evts) ? evts : []);
        setCategories(Array.isArray(cats) ? cats : []);
        setRegistrations(regsRes?.registrations || []);
        setCoordinatorsCount(coordsRes?.coordinators?.length || 0);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAdmin, hasPermission]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;

  const totalEvents = events.filter((e) => !e.archivedAt).length;
  const publishedEvents = events.filter((e) => e.isPublished && !e.archivedAt).length;
  const featuredEvents = events.filter((e) => e.isFeatured && !e.archivedAt).length;

  const totalRegistrations = registrations.length;
  const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED').length;
  const pendingRegistrations = registrations.filter((r) => r.status === 'PENDING').length;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0' }}>
          Welcome back, {currentUser?.name || (isAdmin ? 'Administrator' : 'Coordinator')} 👋
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9375rem' }}>
          {isAdmin
            ? 'RUVERSE 2026 Festival Operations, Security & Event Management Portal'
            : 'Coordinator Portal — Scoped Event Management & Live Registrations'}
        </p>
      </div>

      {error && (
        <div className="admin-alert admin-alert-danger">
          {error}
        </div>
      )}

      {/* Real Statistics Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">{isAdmin ? 'Total Events' : 'Assigned Events'}</div>
          <div className="admin-stat-value" style={{ color: '#818cf8' }}>{loading ? '...' : totalEvents}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            {publishedEvents} published live
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">{isAdmin ? 'Total Registrations' : 'Scoped Registrations'}</div>
          <div className="admin-stat-value" style={{ color: '#38bdf8' }}>
            {loading ? '...' : totalRegistrations}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            {confirmedRegistrations} confirmed • {pendingRegistrations} pending
          </div>
        </div>

        {isAdmin ? (
          <>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Categories</div>
              <div className="admin-stat-value" style={{ color: '#34d399' }}>
                {loading ? '...' : totalCategories}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                {activeCategories} active categories
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-label">Coordinators</div>
              <div className="admin-stat-value" style={{ color: '#facc15' }}>
                {loading ? '...' : coordinatorsCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Assigned event managers
              </div>
            </div>
          </>
        ) : (
          <div className="admin-stat-card">
            <div className="admin-stat-label">Featured in Scope</div>
            <div className="admin-stat-value" style={{ color: '#facc15' }}>
              {loading ? '...' : featuredEvents}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Highlighted on festival portal
            </div>
          </div>
        )}
      </div>

      {/* Quick Access Card: Events */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">{isAdmin ? 'Recent Festival Events' : 'My Assigned Events'}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {hasPermission('events.create') && (
              <Link to="/admin/events/create" className="admin-btn admin-btn-secondary admin-btn-sm">
                + New Event
              </Link>
            )}
            <Link to="/admin/events" className="admin-btn admin-btn-primary admin-btn-sm">
              View Events →
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            {isAdmin ? 'No events created yet.' : 'No events assigned to your coordinator account yet.'}
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Category</th>
                  <th>Venue</th>
                  <th>Registration Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 5).map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/admin/events/${ev.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
                        {ev.title}
                      </Link>
                    </td>
                    <td style={{ color: '#818cf8' }}>{ev.category?.name}</td>
                    <td style={{ color: '#94a3b8' }}>📍 {ev.venue}</td>
                    <td>
                      <span className="admin-badge-type">{ev.registrationType}</span>
                    </td>
                    <td>
                      <span className={`admin-badge ${ev.isPublished ? 'admin-badge-active' : 'admin-badge-draft'}`}>
                        {ev.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security & Audit Status */}
      <div className="admin-card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#818cf8', margin: '0 0 0.5rem 0' }}>
          🛡️ Enterprise RBAC & Security Active
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
          Role-Based Access Control, Event-level Coordinator isolation, Immutable Audit Logging, HTTP-only JWT sessions, Rate Limiting, and CORS protection are actively guarding RUVERSE 2026 operations.
        </p>
      </div>
    </div>
  );
}
