import { createContext, useContext } from 'react'
import type { StepId } from './journey'

/*
  The same journey is shown in a mobile browser frame or as a normal page in a
  desktop browser. Both are first-class. Steps read the mode through
  useJourneyView() when they need to word something differently.
*/
export type JourneyMode = 'mobile' | 'desktop'

export interface JourneyViewValue {
  mode: JourneyMode
  stepId?: StepId
}

export const JourneyViewContext = createContext<JourneyViewValue>({
  mode: 'mobile',
})

export const useJourneyView = () => useContext(JourneyViewContext)

const KEY = 'evidenceone.journeyView'

export function initialMode(search: string): JourneyMode {
  const q = new URLSearchParams(search).get('view')
  if (q === 'desktop' || q === 'mobile') return q
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'desktop' || saved === 'mobile') return saved
  } catch {
    // Storage can be unavailable; the default applies.
  }
  return 'mobile'
}

export function rememberMode(mode: JourneyMode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // Not essential.
  }
}
