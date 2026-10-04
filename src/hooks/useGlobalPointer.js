import { useEffect, useRef } from 'react';

// Centralized pointer singleton
const pointerState = {
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
  isTouch: false,
};

function handleMove(clientX, clientY) {
  const x = (clientX / window.innerWidth) * 2 - 1;
  const y = -(clientY / window.innerHeight) * 2 + 1;
  pointerState.targetX = THREE_CLAMP(x, -1, 1);
  pointerState.targetY = THREE_CLAMP(y, -1, 1);
}

function THREE_CLAMP(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

if (typeof window !== 'undefined') {
  const onPointer = (e) => handleMove(e.clientX, e.clientY);
  const onTouch = (e) => {
    if (e.touches && e.touches[0]) {
      pointerState.isTouch = true;
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('mousemove', onPointer, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
}

export function useGlobalPointer() {
  const stateRef = useRef(pointerState);
  return stateRef.current;
}

export function updateSmoothedPointer(damping = 0.05) {
  pointerState.currentX += (pointerState.targetX - pointerState.currentX) * damping;
  pointerState.currentY += (pointerState.targetY - pointerState.currentY) * damping;
  return pointerState;
}
