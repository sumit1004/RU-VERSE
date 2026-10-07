import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-scope admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <div>
              <h1 className="admin-brand-title">RUVERSE</h1>
              <span className="admin-brand-sub">Management Portal</span>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="admin-nav-item-left">
              <span>📊</span>
              <span>Dashboard</span>
            </div>
          </NavLink>

          {(currentUser?.role?.slug === 'admin' || hasPermission('categories.view')) && (
            <NavLink
              to="/admin/categories"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item-left">
                <span>📁</span>
                <span>Categories</span>
              </div>
            </NavLink>
          )}

          {(currentUser?.role?.slug === 'admin' || hasPermission('events.view')) && (
            <NavLink
              to="/admin/events"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item-left">
                <span>🎪</span>
                <span>Events</span>
              </div>
            </NavLink>
          )}

          {(currentUser?.role?.slug === 'admin' || hasPermission('registrations.view')) && (
            <NavLink
              to="/admin/registrations"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item-left">
                <span>📝</span>
                <span>Registrations</span>
              </div>
            </NavLink>
          )}

          {/* Coordinators Management is Admin Only */}
          {currentUser?.role?.slug === 'admin' && (
            <NavLink
              to="/admin/coordinators"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item-left">
                <span>👥</span>
                <span>Coordinators</span>
              </div>
            </NavLink>
          )}

          {/* Audit Logs is Admin or audit.view Only */}
          {(currentUser?.role?.slug === 'admin' || hasPermission('audit.view')) && (
            <NavLink
              to="/admin/audit-logs"
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="admin-nav-item-left">
                <span>📜</span>
                <span>Audit Logs</span>
              </div>
            </NavLink>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-details">
              <div className="admin-user-name">{currentUser?.name || 'Administrator'}</div>
              <div className="admin-user-role">{currentUser?.role?.name || currentUser?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="admin-btn admin-btn-secondary admin-btn-sm admin-btn-full"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="admin-main">
        <header className="admin-topbar">
          <h2 className="admin-topbar-title">RUVERSE 2026 Admin Portal</h2>
          <div className="admin-topbar-actions">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              <span>View Public Site ↗</span>
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
