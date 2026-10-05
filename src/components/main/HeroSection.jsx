import React from 'react';
import ScrollCue from './ScrollCue';

/**
 * HeroSection Component:
 * - The RUVERSE logo stays 100% FIXED in the exact center of the Hero at all times.
 * - Zero movement: NO translateY, NO translateX, NO animation from bottom.
 * - Reveal starts EXACTLY when the spaceship reaches the CENTER of the Hero (progress = 0.38).
 * - As the spaceship travels from CENTER → RIGHT (progress 0.38 → 0.78), the logo progressively
 *   unmasks horizontally from LEFT → RIGHT.
 * - When spaceship reaches the right (progress >= 0.78), the logo is 100% revealed and stays
 *   completely visible and fixed at the center as the spaceship exits to the right.
 * - Fully reversible upon upward scroll.
 */
export default function HeroSection({ active = true, progress = 0 }) {
  // Center trigger points:
  // - Before 0.38 (ship is upper-left/approaching): logo is 100% hidden
  // - At 0.38 (ship reaches center): reveal starts
  // - 0.38 -> 0.78 (ship travels center -> right): logo reveals horizontally 0% -> 100%
  // - Past 0.78 (ship exits right): logo stays 100% visible
  const CENTER_TRIGGER = 0.35;
  const REVEAL_END = 0.65;

  let revealProgress = 0;
  if (progress > CENTER_TRIGGER) {
    revealProgress = Math.max(0, Math.min(1, (progress - CENTER_TRIGGER) / (REVEAL_END - CENTER_TRIGGER)));
  }
  const revealPercent = (revealProgress * 100).toFixed(1);

  // Smooth progressive opacity and subtle blur-to-sharp transition
  const opacity = revealProgress === 0 ? 0 : Math.max(0.1, revealProgress);
  const blurAmount = ((1 - revealProgress) * 2.5).toFixed(1);

  // Leading edge energy tracer follows the horizontal reveal line while unmasking
  const showEdge = revealProgress > 0.01 && revealProgress < 0.99;

  return (
    <section id="hero-section" className="main-hero-section">
      <div className="hero-center-box">
        {/* Techfest Official Logo Badge (Strictly fixed in center, revealed horizontally) */}
        <div className="hero-logo-wrapper">
          <div className="hero-logo-reveal-container">
            <img
              src="/models/planets/techfest_logo.png"
              alt="RUVERSE 2026 Logo"
              className="hero-logo-img"
              style={{
                clipPath: `inset(0 calc(100% - ${revealPercent}%) 0 0)`,
                WebkitClipPath: `inset(0 calc(100% - ${revealPercent}%) 0 0)`,
                opacity: opacity,
                filter: revealProgress >= 1 ? 'none' : `blur(${blurAmount}px)`,
              }}
            />
            {/* Horizontal Leading Edge Energy Tracer */}
            {showEdge && (
              <div
                className="hero-logo-reveal-edge"
                style={{
                  left: `${revealPercent}%`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Persistent Sci-Fi Scroll Cue Indicator */}
      <ScrollCue text="SCROLL TO NAVIGATE DEEP SPACE" />
    </section>
  );
}
