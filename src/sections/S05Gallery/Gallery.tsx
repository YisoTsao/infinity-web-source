'use client'
import Image from 'next/image'
import { gsap, SplitText } from '@/motion/gsap'
import { MQ } from '@/motion/ready'
import { scrollState } from '@/stores/scroll'
import { useUI } from '@/stores/ui'
import { useSection } from '@/hooks/useSection'
import { projects } from '@/content/projects'
import { TransitionLink } from '@/components/motion/TransitionLink'

/**
 * 04 THE OTHER SIDE — pinned horizontal gallery.
 * Desktop: x-scrub track, containerAnimation reveals, velocity skew, WebGL hover distortion.
 * Mobile / reduced: vertical stack with batch reveals.
 */
export function Gallery() {
  const root = useSection<HTMLElement>(({ root, reduced, q }) => {
    const intro = SplitText.create(q('[data-g-title]')[0], { type: 'words,chars', mask: 'chars', charsClass: 'ch' })
    const mm = gsap.matchMedia()

    mm.add(`${MQ.desktop}`, () => {
      if (reduced) return
      const track = q('[data-track]')[0]
      const cards = q('[data-card]')
      const distance = () => track.scrollWidth - window.innerWidth
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = q('[data-g-progress]')[0]
            if (p) p.style.transform = `scaleX(${self.progress})`
            const n = q('[data-g-count]')[0]
            const idx = Math.min(cards.length, Math.max(1, Math.ceil(self.progress * cards.length)))
            if (n && n.textContent !== String(idx).padStart(2, '0')) n.textContent = String(idx).padStart(2, '0')
          },
        },
      })
      gsap.from(intro.chars, { yPercent: 110, stagger: 0.03, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: root, start: 'top 70%' } })

      cards.forEach((card) => {
        gsap
          .timeline({ scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 95%', end: 'left 45%', scrub: 0.6 } })
          .fromTo(card, { '--reveal': 0 }, { '--reveal': 1, ease: 'power2.out' }, 0)
          .fromTo(card.querySelectorAll('[data-meta]'), { yPercent: 110 }, { yPercent: 0, stagger: 0.1, ease: 'power2.out' }, 0.2)
      })

      const { finePointer, tier } = useUI.getState()
      const useGL = finePointer && tier !== 'low'
      // velocity → skew on the DOM wrappers when there is no GL (GL bends the planes in its vertex shader instead)
      const skewers = useGL ? [] : q('[data-skew]').map((el) => gsap.quickTo(el, 'skewX', { duration: 0.5, ease: 'power3.out' }))
      let raf = true
      const tick = () => {
        if (raf) skewers.forEach((s) => s(gsap.utils.clamp(-7, 7, -scrollState.velocity * 0.35)))
      }
      gsap.ticker.add(tick)

      // WebGL distortion (fine pointer + not low tier)
      let dispose: (() => void) | undefined
      let cancelled = false
      if (useGL) {
        import('@/gl/image/DistortRenderer').then(({ DistortRenderer }) => {
          if (cancelled) return
          const canvas = q('[data-g-canvas]')[0] as HTMLCanvasElement
          const r = new DistortRenderer(canvas, q('[data-g-stage]')[0])
          const offs = cards.map((c) => r.add(c, c.querySelector('img')!))
          let visible = false
          const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
          io.observe(root)
          const render = (_: number, dtMs: number) => {
            if (!visible) return
            r.velocity = scrollState.velocity
            r.render(dtMs / 1000)
          }
          const onResize = () => r.resize()
          window.addEventListener('resize', onResize)
          gsap.ticker.add(render)
          dispose = () => {
            gsap.ticker.remove(render)
            window.removeEventListener('resize', onResize)
            io.disconnect()
            offs.forEach((o) => o())
            r.dispose()
          }
        })
      }
      return () => {
        cancelled = true
        raf = false
        gsap.ticker.remove(tick)
        dispose?.()
      }
    })

    mm.add(`${MQ.mobile}`, () => {
      if (reduced) return
      q('[data-card]').forEach((card) => {
        gsap
          .timeline({ scrollTrigger: { trigger: card, start: 'top 90%', end: 'top 45%', scrub: 0.6 } })
          .fromTo(card.querySelector('[data-fig]'), { clipPath: 'inset(20% 10% 20% 10%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
          .fromTo(card.querySelector('img'), { scale: 1.3 }, { scale: 1 }, 0)
      })
    })
    return () => {
      mm.revert()
      intro.revert()
    }
  })

  return (
    <section
      ref={root}
      id="work"
      data-angle-start="130"
      data-angle-end="200"
      data-angle-label="The Other Side"
      aria-labelledby="work-title"
      className="gallery relative overflow-hidden bg-bone text-ink lg:h-svh"
    >
      <div data-g-stage className="relative lg:h-svh">
        <canvas data-g-canvas aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden size-full lg:block" />
        <div data-track className="flex flex-col gap-16 px-[var(--frame)] py-28 lg:h-full lg:flex-row lg:items-center lg:gap-[6vw] lg:py-0 lg:will-change-transform">
          <div className="shrink-0 lg:w-[62vw]">
            <p className="meta mb-6 text-fog-bone">N°04 — Selected work · {projects.length} pieces</p>
            <h2 id="work-title" data-g-title className="mega leading-[0.8]">
              The other
              <br />
              side
            </h2>
            <p className="zh mt-8 max-w-[34ch] text-fog-bone">翻到環的另一面。每件作品都是同一條帶子上的另一個位置。把游標放在圖片上。</p>
          </div>

          {projects.map((p, i) => (
            <div key={p.slug} data-skew className="shrink-0">
              <TransitionLink
                href={`/work/${p.slug}`}
                label={p.title}
                data-card
                data-cursor="view"
                className={`gallery-card group block w-full lg:w-[min(34vw,520px)] ${i % 2 ? 'lg:mt-[14vh]' : 'lg:-mt-[10vh]'}`}
              >
                <div className="mb-3 flex items-baseline justify-between overflow-hidden">
                  <span data-meta className="meta block">N°{String(i + 1).padStart(2, '0')}</span>
                  <span data-meta className="meta block text-fog-bone">{p.year}</span>
                </div>
                <div data-fig className="relative aspect-[4/5] overflow-hidden bg-ink">
                  <Image src={p.image} alt={`${p.title} — ${p.discipline}`} fill sizes="(min-width: 1024px) 34vw, 92vw" className="gallery-card__img object-cover" />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4 overflow-hidden">
                  <h3 data-meta className="title block transition-colors group-hover:text-[var(--accent)]" style={{ ['--accent' as string]: p.accent === '#C8FF2E' ? '#5b7a00' : p.accent }}>
                    {p.title}
                  </h3>
                  <span data-meta className="meta block text-fog-bone">{p.discipline}</span>
                </div>
              </TransitionLink>
            </div>
          ))}
          <div className="shrink-0 lg:w-[30vw]">
            <p className="display">
              Keep <em className="emotive">going</em>.
            </p>
            <p className="meta mt-4 text-fog-bone">The strip turns inward →</p>
          </div>
        </div>

        <div aria-hidden className="absolute bottom-8 left-[var(--frame)] right-[calc(var(--frame)+16rem)] z-20 hidden items-center gap-6 lg:flex">
          <span className="meta tabular-nums">
            <span data-g-count>01</span> / {String(projects.length).padStart(2, '0')}
          </span>
          <span className="h-px flex-1 bg-ink/15">
            <span data-g-progress className="block h-px origin-left bg-ink" style={{ transform: 'scaleX(0)' }} />
          </span>
        </div>
      </div>
    </section>
  )
}
