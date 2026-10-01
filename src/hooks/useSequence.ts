import { useEffect, useState } from 'react'

/**
 * Steps through a scripted sequence while `running`: returns the index of the
 * current beat, then `durations.length` once the last beat has finished.
 * Returns -1 while not running. `durations` must be a stable array.
 */
export function useSequence(durations: readonly number[], running: boolean) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!running || index >= durations.length) return
    const id = window.setTimeout(() => setIndex((i) => i + 1), durations[index])
    return () => window.clearTimeout(id)
  }, [running, index, durations])
  return running ? index : -1
}
