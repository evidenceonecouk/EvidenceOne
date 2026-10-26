import { PROVIDER_STATUS_LABEL } from '@/lib/payments'
import type {
  AcspFirm,
  AcspStatus,
  DemoData,
  IdDocumentType,
  RegisterRole,
} from '@/types/domain'

/*
  ACSP matching and suggestion. Deterministic: structured criteria, no AI. The
  demo shows the criteria and every ACSP with a pass or fail per criterion and
  the rule ID (MATCH-01 to MATCH-09). An administrator allocates; automatic
  allocation is a later phase. For a B2C client the platform suggests matching
  ACSPs, ranked on clear criteria, each with its own fee and turnaround.
  "Ranked by clear criteria. Not AI."

  Ranking: eligible first (only eligible ACSPs are suggested), then lower fee,
  then shorter turnaround, then more capacity left today, then name.
*/

export interface MatchCriteria {
  residenceCountry: string
  documentType: IdDocumentType
  issuingCountry: string
  role: RegisterRole
  /** Any one of these languages is enough. */
  languages: string[]
  higherRisk: boolean
  /** Maximum turnaround the client or presenter will accept, in hours. */
  maxTurnaroundHours?: number
  /** Require capacity left today. */
  needsCapacityToday: boolean
}

export type MatchRuleId =
  | 'MATCH-01' // ACSP active and reconfirmed
  | 'MATCH-02' // accepting new cases
  | 'MATCH-03' // accepted residence country, not excluded
  | 'MATCH-04' // document type and issuing country
  | 'MATCH-05' // role (director, PSC, proposed director)
  | 'MATCH-06' // language
  | 'MATCH-07' // higher-risk cases
  | 'MATCH-08' // capacity left today and turnaround
  | 'MATCH-09' // payments active (Design, proposed)

export interface CriterionResult {
  ruleId: MatchRuleId
  label: string
  pass: boolean
  /** Plain-English reason, shown to the presenter. */
  reason: string
  /** Set when the criterion passes with a caveat, such as an ACSP that is Not yet listed. */
  caveat?: string
}

export interface AcspMatch {
  acsp: AcspFirm
  eligible: boolean
  results: CriterionResult[]
}

export interface AcspSuggestion {
  acsp: AcspFirm
  /** 1 is the best match. */
  rank: number
  fee: number
  turnaroundHours: number
  /** Why it matches: price, languages, countries, capacity. */
  reasons: string[]
}

/** "Ukrainian passport, resident in the UAE, English or Russian, capacity today, turnaround 24 hours or less." */
export const EXAMPLE_CRITERIA: MatchCriteria = {
  residenceCountry: 'United Arab Emirates',
  documentType: 'passport',
  issuingCountry: 'Ukraine',
  role: 'director',
  languages: ['English', 'Russian'],
  higherRisk: false,
  maxTurnaroundHours: 24,
  needsCapacityToday: true,
}

export const NOT_YET_LISTED_CAVEAT =
  'Not yet listed on the Companies House published list. An administrator confirms the allocation.'

export const acspStatusLabel: Record<AcspStatus, string> = {
  pending_approval: 'Pending approval',
  active: 'Active',
  not_yet_listed: 'Not yet listed',
  suspended: 'Suspended',
  ceased: 'Ceased',
  withdrawn: 'Withdrawn',
}

const docNames: Record<IdDocumentType, string> = {
  passport: 'passport',
  driving_licence: 'photocard driving licence',
  national_identity_card: 'national identity card',
  biometric_residence_permit: 'biometric residence permit',
}
const roleNames: Record<RegisterRole, string> = {
  director: 'director',
  psc: 'PSC',
  director_psc: 'director and PSC',
}

/** Capacity left today for an ACSP. */
export const capacityLeftToday = (acsp: AcspFirm) =>
  Math.max(0, acsp.profile.capacity.perDay - acsp.profile.usedToday)

