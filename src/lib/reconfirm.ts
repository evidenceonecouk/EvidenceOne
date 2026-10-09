import type { AcspMonitoring, ISODate } from '@/types/domain'

/* Each ACSP reconfirms its regulatory information every 12 months (proposed). */

const DAY = 24 * 60 * 60 * 1000

export interface ReconfirmStatus {
  /** Whole days until the due date. Negative when overdue. */
  days: number
  overdue: boolean
  /** Within 30 days of the due date, or past it. */
  needsAction: boolean
}

export function reconfirmStatus(
  m: AcspMonitoring,
  now = Date.now(),
): ReconfirmStatus {
  const days = Math.ceil(
    (new Date(m.nextReconfirmationDue).getTime() - now) / DAY,
  )
  return { days, overdue: days < 0, needsAction: days <= 30 }
}

/** The next due date: 12 months after the reconfirmation. */
export function addTwelveMonths(iso: ISODate): ISODate {
  const d = new Date(iso)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString()
}
