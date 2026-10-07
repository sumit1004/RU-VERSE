import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formService } from '../../services/formService';
import '../../styles/admin.css';

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Single Line Text (Input)' },
  { value: 'TEXTAREA', label: 'Multi-line Text (Textarea)' },
  { value: 'EMAIL', label: 'Email Address' },
  { value: 'PHONE', label: 'Phone / Mobile Number' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date Picker' },
  { value: 'SELECT', label: 'Dropdown (Select)' },
  { value: 'RADIO', label: 'Radio Buttons (Single Choice)' },
  { value: 'CHECKBOX', label: 'Checkbox (Toggle / Confirmation)' },
];

export default function AdminFormBuilder() {
  const { id: eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Form Settings state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add / Edit Field Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null); // null = add mode
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [fieldScope, setFieldScope] = useState('PARTICIPANT');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');
  const [fieldOptionsText, setFieldOptionsText] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmittingField, setIsSubmittingField] = useState(false);

  // Delete Custom Field Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await formService.getForm(eventId);
      if (data) {
        setEvent(data.event);
        setForm(data.form);
        setFields(data.form.fields || []);
        setFormTitle(data.form.title);
        setFormDescription(data.form.description || '');
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to load form builder.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      await formService.updateFormSettings(eventId, {
        title: formTitle,
        description: formDescription,
      });
      showNotification('success', 'Form settings saved successfully.');
      await loadFormData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to save form settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePublishForm = async () => {
    try {
      const updated = await formService.publishForm(eventId);
      setForm(updated);
      showNotification('success', `Form published successfully (Version ${updated.version}).`);
    } catch (err) {
      showNotification('error', err.message || 'Failed to publish form.');
    }
  };

  const openAddFieldModal = () => {
    setEditingField(null);
    setFieldLabel('');
    setFieldType('TEXT');
    setFieldScope('PARTICIPANT');
    setFieldRequired(false);
    setFieldPlaceholder('');
    setFieldDescription('');
    setFieldOptionsText('');
    setFieldErrors({});
    setIsFieldModalOpen(true);
  };

  const openEditFieldModal = (field) => {
    setEditingField(field);
    setFieldLabel(field.label);
    setFieldType(field.fieldType);
    setFieldScope(field.fieldScope);
    setFieldRequired(field.isRequired);
    setFieldPlaceholder(field.placeholder || '');
    setFieldDescription(field.description || '');
    
    let opts = '';
    if (Array.isArray(field.optionsJson)) {
      opts = field.optionsJson.join('\n');
    }
    setFieldOptionsText(opts);
    setFieldErrors({});
    setIsFieldModalOpen(true);
  };

  const closeFieldModal = () => {
    setIsFieldModalOpen(false);
    setEditingField(null);
    setFieldErrors({});
  };

  const handleFieldSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!fieldLabel.trim()) errors.label = 'Field label is required.';

    let optionsArray = null;
    if (fieldType === 'SELECT' || fieldType === 'RADIO') {
      const lines = fieldOptionsText.split('\n').map((s) => s.trim()).filter(Boolean);
      if (lines.length === 0) {
        errors.options = `At least one option is required for ${fieldType} fields (one per line).`;
      } else {
        optionsArray = lines;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmittingField(true);
      const payload = {
        label: fieldLabel.trim(),
        fieldType,
        fieldScope,
        isRequired: fieldRequired,
        placeholder: fieldPlaceholder.trim() || null,
        description: fieldDescription.trim() || null,
        optionsJson: optionsArray,
      };

      if (editingField) {
        await formService.updateField(eventId, editingField.id, payload);
        showNotification('success', `Field "${payload.label}" updated.`);
      } else {
        await formService.addField(eventId, payload);
        showNotification('success', `Field "${payload.label}" added to form.`);
      }

      closeFieldModal();
      await loadFormData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to save field.');
      if (err.errors) setFieldErrors(err.errors);
    } finally {
      setIsSubmittingField(false);
    }
  };

  const handleDeleteField = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await formService.deleteField(eventId, deleteTarget.id);
      showNotification('success', `Field "${deleteTarget.label}" removed.`);
      setDeleteTarget(null);
      await loadFormData();
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete field.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveField = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const reordered = [...fields];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Recompute display orders
    const fieldOrders = reordered.map((f, idx) => ({
      id: f.id,
      displayOrder: (idx + 1) * 10,
    }));

    setFields(reordered);

    try {
      await formService.reorderFields(eventId, fieldOrders);
    } catch (err) {
      showNotification('error', err.message || 'Failed to persist field order.');
      await loadFormData();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
        Loading dynamic registration form builder...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to={`/admin/events/${eventId}`} style={{ color: '#818cf8', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-block', marginBottom: '0.5rem' }}>
            ← Back to Event: {event?.title}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', margin: 0 }}>
              Registration Form Builder
            </h1>
            <span className={`admin-badge ${form?.status === 'PUBLISHED' ? 'admin-badge-active' : 'admin-badge-draft'}`}>
              {form?.status || 'Draft'}
            </span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              v{form?.version || 1}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="admin-btn admin-btn-secondary"
          >
            👁️ Preview Form
          </button>
          <button
            onClick={handlePublishForm}
            className="admin-btn admin-btn-primary"
          >
            🚀 {form?.status === 'PUBLISHED' ? 'Re-Publish Form' : 'Publish Form'}
          </button>
        </div>
      </div>

      {notification && (
        <div className={`admin-alert ${notification.type === 'success' ? 'admin-alert-success' : 'admin-alert-danger'}`}>
          {notification.message}
        </div>
      )}

      {form?.status === 'PUBLISHED' && (
        <div className="admin-card" style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ color: '#facc15', fontSize: '0.875rem', fontWeight: 600 }}>
            ⚠️ Active Form: This form is currently PUBLISHED. Any schema additions will automatically be required for future registrations.
          </span>
        </div>
      )}

      {/* Form Details Card */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="admin-card-title" style={{ marginBottom: '1rem' }}>Form Header & Instructions</h2>
        <form onSubmit={handleSaveSettings}>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label className="admin-form-label">Form Title</label>
              <input
                type="text"
                className="admin-form-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Attendee Instructions / Subtitle</label>
              <input
                type="text"
                className="admin-form-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            disabled={isSavingSettings}
          >
            {isSavingSettings ? 'Saving...' : 'Save Form Settings'}
          </button>
        </form>
      </div>

      {/* Form Fields Section */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Registration Fields ({fields.length})</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
              Includes fixed baseline participant identification fields plus custom event fields
            </p>
          </div>

          <button onClick={openAddFieldModal} className="admin-btn admin-btn-primary admin-btn-sm">
            + Add Custom Field
          </button>
        </div>

        <div className="admin-field-list">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className={`admin-field-card ${field.isFixed ? 'is-fixed' : ''}`}
            >
              {/* Order Controls */}
              <div className="admin-field-order-controls">
                <button
                  type="button"
                  className="admin-order-btn"
                  onClick={() => handleMoveField(idx, -1)}
                  disabled={idx === 0}
                  title="Move Up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="admin-order-btn"
                  onClick={() => handleMoveField(idx, 1)}
                  disabled={idx === fields.length - 1}
                  title="Move Down"
                >
                  ▼
                </button>
              </div>

              {/* Field Info */}
              <div className="admin-field-info">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{field.label}</span>
                    {field.isRequired && (
                      <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 700 }}>* REQUIRED</span>
                    )}
                    {field.isFixed && (
                      <span style={{ fontSize: '0.6875rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                        Fixed Baseline
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span className={`admin-badge-scope ${field.fieldScope === 'PARTICIPANT' ? 'admin-badge-scope-participant' : 'admin-badge-scope-registration'}`}>
                      {field.fieldScope} LEVEL
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Type: <strong style={{ color: '#e2e8f0' }}>{field.fieldType}</strong>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Key: <code>{field.fieldKey}</code>
                    </span>
                  </div>

                  {field.description && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      {field.description}
                    </div>
                  )}

                  {Array.isArray(field.optionsJson) && field.optionsJson.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.25rem' }}>
                      Options: {field.optionsJson.join(' • ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="admin-actions-cell">
                <button
                  onClick={() => openEditFieldModal(field)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Edit
                </button>

                {!field.isFixed ? (
                  <button
                    onClick={() => setDeleteTarget(field)}
                    className="admin-btn admin-btn-danger admin-btn-sm"
                  >
                    Delete
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', padding: '0.3rem 0.5rem' }}>
                    Permanent
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Field Modal */}
      {isFieldModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeFieldModal}>
          <div className="admin-modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingField ? (editingField.isFixed ? 'Edit Baseline Field' : 'Edit Custom Field') : 'Add Custom Registration Field'}
              </h3>
              <button className="admin-modal-close" onClick={closeFieldModal}>×</button>
            </div>

            <form onSubmit={handleFieldSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="field-lbl">
                    Field Label *
                  </label>
                  <input
                    id="field-lbl"
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Year of Study, GitHub Repo, Food Preference"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    required
                    autoFocus
                  />
                  {fieldErrors.label && <div className="admin-form-error">{fieldErrors.label}</div>}
                </div>

                <div className="admin-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Field Type *</label>
                    <select
                      className="admin-form-select"
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value)}
                      disabled={editingField?.isFixed}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Field Scope *</label>
                    <select
                      className="admin-form-select"
                      value={fieldScope}
                      onChange={(e) => setFieldScope(e.target.value)}
                      disabled={editingField?.isFixed}
                    >
                      <option value="PARTICIPANT">Participant Level (Per member)</option>
                      <option value="REGISTRATION">Registration Level (Once per team/submission)</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="field-ph">
                    Placeholder (Optional)
                  </label>
                  <input
                    id="field-ph"
                    type="text"
                    className="admin-form-input"
                    placeholder="Sample placeholder text inside the input"
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" htmlFor="field-desc">
                    Helper Description (Optional)
                  </label>
                  <input
                    id="field-desc"
                    type="text"
                    className="admin-form-input"
                    placeholder="Sub-label instructions shown below the input"
                    value={fieldDescription}
                    onChange={(e) => setFieldDescription(e.target.value)}
                  />
                </div>

                {/* Options list for SELECT & RADIO */}
                {(fieldType === 'SELECT' || fieldType === 'RADIO') && (
                  <div className="admin-form-group" style={{ padding: '0.85rem', background: 'var(--admin-bg-elevated)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border-subtle)' }}>
                    <label className="admin-form-label">
                      Options (Enter one option per line) *
                    </label>
                    <textarea
                      rows="4"
                      className="admin-form-textarea"
                      placeholder={'1st Year\n2nd Year\n3rd Year\n4th Year'}
                      value={fieldOptionsText}
                      onChange={(e) => setFieldOptionsText(e.target.value)}
                      required
                    />
                    {fieldErrors.options && <div className="admin-form-error">{fieldErrors.options}</div>}
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={fieldRequired}
                      onChange={(e) => setFieldRequired(e.target.checked)}
                      disabled={editingField?.isFixed}
                    />
                    <span>Required Field (Attendee must fill this before submitting)</span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeFieldModal}
                  disabled={isSubmittingField}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isSubmittingField}
                >
                  {isSubmittingField ? 'Saving...' : (editingField ? 'Update Field' : 'Add Field')}
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
                Delete Form Field
              </h3>
              <button className="admin-modal-close" onClick={() => setDeleteTarget(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: '#f1f5f9', margin: '0 0 1rem 0' }}>
                Are you sure you want to remove the field <strong>"{deleteTarget.label}"</strong>?
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                This custom field will no longer appear on the registration form for {event?.title}.
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
                onClick={handleDeleteField}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Field'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Form Preview Modal */}
      {isPreviewOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsPreviewOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '680px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Registration Form Preview</h3>
                <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>{event?.title} • Dynamic Preview</span>
              </div>
              <button className="admin-modal-close" onClick={() => setIsPreviewOpen(false)}>×</button>
            </div>

            <div className="admin-modal-body admin-preview-container">
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
                  {formTitle || `${event?.title} Registration`}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                  {formDescription}
                </p>
              </div>

              {/* Registration-Level Fields */}
              {fields.some((f) => f.fieldScope === 'REGISTRATION') && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border-subtle)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#c084fc', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
                    Team / Submission Information
                  </h4>
                  {fields.filter((f) => f.fieldScope === 'REGISTRATION').map((f) => (
                    <div key={f.id} className="admin-form-group">
                      <label className="admin-form-label">
                        {f.label} {f.isRequired && <span style={{ color: '#f87171' }}>*</span>}
                      </label>
                      {f.fieldType === 'TEXTAREA' ? (
                        <textarea rows="3" className="admin-form-textarea" placeholder={f.placeholder || ''} disabled />
                      ) : f.fieldType === 'SELECT' ? (
                        <select className="admin-form-select" disabled>
                          <option>Select an option...</option>
                          {f.optionsJson?.map((opt, i) => <option key={i}>{opt}</option>)}
                        </select>
                      ) : f.fieldType === 'RADIO' ? (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {f.optionsJson?.map((opt, i) => (
                            <label key={i} className="admin-checkbox-label">
                              <input type="radio" disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input type="text" className="admin-form-input" placeholder={f.placeholder || ''} disabled />
                      )}
                      {f.description && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{f.description}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Participant-Level Fields */}
              <div style={{ padding: '1rem', background: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius-sm)', border: '1px solid var(--admin-border-subtle)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#38bdf8', margin: '0 0 1rem 0', textTransform: 'uppercase' }}>
                  Participant Details {event?.registrationType === 'TEAM' && '(Lead / Member 1)'}
                </h4>

                {fields.filter((f) => f.fieldScope === 'PARTICIPANT').map((f) => (
                  <div key={f.id} className="admin-form-group">
                    <label className="admin-form-label">
                      {f.label} {f.isRequired && <span style={{ color: '#f87171' }}>*</span>}
                    </label>
                    {f.fieldType === 'TEXTAREA' ? (
                      <textarea rows="3" className="admin-form-textarea" placeholder={f.placeholder || ''} disabled />
                    ) : f.fieldType === 'SELECT' ? (
                      <select className="admin-form-select" disabled>
                        <option>Select an option...</option>
                        {f.optionsJson?.map((opt, i) => <option key={i}>{opt}</option>)}
                      </select>
                    ) : f.fieldType === 'RADIO' ? (
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {f.optionsJson?.map((opt, i) => (
                          <label key={i} className="admin-checkbox-label">
                            <input type="radio" disabled />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input type="text" className="admin-form-input" placeholder={f.placeholder || ''} disabled />
                    )}
                    {f.description && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{f.description}</div>}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <button type="button" className="admin-btn admin-btn-primary admin-btn-full" disabled>
                  Submit Registration (Disabled in Preview)
                </button>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
