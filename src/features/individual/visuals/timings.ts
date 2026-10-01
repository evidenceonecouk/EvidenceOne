/* Simulated capture timings for the chip read and the photo page scan. */

export const CHIP_DURATION = 6800

/** Progress points at which each part of the chip has been read. */
export const CHIP_AT = {
  connected: 30,
  signature: 60,
  photo: 85,
  details: 100,
} as const

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
