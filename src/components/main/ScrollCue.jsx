import React from 'react';

/**
 * ScrollCue Component:
 * - Clear, high-visibility sci-fi scroll indicator with animated mouse wheel & directional arrows
 * - Increased size and clarity for intuitive navigation
 */
export default function ScrollCue({ text = 'SCROLL TO NAVIGATE DEEP SPACE', isEnd = false }) {
  return (
    <div className={`scroll-cue ${isEnd ? 'is-end' : ''}`} aria-hidden="true">
      {/* Sci-Fi Mouse Scroll Indicator Icon (Only rendered when not at terminal end) */}
      {!isEnd && (
        <div className="scroll-mouse-icon">
          <div className="scroll-mouse-wheel" />
        </div>
      )}

      {/* Primary Indicator Text */}
      <span className="scroll-cue-label">{text}</span>

      {/* Downward Pulse Chevrons */}
      {!isEnd && (
        <div className="scroll-chevrons">
          <span className="chevron-arrow chevron-1">⌄</span>
          <span className="chevron-arrow chevron-2">⌄</span>
        </div>
      )}
    </div>
  );
}
