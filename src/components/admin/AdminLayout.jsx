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
          <NavLink to="/admin" className="admin-brand">
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
              >
                <span className="admin-nav-icon">📊</span>
                <span>Dashboard</span>
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
                  >
                    <span className="admin-nav-icon">📁</span>
                    <span>Categories</span>
                  </NavLink>
                )}

                {(isAdmin || hasPermission('events.view')) && (
                  <NavLink
                    to="/admin/events"
                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="admin-nav-icon">🎪</span>
                    <span>Events</span>
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
                >
                  <span className="admin-nav-icon">📝</span>
                  <span>Registrations</span>
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
                >
                  <span className="admin-nav-icon">👥</span>
                  <span>Coordinators</span>
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
                >
                  <span className="admin-nav-icon">📜</span>
                  <span>Audit Logs</span>
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
