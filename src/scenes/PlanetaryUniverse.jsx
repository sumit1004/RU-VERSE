import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import PlanetModel from './PlanetModel';
import { ASSETS } from '../data/universeData';
import { useCalibrationStore } from '../hooks/useCalibrationState';
import { screenToWorld, worldToScreen } from '../utils/coordinateTransform';

const SECTION_KEYS = ['ruVerse', 'about', 'events', 'contact'];

export default function PlanetaryUniverse({
  activeSection = 0,
  sectionProgress = 0.5,
  quality,
  reducedMotion = false
}) {
  const planetsGroupRef = useRef([]);
  const { camera, size } = useThree();

  const isMobile = quality?.mobile || false;
  const calibrationEnabled = useCalibrationStore((state) => state.enabled);
  const activeSectionKey = useCalibrationStore((state) => state.activeSectionKey);
  const freezeAnimations = useCalibrationStore((state) => state.freezeAnimations);
  const positions = useCalibrationStore((state) => state.positions);
  const setLiveReadout = useCalibrationStore((state) => state.setLiveReadout);

  // Asset configurations for all 4 sectors
  const sectionAssets = useMemo(() => [
    { id: 'ru-verse', key: 'ruVerse', modelPath: ASSETS.ruVerse, fallbackColor: '#4ea8de', entryDir: [-1, 1], exitDir: [1, -1] },
    { id: 'about', key: 'about', modelPath: ASSETS.about, fallbackColor: '#9d4edd', entryDir: [1, 1], exitDir: [-1, -1] },
    { id: 'events', key: 'events', modelPath: ASSETS.events, fallbackColor: '#f77f00', entryDir: [1, -1], exitDir: [-1, 1] },
    { id: 'contact', key: 'contact', modelPath: ASSETS.contact, fallbackColor: '#e0a96d', entryDir: [-1, -1], exitDir: [1, 1] }
  ], []);

  useFrame((_, delta) => {
    const isMobileMode = isMobile || (size.width < 768);
    const modeKey = isMobileMode ? 'mobile' : 'desktop';

    sectionAssets.forEach((sec, idx) => {
      const grp = planetsGroupRef.current[idx];
      if (!grp) return;

      const secKey = sec.key;
      const config = positions[secKey]?.[modeKey] || {
        screenX: 0.5, screenY: 0.5, targetZ: 0,
        rotationX: 0, rotationY: 0, rotationZ: 0,
        scale: 1.5
      };

      // Base World Position derived from Screen Intent
      const baseFocusWorld = screenToWorld(
        camera,
        config.screenX,
        config.screenY,
        config.targetZ || 0
      );

      // Entry / Exit World Positions (offset from focus)
      const entryOffset = new THREE.Vector3(sec.entryDir[0] * 9, sec.entryDir[1] * 7, -8);
      const exitOffset = new THREE.Vector3(sec.exitDir[0] * 9, sec.exitDir[1] * 7, -10);
      const entryPos = baseFocusWorld.clone().add(entryOffset);
      const exitPos = baseFocusWorld.clone().add(exitOffset);

      // Check current section state
      const isCurrent = (calibrationEnabled && activeSectionKey === secKey) || activeSection === idx;
      const isPast = activeSection > idx && !calibrationEnabled;
      const isFuture = activeSection < idx && !calibrationEnabled;

      let targetPos = new THREE.Vector3();
      let targetScale = 0;

      // Calibration Freeze Mode: Lock current calibrating ship directly at base focus
      if (calibrationEnabled && (freezeAnimations || activeSectionKey === secKey)) {
        if (activeSectionKey === secKey) {
          targetPos.copy(baseFocusWorld);
          targetScale = config.scale;

          // Update live screen & world coordinates in calibration store
          const liveScreen = worldToScreen(camera, grp.position);
          setLiveReadout({
            screenX: liveScreen.screenX,
            screenY: liveScreen.screenY,
            worldX: parseFloat(grp.position.x.toFixed(2)),
            worldY: parseFloat(grp.position.y.toFixed(2)),
            worldZ: parseFloat(grp.position.z.toFixed(2)),
            cameraFov: camera.fov || 45,
            cameraAspect: parseFloat((camera.aspect || 1.77).toFixed(2)),
          });
        } else {
          targetPos.copy(exitPos);
          targetScale = 0.001;
        }
      } else if (isCurrent) {
        if (sectionProgress < 0.35) {
          // Entering phase: from entry corner into focus
          const t = Math.max(0, sectionProgress / 0.35);
          const eased = t * t * (3 - 2 * t);
          targetPos.lerpVectors(entryPos, baseFocusWorld, eased);
          targetScale = THREE.MathUtils.lerp(0.3, config.scale, eased);
        } else if (sectionProgress <= 0.65) {
          // Locked in focus: exactly at base calibrated screen position
          targetPos.copy(baseFocusWorld);
          targetScale = config.scale;
        } else {
          // Exiting phase: from focus towards exit corner
          const t = (sectionProgress - 0.65) / 0.35;
          const eased = t * t * (3 - 2 * t);
          targetPos.lerpVectors(baseFocusWorld, exitPos, eased);
          targetScale = THREE.MathUtils.lerp(config.scale, 0.2, eased);
        }
      } else if (isPast) {
        targetPos.copy(exitPos);
        targetScale = 0.001;
      } else if (isFuture) {
        targetPos.copy(entryPos);
        targetScale = 0.001;
      }

      // Smooth lerp to target position and scale
      grp.position.lerp(targetPos, 0.12);
      const currentScale = grp.scale.x;
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.12);
      grp.scale.setScalar(Math.max(0.0001, nextScale));
      grp.visible = grp.scale.x > 0.01;
    });
  });

  const isMobileMode = isMobile || (size.width < 768);
  const modeKey = isMobileMode ? 'mobile' : 'desktop';

  return (
    <group>
      {/* Planetary / Ship Scene Lighting */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 8, 7]} intensity={3.2} color="#ffffff" />
      <pointLight position={[-8, -4, 4]} intensity={14} distance={25} color="#90b4ce" />
      <pointLight position={[0, 10, -5]} intensity={8} distance={20} color="#6a4c93" />

      {sectionAssets.map((sec, idx) => {
        const secConfig = positions[sec.key]?.[modeKey] || {
          rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1.5
        };
        const isCalibratingThis = calibrationEnabled && activeSectionKey === sec.key;

        return (
          <group
            key={sec.id}
            ref={(el) => (planetsGroupRef.current[idx] = el)}
            scale={0.001}
            visible={false}
          >
            <PlanetModel
              modelPath={sec.modelPath}
              targetRadius={1.5}
              rotation={[secConfig.rotationX, secConfig.rotationY, secConfig.rotationZ]}
              scale={secConfig.scale}
              fallbackColor={sec.fallbackColor}
              isCalibrating={isCalibratingThis}
            />
          </group>
        );
      })}
    </group>
  );
}
