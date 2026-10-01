import { useLayoutEffect, useRef, useState } from 'react'

/** Scales a fixed-size composition down to fit its container, never up. */
export function useFitScale<T extends HTMLElement>(baseWidth: number) {
  const ref = useRef<T>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) =>
      setScale(Math.min(1, entry.contentRect.width / baseWidth)),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [baseWidth])
  return { ref, scale }
}
