import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH = '/models/planets/light_fighter.glb';

// Preload the hero ship model
try {
  useGLTF.preload(MODEL_PATH);
} catch (e) {
  console.warn('[RU VERSE] Hero ship preload notice:', e);
}

/**
 * Hero Flight Path Control Points:
 * 1. Enters from upper-left (p = 0.00): x = -5.2, y = 2.8
 * 2. Curves down towards horizontal center axis (p = 0.18): x = -2.6, y = 1.0
 * 3. Reaches exact CENTER of Hero on horizontal axis (p = 0.35): x = 0.0, y = 0.0 (Reveal starts!)
 * 4. Cruises horizontally from CENTER → RIGHT (p = 0.35 → 0.65): x = 0.0 → 3.4, y = 0.0 (Logo reveals in lockstep!)
 * 5. Accelerates forward and exits beyond right viewport (p = 0.65 → 0.85): x = 6.0, y = 0.8
 * 6. Off-screen cruising during viewing buffer (p = 0.85 → 1.00): x = 8.5, y = 1.4 (Logo stays fixed & 100% visible!)
 */
const HERO_FLIGHT_POINTS = [
  new THREE.Vector3(-5.2, 2.8, -0.6),   // 0.00: Upper-left entry
  new THREE.Vector3(-2.6, 1.0, 0.4),    // 0.18: Curve towards center horizontal axis
  new THREE.Vector3(0.0, 0.0, 1.2),     // 0.35: Reaches exact CENTER on horizontal axis (Reveal begins!)
  new THREE.Vector3(1.8, 0.0, 1.1),     // 0.50: Cruising horizontally from center to right (~50% revealed)
  new THREE.Vector3(3.4, 0.1, 0.8),     // 0.65: Reaches right side (100% revealed)
  new THREE.Vector3(5.5, 0.6, -0.6),    // 0.80: Exits beyond right viewport
  new THREE.Vector3(8.0, 1.4, -2.2),    // 1.00: Off-screen buffer
];

function NormalizedHeroModel({ targetRadius = 1.3 }) {
  const gltf = useGLTF(MODEL_PATH);

  const normalizedScene = useMemo(() => {
    if (!gltf?.scene) return null;
    const scene = gltf.scene.clone(true);

    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    // Recenter geometry to (0,0,0)
    scene.position.sub(center);

    // Scale to target radius
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    scene.scale.setScalar((targetRadius * 2) / maxDim);

    return scene;
  }, [gltf, targetRadius]);

  if (!normalizedScene) return null;
  return <primitive object={normalizedScene} />;
}

