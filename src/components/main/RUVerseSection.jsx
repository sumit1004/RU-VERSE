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
              In a university not so far away, a group of students decided that technology deserved more than classrooms and assignments. They wanted a place to build, compete, experiment, explore and create. And so, RUVERSE was born.

            </p>
            <p className="editorial-galaxy">
              From young Padawans taking their first steps into technology to
              experienced Jedi building what comes next, there is a place for
              everyone in this galaxy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
