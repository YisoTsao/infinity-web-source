'use client'
import { useRef } from 'react'
import { gsap, useGSAP } from '@/motion/gsap'
import { spring } from '@/motion/config'
import { useUI, selectReduced } from '@/stores/ui'

type Props = {
  children: React.ReactNode
  /** max travel as a fraction of the element size */
  strength?: number
  /** extra hit area around the element in px */
  padding?: number
  className?: string
}

/**
 * Magnetic wrapper (effect ⑤). Owns the transform of its OWN two layers only:
 * outer layer follows the pointer, inner layer counter-moves for depth.
 * The child keeps its own transform free for GSAP entrance animations.
 */
export function Magnetic({ children, strength = 0.35, padding = 36, className }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const enabled = useUI((s) => s.finePointer && !selectReduced(s))

  useGSAP(
    () => {
      if (!enabled || !root.current || !outer.current || !inner.current) return
      const ox = gsap.quickTo(outer.current, 'x', spring.magnet)
      const oy = gsap.quickTo(outer.current, 'y', spring.magnet)
      const ix = gsap.quickTo(inner.current, 'x', spring.magnet)
      const iy = gsap.quickTo(inner.current, 'y', spring.magnet)
      let rect: DOMRect | null = null
      const hit = root.current

      const enter = () => {
        rect = outer.current!.getBoundingClientRect() // read once per enter
      }
      const move = (e: PointerEvent) => {
        if (!rect) enter()
        const cx = rect!.left + rect!.width / 2
        const cy = rect!.top + rect!.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        const mx = rect!.width * strength
        const my = rect!.height * strength
        const tx = gsap.utils.clamp(-mx, mx, dx * strength)
        const ty = gsap.utils.clamp(-my, my, dy * strength)
        ox(tx)
        oy(ty)
        ix(tx * 0.3)
        iy(ty * 0.3)
      }
      const leave = () => {
        rect = null
        gsap.to([outer.current, inner.current], { x: 0, y: 0, duration: 0.7, ease: 'back.out(1.6)', overwrite: true })
      }
      hit.addEventListener('pointerenter', enter)
      hit.addEventListener('pointermove', move)
      hit.addEventListener('pointerleave', leave)
      return () => {
        hit.removeEventListener('pointerenter', enter)
        hit.removeEventListener('pointermove', move)
        hit.removeEventListener('pointerleave', leave)
      }
    },
    { dependencies: [enabled, strength], scope: root },
  )

  return (
    <div ref={root} className={`magnetic relative inline-block ${className ?? ''}`} style={{ padding, margin: -padding }}>
      <div ref={outer} className="will-change-transform">
        <div ref={inner}>{children}</div>
      </div>
    </div>
  )
}
