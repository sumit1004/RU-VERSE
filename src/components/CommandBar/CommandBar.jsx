import React from 'react';
import './CommandBar.css';

/**
 * RUVERSE 2026 — Cinematic Sci-Fi Command Navigation Bar
 * 
 * Symmetrical Layout:
 * [ HOME | ABOUT ]   <--  RU VERSE  -->   [ EVENTS | CONTACT ]
 * 
 * Target Index Mapping:
 * - HOME:    -1 (Hero Section)
 * - ABOUT:    1 (Sector 02: About Us)
 * - RU VERSE: 0 (Sector 01: RU Verse)
 * - EVENTS:   2 (Sector 03: Events Manifest)
 * - CONTACT:  3 (Sector 04: Transmission & Contact)
 */
export default function CommandBar({ active = -1, onNavigate }) {
  // Navigation definitions
  const leftLinks = [
    { id: 'home', label: 'HOME', indexStr: '00', target: -1, isActive: active === -1 },
    { id: 'about', label: 'ABOUT', indexStr: '02', target: 1, isActive: active === 1 },
  ];

  const rightLinks = [
    { id: 'events', label: 'EVENTS', indexStr: '03', target: 2, isActive: active === 2 },
    { id: 'contact', label: 'CONTACT', indexStr: '05', target: 4, isActive: active === 4 },
  ];

  const allLinks = [
    { id: 'm-home', label: 'HOME', target: -1, isActive: active === -1 },
    { id: 'm-about', label: 'ABOUT', target: 1, isActive: active === 1 },
    { id: 'm-events', label: 'EVENTS', target: 2, isActive: active === 2 },
    { id: 'm-contact', label: 'CONTACT', target: 4, isActive: active === 4 },
  ];

  const isRuVerseActive = active === 0;

  return (
    <nav className="ruverse-command-bar" aria-label="Universe Command Navigation">
      <div className="ruverse-command-bar__inner">
        {/* Desktop Left Wing: HOME, ABOUT */}
        <div className="ruverse-nav-wing ruverse-nav-wing--left">
          {leftLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ruverse-nav-item ${item.isActive ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.target)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={item.isActive ? 'page' : undefined}
            >
              <span className="ruverse-nav-item__index">{item.indexStr}</span>
              <span className="ruverse-nav-item__label">{item.label}</span>
              {item.isActive && <span className="ruverse-nav-item__indicator" />}
            </button>
          ))}
        </div>

        {/* Center Anchor: Angular Sci-Fi Frame with RU VERSE Title */}
        <div className="ruverse-center-anchor">
          {/* Left Wing Bracket Line */}
          {/* <div className="ruverse-wing-connector ruverse-wing-connector--left" aria-hidden="true">
            <svg viewBox="0 0 32 20" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M2 10 H18 L28 3" strokeLinecap="round" />
              <path d="M2 10 H18 L28 17" strokeLinecap="round" />
              <circle cx="2" cy="10" r="1.5" fill="currentColor" />
            </svg>
          </div> */}

          {/* Central Interactive Brand Button */}
          {/* <button
            type="button"
            className={`ruverse-brand-btn ${isRuVerseActive ? 'is-active' : ''}`}
            onClick={() => onNavigate(0)}
            aria-label="RU VERSE Sector 01"
            aria-current={isRuVerseActive ? 'page' : undefined}
          >
            <span className="ruverse-brand-title">RU VERSE</span>
            <span className="ruverse-brand-sub">TECHFEST 2026</span>
          </button> */}

          {/* Right Wing Bracket Line */}
          {/* <div className="ruverse-wing-connector ruverse-wing-connector--right" aria-hidden="true">
            <svg viewBox="0 0 32 20" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M30 10 H14 L4 3" strokeLinecap="round" />
              <path d="M30 10 H14 L4 17" strokeLinecap="round" />
              <circle cx="30" cy="10" r="1.5" fill="currentColor" />
            </svg>
          </div> */}
        </div>

        {/* Desktop Right Wing: EVENTS, CONTACT */}
        <div className="ruverse-nav-wing ruverse-nav-wing--right">
          {rightLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ruverse-nav-item ${item.isActive ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.target)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={item.isActive ? 'page' : undefined}
            >
              <span className="ruverse-nav-item__index">{item.indexStr}</span>
              <span className="ruverse-nav-item__label">{item.label}</span>
              {item.isActive && <span className="ruverse-nav-item__indicator" />}
            </button>
          ))}
        </div>

        {/* Mobile Unified Navigation Grid (< 768px) */}
        <div className="ruverse-mobile-nav-grid">
          {allLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ruverse-nav-item ${item.isActive ? 'is-active' : ''}`}
              onClick={() => onNavigate(item.target)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={item.isActive ? 'page' : undefined}
            >
              <span className="ruverse-nav-item__label">{item.label}</span>
              {item.isActive && <span className="ruverse-nav-item__indicator" />}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
