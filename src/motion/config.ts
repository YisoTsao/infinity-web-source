/** Centralized motion tokens — see docs/MOTION_SYSTEM.md §2 */
export const ease = {
  loop: 'loop', // CustomEase registered in motion/gsap.ts
  out: 'expo.out',
  inOut: 'expo.inOut',
  snap: 'back.out(1.6)',
  linear: 'none',
} as const

export const LOOP_EASE_PATH = 'M0,0 C0.7,0 0.13,1 1,1'

export const dur = { xs: 0.24, sm: 0.48, md: 0.8, lg: 1.2, xl: 1.8 } as const
export const stagger = { char: 0.018, word: 0.06, line: 0.12, item: 0.08 } as const

export const spring = {
  cursor: 0.18,
  follower: 0.08,
  magnet: { duration: 0.5, ease: 'power3.out' },
} as const

export const scroll = {
  lenis: { lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1.2 },
  velocityClamp: 40,
  velocityDecay: 0.92,
} as const

export const breakpoints = { tablet: 768, laptop: 1024, desktop: 1280 } as const

export const palette = {
  ink: '#0B0B0D',
  bone: '#ECE8DF',
  signal: '#C8FF2E',
  infra: '#FF4A1C',
  graphite: '#2A2A2E',
} as const
