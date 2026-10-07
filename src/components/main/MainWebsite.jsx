import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { createUniverseTimeline } from '../../animations/universeTimeline';
import SpaceCanvas from '../../scenes/SpaceCanvas';
import HeroSection from './HeroSection';
import RUVerseSection from './RUVerseSection';
import AboutSection from './AboutSection';
import EventsSection from './EventsSection';
import SponsorsSection from './SponsorsSection';
import ContactSection from './ContactSection';
import ScrollCue from './ScrollCue';
import CommandBar from '../CommandBar/CommandBar';
import ShipCalibrationPanel from '../debug/ShipCalibrationPanel';
import ScreenTargetOverlay from '../debug/ScreenTargetOverlay';

export default function MainWebsite({ quality }) {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(-1);
  const [sectionProgress, setSectionProgress] = useState(0);

  // Determine if returning from an event detail / registration page
  const isReturningFromDetail = !!(location.state?.fromPublicDetail || location.state?.targetSection);

  // Automatic Hero Cinematic Intro
  const REVEAL_COMPLETE_PROGRESS = 0.65;
  const reducedMotion = quality?.reducedMotion || false;
  const [introProgress, setIntroProgress] = useState(isReturningFromDetail ? REVEAL_COMPLETE_PROGRESS : 0);
  const [isIntroActive, setIsIntroActive] = useState(!reducedMotion && !isReturningFromDetail);

  useEffect(() => {
    if (reducedMotion || isReturningFromDetail) {
      setIntroProgress(REVEAL_COMPLETE_PROGRESS);
      setIsIntroActive(false);
      return;
    }

    // Always explicitly start at progress 0 on fresh Hero mount
    setIntroProgress(0);
    setIsIntroActive(true);

    let animationFrameId;
    const duration = 4000; // 4.0s smooth, cinematic flight from top-left to full logo reveal
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const u = Math.min(1, elapsed / duration);
      // Smooth cubic ease-in-out
      const eased = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      const currentVal = eased * REVEAL_COMPLETE_PROGRESS;

      setIntroProgress(currentVal);

      if (u < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setIntroProgress(REVEAL_COMPLETE_PROGRESS);
        setIsIntroActive(false);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [reducedMotion, isReturningFromDetail]);

  const handleSectionUpdate = useCallback((index, progress) => {
    setActiveSection(index);
    setSectionProgress(progress);
  }, []);

  // Initialize GSAP ScrollTrigger timeline for the Hero and 4 planetary stages
  useEffect(() => {
    const cleanup = createUniverseTimeline({
      onSectionUpdate: handleSectionUpdate,
    });

    // If navigated with targetSection 'events' or hash #events, scroll smoothly to events
    if (location.state?.targetSection === 'events' || window.location.hash === '#events') {
      const timer = setTimeout(() => {
        if (window.__navigateToSection) {
          window.__navigateToSection(2); // Index 2 = Events Vector
        }
      }, 150);
      return () => {
        clearTimeout(timer);
        cleanup();
      };
    }

    return () => cleanup();
  }, [handleSectionUpdate, location.state]);

  const handleNavigate = (index) => {
    if (window.__navigateToSection) {
      window.__navigateToSection(index);
    }
  };

  // Calculate single shared visual progress for Hero
  // During intro: strictly uses introProgress (starts at 0.0)
  // After intro: seamlessly maps scrollProgress (0 -> 1) starting from 0.65 baseline
  let effectiveHeroProgress;
  if (isIntroActive) {
    effectiveHeroProgress = introProgress;
  } else {
    effectiveHeroProgress = REVEAL_COMPLETE_PROGRESS + sectionProgress * (1 - REVEAL_COMPLETE_PROGRESS);
  }

  const canvasProgress = activeSection === -1 ? effectiveHeroProgress : sectionProgress;
  const heroProgress = activeSection === -1 ? effectiveHeroProgress : (activeSection < -1 ? 0 : 1);

  return (
    <div className="main-website-root">
      {/* 1. Single Persistent 3D WebGL Canvas for Planetary Universe & Starfield */}
      <SpaceCanvas
        activeSection={activeSection}
        sectionProgress={canvasProgress}
        isPlanetPhase={true}
        quality={quality}
      />

      {/* Calibration System: Screen Target Overlay & Control Panel (Hidden in Production) */}
      <ScreenTargetOverlay />
      <ShipCalibrationPanel />

      {/* 2. Top Fixed Global HUD Header */}
      <header className="global-hud">
        <div className="hud-cell brand" onClick={() => handleNavigate(-1)}>
          <img className='logo' src="./models/planets/RUI_LOGO_WHITE.png" alt="RUI Logo" />
        </div>

        {/* Command Navigation Bar (Top Center on Desktop, Anchored Bottom on Mobile) */}
        <CommandBar
          active={activeSection}
          onNavigate={handleNavigate}
        />

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
        <HeroSection
          active={activeSection === -1}
          progress={heroProgress}
        />

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

        <SponsorsSection
          active={activeSection === 3}
          progress={activeSection === 3 ? sectionProgress : 0}
        />

        <ContactSection
          active={activeSection === 4}
          progress={activeSection === 4 ? sectionProgress : 0}
        />
      </main>

      {/* 4. Single Viewport-Anchored Fixed Scroll Indicator (0px layout contribution) */}
      <ScrollCue
        text={activeSection === 4 ? 'TRANSMISSION COMPLETE' : 'SCROLL TO NAVIGATE DEEP SPACE'}
        isEnd={activeSection === 4}
      />
    </div>
  );
}
