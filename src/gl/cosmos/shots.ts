import * as THREE from 'three'
import { BODIES, BELT, CHAPTERS, type Vec3 } from '@/content/cosmos'

/**
 * Camera language for ORBIT ∞. Every chapter owns one "shot" (a function of local t ∈ [0,1]);
 * the first TRANSFER part of each chapter flies from the previous shot's last frame
 * to this shot's first frame along a lifted arc, so the whole lap is one continuous take.
 */
export type Frame = { pos: THREE.Vector3; target: THREE.Vector3; roll: number; fov: number }

const v = (a: Vec3) => new THREE.Vector3(...a)
const P = Object.fromEntries(Object.entries(BODIES).map(([k, b]) => [k, v(b.pos)])) as Record<string, THREE.Vector3>
const R = Object.fromEntries(Object.entries(BODIES).map(([k, b]) => [k, b.radius])) as Record<string, number>

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Point around `c` at distance d. az = 0 faces +z (toward the Sun), el = elevation. */
function sph(c: THREE.Vector3, d: number, az: number, el: number, out = new THREE.Vector3()) {
  return out.set(c.x + Math.sin(az) * Math.cos(el) * d, c.y + Math.sin(el) * d, c.z + Math.cos(az) * Math.cos(el) * d)
}

type Shot = (t: number, f: Frame) => void

const SHOTS: Record<string, Shot> = {
  // drop out of warp, the Sun far ahead
  launch: (t, f) => {
    const e = easeOut(t)
    f.pos.set(lerp(-40, 30, e), lerp(30, 14, e), lerp(980, 420, e))
    f.target.copy(P.sun).add(new THREE.Vector3(lerp(-30, 10, e), 0, 0))
    f.roll = lerp(-0.12, 0.04, e)
    f.fov = lerp(55, 40, e)
  },
  // slow push + arc around the star
  sun: (t, f) => {
    const s = smooth(t)
    sph(P.sun, lerp(170, 95, s), lerp(0.2, 1.25, s), lerp(0.18, 0.06, s), f.pos)
    f.target.copy(P.sun).add(new THREE.Vector3(0, lerp(0, -6, s), 0))
    f.roll = lerp(0.04, -0.06, s)
    f.fov = lerp(40, 34, s)
  },
  // lateral high-speed flyby with a whip pan
  mercury: (t, f) => {
    sph(P.mercury, lerp(26, 13, Math.sin(t * Math.PI) * 0.6 + t * 0.4), lerp(1.25, -1.15, smooth(t)), lerp(0.18, 0.02, t), f.pos)
    f.target.copy(P.mercury)
    f.roll = lerp(0.15, -0.18, smooth(t))
    f.fov = 42
  },
  // skim the cloud deck, then rise over the limb
  venus: (t, f) => {
    const s = smooth(t)
    sph(P.venus, lerp(1.32, 3.1, s) * R.venus, lerp(0.55, 0.05, s), lerp(-0.42, 0.14, s), f.pos)
    const over = new THREE.Vector3(P.venus.x, P.venus.y + R.venus * 1.4, P.venus.z - R.venus * 4)
    f.target.copy(over).lerp(P.venus, smoother(t))
    f.roll = lerp(-0.22, 0, s)
    f.fov = lerp(60, 42, s)
  },
  // orbit from the night side: sunrise sweeps across the terminator
  earth: (t, f) => {
    const s = smooth(t)
    sph(P.earth, lerp(3.4, 2.5, s) * R.earth, lerp(2.75, 0.55, s), lerp(0.12, 0.2, s), f.pos)
    f.target.copy(P.earth)
    f.roll = lerp(0.1, -0.05, s)
    f.fov = 40
  },
  // dolly push with a slow dutch tilt
  mars: (t, f) => {
    const s = smooth(t)
    sph(P.mars, lerp(7, 2.15, s) * R.mars, lerp(0.6, 0.15, s), lerp(0.22, 0.04, s), f.pos)
    f.target.copy(P.mars).add(new THREE.Vector3(lerp(0, -R.mars * 0.4, s), 0, 0))
    f.roll = lerp(0, 0.16, s)
    f.fov = lerp(40, 44, s)
  },
  // weave through the rocks, banking into each turn
  belt: (t, f) => {
    const z = lerp(BELT.zStart + 30, BELT.zEnd - 20, t)
    const w = t * Math.PI * 2
    f.pos.set(Math.sin(w) * 22, Math.sin(w * 0.5) * 6, z)
    f.target.set(Math.sin(w + 0.6) * 22, Math.sin((w + 0.6) * 0.5) * 6, z - 90)
    f.roll = -Math.cos(w) * 0.38
    f.fov = 58
  },
  // dolly zoom (vertigo): planet holds its size while space stretches behind it
  jupiter: (t, f) => {
    const s = smooth(t)
    const d = lerp(7.5, 2.15, s) * R.jupiter
    sph(P.jupiter, d, lerp(0.42, 0.22, s), 0.08, f.pos)
    f.target.copy(P.jupiter)
    const frame = Math.tan(Math.asin(1 / 7.5)) / Math.tan(THREE.MathUtils.degToRad(12))
    const half = Math.atan(Math.tan(Math.asin(R.jupiter / d)) / frame)
    f.fov = THREE.MathUtils.radToDeg(half * 2)
    f.roll = 0
  },
  // dive from above the rings straight through the ring plane
  saturn: (t, f) => {
    const s = smooth(t)
    sph(P.saturn, lerp(4.6, 3.1, s) * R.saturn, lerp(-0.75, 0.55, s), lerp(0.62, -0.32, smoother(t)), f.pos)
    f.target.copy(P.saturn)
    f.roll = lerp(0.42, -0.3, s)
    f.fov = lerp(44, 50, s)
  },
  // roll the camera with the planet's 98° axis
  uranus: (t, f) => {
    const s = smooth(t)
    sph(P.uranus, lerp(5, 3.6, s) * R.uranus, lerp(-0.55, 0.6, s), 0.1, f.pos)
    f.target.copy(P.uranus)
    f.roll = lerp(0, -1.71, smoother(t))
    f.fov = 42
  },
  // supersonic flyby
  neptune: (t, f) => {
    const e = t < 0.5 ? smooth(t * 2) * 0.5 : 0.5 + easeOut((t - 0.5) * 2) * 0.5
    sph(P.neptune, lerp(6.5, 2.4, Math.sin(e * Math.PI) * 0.7 + e * 0.3) * R.neptune, lerp(1.45, -1.1, e), lerp(0.08, -0.06, e), f.pos)
    f.target.copy(P.neptune)
    f.roll = lerp(-0.12, 0.22, e)
    f.fov = 46
  },
  // stillness: pull back on the dark side until the Sun is a single bright star
  pluto: (t, f) => {
    const s = smoother(t)
    sph(P.pluto, lerp(3.2, 26, s) * R.pluto, lerp(2.7, 3.06, s), lerp(0.08, 0.18, s), f.pos)
    f.target.copy(P.pluto).lerp(P.sun, lerp(0, 0.003, s))
    f.roll = lerp(0.05, 0, s)
    f.fov = lerp(40, 34, s)
  },
  // engage warp: accelerate away into the dark, FOV blows open
  warp: (t, f) => {
    const a = t * t
    f.pos.set(lerp(-6, 0, t), lerp(9, 0, t), lerp(P.pluto.z - 70, P.pluto.z - 2600, a))
    f.target.set(0, 0, f.pos.z - 200)
    f.roll = t * 0.9
    f.fov = lerp(40, 110, a)
  },
}

