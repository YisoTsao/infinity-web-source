'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from '@/providers/TransitionProvider'

type Props = React.ComponentProps<typeof Link> & { label?: string }

/** Keeps native behaviour for new-tab clicks; otherwise plays the cover transition. */
export function TransitionLink({ href, label, onClick, onMouseEnter, ...rest }: Props) {
  const { navigate } = useTransition()
  const router = useRouter()
  const h = typeof href === 'string' ? href : href.pathname ?? '/'
  return (
    <Link
      href={href}
      {...rest}
      onMouseEnter={(e) => {
        if (!h.startsWith('#')) router.prefetch(h)
        onMouseEnter?.(e)
      }}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        navigate(h, label)
      }}
    />
  )
}
