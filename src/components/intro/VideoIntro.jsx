import React, { useRef, useState, useCallback, useEffect } from 'react';

const DESKTOP_VIDEO_PATH = '/videos/opening.mp4';
const MOBILE_VIDEO_PATH = '/videos/loading_mobile.mp4';

/**
 * VideoIntro Component:
 * - Fullscreen video intro experience (plays once automatically after entry gate click)
 * - Single-source responsive selection:
 *    - Mobile (< 768px): /videos/loading_mobile.mp4
 *    - Desktop (>= 768px): /videos/opening.mp4
 * - Plays only the target video (never loads both videos simultaneously)
 * - Auto-fallback on playback block or missing asset so user is never stuck
 * - Locks body scrolling while active and restores it cleanly upon completion
 */
export default function VideoIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasFinishedRef = useRef(false);

  // Viewport media-query detection
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(max-width: 767px)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const update = () => {
      setIsMobile(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener('change', update);

    return () => {
      mediaQuery.removeEventListener('change', update);
    };
  }, []);

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

    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');

    // Safety timeout to ensure user never gets stuck (max 20 seconds)
    const timeout = setTimeout(() => {
      if (!hasFinishedRef.current) {
        console.warn('[RU VERSE] Video completed or safety timeout reached');
        handleFinish();
      }
    }, 20000);

    const tryAutoplay = async () => {
      if (hasFinishedRef.current) return;
      const vid = videoRef.current;
      if (!vid) return;

      try {
        // Attempt unmuted play first since user triggered "ENTER THE VERSE"
        vid.muted = false;
        await vid.play();
        console.log('[RU VERSE] Video intro playing with audio');
      } catch (audioErr) {
        console.warn('[RU VERSE] Unmuted autoplay blocked, trying muted play:', audioErr);
        try {
          vid.muted = true;
          vid.defaultMuted = true;
          vid.setAttribute('muted', '');
          await vid.play();
          console.log('[RU VERSE] Video intro playing muted fallback');
        } catch (mutedErr) {
          console.warn('[RU VERSE] Muted playback blocked:', mutedErr);
        }
      }
    };

    // Ensure the new source is loaded properly before playback
    video.load();

    // Attempt to play immediately
    tryAutoplay();

    // Listen for readiness events to retry if the immediate attempt fails
    video.addEventListener('canplay', tryAutoplay, { once: true });
    video.addEventListener('loadedmetadata', tryAutoplay, { once: true });

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('canplay', tryAutoplay);
      video.removeEventListener('loadedmetadata', tryAutoplay);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [videoSrc, handleFinish]);

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
