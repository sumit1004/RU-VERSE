import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useDevicePerformance } from '../../hooks/useDevicePerformance';
import CinematicEntryGate from '../../components/intro/CinematicEntryGate';
import VideoIntro from '../../components/intro/VideoIntro';
import MainWebsite from '../../components/main/MainWebsite';
import '../../App.css';

export default function PublicWebsite() {
  const quality = useDevicePerformance();
  const location = useLocation();

  // Determine if the user has already entered the site or is returning from an event route
  const alreadyEntered = typeof window !== 'undefined' && (
    sessionStorage.getItem('ruverse_entered') === 'true' ||
    location.state?.fromPublicDetail === true ||
    location.state?.targetSection ||
    window.location.hash
  );

  const [showEntryGate, setShowEntryGate] = useState(!alreadyEntered);
  const [showVideo, setShowVideo] = useState(false);
  const [showMain, setShowMain] = useState(!!alreadyEntered);

  // Manage body scroll locking: lock during intro sequence, unlock when main website active
  useEffect(() => {
    if (!showMain) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
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
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ruverse_entered', 'true');
    }
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
