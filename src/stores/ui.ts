import { create } from 'zustand'

export type Tier = 'high' | 'mid' | 'low'

type UIState = {
  ready: boolean
  finePointer: boolean
  prefersReduced: boolean
  motionOff: boolean
  tier: Tier
  introDone: boolean
  lap: number
  menuOpen: boolean
  set: (s: Partial<Omit<UIState, 'set'>>) => void
}

export const useUI = create<UIState>((set) => ({
  ready: false,
  finePointer: false,
  prefersReduced: false,
  motionOff: false,
  tier: 'high',
  introDone: false,
  lap: 1,
  menuOpen: false,
  set: (s) => set(s),
}))

export const selectReduced = (s: UIState) => s.prefersReduced || s.motionOff
