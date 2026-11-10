import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { projects, getProject, nextProject } from '@/content/projects'
import { WorkDetail } from '@/sections/Work/WorkDetail'

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = getProject(slug)
  return { title: p ? `${p.title} — INFINITY` : 'INFINITY' }
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) notFound()
  return <WorkDetail project={project} next={nextProject(slug)} />
}
