/**
 * ==============================================================================
 * RUVERSE 2026 — CENTRALIZED ASSET PRELOAD MANIFEST
 * ==============================================================================
 * Single authoritative source of all assets to preload before the main site.
 * Separated into:
 * 1. CRITICAL: Required for the video and Hero section to display without pop-in.
 * 2. BACKGROUND: Subsequent sector 3D models and assets.
 * ==============================================================================
 */

export const CRITICAL_ASSETS = {
  desktop: {
    videos: ['/videos/opening.mp4'],
    models: ['/models/planets/light_fighter.glb'],
    images: [
      '/models/planets/techfest_logo.png',
      '/models/planets/RUI_LOGO_WHITE.png',
      '/models/planets/mainbg.png'
    ]
  },
  mobile: {
    videos: ['/videos/loading_mobile.mp4'],
    models: ['/models/planets/light_fighter.glb'],
    images: [
      '/models/planets/techfest_logo.png',
      '/models/planets/RUI_LOGO_WHITE.png',
      '/models/planets/mainbg.png'
    ]
  }
};

export const BACKGROUND_ASSETS = {
  models: [
    '/models/planets/ship.glb',
    '/models/planets/sentinel.glb'
  ],
  images: [
    '/models/planets/one.png',
    '/models/planets/two.png',
    '/models/planets/three.png',
    '/models/planets/four.png'
  ]
};

/**
 * Returns prioritized asset lists according to viewport size.
 * @param {boolean} isMobile - Whether device is in mobile breakpoint (< 768px).
 */
export function getPreloadManifest(isMobile = false) {
  const target = isMobile ? CRITICAL_ASSETS.mobile : CRITICAL_ASSETS.desktop;

  const critical = [
    ...(target.videos || []).map((url) => ({ url, type: 'video', weight: 3 })),
    ...(target.models || []).map((url) => ({ url, type: 'model', weight: 4 })),
    ...(target.images || []).map((url) => ({ url, type: 'image', weight: 1 }))
  ];

  const background = [
    ...(BACKGROUND_ASSETS.models || []).map((url) => ({ url, type: 'model' })),
    ...(BACKGROUND_ASSETS.images || []).map((url) => ({ url, type: 'image' }))
  ];

  return { critical, background };
}
