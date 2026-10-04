import React, { useState, useEffect, useCallback } from 'react';
import { useDevicePerformance } from './hooks/useDevicePerformance';
import VideoIntro from './components/intro/VideoIntro';
import MainWebsite from './components/main/MainWebsite';
import './App.css';

export default function App() {
  const quality = useDevicePerformance();
  const [introComplete, setIntroComplete] = useState(false);

  // Manage body scroll locking: lock during intro, unlock when main website active
  useEffect(() => {
    if (!introComplete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [introComplete]);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  return (
    <div className={`ru-app-root quality-${quality.tier}`}>
      {/* 1. Dedicated Fullscreen Video Intro Screen */}
      {!introComplete && (
        <VideoIntro
          onComplete={handleIntroComplete}
        />
      )}

      {/* 2. Main RU VERSE Website (Revealed after video completes) */}
      {introComplete && (
        <MainWebsite quality={quality} />
      )}
    </div>
  );
}
