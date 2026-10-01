import { useEffect, useState } from 'react'

/** Longest step a single frame may take, so a slow device plays every phase instead of skipping to the end. */
const MAX_FRAME_MS = 100

/** Counts from 0 to 100 over `durationMs` while `running`, for simulated scans. */
export function useProgress(durationMs: number, running: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!running) return
    let elapsed = 0
    let last = performance.now()
    let frame = 0
    const tick = (t: number) => {
      elapsed += Math.min(MAX_FRAME_MS, Math.max(0, t - last))
      last = t
      const v = Math.min(100, (elapsed / durationMs) * 100)
      setValue(v)
      if (v < 100) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [durationMs, running])
  return running ? value : 0
}
