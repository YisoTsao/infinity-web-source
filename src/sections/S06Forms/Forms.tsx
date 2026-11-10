'use client'
import dynamic from 'next/dynamic'
import { gsap } from '@/motion/gsap'
import { MQ } from '@/motion/ready'
import { formsState } from '@/stores/scroll'
import { useUI } from '@/stores/ui'
import { useSection } from '@/hooks/useSection'

const FormsScene = dynamic(() => import('@/gl/forms/FormsScene'), { ssr: false })

const FORMS = [
  { name: 'Strip', zh: '莫比烏斯帶', spec: 'Surfaces 1 · Edges 1' },
  { name: 'Sphere', zh: '球', spec: 'Surfaces 1 · Edges 0' },
  { name: 'Knot', zh: '三葉結', spec: 'Crossings 3 · (2,3)' },
  { name: 'Infinity', zh: '無限', spec: 'Lobes 2 · Ends 0' },
]

/**
 * 05 FORMS — 3D object transitions: one particle body pours between four forms,
 * continuously rotating. Labels scramble on each change.
 */
export function Forms() {
  const ready = useUI((s) => s.ready)
  const root = useSection<HTMLElement>(({ root, reduced, q }) => {
    const name = q('[data-form-name]')[0]
    const zh = q('[data-form-zh]')[0]
    const spec = q('[data-form-spec]')[0]
    const num = q('[data-form-num]')[0]
    let current = 0
    const show = (i: number) => {
      if (i === current) return
      current = i
      const f = FORMS[i]
      gsap.to(name, { duration: 0.7, scrambleText: { text: f.name, chars: 'upperCase', speed: 0.6 }, overwrite: true })
      gsap.to(spec, { duration: 0.6, scrambleText: { text: f.spec, chars: '01°∞', speed: 0.8 }, overwrite: true })
      zh.textContent = f.zh
      num.textContent = String(i + 1).padStart(2, '0')
      q('[data-form-dot]').forEach((d, k) => d.classList.toggle('is-active', k === i))
    }
    if (reduced) {
      formsState.shape = 0
      return
    }
    const mm = gsap.matchMedia()
    mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (ctx) => {
      const isDesk = ctx.conditions!.desktop
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: isDesk ? '+=400%' : '+=300%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: () => show(Math.round(formsState.shape)),
        },
      })
      // hold – morph – hold rhythm
      for (let i = 0; i < 3; i++) tl.to(formsState, { shape: i + 1, duration: 1, ease: 'power2.inOut' }, i * 1.5 + 0.4)
      tl.fromTo(formsState, { spin: 0 }, { spin: Math.PI * 0.75, duration: tl.duration() }, 0)
      tl.fromTo(q('[data-forms-word]'), { xPercent: 10 }, { xPercent: -45, duration: tl.duration() }, 0)
    })
    return () => {
      mm.revert()
      formsState.shape = 0
    }
  })

  return (
    <section
      ref={root}
      id="forms"
      data-angle-start="200"
      data-angle-end="240"
      data-angle-label="Forms"
      aria-labelledby="forms-title"
      className="relative h-svh overflow-hidden bg-ink text-bone"
    >
      <p aria-hidden data-forms-word className="mega pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-graphite">
        FORM · FORM · FORM · FORM
      </p>
      {ready && <FormsScene />}
      <div className="frame-x pointer-events-none absolute inset-0 flex flex-col justify-between pb-24 pt-28">
        <div className="flex items-start justify-between">
          <div>
            <p className="meta text-fog-ink">N°05 — Forms · 3D object transitions</p>
            <h2 id="forms-title" className="sr-only">
              Forms
            </h2>
          </div>
          <p className="meta text-right text-fog-ink">
            Continuous rotation
            <br />
            <span className="text-bone">ω = 0.28 rad/s</span>
          </p>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="meta mb-2 text-signal">
              <span data-form-num>01</span> / 04
            </p>
            <p data-form-name className="display">
              Strip
            </p>
            <p className="mt-3 flex items-baseline gap-4">
              <span data-form-zh className="zh text-fog-ink">莫比烏斯帶</span>
              <span data-form-spec className="meta text-fog-ink">Surfaces 1 · Edges 1</span>
            </p>
          </div>
          <ol aria-hidden className="flex gap-2">
            {FORMS.map((f, i) => (
              <li key={f.name} data-form-dot className={`form-dot ${i === 0 ? 'is-active' : ''}`} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
