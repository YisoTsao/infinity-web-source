'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { scroll as scrollCfg } from '@/motion/config'
import { setLenis } from '@/motion/lenis'
import { scrollState } from '@/stores/scroll'
import { useUI, selectReduced } from '@/stores/ui'
import { clamp } from '@/lib/math'

/**
 * Lenis ⇄ ScrollTrigger sync with a single rAF source (gsap.ticker).
 * Reduced motion → native scroll, ScrollTrigger still works.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const ready = useUI((s) => s.ready)
  const reduced = useUI(selectReduced)

  useEffect(() => {
    if (!ready) return
    let lenis: Lenis | null = null
    let lastScroll = window.scrollY

    const decay = () => {
      scrollState.velocity *= scrollCfg.velocityDecay
      if (Math.abs(scrollState.velocity) < 0.01) scrollState.velocity = 0
    }

    const onNative = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const v = y - lastScroll
      lastScroll = y
      scrollState.scroll = y
      scrollState.progress = max > 0 ? y / max : 0
      if (v !== 0) scrollState.direction = v > 0 ? 1 : -1
      scrollState.velocity = clamp(v, -scrollCfg.velocityClamp, scrollCfg.velocityClamp)
    }

    let tick: ((time: number) => void) | null = null

    if (reduced) {
      window.addEventListener('scroll', onNative, { passive: true })
    } else {
      lenis = new Lenis({ ...scrollCfg.lenis, autoRaf: false })
      setLenis(lenis)
      lenis.on('scroll', (l: Lenis) => {
        ScrollTrigger.update()
        scrollState.scroll = l.scroll
        scrollState.progress = l.progress
        if (l.direction) scrollState.direction = l.direction as 1 | -1
        scrollState.velocity = clamp(l.velocity, -scrollCfg.velocityClamp, scrollCfg.velocityClamp)
      })
      tick = (time: number) => lenis!.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }
    gsap.ticker.add(decay)

    // refresh strategy: fonts + layout height changes
    let raf = 0
    const refresh = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    }
    document.fonts?.ready.then(refresh)
    const ro = new ResizeObserver(refresh)
    const main = document.getElementById('content')
    if (main) ro.observe(main)

    // freeze page scroll while the full-screen menu is open
    const unsubMenu = useUI.subscribe((st, prev) => {
      if (st.menuOpen === prev.menuOpen) return
      if (st.menuOpen) lenis?.stop()
      else lenis?.start()
    })

    return () => {
      unsubMenu()
      window.removeEventListener('scroll', onNative)
      if (tick) gsap.ticker.remove(tick)
      gsap.ticker.remove(decay)
      ro.disconnect()
      cancelAnimationFrame(raf)
      lenis?.destroy()
      setLenis(null)
    }
  }, [ready, reduced])

  return <>{children}</>
}
