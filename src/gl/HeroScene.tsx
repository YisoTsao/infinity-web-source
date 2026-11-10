'use client'
import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ParticleMobius } from './particles/ParticleMobius'
import { quality } from './utils/quality'
import { useUI, selectReduced } from '@/stores/ui'
import { heroState } from '@/stores/scroll'

/**
 * Hero WebGL layer. Prototype keeps its own Canvas; when Section 04 lands this
 * migrates into the shared <Canvas> + drei <View> setup (COMPONENT_ARCHITECTURE §3).
 */
export default function HeroScene() {
  const tier = useUI((s) => s.tier)
  const reduced = useUI(selectReduced)
  const q = quality[tier]
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!wrap.current) return
    const io = new IntersectionObserver(([e]) => {
      heroState.visible = e.isIntersecting
      setVisible(e.isIntersecting)
    })
    io.observe(wrap.current)
    const onVis = () => setVisible(!document.hidden && heroState.visible)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden>
      <Canvas
        dpr={[1, q.maxDpr]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 6], fov: 35, near: 0.1, far: 50 }}
        frameloop={visible ? 'always' : 'never'}
      >
        <ParticleMobius count={q.particles} size={q.size} animate={!reduced} />
      </Canvas>
    </div>
  )
}
