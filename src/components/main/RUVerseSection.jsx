import React from 'react';
import PlanetHUD from '../PlanetHUD';
import { universeSections } from '../../data/universeData';

export default function RUVerseSection({ active, progress }) {
  const section = universeSections[0];
  const isVisible = active && progress >= 0.15;

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

        {/* In-Section Editorial Typography for RU */}
        <div className={`sector-editorial-canvas ru-verse-editorial ${isVisible ? 'visible' : ''}`}>
          <div className="editorial-story-flow">
            <p className="editorial-body">
              Born from the 27-year legacy of the Rungta Group, Rungta University is built for a generation that refuses to learn inside a box.

            </p>
            <p className="editorial-galaxy">
              At RU, technology, skills, creativity and industry come together to shape future-ready professionals and create an ecosystem where ideas are meant to be built.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
