import type { AcspFirm } from '@/types/domain'

/*
  Companies House publishes lists of ACSPs as files. There is no API. The demo
  works with synthetic lists only: the platform compares names after
  normalisation of case, spacing, punctuation and ampersands, and an
  administrator confirms every match.
*/

/** Name comparison key: case, spacing, hyphens, apostrophes, punctuation and "&" are ignored. */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\blimited\b/g, 'ltd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const sameName = (a: string, b: string) =>
  normaliseName(a) === normaliseName(b) && normaliseName(a) !== ''

/** Splits one CSV line, honouring double quotes. */
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

/** Reads the firm names from a synthetic ACSP list. The name column is the one headed name, otherwise the first. */
export function parseAcspCsv(text: string): string[] {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim())
  if (!lines.length) return []
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
  const nameCol = Math.max(
    0,
    header.findIndex((h) => /name|firm|acsp/.test(h) && !/number|ref/.test(h)),
  )
  const hasHeader = header.some((h) => /name|firm|acsp|number|status/.test(h))
  return (hasHeader ? lines.slice(1) : lines)
    .map((l) => splitCsvLine(l)[nameCol] ?? '')
    .filter(Boolean)
}

/** Synthetic filler firms that appear on a published list but are not on the platform. */
const FILLER = [
  'BRIGHTWATER CORPORATE SERVICES LTD',
  'MERRION & COLE LEGAL LLP',
  'TALBOT STREET ACCOUNTANTS LTD',
  'WESTGATE TRUST COMPANY LIMITED',
  'ROWAN HILL ADVISORY LLP',
  'CALDER & WREN COMPLIANCE LTD',
]

/**
  A synthetic Companies House ACSP list for the demo. Platform firms appear in
  the published style (capitals, no commas) so the normalised match is visible.
  One platform firm that is still waiting to be listed is left out, so the
  cross-check has a name to report as not found.
*/
export function sampleAcspCsv(acsps: AcspFirm[]): string {
  const listed = acsps
    .filter((a) => a.status === 'active')
    .map((a) => ({
      name: a.name.replace(/,/g, '').toUpperCase(),
      number: a.acspNumber,
    }))
  const rows = [
    ...listed.map((l) => `"${l.name}",${l.number},Registered`),
    ...FILLER.map(
      (n, i) => `"${n}",ACSP-09${i}${i + 3}-${4100 + i * 37},Registered`,
    ),
  ]
  return ['ACSP name,ACSP number,Status', ...rows].join('\n')
}

/** An ACSP not on the published list has 3 months to register (M4, decided 19 October). */
export const REGISTER_PERIOD_MONTHS = 3

/** The date by which a Not yet listed ACSP should appear on the published list. */
export function registerDeadline(acsp: AcspFirm): Date | undefined {
  const since = acsp.monitoring.notYetListedSince
  if (acsp.status !== 'not_yet_listed' || !since) return undefined
  const d = new Date(since)
  d.setMonth(d.getMonth() + REGISTER_PERIOD_MONTHS)
  return d
}

/** Whole days left to register, never below zero. */
export function registerDaysLeft(
  acsp: AcspFirm,
  now = Date.now(),
): number | undefined {
  const due = registerDeadline(acsp)
  if (!due) return undefined
  return Math.max(0, Math.ceil((due.getTime() - now) / 86_400_000))
}

/** "Time to register: 3 months. 56 days left, by 18 December 2026." */
export function registerCountdownText(acsp: AcspFirm, now = Date.now()) {
  const due = registerDeadline(acsp)
  const left = registerDaysLeft(acsp, now)
  if (!due || left === undefined)
    return `Time to register: ${REGISTER_PERIOD_MONTHS} months.`
  const date = due.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `Time to register: ${REGISTER_PERIOD_MONTHS} months. ${left} day${left === 1 ? '' : 's'} left, by ${date}.`
}
