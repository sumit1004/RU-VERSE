import React from 'react';
import PlanetHUD from '../PlanetHUD';
import ScrollCue from './ScrollCue';
import { universeSections } from '../../data/universeData';

export default function RUVerseSection({ active, progress }) {
  const section = universeSections[0];
  return (
    <section
      id="section-ru-verse"
      className={`universe-pinned-section section-ru-verse ${active ? 'is-active-section' : ''}`}
    >
      <div className="pinned-content-stage">
        <div className="sector-watermark">01</div>
        <div className="sector-floating-badge">
          <span className="pulse-indicator" />
          <span>RU VERSE PRIME SECTOR</span>
        </div>
        <PlanetHUD
          section={section}
          active={active}
          progress={progress}
        />
        <ScrollCue text="SCROLL TO NAVIGATE DEEP SPACE" />
      </div>
    </section>
  );
}
