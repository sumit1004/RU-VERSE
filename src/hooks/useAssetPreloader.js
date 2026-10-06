import { useState, useRef, useCallback, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { getPreloadManifest } from '../data/preloadAssets';

/**
 * Preloads an image into the browser cache and decodes it.
 */
function preloadImage(url) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(true);
    const img = new Image();
    img.src = url;
    if (img.decode) {
      img
        .decode()
        .then(() => resolve(true))
        .catch(() => resolve(true));
    } else {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(true);
    }
  });
}

/**
 * Preloads a 3D GLTF model into R3F/drei and browser caches.
 */
function preloadModel(url) {
  return new Promise((resolve) => {
    try {
      if (useGLTF?.preload) {
        useGLTF.preload(url);
      }
      if (typeof fetch !== 'undefined') {
        fetch(url, { cache: 'force-cache' })
          .then((res) => (res.ok ? res.blob() : null))
          .then(() => resolve(true))
          .catch(() => resolve(true));
      } else {
        resolve(true);
      }
    } catch {
      resolve(true);
    }
  });
}

/**
 * Preloads video buffer into browser cache without visible playback.
 */
function preloadVideo(url) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(true);
    try {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.src = url;
      v.muted = true;

      let isResolved = false;
      const onReady = () => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(true);
        }
      };

      const cleanup = () => {
        v.removeEventListener('canplaythrough', onReady);
        v.removeEventListener('canplay', onReady);
        v.removeEventListener('loadeddata', onReady);
        v.removeEventListener('error', onReady);
      };

      v.addEventListener('canplaythrough', onReady, { once: true });
      v.addEventListener('canplay', onReady, { once: true });
      v.addEventListener('loadeddata', onReady, { once: true });
      v.addEventListener('error', onReady, { once: true });

      v.load();
    } catch {
      resolve(true);
    }
  });
}

function preloadItem(item) {
  if (item.type === 'image') return preloadImage(item.url);
  if (item.type === 'model') return preloadModel(item.url);
  if (item.type === 'video') return preloadVideo(item.url);
  return Promise.resolve(true);
}

/**
 * useAssetPreloader Hook:
 * - Real asset readiness tracking (No fake 3s timers).
 * - Smooth lerped progress from 0.0 to 1.0 (never exceeds real progress).
 * - Resolves only when all critical assets are ready.
 */
export function useAssetPreloader() {
  const [visualProgress, setVisualProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const realProgressRef = useRef(0);
  const currentVisualRef = useRef(0);
  const hasStartedRef = useRef(false);
  const animFrameRef = useRef(null);

  // Smooth lerp visual progress towards real progress
  useEffect(() => {
    if (!isLoading) return;

    const updateLoop = () => {
      const target = realProgressRef.current;
      const current = currentVisualRef.current;

      if (current < target) {
        // Smoothly approach real progress
        const next = current + Math.max(0.005, (target - current) * 0.12);
        const clamped = Math.min(target, next);
        currentVisualRef.current = clamped;
        setVisualProgress(clamped);
      }

      if (currentVisualRef.current < 1 || !isReady) {
        animFrameRef.current = requestAnimationFrame(updateLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isLoading, isReady]);

  const startPreload = useCallback(() => {
    if (hasStartedRef.current) return Promise.resolve();
    hasStartedRef.current = true;
    setIsLoading(true);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const { critical, background } = getPreloadManifest(isMobile);

    const totalWeight = critical.reduce((acc, item) => acc + (item.weight || 1), 0);
    let loadedWeight = 0;

    return new Promise((resolve) => {
      if (critical.length === 0) {
        realProgressRef.current = 1;
        currentVisualRef.current = 1;
        setVisualProgress(1);
        setIsLoading(false);
        setIsReady(true);
        resolve();
        return;
      }

      critical.forEach((item) => {
        preloadItem(item).then(() => {
          loadedWeight += (item.weight || 1);
          const ratio = Math.min(1.0, loadedWeight / totalWeight);
          realProgressRef.current = ratio;

          if (loadedWeight >= totalWeight) {
            realProgressRef.current = 1;
            // Wait for visual fill to catch up to 100%
            const checkVisualCatchup = () => {
              if (currentVisualRef.current >= 0.98) {
                currentVisualRef.current = 1;
                setVisualProgress(1);
                setIsLoading(false);
                setIsReady(true);
                resolve();

                // Start non-critical assets in the background
                background.forEach((bgItem) => {
                  preloadItem(bgItem).catch(() => {});
                });
              } else {
                setTimeout(checkVisualCatchup, 30);
              }
            };
            checkVisualCatchup();
          }
        });
      });
    });
  }, []);

  return {
    progress: visualProgress, // 0.0 to 1.0
    isLoading,
    isReady,
    startPreload
  };
}
