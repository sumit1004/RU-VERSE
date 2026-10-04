import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './CinematicEntryGate.css';

/**
 * Lightweight Starfield for Entry Gate
 */
function EntryStarField({ count = 1400, reducedMotion = false }) {
    const pointsRef = useRef();

    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        const palette = [
            new THREE.Color('#ffffff'),
            new THREE.Color('#99eaff'),
            new THREE.Color('#b3e5fc'),
            new THREE.Color('#ffe082'),
        ];

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const r = 8 + Math.random() * 32;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            pos[i3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i3 + 1] = r * Math.cos(phi);
            pos[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            const col = palette[Math.floor(Math.random() * palette.length)];
            cols[i3] = col.r;
            cols[i3 + 1] = col.g;
            cols[i3 + 2] = col.b;
        }
        return [pos, cols];
    }, [count]);

    const starTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(200, 240, 255, 0.8)');
        grad.addColorStop(0.5, 'rgba(80, 180, 255, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }, []);

    useFrame((state, delta) => {
        if (reducedMotion || !pointsRef.current) return;
        pointsRef.current.rotation.y += delta * 0.012;
        pointsRef.current.rotation.x += delta * 0.006;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <pointsMaterial
                size={0.18}
                map={starTexture}
                sizeAttenuation
                vertexColors
                transparent
                opacity={0.88}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

/**
 * Distant Flying Background Ships for Entry Gate
 */
function EntryDistantShips({ reducedMotion = false }) {
    const groupRef = useRef();

    const [shipGeometry, engineGeometry] = useMemo(() => {
        const hull = new THREE.ConeGeometry(0.3, 1.2, 4);
        hull.rotateX(Math.PI / 2);
        const engine = new THREE.SphereGeometry(0.1, 6, 6);
        return [hull, engine];
    }, []);

    const hullMaterial = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: '#1a3045',
                transparent: true,
                opacity: 0.5,
                depthWrite: false,
            }),
        []
    );

    const engineMaterial = useMemo(
        () =>
            new THREE.MeshBasicMaterial({
                color: '#00e5ff',
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        []
    );

    const shipCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 4;

    const ships = useMemo(() => {
        const list = [];
        for (let i = 0; i < shipCount; i++) {
            const dir = i % 2 === 0 ? 1 : -1;
            const startX = (Math.random() * 24 - 12) * dir;
            const startY = Math.random() * 10 - 5;
            const startZ = -8 - Math.random() * 8;
            const speed = (0.5 + Math.random() * 0.5) * dir;
            const vy = Math.random() * 0.1 - 0.05;
            const scale = 0.05 + Math.random() * 0.04;

            list.push({
                pos: [startX, startY, startZ],
                speed,
                vy,
                scale,
            });
        }
        return list;
    }, [shipCount]);

    useFrame((state, delta) => {
        if (reducedMotion || !groupRef.current) return;

        groupRef.current.children.forEach((shipGroup, idx) => {
            const data = ships[idx];
            if (!data) return;

            shipGroup.position.x += data.speed * delta;
            shipGroup.position.y += data.vy * delta;

            const angle = Math.atan2(data.vy, data.speed);
            shipGroup.rotation.z = angle - Math.PI / 2;

            if (data.speed > 0 && shipGroup.position.x > 18) {
                shipGroup.position.x = -18;
                shipGroup.position.y = Math.random() * 10 - 5;
            } else if (data.speed < 0 && shipGroup.position.x < -18) {
                shipGroup.position.x = 18;
                shipGroup.position.y = Math.random() * 10 - 5;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {ships.map((s, i) => (
                <group key={i} position={s.pos} scale={s.scale}>
                    <mesh geometry={shipGeometry} material={hullMaterial} />
                    <mesh geometry={engineGeometry} material={engineMaterial} position={[0, 0, -0.6]} />
                </group>
            ))}
        </group>
    );
}

/**
 * CinematicEntryGate Component:
 * - Deep space entrance screen before the intro video
 * - User gesture gate ("ENTER THE VERSE") enabling audio/video playback
 * - Lightweight self-contained R3F background canvas with distant background ships & starfield
 * - Completely unmounts upon transition to free WebGL memory & loops
 */
export default function CinematicEntryGate({ onStartVideo, onExitComplete }) {
    const [isExiting, setIsExiting] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const hasClickedRef = useRef(false);

    // Check prefers-reduced-motion
    const [reducedMotion, setReducedMotion] = useState(false);

    const handleEnterClick = useCallback(() => {
        if (hasClickedRef.current) return;
        hasClickedRef.current = true;
        setHasEntered(true);
        setIsExiting(true);

        // 1. Immediately notify parent to mount & play VideoIntro within user gesture context
        if (onStartVideo) {
            onStartVideo();
        }

        // 2. Allow exit animation (500ms) to complete before unmounting entry gate
        setTimeout(() => {
            if (onExitComplete) {
                onExitComplete();
            }
        }, 550);
    }, [onStartVideo, onExitComplete]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        }

        const handleGlobalKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                handleEnterClick();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleEnterClick]);

    // Keyboard accessibility (Enter / Space key)
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleEnterClick();
            }
        },
        [handleEnterClick]
    );

    return (
        <div
            className={`cinematic-entry-gate ${isExiting ? 'is-exiting' : ''}`}
            role="region"
            aria-label="RUVERSE 2026 Entry Screen"
        >
            {/* Background 1: Deep Space Ambient Glow Layers */}
            <div className="entry-gate-space-bg" />
            <div className="entry-gate-nebula-glow" />

            {/* Background 2: Isolated Lightweight R3F Starfield & Distant Ships */}
            <div className="entry-gate-canvas-wrapper">
                <Canvas
                    camera={{ position: [0, 0, 10], fov: 60 }}
                    gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
                    style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                >
                    <EntryStarField count={1400} reducedMotion={reducedMotion} />
                    <EntryDistantShips reducedMotion={reducedMotion} />
                </Canvas>
            </div>

            {/* Foreground Content */}
            <div className="entry-gate-content">
                {/* Subtle decorative top header tag */}
                <div className="entry-gate-top-tag">
                    <span className="tag-dot" />
                    <span>RUNGTA INTERNATIONAL SKILLS UNIVERSITY</span>
                </div>

                {/* Primary Cinematic Quote */}
                <h1 className="entry-gate-quote">
                    <span className="quote-line line-1">THE FUTURE BEGINS</span>
                    <span className="quote-line line-2">WHERE THE UNKNOWN ENDS.</span>
                </h1>

                {/* Subtitle / Festival Identity */}
                <div className="entry-gate-subtitle">
                    <span className="subtitle-brand">RUVERSE 2026</span>
                    <span className="subtitle-divider">•</span>
                    <span className="subtitle-meta">TECHNICAL FESTIVAL</span>
                </div>

                {/* Primary Enter Button */}
                <div className="entry-gate-action">
                    <button
                        type="button"
                        className="entry-gate-btn"
                        onClick={handleEnterClick}
                        onKeyDown={handleKeyDown}
                        disabled={hasEntered}
                        aria-label="Enter the Verse"
                    >
                        <span className="btn-text">ENTER THE VERSE</span>
                        <span className="btn-arrow" aria-hidden="true">
                            →
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