const list = (xs: string[]) => xs.join(', ')
const ci = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const gbp = (n: number) => `£${n}`

/** Every ACSP with a pass or fail per criterion. Evaluated by rules, never by AI. */
export function matchAcsps(
  data: DemoData,
  criteria: MatchCriteria,
  now = Date.now(),
): AcspMatch[] {
  return data.acsps.map((acsp) => {
    const p = acsp.profile
    const results: CriterionResult[] = []
    const add = (
      ruleId: MatchRuleId,
      label: string,
      pass: boolean,
      reason: string,
      caveat?: string,
    ) => results.push({ ruleId, label, pass, reason, caveat })

    // MATCH-01 status, platform approval, reconfirmation
    const overdue =
      new Date(acsp.monitoring.nextReconfirmationDue).getTime() < now
    const statusOk =
      acsp.status === 'active' || acsp.status === 'not_yet_listed'
    const approved = acsp.approval === 'approved'
    const ok01 = statusOk && approved && !overdue
    add(
      'MATCH-01',
      'ACSP active and reconfirmed',
      ok01,
      ok01
        ? `${acspStatusLabel[acsp.status]}, approved and reconfirmed. Next reconfirmation due ${acsp.monitoring.nextReconfirmationDue.slice(0, 10)}.`
        : !approved
          ? 'Pending approval by the platform. Not allocated until approved.'
          : !statusOk
            ? `Status is ${acspStatusLabel[acsp.status]}. New allocation is paused (ACSP-10).`
            : `Reconfirmation was due ${acsp.monitoring.nextReconfirmationDue.slice(0, 10)} and is overdue. New allocation is paused (ACSP-11).`,
      ok01 && acsp.status === 'not_yet_listed'
        ? NOT_YET_LISTED_CAVEAT
        : undefined,
    )

    // MATCH-02
    add(
      'MATCH-02',
      'Accepting new cases',
      p.acceptingNewCases,
      p.acceptingNewCases ? 'Accepting new cases.' : 'Not accepting new cases.',
    )

    // MATCH-03
    const excluded = p.excludedJurisdictions.some((c) =>
      ci(c, criteria.residenceCountry),
    )
    const accepted =
      p.residenceCountries.includes('Any') ||
      p.residenceCountries.some((c) => ci(c, criteria.residenceCountry))
    add(
      'MATCH-03',
      'Country of residence accepted',
      accepted && !excluded,
      excluded
        ? `${criteria.residenceCountry} is on its excluded jurisdictions.`
        : accepted
          ? `Accepts clients resident in ${criteria.residenceCountry}. Countries accepted: ${list(p.residenceCountries)}.`
          : `Does not accept clients resident in ${criteria.residenceCountry}. Countries accepted: ${list(p.residenceCountries)}.`,
    )

    // MATCH-04
    const typeOk = p.documentTypes.includes(criteria.documentType)
    const issuerOk =
      p.issuingCountries.includes('Any') ||
      p.issuingCountries.some((c) => ci(c, criteria.issuingCountry))
    add(
      'MATCH-04',
      'Document type and issuing country',
      typeOk && issuerOk,
      !typeOk
        ? `Does not accept a ${docNames[criteria.documentType]}.`
        : !issuerOk
          ? `Accepts a ${docNames[criteria.documentType]} only from ${list(p.issuingCountries)}, not ${criteria.issuingCountry}.`
          : `Accepts a ${criteria.issuingCountry} ${docNames[criteria.documentType]}.`,
    )

    // MATCH-05
    const roleOk = p.roles.includes(criteria.role)
    add(
      'MATCH-05',
      'Role accepted',
      roleOk,
      roleOk
        ? `Accepts a ${roleNames[criteria.role]}.`
        : `Does not accept a ${roleNames[criteria.role]}.`,
    )

    // MATCH-06
    const shared = criteria.languages.filter((l) =>
      p.languages.some((x) => ci(x, l)),
    )
    const langOk = criteria.languages.length === 0 || shared.length > 0
    add(
      'MATCH-06',
      'Language',
      langOk,
      criteria.languages.length === 0
        ? 'No language asked for.'
        : langOk
          ? `Supports ${list(shared)}. Languages: ${list(p.languages)}.`
          : `Supports ${list(p.languages)}, none of ${list(criteria.languages)}.`,
    )

    // MATCH-07
    const riskOk = !criteria.higherRisk || p.acceptsHigherRisk
    add(
      'MATCH-07',
      'Higher-risk cases',
      riskOk,
      !criteria.higherRisk
        ? 'Not a higher-risk case.'
        : p.acceptsHigherRisk
          ? 'Accepts higher-risk cases.'
          : 'Does not accept higher-risk cases.',
    )

    // MATCH-08
    const left = capacityLeftToday(acsp)
    const capOk = !criteria.needsCapacityToday || left > 0
    const turnOk =
      criteria.maxTurnaroundHours === undefined ||
      p.targetTurnaroundHours <= criteria.maxTurnaroundHours
    add(
      'MATCH-08',
      'Capacity today and turnaround',
      capOk && turnOk,
      [
        capOk
          ? `${left} of ${p.capacity.perDay} places left today.`
          : 'No capacity left today.',
        turnOk
          ? `Target turnaround ${p.targetTurnaroundHours} hours.`
          : `Target turnaround ${p.targetTurnaroundHours} hours, over the ${criteria.maxTurnaroundHours} hours asked for.`,
      ].join(' '),
    )

    // MATCH-09 (Design, proposed): payments active
    add(
      'MATCH-09',
      'Payments active',
      acsp.payments.paymentsActive,
      acsp.payments.paymentsActive
        ? 'Payments are active: the secure payment provider shows Eligible and Evidence One has approved.'
        : `Payments are not active yet (provider status: ${PROVIDER_STATUS_LABEL[acsp.payments.providerStatus]}). Not offered until both the provider and Evidence One have approved.`,
    )

    return { acsp, eligible: results.every((r) => r.pass), results }
  })
}

