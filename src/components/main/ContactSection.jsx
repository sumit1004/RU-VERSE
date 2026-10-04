import React from 'react';
import PlanetHUD from '../PlanetHUD';
import { universeSections } from '../../data/universeData';

export default function ContactSection({ active, progress }) {
  const section = universeSections[3];
  const isVisible = active && progress >= 0.15;

  return (
    <section
      id="section-contact"
      className={`universe-pinned-section section-contact ${active ? 'is-active-section' : ''}`}
    >
      <div className="pinned-content-stage">
        <div className="sector-watermark">04</div>
        <div className="sector-floating-badge">
          <span className="pulse-indicator" />
          <span>CONTACT VECTOR</span>
        </div>

        {/* Existing Sector Briefing HUD Box */}
        <PlanetHUD
          section={section}
          active={active}
          progress={progress}
        />

        {/* In-Section Closing Transmission & Minimal Footer in Empty Space */}
        <div className={`sector-editorial-canvas contact-editorial ${isVisible ? 'visible' : ''}`}>
          <div className="closing-transmission-block">
            <div className="editorial-kicker">
              <span className="kicker-pulse" />
              <span>TRANSMISSION COMPLETE // ALL CHANNELS ACTIVE</span>
            </div>

            <h2 className="closing-headline">THE FUTURE IS WAITING.</h2>

            <div className="closing-event-identity">
              <span className="closing-brand">RUVERSE 2026</span>
              <span className="closing-dot">•</span>
              <span className="closing-dates">21–24 OCTOBER</span>
              <span className="closing-dot">•</span>
              <span className="closing-univ">RUNGTA INTERNATIONAL SKILLS UNIVERSITY</span>
            </div>

            <div className="closing-motto-row">
              <span>BUILD. EXPLORE. CREATE.</span>
            </div>
          </div>

          {/* Minimal in-section footer */}
          <div className="in-section-footer">
            <div className="footer-left">
              <span>© 2026 RUVERSE. All rights reserved.</span>
            </div>
            <div className="footer-right">
              <span>Rungta International Skills University, Bhilai (C.G.)</span>
            </div>
          </div>
        </div>

        <div className="scroll-cue">
          <span>TRANSMISSION COMPLETE</span>
          <div className="cue-arrow">✦</div>
        </div>
      </div>
    </section>
  );
}
