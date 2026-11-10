/** Bernoulli lemniscate (∞) as an SVG path, centered in a w×h box. */
export function lemniscatePath(w: number, h: number, steps = 160) {
  const a = w / 2
  const cx = w / 2
  const cy = h / 2
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const s = Math.sin(t)
    const den = 1 + s * s
    const x = cx + (a * Math.cos(t)) / den
    const y = cy + (a * s * Math.cos(t)) / den
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }
  return d + 'Z'
}
