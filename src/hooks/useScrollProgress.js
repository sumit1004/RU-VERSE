import { useEffect, useState } from 'react';
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => { const update = () => setProgress(window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)); update(); addEventListener('scroll', update, { passive: true }); return () => removeEventListener('scroll', update); }, []);
  return progress;
}
