import React, { useRef, useState, useCallback, useEffect } from 'react';

/**
 * VideoIntro Component:
 * - Fullscreen video intro experience (plays once automatically)
 * - Muted autoplay with playsInline for broad browser/mobile compatibility
 * - On video end, smoothly fades out and calls onComplete() to unlock MainWebsite
 * - Graceful fallback error handling so user is never stuck
 */
export default function VideoIntro({ onComplete }) {
  const videoRef = useRef(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasFinishedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450); // 450ms smooth fade transition
  }, [onComplete]);

  const handleError = useCallback((err) => {
    console.warn('[RU VERSE] Intro video failed to load or play, proceeding to main website:', err);
    handleFinish();
  }, [handleFinish]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Attempt to start playback immediately
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('[RU VERSE] Video autoplay blocked or delayed:', error);
      });
    }
  }, []);

  return (
    <div className={`video-intro ${isFadingOut ? 'is-fading-out' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        preload="auto"
        onEnded={handleFinish}
        onError={handleError}
        className="intro-video-element"
      >
        <source src="/videos/opening.mp4" type="video/mp4" />
        <source src="/videos/loading.mp4" type="video/mp4" />
        <source src="/videos/ruverse-intro.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
