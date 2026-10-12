import React from 'react';
import PlanetHUD from '../PlanetHUD';
import { universeSections } from '../../data/universeData';

export default function AboutSection({ active, progress }) {
  const section = universeSections[1];
  const isVisible = active && progress >= 0.15;

  return (
    <section
      id="section-about"
      className={`universe-pinned-section section-about ${active ? 'is-active-section' : ''}`}
    >
      <div className="pinned-content-stage">
        <div className="sector-floating-badge">
          <span className="pulse-indicator" />
          <span>ABOUT VECTOR</span>
        </div>

        {/* Existing Sector Briefing HUD Box */}
        <PlanetHUD
          section={section}
          active={active}
          progress={progress}
        />

        {/* In-Section Editorial Typography directly in the empty space */}
        <div className={`sector-editorial-canvas about-editorial ${isVisible ? 'visible' : ''}`}>


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
