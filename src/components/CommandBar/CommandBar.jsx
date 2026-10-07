import React from 'react';
import './CommandBar.css';

/**
 * RUVERSE 2026 — Cinematic Sci-Fi Command Navigation Bar
 * 
 * Desktop: Centered in Top Header HUD (replaces orbital frequency readout)
 * Mobile (< 768px): Docked as a floating glass navigation bar at viewport bottom
 * 
 * Sector Mapping:
 * - HOME:     -1 (Hero Section)
 * - RU VERSE:  0 (Sector 01: RU Verse)
 * - ABOUT:     1 (Sector 02: About Us)
 * - EVENTS:    2 (Sector 03: Events Manifest)
 * - CONTACT:   4 (Sector 04: Transmission & Contact)
 */
export default function CommandBar({ active = -1, onNavigate }) {
  const navItems = [
    { id: 'home', label: 'HOME', target: -1, isActive: active === -1 },
    { id: 'ruverse', label: 'RU VERSE', target: 0, isActive: active === 0 },
    { id: 'about', label: 'ABOUT', target: 1, isActive: active === 1 },
    { id: 'events', label: 'EVENTS', target: 2, isActive: active === 2 },
    { id: 'contact', label: 'CONTACT', target: 4, isActive: active === 4 },
  ];

  return (
    <nav className="ruverse-command-bar" aria-label="Universe Command Navigation">
      <div className="ruverse-command-bar__inner">
        {navItems.map((item) => (
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
    </nav>
  );
}
