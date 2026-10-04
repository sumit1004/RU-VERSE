import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { updateSmoothedPointer } from '../hooks/useGlobalPointer';

export default function StarField({
  count = 4800,
  reducedMotion = false,
  quality = 'high'
}) {
  const farStarsRef = useRef();
  const midStarsRef = useRef();
  const nearStarsRef = useRef();
  const heroStarsRef = useRef();
  const shootingStarsRef = useRef();

  // Determine actual star count based on quality setting
  const effectiveCount = useMemo(() => {
    if (quality === 'low') return Math.max(1600, Math.floor(count * 0.45));
    if (quality === 'medium') return Math.max(3000, Math.floor(count * 0.75));
    return count;
  }, [count, quality]);

  // Refined natural celestial glow texture
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.10, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.24, 'rgba(200, 240, 255, 0.75)');
    grad.addColorStop(0.45, 'rgba(100, 200, 255, 0.35)');
    grad.addColorStop(0.70, 'rgba(80, 160, 240, 0.10)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Elegant soft star flare texture for foreground hero stars
  const flareTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.38, 'rgba(140, 230, 255, 0.45)');
    grad.addColorStop(0.65, 'rgba(100, 190, 255, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Subtle cross flare rays
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(64, 22);
    ctx.lineTo(64, 106);
    ctx.moveTo(22, 64);
    ctx.lineTo(106, 64);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Palette: radiant, balanced celestial hues
  const palette = useMemo(() => [
    new THREE.Color('#ffffff'), // Pure White
    new THREE.Color('#ffffff'), // Diamond White
    new THREE.Color('#99eaff'), // Soft Cyan
    new THREE.Color('#b3e5fc'), // Ice Blue
    new THREE.Color('#e0f2fe'), // Pale Cyan
    new THREE.Color('#ffe082'), // Soft Gold
    new THREE.Color('#e1bee7'), // Soft Violet
  ], []);

  // LAYER 1: Distant Stars (55% of total)
  const [farPositions, farColors] = useMemo(() => {
    const fCount = Math.floor(effectiveCount * 0.55);
    const pos = new Float32Array(fCount * 3);
    const cols = new Float32Array(fCount * 3);

    for (let i = 0; i < fCount; i++) {
      const i3 = i * 3;
      const r = 30 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.cos(phi);
      pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const col = palette[Math.floor(Math.random() * palette.length)];
      cols[i3] = col.r * 1.0;
      cols[i3 + 1] = col.g * 1.0;
      cols[i3 + 2] = col.b * 1.0;
    }
    return [pos, cols];
  }, [effectiveCount, palette]);

  // LAYER 2: Midground Stars (30% of total)
  const [midPositions, midColors] = useMemo(() => {
    const mCount = Math.floor(effectiveCount * 0.30);
    const pos = new Float32Array(mCount * 3);
    const cols = new Float32Array(mCount * 3);

    for (let i = 0; i < mCount; i++) {
      const i3 = i * 3;
      const r = 14 + Math.random() * 26;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.cos(phi);
      pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const col = palette[Math.floor(Math.random() * palette.length)];
      cols[i3] = col.r * 1.1;
      cols[i3 + 1] = col.g * 1.1;
      cols[i3 + 2] = col.b * 1.1;
    }
    return [pos, cols];
  }, [effectiveCount, palette]);

  // LAYER 3: Near Stars (12% of total)
  const [nearPositions, nearColors] = useMemo(() => {
    const nCount = Math.floor(effectiveCount * 0.12);
    const pos = new Float32Array(nCount * 3);
    const cols = new Float32Array(nCount * 3);

    for (let i = 0; i < nCount; i++) {
      const i3 = i * 3;
      const r = 5 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.cos(phi);
      pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const col = palette[Math.floor(Math.random() * 4)];
      cols[i3] = col.r * 1.25;
      cols[i3 + 1] = col.g * 1.25;
      cols[i3 + 2] = col.b * 1.25;
    }
    return [pos, cols];
  }, [effectiveCount, palette]);

  // LAYER 4: Foreground Hero Diamonds (3% of total)
  const [heroPositions, heroColors] = useMemo(() => {
    const hCount = Math.max(40, Math.floor(effectiveCount * 0.03));
    const pos = new Float32Array(hCount * 3);
    const cols = new Float32Array(hCount * 3);

    for (let i = 0; i < hCount; i++) {
      const i3 = i * 3;
      const r = 4 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.cos(phi);
      pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const isGold = Math.random() > 0.7;
      const col = isGold ? new THREE.Color('#ffe082') : new THREE.Color('#80d8ff');
      cols[i3] = col.r * 1.4;
      cols[i3 + 1] = col.g * 1.4;
      cols[i3 + 2] = col.b * 1.4;
    }
    return [pos, cols];
  }, [effectiveCount]);

  useFrame((state, delta) => {
    const pointer = updateSmoothedPointer(0.06);
    const mx = pointer.currentX;
    const my = pointer.currentY;
    const time = state.clock.elapsedTime;

    if (!reducedMotion) {
      // 1. Far Stars: slow drift + subtle depth tracking
      if (farStarsRef.current) {
        farStarsRef.current.rotation.y += delta * 0.002;
        farStarsRef.current.position.x = -mx * 0.4;
        farStarsRef.current.position.y = -my * 0.3;
      }

      // 2. Mid Stars: gentle pulsation + medium cursor tracking
      if (midStarsRef.current) {
        midStarsRef.current.rotation.y += delta * 0.003;
        midStarsRef.current.rotation.z = mx * 0.03;
        midStarsRef.current.position.x = -mx * 0.9;
        midStarsRef.current.position.y = -my * 0.7;
        midStarsRef.current.material.opacity = 0.82 + Math.sin(time * 1.8) * 0.06;
      }

      // 3. Near Stars: responsive cursor tracking + subtle twinkling
      if (nearStarsRef.current) {
        nearStarsRef.current.rotation.y -= delta * 0.004;
        nearStarsRef.current.position.x = -mx * 1.6;
        nearStarsRef.current.position.y = -my * 1.2;
        nearStarsRef.current.material.opacity = 0.86 + Math.cos(time * 2.2) * 0.05;
      }

      // 4. Hero Stars: foreground parallax
      if (heroStarsRef.current) {
        heroStarsRef.current.rotation.y += delta * 0.005;
        heroStarsRef.current.position.x = -mx * 2.2;
        heroStarsRef.current.position.y = -my * 1.7;
        heroStarsRef.current.material.opacity = 0.88 + Math.sin(time * 2.6) * 0.06;
      }
    }
  });

  return (
    <group>
      {/* Layer 1: Distant Galaxy Field */}
      <points ref={farStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[farPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[farColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          map={starTexture}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Layer 2: Midground Stars */}
      <points ref={midStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[midPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[midColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.20}
          map={starTexture}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Layer 3: Near Stars */}
      <points ref={nearStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nearPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[nearColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.32}
          map={starTexture}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.90}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Layer 4: Foreground Hero Diamonds */}
      <points ref={heroStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[heroPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[heroColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.46}
          map={flareTexture}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.90}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

