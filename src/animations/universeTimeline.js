import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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
      end: '+=85%',
      pin: true,
      pinSpacing: true,
      scrub: 0.15,
      onUpdate: (self) => {
        if (self.isActive) {
          onSectionUpdate(-1, self.progress);
        }
      },
      onToggle: (self) => {
        if (self.isActive) {
          onSectionUpdate(-1, self.progress);
        }
      },
    });
    triggers.push(heroTrigger);
  }

  // Planetary & 2D Viewport-Pinned Sections
  const sections = document.querySelectorAll('.universe-pinned-section');
  sections.forEach((section, index) => {
    const isContact = section.id === 'section-contact';
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: isContact ? '+=150%' : '+=100%',
      pin: true,
      pinSpacing: true,
      scrub: 0.15,
      onUpdate: (self) => {
        if (self.isActive) {
          onSectionUpdate(index, self.progress);
        }
      },
      onToggle: (self) => {
        if (self.isActive) {
          onSectionUpdate(index, self.progress);
        }
      },
    });

    triggers.push(trigger);
  });

  // Centralized, unified GSAP smooth navigation engine
  window.__navigateToSection = (targetIndex) => {
    // Kill any existing window scroll tween before starting a new one
    gsap.killTweensOf(window);

    if (targetIndex === -1) {
      gsap.to(window, {
        scrollTo: { y: 0, autoKill: true },
        duration: 1.2,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      return;
    }

    const planetTriggers = triggers.filter((t) => t.trigger !== heroEl);
    if (targetIndex < 0 || targetIndex >= planetTriggers.length) {
      gsap.to(window, {
        scrollTo: { y: 0, autoKill: true },
        duration: 1.2,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      return;
    }

    const targetTrigger = planetTriggers[targetIndex];
    if (targetTrigger) {
      // For Contact (index 4), land at 0.35 where HUD and 3D model are locked; for others land at 0.50 midpoint
      const landingRatio = targetIndex === 4 ? 0.35 : 0.50;
      const targetScroll = targetTrigger.start + (targetTrigger.end - targetTrigger.start) * landingRatio;
      gsap.to(window, {
        scrollTo: { y: Math.round(targetScroll), autoKill: true },
        duration: 1.3,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
    }
  };

  return () => {
    gsap.killTweensOf(window);
    triggers.forEach((t) => t.kill());
  };
}
