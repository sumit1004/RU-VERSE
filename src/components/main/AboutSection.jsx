import React from 'react';
import PlanetHUD from '../PlanetHUD';
import ScrollCue from './ScrollCue';
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
        <div className="sector-watermark">02</div>
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

              In a university not so far away, a group of students decided that technology deserved more than classrooms and assignments. They wanted a place to build, compete, experiment, explore and create. And so, RUVERSE was born.
            </p>
            <p className="editorial-galaxy">
              From young Padawans taking their first steps into technology to
              experienced Jedi building what comes next, there is a place for
              everyone in this galaxy.
            </p>
          </div>
        </div>

        <ScrollCue text="SCROLL TO NAVIGATE DEEP SPACE" />
      </div>
    </section>
  );
}