/** Fraction of each chapter spent flying from the previous shot. */
export const TRANSFER = 0.3
export const N_CH = CHAPTERS.length

const a: Frame = { pos: new THREE.Vector3(), target: new THREE.Vector3(), roll: 0, fov: 40 }
const b: Frame = { pos: new THREE.Vector3(), target: new THREE.Vector3(), roll: 0, fov: 40 }
const lift = new THREE.Vector3()

export function chapterAt(p: number) {
  const x = Math.min(Math.max(p, 0), 0.99999) * N_CH
  const i = Math.floor(x)
  return { index: i, local: x - i }
}

/** Write the camera frame for global progress p ∈ [0,1]; returns 0..1 transfer intensity. */
export function frameAt(p: number, out: Frame) {
  const { index, local } = chapterAt(p)
  const id = CHAPTERS[index].id
  if (index === 0) {
    SHOTS[id](local, out)
    return 0
  }
  if (local >= TRANSFER) {
    SHOTS[id]((local - TRANSFER) / (1 - TRANSFER), out)
    return 0
  }
  // transfer: previous shot end → this shot start, lifted off the straight line
  const k = local / TRANSFER
  SHOTS[CHAPTERS[index - 1].id](1, a)
  SHOTS[id](0, b)
  const e = smoother(k)
  const dist = a.pos.distanceTo(b.pos)
  lift.set(0, 1, 0).multiplyScalar(Math.sin(Math.PI * e) * Math.min(dist * 0.12, 40))
  out.pos.copy(a.pos).lerp(b.pos, e).add(lift)
  // look slightly ahead along the flight early on, then settle on the next subject
  const ahead = b.pos.clone().sub(a.pos).normalize().multiplyScalar(60).add(out.pos)
  const look = a.target.clone().lerp(b.target, e)
  out.target.copy(look).lerp(ahead, Math.sin(Math.PI * e) * 0.55)
  out.roll = lerp(a.roll, b.roll, e) + Math.sin(Math.PI * e) * 0.18 * (index % 2 ? 1 : -1)
  out.fov = lerp(a.fov, b.fov, e) + Math.sin(Math.PI * e) * 14
  return Math.sin(Math.PI * k)
}
