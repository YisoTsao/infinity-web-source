'use client'
import Image from 'next/image'
import { useRef } from 'react'
import { gsap, useGSAP } from '@/motion/gsap'
import { useUI, selectReduced } from '@/stores/ui'
import type { Project } from '@/content/projects'
import { TransitionLink } from './TransitionLink'

/**
 * Infinite image carousel: drag / wheel-x / keys, with inertia and auto-drift.
 * Each card's x is wrapped independently, so the loop has no ends and no clones.
 * Cards bend on a virtual cylinder (rotateY + z) by distance from centre.
 */
export function InfiniteCarousel({ items }: { items: Project[] }) {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useUI(selectReduced)

  useGSAP(
    () => {
      if (!root.current || reduced) return
      const el = root.current
      const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-c-card]'))
      let cw = cards[0].offsetWidth + 24
      let total = cw * cards.length
      let offset = 0
      let vel = 0
      let dragging = false
      let lastX = 0
      let moved = 0
      let visible = false
      const setters = cards.map((c) => ({
        x: gsap.quickSetter(c, 'x', 'px'),
        r: gsap.quickSetter(c, 'rotateY', 'deg'),
        z: gsap.quickSetter(c, 'z', 'px'),
      }))
      const measure = () => {
        cw = cards[0].offsetWidth + 24
        total = cw * cards.length
      }
      const ro = new ResizeObserver(measure)
      ro.observe(el)
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
      io.observe(el)

      const tick = (_: number, dtMs: number) => {
        if (!visible) return
        const dt = dtMs / 1000
        if (!dragging) {
          offset += vel * dt
          vel *= Math.pow(0.04, dt) // inertia decay
          if (Math.abs(vel) < 30) vel += (-30 - vel) * Math.min(1, dt * 0.8) // auto drift
        }
        const half = el.clientWidth / 2
        const wrap = gsap.utils.wrap(-cw, total - cw)
        cards.forEach((_, i) => {
          const x = wrap(i * cw + offset)
          const centre = x + cw / 2 - half
          const n = gsap.utils.clamp(-1.4, 1.4, centre / half)
          setters[i].x(x)
          setters[i].r(n * -28)
          setters[i].z(-Math.abs(n) * 180)
        })
      }
      gsap.ticker.add(tick)

      const down = (e: PointerEvent) => {
        dragging = true
        moved = 0
        lastX = e.clientX
        vel = 0
        el.setPointerCapture(e.pointerId)
      }
      const move = (e: PointerEvent) => {
        if (!dragging) return
        const dx = e.clientX - lastX
        lastX = e.clientX
        moved += Math.abs(dx)
        offset += dx
        vel = dx * 60
      }
      const up = () => (dragging = false)
      const click = (e: MouseEvent) => {
        if (moved > 6) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
      const wheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault()
          vel -= e.deltaX * 8
        }
      }
      const key = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') vel -= 900
        if (e.key === 'ArrowLeft') vel += 900
      }
      el.addEventListener('pointerdown', down)
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerup', up)
      el.addEventListener('pointercancel', up)
      el.addEventListener('click', click, true)
      el.addEventListener('wheel', wheel, { passive: false })
      el.addEventListener('keydown', key)
      return () => {
        gsap.ticker.remove(tick)
        ro.disconnect()
        io.disconnect()
        el.removeEventListener('pointerdown', down)
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerup', up)
        el.removeEventListener('pointercancel', up)
        el.removeEventListener('click', click, true)
        el.removeEventListener('wheel', wheel)
        el.removeEventListener('keydown', key)
      }
    },
    { dependencies: [reduced], scope: root },
  )

  return (
    <div
      ref={root}
      data-cursor="drag"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Work carousel — drag or use arrow keys"
      className={`carousel relative h-[min(62vw,460px)] select-none [perspective:1400px] ${reduced ? 'overflow-x-auto' : 'touch-pan-y overflow-hidden'}`}
    >
      <div className={reduced ? 'flex gap-6 px-[var(--frame)]' : 'absolute inset-0 [transform-style:preserve-3d]'}>
        {items.map((p, i) => (
          <TransitionLink
            key={p.slug}
            href={`/work/${p.slug}`}
            label={p.title}
            data-c-card
            draggable={false}
            className={`carousel-card group block w-[min(56vw,300px)] ${reduced ? 'shrink-0' : 'absolute left-0 top-0'}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-graphite">
              <Image src={p.image} alt={p.title} fill sizes="300px" draggable={false} className="object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <p className="mt-3 flex justify-between">
              <span className="font-display font-semibold">{p.title}</span>
              <span className="meta text-fog-ink">{String(i + 1).padStart(2, '0')}</span>
            </p>
          </TransitionLink>
        ))}
      </div>
    </div>
  )
}
