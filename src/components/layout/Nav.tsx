'use client'
import { lemniscatePath } from '@/lib/lemniscate'
import { useUI } from '@/stores/ui'
import { Magnetic } from '@/components/motion/Magnetic'
import { TransitionLink } from '@/components/motion/TransitionLink'

const LOGO = lemniscatePath(40, 20)
const LINKS = [
  { label: 'Work', href: '/#work', angle: '130°' },
  { label: 'Forms', href: '/#forms', angle: '200°' },
  { label: 'Contact', href: '/#contact', angle: '330°' },
]

/** Items are wrapped in masks so the hero entrance timeline can slide them in ([data-nav-item]). */
export function Nav() {
  const motionOff = useUI((s) => s.motionOff)
  const prefersReduced = useUI((s) => s.prefersReduced)
  const menuOpen = useUI((s) => s.menuOpen)
  const set = useUI((s) => s.set)

  return (
    <header className="nav fixed inset-x-0 top-0 z-[46] text-bone mix-blend-difference">
      <nav aria-label="Primary" className="frame-x flex items-center justify-between pt-5 md:pt-7">
        <span className="mask">
          <TransitionLink href="/#origin" label="Origin" data-nav-item className="flex items-center gap-3" onClick={() => set({ menuOpen: false })}>
            <svg width="40" height="20" viewBox="0 0 40 20" aria-hidden className="logo-mark">
              <path d={LOGO} fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="font-display text-sm font-bold tracking-[0.18em]">INFINITY</span>
          </TransitionLink>
        </span>

        <span className="mask hidden xl:block">
          <span data-nav-item className="meta block text-fog-ink">Experimental creative studio — est. ∞</span>
        </span>

        <ul className="flex items-center gap-5 md:gap-8">
          {LINKS.map((l) => (
            <li key={l.label} className="mask hidden lg:block">
              <Magnetic strength={0.3} padding={14}>
                <TransitionLink href={l.href} data-nav-item className="nav-link group block">
                  <span className="meta mr-2 text-fog-ink">{l.angle}</span>
                  <span className="font-display text-sm font-semibold">{l.label}</span>
                </TransitionLink>
              </Magnetic>
            </li>
          ))}
          <li className="mask hidden md:block">
            <button
              type="button"
              data-nav-item
              className="meta motion-toggle block"
              aria-pressed={!motionOff}
              disabled={prefersReduced}
              title={prefersReduced ? 'Reduced motion is set by your system' : undefined}
              onClick={() => set({ motionOff: !motionOff })}
            >
              Motion: {prefersReduced || motionOff ? 'Off' : 'On'}
            </button>
          </li>
          <li className="mask">
            <Magnetic strength={0.35} padding={12}>
              <button
                type="button"
                data-nav-item
                aria-expanded={menuOpen}
                aria-controls="site-menu"
                onClick={() => set({ menuOpen: !menuOpen })}
                className="menu-btn flex items-center gap-3"
              >
                <span className="meta">{menuOpen ? 'Close' : 'Index'}</span>
                <span aria-hidden className={`menu-btn__icon ${menuOpen ? 'is-open' : ''}`}>
                  <span />
                  <span />
                </span>
              </button>
            </Magnetic>
          </li>
        </ul>
      </nav>
    </header>
  )
}
