import { hasChipStep } from '@/lib/chip'
import { formatDate } from '@/lib/format'
import {
  monthYear,
  normaliseName,
  registerNameToDocumentOrder,
} from '@/lib/register'
import { currentRuleSet } from '@/lib/rules'
import type {
  DemoData,
  IdDocument,
  IdDocumentType,
  Person,
  RegisterEntry,
  VerificationCase,
} from '@/types/domain'

/*
  Deterministic helpers for the identity step: what the checks show, whether a
  document needs replacing, and where the person's details differ from the
  register. Nothing here uses AI, and nothing here is applied by AI to the
  identity document itself.
*/

export interface RegisterDifference {
  field: 'Name' | 'Date of birth' | 'Nationality' | 'Transliteration'
  ruleId: 'REG-11' | 'REG-12' | 'REG-13'
  document: string
  register: string
  /** For example "AIDAN on the document, AIDEN on the register". */
  summary: string
}

/** First differing word, for example "AIDAN on the document, AIDEN on the register". */
function wordDifference(docName: string, regName: string): string {
  const a = normaliseName(docName).split(' ')
  const b = normaliseName(regName).split(' ')
  const i = a.findIndex((w, k) => w !== b[k])
  if (i < 0)
    return `${docName} on the document, ${regName} on the register (different length)`
  return `${a[i].toUpperCase()} on the document, ${(b[i] ?? '').toUpperCase() || 'nothing'} on the register`
}

/**
  Differences between the verified document details and the register, after
  normalisation of case, spacing, hyphens and apostrophes only (G2-10). A
  difference is flagged to the reviewer. It never halts the case.
*/
export function computeRegisterDifferences(
  person: Person,
  doc: IdDocument | undefined,
  entry: RegisterEntry,
): RegisterDifference[] {
  if (!doc) return []
  const out: RegisterDifference[] = []
  const regName = registerNameToDocumentOrder(entry.registerName)
  if (normaliseName(regName) !== normaliseName(doc.nameOnDocument)) {
    const transliteration = !!doc.nonLatinName
    out.push({
      field: transliteration ? 'Transliteration' : 'Name',
      ruleId: 'REG-11',
      document: doc.nameOnDocument,
      register: regName,
      summary: `${transliteration ? 'Transliteration' : 'Name'}: ${wordDifference(doc.nameOnDocument, regName)}`,
    })
  }
  if (monthYear(doc.dobOnDocument) !== entry.registerDobMonthYear)
    out.push({
      field: 'Date of birth',
      ruleId: 'REG-12',
      document: monthYear(doc.dobOnDocument),
      register: entry.registerDobMonthYear,
      summary: `Date of birth: ${monthYear(doc.dobOnDocument)} on the document, ${entry.registerDobMonthYear} on the register`,
    })
  const nat = doc.nationalityOnDocument ?? person.nationality
  if (normaliseName(nat) !== normaliseName(entry.registerNationality))
    out.push({
      field: 'Nationality',
      ruleId: 'REG-13',
      document: nat,
      register: entry.registerNationality,
      summary: `Nationality: ${nat} on the document, ${entry.registerNationality} on the register`,
    })
  return out
}

export type ChecksOutcome =
  /** Nothing further is needed from the person. */
  | 'clear'
  /** DOC-EXP-01 to DOC-EXP-03: the document is expired and another document is asked for. */
  | 'expired'

export type CheckRowState = 'passed' | 'not_switched_on' | 'flagged'

export interface CheckRow {
  key:
    'document' | 'chip' | 'liveness' | 'face' | 'pep' | 'address' | 'register'
  label: string
  by: string
  state: CheckRowState
  /** Plain-language detail shown once the row resolves. */
  note?: string
}

export interface ChecksPlan {
  outcome: ChecksOutcome
  rows: CheckRow[]
  differences: RegisterDifference[]
  expiry?: { on: string; monthsExpired: number; passport: boolean }
  attempts: number
  maxAttempts: number
}

const PROVIDER = 'Certified identity provider'

/** Documents a person may use where a case must move to a different Option 1 document. */
export const DOCUMENT_LABEL: Record<IdDocumentType, string> = {
  passport: 'Passport',
  driving_licence: 'UK photocard driving licence',
  national_identity_card: 'National identity card',
  biometric_residence_permit: 'Biometric residence permit',
}