export default function HeroShipFlight({
  activeSection = -1,
  sectionProgress = 0,
  quality,
  reducedMotion = false
}) {
  const groupRef = useRef();
  const orientationRef = useRef();
  const currentProgressRef = useRef(0);
  const { size } = useThree();

  const isMobile = quality?.mobile || (size.width < 768);
  const aspect = size.width / (size.height || 1);

  // Build responsive 3D Catmull-Rom spline adapted to viewport aspect ratio
  const flightCurve = useMemo(() => {
    const horizontalScale = isMobile ? Math.max(0.55, Math.min(0.9, aspect / 1.4)) : 1.0;
    const verticalScale = isMobile ? 0.85 : 1.0;

    const scaledPoints = HERO_FLIGHT_POINTS.map((pt) => {
      return new THREE.Vector3(
        pt.x * horizontalScale,
        pt.y * verticalScale,
        pt.z
      );
    });

    return new THREE.CatmullRomCurve3(scaledPoints, false, 'catmullrom', 0.5);
  }, [isMobile, aspect]);

  // Inertia tracking vectors (reused per frame to prevent garbage collection)
  const isInitializedRef = useRef(false);
  const vCurrentPos = useRef(new THREE.Vector3());
  const vTargetPos = useRef(new THREE.Vector3());
  const vTangent = useRef(new THREE.Vector3());
  const qTargetRot = useRef(new THREE.Quaternion());
  const mRotation = useRef(new THREE.Matrix4());
  const vUp = useRef(new THREE.Vector3(0, 1, 0));

  useFrame((_, delta) => {
    const grp = groupRef.current;
    if (!grp) return;

    // Active during Hero section (activeSection === -1)
    const isHeroActive = activeSection === -1;
    const rawTargetProgress = isHeroActive
      ? THREE.MathUtils.clamp(sectionProgress, 0, 1)
      : (activeSection < -1 ? 0 : 1);

    // If past Hero, hide group
    if (!isHeroActive && activeSection >= 0) {
      grp.visible = false;
      return;
    }

    grp.visible = true;

    // Smooth scroll progress interpolation
    const isFirstFrame = !isInitializedRef.current;
    if (isFirstFrame) {
      currentProgressRef.current = rawTargetProgress;
    } else {
      const lerpSpeed = reducedMotion ? 1.0 : Math.min(1.0, delta * 12);
      currentProgressRef.current = THREE.MathUtils.lerp(
        currentProgressRef.current,
        rawTargetProgress,
        lerpSpeed
      );
    }

    const p = THREE.MathUtils.clamp(currentProgressRef.current, 0, 0.999);

    // 1. Calculate deterministic position on the 3D curve
    flightCurve.getPointAt(p, vTargetPos.current);

    // 2. Calculate tangent orientation along the flight trajectory
    const stepAhead = Math.min(1.0, p + 0.015);
    const p1 = flightCurve.getPointAt(p);
    const p2 = flightCurve.getPointAt(stepAhead);

    if (p >= 0.99) {
      const pPrev = flightCurve.getPointAt(Math.max(0, p - 0.015));
      vTangent.current.subVectors(p1, pPrev).normalize();
    } else {
      vTangent.current.subVectors(p2, p1).normalize();
    }

    // 3. Construct look-at rotation matrix with banking/roll
    if (vTangent.current.lengthSq() > 0.0001) {
      mRotation.current.lookAt(new THREE.Vector3(0, 0, 0), vTangent.current, vUp.current);
      qTargetRot.current.setFromRotationMatrix(mRotation.current);

      if (!reducedMotion) {
        // Subtle banking during turns
        const bankAngle = THREE.MathUtils.clamp(-vTangent.current.y * 0.35, -0.2, 0.2);
        const qBank = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), bankAngle);
        qTargetRot.current.multiply(qBank);
      }
    }

    // 4. Apply transform to 3D object
    if (isFirstFrame) {
      // First frame: snap directly to start position & orientation with ZERO lerp from (0,0,0)
      vCurrentPos.current.copy(vTargetPos.current);
      grp.position.copy(vTargetPos.current);
      if (orientationRef.current) {
        orientationRef.current.quaternion.copy(qTargetRot.current);
      }
      isInitializedRef.current = true;
    } else {
      vCurrentPos.current.lerp(vTargetPos.current, 0.18);
      grp.position.copy(vCurrentPos.current);
      if (orientationRef.current) {
        orientationRef.current.quaternion.slerp(qTargetRot.current, 0.18);
      }
    }

    // 5. Depth scaling
    const baseScale = isMobile ? 0.75 : 1.15;
    const depthScale = THREE.MathUtils.lerp(baseScale * 1.05, baseScale * 0.9, p);
    grp.scale.setScalar(depthScale);
  });

  const initialPos = HERO_FLIGHT_POINTS[0];

  return (
    <group ref={groupRef} position={[initialPos.x, initialPos.y, initialPos.z]}>
      <group ref={orientationRef}>
        <React.Suspense
          fallback={
            <mesh>
              <coneGeometry args={[0.5, 1.2, 8]} />
              <meshStandardMaterial color="#00e5ff" wireframe />
            </mesh>
          }
        >
          <NormalizedHeroModel targetRadius={1.2} />
        </React.Suspense>

        {/* Cyan engine thruster glow */}
        <pointLight
          position={[0, 0, -0.6]}
          intensity={2.2}
          distance={4}
          color="#00e5ff"
        />
      </group>
    </group>
  );
}
