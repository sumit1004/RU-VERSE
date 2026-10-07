import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import registrationService from '../../services/registrationService.js';
import DynamicField from '../../components/registration/DynamicField.jsx';
import ParticipantForm from '../../components/registration/ParticipantForm.jsx';
import './registration.css';

export default function PublicRegistration() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [data, setData] = useState(null);

  // Form State
  const [regType, setRegType] = useState('INDIVIDUAL');
  const [teamName, setTeamName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [registrationFields, setRegistrationFields] = useState({});

  // UI state
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRegistrationData();
  }, [slug]);

  const loadRegistrationData = async () => {
    try {
      setLoading(true);
      setPageError(null);
      const res = await registrationService.getRegistrationForm(slug);
      setData(res);

      const event = res.event;
      const defaultType = event.registrationType === 'TEAM' ? 'TEAM' : 'INDIVIDUAL';
      setRegType(defaultType);

      // Initialize participants
      const initialCount = defaultType === 'TEAM' ? (event.teamMinSize || 2) : 1;
      const initialParticipants = Array.from({ length: initialCount }, () => ({
        fixed: { fullName: '', email: '', mobile: '', college: '' },
        custom: {},
      }));
      setParticipants(initialParticipants);
    } catch (err) {
      console.error('Failed to load registration data:', err);
      setPageError(err.message || 'Registration service is temporarily unavailable. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegTypeChange = (newType) => {
    if (newType === regType) return;
    if (!data?.event) return;

    const event = data.event;
    setRegType(newType);
    setErrors({});
    setGlobalError(null);

    if (newType === 'INDIVIDUAL') {
      setParticipants([
        participants[0] || {
          fixed: { fullName: '', email: '', mobile: '', college: '' },
          custom: {},
        },
      ]);
    } else {
      const min = event.teamMinSize || 2;
      if (participants.length < min) {
        const needed = min - participants.length;
        const added = Array.from({ length: needed }, () => ({
          fixed: { fullName: '', email: '', mobile: '', college: '' },
          custom: {},
        }));
        setParticipants([...participants, ...added]);
      }
    }
  };

  const handleParticipantChange = (index, scope, fieldKey, value) => {
    setParticipants((prev) => {
      const next = [...prev];
      const p = { ...next[index] };
      p[scope] = { ...p[scope], [fieldKey]: value };
      next[index] = p;
      return next;
    });

    // Clear field-specific error
    const errKey = `participants.${index}.${scope}.${fieldKey}`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[errKey];
        return updated;
      });
    }
  };

  const handleAddParticipant = () => {
    if (!data?.event) return;
    const max = data.event.teamMaxSize || 5;
    if (participants.length >= max) return;

    setParticipants((prev) => [
      ...prev,
      {
        fixed: { fullName: '', email: '', mobile: '', college: '' },
        custom: {},
      },
    ]);
  };

  const handleRemoveParticipant = (index) => {
    if (!data?.event) return;
    const min = data.event.teamMinSize || 2;
    if (participants.length <= min) return;

    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRegistrationFieldChange = (fieldKey, value) => {
    setRegistrationFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));

    const errKey = `registrationFields.${fieldKey}`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[errKey];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$|^(\+?\d{1,3}[- ]?)?\d{10,14}$/;

    if (regType === 'TEAM') {
      if (!teamName || !teamName.trim()) {
        newErrors.teamName = 'Team name is required.';
      } else if (teamName.trim().length < 2) {
        newErrors.teamName = 'Team name must be at least 2 characters.';
      }

      const min = data.event.teamMinSize || 2;
      const max = data.event.teamMaxSize || 5;
      if (participants.length < min) {
        newErrors.global = `Team must have at least ${min} participants.`;
      }
      if (participants.length > max) {
        newErrors.global = `Team cannot exceed ${max} participants.`;
      }
    }

    // Participant validation
    const seenEmails = new Set();
    participants.forEach((p, idx) => {
      const fixed = p.fixed || {};

      if (!fixed.fullName || !fixed.fullName.trim()) {
        newErrors[`participants.${idx}.fixed.fullName`] = 'Full name is required.';
      }

      if (!fixed.email || !fixed.email.trim()) {
        newErrors[`participants.${idx}.fixed.email`] = 'Email address is required.';
      } else if (!emailRegex.test(fixed.email.trim())) {
        newErrors[`participants.${idx}.fixed.email`] = 'Enter a valid email address.';
      } else {
        const normalized = fixed.email.trim().toLowerCase();
        if (seenEmails.has(normalized)) {
          newErrors[`participants.${idx}.fixed.email`] = 'Duplicate email inside the team.';
        }
        seenEmails.add(normalized);
      }

      if (!fixed.mobile || !fixed.mobile.trim()) {
        newErrors[`participants.${idx}.fixed.mobile`] = 'Mobile number is required.';
      } else if (!phoneRegex.test(fixed.mobile.trim())) {
        newErrors[`participants.${idx}.fixed.mobile`] = 'Enter a valid 10-digit mobile number.';
      }

      if (!fixed.college || !fixed.college.trim()) {
        newErrors[`participants.${idx}.fixed.college`] = 'College name is required.';
      }

      // Custom participant fields
      const participantFields = data.form.fields.filter((f) => f.fieldScope === 'PARTICIPANT' && !f.isFixed);
      participantFields.forEach((f) => {
        const val = p.custom ? p.custom[f.fieldKey] : undefined;
        if (f.isRequired && (val === undefined || val === null || String(val).trim() === '')) {
          newErrors[`participants.${idx}.custom.${f.fieldKey}`] = `${f.label} is required.`;
        }
      });
    });

    // Registration-level custom fields
    const regFields = data.form.fields.filter((f) => f.fieldScope === 'REGISTRATION');
    regFields.forEach((f) => {
      const val = registrationFields[f.fieldKey];
      if (f.isRequired && (val === undefined || val === null || String(val).trim() === '')) {
        newErrors[`registrationFields.${f.fieldKey}`] = `${f.label} is required.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(null);

    if (!data?.availability?.isOpen) {
      setGlobalError('Registration for this event is currently closed.');
      return;
    }

    if (!validateForm()) {
      setGlobalError('Please fix the highlighted errors in the form before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        registrationType: regType,
        teamName: regType === 'TEAM' ? teamName.trim() : null,
        participants,
        registrationFields,
        formVersion: data.form.version,
      };

      const result = await registrationService.submitRegistration(slug, payload);

      navigate(`/registration/success/${result.registrationNumber}`, {
        state: { registration: result },
        replace: true,
      });
    } catch (err) {
      console.error('Registration submission error:', err);
      const message = err.message || 'Failed to submit registration. Please try again.';
      setGlobalError(message);

      if (err.errors) {
        setErrors((prev) => ({ ...prev, ...err.errors }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-reg-page">
        <div className="reg-container">
          <div className="reg-header-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <p style={{ color: '#00f0ff', letterSpacing: '1px' }}>INITIALIZING EVENT REGISTRATION PORTAL...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pageError || !data) {
    return (
      <div className="public-reg-page">
        <div className="reg-container">
          <div className="reg-top-nav">
            <Link to="/#events" className="reg-back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>Back to RUVERSE Events</span>
            </Link>
          </div>

          <div className="reg-header-card" style={{ textAlign: 'center', padding: '50px 20px' }}>
            <h2 style={{ color: '#f43f5e', marginBottom: '16px' }}>Event Registration Unavailable</h2>
            <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 24px' }}>
              {pageError || 'The event you requested could not be found.'}
            </p>
            <Link to="/#events" className="btn-success-action is-primary">
              Return to Events Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { event, availability, form } = data;
  const participantCustomFields = form.fields.filter((f) => f.fieldScope === 'PARTICIPANT' && !f.isFixed);
  const registrationLevelFields = form.fields.filter((f) => f.fieldScope === 'REGISTRATION');

  const minTeam = event.teamMinSize || 2;
  const maxTeam = event.teamMaxSize || 5;

  return (
    <div className="public-reg-page">
      <div className="reg-container">
        {/* Navigation Bar */}
        <div className="reg-top-nav">
          <Link to={`/events/${slug}`} className="reg-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Back to Event</span>
          </Link>
          <span className="reg-brand-badge">RUVERSE 2026</span>
        </div>

        {/* Header Summary Card */}
        <div className="reg-header-card">
          {event.category && (
            <span className="reg-category-tag">{event.category.name}</span>
          )}
          <h1 className="reg-event-title">{event.title}</h1>
          {event.shortDescription && (
            <p className="reg-event-desc">{event.shortDescription}</p>
          )}

          <div className="reg-meta-row">
            <div className="reg-meta-chip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{event.venue}</span>
            </div>

            <div className="reg-meta-chip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{new Date(event.startDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="reg-meta-chip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>{event.registrationType} Registration</span>
            </div>

            {event.registrationLimit && (
              <div className="reg-meta-chip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span>Capacity: {event.registrationLimit} slots ({availability.remainingSpots ?? 'N/A'} remaining)</span>
              </div>
            )}
          </div>
        </div>

        {/* Availability Status Banner */}
        {!availability.isOpen && (
          <div className={`reg-status-banner is-${availability.status.toLowerCase()}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>{availability.status === 'UPCOMING' ? 'Registration Not Started' : availability.status === 'FULL' ? 'Event Capacity Full' : 'Registration Closed'}</strong>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{availability.message}</p>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {globalError && (
          <div className="reg-global-error" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>Action Required</strong>
              <p style={{ margin: '4px 0 0' }}>{globalError}</p>
            </div>
          </div>
        )}

        {/* Registration Form Form Container */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Registration Type Selection (Only when event supports BOTH) */}
          {event.registrationType === 'BOTH' && (
            <div className="reg-section-card">
              <h3 className="reg-section-title">Select Registration Mode</h3>
              <p className="reg-section-desc">Choose whether you are participating as an individual or with a team.</p>

              <div className="reg-type-selector">
                <div
                  className={`reg-type-option ${regType === 'INDIVIDUAL' ? 'is-selected' : ''}`}
                  onClick={() => handleRegTypeChange('INDIVIDUAL')}
                >
                  <div className="reg-type-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <span className="reg-type-title">Individual</span>
                  <span className="reg-type-hint">Single participant registration</span>
                </div>

                <div
                  className={`reg-type-option ${regType === 'TEAM' ? 'is-selected' : ''}`}
                  onClick={() => handleRegTypeChange('TEAM')}
                >
                  <div className="reg-type-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <span className="reg-type-title">Team Entry</span>
                  <span className="reg-type-hint">{minTeam} to {maxTeam} members</span>
                </div>
              </div>
            </div>
          )}

          {/* Team Information (If Team) */}
          {regType === 'TEAM' && (
            <div className="reg-section-card">
              <h3 className="reg-section-title">Team Information</h3>
              <p className="reg-section-desc">Provide a distinctive identity for your squad in the fest rankings.</p>

              <div className="reg-field-container">
                <label htmlFor="teamName" className="reg-field-label">
                  Team / Clan Name <span className="reg-required-star">*</span>
                </label>
                <input
                  id="teamName"
                  type="text"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    if (errors.teamName) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.teamName;
                        return next;
                      });
                    }
                  }}
                  placeholder="e.g. Quantum Vanguard"
                  disabled={!availability.isOpen || submitting}
                  className={`reg-form-input ${errors.teamName ? 'is-invalid' : ''}`}
                />
                {errors.teamName && (
                  <p className="reg-field-error" role="alert">
                    {errors.teamName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Registration Level Custom Fields */}
          {registrationLevelFields.length > 0 && (
            <div className="reg-section-card">
              <h3 className="reg-section-title">Registration Details</h3>
              <p className="reg-section-desc">Additional event-specific questionnaires.</p>

              {registrationLevelFields.map((field) => (
                <DynamicField
                  key={field.id || field.fieldKey}
                  field={field}
                  value={registrationFields[field.fieldKey]}
                  onChange={handleRegistrationFieldChange}
                  error={errors[`registrationFields.${field.fieldKey}`]}
                  disabled={!availability.isOpen || submitting}
                />
              ))}
            </div>
          )}

          {/* Participant Information Section */}
          <div className="reg-section-card">
            <h3 className="reg-section-title">
              {regType === 'TEAM' ? 'Team Members' : 'Participant Information'}
            </h3>
            <p className="reg-section-desc">
              {regType === 'TEAM'
                ? `Enter details for all team members (${minTeam} to ${maxTeam} allowed).`
                : 'Enter your participant details for event credentials and certificate generation.'}
            </p>

            {participants.map((participant, idx) => (
              <ParticipantForm
                key={idx}
                index={idx}
                participant={participant}
                customFields={participantCustomFields}
                errors={errors}
                onChange={handleParticipantChange}
                onRemove={handleRemoveParticipant}
                canRemove={regType === 'TEAM' && participants.length > minTeam}
                isTeam={regType === 'TEAM'}
                disabled={!availability.isOpen || submitting}
              />
            ))}

            {/* Team Add Member Controls */}
            {regType === 'TEAM' && (
              <div className="team-controls-bar">
                <div className="team-capacity-info">
                  Members registered: <strong>{participants.length}</strong> / {maxTeam}
                  {participants.length < minTeam && (
                    <span style={{ color: '#f43f5e', marginLeft: '8px' }}>
                      (Minimum {minTeam} required)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddParticipant}
                  disabled={!availability.isOpen || submitting || participants.length >= maxTeam}
                  className="btn-add-participant"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add Team Member</span>
                </button>
              </div>
            )}
          </div>

          {/* Submission Button */}
          <div className="reg-submit-area">
            <button
              type="submit"
              disabled={!availability.isOpen || submitting}
              className="btn-submit-registration"
            >
              {submitting ? (
                <>
                  <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                  <span>Submitting Registration...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Submit Registration</span>
                </>
              )}
            </button>

            <p className="reg-terms-notice">
              By submitting, you agree to abide by RUVERSE 2026 event rules and code of conduct.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
