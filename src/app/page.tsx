import { Origin } from '@/sections/S01Origin/Origin'
import { Manifesto } from '@/sections/S02Manifesto/Manifesto'
import { TheObject } from '@/sections/S03Object/TheObject'
import { Depth } from '@/sections/S04Depth/Depth'
import { Gallery } from '@/sections/S05Gallery/Gallery'
import { Forms } from '@/sections/S06Forms/Forms'
import { Inside } from '@/sections/S07Inside/Inside'
import { Endless } from '@/sections/S08Endless/Endless'
import { Process } from '@/sections/S09Process/Process'
import { LoopBack } from '@/sections/S10LoopBack/LoopBack'

/** One lap of the Möbius strip: 0° → 360°, and the last frame is the first. */
export default function Home() {
  return (
    <>
      <Origin />
      <Manifesto />
      <TheObject />
      <Depth />
      <Gallery />
      <Forms />
      <Inside />
      <Endless />
      <Process />
      <LoopBack />
    </>
  )
}
