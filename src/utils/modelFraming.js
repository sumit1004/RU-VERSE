import * as THREE from 'three';

/**
 * Normalizes and frames a 3D GLTF scene:
 * - Computes bounding box and bounding sphere
 * - Centers the geometry at origin (0, 0, 0)
 * - Calculates uniform normalization scale to fit target radius
 */
export function normalizeModel(scene, targetRadius = 1.0) {
  if (!scene) return null;
  const clone = scene.clone(true);
  
  const box = new THREE.Box3().setFromObject(clone);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  // Offset children so center is at 0,0,0
  clone.position.x = -center.x;
  clone.position.y = -center.y;
  clone.position.z = -center.z;

  const maxDim = Math.max(size.x, size.y, size.z);
  const scaleFactor = maxDim > 0 ? (targetRadius * 2) / maxDim : 1;

  const wrapper = new THREE.Group();
  wrapper.add(clone);
  wrapper.scale.setScalar(scaleFactor);

  return { wrapper, size, scaleFactor };
}
