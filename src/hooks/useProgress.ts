import { useEffect, useState } from 'react'

/** Counts from 0 to 100 over `durationMs` while `running`, for simulated scans. */
export function useProgress(durationMs: number, running: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!running) return
    const start = performance.now()
    let frame = 0
    const tick = (t: number) => {
      const v = Math.min(100, ((t - start) / durationMs) * 100)
      setValue(v)
      if (v < 100) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [durationMs, running])
  return running ? value : 0
}
