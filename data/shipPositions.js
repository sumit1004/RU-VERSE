/**
 * SHIP POSITION CONFIGURATION & CALIBRATION DATA
 * 
 * Defines screen-space intent for each spaceship across desktop and mobile.
 * Positions are defined in normalized screen space:
 *   screenX: 0 = left edge, 0.5 = center, 1 = right edge
 *   screenY: 0 = top edge, 0.5 = center, 1 = bottom edge
 * 
 * All world positions are derived from these screen intents via screenToWorld(camera, screenX, screenY).
 */

export const SHIP_CALIBRATION_MODE = false; // Set to false for production build

export const DEFAULT_SHIP_POSITIONS = {
  "ruVerse": {
    "id": "ru-verse",
    "name": "Sector 01: RU VERSE",
    "desktop": {
      "screenX": 0.435,
      "screenY": 0.475,
      "targetZ": 0,
      "rotationX": 0.68,
      "rotationY": 0.28,
      "rotationZ": 0.02,
      "scale": 1.1
    },
    "mobile": {
      "screenX": 0.5,
      "screenY": 0.32,
      "targetZ": 0,
      "rotationX": 0.15,
      "rotationY": 0.65,
      "rotationZ": -0.1,
      "scale": 1.25
    }
  },
  "about": {
    "id": "about",
    "name": "Sector 02: ABOUT US",
    "desktop": {
      "screenX": 0.16,
      "screenY": 0.05,
      "targetZ": 4,
      "rotationX": -1.98,
      "rotationY": -2.72,
      "rotationZ": -3.14,
      "scale": 1.5
    },
    "mobile": {
      "screenX": 0.5,
      "screenY": 0.32,
      "targetZ": 0,
      "rotationX": 0.1,
      "rotationY": -0.75,
      "rotationZ": 0.12,
      "scale": 1.2
    }
  },
  "events": {
    "id": "events",
    "name": "Sector 03: EVENTS",
    "desktop": {
      "screenX": 0.5,
      "screenY": 0.5,
      "targetZ": -2.3,
      "rotationX": 0.42,
      "rotationY": -2.04,
      "rotationZ": -0.04,
      "scale": 1.4
    },
    "mobile": {
      "screenX": 0.5,
      "screenY": 0.32,
      "targetZ": 0,
      "rotationX": 0.12,
      "rotationY": 0.55,
      "rotationZ": 0.18,
      "scale": 1.3
    }
  },
  "contact": {
    "id": "contact",
    "name": "Sector 04: CONTACT",
    "desktop": {
      "screenX": 0.2,
      "screenY": 0.7,
      "targetZ": 3,
      "rotationX": 0.68,
      "rotationY": -2.66,
      "rotationZ": -3.14,
      "scale": 0.9
    },
    "mobile": {
      "screenX": 0.5,
      "screenY": 0.32,
      "targetZ": 0,
      "rotationX": 0.18,
      "rotationY": 0.55,
      "rotationZ": -0.08,
      "scale": 1.55
    }
  }
};



