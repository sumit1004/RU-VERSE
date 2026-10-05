import React, { useState, useEffect, useCallback } from 'react';
import { createUniverseTimeline } from '../../animations/universeTimeline';
import SpaceCanvas from '../../scenes/SpaceCanvas';
import HeroSection from './HeroSection';
import RUVerseSection from './RUVerseSection';
import AboutSection from './AboutSection';
import EventsSection from './EventsSection';
import ContactSection from './ContactSection';
import CommandBar from '../CommandBar/CommandBar';
import ShipCalibrationPanel from '../debug/ShipCalibrationPanel';
import ScreenTargetOverlay from '../debug/ScreenTargetOverlay';

export default function MainWebsite({ quality }) {
  const [activeSection, setActiveSection] = useState(-1);
  const [sectionProgress, setSectionProgress] = useState(0);

  const handleSectionUpdate = useCallback((index, progress) => {
    setActiveSection(index);
    setSectionProgress(progress);
  }, []);

  // Initialize GSAP ScrollTrigger timeline for the Hero and 4 planetary stages
  useEffect(() => {
    const cleanup = createUniverseTimeline({
      onSectionUpdate: handleSectionUpdate,
    });
    return () => cleanup();
  }, [handleSectionUpdate]);

  const handleNavigate = (index) => {
    if (window.__navigateToSection) {
      window.__navigateToSection(index);
    }
  };

  return (
    <div className="main-website-root">
      {/* 1. Single Persistent 3D WebGL Canvas for Planetary Universe & Starfield */}
      <SpaceCanvas
        activeSection={activeSection}
        sectionProgress={sectionProgress}
        isPlanetPhase={true}
        quality={quality}
      />

      {/* Calibration System: Screen Target Overlay & Control Panel (Hidden in Production) */}
      <ScreenTargetOverlay />
      <ShipCalibrationPanel />

      {/* 2. Top Fixed Global HUD Header */}
      <header className="global-hud">
        <div className="hud-cell brand" onClick={() => handleNavigate(-1)}>
          <img className='logo' src="./models/planets/RUI_LOGO_WHITE.png" alt="" />
        </div>
        <div className="hud-cell center-coords">
          <span>ORBITAL FREQUENCY // RUNGTA INTERNATIONAL SKILLS UNIVERSITY</span>
        </div>
        <div className="hud-cell quality-badge">
          <span>SYS TIER: {quality?.tier ? quality.tier.toUpperCase() : 'HIGH'}</span>
        </div>
      </header>

      {/* Side Scanline Grid */}
      <div className="hud-grid-overlay" />

      {/* 3. Main Continuous Sector Flow:
             HERO
             ↓
             SECTOR 01: RU VERSE
             ↓
             SECTOR 02: ABOUT US (with in-section story typography)
             ↓
             SECTOR 03: EVENTS (with in-section 8-event manifest)
             ↓
             SECTOR 04: CONTACT (with in-section closing & footer)
      */}
      <main className="universe-scroll-wrapper">
        <HeroSection />

        <RUVerseSection
          active={activeSection === 0}
          progress={activeSection === 0 ? sectionProgress : 0}
        />

        <AboutSection
          active={activeSection === 1}
          progress={activeSection === 1 ? sectionProgress : 0}
        />

        <EventsSection
          active={activeSection === 2}
          progress={activeSection === 2 ? sectionProgress : 0}
        />

        <ContactSection
          active={activeSection === 3}
          progress={activeSection === 3 ? sectionProgress : 0}
        />
      </main>

      {/* 4. Fixed Futuristic Command Navigation Bar */}
      <CommandBar
        active={activeSection}
        onNavigate={handleNavigate}
        mobile={quality?.mobile || false}
      />
    </div>
  );
}
