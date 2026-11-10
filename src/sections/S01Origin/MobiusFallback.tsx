import { lemniscatePath } from '@/lib/lemniscate'

const D = lemniscatePath(600, 260)

/** Static stand-in shown while the WebGL chunk loads (same footprint → no CLS) or without WebGL. */
export function MobiusFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden>
      <svg viewBox="0 0 600 260" className="w-[min(70vw,720px)] opacity-30">
        <path d={D} fill="none" stroke="var(--color-bone)" strokeWidth="0.75" />
      </svg>
    </div>
  )
}
