import React from 'react';

export default function PlanetHUD({ section, active, progress, onCtaClick }) {
  const isContact = section?.id === 'contact';
  const exitThreshold = isContact ? 0.45 : 0.74;

  // Panel is fully visible when locked in middle
  const isLocked = active && progress >= 0.25 && progress <= exitThreshold;
  const isExiting = active && progress > exitThreshold;

  let stateClass = 'hidden';
  if (isLocked) stateClass = 'is-locked';
  else if (isExiting) stateClass = 'is-exiting';
  else if (active && progress < 0.25) stateClass = 'is-entering';

  const handleCtaClick = (e) => {
    e.preventDefault();
    if (section.id === 'contact') {
      const email = section.email || 'ruverse@rungta.ac.in';
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent('RUVERSE 2026 Inquiry')}`;
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (onCtaClick) {
      onCtaClick(section);
      return;
    }
    if (section.id === 'ru-verse' && window.__navigateToSection) {
      window.__navigateToSection(1);
    } else if (section.id === 'about' && window.__navigateToSection) {
      window.__navigateToSection(2);
    } else if (section.id === 'events' && window.__navigateToSection) {
      window.__navigateToSection(3);
    } else if (section.targetAnchor) {
      const targetEl = document.querySelector(section.targetAnchor);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <article className={`planet-hud ${section.entry} ${stateClass}`} data-sector={section.sector}>
      {/* Console Corner Brackets */}
      <div className="hud-corner top-l" />
      <div className="hud-corner top-r" />
      <div className="hud-corner btm-l" />
      <div className="hud-corner btm-r" />

      {/* Header Metadata */}
      <div className="hud-meta">
        <span className="hud-tag">SECTOR {section.sector}</span>
        <span className="hud-divider">/</span>
        <span className="hud-coords">{section.coordinates}</span>
      </div>

      <div className="hud-accent-line" />

      {/* Main Title & Tagline */}
      <h2 className="hud-title">{section.title}</h2>
      {section.tagline && <p className="hud-tagline">{section.tagline}</p>}

      {/* Description */}
      <p className="hud-desc">{section.description}</p>
      {section.subnote && <p className="hud-subnote">{section.subnote}</p>}

      {/* Sector 04: Contact Specific Details */}
      {section.id === 'contact' && (
        <div className="hud-contact-box">
          <p className="contact-loc">Rungta International Skills University, Bhilai (C.G.)</p>
          <p className="contact-channel">
            TRANSMISSION:{' '}
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(section.email || 'ruverse@rungta.ac.in')}&su=${encodeURIComponent('RUVERSE 2026 Inquiry')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="phone-link"
              onClick={(e) => {
                e.preventDefault();
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(section.email || 'ruverse@rungta.ac.in')}&su=${encodeURIComponent('RUVERSE 2026 Inquiry')}`;
                window.open(gmailUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              {section.email || 'ruverse@rungta.ac.in'}
            </a>
          </p>
          {section.contacts ? (
            section.contacts.map((c, idx) => (
              <p key={idx} className="contact-phone">
                {c.name}: <a href={`tel:${c.phone.replace(/\s+/g, '')}`} className="phone-link">{c.phone}</a>
              </p>
            ))
          ) : section.phones ? (
            section.phones.map((num, idx) => (
              <p key={idx} className="contact-phone">
                <a href={`tel:${num.replace(/\s+/g, '')}`} className="phone-link">{num}</a>
              </p>
            ))
          ) : (
            <p className="contact-phone">
              <a href={`tel:${(section.phone || '+91 9302787061').replace(/\s+/g, '')}`} className="phone-link">{section.phone || '+91 9302787061'}</a>
            </p>
          )}

          {/* Social / External College Links */}
          <div className="hud-social-box">
            <div className="hud-social-divider" />
            <div className="hud-social-links">
              <a
                href={section.instagramUrl || 'https://instagram.com/ruverse.rungta'}
                target="_blank"
                rel="noopener noreferrer"
                className="hud-social-item"
                aria-label="Follow RUVERSE on Instagram"
                title="Follow RUVERSE on Instagram"
              >
                <svg className="hud-social-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span>Instagram</span>
              </a>

              <span className="hud-social-sep">•</span>

              <a
                href={section.collegeUrl || 'https://rungta.ac.in'}
                target="_blank"
                rel="noopener noreferrer"
                className="hud-social-item"
                aria-label="Visit Rungta University Website"
                title="Visit Rungta University Website"
              >
                <svg className="hud-social-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span>College Website</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CTA Action (Only rendered if section has a CTA defined) */}
      {section.cta && (
        <button className="hud-cta" onClick={handleCtaClick}>
          <span>{section.cta}</span>
          <span className="cta-arrow">→</span>
        </button>
      )}
    </article>
  );
}
