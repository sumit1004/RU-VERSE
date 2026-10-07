import React from 'react';

/**
 * DynamicField - Renders dynamic form inputs based on fieldType definition
 */
export default function DynamicField({ field, value, onChange, error, disabled = false }) {
  const {
    id,
    label,
    fieldKey,
    fieldType,
    description,
    placeholder,
    isRequired,
    optionsJson,
  } = field;

  const inputId = `field_${fieldKey}_${id || 'custom'}`;
  const options = Array.isArray(optionsJson) ? optionsJson : [];

  const handleChange = (val) => {
    onChange(fieldKey, val);
  };

  const renderInput = () => {
    switch (fieldType) {
      case 'TEXTAREA':
        return (
          <textarea
            id={inputId}
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            rows={3}
            disabled={disabled}
            className={`reg-form-input reg-form-textarea ${error ? 'is-invalid' : ''}`}
          />
        );

      case 'NUMBER':
        return (
          <input
            id={inputId}
            type="number"
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || '0'}
            disabled={disabled}
            className={`reg-form-input ${error ? 'is-invalid' : ''}`}
          />
        );

      case 'EMAIL':
        return (
          <input
            id={inputId}
            type="email"
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || 'example@domain.com'}
            disabled={disabled}
            className={`reg-form-input ${error ? 'is-invalid' : ''}`}
          />
        );

      case 'PHONE':
        return (
          <input
            id={inputId}
            type="tel"
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || '10-digit mobile number'}
            disabled={disabled}
            className={`reg-form-input ${error ? 'is-invalid' : ''}`}
          />
        );

      case 'DATE':
        return (
          <input
            id={inputId}
            type="date"
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={`reg-form-input ${error ? 'is-invalid' : ''}`}
          />
        );

      case 'SELECT':
        return (
          <select
            id={inputId}
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={`reg-form-input reg-form-select ${error ? 'is-invalid' : ''}`}
          >
            <option value="">{placeholder || `-- Select ${label} --`}</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'RADIO':
        return (
          <div className="reg-radio-group">
            {options.map((opt, idx) => (
              <label key={idx} className="reg-radio-label">
                <input
                  type="radio"
                  name={inputId}
                  value={opt}
                  checked={value === opt}
                  onChange={() => handleChange(opt)}
                  disabled={disabled}
                  className="reg-radio-input"
                />
                <span className="reg-radio-custom"></span>
                <span className="reg-radio-text">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        return (
          <label className="reg-checkbox-label">
            <input
              type="checkbox"
              id={inputId}
              checked={Boolean(value)}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="reg-checkbox-input"
            />
            <span className="reg-checkbox-custom"></span>
            <span className="reg-checkbox-text">{placeholder || label}</span>
          </label>
        );

      case 'TEXT':
      default:
        return (
          <input
            id={inputId}
            type="text"
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            disabled={disabled}
            className={`reg-form-input ${error ? 'is-invalid' : ''}`}
          />
        );
    }
  };

  return (
    <div className={`reg-field-container ${fieldType === 'CHECKBOX' ? 'reg-field-checkbox' : ''}`}>
      {fieldType !== 'CHECKBOX' && (
        <label htmlFor={inputId} className="reg-field-label">
          {label}
          {isRequired && <span className="reg-required-star">*</span>}
        </label>
      )}

      {description && <p className="reg-field-desc">{description}</p>}

      <div className="reg-input-wrapper">{renderInput()}</div>

      {error && (
        <p className="reg-field-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
