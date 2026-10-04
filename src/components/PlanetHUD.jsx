import React from 'react';

export default function PlanetHUD({ section, active, progress }) {
  // Panel is fully visible when locked in middle (e.g. progress between 0.28 and 0.74)
  const isLocked = active && progress >= 0.28 && progress <= 0.74;
  const isExiting = active && progress > 0.74;

  let stateClass = 'hidden';
  if (isLocked) stateClass = 'is-locked';
  else if (isExiting) stateClass = 'is-exiting';
  else if (active && progress < 0.28) stateClass = 'is-entering';

  const handleCtaClick = (e) => {
    e.preventDefault();
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

      {/* Sector 03: Events Specific Highlights */}
      {section.id === 'events' && (
        <div className="hud-highlights">
          <div className="highlight-pill">COMPETE</div>
          <div className="highlight-pill">CREATE</div>
          <div className="highlight-pill">CONQUER</div>
        </div>
      )}

      {/* Description */}
      <p className="hud-desc">{section.description}</p>
      {section.subnote && <p className="hud-subnote">{section.subnote}</p>}

      {/* Sector 04: Contact Specific Details */}
      {section.id === 'contact' && (
        <div className="hud-contact-box">
          <p className="contact-loc">📍 Rungta International Skills University, Bhilai (C.G.)</p>
          <p className="contact-channel">TRANSMISSION: {section.email || 'HELLO@RUVERSE.IN'}</p>
          <p className="contact-phone">HOTLINE: {section.phone || '+91 788 666666'}</p>
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
