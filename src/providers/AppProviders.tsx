'use client'
import { CapabilitiesProvider } from './CapabilitiesProvider'
import { SmoothScrollProvider } from './SmoothScrollProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CapabilitiesProvider>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </CapabilitiesProvider>
  )
}
