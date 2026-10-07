import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function AdminLayout() {
  const { currentUser, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const isAdmin = currentUser?.role?.slug === 'admin';

  // Compute breadcrumb title based on path
  const path = location.pathname;
  let pageTitle = 'Dashboard';
  if (path.includes('/admin/categories')) pageTitle = 'Categories';
  else if (path.includes('/admin/events/create')) pageTitle = 'Create Event';
  else if (path.includes('/admin/events') && path.includes('/edit')) pageTitle = 'Edit Event';
  else if (path.includes('/admin/events') && path.includes('/form')) pageTitle = 'Form Builder';
  else if (path.includes('/admin/events')) pageTitle = 'Events';
  else if (path.includes('/admin/registrations')) pageTitle = 'Registrations';
  else if (path.includes('/admin/coordinators')) pageTitle = 'Coordinators';
  else if (path.includes('/admin/audit-logs')) pageTitle = 'Audit Logs';

  return (
    <div className="admin-scope admin-layout">
      {/* 1. Fixed Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <NavLink to="/admin" className="admin-brand" title="RUVERSE Operations Console">
            <div className="admin-brand-icon">RU</div>
            <div>
              <h1 className="admin-brand-title">RUVERSE</h1>
              <span className="admin-brand-sub">Operations Console</span>
            </div>
          </NavLink>
        </div>

        <nav className="admin-sidebar-nav">
          {/* OVERVIEW */}
          <div>
            <div className="admin-nav-group-label">Overview</div>
            <div className="admin-nav-group-items">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                title="Dashboard"
              >
                <span className="admin-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" rx="1" />
                    <rect x="14" y="3" width="7" height="5" rx="1" />
                    <rect x="14" y="12" width="7" height="9" rx="1" />
                    <rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                </span>
                <span className="admin-nav-label">Dashboard</span>
              </NavLink>
            </div>
          </div>

          {/* EVENT MANAGEMENT */}
          {(isAdmin || hasPermission('events.view') || hasPermission('categories.view')) && (
            <div>
              <div className="admin-nav-group-label">Event Management</div>
              <div className="admin-nav-group-items">
                {(isAdmin || hasPermission('categories.view')) && (
                  <NavLink
                    to="/admin/categories"
                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                    title="Categories"
                  >
                    <span className="admin-nav-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className="admin-nav-label">Categories</span>
                  </NavLink>
                )}

                {(isAdmin || hasPermission('events.view')) && (
                  <NavLink
                    to="/admin/events"
                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                    title="Events"
                  >
                    <span className="admin-nav-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <span className="admin-nav-label">Events</span>
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {/* REGISTRATIONS */}
          {(isAdmin || hasPermission('registrations.view')) && (
            <div>
              <div className="admin-nav-group-label">Registrations</div>
              <div className="admin-nav-group-items">
                <NavLink
                  to="/admin/registrations"
                  className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                  title="Registrations"
                >
                  <span className="admin-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </span>
                  <span className="admin-nav-label">Registrations</span>
                </NavLink>
              </div>
            </div>
          )}

          {/* PEOPLE (Admin Only) */}
          {isAdmin && (
            <div>
              <div className="admin-nav-group-label">People</div>
              <div className="admin-nav-group-items">
                <NavLink
                  to="/admin/coordinators"
                  className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                  title="Coordinators"
                >
                  <span className="admin-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <span className="admin-nav-label">Coordinators</span>
                </NavLink>
              </div>
            </div>
          )}

          {/* SYSTEM */}
          {(isAdmin || hasPermission('audit.view')) && (
            <div>
              <div className="admin-nav-group-label">System</div>
              <div className="admin-nav-group-items">
                <NavLink
                  to="/admin/audit-logs"
                  className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                  title="Audit Logs"
                >
                  <span className="admin-nav-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <span className="admin-nav-label">Audit Logs</span>
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-user-meta">
              <span className="admin-user-name">{currentUser?.name || 'Administrator'}</span>
              <span className="admin-user-role">{currentUser?.role?.name || (isAdmin ? 'Admin' : 'Coordinator')}</span>
            </div>
            <button
              onClick={handleLogout}
              className="admin-btn-logout"
              title="Sign Out"
              aria-label="Sign Out"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Area (Topbar + Scrollable View) */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-breadcrumb">
            <span>RUVERSE</span>
            <span>/</span>
            <span className="current">{pageTitle}</span>
          </div>
          <div className="admin-topbar-actions">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              <span>Live Website ↗</span>
            </a>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
