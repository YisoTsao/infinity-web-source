'use client'
import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP } from '@/motion/gsap'
import { ease, stagger } from '@/motion/config'
import { pointer } from '@/motion/pointer'
import { getLenis } from '@/motion/lenis'
import { fontsReady } from '@/motion/ready'
import { heroState } from '@/stores/scroll'
import { useUI, selectReduced } from '@/stores/ui'
import { lemniscatePath } from '@/lib/lemniscate'
import { quality } from '@/gl/utils/quality'
import { ScrollIndicator } from '@/components/motion/ScrollIndicator'
import { MobiusFallback } from './MobiusFallback'

const HeroScene = dynamic(() => import('@/gl/HeroScene'), { ssr: false, loading: () => <MobiusFallback /> })

const LOADER_PATH = lemniscatePath(300, 120)
const WORD = 'INFINITY'
const SESSION_KEY = 'iw:seen'

export function Origin() {
  const root = useRef<HTMLElement>(null)
  const ready = useUI((s) => s.ready)
  const reduced = useUI(selectReduced)
  const tier = useUI((s) => s.tier)
  const lap = useUI((s) => s.lap)
  const setUI = useUI((s) => s.set)

  useGSAP(
    (_, contextSafe) => {
      if (!ready || !root.current || !contextSafe) return
      const q = gsap.utils.selector(root)
      // global (outside scope) — plain DOM query, context scope would restrict selector strings
      const navItems = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-item]'))
      const html = document.documentElement

      const build = contextSafe(() => {
        const back = SplitText.create(q('[data-word="back"]')[0], { type: 'chars', mask: 'chars', charsClass: 'ch' })
        const front = SplitText.create(q('[data-word="front"]')[0], { type: 'chars', mask: 'chars', charsClass: 'ch', aria: 'none' })
        const tagline = SplitText.create(q('[data-tagline]')[0], { type: 'words', mask: 'words', wordsClass: 'wd' })
        const allChars = [...back.chars, ...front.chars]
        const leftChars = allChars.filter((_, i) => i % WORD.length < WORD.length / 2)
        const rightChars = allChars.filter((_, i) => i % WORD.length >= WORD.length / 2)

        // ── Entrance timeline (MOTION_SYSTEM §5) ──────────────────────────
        const path = q('[data-loader-path]')[0] as unknown as SVGPathElement
        const len = path.getTotalLength()
        const counterEl = q('[data-loader-count]')[0]
        const intro = (L: number, drawLine: boolean) => {
          const counter = { v: 0 }
          const tl = gsap.timeline({ defaults: { ease: ease.out } })
          if (drawLine) {
            tl.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: L, ease: 'power2.inOut' }, 0).to(
              counter,
              { v: 360, duration: L, ease: 'power1.inOut', onUpdate: () => (counterEl.textContent = String(Math.round(counter.v)).padStart(3, '0')) },
              0,
            )
          }
          tl.to(counterEl, { duration: 0.35, scrambleText: { text: '000', chars: '0123456789', speed: 0.6 } }, L)
            .to(q('[data-loader-bg]'), { autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, L)
            .fromTo(heroState, { assemble: 0 }, { assemble: 1, duration: 1.5, ease: ease.loop }, L - 0.05)
            .to(path, { autoAlpha: 0, scale: 1.6, transformOrigin: '50% 50%', duration: 0.8, ease: ease.inOut }, L + 0.1)
            .to(q('[data-loader-meta]'), { autoAlpha: 0, duration: 0.3 }, L + 0.3)
            .set(q('[data-loader]'), { autoAlpha: 0 }, L + 0.95)
            .to(allChars, { yPercent: 0, duration: 1.1, stagger: { each: 0.045, from: 'center' } }, L + 0.3)
            .to(tagline.words, { yPercent: 0, duration: 0.9, stagger: stagger.word }, L + 0.7)
            .fromTo(q('[data-emotive]'), { rotate: -6 }, { rotate: 0, duration: 1.2, ease: ease.snap }, L + 0.9)
            .to(q('[data-intro-up]'), { yPercent: 0, duration: 0.9, stagger: 0.06 }, L + 1.0)
          return tl
        }
        const hideAll = () => {
          gsap.set(allChars, { yPercent: 110 })
          gsap.set(tagline.words, { yPercent: 110 })
          gsap.set(q('[data-intro-up]'), { yPercent: 110 })
        }

        const alreadyIntro = useUI.getState().introDone
        if (reduced || alreadyIntro) {
          heroState.assemble = 1
          gsap.set(q('[data-loader]'), { autoAlpha: 0 })
          html.classList.remove('intro-pending')
          html.classList.add('grain-on')
          setUI({ introDone: true })
        } else {
          let seen = false
          try {
            seen = sessionStorage.getItem(SESSION_KEY) === '1'
            sessionStorage.setItem(SESSION_KEY, '1')
          } catch {}
          const L = seen ? 0.55 : 0.9 // loader length
          hideAll()
          gsap.set(navItems, { yPercent: -110 })
          html.classList.remove('intro-pending')
          intro(L, true)
            .to(navItems, { yPercent: 0, duration: 0.9, stagger: 0.05 }, L + 1.1)
            .add(() => {
              html.classList.add('grain-on')
              setUI({ introDone: true })
            }, L + 1.7)
        }

        // ── Infinite loop: the runway ends on this exact loader frame, then we jump to 0° ──
        const onLoop = contextSafe(() => {
          setUI({ lap: useUI.getState().lap + 1 })
          gsap.set(q('[data-loader]'), { autoAlpha: 1 })
          gsap.set(q('[data-loader-bg]'), { autoAlpha: 1 })
          gsap.set(path, { autoAlpha: 1, scale: 1, strokeDasharray: len, strokeDashoffset: 0 })
          gsap.set(q('[data-loader-meta]'), { autoAlpha: 1 })
          counterEl.textContent = '360'
          heroState.assemble = 0
          hideAll()
          const lenis = getLenis()
          if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
          else window.scrollTo(0, 0)
          ScrollTrigger.update()
          intro(0.25, false)
        })
        window.addEventListener('iw:loop', onLoop)

        // ── Exit scrub: word tears apart, strip flies through camera ──────
        const exit = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: reduced ? true : 0.6 },
        })
        if (!reduced) {
          exit
            .to(leftChars, { xPercent: -140, stagger: { each: 0.02, from: 'end' }, duration: 0.6 }, 0)
            .to(rightChars, { xPercent: 140, stagger: { each: 0.02, from: 'start' }, duration: 0.6 }, 0)
            .to(q('[data-word-wrap]'), { letterSpacing: '0.04em', duration: 0.6 }, 0)
            .to(heroState, { exit: 1, duration: 1 }, 0)
            .to(q('[data-exit-fade]'), { yPercent: -30, autoAlpha: 0, duration: 0.35 }, 0)
            .to(q('[data-flip]'), { clipPath: 'circle(75% at 50% 50%)', duration: 0.42, ease: 'power2.in' }, 0.58)
            .fromTo(q('[data-flip-label]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.62)
            .to(q('[data-flip-label]'), { autoAlpha: 0, duration: 0.08 }, 0.9)
        } else {
          exit.to(q('[data-exit-fade]'), { autoAlpha: 0, duration: 1 }, 0.6)
          exit.set(q('[data-flip]'), { clipPath: 'circle(75% at 50% 50%)' }, 0.95)
        }

        // ── Instrument readouts (textContent only) ───────────────────────
        const px = q('[data-readout="x"]')[0]
        const py = q('[data-readout="y"]')[0]
        let lx = '', ly = ''
        const readout = () => {
          const sx = (pointer.nx >= 0 ? '+' : '') + pointer.nx.toFixed(2)
          const sy = (pointer.ny >= 0 ? '+' : '') + pointer.ny.toFixed(2)
          if (sx !== lx) px.textContent = lx = sx
          if (sy !== ly) py.textContent = ly = sy
        }
        gsap.ticker.add(readout)
        ScrollTrigger.refresh()

        return () => {
          window.removeEventListener('iw:loop', onLoop)
          gsap.ticker.remove(readout)
          back.revert()
          front.revert()
          tagline.revert()
        }
      })

      let cleanup: (() => void) | undefined
      let cancelled = false
      fontsReady().then(() => {
        if (!cancelled) cleanup = build()
      })
      return () => {
        cancelled = true
        cleanup?.()
      }
    },
    { dependencies: [ready, reduced], scope: root, revertOnUpdate: true },
  )

  return (
    <section
      ref={root}
      id="origin"
      aria-labelledby="origin-title"
      data-angle-start="0"
      data-angle-end="60"
      data-angle-label="Origin"
      className="origin relative bg-ink text-bone"
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* corner registration marks */}
        <span aria-hidden className="reg reg--tl" />
        <span aria-hidden className="reg reg--tr" />
        <span aria-hidden className="reg reg--bl" />
        <span aria-hidden className="reg reg--br" />

        {/* back word — outline, sits BEHIND the particles */}
        <div data-word-wrap className="word-layer z-0">
          <h1 id="origin-title" data-word="back" className="mega word word--outline">
            {WORD}
          </h1>
        </div>

        {/* WebGL particle Möbius */}
        <div className="absolute inset-0 z-10">{ready && <HeroScene />}</div>

        {/* front word — solid, left half only, sits IN FRONT of the particles: the strip weaves through */}
        <div data-word-wrap className="word-layer word-layer--front z-20" aria-hidden>
          <p data-word="front" className="mega word word--solid">
            {WORD.slice(0, 4)}
            <span className="invisible">{WORD.slice(4)}</span>
          </p>
        </div>

        {/* first flip: the bone side of the strip opens from the centre and hands over to S02 */}
        <div data-flip aria-hidden className="absolute inset-0 z-30 bg-bone" style={{ clipPath: 'circle(0% at 50% 50%)' }}>
          <span className="meta absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" data-flip-label>
            [ 060° ] — the other side
          </span>
        </div>

        {/* top-left: section index */}
        <div data-exit-fade className="frame-x absolute inset-x-0 top-20 z-20 flex justify-between md:top-28">
          <div className="mask">
            <p data-intro-up className="meta text-fog-ink">
              N°00 — Origin{lap > 1 ? ` · Lap ${String(lap).padStart(2, '0')}` : ''}
              <br />
              <span className="text-bone">A studio for things that never end</span>
            </p>
          </div>
          <div className="mask hidden text-right md:block">
            <p data-intro-up className="meta text-fog-ink">
              Particles {quality[tier].particles.toLocaleString('en-US')}
              <br />
              Surfaces <span className="text-bone">1</span> · Edges <span className="text-bone">1</span>
            </p>
          </div>
        </div>

        {/* bottom-left: tagline */}
        <div data-exit-fade className="frame-x absolute inset-x-0 bottom-16 z-20 flex items-end justify-between gap-6 md:bottom-24">
          <div className="max-w-[34rem]">
            <p data-tagline className="title">
              We build things that{' '}
              <em data-emotive className="emotive inline-block">
                never
              </em>{' '}
              end.
            </p>
            <div className="mask mt-4">
              <p data-intro-up className="zh text-fog-ink">一個為「沒有盡頭的事物」而存在的實驗性數位工作室。</p>
            </div>
          </div>
          <div className="flex items-end gap-8">
            <div className="mask hidden lg:block">
              <p data-intro-up className="meta tabular-nums text-fog-ink">
                X <span data-readout="x" className="text-bone">+0.00</span>
                <br />Y <span data-readout="y" className="text-bone">+0.00</span>
              </p>
            </div>
            <div className="mask p-2">
              <div data-intro-up>
                <ScrollIndicator target="#manifesto" />
              </div>
            </div>
          </div>
        </div>

        {/* loader (first paint covers the stage; no flash of un-animated content) */}
        <div data-loader className="absolute inset-0 z-50 grid place-items-center" aria-hidden>
          <div data-loader-bg className="absolute inset-0 bg-ink" />
          <svg viewBox="0 0 300 120" className="relative w-[min(60vw,300px)] overflow-visible">
            <path data-loader-path d={LOADER_PATH} fill="none" stroke="var(--color-bone)" strokeWidth="1" />
          </svg>
          <p data-loader-meta className="meta absolute bottom-8 left-1/2 -translate-x-1/2 tabular-nums text-bone">
            [ <span data-loader-count>000</span>° ]
          </p>
        </div>
      </div>
    </section>
  )
}
