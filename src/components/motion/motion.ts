// Shared motion settings. DESIGN.md "Motion": colour and opacity changes take 180ms,
// scroll reveals use one soft ease out, and everything respects reduced motion
// (MotionConfig reducedMotion="user" in App.tsx turns movement off for those visitors).
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const REVEAL_DURATION = 0.7;
export const REVEAL_DISTANCE = 28;
export const STAGGER = 0.07;
