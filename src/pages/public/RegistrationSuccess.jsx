import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import './registration.css';

export default function RegistrationSuccess() {
  const { registrationNumber } = useParams();
  const location = useLocation();
  const stateData = location.state?.registration;

  const [regData, setRegData] = useState(stateData || null);

  useEffect(() => {
    // If state data wasn't passed via router transition, use minimal fallback
    if (!regData && registrationNumber) {
      setRegData({
        registrationNumber,
        eventTitle: 'RUVERSE 2026 Event',
        submittedAt: new Date().toISOString(),
      });
    }
  }, [registrationNumber, regData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="public-reg-page">
      <div className="reg-container" style={{ maxWidth: '680px' }}>
        <div className="reg-top-nav">
          <Link to="/#events" className="reg-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Back to Festival Events</span>
          </Link>
          <span className="reg-brand-badge">RUVERSE 2026</span>
        </div>

        <div className="success-page-card">
          <div className="success-icon-glow">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h1 className="success-title">Registration Confirmed</h1>
          <p className="success-subtitle">
            Your official entry has been logged into the RUVERSE 2026 matrix.
          </p>

          <div className="success-number-box">
            <div className="success-number-label">Official Registration ID</div>
            <div className="success-number-code">{registrationNumber || regData?.registrationNumber}</div>
          </div>

          <div className="success-details-list">
            {regData?.eventTitle && (
              <div className="success-detail-item">
                <span className="success-detail-label">Event:</span>
                <span className="success-detail-val">{regData.eventTitle}</span>
              </div>
            )}

            {regData?.registrationType && (
              <div className="success-detail-item">
                <span className="success-detail-label">Entry Mode:</span>
                <span className="success-detail-val">{regData.registrationType}</span>
              </div>
            )}

            {regData?.teamName && (
              <div className="success-detail-item">
                <span className="success-detail-label">Team Name:</span>
                <span className="success-detail-val">{regData.teamName}</span>
              </div>
            )}

            {regData?.participantCount && (
              <div className="success-detail-item">
                <span className="success-detail-label">Participants:</span>
                <span className="success-detail-val">{regData.participantCount} Member(s)</span>
              </div>
            )}

            <div className="success-detail-item">
              <span className="success-detail-label">Submitted On:</span>
              <span className="success-detail-val">
                {new Date(regData?.submittedAt || Date.now()).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          <div className="success-actions">
            <button type="button" onClick={handlePrint} className="btn-success-action is-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Print / Save Receipt</span>
            </button>

            <Link to="/#events" className="btn-success-action is-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Explore More Events</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
