import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../../services/categoryService';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { coordinatorService } from '../../services/coordinatorService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/admin/StatusBadge';
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
          promises.push(registrationService.getRegistrations({ limit: 10 }).catch(() => ({ items: [] })));
        } else {
          promises.push(Promise.resolve({ items: [] }));
        }

        if (isAdmin) {
          promises.push(coordinatorService.getCoordinators().catch(() => ({ items: [] })));
        } else {
          promises.push(Promise.resolve({ items: [] }));
        }

        const [evts, cats, regsRes, coordsRes] = await Promise.all(promises);
        setEvents(Array.isArray(evts) ? evts : []);
        setCategories(Array.isArray(cats) ? cats : []);
        setRegistrations(regsRes?.items || regsRes?.registrations || []);
        setCoordinatorsCount(coordsRes?.items?.length || coordsRes?.coordinators?.length || 0);
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

  const totalRegistrations = registrations.length;
  const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED').length;
  const pendingRegistrations = registrations.filter((r) => r.status === 'PENDING').length;

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Dashboard
          </h1>
          <p className="admin-page-subtitle">
            Welcome back, {currentUser?.name || (isAdmin ? 'Administrator' : 'Coordinator')}. Real-time overview of festival operations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {hasPermission('events.create') && (
            <Link to="/admin/events/create" className="admin-btn admin-btn-primary admin-btn-sm">
              + New Event
            </Link>
          )}
          {hasPermission('registrations.view') && (
            <Link to="/admin/registrations" className="admin-btn admin-btn-secondary admin-btn-sm">
              View Registrations →
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--ad-danger-bg)', color: 'var(--ad-danger-text)', border: '1px solid var(--ad-danger-border)', borderRadius: 'var(--ad-radius-sm)', marginBottom: '1rem', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* Modern KPI Cards Grid */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">{isAdmin ? 'Total Events' : 'Assigned Events'}</span>
            <div className="admin-kpi-icon">🎪</div>
          </div>
          <div className="admin-kpi-value">{loading ? '—' : totalEvents}</div>
          <div className="admin-kpi-sub">
            <span style={{ color: 'var(--ad-success-text)' }}>● {publishedEvents} Published</span>
            <span style={{ color: 'var(--ad-text-dim)' }}>• {totalEvents - publishedEvents} Draft</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-top">
            <span className="admin-kpi-label">Registrations</span>
            <div className="admin-kpi-icon">📝</div>
          </div>
          <div className="admin-kpi-value">{loading ? '—' : totalRegistrations}</div>
          <div className="admin-kpi-sub">
            <span style={{ color: 'var(--ad-success-text)' }}>● {confirmedRegistrations} Confirmed</span>
            <span style={{ color: 'var(--ad-warning-text)' }}>• {pendingRegistrations} Pending</span>
          </div>
        </div>

        {isAdmin && (
          <>
            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Categories</span>
                <div className="admin-kpi-icon">📁</div>
              </div>
              <div className="admin-kpi-value">{loading ? '—' : totalCategories}</div>
              <div className="admin-kpi-sub">
                <span style={{ color: 'var(--ad-info-text)' }}>● {activeCategories} Active</span>
                <span style={{ color: 'var(--ad-text-dim)' }}>• {totalCategories - activeCategories} Inactive</span>
              </div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Coordinators</span>
                <div className="admin-kpi-icon">👥</div>
              </div>
              <div className="admin-kpi-value">{loading ? '—' : coordinatorsCount}</div>
              <div className="admin-kpi-sub">
                <span style={{ color: 'var(--ad-text-secondary)' }}>Assigned Staff</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Section 1: Recent Festival Events */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 className="admin-section-heading" style={{ margin: 0 }}>
            {isAdmin ? 'Active Events' : 'My Assigned Events'}
          </h2>
          <Link to="/admin/events" style={{ fontSize: '0.75rem', color: 'var(--ad-accent)', textDecoration: 'none' }}>
            All Events ({events.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="admin-table-container" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="admin-table-container">
            <div className="admin-empty-state">
              <div className="admin-empty-icon">🎪</div>
              <div className="admin-empty-title">No events found</div>
              <div className="admin-empty-desc">
                {isAdmin ? 'Create your first event to get started.' : 'No events have been assigned to your account yet.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Category</th>
                  <th>Venue</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 5).map((ev) => (
                  <tr key={ev.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/admin/events/${ev.id}`} style={{ color: 'var(--ad-text-primary)', textDecoration: 'none' }}>
                        {ev.title}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--ad-text-secondary)' }}>{ev.category?.name || '—'}</td>
                    <td style={{ color: 'var(--ad-text-muted)' }}>{ev.venue || 'TBD'}</td>
                    <td>
                      <StatusBadge status={ev.registrationType} />
                    </td>
                    <td>
                      <StatusBadge status={ev.isPublished ? 'PUBLISHED' : 'DRAFT'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/admin/events/${ev.id}`} className="admin-btn admin-btn-ghost admin-btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Recent Registrations */}
      {(isAdmin || hasPermission('registrations.view')) && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 className="admin-section-heading" style={{ margin: 0 }}>
              Recent Registrations
            </h2>
            <Link to="/admin/registrations" style={{ fontSize: '0.75rem', color: 'var(--ad-accent)', textDecoration: 'none' }}>
              All Registrations →
            </Link>
          </div>

          {loading ? (
            <div className="admin-table-container" style={{ padding: '2rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
              Loading registrations...
            </div>
          ) : registrations.length === 0 ? (
            <div className="admin-table-container">
              <div className="admin-empty-state">
                <div className="admin-empty-icon">📝</div>
                <div className="admin-empty-title">No registrations recorded yet</div>
                <div className="admin-empty-desc">
                  Attendee submissions will appear here once live registrations start.
                </div>
              </div>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reg #</th>
                    <th>Event</th>
                    <th>Participant / Team</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.slice(0, 5).map((reg) => {
                    const primary = reg.participants?.[0] || {};
                    return (
                      <tr key={reg.id}>
                        <td style={{ fontFamily: 'var(--ad-font-mono)', fontSize: '0.75rem' }}>
                          <Link to={`/admin/registrations/${reg.id}`} style={{ color: 'var(--ad-text-primary)', textDecoration: 'none' }}>
                            {reg.registrationNumber}
                          </Link>
                        </td>
                        <td style={{ color: 'var(--ad-text-secondary)' }}>{reg.event?.title || '—'}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{reg.teamName || primary.fullName || '—'}</div>
                          {reg.teamName && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)' }}>Leader: {primary.fullName}</div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>
                          <div>{primary.email || '—'}</div>
                        </td>
                        <td>
                          <StatusBadge status={reg.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/admin/registrations/${reg.id}`} className="admin-btn admin-btn-ghost admin-btn-sm">
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
