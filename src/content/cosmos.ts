/**
 * ORBIT ∞ — one lap through the solar system. World layout is artistic, not to scale:
 * the Sun sits at the origin and the bodies line up along −z so the camera can travel outward.
 */
export type Vec3 = [number, number, number]

export type BodyKind = 'star' | 'rocky' | 'venus' | 'earth' | 'gas' | 'ice'

export type Body = {
  id: string
  kind: BodyKind
  pos: Vec3
  radius: number
  /** palette: deep / mid / light (hex) */
  colors: [string, string, string]
  atmo?: string
  atmoStrength?: number
  /** axial tilt in radians (z-rotation) */
  tilt?: number
  /** spin speed rad/s */
  spin?: number
  seed: number
  rings?: { inner: number; outer: number; opacity: number; tint: string }
}

export const BODIES: Record<string, Body> = {
  sun: { id: 'sun', kind: 'star', pos: [0, 0, 0], radius: 30, colors: ['#ff5a0a', '#ffb347', '#fff4d6'], seed: 1, spin: 0.02 },
  mercury: { id: 'mercury', kind: 'rocky', pos: [-20, 4, -260], radius: 3, colors: ['#3d3a38', '#77716a', '#b3aca2'], seed: 2, spin: 0.05 },
  venus: { id: 'venus', kind: 'venus', pos: [25, -6, -520], radius: 5, colors: ['#a8742c', '#e3b867', '#fbe7b5'], atmo: '#ffd59a', atmoStrength: 1.2, seed: 3, spin: 0.01 },
  earth: { id: 'earth', kind: 'earth', pos: [-30, 5, -800], radius: 5.5, colors: ['#0b2a5a', '#2f7d45', '#d9cfa8'], atmo: '#5fa8ff', atmoStrength: 1.4, seed: 4, spin: 0.06, tilt: 0.41 },
  moon: { id: 'moon', kind: 'rocky', pos: [-30, 5, -800], radius: 1.5, colors: ['#4a4846', '#8d8a85', '#c9c5be'], seed: 9, spin: 0.02 },
  mars: { id: 'mars', kind: 'rocky', pos: [28, -4, -1080], radius: 4, colors: ['#5a1f0e', '#b5512a', '#e39a6a'], atmo: '#ff9a6a', atmoStrength: 0.5, seed: 5, spin: 0.06, tilt: 0.44 },
  jupiter: { id: 'jupiter', kind: 'gas', pos: [-40, 0, -1750], radius: 22, colors: ['#7a4e32', '#d4a373', '#f3e3c6'], atmo: '#f5d8a8', atmoStrength: 0.6, seed: 6, spin: 0.08, tilt: 0.05 },
  saturn: {
    id: 'saturn', kind: 'gas', pos: [45, 8, -2150], radius: 18, colors: ['#8a6a3e', '#d9bf8a', '#f6ead0'], atmo: '#f7e2b0', atmoStrength: 0.5, seed: 7, spin: 0.07, tilt: 0.47,
    rings: { inner: 1.25, outer: 2.35, opacity: 0.95, tint: '#e8d7b0' },
  },
  uranus: {
    id: 'uranus', kind: 'ice', pos: [-30, -5, -2520], radius: 10, colors: ['#5aa5b5', '#9ad7dc', '#d8f3f2'], atmo: '#b8f4ff', atmoStrength: 1.0, seed: 8, spin: 0.05, tilt: 1.71,
    rings: { inner: 1.6, outer: 2.0, opacity: 0.35, tint: '#c9e9ee' },
  },
  neptune: { id: 'neptune', kind: 'ice', pos: [30, 4, -2850], radius: 10, colors: ['#10257a', '#2f5fd0', '#8fb3ff'], atmo: '#6f9bff', atmoStrength: 1.2, seed: 10, spin: 0.07, tilt: 0.49 },
  pluto: { id: 'pluto', kind: 'rocky', pos: [0, 0, -3150], radius: 2.5, colors: ['#4b3a2c', '#a88a6c', '#efe1cf'], seed: 11, spin: 0.03, tilt: 2.1 },
}