/**
  What the checks show for this case. Pure and deterministic: the same case and
  rule set always give the same rows and the same outcome.
*/
export function planChecks(
  data: DemoData,
  vc: VerificationCase,
  now = Date.now(),
): ChecksPlan {
  const rs = currentRuleSet(data)
  const person = data.people.find((p) => p.id === vc.personId)
  const entry = data.register.find(
    (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
  )
  const acsp = data.acsps.find((a) => a.id === vc.acspId)
  const type = vc.journey?.documentType ?? 'passport'
  const doc = person?.document?.type === type ? person.document : undefined
  const differences =
    person && entry ? computeRegisterDifferences(person, doc, entry) : []

  let expiry: ChecksPlan['expiry']
  if (doc && new Date(doc.expiresOn).getTime() < now) {
    const months = Math.max(
      0,
      Math.floor(
        (now - new Date(doc.expiresOn).getTime()) / (30.44 * 86400000),
      ),
    )
    expiry = {
      on: doc.expiresOn,
      monthsExpired: months,
      passport: type === 'passport',
    }
  }
  const tolerance =
    type === 'passport'
      ? rs.params.passport_expiry_option1
      : type === 'biometric_residence_permit'
        ? rs.params.brp_expiry
        : 0
  // An expired passport is not accepted (H1, decided 19 October).
  const expiredBeyond =
    !!expiry && (type === 'passport' || expiry.monthsExpired > tolerance)

  const chip = hasChipStep(doc, type)
    ? (vc.journey?.chipResult ?? 'read')
    : undefined
  const pepOn = !!acsp?.profile.pepScreening
  const ukResident =
    person?.addressHistory.find((a) => !a.to)?.address.country ===
    'United Kingdom'
  const addressOn = !!acsp?.profile.addressCheck && ukResident
  const rows: CheckRow[] = [
    {
      key: 'document',
      label: 'Document is genuine, security features checked',
      by: PROVIDER,
      state: 'passed',
    },
    ...(chip
      ? [
          chip === 'read'
            ? {
                key: 'chip' as const,
                label: 'Chip read',
                by: 'The identity provider’s chip reader',
                state: 'passed' as const,
              }
            : {
                key: 'chip' as const,
                label: 'No chip read',
                by: 'Recorded on your case',
                state: 'flagged' as const,
                note: 'The chip was not read. This does not stop your case. Your ACSP’s reviewer will decide.',
              },
        ]
      : []),
    {
      key: 'liveness',
      label: 'You are a live person',
      by: PROVIDER,
      state: 'passed',
    },
    {
      key: 'face',
      label: 'Your face matches the document',
      by: PROVIDER,
      state: 'passed',
    },
    pepOn
      ? {
          key: 'pep',
          label: 'PEP and sanctions screening',
          by: PROVIDER,
          state: 'passed',
        }
      : {
          key: 'pep',
          label: 'PEP and sanctions screening',
          by: 'Not switched on for this ACSP',
          state: 'not_switched_on',
        },
    ...(addressOn
      ? [
          {
            key: 'address' as const,
            label: 'Electronic address check',
            by: PROVIDER,
            state: 'passed' as const,
          },
        ]
      : []),
    {
      key: 'register',
      label: 'Details compared with the register',
      by: 'Evidence One rules, the same way every time',
      state: differences.length ? 'flagged' : 'passed',
      note: differences.length
        ? 'One detail is different from the register. This does not stop your case. Your ACSP’s reviewer will look at it.'
        : undefined,
    },
  ]
  return {
    outcome: expiredBeyond ? 'expired' : 'clear',
    rows,
    differences,
    expiry,
    attempts: vc.journey?.checkAttempts ?? 0,
    maxAttempts: rs.params.idvt_attempts,
  }
}

const adjectives: Record<string, string> = {
  'United Kingdom': 'UK',
  Ireland: 'Irish',
  Sweden: 'Swedish',
  Ukraine: 'Ukrainian',
}

/** For example "UK passport, captured in the phone's browser". The chip result is recorded separately. */
export function evidenceLabel(
  doc: IdDocument,
  route: 'upload' | 'phone' | 'camera' | undefined,
): string {
  const noun = DOCUMENT_LABEL[doc.type].replace(/^UK /, '').toLowerCase()
  const adj = adjectives[doc.issuingCountry] ?? doc.issuingCountry
  const base =
    doc.type === 'driving_licence'
      ? DOCUMENT_LABEL.driving_licence
      : `${adj} ${noun}`
  const how =
    route === 'upload'
      ? 'uploaded in the browser'
      : route === 'phone'
        ? 'captured in the phone’s browser'
        : 'captured in the browser'
  return `${base}, ${how}`
}

export const expiryText = (iso: string) => formatDate(iso)
