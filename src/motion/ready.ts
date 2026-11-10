'use client'
import { ScrollTrigger } from './gsap'

/**
 * One shared promise: every section awaits the same fonts.ready, so their
 * ScrollTriggers are created in DOM (mount) order — pins stack correctly.
 */
let fonts: Promise<void> | null = null
export function fontsReady() {
  if (!fonts) fonts = typeof document === 'undefined' ? Promise.resolve() : document.fonts.ready.then(() => undefined)
  return fonts
}

let raf = 0
/** Debounced sort + refresh after sections create triggers asynchronously. */
export function scheduleRefresh() {
  if (typeof window === 'undefined') return
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
  })
}

export const MQ = {
  desktop: '(min-width: 1024px)',
  mobile: '(max-width: 1023px)',
} as const
