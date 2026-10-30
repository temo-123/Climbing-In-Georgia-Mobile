import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Mirrors the website's `prefers-reduced-motion` rule: every decorative
// animation (sketch sway, skeleton shimmer…) turns off when the OS asks.
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => { mounted = false; sub?.remove(); };
  }, []);
  return reduce;
}
