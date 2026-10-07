import React from 'react';
import DynamicField from './DynamicField.jsx';

/**
 * ParticipantForm - Renders fixed baseline fields and dynamic participant-scoped fields
 */
export default function ParticipantForm({
  index,
  participant,
  customFields = [],
  errors = {},
  onChange,
  onRemove,
  canRemove = false,
  isTeam = false,
  disabled = false,
}) {
  const fixed = participant.fixed || {};
  const custom = participant.custom || {};

  const handleFixedChange = (fieldKey, value) => {
    onChange(index, 'fixed', fieldKey, value);
  };

  const handleCustomChange = (fieldKey, value) => {
    onChange(index, 'custom', fieldKey, value);
  };

  const isLeader = index === 0 && isTeam;

  return (
    <div className={`participant-card ${isLeader ? 'is-leader' : ''}`}>
      <div className="participant-card-header">
        <div className="participant-badge-container">
          <span className="participant-index-badge">
            {index + 1}
          </span>
          <div className="participant-title-group">
            <h4 className="participant-title">
              {isLeader ? 'Team Leader / Primary Participant' : `Team Member ${index + 1}`}
            </h4>
            <span className="participant-subtitle">
              {isLeader ? 'Primary contact for fest communications' : 'Required team member details'}
            </span>
          </div>
        </div>

        {canRemove && !isLeader && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="btn-remove-participant"
            title="Remove member"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span>Remove</span>
          </button>
        )}
      </div>

      <div className="participant-card-body">
        {/* Baseline Fixed Fields Grid */}
        <div className="participant-fields-grid">
          <div className="reg-field-container">
            <label htmlFor={`p_${index}_fullName`} className="reg-field-label">
              Full Name <span className="reg-required-star">*</span>
            </label>
            <input
              id={`p_${index}_fullName`}
              type="text"
              value={fixed.fullName || ''}
              onChange={(e) => handleFixedChange('fullName', e.target.value)}
              placeholder="e.g. John Doe"
              disabled={disabled}
              className={`reg-form-input ${errors[`participants.${index}.fixed.fullName`] ? 'is-invalid' : ''}`}
            />
            {errors[`participants.${index}.fixed.fullName`] && (
              <p className="reg-field-error" role="alert">
                {errors[`participants.${index}.fixed.fullName`]}
              </p>
            )}
          </div>

          <div className="reg-field-container">
            <label htmlFor={`p_${index}_email`} className="reg-field-label">
              Email Address <span className="reg-required-star">*</span>
            </label>
            <input
              id={`p_${index}_email`}
              type="email"
              value={fixed.email || ''}
              onChange={(e) => handleFixedChange('email', e.target.value)}
              placeholder="e.g. participant@domain.com"
              disabled={disabled}
              className={`reg-form-input ${errors[`participants.${index}.fixed.email`] ? 'is-invalid' : ''}`}
            />
            {errors[`participants.${index}.fixed.email`] && (
              <p className="reg-field-error" role="alert">
                {errors[`participants.${index}.fixed.email`]}
              </p>
            )}
          </div>

          <div className="reg-field-container">
            <label htmlFor={`p_${index}_mobile`} className="reg-field-label">
              Mobile Number <span className="reg-required-star">*</span>
            </label>
            <input
              id={`p_${index}_mobile`}
              type="tel"
              value={fixed.mobile || ''}
              onChange={(e) => handleFixedChange('mobile', e.target.value)}
              placeholder="10-digit mobile number"
              disabled={disabled}
              className={`reg-form-input ${errors[`participants.${index}.fixed.mobile`] ? 'is-invalid' : ''}`}
            />
            {errors[`participants.${index}.fixed.mobile`] && (
              <p className="reg-field-error" role="alert">
                {errors[`participants.${index}.fixed.mobile`]}
              </p>
            )}
          </div>

          <div className="reg-field-container">
            <label htmlFor={`p_${index}_college`} className="reg-field-label">
              College / University <span className="reg-required-star">*</span>
            </label>
            <input
              id={`p_${index}_college`}
              type="text"
              value={fixed.college || ''}
              onChange={(e) => handleFixedChange('college', e.target.value)}
              placeholder="e.g. Rajarajeswari College of Engineering"
              disabled={disabled}
              className={`reg-form-input ${errors[`participants.${index}.fixed.college`] ? 'is-invalid' : ''}`}
            />
            {errors[`participants.${index}.fixed.college`] && (
              <p className="reg-field-error" role="alert">
                {errors[`participants.${index}.fixed.college`]}
              </p>
            )}
          </div>
        </div>

        {/* Custom Participant Fields */}
        {customFields.length > 0 && (
          <div className="participant-custom-fields-section">
            <h5 className="participant-custom-heading">Additional Participant Information</h5>
            <div className="participant-fields-grid">
              {customFields.map((field) => (
                <DynamicField
                  key={field.id || field.fieldKey}
                  field={field}
                  value={custom[field.fieldKey]}
                  onChange={handleCustomChange}
                  error={errors[`participants.${index}.custom.${field.fieldKey}`]}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
