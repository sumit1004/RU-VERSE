import React from 'react';
import PlanetHUD from '../PlanetHUD';
import { universeSections } from '../../data/universeData';
import { eventsData } from '../../data/eventsData';

export default function EventsSection({ active, progress }) {
  const section = universeSections[2];
  const isVisible = active && progress >= 0.15;

  return (
    <section
      id="section-events"
      className={`universe-pinned-section section-events ${active ? 'is-active-section' : ''}`}
    >
      <div className="pinned-content-stage">
        <div className="sector-watermark">03</div>
        <div className="sector-floating-badge">
          <span className="pulse-indicator" />
          <span>EVENTS VECTOR</span>
        </div>

        {/* Existing Sector Briefing HUD Box */}
        <PlanetHUD
          section={section}
          active={active}
          progress={progress}
        />

        {/* In-Section 8-Event Typography Manifest in Empty Space */}
        <div className={`sector-editorial-canvas events-editorial ${isVisible ? 'visible' : ''}`}>
          <div className="editorial-kicker">
            <span className="kicker-pulse" />
            <span></span>
          </div>

          <div className="events-manifest-grid">
            <div className="manifest-col">
              {eventsData.slice(0, 4).map((event) => (
                <div key={event.id} className="manifest-item">
                  <span className="manifest-num">{event.number}</span>
                  <div className="manifest-text">
                    <h4 className="manifest-title">{event.title}</h4>
                    <p className="manifest-desc">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="manifest-col">
              {eventsData.slice(4, 8).map((event) => (
                <div key={event.id} className="manifest-item">
                  <span className="manifest-num">{event.number}</span>
                  <div className="manifest-text">
                    <h4 className="manifest-title">{event.title}</h4>
                    <p className="manifest-desc">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>

        <div className="scroll-cue">
          <span>SCROLL TO NAVIGATE DEEP SPACE</span>
          <div className="cue-arrow">↓</div>
        </div>
      </div>
    </section>
  );
}
