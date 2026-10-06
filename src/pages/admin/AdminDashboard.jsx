import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await categoryService.getAdminCategories();
        setCategories(data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isActive).length;
  const inactiveCategories = totalCategories - activeCategories;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0' }}>
          Welcome back, {currentUser?.name || 'Administrator'} 👋
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9375rem' }}>
          RUVERSE 2026 Festival Operations & Category Management Foundation
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
          <div className="admin-stat-label">Total Categories</div>
          <div className="admin-stat-value">{loading ? '...' : totalCategories}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Configured in system
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Active Categories</div>
          <div className="admin-stat-value" style={{ color: '#34d399' }}>
            {loading ? '...' : activeCategories}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Live on public website
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Inactive Categories</div>
          <div className="admin-stat-value" style={{ color: '#f87171' }}>
            {loading ? '...' : inactiveCategories}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Hidden / archived
          </div>
        </div>
      </div>

      {/* Quick Access Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Event Categories Overview</h2>
          <Link to="/admin/categories" className="admin-btn admin-btn-primary admin-btn-sm">
            Manage All Categories →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            No categories created yet. <Link to="/admin/categories" style={{ color: '#6366f1' }}>Create the first category</Link>.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {categories.slice(0, 5).map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{cat.slug}</td>
                    <td>{cat.displayOrder}</td>
                    <td>
                      <span className={`admin-badge ${cat.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Development Roadmap Note */}
      <div className="admin-card" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#818cf8', margin: '0 0 0.5rem 0' }}>
          🚀 Phase 1 & 2 Foundation Active
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
          Backend API, MySQL/Prisma ORM, JWT authentication with secure HTTP-only cookies, role-based authorization, and Category CRUD management are running. Event CRUD, dynamic registration forms, and coordinator assignments will be unlocked in upcoming batches.
        </p>
      </div>
    </div>
  );
}
