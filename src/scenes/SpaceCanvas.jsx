import React, { Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import StarField from './StarField';
import PlanetaryUniverse from './PlanetaryUniverse';
import { updateSmoothedPointer } from '../hooks/useGlobalPointer';
import { useCalibrationStore } from '../hooks/useCalibrationState';

function CanvasContent({
  activeSection = 0,
  sectionProgress = 0.5,
  quality
}) {
  const reducedMotion = quality?.reducedMotion || false;
  const freezeAnimations = useCalibrationStore((state) => state.freezeAnimations);
  const { camera } = useThree();

  useFrame(() => {
    if (!reducedMotion && !freezeAnimations && camera) {
      const pointer = updateSmoothedPointer(0.04);
      const targetX = pointer.currentX * 0.4;
      const targetY = pointer.currentY * 0.3;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      {/* Deep Space Background */}
      <color attach="background" args={['#010208']} />
      <fog attach="fog" args={['#010208', 15, 60]} />

      {/* Global Dense Starfield (Persistent across planetary universe) */}
      <StarField
        count={quality?.stars || 4800}
        quality={quality?.tier || 'high'}
        reducedMotion={reducedMotion}
      />

      {/* Deep Space Pinned Planetary Universe (4 Planets) */}
      <PlanetaryUniverse
        activeSection={activeSection}
        sectionProgress={sectionProgress}
        quality={quality}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

export default function SpaceCanvas({
  activeSection = 0,
  sectionProgress = 0.5,
  quality
}) {
  return (
    <Canvas
      className="space-canvas"
      camera={{ position: [0, 0, 7.5], fov: 45 }}
      dpr={quality?.dpr || [1, 1.5]}
      gl={{
        antialias: quality?.tier === 'high',
        powerPreference: 'high-performance',
        alpha: false
      }}
    >
      <Suspense fallback={null}>
        <CanvasContent
          activeSection={activeSection}
          sectionProgress={sectionProgress}
          quality={quality}
        />
      </Suspense>
    </Canvas>
  );
}
