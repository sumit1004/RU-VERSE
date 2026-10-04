export function getQuality() {
  const mobile = window.matchMedia('(max-width: 768px)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  const tier = reducedMotion || memory <= 2 || cores <= 2 ? 'low' : mobile || memory < 6 ? 'medium' : 'high';

  const settings = {
    high: { dpr: [1, 1.5], stars: 4200 },
    medium: { dpr: [1, 1.25], stars: 2400 },
    low: { dpr: [1, 1.0], stars: 1200 }
  }[tier];

  return { tier, mobile, reducedMotion, ...settings };
}
