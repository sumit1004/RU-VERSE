import React from 'react';
import { useCalibrationStore } from '../../hooks/useCalibrationState';

export default function ScreenTargetOverlay() {
  const enabled = useCalibrationStore((state) => state.enabled);
  const showGrid = useCalibrationStore((state) => state.showGrid);
  const showTargetMarker = useCalibrationStore((state) => state.showTargetMarker);
  const activeSectionKey = useCalibrationStore((state) => state.activeSectionKey);
  const isMobileView = useCalibrationStore((state) => state.isMobileView);
  const positions = useCalibrationStore((state) => state.positions);
  const liveReadout = useCalibrationStore((state) => state.liveReadout);

  if (!enabled) return null;

  const modeKey = isMobileView ? 'mobile' : 'desktop';
  const currentConfig = positions[activeSectionKey]?.[modeKey] || { screenX: 0.5, screenY: 0.5 };

  const targetLeftPercent = (currentConfig.screenX * 100).toFixed(1);
  const targetTopPercent = (currentConfig.screenY * 100).toFixed(1);

  const shipLeftPercent = (liveReadout.screenX * 100).toFixed(1);
  const shipTopPercent = (liveReadout.screenY * 100).toFixed(1);

  return (
    <div className="screen-target-overlay">
      {/* 1. Screen Center Lines & Grid */}
      {showGrid && (
        <>
          {/* Vertical Center Line (50%) */}
          <div className="grid-line vertical center">
            <span className="grid-label top">X: 50%</span>
            <span className="grid-label bottom">X: 50%</span>
          </div>

          {/* Horizontal Center Line (50%) */}
          <div className="grid-line horizontal center">
            <span className="grid-label left">Y: 50%</span>
            <span className="grid-label right">Y: 50%</span>
          </div>

          {/* Reference Quarters */}
          <div className="grid-line vertical q1" />
          <div className="grid-line vertical q3" />
          <div className="grid-line horizontal q1" />
          <div className="grid-line horizontal q3" />
        </>
      )}

      {/* 2. Target Marker (+) with Coordinates */}
      {showTargetMarker && (
        <div
          className="target-crosshair-marker"
          style={{
            left: `${targetLeftPercent}%`,
            top: `${targetTopPercent}%`,
          }}
        >
          <div className="crosshair-ring" />
          <div className="crosshair-h" />
          <div className="crosshair-v" />
          <div className="crosshair-badge">
            <span className="badge-title">TARGET INTENT</span>
            <span className="badge-coords">X: {targetLeftPercent}% / Y: {targetTopPercent}%</span>
          </div>
        </div>
      )}

      {/* 3. Live Projected Ship Indicator */}
      {showTargetMarker && (
        <div
          className="ship-live-marker"
          style={{
            left: `${shipLeftPercent}%`,
            top: `${shipTopPercent}%`,
          }}
        >
          <div className="ship-ring" />
          <div className="ship-badge">
            <span className="badge-title">SHIP ACTUAL</span>
            <span className="badge-coords">X: {shipLeftPercent}% / Y: {shipTopPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
