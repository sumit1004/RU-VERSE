import React from 'react';
import PlanetHUD from '../PlanetHUD';
import { universeSections } from '../../data/universeData';

export default function ContactSection({ active, progress }) {
  const section = universeSections[3];
  const isVisible = active && progress >= 0.12;

  // Smooth centering interpolation for "THE FUTURE IS HERE..." closing transmission
  const centerRaw = Math.max(0, Math.min(1, (progress - 0.35) / 0.50));
  const centerEase = centerRaw < 0.5
    ? 4 * centerRaw * centerRaw * centerRaw
    : 1 - Math.pow(-2 * centerRaw + 2, 3) / 2;

  const isCentering = active && centerEase > 0.01;

  return (
    <section
      id="section-contact"
      className={`universe-pinned-section section-contact ${active ? 'is-active-section' : ''} ${isCentering ? 'is-centering' : ''}`}
      style={{
        '--center-progress': centerEase.toFixed(3),
      }}
    >
      <div className="pinned-content-stage">
        {/* Sector Watermark & Floating Badge (Fade out as section reaches final centered state) */}
        <div
          className="sector-watermark"
          style={{ opacity: Math.max(0, 0.03 * (1 - centerEase * 1.5)) }}
        >
          04
        </div>
        <div
          className="sector-floating-badge"
          style={{ opacity: Math.max(0, 1 - centerEase * 2) }}
        >
          <span className="pulse-indicator" />
          <span>CONTACT VECTOR</span>
        </div>

        {/* Existing Sector Briefing HUD Box */}
        <PlanetHUD
          section={section}
          active={active}
          progress={progress}
        />

        {/* In-Section Closing Transmission */}
        <div className={`sector-editorial-canvas contact-editorial ${isVisible ? 'visible' : ''}`}>
          <div className="closing-transmission-block">
            <div
              className="editorial-kicker"
              style={{ opacity: Math.max(0, 1 - centerEase * 1.8) }}
            >
              <span className="kicker-pulse" />
              <span>TRANSMISSION COMPLETE // ALL CHANNELS ACTIVE</span>
            </div>

            <h2 className="closing-headline">THE FUTURE IS HERE.</h2>

            <div className="closing-event-identity">
              <span className="closing-brand">RUVERSE 2026</span>
              <span className="closing-dot">•</span>
              <span className="closing-dates">21–24 OCTOBER</span>
              <span className="closing-dot">•</span>
              <span className="closing-univ">RUNGTA INTERNATIONAL SKILLS UNIVERSITY</span>
            </div>
          </div>
        </div>

        {/* Minimal in-section footer */}
        <footer className={`in-section-footer ${isVisible ? 'visible' : ''}`}>
          <div className="footer-left">
            <span>© 2026 RUVERSE. All rights reserved.</span>
          </div>
          <div className="footer-right">
            <span>Rungta International Skills University, Bhilai (C.G.)</span>
          </div>
        </footer>
      </div>
    </section>
  );
}
