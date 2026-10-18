import React, { useState, useEffect, useRef } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TEAM_SECTION_TITLE, TEAM_SECTION_SUBTITLE, ORGANISERS } from '../../data/teamData';
import './OrganisingTeamSection.css';

/**
 * OrganiserCard Component
 * - Displays an individual organiser photograph, name, and designation.
 * - Strict 4:5 aspect ratio photograph with graceful silhouette fallback.
 * - Sci-fi corner brackets, subtle glow border, and smooth hover interaction.
 */
function OrganiserCard({ member, index }) {
  const [imageError, setImageError] = useState(false);
  const formattedIndex = String(index + 1).padStart(2, '0');
  const hasValidImage = Boolean(member.image && !imageError);

  return (
    <article className="organiser-card" aria-label={`Organiser profile: ${member.name || `Member ${formattedIndex}`}`}>
      {/* Sci-Fi Decorative Corner Brackets */}
      <div className="card-corner c-top-l" aria-hidden="true" />
      <div className="card-corner c-top-r" aria-hidden="true" />
      <div className="card-corner c-btm-l" aria-hidden="true" />
      <div className="card-corner c-btm-r" aria-hidden="true" />

      {/* Photo Media Frame (Strict 4:5 Aspect Ratio) */}
      <div className="organiser-photo-frame">
        {hasValidImage ? (
          <>
            <img
              src={member.image}
              alt={member.name ? `${member.name} — ${member.role || 'Organiser'}` : `Organiser ${formattedIndex}`}
              className="organiser-photo"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            <div className="organiser-photo-overlay" aria-hidden="true" />
          </>
        ) : (
          <div className="organiser-photo-fallback" aria-label="Photo pending">
            <svg
              className="organiser-fallback-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="organiser-fallback-status">// ROSTER PROFILE</span>
          </div>
        )}
      </div>

      {/* Organiser Information Block */}
      <div className="organiser-info">
        <div className="organiser-meta-row">
          <span className="organiser-index">// {formattedIndex}</span>
          <span className="organiser-status-dot" aria-hidden="true" />
        </div>
        <h3 className="organiser-name" title={member.name}>
          {member.name}
        </h3>
        <p className="organiser-role" title={member.role}>
          {member.role}
        </p>
      </div>
    </article>
  );
}

/**
 * OrganisingTeamSection Component
 * - Horizontal scroll-controlled slider pinned to the viewport during traversal.
 * - Single row flex-track of ~15 organiser cards driven by vertical scroll progress.
 * - Reversible: scrolling upward slides cards backward to Sponsors.
 * - Mobile-ready: touch vertical swipe smoothly translates cards horizontally.
 */
export default function OrganisingTeamSection({ active = false, progress = 0 }) {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const totalCount = ORGANISERS.length;

  // Measure track dimensions, set outer runway height, and keep ScrollTrigger synchronized
  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const section = sectionRef.current;
    if (!track || !viewport || !section) return;

    const measureAndSync = () => {
      const lastCard = track.querySelector('.organiser-card:last-child');
      const style = window.getComputedStyle(track);
      const endPadding = parseFloat(style.paddingRight) || 72;
      const totalContentWidth = lastCard
        ? (lastCard.offsetLeft + lastCard.offsetWidth + endPadding)
        : track.scrollWidth;
      const viewportWidth = viewport.clientWidth || window.innerWidth;
      const travel = Math.max(0, Math.ceil(totalContentWidth - viewportWidth));

      section.style.setProperty('--team-scroll-distance', `${travel}px`);

      if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
      }
    };

    measureAndSync();

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measureAndSync, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(handleResize);
      ro.observe(viewport);
      ro.observe(track);
    }

    const images = track.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', handleResize, { once: true });
        img.addEventListener('error', handleResize, { once: true });
      }
    });

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (ro) ro.disconnect();
    };
  }, []);

  // Keyboard navigation support when active
  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') {
        handleStep(1);
      } else if (e.key === 'ArrowLeft') {
        handleStep(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  // Accessible step controls: scrolling by one card width
  const handleStep = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector('.organiser-card');
    const stepSize = (firstCard ? firstCard.offsetWidth : 260) + 20;
    window.scrollBy({
      top: direction * stepSize,
      behavior: 'smooth',
    });
  };

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const currentCardIndex = Math.min(
    totalCount,
    Math.max(1, Math.round(clampedProgress * (totalCount - 1)) + 1)
  );

  return (
    <section
      id="section-organising-team"
      ref={sectionRef}
      className={`universe-pinned-section section-team-slider ${active ? 'is-active-section' : ''}`}
      aria-label="Meet the Organising Team"
    >
      <div className="team-slider-pin-wrap">
        {/* Pinned Top Bar: Floating Sector Badge & Section Header */}
        <header className="team-slider-header">
          <div className="team-slider-header-top">
            <div className="sector-floating-badge team-sector-badge">
              <span className="pulse-indicator" />
              <span>ORGANISING SQUADRON</span>
            </div>

            <div className="team-slider-counter" aria-live="polite">
              <span className="counter-curr">{String(currentCardIndex).padStart(2, '0')}</span>
              <span className="counter-sep">/</span>
              <span className="counter-total">{String(totalCount).padStart(2, '0')}</span>
            </div>
          </div>

          <div className="team-slider-titles">
            <h2 className="team-title">{TEAM_SECTION_TITLE}</h2>
            {TEAM_SECTION_SUBTITLE && (
              <p className="team-subtitle">{TEAM_SECTION_SUBTITLE}</p>
            )}
          </div>
        </header>

        {/* Horizontal Cards Viewport & Animated Track */}
        <div className="team-cards-viewport" ref={viewportRef}>
          <div className="team-cards-track" id="team-cards-track" ref={trackRef}>
            {ORGANISERS.map((member, idx) => (
              <OrganiserCard
                key={member.id || `organiser-${idx}`}
                member={member}
                index={idx}
              />
            ))}
          </div>
        </div>

        {/* Pinned Bottom HUD: Navigation Hint, Step Buttons & Progress Bar */}
        <footer className="team-slider-footer">
          <div className="team-slider-hint">
            <span className="hint-arrow" aria-hidden="true">↓</span>
            <span className="hint-text">SCROLL TO TRAVERSE SQUADRON</span>
            <span className="hint-arrow" aria-hidden="true">→</span>
          </div>

          {/* Accessible Step Buttons */}
          <div className="team-slider-step-controls">
            <button
              type="button"
              className="team-step-btn prev"
              onClick={() => handleStep(-1)}
              aria-label="Slide previous organiser"
              disabled={clampedProgress <= 0.02}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className="team-step-btn next"
              onClick={() => handleStep(1)}
              aria-label="Slide next organiser"
              disabled={clampedProgress >= 0.98}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Sci-Fi Progress Line Indicator */}
          <div className="team-slider-progress-track" aria-hidden="true">
            <div
              className="team-slider-progress-fill"
              style={{ transform: `scaleX(${clampedProgress})` }}
            />
          </div>
        </footer>
      </div>
    </section>
  );
}
