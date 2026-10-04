import * as THREE from 'three';

/**
 * Converts screen-space normalized coordinates (0 to 1) into 3D world-space coordinates
 * for a given Three.js camera and target Z plane.
 * 
 * @param {THREE.Camera} camera - The Three.js camera
 * @param {number} screenX - Normalized X coordinate (0 = left, 0.5 = center, 1 = right)
 * @param {number} screenY - Normalized Y coordinate (0 = top, 0.5 = center, 1 = bottom)
 * @param {number} targetZ - The target Z depth in world space (default 0)
 * @returns {THREE.Vector3} - The calculated 3D world position
 */
export function screenToWorld(camera, screenX, screenY, targetZ = 0) {
  if (!camera) return new THREE.Vector3(0, 0, targetZ);

  // Convert 0..1 screen space to -1..1 Normalized Device Coordinates (NDC)
  const ndcX = (screenX * 2) - 1;
  const ndcY = 1 - (screenY * 2);

  const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
  vector.unproject(camera);

  const dir = vector.sub(camera.position).normalize();
  if (Math.abs(dir.z) < 0.00001) {
    return new THREE.Vector3(ndcX * 5, ndcY * 5, targetZ);
  }

  const distance = (targetZ - camera.position.z) / dir.z;
  const worldPos = camera.position.clone().add(dir.multiplyScalar(distance));
  return worldPos;
}

/**
 * Converts a 3D world-space position into normalized screen coordinates (0 to 1).
 * 
 * @param {THREE.Camera} camera - The Three.js camera
 * @param {THREE.Vector3} worldPos - The world-space position
 * @returns {{ screenX: number, screenY: number, ndcX: number, ndcY: number }}
 */
export function worldToScreen(camera, worldPos) {
  if (!camera || !worldPos) return { screenX: 0.5, screenY: 0.5, ndcX: 0, ndcY: 0 };

  const projected = worldPos.clone().project(camera);
  const screenX = (projected.x + 1) / 2;
  const screenY = (1 - projected.y) / 2;

  return {
    screenX: Math.max(0, Math.min(1, screenX)),
    screenY: Math.max(0, Math.min(1, screenY)),
    ndcX: projected.x,
    ndcY: projected.y
  };
}
