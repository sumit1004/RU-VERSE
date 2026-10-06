import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Creates ScrollTrigger listeners for the Hero and 4 planetary stages on the Main Website.
 * Direct scrub controls planet entry, rotation, content panel HUD, and transitions.
 */
export function createUniverseTimeline({ onSectionUpdate }) {
  const triggers = [];

  // Hero Section Trigger (Pinned at center while 3D ship flies and reveals logo)
  const heroEl = document.getElementById('hero-section');
  if (heroEl) {
    const heroTrigger = ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: '+=160%',
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      onUpdate: (self) => {
        if (self.isActive) {
          onSectionUpdate(-1, self.progress);
        }
      },
      onEnter: () => {
        onSectionUpdate(-1, 0);
      },
      onEnterBack: () => {
        onSectionUpdate(-1, 0.99);
      },
      onLeave: () => {
        onSectionUpdate(0, 0);
      },
      onLeaveBack: () => {
        onSectionUpdate(-1, 0);
      },
    });
    triggers.push(heroTrigger);
  }

  // Planetary Viewport-Pinned Sections (4 Sectors)
  const sections = document.querySelectorAll('.universe-pinned-section');
  sections.forEach((section, index) => {
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=140%',
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      onUpdate: (self) => {
        if (self.isActive) {
          onSectionUpdate(index, self.progress);
        }
      },
      onEnter: () => {
        onSectionUpdate(index, 0.1);
      },
      onEnterBack: () => {
        onSectionUpdate(index, 0.9);
      },
      onLeave: () => {
        if (index < sections.length - 1) {
          onSectionUpdate(index + 1, 0.0);
        }
      },
      onLeaveBack: () => {
        if (index > 0) {
          onSectionUpdate(index - 1, 1.0);
        } else {
          onSectionUpdate(-1, 0);
        }
      }
    });

    triggers.push(trigger);
  });

  // Global smooth navigation helper
  window.__navigateToSection = (targetIndex) => {
    ScrollTrigger.refresh();
    if (targetIndex === -1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Planet section triggers start after hero trigger if present
    const planetTriggers = triggers.filter(t => t.trigger !== heroEl);
    if (targetIndex < 0 || targetIndex >= planetTriggers.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const targetTrigger = planetTriggers[targetIndex];
    if (targetTrigger) {
      // Land at 50% midpoint of the pinned sector where HUD is locked, planet is centered, and editorial is visible
      const targetScroll = targetTrigger.start + (targetTrigger.end - targetTrigger.start) * 0.50;
      window.scrollTo({
        top: Math.round(targetScroll),
        behavior: 'smooth'
      });
    }
  };

  return () => {
    triggers.forEach((t) => t.kill());
  };
}
