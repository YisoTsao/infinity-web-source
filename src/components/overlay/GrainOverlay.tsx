/**
 * Noise / grain overlay (effect ⑩). The noise tile is a static SVG
 * feTurbulence; motion is a CSS steps() translate on the compositor.
 */
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

export function GrainOverlay() {
  return (
    <div aria-hidden className="grain pointer-events-none fixed inset-0 z-40 overflow-hidden" data-grain>
      <div className="grain__tile" style={{ backgroundImage: NOISE }} />
    </div>
  )
}
