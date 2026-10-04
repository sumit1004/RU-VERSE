import React, { useState } from 'react';
import { useCalibrationStore } from '../../hooks/useCalibrationState';

const SECTIONS = [
  { key: 'ruVerse', label: '01 RU VERSE' },
  { key: 'about', label: '02 ABOUT' },
  { key: 'events', label: '03 EVENTS' },
  { key: 'contact', label: '04 CONTACT' },
];

export default function ShipCalibrationPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const enabled = useCalibrationStore((state) => state.enabled);
  const setEnabled = useCalibrationStore((state) => state.setEnabled);
  const activeSectionKey = useCalibrationStore((state) => state.activeSectionKey);
  const setActiveSectionKey = useCalibrationStore((state) => state.setActiveSectionKey);
  const isMobileView = useCalibrationStore((state) => state.isMobileView);
  const setIsMobileView = useCalibrationStore((state) => state.setIsMobileView);
  const freezeAnimations = useCalibrationStore((state) => state.freezeAnimations);
  const setFreezeAnimations = useCalibrationStore((state) => state.setFreezeAnimations);
  const showGrid = useCalibrationStore((state) => state.showGrid);
  const setShowGrid = useCalibrationStore((state) => state.setShowGrid);
  const showTargetMarker = useCalibrationStore((state) => state.showTargetMarker);
  const setShowTargetMarker = useCalibrationStore((state) => state.setShowTargetMarker);
  const showAnchorHelper = useCalibrationStore((state) => state.showAnchorHelper);
  const setShowAnchorHelper = useCalibrationStore((state) => state.setShowAnchorHelper);
  const showBoundingBox = useCalibrationStore((state) => state.showBoundingBox);
  const setShowBoundingBox = useCalibrationStore((state) => state.setShowBoundingBox);

  const positions = useCalibrationStore((state) => state.positions);
  const updateActiveConfig = useCalibrationStore((state) => state.updateActiveConfig);
  const resetActiveSection = useCalibrationStore((state) => state.resetActiveSection);
  const resetAll = useCalibrationStore((state) => state.resetAll);
  const exportConfigJSON = useCalibrationStore((state) => state.exportConfigJSON);
  const liveReadout = useCalibrationStore((state) => state.liveReadout);

  if (!enabled) {
    return null;
  }

  const modeKey = isMobileView ? 'mobile' : 'desktop';
  const currentConfig = positions[activeSectionKey]?.[modeKey] || {
    screenX: 0.5, screenY: 0.5, targetZ: 0,
    rotationX: 0, rotationY: 0, rotationZ: 0,
    scale: 1.5
  };

  const handleCopy = () => {
    const json = exportConfigJSON();
    navigator.clipboard.writeText(json).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
    console.log('[RU VERSE] Calibrated Ship Positions:', json);
  };

  return (
    <div className={`calib-panel-root ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Header Bar */}
      <div className="calib-header">
        <div className="header-left">
          <span className="calib-dot" />
          <span className="header-title">SHIP CALIBRATION SYSTEM</span>
        </div>
        <div className="header-actions">
          <button
            className="calib-icon-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          >
            {isCollapsed ? '◻' : '─'}
          </button>
          <button
            className="calib-icon-btn close"
            onClick={() => setEnabled(false)}
            title="Close Calibration Mode"
          >
            ✕
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="calib-body">
          {/* 1. Section Selector */}
          <div className="calib-section-tabs">
            {SECTIONS.map((sec) => (
              <button
                key={sec.key}
                className={`tab-btn ${activeSectionKey === sec.key ? 'active' : ''}`}
                onClick={() => setActiveSectionKey(sec.key)}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* 2. Mode Selector & Freeze */}
          <div className="calib-row-split">
            <div className="calib-toggle-group">
              <button
                className={`toggle-btn ${!isMobileView ? 'active' : ''}`}
                onClick={() => setIsMobileView(false)}
              >
                DESKTOP
              </button>
              <button
                className={`toggle-btn ${isMobileView ? 'active' : ''}`}
                onClick={() => setIsMobileView(true)}
              >
                MOBILE
              </button>
            </div>

            <button
              className={`freeze-btn ${freezeAnimations ? 'is-frozen' : ''}`}
              onClick={() => setFreezeAnimations(!freezeAnimations)}
            >
              {freezeAnimations ? '❄ FROZEN' : '▶ LIVE'}
            </button>
          </div>

          {/* 3. Live Position Readout Box */}
          <div className="calib-readout-card">
            <div className="readout-row">
              <span className="readout-label">PROJECTED SCREEN:</span>
              <span className="readout-value highlight">
                X: {(liveReadout.screenX * 100).toFixed(1)}% | Y: {(liveReadout.screenY * 100).toFixed(1)}%
              </span>
            </div>
            <div className="readout-row">
              <span className="readout-label">WORLD POSITION:</span>
              <span className="readout-value">
                X: {liveReadout.worldX} | Y: {liveReadout.worldY} | Z: {liveReadout.worldZ}
              </span>
            </div>
            <div className="readout-row">
              <span className="readout-label">CAMERA:</span>
              <span className="readout-value">
                FOV: {liveReadout.cameraFov}° | Aspect: {liveReadout.cameraAspect}
              </span>
            </div>
          </div>

          {/* 4. Screen-Space Position Sliders */}
          <div className="calib-group">
            <div className="group-title">SCREEN-SPACE POSITION (0% - 100%)</div>

            {/* Screen X */}
            <div className="slider-row">
              <span className="slider-label">Screen X:</span>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.005"
                value={currentConfig.screenX}
                onChange={(e) => updateActiveConfig({ screenX: parseFloat(e.target.value) })}
              />
              <span className="slider-value">{(currentConfig.screenX * 100).toFixed(1)}%</span>
            </div>

            {/* Screen Y */}
            <div className="slider-row">
              <span className="slider-label">Screen Y:</span>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.005"
                value={currentConfig.screenY}
                onChange={(e) => updateActiveConfig({ screenY: parseFloat(e.target.value) })}
              />
              <span className="slider-value">{(currentConfig.screenY * 100).toFixed(1)}%</span>
            </div>

            {/* Target Z Depth */}
            <div className="slider-row">
              <span className="slider-label">Depth Z:</span>
              <input
                type="range"
                min="-6.0"
                max="4.0"
                step="0.1"
                value={currentConfig.targetZ || 0}
                onChange={(e) => updateActiveConfig({ targetZ: parseFloat(e.target.value) })}
              />
              <span className="slider-value">{(currentConfig.targetZ || 0).toFixed(1)}</span>
            </div>
          </div>

          {/* 5. Rotation Controls */}
          <div className="calib-group">
            <div className="group-title">SHIP ORIENTATION (ROTATION)</div>

            <div className="slider-row">
              <span className="slider-label">Rot X:</span>
              <input
                type="range"
                min="-3.14"
                max="3.14"
                step="0.02"
                value={currentConfig.rotationX}
                onChange={(e) => updateActiveConfig({ rotationX: parseFloat(e.target.value) })}
              />
              <span className="slider-value">{currentConfig.rotationX.toFixed(2)}</span>
            </div>

            <div className="slider-row">
              <span className="slider-label">Rot Y:</span>
              <input
                type="range"
                min="-3.14"
                max="3.14"
                step="0.02"
                value={currentConfig.rotationY}
                onChange={(e) => updateActiveConfig({ rotationY: parseFloat(e.target.value) })}
              />
              <span className="slider-value">{currentConfig.rotationY.toFixed(2)}</span>
            </div>

            <div className="slider-row">
              <span className="slider-label">Rot Z:</span>
              <input
                type="range"
                min="-3.14"
                max="3.14"
                step="0.02"
                value={currentConfig.rotationZ}
                onChange={(e) => updateActiveConfig({ rotationZ: parseFloat(e.target.value) })}
              />
              <span className="slider-value">{currentConfig.rotationZ.toFixed(2)}</span>
            </div>
          </div>

          {/* 6. Scale Control */}
          <div className="calib-group">
            <div className="group-title">SHIP SCALE</div>
            <div className="slider-row">
              <span className="slider-label">Scale:</span>
              <input
                type="range"
                min="0.4"
                max="3.5"
                step="0.05"
                value={currentConfig.scale}
                onChange={(e) => updateActiveConfig({ scale: parseFloat(e.target.value) })}
              />
              <span className="slider-value">{currentConfig.scale.toFixed(2)}</span>
            </div>
          </div>

          {/* 7. Visual Helpers Checkboxes */}
          <div className="calib-helpers-grid">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              <span>Center Grid</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={showTargetMarker}
                onChange={(e) => setShowTargetMarker(e.target.checked)}
              />
              <span>Target Crosshair</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={showAnchorHelper}
                onChange={(e) => setShowAnchorHelper(e.target.checked)}
              />
              <span>3D Anchor (+)</span>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={showBoundingBox}
                onChange={(e) => setShowBoundingBox(e.target.checked)}
              />
              <span>Bounding Box</span>
            </label>
          </div>

          {/* 8. Action Footer */}
          <div className="calib-footer">
            <button className="calib-btn primary" onClick={handleCopy}>
              {copyFeedback ? '✓ COPIED JSON!' : '📋 COPY CONFIG'}
            </button>
            <button className="calib-btn secondary" onClick={resetActiveSection}>
              RESET SEC
            </button>
            <button className="calib-btn danger" onClick={resetAll}>
              RESET ALL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
