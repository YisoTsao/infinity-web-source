export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const mapRange = (v: number, a: number, b: number, c: number, d: number) =>
  c + ((v - a) / (b - a)) * (d - c)
