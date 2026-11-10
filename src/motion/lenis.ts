'use client'
import type Lenis from 'lenis'

let instance: Lenis | null = null
export const setLenis = (l: Lenis | null) => {
  instance = l
}
export const getLenis = () => instance

/** Scroll to target with Lenis when available, native otherwise. */
export function scrollToTarget(target: string | number | HTMLElement, opts?: { immediate?: boolean }) {
  if (instance) {
    instance.scrollTo(target, { duration: 1.6, immediate: opts?.immediate })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target })
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView()
  }
}
