import type { Person, RegisterEntry } from '@/types/domain'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "REID, Imogen Clare" becomes "IMOGEN CLARE REID", the order names appear on a document. */
export function registerNameToDocumentOrder(registerName: string): string {
  const [family, given = ''] = registerName.split(',').map((x) => x.trim())
  return `${given} ${family}`.trim().toUpperCase()
}

/**
  Name normalisation from rule set Part 2.3, and nothing else: case is ignored,
  leading, trailing and repeated spaces are removed, and every typographic form
  of hyphen and apostrophe counts as the same character. Accents, initials,
  shortened names, name order and transliteration all remain differences.
*/
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE63\uFF0D]/g, '-')
    .replace(/[\u2018\u2019\u201B\u02BC\u02B9\u0060\u00B4\uFF07]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export const NORMALISATION_NOTE =
  'Compared after normalisation only: case, spacing, and hyphen and apostrophe forms. Any other difference halts the case and raises a register correction in Route B.'

export function monthYear(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** True when the person moved within the address history period, so the identity document alone cannot confirm it. */
export function movedWithin(
  person: Person,
  months: number,
  now = Date.now(),
): boolean {
  const since = new Date(now)
  since.setMonth(since.getMonth() - months)
  const current = person.addressHistory.find((a) => !a.to)
  return !!current && new Date(current.from).getTime() > since.getTime()
}

/** True when the dated address periods cover the whole history period with no gap. */
export function historyCovers(
  person: Person,
  months: number,
  now = Date.now(),
): boolean {
  const since = new Date(now)
  since.setMonth(since.getMonth() - months)
  const periods = [...person.addressHistory].sort((a, b) =>
    b.from.localeCompare(a.from),
  )
  let edge = now
  for (const p of periods) {
    const to = p.to ? new Date(p.to).getTime() + 2 * 86400000 : now
    if (to < edge) return false
    edge = new Date(p.from).getTime()
    if (edge <= since.getTime()) return true
  }
  return false
}

export const registerOrder = (entry: RegisterEntry) =>
  registerNameToDocumentOrder(entry.registerName)
