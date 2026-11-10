'use client'
import { useEffect } from 'react'
import { useUI, type Tier } from '@/stores/ui'
import { bindPointer } from '@/motion/pointer'

const MOTION_KEY = 'iw:motion-off'

function detectTier(): Tier {
  const w = window.innerWidth
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (w < 768 || cores <= 4 || mem <= 3) return 'low'
  if (w < 1280 || cores <= 6 || mem <= 4) return 'mid'
  return 'high'
}

export function CapabilitiesProvider({ children }: { children: React.ReactNode }) {
  const set = useUI((s) => s.set)

  useEffect(() => {
    bindPointer()
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let motionOff = false
    try {
      motionOff = window.localStorage.getItem(MOTION_KEY) === '1'
    } catch {}
    const syncAttr = () => {
      const st = useUI.getState()
      document.documentElement.dataset.motion = st.prefersReduced || st.motionOff ? 'off' : 'on'
    }
    const update = () => {
      set({ finePointer: fine.matches, prefersReduced: reduced.matches, tier: detectTier() })
      syncAttr()
    }
    set({ motionOff })
    update()
    set({ ready: true })
    // pages without the hero (e.g. a deep link to /work/…) never run the intro timeline
    requestAnimationFrame(() => {
      if (!document.getElementById('origin')) {
        document.documentElement.classList.remove('intro-pending')
        document.documentElement.classList.add('grain-on')
        set({ introDone: true })
      }
    })
    fine.addEventListener('change', update)
    reduced.addEventListener('change', update)

    // persist the in-site motion toggle
    const unsub = useUI.subscribe((s, prev) => {
      if (s.motionOff === prev.motionOff) return
      syncAttr()
      try {
        window.localStorage.setItem(MOTION_KEY, s.motionOff ? '1' : '0')
      } catch {}
    })
    return () => {
      fine.removeEventListener('change', update)
      reduced.removeEventListener('change', update)
      unsub()
    }
  }, [set])

  return <>{children}</>
}
