'use client'
import { useRef } from 'react'
import { gsap, useGSAP } from '@/motion/gsap'
import { scrollState } from '@/stores/scroll'
import { useUI, selectReduced } from '@/stores/ui'

type Props = {
  children: React.ReactNode
  /** px per second */
  speed?: number
  /** 1 = left, -1 = right (on downward scroll) */
  direction?: 1 | -1
  velocityFactor?: number
  /** slow to this fraction on hover */
  hoverSlow?: number
  skew?: boolean
  className?: string
  repeat?: number
}

/**
 * Seamless, direction- & velocity-aware marquee (effects: Infinite Marquee, Multi-directional,
 * Scroll Velocity). Position is wrapped with modulo math — the tween is never reset, so no seam.
 */
export function Marquee({ children, speed = 80, direction = 1, velocityFactor = 0.06, hoverSlow = 1, skew = true, className = '', repeat = 4 }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const reduced = useUI(selectReduced)

  useGSAP(
    () => {
      if (!track.current || !root.current || reduced) return
      const el = track.current
      const unit = el.firstElementChild as HTMLElement
      let w = unit.offsetWidth
      let x = 0
      let dir = 1
      let hover = 1
      let visible = false
      const setX = gsap.quickSetter(el, 'x', 'px')
      const setSkew = skew ? gsap.quickTo(el, 'skewX', { duration: 0.4, ease: 'power3.out' }) : null
      const state = { dir: 1 }
      const wrap = () => gsap.utils.wrap(-w, 0)
      let wrapper = wrap()
      const ro = new ResizeObserver(() => {
        w = unit.offsetWidth
        wrapper = wrap()
      })
      ro.observe(unit)
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '100px' })
      io.observe(root.current)

      const tick = (_: number, dtMs: number) => {
        if (!visible) return
        const dt = dtMs / 1000
        // direction-aware: flips smoothly with scroll direction
        if (scrollState.direction !== dir) {
          dir = scrollState.direction
          gsap.to(state, { dir, duration: 0.6, ease: 'power2.inOut', overwrite: true })
        }
        const v = Math.abs(scrollState.velocity)
        const s = speed * (1 + v * velocityFactor) * hover
        x = wrapper(x - s * dt * direction * state.dir)
        setX(x)
        setSkew?.(gsap.utils.clamp(-8, 8, scrollState.velocity * -0.25 * direction))
      }
      gsap.ticker.add(tick)
      const enter = () => gsap.to({ v: hover }, { v: hoverSlow, duration: 0.5, onUpdate() { hover = this.targets()[0].v } })
      const leave = () => gsap.to({ v: hover }, { v: 1, duration: 0.8, onUpdate() { hover = this.targets()[0].v } })
      if (hoverSlow < 1) {
        root.current.addEventListener('pointerenter', enter)
        root.current.addEventListener('pointerleave', leave)
      }
      const r = root.current
      return () => {
        gsap.ticker.remove(tick)
        ro.disconnect()
        io.disconnect()
        r.removeEventListener('pointerenter', enter)
        r.removeEventListener('pointerleave', leave)
      }
    },
    { dependencies: [reduced, speed, direction], scope: root },
  )

  return (
    <div ref={root} className={`marquee overflow-hidden ${className}`}>
      <div ref={track} className="flex w-max will-change-transform">
        {Array.from({ length: repeat }, (_, i) => (
          <div key={i} className="flex shrink-0" aria-hidden={i > 0}>
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}
