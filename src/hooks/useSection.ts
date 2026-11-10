'use client'
import { useRef } from 'react'
import { useGSAP } from '@/motion/gsap'
import { fontsReady, scheduleRefresh } from '@/motion/ready'
import { useUI, selectReduced } from '@/stores/ui'

type Build = (ctx: { root: HTMLElement; reduced: boolean; q: (sel: string) => HTMLElement[] }) => void | (() => void)

/**
 * Standard section lifecycle: waits for capabilities + fonts, builds inside a
 * gsap context (auto-revert on unmount / reduced-motion change), then refreshes.
 */
export function useSection<T extends HTMLElement = HTMLElement>(build: Build) {
  const root = useRef<T>(null)
  const ready = useUI((s) => s.ready)
  const reduced = useUI(selectReduced)

  useGSAP(
    (_, contextSafe) => {
      if (!ready || !root.current || !contextSafe) return
      let cleanup: void | (() => void)
      let cancelled = false
      const run = contextSafe(() => {
        const el = root.current!
        const q = (sel: string) => Array.from(el.querySelectorAll<HTMLElement>(sel))
        cleanup = build({ root: el, reduced, q })
        scheduleRefresh()
      })
      fontsReady().then(() => !cancelled && run())
      return () => {
        cancelled = true
        if (typeof cleanup === 'function') cleanup()
      }
    },
    { dependencies: [ready, reduced], scope: root, revertOnUpdate: true },
  )
  return root
}
