import type {
  AcspFirm,
  DemoData,
  IdDocumentType,
  RegisterRole,
} from '@/types/domain'

/*
  ACSP matching and suggestion. Deterministic: structured criteria, no AI. The
  demo shows the criteria and every ACSP with a pass or fail per criterion and
  the rule ID (MATCH-01 to MATCH-08). An administrator allocates; automatic
  allocation is a later phase. For a B2C client the platform suggests matching
  ACSPs, ranked on clear criteria, each with its own fee and turnaround.

  CONTRACT: the RULES workstream replaces this stub with the real implementation
  but keeps these exports and types exactly, because the Matching page, the B2C
  suggestion step and Bulk invite all import them.
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

/** Every ACSP with a pass or fail per criterion. STUB: replaced by the RULES workstream. */
export function matchAcsps(
  data: DemoData,
  criteria: MatchCriteria,
): AcspMatch[] {
  void criteria
  return data.acsps.map((acsp) => ({
    acsp,
    eligible: acsp.status === 'active',
    results: [],
  }))
}

/** Eligible ACSPs ranked on clear criteria. "Ranked by clear criteria. Not AI." STUB: replaced by the RULES workstream. */
export function suggestAcsps(
  data: DemoData,
  criteria: MatchCriteria,
): AcspSuggestion[] {
  return matchAcsps(data, criteria)
    .filter((m) => m.eligible)
    .map((m, i) => ({
      acsp: m.acsp,
      rank: i + 1,
      fee: m.acsp.profile.fee.standard,
      turnaroundHours: m.acsp.profile.targetTurnaroundHours,
      reasons: [],
    }))
}

/** Capacity left today for an ACSP. */
export const capacityLeftToday = (acsp: AcspFirm) =>
  Math.max(0, acsp.profile.capacity.perDay - acsp.profile.usedToday)
