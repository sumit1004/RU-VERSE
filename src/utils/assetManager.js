import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const modelCache = new Map();
const loader = new GLTFLoader();

export function loadGLTF(url, onProgress) {
  if (modelCache.has(url)) {
    return Promise.resolve(modelCache.get(url));
  }

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        modelCache.set(url, gltf);
        resolve(gltf);
      },
      (xhr) => {
        if (onProgress && xhr.total > 0) {
          onProgress(xhr.loaded / xhr.total);
        }
      },
      (err) => {
        console.error(`[RU VERSE] Failed to load GLTF at: ${url}`, err);
        reject(err);
      }
    );
  });
}

export function getCachedGLTF(url) {
  return modelCache.get(url) || null;
}

/**
 * Preload the single critical hero asset for the flight scene:
 * - droid_tri_fighter.glb
 */
export async function preloadCriticalAssets(onProgress) {
  console.log('[RU VERSE] Loading Tri-Fighter spaceship...');
  const ship = await loadGLTF('/models/ships/droid_tri_fighter.glb', (p) => {
    onProgress?.(p);
  });
  console.log('[RU VERSE] Tri-Fighter loaded successfully');
  console.log('[RU VERSE] Hero flight scene ready');

  return { ship };
}
