import type { Metadata } from 'next'
import { Cosmos } from '@/sections/Cosmos/Cosmos'

export const metadata: Metadata = {
  title: 'ORBIT ∞ — INFINITY',
  description: 'An endless scroll through the solar system: nine planets, meteors, a warp jump, and back again.',
}

export default function CosmosPage() {
  return <Cosmos />
}
