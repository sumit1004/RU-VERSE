import React, { useState, useRef, useEffect, useCallback } from 'react';
import './CinematicEntryGate.css';

const BACKGROUND_IMAGE = '/models/planets/mainbg.png';

/**
 * 4 Separate 2D Spaceship Overlays positioned around the viewport edges
 * Independent scales, opacities, and parallax strengths
 */
const ENTRY_SHIPS = [
    {
        id: 'ship-01',
        src: '/models/planets/one.png',
        fallbackSrcs: ['/one.png', '/models/planets/one.png', '/ship1.png', '/ship-01.png'],
        alt: 'Scout Interceptor',
        className: 'entry-ship-01',
        strength: 14,
        idleSpeed: 1.2,
        idleAmpX: 3,
        idleAmpY: 4,
        opacity: 0.88,
    },
    {
        id: 'ship-02',
        src: '/models/planets/two.png',
        fallbackSrcs: ['/two.png', '/models/planets/two.png', '/ship2.png', '/ship-02.png'],
        alt: 'Heavy Dreadnought',
        className: 'entry-ship-02',
        strength: 24,
        idleSpeed: 0.9,
        idleAmpX: 4,
        idleAmpY: 5,
        opacity: 0.95,
    },
    {
        id: 'ship-03',
        src: '/models/planets/three.png',
        fallbackSrcs: ['/three.png', '/models/planets/three.png', '/ship3.png', '/ship-03.png'],
        alt: 'Recon Vessel',
        className: 'entry-ship-03',
        strength: 30,
        idleSpeed: 1.5,
        idleAmpX: 2,
        idleAmpY: 3,
        opacity: 0.68,
    },
    {
        id: 'ship-04',
        src: '/models/planets/four.png',
        fallbackSrcs: ['/four.png', '/models/planets/four.png', '/ship4.png', '/ship-04.png'],
        alt: 'Tactical Frigate',
        className: 'entry-ship-04',
        strength: 18,
        idleSpeed: 1.0,
        idleAmpX: 3,
        idleAmpY: 4,
        opacity: 0.82,
    },
];

/**
 * CinematicEntryGate Component:
 * - Authoritative background image: /models/planets/mainbg.png
 * - Four 2D spaceship image overlays around viewport edges (one.png, two.png, three.png, four.png)
 * - Four 2D spaceship image overlays around viewport edges
 * - High-performance requestAnimationFrame mouse parallax with smooth lerp (ZERO continuous React re-renders)
 * - User gesture gate ("ENTER THE VERSE") triggering existing VideoIntro
 * - Full cleanup of event listeners and rAF loops upon transition
 */
