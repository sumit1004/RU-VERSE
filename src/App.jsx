import React, { useState, useEffect, useCallback } from 'react';
import { useDevicePerformance } from './hooks/useDevicePerformance';
import CinematicEntryGate from './components/intro/CinematicEntryGate';
import VideoIntro from './components/intro/VideoIntro';
import MainWebsite from './components/main/MainWebsite';
import './App.css';

export default function App() {
  const quality = useDevicePerformance();
  const [showEntryGate, setShowEntryGate] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [showMain, setShowMain] = useState(false);

  // Manage body scroll locking: lock during intro sequence, unlock when main website active
  useEffect(() => {
    if (!showMain) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [showMain]);

  const handleGateClick = useCallback(() => {
    // Mount VideoIntro immediately inside user click handler turn to allow unmuted audio playback
    setShowVideo(true);
  }, []);

  const handleGateExitComplete = useCallback(() => {
    // Unmount Entry Gate completely after exit fade animation finishes
    setShowEntryGate(false);
  }, []);

  const handleVideoComplete = useCallback(() => {
    setShowVideo(false);
    setShowMain(true);
  }, []);

  return (
    <div className={`ru-app-root quality-${quality.tier}`}>
      {/* 1. Dedicated Fullscreen Video Intro Screen */}
      {showVideo && (
        <VideoIntro onComplete={handleVideoComplete} />
      )}

      {/* 2. Cinematic Entry Gate (Rendered on top until user enters & exit animation completes) */}
      {showEntryGate && (
        <CinematicEntryGate
          onStartVideo={handleGateClick}
          onExitComplete={handleGateExitComplete}
        />
      )}

      {/* 3. Main RU VERSE Website (Revealed after video completes) */}
      {showMain && (
        <MainWebsite quality={quality} />
      )}
    </div>
  );
}
