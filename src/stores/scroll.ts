/**
 * Per-frame scroll values live in a plain mutable object (never React state)
 * so readers in gsap.ticker / useFrame never trigger re-renders.
 */
export const scrollState = {
  scroll: 0,
  progress: 0,
  velocity: 0,
  direction: 1 as 1 | -1,
}

/** Hero-local shared values read by the WebGL scene. */
export const heroState = {
  assemble: 0, // 0 → 1 particle assembly (entrance timeline)
  exit: 0, // 0 → 1 scroll-driven exit
  visible: true,
}

/** Section 05 FORMS: 0..3 morph index between strip / sphere / knot / ∞. */
export const formsState = { shape: 0, spin: 0 }

/** Section 06 INSIDE: scroll progress, morph, light mix. */
export const insideState = { progress: 0, morph: 0, light: 0 }