export default function CinematicEntryGate({ onStartVideo, onExitComplete }) {
    const [isExiting, setIsExiting] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);
    const hasClickedRef = useRef(false);

    // Ship DOM Element refs for direct transform updates without triggering React state updates
    const shipRefs = useRef([]);

    // Normalized mouse coordinates (-1 to 1) with inertia lerp
    const mouseRef = useRef({ targetX: 0, targetY: 0, currentX: 0, currentY: 0 });
    const isTouchRef = useRef(false);
    const animFrameIdRef = useRef(null);

    // Parallax animation loop
    useEffect(() => {
        let startTime = performance.now();
        const reducedMotion =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const mobileScale = isMobile ? 0.45 : 1.0;

        const handleMouseMove = (e) => {
            if (isTouchRef.current) return;
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = (e.clientY / window.innerHeight) * 2 - 1;
            mouseRef.current.targetX = Math.max(-1, Math.min(1, nx));
            mouseRef.current.targetY = Math.max(-1, Math.min(1, ny));
        };

        const handleTouchStart = () => {
            isTouchRef.current = true;
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('mousemove', handleMouseMove, { passive: true });
            window.addEventListener('touchstart', handleTouchStart, { passive: true });
        }

        const animate = (time) => {
            const elapsed = (time - startTime) * 0.001;

            // Smooth lerp mouse position (cinematic inertia)
            const lerpFactor = 0.06;
            mouseRef.current.currentX +=
                (mouseRef.current.targetX - mouseRef.current.currentX) * lerpFactor;
            mouseRef.current.currentY +=
                (mouseRef.current.targetY - mouseRef.current.currentY) * lerpFactor;

            const mx = mouseRef.current.currentX;
            const my = mouseRef.current.currentY;

            // Update each ship's CSS transform directly via DOM ref
            ENTRY_SHIPS.forEach((ship, index) => {
                const el = shipRefs.current[index];
                if (!el) return;

                if (reducedMotion) {
                    el.style.transform = 'translate3d(0, 0, 0)';
                    return;
                }

                // Parallax offset
                const pX = mx * ship.strength * mobileScale;
                const pY = my * ship.strength * mobileScale;

                // Subtle idle floating motion
                const idleX = Math.sin(elapsed * ship.idleSpeed + index * 1.5) * ship.idleAmpX;
                const idleY = Math.cos(elapsed * ship.idleSpeed * 0.8 + index * 1.2) * ship.idleAmpY;

                const totalX = (pX + idleX).toFixed(2);
                const totalY = (pY + idleY).toFixed(2);

                el.style.transform = `translate3d(${totalX}px, ${totalY}px, 0)`;
            });

            animFrameIdRef.current = requestAnimationFrame(animate);
        };

        animFrameIdRef.current = requestAnimationFrame(animate);

        return () => {
            if (animFrameIdRef.current) {
                cancelAnimationFrame(animFrameIdRef.current);
            }
            if (typeof window !== 'undefined') {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('touchstart', handleTouchStart);
            }
        };
    }, []);

    const handleEnterClick = useCallback(() => {
        if (hasClickedRef.current) return;
        hasClickedRef.current = true;
        setHasEntered(true);
        setIsExiting(true);

        // Cancel rAF loop immediately on click to free resources
        if (animFrameIdRef.current) {
            cancelAnimationFrame(animFrameIdRef.current);
        }

        // 1. Immediately notify parent to mount & play VideoIntro within user gesture context
        if (onStartVideo) {
            onStartVideo();
        }

        // 2. Allow exit animation (450ms) to complete before unmounting entry gate
        setTimeout(() => {
            if (onExitComplete) {
                onExitComplete();
            }
        }, 500);
    }, [onStartVideo, onExitComplete]);

    // Global keydown listener for keyboard accessibility
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleEnterClick();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleEnterClick]);

    // Keyboard accessibility on button
    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleEnterClick();
            }
        },
        [handleEnterClick]
    );

    const handleImageError = (e, ship) => {
        if (ship.fallbackSrcs && ship.fallbackSrcs.length > 0) {
            const nextSrc = ship.fallbackSrcs.shift();
            e.target.src = nextSrc;
        } else {
            e.target.style.display = 'none';
        }
    };

    return (
        <div
            className={`cinematic-entry-gate ${isExiting ? 'is-exiting' : ''}`}
            role="region"
            aria-label="RUVERSE 2026 Entry Screen"
        >
            {/* 1. Authoritative Fullscreen Background Image */}
            <img
                src={BACKGROUND_IMAGE}
                alt="Deep Space Background"
                className="entry-gate-bg-image"
                loading="eager"
                onError={(e) => {
                    // Fallback if /models/planets/mainbg.png fails to resolve
                    if (!e.target.dataset.fallbackTried) {
                        e.target.dataset.fallbackTried = '1';
                        e.target.src = '/mainbg.png';
                    }
                }}
            />

            {/* 2. Subtle Vignette & Central Readability Layer */}
            <div className="entry-gate-vignette" />

            {/* 3. Four 2D Spaceship Overlays with Mouse Parallax */}
            <div className="entry-gate-ships-layer">
                {ENTRY_SHIPS.map((ship, index) => (
                    <div
                        key={ship.id}
                        ref={(el) => (shipRefs.current[index] = el)}
                        className={`entry-ship-container ${ship.className}`}
                        style={{ opacity: ship.opacity }}
                    >
                        <img
                            src={ship.src}
                            alt={ship.alt}
                            className="entry-ship-img"
                            loading="eager"
                            onError={(e) => handleImageError(e, ship)}
                        />
                    </div>
                ))}
            </div>

            {/* 4. Foreground Central Typography & Action */}
            <div className="entry-gate-content">
                {/* Top Tag */}
                <div className="entry-gate-top-tag">
                    <span className="tag-dot" />
                    <span>RUVERSE 2026</span>
                </div>

                {/* Main Cinematic Line */}
                <h1 className="entry-gate-quote">
                    <span className="quote-line line-1">THE FUTURE BEGINS</span>
                    <span className="quote-line line-2">WHERE THE UNKNOWN ENDS.</span>
                </h1>

                {/* Primary Interactive Button */}
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
