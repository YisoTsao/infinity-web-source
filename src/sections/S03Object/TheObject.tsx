'use client'
import { gsap, ScrollTrigger, SplitText } from '@/motion/gsap'
import { MQ } from '@/motion/ready'
import { useSection } from '@/hooks/useSection'
import { ImageSequence } from './ImageSequence'

const FRAMES = 96
const URLS = Array.from({ length: FRAMES }, (_, i) => `/sequence/f${String(i).padStart(3, '0')}.jpg`)

const CALLOUTS = [
  { k: 'One surface.', spec: 'Non-orientable · χ = 0', zh: '只有一個面。', side: 'left' },
  { k: 'One edge.', spec: 'Boundary ≅ S¹', zh: '只有一條邊。', side: 'right' },
  { k: 'Zero ends.', spec: '360° · 720° · ∞', zh: '沒有任何終點。', side: 'left' },
  { k: 'Infinite paths.', spec: 'Cut it in half — it stays whole', zh: '從中間剪開，它仍然是一個整體。', side: 'right' },
] as const

/**
 * 02 THE OBJECT — Apple-style scroll-driven image sequence (96 pre-rendered frames),
 * pinned with timed callouts and a title mask reveal.
 */
export function TheObject() {
  const root = useSection<HTMLElement>(({ root, reduced, q }) => {
    const canvas = q('canvas')[0] as HTMLCanvasElement
    const seq = new ImageSequence(canvas, URLS)
    const frame = { v: 0 }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && seq.start(), { rootMargin: '150% 0px' })
    io.observe(root)
    const onResize = () => seq.resize()
    window.addEventListener('resize', onResize)
    const title = SplitText.create(q('[data-title]')[0], { type: 'words,chars', mask: 'chars', charsClass: 'ch' })

    if (reduced) {
      seq.start().then(() => seq.draw(FRAMES / 2))
      return () => {
        io.disconnect()
        window.removeEventListener('resize', onResize)
        title.revert()
      }
    }

    const mm = gsap.matchMedia()
    mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (ctx) => {
      const isDesk = ctx.conditions!.desktop
      const callouts = q('[data-callout]')
      gsap.set(callouts, { autoAlpha: 0, y: 40 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: isDesk ? '+=400%' : '+=280%', pin: true, scrub: 0.5, anticipatePin: 1 },
      })
      tl.to(frame, { v: FRAMES - 1, duration: 10, onUpdate: () => seq.draw(frame.v) }, 0)
        .fromTo(canvas, { scale: 1.18 }, { scale: 1, duration: 2.5, ease: 'power2.out' }, 0)
        .from(title.chars, { yPercent: 110, stagger: 0.05, duration: 0.8, ease: 'expo.out' }, 0)
        .to(q('[data-title-wrap]'), { autoAlpha: 0, yPercent: -40, duration: 1 }, 1.6)
      callouts.forEach((c, i) => {
        const at = 2 + i * 2
        tl.to(c, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, at).to(c, { autoAlpha: 0, y: -40, duration: 0.5, ease: 'power2.in' }, at + 1.4)
      })
      tl.fromTo(q('[data-seq-progress]'), { scaleY: 0 }, { scaleY: 1, duration: 10 }, 0)
    })
    return () => {
      mm.revert()
      io.disconnect()
      window.removeEventListener('resize', onResize)
      title.revert()
      ScrollTrigger.refresh()
    }
  })

  return (
    <section
      ref={root}
      id="object"
      data-angle-start="60"
      data-angle-end="100"
      data-angle-label="The Object"
      aria-labelledby="object-title"
      className="relative h-svh overflow-hidden bg-ink text-bone"
    >
      <canvas aria-hidden className="absolute inset-0 size-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(11,11,13,0.7)_100%)]" />

      <div data-title-wrap className="frame-x absolute inset-x-0 top-28 text-center md:top-32">
        <p className="meta mb-4 text-fog-ink">N°02 — The Object · 96 frames</p>
        <h2 id="object-title" data-title className="display">
          The Object
        </h2>
      </div>

      {CALLOUTS.map((c) => (
        <div
          key={c.k}
          data-callout
          className={`frame-x absolute inset-x-0 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2 ${c.side === 'right' ? 'md:text-right' : ''}`}
        >
          <div className={`max-w-md ${c.side === 'right' ? 'md:ml-auto' : ''}`}>
            <p className="title">{c.k}</p>
            <p className="meta mt-3 text-signal">{c.spec}</p>
            <p className="zh mt-2 text-fog-ink">{c.zh}</p>
          </div>
        </div>
      ))}

      <div aria-hidden className="absolute right-[var(--frame)] top-1/2 hidden h-40 w-px -translate-y-1/2 bg-bone/15 md:block">
        <div data-seq-progress className="h-full w-px origin-top bg-signal" />
      </div>
    </section>
  )
}
