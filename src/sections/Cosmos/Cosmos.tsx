'use client'
import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { gsap, ScrollTrigger, SplitText } from '@/motion/gsap'
import { getLenis } from '@/motion/lenis'
import { useSection } from '@/hooks/useSection'
import { useUI } from '@/stores/ui'
import { cosmosState } from '@/stores/cosmos'
import { CHAPTERS } from '@/content/cosmos'
import { TRANSFER, N_CH, chapterAt } from '@/gl/cosmos/shots'

const CosmosScene = dynamic(() => import('@/gl/cosmos/CosmosScene'), { ssr: false })

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * ORBIT ∞ — an endless scroll through the solar system.
 * The track only provides scroll distance; everything visible is fixed: WebGL behind,
 * chapter typography + instruments in front. The last frame (warp → white) is the first.
 */
export function Cosmos() {
  const ready = useUI((s) => s.ready)
  const intro = useRef<HTMLDivElement>(null)

  const root = useSection<HTMLDivElement>(({ reduced, q }) => {
    const track = q('[data-track]')[0]
    const panels = q('[data-panel]')
    const splits = panels.map((p) => SplitText.create(p.querySelector('[data-name]'), { type: 'chars', mask: 'chars', charsClass: 'ch' }))
    const flash = q('[data-flash]')[0]
    const lapEl = q('[data-lap]')[0]
    const chEl = q('[data-ch]')[0]
    const auEl = q('[data-au]')[0]
    const velEl = q('[data-vel]')[0]
    const ticks = q('[data-tick]')
    const bar = q('[data-bar]')[0]

    // ── master scrub: one timeline unit per chapter ─────────────────────
    gsap.set(panels.slice(1), { autoAlpha: 0 })
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reduced ? true : 0.5,
        onUpdate: (self) => {
          cosmosState.target = self.progress
        },
      },
    })
    panels.forEach((panel, i) => {
      const chars = splits[i].chars
      const rest = panel.querySelectorAll('[data-rise]')
      const enter = i === 0 ? 0 : i + TRANSFER - 0.04
      const exit = i === N_CH - 1 ? i + 0.72 : i + 0.88
      if (i > 0) {
        tl.set(panel, { autoAlpha: 1 }, enter)
        tl.fromTo(chars, { yPercent: 110 }, { yPercent: 0, stagger: 0.012, duration: 0.16, ease: 'power3.out' }, enter)
        tl.fromTo(rest, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.02, duration: 0.12, ease: 'power2.out' }, enter + 0.06)
      }
      tl.to(chars, { yPercent: -110, stagger: 0.008, duration: 0.1, ease: 'power2.in' }, exit)
      tl.to(rest, { autoAlpha: 0, duration: 0.06 }, exit)
      tl.set(panel, { autoAlpha: 0 }, exit + 0.12)
    })
    // white-out at the end of the warp: the last frame equals the first
    tl.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.in' }, N_CH - 0.22)
    tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: N_CH }, 0)
    tl.set({}, {}, N_CH)

    // ── intro: drop out of warp ─────────────────────────────────────────
    const dropIn = (white: boolean) => {
      const el = intro.current!
      gsap.killTweensOf(cosmosState, 'warp')
      if (reduced) {
        cosmosState.warp = 0
        gsap.set(el, { opacity: 0 })
        return
      }
      gsap.set(el, { opacity: 1, backgroundColor: white ? '#f4f1ea' : '#020205' })
      gsap.to(el, { opacity: 0, duration: white ? 1.1 : 1.6, ease: 'power2.out', delay: white ? 0.05 : 0.2 })
      gsap.fromTo(cosmosState, { warp: 1 }, { warp: 0, duration: 2.6, ease: 'expo.out' })
    }
    dropIn(false)

    // ── loop + instruments (textContent only, one ticker) ───────────────
    let lap = 1
    let locked = false
    let lastCh = -1
    let lastAu = ''
    let lastVel = ''
    const loop = () => {
      locked = true
      lap += 1
      lapEl.textContent = pad(lap)
      cosmosState.target = 0
      cosmosState.snap = true
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
      else window.scrollTo(0, 0)
      ScrollTrigger.update()
      dropIn(true)
      gsap.delayedCall(1.2, () => (locked = false))
    }
    const scramble = (i: number) => {
      panels[i].querySelectorAll<HTMLElement>('[data-scramble]').forEach((el, k) => {
        if (reduced) return
        gsap.to(el, { duration: 0.8, delay: k * 0.08, scrambleText: { text: el.dataset.scramble!, chars: '0123456789.°', speed: 0.7 }, overwrite: true })
      })
    }
    const tick = () => {
      const p = cosmosState.target
      if (!locked && p > 0.997) loop()
      const { index, local } = chapterAt(p)
      if (index !== lastCh) {
        if (lastCh >= 0) ticks[lastCh]?.classList.remove('is-on')
        ticks[index]?.classList.add('is-on')
        chEl.textContent = `${pad(index + 1)} / ${pad(N_CH)}`
        if (index > 0) gsap.delayedCall(0.35, scramble, [index])
        lastCh = index
      }
      const cur = CHAPTERS[index].au
      const prev = CHAPTERS[Math.max(index - 1, 0)].au
      const au = index === 0 || local >= TRANSFER ? cur : prev + (cur - prev) * (local / TRANSFER)
      const auTxt = au.toFixed(2).padStart(5, '0')
      if (auTxt !== lastAu) auEl.textContent = lastAu = auTxt
      const velTxt = Math.min(cosmosState.speed / 260 + cosmosState.warp * 9.97, 9.97).toFixed(2)
      if (velTxt !== lastVel) velEl.textContent = lastVel = velTxt
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      gsap.killTweensOf(cosmosState)
      splits.forEach((s) => s.revert())
      Object.assign(cosmosState, { target: 0, progress: 0, warp: 0, speed: 0, snap: true })
    }
  })

  return (
    <div ref={root} className="cosmos">
      {ready && <CosmosScene />}

      {/* scroll distance only */}
      <div data-track className="cosmos-track" aria-hidden />

      <div className="pointer-events-none fixed inset-0 z-10 text-bone">
        {CHAPTERS.map((c, i) => (
          <section key={c.id} data-panel aria-labelledby={`cos-${c.id}`} className="cosmos-panel frame-x">
            <div className="cosmos-panel__data">
              <dl className="grid gap-y-2">
                {c.data.map(([k, val]) => (
                  <div key={k} data-rise className="flex items-baseline justify-end gap-4">
                    <dt className="meta text-fog-ink">{k}</dt>
                    <dd className="meta min-w-[13ch] text-right tabular-nums" data-scramble={val}>
                      {val}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="cosmos-panel__main">
              <p data-rise className="meta mb-3 flex gap-4 text-fog-ink">
                <span className="text-signal">N°{pad(i + 1)}</span>
                <span>{c.id === 'launch' ? 'Deep space — one lap' : `${c.au.toFixed(2)} AU from the Sun`}</span>
              </p>
              <h2 id={`cos-${c.id}`} className="cosmos-name" style={{ '--len': c.name.length } as React.CSSProperties} aria-label={`${c.name} — ${c.emotive}`}>
                <span data-name aria-hidden className="block">
                  {c.name}
                </span>
              </h2>
              <p data-rise aria-hidden className="emotive cosmos-emotive">
                {c.emotive}
              </p>
              <div data-rise className="mt-4 max-w-[46ch] md:mt-6">
                <p className="text-[clamp(0.95rem,1.05vw,1.15rem)] leading-snug">{c.note}</p>
                <p className="zh mt-1 text-fog-ink">{c.zh}</p>
              </div>
            </div>
          </section>
        ))}

        {/* instruments */}
        <div className="cosmos-hud frame-x">
          <p className="meta flex gap-4">
            <span>
              Orbit <span data-lap className="text-signal">01</span>
            </span>
            <span className="text-fog-ink">
              CH <span data-ch>01 / {pad(N_CH)}</span>
            </span>
          </p>
          <p className="meta mt-1 flex gap-4 text-fog-ink">
            <span>
              DIST <span data-au className="tabular-nums text-bone">40.00</span> AU
            </span>
            <span>
              V <span data-vel className="tabular-nums text-bone">0.00</span> c
            </span>
          </p>
        </div>
        <div className="cosmos-rail frame-x" aria-hidden>
          <div className="relative h-px w-full bg-bone/15">
            <div data-bar className="absolute inset-0 origin-left bg-signal" />
          </div>
          <ol className="mt-2 flex justify-between">
            {CHAPTERS.map((c) => (
              <li key={c.id} data-tick className="cosmos-tick meta">
                {c.id === 'launch' ? '∞' : c.id === 'warp' ? '»' : c.name.replace('THE ', '').slice(0, 3)}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div data-flash aria-hidden className="pointer-events-none fixed inset-0 z-20 bg-[#f4f1ea] opacity-0" />
      <div ref={intro} aria-hidden className="cosmos-intro pointer-events-none fixed inset-0 z-20 bg-[#020205]" />
      <p className="sr-only">
        A scroll-driven flight through the solar system: the Sun, Mercury, Venus, Earth and the Moon, Mars, the asteroid belt,
        Jupiter, Saturn, Uranus, Neptune and Pluto, then a warp jump back to the start. Scrolling continues forever.
      </p>
    </div>
  )
}
