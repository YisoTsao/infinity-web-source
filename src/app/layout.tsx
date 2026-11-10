import type { Metadata, Viewport } from 'next'
import { Syne, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import 'lenis/dist/lenis.css'
import './globals.css'
import { AppProviders } from '@/providers/AppProviders'
import { Nav } from '@/components/layout/Nav'
import { AngleMeter } from '@/components/layout/AngleMeter'
import { GrainOverlay } from '@/components/overlay/GrainOverlay'
import { Cursor } from '@/components/cursor/Cursor'
import { TransitionProvider } from '@/providers/TransitionProvider'
import { MenuOverlay } from '@/components/layout/MenuOverlay'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-iserif', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: '500', variable: '--font-jbmono', display: 'swap' })

export const metadata: Metadata = {
  title: 'INFINITY — Things that never end',
  description: 'An experimental creative studio. Scroll is a loop, not a line.',
}

export const viewport: Viewport = { themeColor: '#0B0B0D' }

// Adds .intro-pending before first paint so entrance targets start hidden (no flash).
const PRE_PAINT = `document.documentElement.classList.add('js','intro-pending')`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
      </head>
      <body>
        <a href="#content" className="skip-link meta">
          Skip to content
        </a>
        <AppProviders>
          <TransitionProvider>
            <Nav />
            <MenuOverlay />
            <main id="content">{children}</main>
            <AngleMeter />
            <GrainOverlay />
            <Cursor />
          </TransitionProvider>
        </AppProviders>
      </body>
    </html>
  )
}
