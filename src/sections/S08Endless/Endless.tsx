'use client'
import Image from 'next/image'
import { Marquee } from '@/components/motion/Marquee'
import { InfiniteCarousel } from '@/components/motion/InfiniteCarousel'
import { projects, allImages } from '@/content/projects'

const WORDS = ['Endless', 'Seamless', 'Infinite', 'Looping', 'Ceaseless']

/**
 * 07 ENDLESS — multi-directional marquees (rows + crossing tapes), velocity-driven,
 * direction-aware, and an infinite draggable 3D carousel.
 */
export function Endless() {
  return (
    <section
      id="endless"
      data-angle-start="270"
      data-angle-end="300"
      data-angle-label="Endless"
      aria-labelledby="endless-title"
      className="relative overflow-hidden bg-bone py-28 text-ink"
    >
      <div className="frame-x mb-12 flex items-end justify-between gap-6">
        <div>
          <p className="meta mb-4 text-fog-bone">N°07 — Endless · ∞</p>
          <h2 id="endless-title" className="display">
            No <em className="emotive">seams</em>.
          </h2>
        </div>
        <p className="zh max-w-[26ch] text-right text-fog-bone">捲得越快，它跑得越快；換個方向，它也跟著回頭。</p>
      </div>

      <Marquee speed={70} direction={1} velocityFactor={0.08}>
        {WORDS.map((w, i) => (
          <span key={w} className="mega flex items-center whitespace-nowrap pr-[4vw] leading-[0.95]">
            <span className={i % 2 ? 'word--outline-ink' : ''}>{w}</span>
            <span className="emotive ml-[4vw] text-[0.6em] text-fog-bone">∞</span>
          </span>
        ))}
      </Marquee>

      <Marquee speed={50} direction={-1} velocityFactor={0.1} hoverSlow={0.15} className="my-8" repeat={3}>
        {allImages.map((src, i) => (
          <div key={src} className="marquee-img group relative mr-4 aspect-[4/5] w-[clamp(140px,16vw,240px)] overflow-hidden bg-ink">
            <Image src={src} alt="" fill sizes="240px" className="object-cover grayscale transition duration-700 group-hover:scale-110 group-hover:grayscale-0" />
            <span className="meta absolute bottom-2 left-2 text-bone mix-blend-difference">{String(i + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </Marquee>

      <Marquee speed={120} direction={1} velocityFactor={0.12} skew={false}>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="meta whitespace-nowrap pr-10 text-fog-bone">
            0{i}° — SURFACE 1 — EDGE 1 — END 0 — LAP ∞ —
          </span>
        ))}
      </Marquee>

      {/* crossing tapes: two bands moving in opposite directions at opposite angles */}
      <div aria-hidden className="relative my-24 h-48">
        <div className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 rotate-[-5deg] bg-ink py-3 text-bone">
          <Marquee speed={90} direction={1} skew={false}>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="title whitespace-nowrap pr-12">
                Keep scrolling <span className="text-signal">∞</span>
              </span>
            ))}
          </Marquee>
        </div>
        <div className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 rotate-[4deg] bg-signal py-3 text-ink">
          <Marquee speed={90} direction={-1} skew={false}>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="title whitespace-nowrap pr-12">
                It never ends ∞
              </span>
            ))}
          </Marquee>
        </div>
      </div>

      <div className="bg-ink py-16 text-bone">
        <div className="frame-x mb-8 flex items-baseline justify-between">
          <p className="meta text-fog-ink">Infinite carousel — drag · ← →</p>
          <p className="meta text-fog-ink">{projects.length} / ∞</p>
        </div>
        <InfiniteCarousel items={projects} />
      </div>
    </section>
  )
}
