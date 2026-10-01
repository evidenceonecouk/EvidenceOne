import {
  Check,
  Glasses,
  MoonStar,
  ScanFace,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import type { Pose } from '@/components/visual/Portrait'

export type Tone = 'idle' | 'warn' | 'ok' | 'rec'

export interface Beat {
  ms: number
  prompt: string
  ring: Tone
  pill?: { tone: Exclude<Tone, 'idle'>; icon: LucideIcon; text: string }
  pose: Pose
  dark?: boolean
  /** The light has just been switched on. */
  lightOn?: boolean
  /** How far round the oval the recording has reached by the end of this beat. */
  progress?: number
}

const glasses = {
  tone: 'warn',
  icon: Glasses,
  text: 'Glasses detected',
} as const
const dark = { tone: 'warn', icon: MoonStar, text: 'Too dark' } as const
const rec = { tone: 'rec', icon: ScanFace, text: 'Recording' } as const

/*
  The scripted liveness capture. The person follows each instruction on screen:
  glasses off, more light, look straight, turn left, turn right, blink.
*/
export const livenessBeats: Beat[] = [
  {
    ms: 800,
    prompt: 'Starting the camera',
    ring: 'idle',
    pose: { glasses: true },
  },
  {
    ms: 1400,
    prompt: 'Please take off your glasses',
    ring: 'warn',
    pill: glasses,
    pose: { glasses: true },
  },
  {
    ms: 1000,
    prompt: 'Please take off your glasses',
    ring: 'warn',
    pill: glasses,
    pose: {},
  },
  {
    ms: 800,
    prompt: 'Thank you',
    ring: 'ok',
    pill: { tone: 'ok', icon: Check, text: 'Face clear' },
    pose: {},
  },
  {
    ms: 1500,
    prompt: 'It is too dark. Please turn on a light',
    ring: 'warn',
    pill: dark,
    pose: {},
    dark: true,
  },
  {
    ms: 450,
    prompt: 'It is too dark. Please turn on a light',
    ring: 'warn',
    pill: dark,
    pose: {},
    lightOn: true,
  },
  {
    ms: 800,
    prompt: 'Good light',
    ring: 'ok',
    pill: { tone: 'ok', icon: Sun, text: 'Good light' },
    pose: {},
  },
  {
    ms: 1000,
    prompt: 'Look straight at the camera',
    ring: 'rec',
    pill: rec,
    pose: {},
    progress: 22,
  },
  {
    ms: 1250,
    prompt: 'Turn your head slowly to the left',
    ring: 'rec',
    pill: rec,
    pose: { yaw: -1 },
    progress: 40,
  },
  {
    ms: 750,
    prompt: 'Turn your head slowly to the left',
    ring: 'rec',
    pill: rec,
    pose: {},
    progress: 50,
  },
  {
    ms: 1250,
    prompt: 'Now slowly to the right',
    ring: 'rec',
    pill: rec,
    pose: { yaw: 1 },
    progress: 68,
  },
  {
    ms: 750,
    prompt: 'Now slowly to the right',
    ring: 'rec',
    pill: rec,
    pose: {},
    progress: 78,
  },
  {
    ms: 450,
    prompt: 'Blink once',
    ring: 'rec',
    pill: rec,
    pose: {},
    progress: 86,
  },
  {
    ms: 160,
    prompt: 'Blink once',
    ring: 'rec',
    pill: rec,
    pose: { blink: true },
    progress: 90,
  },
  {
    ms: 600,
    prompt: 'Blink once',
    ring: 'rec',
    pill: rec,
    pose: {},
    progress: 100,
  },
]
export const livenessDurations = livenessBeats.map((b) => b.ms)

const finished: Beat = {
  ms: 0,
  prompt: 'All done',
  ring: 'ok',
  pill: { tone: 'ok', icon: Check, text: 'Recorded' },
  pose: {},
  progress: 100,
}

/** The checklist under the camera, and the beat after which each item is met. */
export const livenessChecks = [
  { label: 'Glasses off', doneAt: 3 },
  { label: 'Good light', doneAt: 6 },
  { label: 'Head turns', doneAt: 12 },
  { label: 'Blink', doneAt: livenessBeats.length },
]

export function livenessBeat(index: number, done: boolean): Beat | undefined {
  if (done) return finished
  return index >= 0
    ? livenessBeats[Math.min(index, livenessBeats.length - 1)]
    : undefined
}
