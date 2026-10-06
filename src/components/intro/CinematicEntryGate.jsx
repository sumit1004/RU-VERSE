import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAssetPreloader } from '../../hooks/useAssetPreloader';
import './CinematicEntryGate.css';

const BACKGROUND_IMAGE = '/models/planets/mainbg.png';

/**
 * 4 Separate 2D Spaceship Overlays positioned around the viewport edges
 * Independent scales, opacities, and parallax strengths
 */
const ENTRY_SHIPS = [
  {
    id: 'ship-01',
    src: '/models/planets/one.png',
    fallbackSrcs: ['/one.png', '/models/planets/one.png', '/ship1.png', '/ship-01.png'],
    alt: 'Scout Interceptor',
    className: 'entry-ship-01',
    strength: 14,
    idleSpeed: 1.2,
    idleAmpX: 3,
    idleAmpY: 4,
    opacity: 0.88,
  },
  {
    id: 'ship-02',
    src: '/models/planets/two.png',
    fallbackSrcs: ['/two.png', '/models/planets/two.png', '/ship2.png', '/ship-02.png'],
    alt: 'Heavy Dreadnought',
    className: 'entry-ship-02',
    strength: 24,
    idleSpeed: 0.9,
    idleAmpX: 4,
    idleAmpY: 5,
    opacity: 0.95,
  },
  {
    id: 'ship-03',
    src: '/models/planets/three.png',
    fallbackSrcs: ['/three.png', '/models/planets/three.png', '/ship3.png', '/ship-03.png'],
    alt: 'Recon Vessel',
    className: 'entry-ship-03',
    strength: 30,
    idleSpeed: 1.5,
    idleAmpX: 2,
    idleAmpY: 3,
    opacity: 0.68,
  },
  {
    id: 'ship-04',
    src: '/models/planets/four.png',
    fallbackSrcs: ['/four.png', '/models/planets/four.png', '/ship4.png', '/ship-04.png'],
    alt: 'Tactical Frigate',
    className: 'entry-ship-04',
    strength: 18,
    idleSpeed: 1.0,
    idleAmpX: 3,
    idleAmpY: 4,
    opacity: 0.82,
  },
];

/**
 * CinematicEntryGate Component:
 * - Fullscreen background with 4 parallax ships
 * - Central button transforms into a sleek, box-filling "LOADING THE FUTURE" bar on click
 * - Preloads real critical assets (video, 3D models, textures, logos) before transitioning to VideoIntro
 */
