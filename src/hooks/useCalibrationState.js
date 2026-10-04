import { create } from 'zustand';
import { DEFAULT_SHIP_POSITIONS, SHIP_CALIBRATION_MODE } from '../data/shipPositions';

// Helper to deep clone default positions
const getInitialPositions = () => JSON.parse(JSON.stringify(DEFAULT_SHIP_POSITIONS));

export const useCalibrationStore = create((set, get) => ({
  enabled: SHIP_CALIBRATION_MODE,
  activeSectionKey: 'ruVerse',
  isMobileView: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  freezeAnimations: false,
  showGrid: true,
  showTargetMarker: true,
  showAnchorHelper: true,
  showBoundingBox: false,
  
  // Dynamic positions map (keyed by section: ruVerse, about, events, contact)
  positions: getInitialPositions(),

  // Live calculated screen & world coordinates from 3D canvas
  liveReadout: {
    screenX: 0.28,
    screenY: 0.50,
    worldX: 0,
    worldY: 0,
    worldZ: 0,
    cameraFov: 45,
    cameraAspect: 1.77,
  },

  // Actions
  setEnabled: (enabled) => set({ enabled }),
  setActiveSectionKey: (activeSectionKey) => set({ activeSectionKey }),
  setIsMobileView: (isMobileView) => set({ isMobileView }),
  setFreezeAnimations: (freezeAnimations) => set({ freezeAnimations }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowTargetMarker: (showTargetMarker) => set({ showTargetMarker }),
  setShowAnchorHelper: (showAnchorHelper) => set({ showAnchorHelper }),
  setShowBoundingBox: (showBoundingBox) => set({ showBoundingBox }),

  updateActiveConfig: (updates) => {
    const { activeSectionKey, isMobileView, positions } = get();
    const modeKey = isMobileView ? 'mobile' : 'desktop';
    const currentSection = positions[activeSectionKey];
    if (!currentSection) return;

    const updatedModeConfig = {
      ...currentSection[modeKey],
      ...updates,
    };

    set({
      positions: {
        ...positions,
        [activeSectionKey]: {
          ...currentSection,
          [modeKey]: updatedModeConfig,
        }
      }
    });
  },

  setLiveReadout: (liveReadout) => set((state) => ({
    liveReadout: { ...state.liveReadout, ...liveReadout }
  })),

  resetActiveSection: () => {
    const { activeSectionKey, isMobileView, positions } = get();
    const modeKey = isMobileView ? 'mobile' : 'desktop';
    const defaultSec = DEFAULT_SHIP_POSITIONS[activeSectionKey];
    if (!defaultSec) return;

    set({
      positions: {
        ...positions,
        [activeSectionKey]: {
          ...positions[activeSectionKey],
          [modeKey]: { ...defaultSec[modeKey] }
        }
      }
    });
  },

  resetAll: () => {
    set({ positions: getInitialPositions() });
  },

  exportConfigJSON: () => {
    const { positions } = get();
    return JSON.stringify(positions, null, 2);
  }
}));
