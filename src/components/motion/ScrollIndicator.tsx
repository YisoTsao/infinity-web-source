'use client'
import { Magnetic } from './Magnetic'
import { scrollToTarget } from '@/motion/lenis'

const TEXT = 'SCROLL TO ENTER THE LOOP · SCROLL TO ENTER THE LOOP · '

/** Rotating circular label (CSS rotate on the svg, magnetic on the wrapper — separate owners). */
export function ScrollIndicator({ target }: { target: string }) {
  return (
    <Magnetic strength={0.4} padding={24}>
      <button
        type="button"
        onClick={() => scrollToTarget(target)}
        className="scroll-indicator group relative grid size-[104px] place-items-center rounded-full md:size-[124px]"
        aria-label="Scroll to the next section"
      >
        <svg viewBox="0 0 120 120" className="scroll-indicator__ring absolute inset-0 size-full" aria-hidden>
          <defs>
            <path id="si-circle" d="M60,60 m-48,0 a48,48 0 1,1 96,0 a48,48 0 1,1 -96,0" />
          </defs>
          <text className="fill-current font-mono text-[8px]">
            <textPath href="#si-circle" textLength="300" lengthAdjust="spacing">{TEXT}</textPath>
          </text>
        </svg>
        <svg viewBox="0 0 24 24" className="size-5 transition-colors group-hover:text-signal" aria-hidden>
          <path d="M12 3v17M5 13l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </Magnetic>
  )
}
