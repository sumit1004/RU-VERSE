import React, { useMemo, useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ASSETS } from '../data/universeData';
import { useCalibrationStore } from '../hooks/useCalibrationState';

// Preload models safely
try {
  if (ASSETS.ruVerse) useGLTF.preload(ASSETS.ruVerse);
  if (ASSETS.about) useGLTF.preload(ASSETS.about);
  if (ASSETS.events) useGLTF.preload(ASSETS.events);
  if (ASSETS.contact) useGLTF.preload(ASSETS.contact);
} catch (e) {
  console.warn('[RU VERSE] Model preload notice:', e);
}

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn('[RU VERSE] Model load failed, using procedural fallback:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <mesh>
          <sphereGeometry args={[this.props.targetRadius || 1.5, 24, 24]} />
          <meshStandardMaterial
            color={this.props.fallbackColor || '#4ba3e3'}
            roughness={0.4}
            metalness={0.6}
            wireframe
          />
        </mesh>
      );
    }
    return this.props.children;
  }
}

/**
 * Visual Anchor Crosshair Helper (+)
 */
function VisualAnchorHelper() {
  const lineGeo = useMemo(() => {
    const points = [
      new THREE.Vector3(-0.4, 0, 0), new THREE.Vector3(0.4, 0, 0),
      new THREE.Vector3(0, -0.4, 0), new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(0, 0, -0.4), new THREE.Vector3(0, 0, 0.4),
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <lineSegments geometry={lineGeo}>
      <lineBasicMaterial color="#00ffcc" depthTest={false} transparent opacity={0.9} />
    </lineSegments>
  );
}

function ModelLoader({
  modelPath,
  targetRadius = 1.8,
  rotation = [0, 0, 0],
  scale = 1.0,
  fallbackColor = '#4ba3e3',
  isCalibrating = false
}) {
  const gltf = useGLTF(modelPath);
  const anchorRef = useRef();
  const orientationRef = useRef();
  const boxHelperRef = useRef();

  const showAnchorHelper = useCalibrationStore((state) => state.showAnchorHelper);
  const showBoundingBox = useCalibrationStore((state) => state.showBoundingBox);
  const calibrationEnabled = useCalibrationStore((state) => state.enabled);

  // Model Normalization: visual center becomes position origin (0, 0, 0)
  const normalizedScene = useMemo(() => {
    if (!gltf?.scene) return null;
    const scene = gltf.scene.clone(true);

    // Compute bounding box around geometry
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    // Recenter geometry so (0,0,0) is precisely the visual center
    scene.position.sub(center);

    // Normalize scale so radius matches targetRadius uniformly
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    scene.scale.setScalar((targetRadius * 2) / maxDim);

    return scene;
  }, [gltf, targetRadius]);

  // Update bounding box helper when enabled
  useEffect(() => {
    if (calibrationEnabled && showBoundingBox && orientationRef.current) {
      if (!boxHelperRef.current) {
        const helper = new THREE.BoxHelper(orientationRef.current, 0xff0055);
        boxHelperRef.current = helper;
        orientationRef.current.add(helper);
      } else {
        boxHelperRef.current.update();
      }
    } else if (boxHelperRef.current && orientationRef.current) {
      orientationRef.current.remove(boxHelperRef.current);
      boxHelperRef.current = null;
    }
  }, [calibrationEnabled, showBoundingBox, normalizedScene]);

  // Apply clean rotation to orientation group
  useEffect(() => {
    if (orientationRef.current) {
      orientationRef.current.rotation.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0);
      if (boxHelperRef.current) boxHelperRef.current.update();
    }
  }, [rotation]);

  if (!normalizedScene) return null;

  return (
    // Layer 1: Dedicated Ship Anchor (POSITION ONLY)
    <group ref={anchorRef} scale={scale}>
      {/* Layer 2: Dedicated Ship Orientation (ROTATION ONLY) */}
      <group ref={orientationRef}>
        {/* Layer 3: Normalized GLB Model */}
        <primitive object={normalizedScene} />

        {/* Visual Anchor (+) & Bounding Box Helpers in Calibration Mode */}
        {calibrationEnabled && isCalibrating && showAnchorHelper && (
          <VisualAnchorHelper />
        )}
      </group>
    </group>
  );
}

export default function PlanetModel({
  modelPath,
  targetRadius = 1.8,
  rotation = [0, 0, 0],
  scale = 1.0,
  fallbackColor = '#4ba3e3',
  isCalibrating = false
}) {
  return (
    <ModelErrorBoundary targetRadius={targetRadius} fallbackColor={fallbackColor}>
      <React.Suspense
        fallback={
          <mesh>
            <sphereGeometry args={[targetRadius * 0.8, 16, 16]} />
            <meshBasicMaterial color={fallbackColor} wireframe opacity={0.3} transparent />
          </mesh>
        }
      >
        <ModelLoader
          modelPath={modelPath}
          targetRadius={targetRadius}
          rotation={rotation}
          scale={scale}
          fallbackColor={fallbackColor}
          isCalibrating={isCalibrating}
        />
      </React.Suspense>
    </ModelErrorBoundary>
  );
}
