/**
 * RUVERSE 2026 — Centralized Sponsor Manifest
 * 
 * Single source of truth for all sponsor logos.
 * Set `featured: true` for the top sponsor to render larger in the hero position.
 * Set `url` to a valid website string (or `null` if unlinked).
 */

export const SPONSORS_SECTION_TITLE = 'OUR SPONSORS';

export const SPONSORS = [
  {
    id: 'top-sponsor',
    name: 'Rungta International Skills University',
    // logo: '/models/planets/RUI_LOGO_WHITE.png',
    // url: 'https://rungta.ac.in',
    featured: true,
  },
  {
    id: 'sponsor-1',
    name: 'RUVERSE Techfest',
    // logo: '/models/planets/techfest.png',
    url: null,
    featured: false,
  },
  {
    id: 'sponsor-2',
    name: 'Rungta Group of Institutions',
    // logo: '/models/planets/RUI_LOGO_WHITE.png',
    // url: 'https://rungta.ac.in',
    featured: false,
  },
  {
    id: 'sponsor-3',
    name: 'RUVERSE Innovation',
    // logo: '/models/planets/techfest.png',
    url: null,
    featured: false,
  },
];
