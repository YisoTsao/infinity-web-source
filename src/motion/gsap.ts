'use client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { useGSAP } from '@gsap/react'
import { LOOP_EASE_PATH } from './config'

let registered = false
if (typeof window !== 'undefined' && !registered) {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase, ScrambleTextPlugin, MorphSVGPlugin)
  CustomEase.create('loop', LOOP_EASE_PATH)
  registered = true
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
