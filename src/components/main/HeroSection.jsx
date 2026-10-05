import React from 'react';

/**
 * HeroSection Component:
 * - Minimal, cinematic opening title sequence for RUVERSE 2026
 * - Official Content:
 *    - Main title: RUVERSE 2026
 *    - Tagline: Enter the Future
 *    - Date: 21–24 October
 *    - Institution: Rungta International Skills University
 * - Interactive Starfield background (via persistent SpaceCanvas)
 */
export default function HeroSection() {
  return (
    <section id="hero-section" className="main-hero-section">
      <div className="hero-center-box">
        {/* Techfest Official Logo Badge */}
        <div className="hero-logo-wrapper">
          <img
            src="/models/planets/RUVERSE.png"
            alt="RUVERSE 2026 Logo"
            className="hero-logo-img"
          />
        </div>


      </div>
    </section>
  );
}
