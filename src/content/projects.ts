import { asset } from '@/lib/asset'

export type Project = {
  slug: string
  title: string
  year: string
  discipline: string
  accent: string
  image: string
  summary: string
  summaryZh: string
}

export const projects: Project[] = [
  { slug: 'halo-index', title: 'Halo Index', year: '2026', discipline: 'WebGL · Identity', accent: '#C8FF2E', image: asset('/works/w01.jpg'), summary: 'A living index of light paths, grown from a single flow field.', summaryZh: '從單一流場長出來的光路索引。' },
  { slug: 'null-orchard', title: 'Null Orchard', year: '2026', discipline: 'Installation', accent: '#FF4A1C', image: asset('/works/w02.jpg'), summary: 'Ninety rings, each twisted a little further than the last.', summaryZh: '九十個圓環，每一個都比上一個多扭轉一點。' },
  { slug: 'paper-comet', title: 'Paper Comet', year: '2025', discipline: 'Print · Motion', accent: '#2D4BFF', image: asset('/works/w03.jpg'), summary: 'Halftone gravity — a sphere that only exists between dots.', summaryZh: '半色調的重力：一顆只存在於網點之間的球。' },
  { slug: 'soft-engine', title: 'Soft Engine', year: '2025', discipline: 'Generative', accent: '#8A6CFF', image: asset('/works/w04.jpg'), summary: 'Op-art waves tuned to the rhythm of a scroll wheel.', summaryZh: '依滾輪節奏調校的歐普藝術波紋。' },
  { slug: 'tide-atlas', title: 'Tide Atlas', year: '2025', discipline: 'Data · Web', accent: '#C9B79C', image: asset('/works/w05.jpg'), summary: 'Two tides of circles interfering into a third, invisible one.', summaryZh: '兩組圓的潮汐，干涉出第三組看不見的圓。' },
  { slug: 'mono-bloom', title: 'Mono Bloom', year: '2024', discipline: 'Brand System', accent: '#C8FF2E', image: asset('/works/w07.jpg'), summary: 'A brand that blooms from heat, not from colour.', summaryZh: '一個從熱度、而不是從顏色綻放的品牌。' },
  { slug: 'quiet-spiral', title: 'Quiet Spiral', year: '2024', discipline: 'Sound · Visual', accent: '#FF4A1C', image: asset('/works/w08.jpg'), summary: 'Nine thousand points following the golden angle home.', summaryZh: '九千個點沿著黃金角回家。' },
  { slug: 'signal-bars', title: 'Signal Bars', year: '2024', discipline: 'Editorial', accent: '#8A6CFF', image: asset('/works/w09.jpg'), summary: 'A poster that is also an equaliser that is also a skyline.', summaryZh: '一張海報，也是等化器，也是天際線。' },
  { slug: 'orbit-lace', title: 'Orbit Lace', year: '2023', discipline: 'WebGL', accent: '#C8FF2E', image: asset('/works/w10.jpg'), summary: 'Lemniscates woven into lace, one rotation at a time.', summaryZh: '一次一點旋轉，把 ∞ 編織成蕾絲。' },
  { slug: 'drift-paper', title: 'Drift Paper', year: '2023', discipline: 'Print', accent: '#FF4A1C', image: asset('/works/w11.jpg'), summary: 'Ink currents on bone paper, mapped by hand and by noise.', summaryZh: '骨白紙上的墨流，由手與噪聲共同繪製。' },
]

export const extraImages = [asset('/works/w06.jpg'), asset('/works/w12.jpg')]
export const allImages = [...projects.map((p) => p.image), ...extraImages]
export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
export const nextProject = (slug: string) => {
  const i = projects.findIndex((p) => p.slug === slug)
  return projects[(i + 1) % projects.length]
}