/** Ranking order: lower fee, then shorter turnaround, then more capacity left today, then name. */
export const compareForRanking = (a: AcspFirm, b: AcspFirm) =>
  a.profile.fee.standard - b.profile.fee.standard ||
  a.profile.targetTurnaroundHours - b.profile.targetTurnaroundHours ||
  capacityLeftToday(b) - capacityLeftToday(a) ||
  a.name.localeCompare(b.name)

/** Eligible ACSPs ranked on clear criteria. "Ranked by clear criteria. Not AI." */
export function suggestAcsps(
  data: DemoData,
  criteria: MatchCriteria,
  now = Date.now(),
): AcspSuggestion[] {
  return matchAcsps(data, criteria, now)
    .filter((m) => m.eligible)
    .sort((a, b) => compareForRanking(a.acsp, b.acsp))
    .map((m, i) => {
      const p = m.acsp.profile
      const shared = criteria.languages.filter((l) =>
        p.languages.some((x) => ci(x, l)),
      )
      const caveat = m.results.find((r) => r.caveat)?.caveat
      return {
        acsp: m.acsp,
        rank: i + 1,
        fee: p.fee.standard,
        turnaroundHours: p.targetTurnaroundHours,
        reasons: [
          `Price: ${gbp(p.fee.standard)}, set by ${m.acsp.name}.`,
          shared.length
            ? `Languages: supports ${list(shared)}.`
            : `Languages: ${list(p.languages)}.`,
          `Countries: accepts clients resident in ${criteria.residenceCountry} and a ${criteria.issuingCountry} ${docNames[criteria.documentType]}.`,
          `Capacity: ${capacityLeftToday(m.acsp)} of ${p.capacity.perDay} places left today. Target turnaround ${p.targetTurnaroundHours} hours.`,
          ...(caveat ? [caveat] : []),
        ],
      }
    })
}
