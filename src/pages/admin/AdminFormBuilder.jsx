import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formService } from '../../services/formService';
import StatusBadge from '../../components/admin/StatusBadge';
import Toast from '../../components/admin/Toast';
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
  const [toast, setToast] = useState(null);

  // Form Settings state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add / Edit Field Modal State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [fieldScope, setFieldScope] = useState('PARTICIPANT');
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldPlaceholder, setFieldPlaceholder] = useState('');
  const [fieldDescription, setFieldDescription] = useState('');
  const [fieldOptionsText, setFieldOptionsText] = useState('');
  const [isSubmittingField, setIsSubmittingField] = useState(false);

  // Delete Custom Field Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await formService.getForm(eventId);
      if (data) {
        setEvent(data.event || null);
        setForm(data.form || null);
        setFields(data.fields || []);
        if (data.form) {
          setFormTitle(data.form.title || '');
          setFormDescription(data.form.description || '');
        }
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to load form schema.');
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
        title: formTitle.trim(),
        description: formDescription.trim(),
      });
      showToast('success', 'Form settings saved.');
      await loadFormData();
    } catch (err) {
      showToast('error', err.message || 'Failed to save form settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePublishForm = async () => {
    try {
      const res = await formService.publishForm(eventId);
      showToast('success', `Form published (Version ${res.version}).`);
      await loadFormData();
    } catch (err) {
      showToast('error', err.message || 'Failed to publish form.');
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
    if (field.optionsJson) {
      if (Array.isArray(field.optionsJson)) {
        opts = field.optionsJson.join('\n');
      } else if (typeof field.optionsJson === 'string') {
        try {
          const parsed = JSON.parse(field.optionsJson);
          opts = Array.isArray(parsed) ? parsed.join('\n') : '';
        } catch {
          opts = '';
        }
      }
    }
    setFieldOptionsText(opts);
    setIsFieldModalOpen(true);
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    if (!fieldLabel.trim()) {
      showToast('error', 'Field label is required.');
      return;
    }

    let parsedOptions = null;
    if (['SELECT', 'RADIO', 'CHECKBOX'].includes(fieldType) && fieldOptionsText.trim()) {
      parsedOptions = fieldOptionsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    try {
      setIsSubmittingField(true);
      const payload = {
        label: fieldLabel.trim(),
        fieldType,
        fieldScope,
        isRequired: fieldRequired,
        placeholder: fieldPlaceholder.trim() || undefined,
        description: fieldDescription.trim() || undefined,
        optionsJson: parsedOptions || undefined,
      };

      if (editingField) {
        await formService.updateField(eventId, editingField.id, payload);
        showToast('success', `Field "${payload.label}" updated.`);
      } else {
        await formService.addField(eventId, payload);
        showToast('success', `Field "${payload.label}" added.`);
      }

      setIsFieldModalOpen(false);
      await loadFormData();
    } catch (err) {
      showToast('error', err.message || 'Failed to save form field.');
    } finally {
      setIsSubmittingField(false);
    }
  };

  const handleDeleteField = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await formService.deleteField(eventId, deleteTarget.id);
      showToast('success', `Field "${deleteTarget.label}" removed.`);
      setDeleteTarget(null);
      await loadFormData();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete field.');
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

    const fieldOrders = reordered.map((f, idx) => ({
      id: f.id,
      displayOrder: (idx + 1) * 10,
    }));

    setFields(reordered);

    try {
      await formService.reorderFields(eventId, fieldOrders);
    } catch (err) {
      showToast('error', 'Failed to persist field order.');
      await loadFormData();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ad-text-muted)' }}>
        Loading dynamic form builder...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px' }}>
      <Toast toast={toast} />

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ marginBottom: '0.35rem' }}>
            <Link to={`/admin/events/${eventId}`} style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', textDecoration: 'none' }}>
              ← Back to Event: {event?.title}
            </Link>
          </div>
          <h1 className="admin-page-title">
            Form Builder — {event?.title}
          </h1>
          <p className="admin-page-subtitle">
            Configure attendee registration fields, scopes, custom inputs, and dynamic form versioning.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <StatusBadge status={form?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'} />
          <button onClick={() => setIsPreviewOpen(true)} className="admin-btn admin-btn-secondary admin-btn-sm">
            👁️ Preview
          </button>
          <button onClick={handlePublishForm} className="admin-btn admin-btn-primary admin-btn-sm">
            🚀 {form?.status === 'PUBLISHED' ? 'Re-Publish Form' : 'Publish Form'}
          </button>
        </div>
      </div>

      {/* Form Details */}
      <div className="admin-form-section">
        <h3 className="admin-form-section-title">Form Header & Instructions</h3>
        <form onSubmit={handleSaveSettings} style={{ marginTop: '0.75rem' }}>
          <div className="admin-form-grid-2">
            <div className="admin-form-group">
              <label className="admin-label">Form Title</label>
              <input
                type="text"
                className="admin-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">Attendee Instructions</label>
              <input
                type="text"
                className="admin-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Guidelines displayed above registration form..."
              />
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <button type="submit" disabled={isSavingSettings} className="admin-btn admin-btn-secondary admin-btn-sm">
              {isSavingSettings ? 'Saving...' : 'Save Header Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Form Fields Section */}
      <div className="admin-form-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h3 className="admin-form-section-title">Registration Fields ({fields.length})</h3>
            <p className="admin-form-section-desc" style={{ margin: 0 }}>
              Fixed baseline participant fields + custom event-specific questions.
            </p>
          </div>

          <button onClick={openAddFieldModal} className="admin-btn admin-btn-primary admin-btn-sm">
            + Add Custom Field
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {fields.map((field, idx) => (
            <div
              key={field.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--ad-radius-sm)',
                border: '1px solid var(--ad-border-subtle)',
                background: field.isFixed ? 'rgba(255,255,255,0.02)' : 'rgba(99, 102, 241, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveField(idx, -1)}
                    style={{ background: 'none', border: 'none', color: 'var(--ad-text-muted)', cursor: 'pointer', fontSize: '0.65rem', padding: 0 }}
                  >
                    ▲
                  </button>
                  <button
                    disabled={idx === fields.length - 1}
                    onClick={() => handleMoveField(idx, 1)}
                    style={{ background: 'none', border: 'none', color: 'var(--ad-text-muted)', cursor: 'pointer', fontSize: '0.65rem', padding: 0 }}
                  >
                    ▼
                  </button>
                </div>

                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--ad-text-primary)' }}>
                    {field.label} {field.isRequired && <span style={{ color: 'var(--ad-danger-text)' }}>*</span>}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--ad-text-muted)', display: 'flex', gap: '0.5rem' }}>
                    <span>Type: {field.fieldType}</span>
                    <span>•</span>
                    <span>Scope: {field.fieldScope}</span>
                    {field.isFixed && (
                      <>
                        <span>•</span>
                        <span style={{ color: 'var(--ad-accent)' }}>Baseline</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {!field.isFixed && (
                  <>
                    <button
                      onClick={() => openEditFieldModal(field)}
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(field)}
                      className="admin-btn admin-btn-ghost admin-btn-sm"
                      style={{ color: 'var(--ad-danger-text)' }}
                    >
                      Delete
                    </button>
                  </>
                )}
                {field.isFixed && (
                  <span style={{ fontSize: '0.6875rem', color: 'var(--ad-text-dim)', padding: '0.2rem 0.5rem' }}>
                    Fixed System Field
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADD / EDIT FIELD MODAL */}
      {isFieldModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingField ? `Edit Field — ${editingField.label}` : 'Add Custom Registration Field'}
              </h3>
              <button onClick={() => setIsFieldModalOpen(false)} className="admin-modal-close">×</button>
            </div>

            <form onSubmit={handleSaveField}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">Field Label *</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. GitHub Repository URL or T-Shirt Size"
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-label">Field Type</label>
                    <select
                      className="admin-select"
                      value={fieldType}
                      onChange={(e) => setFieldType(e.target.value)}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Field Scope</label>
                    <select
                      className="admin-select"
                      value={fieldScope}
                      onChange={(e) => setFieldScope(e.target.value)}
                    >
                      <option value="PARTICIPANT">PARTICIPANT (Every team member)</option>
                      <option value="REGISTRATION">REGISTRATION (Once per submission)</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Placeholder (Optional)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Example response text..."
                    value={fieldPlaceholder}
                    onChange={(e) => setFieldPlaceholder(e.target.value)}
                  />
                </div>

                {['SELECT', 'RADIO', 'CHECKBOX'].includes(fieldType) && (
                  <div className="admin-form-group">
                    <label className="admin-label">Options (One per line)</label>
                    <textarea
                      className="admin-textarea"
                      rows="3"
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      value={fieldOptionsText}
                      onChange={(e) => setFieldOptionsText(e.target.value)}
                    />
                  </div>
                )}

                <div className="admin-form-group" style={{ marginTop: '0.5rem' }}>
                  <label className="admin-checkbox-item">
                    <input
                      type="checkbox"
                      checked={fieldRequired}
                      onChange={(e) => setFieldRequired(e.target.checked)}
                    />
                    <span>Required Field (Participant cannot submit without filling)</span>
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setIsFieldModalOpen(false)} className="admin-btn admin-btn-secondary admin-btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmittingField} className="admin-btn admin-btn-primary admin-btn-sm">
                  {isSubmittingField ? 'Saving...' : editingField ? 'Save Field' : 'Add Field'}
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
              <h3 className="admin-modal-title" style={{ color: 'var(--ad-danger-text)' }}>Remove Field</h3>
              <button onClick={() => setDeleteTarget(null)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: 'var(--ad-text-primary)', margin: '0 0 0.5rem 0' }}>
                Are you sure you want to remove <strong>{deleteTarget.label}</strong>?
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--ad-text-muted)', margin: 0 }}>
                This will exclude the field from future registration submissions.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button type="button" onClick={() => setDeleteTarget(null)} className="admin-btn admin-btn-secondary admin-btn-sm">
                Cancel
              </button>
              <button type="button" disabled={isDeleting} onClick={handleDeleteField} className="admin-btn admin-btn-danger admin-btn-sm">
                {isDeleting ? 'Deleting...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Live Form Preview — {formTitle || event?.title}</h3>
              <button onClick={() => setIsPreviewOpen(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '0.8125rem', color: 'var(--ad-text-muted)', margin: '0 0 1.25rem 0' }}>
                {formDescription || 'Please fill in the required participant details below.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {fields.map((f) => (
                  <div key={f.id} className="admin-form-group">
                    <label className="admin-label">
                      {f.label} {f.isRequired && <span style={{ color: 'var(--ad-danger-text)' }}>*</span>}
                    </label>
                    {f.fieldType === 'TEXTAREA' ? (
                      <textarea className="admin-textarea" rows="2" placeholder={f.placeholder || ''} disabled />
                    ) : f.fieldType === 'SELECT' ? (
                      <select className="admin-select" disabled>
                        <option>Select an option...</option>
                        {Array.isArray(f.optionsJson) && f.optionsJson.map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input type={f.fieldType === 'EMAIL' ? 'email' : f.fieldType === 'NUMBER' ? 'number' : 'text'} className="admin-input" placeholder={f.placeholder || ''} disabled />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" onClick={() => setIsPreviewOpen(false)} className="admin-btn admin-btn-secondary admin-btn-sm">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
