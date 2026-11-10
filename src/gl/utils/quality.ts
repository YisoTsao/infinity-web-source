import type { Tier } from '@/stores/ui'

export const quality = {
  high: { particles: 40000, maxDpr: 2, size: 26 },
  mid: { particles: 18000, maxDpr: 1.5, size: 30 },
  low: { particles: 8000, maxDpr: 1.5, size: 30 },
} satisfies Record<Tier, { particles: number; maxDpr: number; size: number }>
