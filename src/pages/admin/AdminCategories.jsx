import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/admin/StatusBadge';
import Toast from '../../components/admin/Toast';
import '../../styles/admin.css';

export default function AdminCategories() {
  const { hasPermission, currentUser } = useAuth();
  const isAdmin = currentUser?.role?.slug === 'admin';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission('categories.create') || isAdmin;
  const canEdit = hasPermission('categories.edit') || isAdmin;
  const canDelete = hasPermission('categories.delete') || isAdmin;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAdminCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast('error', err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormDisplayOrder(categories.length > 0 ? Math.max(...categories.map((c) => c.displayOrder || 0)) + 1 : 1);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormDisplayOrder(cat.displayOrder || 0);
    setFormIsActive(cat.isActive);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('error', 'Category name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        displayOrder: Number(formDisplayOrder) || 0,
        isActive: formIsActive,
      };

      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, payload);
        showToast('success', `Category "${payload.name}" updated successfully.`);
      } else {
        await categoryService.createCategory(payload);
        showToast('success', `Category "${payload.name}" created successfully.`);
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      showToast('error', err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await categoryService.toggleCategoryStatus(cat.id, !cat.isActive);
      showToast('success', `Category "${cat.name}" is now ${!cat.isActive ? 'Active' : 'Inactive'}.`);
      loadCategories();
    } catch (err) {
      showToast('error', err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await categoryService.deleteCategory(deleteTarget.id);
      showToast('success', `Category "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      loadCategories();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Categories
          </h1>
          <p className="admin-page-subtitle">
            Manage festival arena sectors, department taxonomy, and portal classification.
          </p>
        </div>

        {canCreate && (
          <button onClick={openCreateModal} className="admin-btn admin-btn-primary admin-btn-sm">
            + New Category
          </button>
        )}
      </div>

      {/* Metric Strip */}
      <div className="admin-metric-strip">
        <div className="admin-metric-item">
          <span>Total Categories:</span>
          <strong>{categories.length}</strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Active:</span>
          <strong style={{ color: 'var(--ad-success-text)' }}>
            {categories.filter((c) => c.isActive).length}
          </strong>
        </div>
        <span className="admin-metric-divider">·</span>
        <div className="admin-metric-item">
          <span>Inactive:</span>
          <strong style={{ color: 'var(--ad-danger-text)' }}>
            {categories.filter((c) => !c.isActive).length}
          </strong>
        </div>
      </div>

      {/* Categories Table */}
      {loading ? (
        <div className="admin-table-container" style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="admin-table-container">
          <div className="admin-empty-state">
            <div className="admin-empty-icon">📁</div>
            <div className="admin-empty-title">No categories found</div>
            <div className="admin-empty-desc">Create your first event category to organize fest arenas.</div>
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Events</th>
                <th>Order</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600, color: 'var(--ad-text-primary)' }}>
                    {cat.name}
                  </td>
                  <td style={{ fontFamily: 'var(--ad-font-mono)', fontSize: '0.75rem', color: 'var(--ad-text-secondary)' }}>
                    {cat.slug}
                  </td>
                  <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ad-text-muted)', fontSize: '0.75rem' }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-secondary)' }}>
                    {cat._count?.events || 0} event{(cat._count?.events || 0) === 1 ? '' : 's'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)' }}>
                    {cat.displayOrder}
                  </td>
                  <td>
                    <StatusBadge status={cat.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="admin-table-actions" style={{ justifyContent: 'flex-end' }}>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEditModal(cat)}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(cat)}
                            className={`admin-btn admin-btn-sm ${cat.isActive ? 'admin-btn-danger' : 'admin-btn-success'}`}
                          >
                            {cat.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          style={{ color: 'var(--ad-danger-text)' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingCategory ? `Edit Category — ${editingCategory.name}` : 'Create Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="admin-modal-close">×</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">Category Name</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. AI & Hackathons"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Description (Optional)</label>
                  <textarea
                    className="admin-textarea"
                    rows="3"
                    placeholder="Brief summary of this arena category..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-label">Display Order</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Status</label>
                    <select
                      className="admin-select"
                      value={formIsActive ? 'ACTIVE' : 'INACTIVE'}
                      onChange={(e) => setFormIsActive(e.target.value === 'ACTIVE')}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setIsModalOpen(false)} className="admin-btn admin-btn-secondary admin-btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="admin-btn admin-btn-primary admin-btn-sm">
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: 'var(--ad-danger-text)' }}>
                Delete Category
              </h3>
              <button onClick={() => setDeleteTarget(null)} className="admin-modal-close">×</button>
            </div>

            <div className="admin-modal-body">
              <p style={{ color: 'var(--ad-text-primary)', margin: '0 0 0.5rem 0' }}>
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', margin: 0 }}>
                Categories with assigned events cannot be permanently removed. You can deactivate them instead.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button type="button" onClick={() => setDeleteTarget(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="admin-btn admin-btn-danger admin-btn-sm"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
