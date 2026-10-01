import type { Person, RegisterComparisonRow, RegisterEntry } from '@/types/domain'
import { formatDate } from './format'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "REID, Imogen Clare" becomes "IMOGEN CLARE REID" for an exact, case-insensitive comparison. */
export function registerNameToDocumentOrder(registerName: string): string {
  const [family, given = ''] = registerName.split(',').map((x) => x.trim())
  return `${given} ${family}`.trim().toUpperCase()
}

export function monthYear(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** Field-by-field comparison of what the person stated, the document and the Companies House register. */
export function compareToRegister(person: Person, entry: RegisterEntry, documentName: string, documentDob: string): RegisterComparisonRow[] {
  const stated = `${person.givenNames} ${person.familyName}`
  const nameMatches = registerNameToDocumentOrder(entry.registerName) === documentName.toUpperCase()
  const dobMatches = monthYear(documentDob) === entry.registerDobMonthYear
  return [
    {
      field: 'Full name',
      stated,
      document: documentName.toUpperCase(),
      register: entry.registerName,
      result: nameMatches ? 'match' : 'mismatch',
      note: nameMatches ? undefined : 'The name on the document does not match the register exactly.',
    },
    {
      field: 'Date of birth',
      stated: formatDate(person.dateOfBirth),
      document: formatDate(documentDob),
      register: entry.registerDobMonthYear,
      result: dobMatches ? 'match' : 'mismatch',
      note: 'The public register shows month and year only.',
    },
  ]
}

/** True when the 12-month address history includes a move, so the identity document alone cannot confirm it. */
export function addressHistoryNeedsEvidence(person: Person, now = Date.now()): boolean {
  const yearAgo = now - 365 * 24 * 60 * 60 * 1000
  const current = person.addressHistory.find((a) => !a.to)
  return !!current && new Date(current.from).getTime() > yearAgo
}
