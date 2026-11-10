'use client'
import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ScrollTrigger, useGSAP } from '@/motion/gsap'
import { fontsReady } from '@/motion/ready'
import { useUI } from '@/stores/ui'

/**
 * Instrument layer: maps scroll inside each [data-angle-start] section
 * to the Möbius angle (0°–360°). Writes textContent only when the integer changes.
 */
export function AngleMeter() {
  const value = useRef<HTMLSpanElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const pathname = usePathname()
  const lap = useUI((s) => s.lap)

  useGSAP(
    (_, contextSafe) => {
      let shown = -1
      const write = (deg: number, name: string) => {
        const d = Math.round(deg) % 361
        if (d !== shown && value.current) {
          shown = d
          value.current.textContent = String(d).padStart(3, '0')
        }
        if (label.current && label.current.textContent !== name) label.current.textContent = name
      }
      const build = contextSafe!(() => {
        const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-angle-start]'))
        sections.forEach((el) => {
          const a = Number(el.dataset.angleStart)
          const b = Number(el.dataset.angleEnd ?? a)
          const name = el.dataset.angleLabel ?? ''
          ScrollTrigger.create({
            trigger: el,
            start: 'top 60%',
            end: 'bottom 60%',
            onUpdate: (self) => write(a + (b - a) * self.progress, name),
          })
        })
        write(Number(sections[0]?.dataset.angleStart ?? 0), sections[0]?.dataset.angleLabel ?? '')
      })
      // run after sections have built their pins
      let cancelled = false
      fontsReady().then(() => requestAnimationFrame(() => !cancelled && build()))
      return () => {
        cancelled = true
      }
    },
    { dependencies: [pathname], revertOnUpdate: true },
  )

  return (
    <div className="frame-x pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-end text-bone mix-blend-difference md:bottom-7">
      <div className="mask">
        <p data-nav-item className="meta flex items-baseline gap-3" aria-hidden>
          {lap > 1 && <span className="text-signal">Lap {String(lap).padStart(2, '0')}</span>}
          <span ref={label}>Origin</span>
          <span>
            [ <span ref={value} className="tabular-nums">000</span>° ]
          </span>
        </p>
      </div>
    </div>
  )
}
