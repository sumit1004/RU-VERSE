import React from 'react';
import { universeSections } from '../../data/universeData';

const navLabels = {
  desktop: ['RU VERSE', 'ABOUT US', 'EVENTS', 'CONTACT'],
  mobile: ['HOME', 'ABOUT', 'EVENTS', 'CONTACT']
};

export default function CommandBar({ active = 0, onNavigate, mobile = false }) {
  const labels = mobile ? navLabels.mobile : navLabels.desktop;

  return (
    <nav className="command-bar" aria-label="Universe Command Navigation">
      <div className="command-bar-inner">
        <div className="command-logo" onClick={() => onNavigate(-1)} style={{ cursor: 'pointer' }}>
          <span className="logo-text">RV</span>
          <span className="logo-slash">/</span>
          <span className="logo-sub">2026</span>
        </div>

        <div className="command-links">
          {universeSections.map((section, index) => {
            const isActive = index === active;
            return (
              <button
                key={section.id}
                className={`command-btn ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(index)}
              >
                <span className="btn-index">0{index + 1}</span>
                <span className="btn-label">{labels[index]}</span>
                {isActive && <span className="active-indicator" />}
              </button>
            );
          })}
        </div>

        <div className="command-status">
          <span className="status-dot" />
          <span className="status-text">SYSTEM ONLINE</span>
        </div>
      </div>
    </nav>
  );
}
