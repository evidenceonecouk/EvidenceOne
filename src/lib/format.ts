import type { Address, ISODate } from '@/types/domain'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export const VERIFICATION_FEE = 49
export const SLA_HOURS = 36
export const RETENTION_YEARS = 7

export function formatDate(iso: ISODate): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(iso: ISODate): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: ISODate): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date}, ${time}`
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatAddress(a: Address): string {
  return [
    a.line1,
    a.line2,
    a.town,
    a.postcode,
    a.country === 'United Kingdom' ? undefined : a.country,
  ]
    .filter(Boolean)
    .join(', ')
}

/** Retention runs seven years from the reviewer decision timestamp. */
export function retentionExpiry(decidedAt: ISODate): ISODate {
  const d = new Date(decidedAt)
  d.setFullYear(d.getFullYear() + RETENTION_YEARS)
  return d.toISOString()
}

export function addHours(iso: ISODate, hours: number): ISODate {
  return new Date(new Date(iso).getTime() + hours * HOUR).toISOString()
}

export function addDays(iso: ISODate, days: number): ISODate {
  return new Date(new Date(iso).getTime() + days * DAY).toISOString()
}

/** Remaining time until a deadline, for SLA countdowns. */
export function timeRemaining(dueIso: ISODate, now = Date.now()) {
  const ms = new Date(dueIso).getTime() - now
  const overdue = ms < 0
  const abs = Math.abs(ms)
  const hours = Math.floor(abs / HOUR)
  const minutes = Math.floor((abs % HOUR) / 60000)
  return {
    ms,
    overdue,
    hours,
    minutes,
    label: `${hours}h ${String(minutes).padStart(2, '0')}m`,
  }
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 4)}…${hash.slice(-4)}`
}

export function fullName(p: {
  title?: string
  givenNames: string
  familyName: string
}): string {
  return `${p.givenNames} ${p.familyName}`
}

export function initials(p: {
  givenNames: string
  familyName: string
}): string {
  return `${p.givenNames[0] ?? ''}${p.familyName[0] ?? ''}`.toUpperCase()
}

export function timeAgo(iso: ISODate, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatShortDate(iso)
}
