'use client'
import Image from 'next/image'
import { gsap, SplitText } from '@/motion/gsap'
import { useSection } from '@/hooks/useSection'
import type { Project } from '@/content/projects'
import { allImages } from '@/content/projects'
import { TransitionLink } from '@/components/motion/TransitionLink'

/** Work detail route — demonstrates route transitions + enter animations on a second page. */
export function WorkDetail({ project: p, next }: { project: Project; next: Project }) {
  const root = useSection<HTMLElement>(({ reduced, q }) => {
    const title = SplitText.create(q('[data-w-title]')[0], { type: 'words,chars', mask: 'chars', charsClass: 'ch' })
    if (reduced) return () => title.revert()
    gsap
      .timeline({ delay: 0.35 })
      .from(title.chars, { yPercent: 110, stagger: 0.035, duration: 1.1, ease: 'expo.out' })
      .from(q('[data-w-up]'), { yPercent: 110, stagger: 0.06, duration: 0.9, ease: 'expo.out' }, 0.3)
      .fromTo(q('[data-w-hero]'), { clipPath: 'inset(30% 20% 30% 20%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.1)
      .fromTo(q('[data-w-hero] img'), { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.1)
    gsap.fromTo(q('[data-w-hero] img'), { yPercent: 0 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: q('[data-w-hero]')[0], start: 'top top', end: 'bottom top', scrub: true } })
    q('[data-w-img]').forEach((f) =>
      gsap.fromTo(f, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out', scrollTrigger: { trigger: f, start: 'top 90%', end: 'top 40%', scrub: 0.6 } }),
    )
    gsap.from(q('[data-w-next]'), { yPercent: 40, ease: 'none', scrollTrigger: { trigger: q('[data-w-next]')[0], start: 'top bottom', end: 'top 40%', scrub: 0.6 } })
    return () => title.revert()
  })
  const others = allImages.filter((s) => s !== p.image).slice(0, 2)

  return (
    <article ref={root} data-angle-start="0" data-angle-end="360" data-angle-label={p.title} className="bg-ink text-bone">
      <header className="frame-x pb-10 pt-36 md:pt-44">
        <div className="mask">
          <p data-w-up className="meta text-fog-ink">
            Work — {p.discipline} — {p.year}
          </p>
        </div>
        <h1 data-w-title className="mega mt-6 leading-[0.85]">
          {p.title}
        </h1>
      </header>
      <div data-w-hero className="relative mx-[var(--frame)] aspect-[16/10] overflow-hidden md:aspect-[21/9]">
        <Image src={p.image} alt={p.title} fill priority sizes="100vw" className="object-cover" />
      </div>
      <section className="frame-x grid gap-10 py-24 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="mask">
            <p data-w-up className="meta text-signal">Brief</p>
          </div>
          <p className="title mt-4">{p.summary}</p>
          <p className="zh mt-4 text-fog-ink">{p.summaryZh}</p>
        </div>
        <dl className="meta grid grid-cols-2 gap-y-4 md:col-span-5 md:col-start-8">
          <dt className="text-fog-ink">Discipline</dt>
          <dd>{p.discipline}</dd>
          <dt className="text-fog-ink">Year</dt>
          <dd>{p.year}</dd>
          <dt className="text-fog-ink">Surfaces</dt>
          <dd>1</dd>
          <dt className="text-fog-ink">Ends</dt>
          <dd>0</dd>
        </dl>
      </section>
      <section className="frame-x grid gap-6 pb-24 md:grid-cols-2">
        {others.map((src, i) => (
          <figure key={src} data-w-img className={`relative aspect-[4/5] overflow-hidden ${i ? 'md:mt-40' : ''}`}>
            <Image src={src} alt="" fill sizes="50vw" className="object-cover" />
          </figure>
        ))}
      </section>
      <TransitionLink href={`/work/${next.slug}`} label={next.title} data-cursor="view" className="group block overflow-hidden border-t border-bone/15">
        <div data-w-next className="frame-x flex items-end justify-between gap-6 py-24">
          <div>
            <p className="meta text-fog-ink">Next on the strip →</p>
            <p className="mega mt-4 leading-[0.85] transition-colors group-hover:text-signal">{next.title}</p>
          </div>
          <div className="relative hidden aspect-[4/5] w-48 overflow-hidden md:block">
            <Image src={next.image} alt="" fill sizes="200px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
          </div>
        </div>
      </TransitionLink>
      <div className="frame-x pb-20">
        <TransitionLink href="/#work" label="All work" className="meta nav-link">
          ← Back to the other side
        </TransitionLink>
      </div>
    </article>
  )
}
