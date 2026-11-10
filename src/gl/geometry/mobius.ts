/**
 * Möbius strip, parametric: u ∈ [0, 2π), v ∈ [-w, w]
 *   x = (R + v·cos(u/2))·cos u
 *   y = (R + v·cos(u/2))·sin u
 *   z =  v·sin(u/2)
 */
export function mobiusPoint(u: number, v: number, R: number, out: Float32Array, i: number) {
  const h = v * Math.cos(u / 2)
  out[i] = (R + h) * Math.cos(u)
  out[i + 1] = (R + h) * Math.sin(u)
  out[i + 2] = v * Math.sin(u / 2)
}

export type ParticleBuffers = {
  position: Float32Array // assembled (strip) positions
  scatter: Float32Array // pre-assembly cloud
  rand: Float32Array // vec4 per particle
  uv: Float32Array // (u, v normalised) per particle
}

/** Seeded PRNG so the strip looks identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildMobiusParticles(count: number, R = 1.6, W = 0.56): ParticleBuffers {
  const rnd = mulberry32(0x1f1f)
  const position = new Float32Array(count * 3)
  const scatter = new Float32Array(count * 3)
  const rand = new Float32Array(count * 4)
  const uv = new Float32Array(count * 2)

  for (let p = 0; p < count; p++) {
    const u = rnd() * Math.PI * 2
    // ~22% of particles hug the single edge for a crisp silhouette
    const edge = rnd() < 0.22
    const vn = edge ? (rnd() < 0.5 ? -1 : 1) * (0.94 + rnd() * 0.06) : rnd() * 2 - 1
    mobiusPoint(u, vn * W, R, position, p * 3)

    // scatter: wide shell around the origin, slightly flattened
    const th = rnd() * Math.PI * 2
    const ph = Math.acos(rnd() * 2 - 1)
    const r = 3.5 + rnd() * 6
    scatter[p * 3] = r * Math.sin(ph) * Math.cos(th)
    scatter[p * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7
    scatter[p * 3 + 2] = r * Math.cos(ph) * 0.6

    rand[p * 4] = rnd()
    rand[p * 4 + 1] = rnd()
    rand[p * 4 + 2] = rnd()
    rand[p * 4 + 3] = edge ? 0.85 + rnd() * 0.15 : rnd()

    uv[p * 2] = u / (Math.PI * 2)
    uv[p * 2 + 1] = vn
  }
  return { position, scatter, rand, uv }
}
