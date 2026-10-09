/* Simulated capture timings for the photo page scan. */

export type ScanPhase =
  | 'idle'
  | 'align'
  | 'page'
  | 'mrz'
  | 'front'
  | 'turn'
  | 'back'
  | 'capture'
  | 'done'

/** Simulated scan timings: a passport photo page, or both sides of a card. */
export const scanDuration = (isPassport: boolean) => (isPassport ? 4200 : 6200)

export function scanPhase(
  progress: number,
  isPassport: boolean,
  running: boolean,
  done: boolean,
): ScanPhase {
  if (done) return 'done'
  if (!running) return 'idle'
  if (isPassport)
    return progress < 12
      ? 'align'
      : progress < 55
        ? 'page'
        : progress < 92
          ? 'mrz'
          : 'capture'
  return progress < 8
    ? 'align'
    : progress < 38
      ? 'front'
      : progress < 56
        ? 'turn'
        : progress < 92
          ? 'back'
          : 'capture'
}
