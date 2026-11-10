'use client'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { MQ } from '@/motion/ready'
import { useSection } from '@/hooks/useSection'
import { lemniscatePath } from '@/lib/lemniscate'

function star(n: number, r1: number, r2: number) {
  let d = ''
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 ? r2 : r1
    d += `${i ? 'L' : 'M'}${(200 + Math.cos(a) * r).toFixed(1)},${(200 + Math.sin(a) * r).toFixed(1)}`
  }
  return d + 'Z'
}

const SHAPES = [
  'M200,60 C277,60 340,123 340,200 C340,277 277,340 200,340 C123,340 60,277 60,200 C60,123 123,60 200,60 Z',
  'M200,50 C300,120 350,150 350,200 C350,300 250,330 200,350 C100,280 50,250 50,200 C50,100 150,70 200,50 Z',
  lemniscatePath(340, 200, 80).replace(/([\d.]+),([\d.]+)/g, (_, x, y) => `${(+x + 30).toFixed(2)},${(+y + 100).toFixed(2)}`),
  star(12, 160, 70),
]

const CHAPTERS = [
  { t: 'Observe', s: 'Look', body: 'We start by watching how people move — where they pause, where they scroll faster, where they come back.', zh: '先觀察：人在哪裡停下、在哪裡加速、又在哪裡回頭。' },
  { t: 'Twist', s: 'Bend', body: 'Then we give the obvious a half turn. One small twist and a flat idea becomes a surface with only one side.', zh: '再把顯而易見的東西扭轉半圈，平面就變成只有一面的曲面。' },
  { t: 'Loop', s: 'Return', body: 'We design endings that lead back to beginnings, so every visit is the first lap of the next one.', zh: '我們設計會通往開頭的結尾，讓每次造訪都是下一圈的起點。' },
  { t: 'Release', s: 'Let go', body: 'Finally we let it run — systems that keep producing new frames long after we stop touching them.', zh: '最後放手讓它運轉：在我們停手之後，系統仍不斷生出新的畫面。' },
]

/**
 * 08 PROCESS — sticky narrative: a sticky SVG that liquid-morphs per chapter (MorphSVG),
 * typography transforming from grotesk to serif, panel colour flips.
 */
export function Process() {
  const root = useSection<HTMLElement>(({ reduced, q }) => {
    const path = q('[data-morph]')[0]
    const panel = q('[data-panel]')[0]
    const num = q('[data-p-num]')[0]
    const chapters = q('[data-chapter]')
    let current = -1
    const go = (i: number) => {
      if (i === current) return
      current = i
      gsap.to(path, { morphSVG: SHAPES[i], duration: reduced ? 0 : 1.1, ease: 'expo.inOut', overwrite: true })
      gsap.to(panel, { '--panel-bg': i % 2 ? '#ECE8DF' : '#0B0B0D', '--panel-fg': i % 2 ? '#0B0B0D' : '#ECE8DF', duration: reduced ? 0 : 0.8, ease: 'power2.inOut' })
      gsap.to(num, { duration: reduced ? 0 : 0.5, scrambleText: { text: `0${i + 1}`, chars: '0123456789', speed: 0.8 } })
    }
    chapters.forEach((c, i) => {
      ScrollTrigger.create({ trigger: c, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => self.isActive && go(i) })
    })
    go(0)
    if (reduced) return
    const mm = gsap.matchMedia()
    mm.add(MQ.desktop, () => {
      chapters.forEach((c) => {
        // grotesk → serif transformation, scrubbed through the chapter
        gsap
          .timeline({ scrollTrigger: { trigger: c, start: 'top 70%', end: 'center 40%', scrub: 0.6 } })
          .fromTo(c.querySelector('[data-sans]'), { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', ease: 'none' }, 0.3)
          .fromTo(c.querySelector('[data-serif]'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0.3)
          .from(c.querySelector('[data-body]'), { y: 40, autoAlpha: 0, ease: 'power2.out' }, 0)
      })
      gsap.to(q('[data-orbit]'), { rotate: 360, ease: 'none', scrollTrigger: { trigger: q('[data-chapters]')[0], start: 'top top', end: 'bottom bottom', scrub: 1 } })
    })
    return () => mm.revert()
  })

  return (
    <section
      ref={root}
      id="process"
      data-angle-start="300"
      data-angle-end="330"
      data-angle-label="Process"
      aria-labelledby="process-title"
      className="relative bg-bone text-ink"
    >
      <div className="grid lg:grid-cols-2">
        <div className="lg:sticky lg:top-0 lg:h-svh">
          <div data-panel className="process-panel relative grid h-[60svh] place-items-center overflow-hidden lg:h-full">
            <div data-orbit aria-hidden className="absolute size-[70%] rounded-full border border-dashed border-current opacity-20" />
            <svg viewBox="0 0 400 400" className="relative w-[min(70%,460px)]" aria-hidden>
              <path data-morph d={SHAPES[0]} fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d={SHAPES[0]} fill="none" stroke="var(--color-signal)" strokeWidth="0.8" strokeDasharray="2 8" className="opacity-60" />
            </svg>
            <p className="meta absolute left-[var(--frame)] top-24">N°08 — Process</p>
            <p data-p-num className="display absolute bottom-10 right-[var(--frame)] tabular-nums">
              01
            </p>
          </div>
        </div>
        <div data-chapters>
          <h2 id="process-title" className="sr-only">
            Process
          </h2>
          {CHAPTERS.map((c, i) => (
            <article key={c.t} data-chapter className="frame-x flex min-h-[90svh] flex-col justify-center py-24 lg:min-h-svh">
              <p className="meta mb-6 text-fog-bone">Chapter 0{i + 1}</p>
              <div className="relative">
                <h3 data-sans className="display">
                  {c.t}
                </h3>
                <p data-serif aria-hidden className="display emotive absolute inset-0 hidden lg:block" style={{ clipPath: 'inset(100% 0 0 0)' }}>
                  {c.s}
                </p>
              </div>
              <div data-body className="mt-8 max-w-[38ch]">
                <p className="text-lg leading-relaxed">{c.body}</p>
                <p className="zh mt-3 text-fog-bone">{c.zh}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
