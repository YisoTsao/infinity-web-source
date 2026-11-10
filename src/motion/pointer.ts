'use client'
/** Global pointer state, written by a single passive listener. */
export const pointer = {
  x: 0,
  y: 0,
  nx: 0, // NDC -1..1
  ny: 0,
  lastMove: -Infinity,
  type: 'mouse' as string,
}

let bound = false
export function bindPointer() {
  if (bound || typeof window === 'undefined') return
  bound = true
  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX
    pointer.y = e.clientY
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1
    pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1)
    pointer.lastMove = performance.now()
    pointer.type = e.pointerType
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerdown', onMove, { passive: true })
}