/** Asteroid belt slab (between Mars and Jupiter). */
export const BELT = { zStart: -1180, zEnd: -1520, halfWidth: 140, halfHeight: 45 }

export type Chapter = {
  id: string
  name: string
  emotive: string
  zh: string
  note: string
  /** instrument readouts */
  data: [string, string][]
  au: number
}

export const CHAPTERS: Chapter[] = [
  { id: 'launch', name: 'ORBIT', emotive: 'endless', zh: '深空巡航 — 一圈，再一圈', note: 'Drop out of warp. Scroll to fly.', data: [['Bodies', '09 + 1'], ['Lap', '∞']], au: 40 },
  { id: 'sun', name: 'SOL', emotive: 'burning', zh: '太陽 — 一切的起點', note: 'A G-type star holding 99.86% of the system’s mass.', data: [['Diameter', '1,392,700 km'], ['Surface', '5,778 K'], ['Age', '4.6 Gyr']], au: 0 },
  { id: 'mercury', name: 'MERCURY', emotive: 'swift', zh: '水星 — 最快的一顆', note: 'One day here lasts two of its years.', data: [['Distance', '0.39 AU'], ['Diameter', '4,879 km'], ['Year', '88 d']], au: 0.39 },
  { id: 'venus', name: 'VENUS', emotive: 'veiled', zh: '金星 — 被雲封住的火爐', note: 'Sulphuric clouds over a 465 °C surface.', data: [['Distance', '0.72 AU'], ['Surface', '465 °C'], ['Day', '243 d']], au: 0.72 },
  { id: 'earth', name: 'EARTH', emotive: 'home', zh: '地球 — 我們在這裡', note: 'Sunrise races across the terminator every 24 hours.', data: [['Distance', '1.00 AU'], ['Diameter', '12,742 km'], ['Moons', '01']], au: 1 },
  { id: 'mars', name: 'MARS', emotive: 'rust', zh: '火星 — 鏽紅色的沙漠', note: 'Olympus Mons rises 22 km above the dust.', data: [['Distance', '1.52 AU'], ['Diameter', '6,779 km'], ['Moons', '02']], au: 1.52 },
  { id: 'belt', name: 'THE BELT', emotive: 'debris', zh: '小行星帶 — 沒能成形的星球', note: 'Over a million rocks wider than a kilometre.', data: [['Range', '2.2–3.2 AU'], ['Largest', 'Ceres'], ['Bodies', '1.1M+']], au: 2.7 },
  { id: 'jupiter', name: 'JUPITER', emotive: 'giant', zh: '木星 — 巨人與大紅斑', note: 'A storm wider than Earth, raging for centuries.', data: [['Distance', '5.20 AU'], ['Diameter', '139,820 km'], ['Moons', '95']], au: 5.2 },
  { id: 'saturn', name: 'SATURN', emotive: 'rings', zh: '土星 — 穿過環平面', note: 'Rings 280,000 km wide and barely 10 m thick.', data: [['Distance', '9.58 AU'], ['Diameter', '116,460 km'], ['Moons', '274']], au: 9.58 },
  { id: 'uranus', name: 'URANUS', emotive: 'sideways', zh: '天王星 — 躺著自轉', note: 'Tipped 98° — it rolls around the Sun on its side.', data: [['Distance', '19.2 AU'], ['Axial tilt', '97.8°'], ['Moons', '28']], au: 19.2 },
  { id: 'neptune', name: 'NEPTUNE', emotive: 'wind', zh: '海王星 — 最狂的風', note: 'Supersonic winds at 2,100 km/h.', data: [['Distance', '30.1 AU'], ['Wind', '2,100 km/h'], ['Moons', '16']], au: 30.1 },
  { id: 'pluto', name: 'PLUTO', emotive: 'still', zh: '冥王星 — 第九顆，最安靜的一顆', note: 'Turn around: the Sun is just a bright star now.', data: [['Distance', '39.5 AU'], ['Diameter', '2,377 km'], ['Moons', '05']], au: 39.5 },
  { id: 'warp', name: 'AGAIN', emotive: 'warp', zh: '曲速 — 回到起點', note: 'Engage. The loop never ends.', data: [['Speed', '9.97 c'], ['Next', 'Lap +1']], au: 40 },
]
