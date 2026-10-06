import React, { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';

export default function AdminCategories() {
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null = create mode
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission('categories.create');
  const canEdit = hasPermission('categories.edit');
  const canDelete = hasPermission('categories.delete');

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAdminCategories();
      setCategories(data);
    } catch (err) {
      showNotification('error', err.message || 'Failed to load categories.');
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
    setFormDisplayOrder(categories.length > 0 ? Math.max(...categories.map((c) => c.displayOrder)) + 1 : 1);
    setFormIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormDisplayOrder(category.displayOrder);
    setFormIsActive(category.isActive);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormErrors({});
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Client-side validation
    const errors = {};
    if (!formName.trim()) {
      errors.name = 'Category name is required.';
    } else if (formName.trim().length < 2) {
      errors.name = 'Category name must be at least 2 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        displayOrder: parseInt(formDisplayOrder, 10) || 0,
        isActive: formIsActive,
      };

      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, payload);
        showNotification('success', `Category "${payload.name}" updated successfully.`);
      } else {
        await categoryService.createCategory(payload);
        showNotification('success', `Category "${payload.name}" created successfully.`);
      }

      closeModal();
      await loadCategories();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      showNotification('error', err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (category) => {
    try {
      const nextStatus = !category.isActive;
      await categoryService.patchCategoryStatus(category.id, nextStatus);
      showNotification(
        'success',
        `Category "${category.name}" ${nextStatus ? 'activated' : 'deactivated'} successfully.`
      );
      await loadCategories();
    } catch (err) {
      showNotification('error', err.message || 'Failed to update category status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await categoryService.deleteCategory(deleteTarget.id);
      showNotification('success', `Category "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: '0 0 0.5rem 0' }}>
            Event Categories
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9375rem' }}>
            Manage public festival categories, display ordering, and visibility
          </p>
        </div>

        {canCreate && (
          <button onClick={openCreateModal} className="admin-btn admin-btn-primary">
            <span>+ Create Category</span>
          </button>
        )}
      </div>

      {/* Global Notification */}
      {notification && (
        <div className={`admin-alert ${notification.type === 'success' ? 'admin-alert-success' : 'admin-alert-danger'}`}>
          {notification.message}
        </div>
      )}

      {/* Category List */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ margin: '0 0 1rem 0' }}>No event categories found.</p>
            {canCreate && (
              <button onClick={openCreateModal} className="admin-btn admin-btn-primary admin-btn-sm">
                Create First Category
              </button>
            )}
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th>Display Order</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{cat.name}</div>
                      {cat.description && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <code style={{ color: '#818cf8', background: 'rgba(99, 102, 241, 0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8125rem' }}>
                        {cat.slug}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600 }}>{cat.displayOrder}</td>
                    <td>
                      <span className={`admin-badge ${cat.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                      {new Date(cat.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="admin-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => openEditModal(cat)}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(cat)}
                              className={`admin-btn admin-btn-sm ${cat.isActive ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                              title={cat.isActive ? 'Deactivate (hide from public)' : 'Activate (show on public)'}
                            >
                              {cat.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="admin-btn admin-btn-danger admin-btn-sm"
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
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button className="admin-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="cat-name">
                    Category Name *
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Hackathons, Gaming & Esports"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    autoFocus
                  />
                  {formErrors.name && (
                    <div className="admin-form-error">{formErrors.name}</div>
                  )}
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="cat-desc">
                    Description (Optional)
                  </label>
                  <textarea
                    id="cat-desc"
                    rows="3"
                    className="admin-form-textarea"
                    placeholder="Brief description of this event category..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="cat-order">
                    Display Order
                  </label>
                  <input
                    id="cat-order"
                    type="number"
                    className="admin-form-input"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(e.target.value)}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                    Lower numbers appear first on the public website filters.
                  </div>
                  {formErrors.displayOrder && (
                    <div className="admin-form-error">{formErrors.displayOrder}</div>
                  )}
                </div>

                <div className="admin-form-group">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                    />
                    <span>Active (Visible on public website)</span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingCategory
                    ? 'Update Category'
                    : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title" style={{ color: '#f87171' }}>
                Confirm Category Deletion
              </h3>
              <button className="admin-modal-close" onClick={() => setDeleteTarget(null)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: '#f1f5f9', margin: '0 0 1rem 0' }}>
                Are you sure you want to delete the category <strong>"{deleteTarget.name}"</strong>?
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                💡 Tip: If you only want to hide this category from the public festival page without deleting records, use the <strong>Deactivate</strong> toggle instead.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
