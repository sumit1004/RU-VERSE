import React from 'react';
import { SPONSORS_SECTION_TITLE, SPONSORS } from '../../data/sponsorsData';
import './SponsorsSection.css';

export default function SponsorsSection({ active, progress }) {
  const topSponsor = SPONSORS.find((s) => s.featured) || SPONSORS[0];
  const supportingSponsors = SPONSORS.filter((s) => s !== topSponsor);

  // Progressive scroll-based reveal milestones
  const isHeaderVisible = active && progress >= 0.10;
  const isTopVisible = active && progress >= 0.18;
  const isGridVisible = active && progress >= 0.28;

  const renderLogo = (sponsor, isFeatured = false) => {
    if (!sponsor?.logo) return null;

    const imgElement = (
      <img
        src={sponsor.logo}
        alt={sponsor.name || 'Sponsor'}
        className={`sponsor-logo-img ${isFeatured ? 'featured' : ''}`}
        loading="lazy"
      />
    );

    if (sponsor.url) {
      return (
        <a
          key={sponsor.id}
          href={sponsor.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`sponsor-logo-anchor ${isFeatured ? 'featured-anchor' : ''}`}
          aria-label={sponsor.name || 'Sponsor website'}
        >
          {imgElement}
        </a>
      );
    }

    return (
      <div
        key={sponsor.id}
        className={`sponsor-logo-wrapper ${isFeatured ? 'featured-wrapper' : ''}`}
      >
        {imgElement}
      </div>
    );
  };

  return (
    <section
      id="section-sponsors"
      className={`universe-pinned-section section-sponsors ${active ? 'is-active-section' : ''}`}
    >
      <div className="pinned-content-stage sponsors-content-stage">
        <div className="sector-watermark">04</div>
        <div className="sector-floating-badge">
          <span className="pulse-indicator" />
          <span>SPONSORS</span>
        </div>

        <div className="sponsors-container">
          {/* Simple Clean Heading */}
          <header className={`sponsors-header ${isHeaderVisible ? 'revealed' : ''}`}>
            <h2 className="sponsors-title">{SPONSORS_SECTION_TITLE}</h2>
          </header>

          {/* Top / Featured Sponsor Logo (Larger, prominent, centered) */}
          {topSponsor && (
            <div className={`top-sponsor-showcase ${isTopVisible ? 'revealed' : ''}`}>
              {renderLogo(topSponsor, true)}
            </div>
          )}

          {/* Supporting Sponsors Grid (Floating logos, zero cards) */}
          {supportingSponsors.length > 0 && (
            <div className={`supporting-sponsors-flow ${isGridVisible ? 'revealed' : ''}`}>
              {supportingSponsors.map((sponsor) => renderLogo(sponsor, false))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
