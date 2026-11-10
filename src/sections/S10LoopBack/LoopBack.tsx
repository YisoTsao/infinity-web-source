'use client'
import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/motion/gsap'
import { pointer } from '@/motion/pointer'
import { useUI, selectReduced } from '@/stores/ui'
import { useSection } from '@/hooks/useSection'
import { lemniscatePath } from '@/lib/lemniscate'
import { Magnetic } from '@/components/motion/Magnetic'

const ROWS = ["LET'S", 'MAKE IT', 'LAST']
const LOOP = lemniscatePath(300, 120)

/** Cursor-proximity variable font: each glyph's weight and scale follow distance to the pointer. */
function KineticGrid() {
  const root = useRef<HTMLDivElement>(null)
  const enabled = useUI((s) => s.finePointer && !selectReduced(s))
  useGSAP(
    () => {
      if (!enabled || !root.current) return
      const chars = Array.from(root.current.querySelectorAll<HTMLElement>('[data-k]'))
      let rects: DOMRect[] = []
      const measure = () => (rects = chars.map((c) => c.getBoundingClientRect()))
      let visible = false
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting
        if (visible) measure()
      })
      io.observe(root.current)
      ScrollTrigger.create({ trigger: root.current, start: 'top bottom', end: 'bottom top', onUpdate: measure })
      window.addEventListener('resize', measure)
      const setW = chars.map((c) => gsap.quickTo(c, '--wght', { duration: 0.5, ease: 'power3.out' }))
      const setS = chars.map((c) => gsap.quickTo(c, 'scaleY', { duration: 0.5, ease: 'power3.out' }))
      const tick = () => {
        if (!visible) return
        rects.forEach((r, i) => {
          const dx = pointer.x - (r.left + r.width / 2)
          const dy = pointer.y - (r.top + r.height / 2)
          const t = gsap.utils.clamp(0, 1, 1 - Math.hypot(dx, dy) / 420)
          setW[i](400 + t * 400)
          setS[i](0.9 + t * 0.25)
        })
      }
      gsap.ticker.add(tick)
      return () => {
        gsap.ticker.remove(tick)
        io.disconnect()
        window.removeEventListener('resize', measure)
      }
    },
    { dependencies: [enabled], scope: root },
  )
  return (
    <div ref={root} aria-label="Let's make it last" role="heading" aria-level={2} className="kinetic-grid select-none">
      {ROWS.map((row) => (
        <div key={row} aria-hidden className="flex justify-between">
          {row.split('').map((ch, i) => (
            <span key={i} data-k className="kinetic-char inline-block origin-bottom">
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * 09 LOOP BACK — interactive CTA + the runway that closes the loop:
 * the ∞ re-draws to exactly the hero loader frame, then the page jumps to 0° and the hero re-assembles.
 */
export function LoopBack() {
  const lap = useUI((s) => s.lap)
  const reducedNow = useUI(selectReduced)
  const runway = useSection<HTMLElement>(({ root, reduced, q }) => {
    if (reduced) return
    const path = q('[data-r-path]')[0] as unknown as SVGPathElement
    const len = path.getTotalLength()
    let locked = false
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.4,
        onUpdate: (self) => {
          if (!locked && self.progress > 0.985 && self.direction === 1) {
            locked = true
            window.dispatchEvent(new CustomEvent('iw:loop'))
            gsap.delayedCall(1.5, () => (locked = false))
          }
        },
      },
    })
    tl.fromTo(q('[data-r-copy]'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 0.2)
      .fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.6 }, 0.15)
      .fromTo(q('[data-r-svg]'), { scale: 3.2, rotate: -20 }, { scale: 1, rotate: 0, duration: 0.75, ease: 'power2.out' }, 0)
      .fromTo(q('[data-r-count]'), { textContent: 330 }, { textContent: 360, snap: { textContent: 1 }, duration: 0.85 }, 0.1)
  })

  return (
    <>
      <section
        id="contact"
        data-angle-start="330"
        data-angle-end="345"
        data-angle-label="Loop Back"
        aria-labelledby="contact-title"
        className="relative overflow-hidden bg-ink py-28 text-bone"
      >
        <div className="frame-x">
          <p id="contact-title" className="meta mb-10 text-fog-ink">
            N°09 — Loop back · Start a project
          </p>
          <KineticGrid />
          <div className="mt-16 flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
            <div className="max-w-[36ch]">
              <p className="title">
                Got something that should <em className="emotive">never</em> end?
              </p>
              <p className="zh mt-4 text-fog-ink">有一個不該結束的點子？讓它成為下一圈的起點。</p>
            </div>
            <Magnetic strength={0.4} padding={40}>
              <a href="mailto:hello@infinity.example" className="cta-btn group relative grid size-44 place-items-center rounded-full bg-signal text-ink md:size-56">
                <span className="font-display text-lg font-bold">
                  Start a loop <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </span>
              </a>
            </Magnetic>
          </div>
          <footer className="meta mt-28 grid grid-cols-2 gap-6 border-t border-bone/15 pt-6 text-fog-ink md:grid-cols-4">
            <span>© ∞ Infinity Studio</span>
            <span>Lap {String(lap).padStart(2, '0')}</span>
            <a href="#origin" className="nav-link w-fit">Back to 0° ↑</a>
            <span className="md:text-right">Made with one surface</span>
          </footer>
        </div>
      </section>

      <section
        ref={runway}
        id="runway"
        data-angle-start="345"
        data-angle-end="360"
        data-angle-label="Loop Back"
        aria-label="Loop back to the beginning"
        className={`relative bg-ink text-bone ${reducedNow ? 'py-24' : 'h-[220svh]'}`}
      >
        <div className={reducedNow ? 'frame-x text-center' : 'sticky top-0 grid h-svh place-items-center overflow-hidden'}>
          {!reducedNow && (
            <>
              <svg data-r-svg viewBox="0 0 300 120" className="w-[min(60vw,300px)] overflow-visible" aria-hidden>
                <path data-r-path d={LOOP} fill="none" stroke="var(--color-bone)" strokeWidth="1" />
              </svg>
              <p data-r-copy className="title absolute inset-x-0 top-[22%] text-center">
                Keep scrolling — <em className="emotive">it loops</em>.
              </p>
              <p className="meta absolute bottom-8 left-1/2 -translate-x-1/2 tabular-nums">
                [ <span data-r-count>330</span>° ]
              </p>
            </>
          )}
          {reducedNow && (
            <a href="#origin" className="title nav-link">
              Return to 0° ↑
            </a>
          )}
        </div>
      </section>
    </>
  )
}
