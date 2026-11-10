'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/motion/gsap'
import { pointer } from '@/motion/pointer'
import { spring } from '@/motion/config'
import { useUI, selectReduced } from '@/stores/ui'

type CursorMode = 'default' | 'link' | 'hidden' | 'text' | 'view' | 'drag'

/**
 * Custom cursor: dot + ring, only on fine pointers with motion enabled.
 * Native cursor is never hidden on inputs / text selection (see globals.css).
 */
export function Cursor() {
  const finePointer = useUI((s) => s.finePointer)
  const reduced = useUI(selectReduced)
  const introDone = useUI((s) => s.introDone)
  const enabled = finePointer && !reduced

  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled || !dot.current || !ring.current) return
    document.documentElement.classList.add('has-cursor')
    const d = { x: pointer.x, y: pointer.y }
    const r = { x: pointer.x, y: pointer.y }
    const setDot = { x: gsap.quickSetter(dot.current, 'x', 'px'), y: gsap.quickSetter(dot.current, 'y', 'px') }
    const setRing = { x: gsap.quickSetter(ring.current, 'x', 'px'), y: gsap.quickSetter(ring.current, 'y', 'px') }
    let mode: CursorMode = 'default'

    const tick = () => {
      const k = gsap.ticker.deltaRatio()
      d.x += (pointer.x - d.x) * Math.min(1, spring.cursor * 2.2 * k)
      d.y += (pointer.y - d.y) * Math.min(1, spring.cursor * 2.2 * k)
      r.x += (pointer.x - r.x) * Math.min(1, spring.follower * 1.6 * k)
      r.y += (pointer.y - r.y) * Math.min(1, spring.follower * 1.6 * k)
      setDot.x(d.x)
      setDot.y(d.y)
      setRing.x(r.x)
      setRing.y(r.y)
    }
    gsap.ticker.add(tick)

    const setMode = (m: CursorMode) => {
      if (m === mode) return
      mode = m
      document.documentElement.dataset.cursorState = m
    }
    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      const explicit = t?.closest<HTMLElement>('[data-cursor]')?.dataset.cursor as CursorMode | undefined
      if (explicit) return setMode(explicit)
      if (t?.closest('a, button, [role="button"]')) return setMode('link')
      setMode('default')
    }
    const onLeave = () => document.documentElement.classList.add('cursor-out')
    const onEnter = () => document.documentElement.classList.remove('cursor-out')
    window.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    window.addEventListener('blur', onLeave)
    window.addEventListener('focus', onEnter)

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      window.removeEventListener('blur', onLeave)
      window.removeEventListener('focus', onEnter)
      document.documentElement.classList.remove('has-cursor', 'cursor-out')
      delete document.documentElement.dataset.cursorState
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div aria-hidden className={`cursor ${introDone ? 'is-on' : ''}`}>
      <div ref={ring} className="cursor__ring">
        <span className="cursor__ring-shape" />
      </div>
      <div ref={dot} className="cursor__dot">
        <span className="cursor__dot-shape" />
      </div>
    </div>
  )
}
