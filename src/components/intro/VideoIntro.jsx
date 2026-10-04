import React, { useRef, useState, useCallback, useEffect } from 'react';

const DESKTOP_VIDEO_PATH = '/videos/opening.mp4';
const MOBILE_VIDEO_PATH = '/videos/loading_mobile.mp4';

/**
 * VideoIntro Component:
 * - Fullscreen video intro experience (plays once automatically)
 * - Single-source responsive selection:
 *    - Mobile (< 768px): /videos/loading_mobile.mp4
 *    - Desktop (>= 768px): /videos/opening.mp4
 * - Plays only the target video (never loads both videos  simultaneously)
 * - Auto-fallback on playback block or missing asset so user is never stuck
 * - Locks body scrolling while active and restores it cleanly upon completion
 */
export default function VideoIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasFinishedRef = useRef(false);

  // Detect mobile viewport using matchMedia on mount
  const [isMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 767px)').matches;
    }
    return false;
  });

  const videoSrc = isMobile ? MOBILE_VIDEO_PATH : DESKTOP_VIDEO_PATH;

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // Restore body scrolling
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450); // 450ms smooth fade transition
  }, [onComplete]);

  const handleError = useCallback((err) => {
    console.warn('[RU VERSE] Video load note, proceeding to main site:', err);
    handleFinish();
  }, [handleFinish]);

  useEffect(() => {
    // Lock body scrolling during intro
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.defaultMuted = false;

    // Safety timeout to ensure user never gets stuck (max 20 seconds)
    const timeout = setTimeout(() => {
      if (!hasFinishedRef.current) {
        console.warn('[RU VERSE] Video completed or safety timeout reached');
        handleFinish();
      }
    }, 20000);

    // Attempt autoplay immediately
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('[RU VERSE] Autoplay note:', error);
      });
    }

    // Allow user tap anywhere on screen to trigger play if autoplay was blocked
    const handleUserInteraction = () => {
      if (video && video.paused) {
        video.play().catch(() => handleFinish());
      }
    };
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [handleFinish]);

  return (
    <div className={`video-intro ${isFadingOut ? 'is-fading-out' : ''}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        playsInline
        preload="auto"
        onEnded={handleFinish}
        onError={handleError}
        className="intro-video-element"
      />
    </div>
  );
}
