'use client'
import dynamic from 'next/dynamic'
import { gsap } from '@/motion/gsap'
import { MQ } from '@/motion/ready'
import { insideState } from '@/stores/scroll'
import { useUI } from '@/stores/ui'
import { useSection } from '@/hooks/useSection'

const InsideScene = dynamic(() => import('@/gl/inside/InsideScene'), { ssr: false })

const STEPS = [
  { at: 0.05, t: 'Approach', zh: '靠近' },
  { at: 0.3, t: 'Pass through', zh: '穿過' },
  { at: 0.55, t: 'Melt', zh: '融化' },
  { at: 0.8, t: 'Reform', zh: '重組' },
]

/**
 * 06 INSIDE THE STRIP — scroll-controlled camera path, liquid morph (band ↔ sphere),
 * dynamic lighting, typography layered in front of and behind the canvas.
 */
export function Inside() {
  const ready = useUI((s) => s.ready)
  const root = useSection<HTMLElement>(({ root, reduced, q }) => {
    if (reduced) {
      insideState.progress = 0.15
      return
    }
    const mm = gsap.matchMedia()
    mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (ctx) => {
      const isDesk = ctx.conditions!.desktop
      const steps = q('[data-step]')
      gsap.set(steps, { autoAlpha: 0 })
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: isDesk ? '+=450%' : '+=300%', pin: true, scrub: 1, anticipatePin: 1 },
      })
      tl.to(insideState, { progress: 1, duration: 1 }, 0)
        .to(insideState, { morph: 1, duration: 0.25, ease: 'power2.inOut' }, 0.45)
        .to(insideState, { morph: 0, duration: 0.2, ease: 'power2.inOut' }, 0.78)
        .fromTo(insideState, { light: 0 }, { light: 1, duration: 1 }, 0)
        .fromTo(q('[data-back]'), { xPercent: 20 }, { xPercent: -40, duration: 1 }, 0)
        .fromTo(q('[data-front]'), { xPercent: -30 }, { xPercent: 30, duration: 1 }, 0)
      steps.forEach((s, i) => {
        const at = STEPS[i].at
        tl.to(s, { autoAlpha: 1, duration: 0.04 }, at).to(s, { autoAlpha: 0, duration: 0.04 }, at + 0.18)
      })
    })
    return () => {
      mm.revert()
      Object.assign(insideState, { progress: 0, morph: 0, light: 0 })
    }
  })

  return (
    <section
      ref={root}
      id="inside"
      data-angle-start="240"
      data-angle-end="270"
      data-angle-label="Inside"
      aria-labelledby="inside-title"
      className="relative h-svh overflow-hidden bg-ink text-bone"
    >
      {/* behind the canvas */}
      <p aria-hidden data-back className="mega pointer-events-none absolute left-0 top-[18%] whitespace-nowrap text-graphite">
        INSIDE THE STRIP
      </p>
      {ready && <InsideScene />}
      {/* in front of the canvas */}
      <p aria-hidden data-front className="mega word--outline pointer-events-none absolute bottom-[14%] left-0 z-10 whitespace-nowrap opacity-60">
        LIQUID · LIQUID
      </p>
      <div className="frame-x pointer-events-none absolute inset-0 z-20 flex flex-col justify-between pb-24 pt-28">
        <div>
          <p className="meta text-fog-ink">N°06 — Inside the strip · camera path</p>
          <h2 id="inside-title" className="sr-only">
            Inside the strip
          </h2>
        </div>
        <div className="relative h-20">
          {STEPS.map((s, i) => (
            <div key={s.t} data-step className="absolute bottom-0 left-0">
              <p className="meta text-signal">0{i + 1}</p>
              <p className="title">{s.t}</p>
              <p className="zh text-fog-ink">{s.zh}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
