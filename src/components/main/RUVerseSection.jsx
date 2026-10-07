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
              And now, introducing RUVERSE — the annual tech and innovation universe of Rungta University. A space where technology, creativity, competition, and collaboration come together to shape the ideas of tomorrow.
            </p>
            {/* <p className="editorial-galaxy">
              Over four intense, exciting days, RUVERSE brings together brilliant minds through hackathons, coding challenges, robotics showdowns, design sprints, innovation labs, guest keynotes, and experiences that push boundaries. It’s where students, tech enthusiasts, and industry innovators connect, build, compete, and create the next generation of technology.
            </p> */}
          </div>
        </div>
      </div>
    </section>
  );
}