export default function CinematicEntryGate({ onStartVideo, onExitComplete }) {
  const [isExiting, setIsExiting] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const hasClickedRef = useRef(false);

  const { progress, isLoading, startPreload } = useAssetPreloader();

  // Ship DOM Element refs for direct transform updates without triggering React state updates
  const shipRefs = useRef([]);

  // Normalized mouse coordinates (-1 to 1) with inertia lerp
  const mouseRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
  const isTouchRef = useRef(false);
  const animFrameIdRef = useRef(null);

  // Parallax animation loop
  useEffect(() => {
    let startTime = performance.now();
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const mobileScale = isMobile ? 0.45 : 1.0;

    const handleMouseMove = (e) => {
      if (isTouchRef.current) return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.targetX = Math.max(-1, Math.min(1, nx));
      mouseRef.current.targetY = Math.max(-1, Math.min(1, ny));
    };

    const handleTouchStart = () => {
      isTouchRef.current = true;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
    }

    const animate = (time) => {
      const elapsed = (time - startTime) * 0.001;

      // Smooth lerp mouse position (cinematic inertia)
      const lerpFactor = 0.06;
      mouseRef.current.currentX +=
        (mouseRef.current.targetX - mouseRef.current.currentX) * lerpFactor;
      mouseRef.current.currentY +=
        (mouseRef.current.targetY - mouseRef.current.currentY) * lerpFactor;

      const mx = mouseRef.current.currentX;
      const my = mouseRef.current.currentY;

      // Update each ship's CSS transform directly via DOM ref
      ENTRY_SHIPS.forEach((ship, index) => {
        const el = shipRefs.current[index];
        if (!el) return;

        if (reducedMotion) {
          el.style.transform = 'translate3d(0, 0, 0)';
          return;
        }

        // Parallax offset
        const pX = mx * ship.strength * mobileScale;
        const pY = my * ship.strength * mobileScale;

        // Subtle idle floating motion
        const idleX = Math.sin(elapsed * ship.idleSpeed + index * 1.5) * ship.idleAmpX;
        const idleY = Math.cos(elapsed * ship.idleSpeed * 0.8 + index * 1.2) * ship.idleAmpY;

        const totalX = (pX + idleX).toFixed(2);
        const totalY = (pY + idleY).toFixed(2);

        el.style.transform = `translate3d(${totalX}px, ${totalY}px, 0)`;
      });

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, []);

  const handleEnterClick = useCallback(() => {
    if (hasClickedRef.current) return;
    hasClickedRef.current = true;
    setHasEntered(true);

    // Cancel rAF loop immediately on click to free GPU/CPU resources
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }

    // Begin real asset preloading
    startPreload().then(() => {
      // Brief pause to complete visual fill before triggering video intro
      setTimeout(() => {
        setIsExiting(true);
        if (onStartVideo) {
          onStartVideo();
        }
        setTimeout(() => {
          if (onExitComplete) {
            onExitComplete();
          }
        }, 500);
      }, 250);
    });
  }, [startPreload, onStartVideo, onExitComplete]);

  // Global keydown listener for keyboard accessibility
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (!hasClickedRef.current && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleEnterClick();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleEnterClick]);

  // Keyboard accessibility on button
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEnterClick();
      }
    },
    [handleEnterClick]
  );

  const handleImageError = (e, ship) => {
    if (ship.fallbackSrcs && ship.fallbackSrcs.length > 0) {
      const nextSrc = ship.fallbackSrcs.shift();
      e.target.src = nextSrc;
    } else {
      e.target.style.display = 'none';
    }
  };

  const isInitializing = hasEntered || isLoading;

  return (
    <div
      className={`cinematic-entry-gate ${isExiting ? 'is-exiting' : ''}`}
      role="region"
      aria-label="RUVERSE 2026 Entry Screen"
    >
      {/* 1. Authoritative Fullscreen Background Image */}
      <img
        src={BACKGROUND_IMAGE}
        alt="Deep Space Background"
        className="entry-gate-bg-image"
        loading="eager"
        onError={(e) => {
          if (!e.target.dataset.fallbackTried) {
            e.target.dataset.fallbackTried = '1';
            e.target.src = '/mainbg.png';
          }
        }}
      />

      {/* 2. Subtle Vignette & Central Readability Layer */}
      <div className="entry-gate-vignette" />

      {/* 3. Four 2D Spaceship Overlays with Mouse Parallax */}
      <div className="entry-gate-ships-layer">
        {ENTRY_SHIPS.map((ship, index) => (
          <div
            key={ship.id}
            ref={(el) => (shipRefs.current[index] = el)}
            className={`entry-ship-container ${ship.className}`}
            style={{ opacity: ship.opacity }}
          >
            <img
              src={ship.src}
              alt={ship.alt}
              className="entry-ship-img"
              loading="eager"
              onError={(e) => handleImageError(e, ship)}
            />
          </div>
        ))}
      </div>

      {/* 4. Foreground Central Typography & Action */}
      <div className="entry-gate-content">
        {/* Main Cinematic Line */}
        <h1 className="entry-gate-quote">
          <span className="quote-line line-1">WELCOME TO </span>
          <span className="quote-line line-2">RUNGTA UNIVERSITY'S ANNUAL TECHFEST</span>
        </h1>

        {/* Primary Interactive Box / Cinematic Box-Fill Loader */}
        <div className="entry-gate-action">
          <button
            type="button"
            className={`entry-gate-btn ${isInitializing ? 'is-loading' : ''}`}
            onClick={handleEnterClick}
            onKeyDown={handleKeyDown}
            disabled={isInitializing}
            aria-label={isInitializing ? 'Loading the Future' : 'Enter the Future'}
            aria-live="polite"
          >
            {/* Box-Filling Progress Bar (Left to Right) */}
            {isInitializing && (
              <div
                className="entry-btn-loading-fill"
                style={{
                  transform: `scaleX(${progress})`,
                }}
                aria-hidden="true"
              />
            )}

            {/* Corner Decorative Tech Brackets */}
            <div className="btn-bracket b-top-l" aria-hidden="true" />
            <div className="btn-bracket b-top-r" aria-hidden="true" />
            <div className="btn-bracket b-btm-l" aria-hidden="true" />
            <div className="btn-bracket b-btm-r" aria-hidden="true" />

            {/* Button / Loader Text */}
            <span className="btn-text">
              {isInitializing ? 'LOADING THE FUTURE' : 'ENTER THE FUTURE'}
            </span>

            {!isInitializing && (
              <span className="btn-arrow" aria-hidden="true">
                →
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
