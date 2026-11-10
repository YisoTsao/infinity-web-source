'use client'
import { gsap, ScrollTrigger, SplitText } from '@/motion/gsap'
import { MQ } from '@/motion/ready'
import { useSection } from '@/hooks/useSection'

const LINES = [
  { pre: 'Nothing here has a', key: 'last', post: 'page.', zh: '這裡沒有最後一頁。' },
  { pre: 'Every surface is the', key: 'same', post: 'surface.', zh: '每一個面，都是同一個面。' },
  { pre: 'Scroll is a', key: 'loop,', post: 'not a line.', zh: '捲動是一個環，不是一條線。' },
]

/**
 * 01 MANIFESTO — pinned kinetic typography.
 * Word-by-word scrub (opacity + variable font weight), keyword scramble, line masks.
 */
export function Manifesto() {
  const root = useSection<HTMLElement>(({ root, reduced, q }) => {
    const lines = q('[data-line]')
    const splits = lines.map((l) => SplitText.create(l.querySelector('[data-words]'), { type: 'words', wordsClass: 'mw' }))
    if (reduced) return () => splits.forEach((s) => s.revert())

    const mm = gsap.matchMedia()
    mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (ctx) => {
      const isDesk = ctx.conditions!.desktop
      gsap.set(lines.slice(1), { yPercent: 100, autoAlpha: 0 })
      splits.forEach((s) => gsap.set(s.words, { opacity: 0.14, '--wght': 400 }))
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: isDesk ? '+=300%' : '+=200%', pin: true, scrub: 0.8, anticipatePin: 1 },
      })
      splits.forEach((s, i) => {
        const at = i * 1
        tl.to(s.words, { opacity: 1, '--wght': 800, stagger: 0.08, duration: 0.3 }, at)
        const key = lines[i].querySelector<HTMLElement>('[data-key]')!
        tl.call(() => {
          gsap.to(key, { duration: 0.6, scrambleText: { text: key.dataset.text!, chars: '∞°01', speed: 0.7 }, overwrite: true })
        }, [], at + 0.35)
        tl.fromTo(lines[i].querySelector('[data-zh]'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.2 }, at + 0.4)
        if (i < splits.length - 1) {
          tl.to(lines[i], { yPercent: -100, autoAlpha: 0, duration: 0.25 }, at + 0.75)
          tl.to(lines[i + 1], { yPercent: 0, autoAlpha: 1, duration: 0.25 }, at + 0.8)
        }
      })
      // background index rotates like a dial
      tl.fromTo(q('[data-dial]'), { rotate: -30 }, { rotate: 30, duration: tl.duration() }, 0)
      tl.fromTo(q('[data-progress]'), { scaleX: 0 }, { scaleX: 1, duration: tl.duration() }, 0)
    })
    return () => {
      mm.revert()
      splits.forEach((s) => s.revert())
      ScrollTrigger.refresh()
    }
  })

  return (
    <section
      ref={root}
      id="manifesto"
      data-angle-start="30"
      data-angle-end="60"
      data-angle-label="Manifesto"
      aria-labelledby="manifesto-title"
      className="manifesto relative h-svh overflow-hidden bg-bone text-ink"
    >
      <h2 id="manifesto-title" className="sr-only">
        Manifesto
      </h2>
      <div aria-hidden data-dial className="pointer-events-none absolute left-1/2 top-1/2 -ml-[45vmin] -mt-[45vmin] size-[90vmin] rounded-full border border-ink/10">
        {Array.from({ length: 36 }, (_, i) => (
          <span key={i} className="absolute left-1/2 top-0 h-full w-px origin-center" style={{ transform: `rotate(${i * 10}deg)` }}>
            <span className={`block w-px bg-ink/25 ${i % 9 === 0 ? 'h-6' : 'h-2'}`} />
          </span>
        ))}
      </div>
      <p className="meta frame-x absolute top-24 text-fog-bone md:top-28">N°01 — Manifesto</p>
      <div className="frame-x absolute inset-0 grid place-items-center">
        {LINES.map((l, i) => (
          <div key={i} data-line className="col-start-1 row-start-1 w-full max-w-[min(92vw,1180px)] text-center">
            <p data-words className="display manifesto__words">
              {l.pre}{' '}
              <em data-key data-text={l.key} className="emotive text-[1.05em]">
                {l.key}
              </em>{' '}
              {l.post}
            </p>
            <p data-zh className="zh mt-6 text-fog-bone">{l.zh}</p>
          </div>
        ))}
      </div>
      <div className="frame-x absolute inset-x-0 bottom-20 md:bottom-24">
        <div className="h-px w-full bg-ink/15">
          <div data-progress className="h-px origin-left bg-ink" />
        </div>
      </div>
    </section>
  )
}
