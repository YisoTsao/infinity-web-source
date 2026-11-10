'use client'
import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { gsap, ScrollTrigger } from '@/motion/gsap'
import { getLenis } from '@/motion/lenis'
import { useUI, selectReduced } from '@/stores/ui'
import { lemniscatePath } from '@/lib/lemniscate'

type Ctx = { navigate: (href: string, label?: string) => void }
const TransitionContext = createContext<Ctx>({ navigate: () => {} })
export const useTransition = () => useContext(TransitionContext)

const BANDS = 6
const GLYPH = lemniscatePath(120, 48)

/**
 * App Router has no "exit" lifecycle, so we intercept navigation:
 * cover (overlay in) → router.push → wait for pathname → scroll reset + refresh → reveal.
 */
export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const root = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const pending = useRef<{ resolve: () => void; target: string } | null>(null)
  const busy = useRef(false)

  // resolve the pending navigation once the new route has committed
  useEffect(() => {
    const p = pending.current
    if (p && pathname === p.target) {
      pending.current = null
      p.resolve()
    }
  }, [pathname])

  const reveal = useCallback(() => {
    const bands = root.current!.querySelectorAll('[data-band]')
    return gsap
      .timeline()
      .to(root.current!.querySelector('[data-glyph]'), { autoAlpha: 0, scale: 0.6, duration: 0.3, ease: 'power2.in' })
      .to(bands, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.7, stagger: 0.05, ease: 'expo.inOut' }, 0.1)
      .set(root.current, { autoAlpha: 0 })
  }, [])

  const navigate = useCallback(
    (href: string, text = '') => {
      const url = new URL(href, window.location.href)
      const samePath = url.pathname === window.location.pathname
      if (samePath) {
        if (url.hash) getLenis()?.scrollTo(url.hash, { duration: 1.6 }) ?? document.querySelector(url.hash)?.scrollIntoView()
        return
      }
      if (busy.current) return
      const reduced = selectReduced(useUI.getState())
      if (reduced || !root.current) {
        router.push(href)
        return
      }
      busy.current = true
      useUI.getState().set({ menuOpen: false })
      const el = root.current
      const bands = el.querySelectorAll('[data-band]')
      if (label.current) label.current.textContent = ''
      gsap
        .timeline({
          onComplete: () => {
            const arrived = new Promise<void>((resolve) => (pending.current = { resolve, target: url.pathname }))
            router.push(href, { scroll: false })
            arrived.then(() => {
              getLenis()?.scrollTo(0, { immediate: true, force: true })
              if (!getLenis()) window.scrollTo(0, 0)
              requestAnimationFrame(() => {
                ScrollTrigger.refresh()
                if (url.hash) {
                  const target = document.querySelector<HTMLElement>(url.hash)
                  if (target) getLenis()?.scrollTo(target, { immediate: true, force: true }) ?? target.scrollIntoView()
                }
                reveal().eventCallback('onComplete', () => (busy.current = false))
              })
            })
          },
        })
        .set(el, { autoAlpha: 1 })
        .fromTo(bands, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.7, stagger: 0.05, ease: 'expo.inOut' })
        .fromTo(el.querySelector('[data-glyph]'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'expo.out' }, 0.45)
        .to(label.current, { duration: 0.5, scrambleText: { text: text || url.pathname, chars: '∞01°', speed: 0.8 } }, 0.5)
    },
    [router, reveal],
  )

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 z-50 invisible">
        <div className="absolute inset-0 flex">
          {Array.from({ length: BANDS }, (_, i) => (
            <span key={i} data-band className={`h-full flex-1 ${i % 2 ? 'bg-ink' : 'bg-graphite'}`} style={{ transform: 'scaleY(0)' }} />
          ))}
        </div>
        <div data-glyph className="absolute inset-0 grid place-items-center opacity-0">
          <div className="flex flex-col items-center gap-5">
            <svg viewBox="0 0 120 48" className="w-28">
              <path d={GLYPH} fill="none" stroke="var(--color-signal)" strokeWidth="1.2" />
            </svg>
            <span ref={label} className="meta text-bone" />
          </div>
        </div>
      </div>
    </TransitionContext.Provider>
  )
}
