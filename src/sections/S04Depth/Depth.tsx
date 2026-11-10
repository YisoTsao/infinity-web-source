'use client'
import Image from 'next/image'
import { gsap, SplitText } from '@/motion/gsap'
import { MQ } from '@/motion/ready'
import { pointer } from '@/motion/pointer'
import { useSection } from '@/hooks/useSection'
import { allImages } from '@/content/projects'

// x/y in % of stage, w in vw, depth: 0 = far, 1.6 = near
const LAYERS = [
  { img: 0, x: 6, y: 10, w: 16, d: 0.3 },
  { img: 3, x: 72, y: 6, w: 20, d: 0.6 },
  { img: 6, x: 80, y: 58, w: 14, d: 1.4 },
  { img: 8, x: 10, y: 62, w: 22, d: 1.0 },
  { img: 10, x: 44, y: 78, w: 11, d: 0.45 },
  { img: 2, x: 52, y: -4, w: 12, d: 1.2 },
]

/**
 * 03 DEPTH — layered parallax: scroll depth (outer layer), mouse depth (inner layer),
 * clip reveals (figure), and an image-filled text mask.
 */
export function Depth() {
  const root = useSection<HTMLElement>(({ root, reduced, q }) => {
    const lines = SplitText.create(q('[data-depth-lines]')[0], { type: 'lines', mask: 'lines', linesClass: 'ln' })
    if (reduced) return () => lines.revert()
    const mm = gsap.matchMedia()
    mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (ctx) => {
      const isDesk = ctx.conditions!.desktop
      const st = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      q('[data-layer]').forEach((el) => {
        const d = Number(el.dataset.depth)
        gsap.fromTo(el, { yPercent: 60 * d }, { yPercent: -60 * d, ease: 'none', scrollTrigger: st })
      })
      q('[data-reveal]').forEach((fig) => {
        gsap
          .timeline({ scrollTrigger: { trigger: fig, start: 'top 90%', end: 'top 35%', scrub: 0.6 } })
          .fromTo(fig, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out' }, 0)
          .fromTo(fig.querySelector('img'), { scale: 1.4 }, { scale: 1, ease: 'power2.out' }, 0)
      })
      gsap.from(lines.lines, {
        yPercent: 105,
        stagger: 0.12,
        ease: 'none',
        scrollTrigger: { trigger: q('[data-depth-lines]')[0], start: 'top 85%', end: 'top 40%', scrub: 0.6 },
      })
      // text mask: the image inside DEPTH slides against the letters
      gsap.fromTo(q('[data-mask-word]'), { backgroundPosition: '50% 0%' }, { backgroundPosition: '50% 100%', ease: 'none', scrollTrigger: st })
      gsap.fromTo(q('[data-mask-word]'), { scale: 0.86 }, { scale: 1.08, ease: 'none', scrollTrigger: st })

      if (!isDesk) return
      // mouse depth on the inner layers (separate elements from the scroll owners)
      const inners = q('[data-mouse]').map((el) => ({
        d: Number(el.dataset.depth),
        x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
        y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
      }))
      let active = false
      const io = new IntersectionObserver(([e]) => (active = e.isIntersecting))
      io.observe(root)
      const tick = () => {
        if (!active) return
        inners.forEach((m) => {
          m.x(-pointer.nx * 34 * m.d)
          m.y(pointer.ny * 26 * m.d)
        })
      }
      gsap.ticker.add(tick)
      return () => {
        gsap.ticker.remove(tick)
        io.disconnect()
      }
    })
    return () => {
      mm.revert()
      lines.revert()
    }
  })

  return (
    <section
      ref={root}
      id="depth"
      data-angle-start="100"
      data-angle-end="130"
      data-angle-label="Depth"
      aria-labelledby="depth-title"
      className="relative overflow-clip bg-ink text-bone"
    >
      <div className="relative min-h-[180svh]">
        {LAYERS.map((l, i) => (
          <div
            key={i}
            data-layer
            data-depth={l.d}
            className="absolute"
            style={{ left: `${l.x}%`, top: `${15 + l.y}%`, width: `max(${l.w}vw, 120px)`, zIndex: Math.round(l.d * 10) }}
          >
            <div data-mouse data-depth={l.d}>
              <figure data-reveal className="frame-marks relative aspect-[4/5] overflow-hidden" style={{ filter: `brightness(${0.55 + l.d * 0.3})` }}>
                <Image src={allImages[l.img]} alt="" fill sizes="(min-width: 1024px) 22vw, 40vw" className="object-cover" />
              </figure>
              <p className="meta mt-2 text-fog-ink">Z {l.d.toFixed(2)}</p>
            </div>
          </div>
        ))}

        <div className="sticky top-0 grid h-svh place-items-center">
          <div className="frame-x relative z-[8] text-center">
            <p className="meta mb-6 text-fog-ink">N°03 — Depth</p>
            <h2 id="depth-title" data-mask-word className="mask-word" style={{ backgroundImage: `url(${allImages[1]})` }}>
              DEPTH
            </h2>
            <p data-depth-lines className="title mx-auto mt-6 max-w-[22ch]">
              Distance is just a <em className="emotive">rumour</em> told by layers moving at different speeds.
            </p>
            <p className="zh mt-5 text-fog-ink">距離，只是不同速度的圖層所散佈的傳言。移動滑鼠看看。</p>
          </div>
        </div>
      </div>
    </section>
  )
}
