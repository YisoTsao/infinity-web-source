import { buildMobiusParticles } from '@/gl/geometry/mobius'

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

/** Four point clouds with identical counts so particles can travel between them. */
export function buildShapes(count: number) {
  const r = rng(424242)
  const strip = buildMobiusParticles(count, 1.5, 0.55)
  const sphere = new Float32Array(count * 3)
  const knot = new Float32Array(count * 3)
  const lem = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    // fibonacci sphere
    const y = 1 - (i / (count - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = golden * i
    const R = 1.55 + (r() - 0.5) * 0.05
    sphere.set([Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R], i * 3)

    // (2,3) torus knot tube
    const t = r() * Math.PI * 2
    const p = 2, q = 3
    const cr = 1.05 + 0.45 * Math.cos(q * t)
    const cx = cr * Math.cos(p * t), cy = cr * Math.sin(p * t), cz = 0.45 * Math.sin(q * t)
    const a = r() * Math.PI * 2, tr = 0.2 * Math.sqrt(r())
    knot.set([cx + Math.cos(a) * tr, cy + Math.sin(a) * tr, cz + Math.cos(a + 1.3) * tr], i * 3)

    // lemniscate tube
    const s = r() * Math.PI * 2
    const sn = Math.sin(s), d = 1 + sn * sn, A = 2.1
    const lx = (A * Math.cos(s)) / d, ly = (A * sn * Math.cos(s)) / d
    const b = r() * Math.PI * 2, br = 0.22 * Math.sqrt(r())
    lem.set([lx + Math.cos(b) * br * 0.5, ly + Math.sin(b) * br, Math.cos(b) * br], i * 3)
  }
  return { strip: strip.position, sphere, knot, lem, rand: strip.rand }
}
