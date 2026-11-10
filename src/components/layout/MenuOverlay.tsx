'use client'
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useUI } from '@/stores/ui'
import { sections } from '@/content/sections'
import { projects } from '@/content/projects'
import { TransitionLink } from '@/components/motion/TransitionLink'

const EASE = [0.19, 1, 0.22, 1] as const

/**
 * Animated full-screen navigation. Motion for React owns mount/unmount here
 * (AnimatePresence) — none of these elements are touched by GSAP.
 */
export function MenuOverlay() {
  const open = useUI((s) => s.menuOpen)
  const reducedSys = useUI((s) => s.prefersReduced || s.motionOff)
  const set = useUI((s) => s.set)
  const firstLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && set({ menuOpen: false })
    window.addEventListener('keydown', onKey)
    firstLink.current?.focus()
    document.documentElement.classList.add('menu-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('menu-open')
    }
  }, [open, set])

  const t = (d = 0) => (reducedSys ? { duration: 0 } : { duration: 0.8, ease: EASE, delay: d })
  const close = () => set({ menuOpen: false })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="menu"
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site index"
          className="fixed inset-0 z-[45] overflow-y-auto bg-ink text-bone"
          initial={{ clipPath: 'circle(0% at 100% 0%)' }}
          animate={{ clipPath: 'circle(150% at 100% 0%)' }}
          exit={{ clipPath: 'circle(0% at 100% 0%)' }}
          transition={t()}
          data-lenis-prevent
        >
          <div className="frame-x grid min-h-full gap-12 pb-16 pt-28 lg:grid-cols-12">
            <nav aria-label="Sections" className="lg:col-span-7">
              <p className="meta mb-6 text-fog-ink">Index — 360°</p>
              <ul>
                {sections.map((s, i) => (
                  <li key={s.id} className="overflow-hidden border-b border-bone/10">
                    <motion.div initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }} transition={t(0.15 + i * 0.035)}>
                      <TransitionLink
                        ref={i === 0 ? firstLink : undefined}
                        href={`/#${s.id}`}
                        onClick={close}
                        className="menu-row group flex items-baseline gap-4 py-2 md:gap-8"
                      >
                        <span className="meta w-10 text-fog-ink">{s.n}</span>
                        <span className="font-display text-[clamp(1.8rem,5vw,4.2rem)] font-bold leading-none tracking-tight transition-colors group-hover:text-signal">
                          {s.name}
                        </span>
                        <span className="zh hidden text-fog-ink md:inline">{s.zh}</span>
                        <span className="meta ml-auto text-fog-ink">{String(s.angle).padStart(3, '0')}°</span>
                      </TransitionLink>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="meta mb-6 text-fog-ink">Selected work</p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
                {projects.map((p, i) => (
                  <motion.li key={p.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={t(0.35 + i * 0.03)}>
                    <TransitionLink href={`/work/${p.slug}`} label={p.title} onClick={close} className="nav-link font-display text-lg font-semibold">
                      {p.title}
                    </TransitionLink>
                  </motion.li>
                ))}
              </ul>
              <p className="zh mt-12 max-w-[28ch] text-fog-ink">捲動不是一條線，而是一個環。按 Esc 關閉。</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
