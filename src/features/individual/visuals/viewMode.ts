import { useEffect, useState } from 'react'

export type ViewMode = 'mobile' | 'desktop'

const QUERY = '(max-width: 640px)'

/**
  Whether the journey is shown as a mobile browser or a desktop browser. The
  journey shell passes `viewMode` when it has a toggle; without it the window
  width decides.
*/
export function useViewMode(viewMode?: ViewMode): ViewMode {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return viewMode ?? (narrow ? 'mobile' : 'desktop')
}
