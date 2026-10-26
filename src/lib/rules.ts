import { PRIMARY_REVIEWER_ID } from '@/data/organisations'
import { ruleById } from '@/data/rules'
import { chipResultFor } from '@/lib/chip'
import { formatDate, fullName } from '@/lib/format'
import {
  historyCovers,
  monthYear,
  normaliseName,
  NORMALISATION_NOTE,
  registerNameToDocumentOrder,
} from '@/lib/register'
import type {
  CaseStep,
  ComparisonResult,
  DemoData,
  IdDocument,
  Person,
  RegisterEntry,
  RuleDecision,
  RuleOutcome,
  RuleSetVersion,
  VerificationCase,
} from '@/types/domain'

/*
  Deterministic rule evaluation. The same inputs always give the same results,
  and nothing here calls an AI model. Where an input came from AI extraction
  (the date or address on a bank statement) the result says so.
*/

/** Something on screen a statement can point to. Rendered as data-cite="kind:ref". */
export interface Citation {
  kind:
    | 'rule'
    | 'evidence'
    | 'register'
    | 'check'
    | 'declared'
    | 'param'
    | 'version'
    | 'setting'
  ref: string
  label: string
}

export const citeKey = (c: Pick<Citation, 'kind' | 'ref'>) =>
  `${c.kind}:${c.ref}`

export interface RuleResult {
  ruleId: string
  step: CaseStep
  outcome: RuleOutcome
  title: string
  detail?: string
  cites: Citation[]
  /** The reviewer's recorded decision, for Mandatory decision results. */
  decision?: RuleDecision
}

const HOUR = 3_600_000
const DAY = 24 * HOUR

export const currentRuleSet = (data: DemoData): RuleSetVersion =>
  data.ruleSets.find((v) => v.status === 'current') ?? data.ruleSets[0]
export const draftRuleSet = (data: DemoData) =>
  data.ruleSets.find(
    (v) => v.status === 'draft' || v.status === 'pending_approval',
  )

/** The version in force at a moment, from the effective dates of published versions. */
export function versionAt(data: DemoData, iso: string): RuleSetVersion {
  const t = new Date(iso).getTime()
  const published = data.ruleSets.filter(
    (v) =>
      v.effectiveFrom && (v.status === 'current' || v.status === 'superseded'),
  )
  const inForce = published
    .filter((v) => new Date(v.effectiveFrom!).getTime() <= t)
    .sort((a, b) => b.effectiveFrom!.localeCompare(a.effectiveFrom!))[0]
  return (
    inForce ??
    published.sort((a, b) =>
      a.effectiveFrom!.localeCompare(b.effectiveFrom!),
    )[0] ??
    currentRuleSet(data)
  )
}

/** Decided cases keep the version applied at their decision; open cases use the version in force. */
export function ruleSetFor(
  data: DemoData,
  vc: VerificationCase,
): RuleSetVersion {
  if (
    vc.decision &&
    vc.decision.outcome !== 'request_info' &&
    vc.ruleSetVersion
  )
    return (
      data.ruleSets.find((v) => v.version === vc.ruleSetVersion) ??
      currentRuleSet(data)
    )
  return currentRuleSet(data)
}

/** The outcome a rule produces under a version, after any decision setting. */
export function outcomeUnder(ruleId: string, rs: RuleSetVersion): RuleOutcome {
  void rs
  return ruleById(ruleId)?.outcome ?? 'flag'
}

/** Whether Escalate is offered. Takes the data (current version) or one rule set version. */
export function isEscalateEnabled(x: DemoData | RuleSetVersion): boolean {
  const rs = 'ruleSets' in x ? currentRuleSet(x) : x
  return rs.settings.escalate_enabled
}

/** Whether referral commissions are switched on in the current version. Off at launch. */
export function referralCommissionsOn(x: DemoData | RuleSetVersion): boolean {
  const rs = 'ruleSets' in x ? currentRuleSet(x) : x
  return rs.settings.referral_commissions
}

/** Rule ADDL-02: every individual provides one proof of current address. Always true. */
export function needsProofOfAddress(rs?: RuleSetVersion): true {
  void rs
  return true
}

/** Months within which proof of address and supporting evidence must be dated (supporting_evidence_months). */
export const proofOfAddressMonths = (rs: RuleSetVersion) =>
  rs.params.supporting_evidence_months

function addMonths(iso: string, months: number): number {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.getTime()
}

const documentNames: Record<IdDocument['type'], string> = {
  passport: 'Passport',
  driving_licence: 'Photocard driving licence',
  national_identity_card: 'National identity card',
  biometric_residence_permit: 'Biometric residence permit',
}

const issuerAdjective: Record<string, string> = {
  'United Kingdom': 'UK',
  Ireland: 'Irish',
  Sweden: 'Swedish',
  Ukraine: 'Ukrainian',
}
export const documentName = (doc: IdDocument) =>
  `${issuerAdjective[doc.issuingCountry] ?? doc.issuingCountry} ${documentNames[doc.type].toLowerCase()}`

export const REPORT_PROMPT = 'Report this difference to Companies House'

export type DifferenceKind = 'name' | 'dob' | 'nationality' | 'transliteration'

/** One difference between the document and the register (G2-10). Flagged to the reviewer, never a halt. */
export interface RegisterDifference {
  kind: DifferenceKind
  ruleId: 'REG-11' | 'REG-12' | 'REG-13' | 'REG-18'
  field: string
  /** As the person declared it. */
  stated: string
  documentValue: string
  registerValue: string
  note?: string
  /** One line for the discrepancy report, for example "First name: AIDAN on the document, AIDEN on the register". */
  summary: string
}

/**
  Differences in name, date of birth, nationality or transliteration between the
  document and the register, after normalisation of case, spacing, hyphens and
  apostrophes. Used by case review and by submitForReview to raise the flag and
  the discrepancy report prompt. Empty when everything agrees.
*/
export function registerDifferences(
  person: Person,
  doc: IdDocument | undefined,
  entry: RegisterEntry,
): RegisterDifference[] {
  if (!doc) return []
  const out: RegisterDifference[] = []
  const regName = registerNameToDocumentOrder(entry.registerName)
  if (normaliseName(regName) !== normaliseName(doc.nameOnDocument)) {
    const a = doc.nameOnDocument.trim().split(/\s+/)
    const b = regName.split(/\s+/)
    const i = a.findIndex(
      (w, k) => normaliseName(w) !== normaliseName(b[k] ?? ''),
    )
    const label =
      a.length !== b.length || i < 0
        ? 'Name'
        : i === 0
          ? 'First name'
          : i === a.length - 1
            ? 'Family name'
            : 'Middle name'
    const detail =
      a.length !== b.length || i < 0
        ? `${doc.nameOnDocument} on the document, ${regName} on the register`
        : `${a[i].toUpperCase()} on the document, ${b[i].toUpperCase()} on the register`
    const translit = !!doc.nonLatinName
    out.push({
      kind: translit ? 'transliteration' : 'name',
      ruleId: translit ? 'REG-18' : 'REG-11',
      field: translit ? 'Name (transliteration)' : 'Full name',
      stated: fullName(person),
      documentValue: doc.nameOnDocument,
      registerValue: entry.registerName,
      note: nameDifference(doc.nameOnDocument, regName),
      summary: `${translit ? `Transliteration, ${label.toLowerCase()}` : label}: ${detail}`,
    })
  }
  if (monthYear(doc.dobOnDocument) !== entry.registerDobMonthYear)
    out.push({
      kind: 'dob',
      ruleId: 'REG-12',
      field: 'Date of birth',
      stated: formatDate(person.dateOfBirth),
      documentValue: formatDate(doc.dobOnDocument),
      registerValue: entry.registerDobMonthYear,
      note: 'The public register shows month and year only.',
      summary: `Date of birth: ${monthYear(doc.dobOnDocument)} on the document, ${entry.registerDobMonthYear} on the register`,
    })
  const nat = doc.nationalityOnDocument ?? person.nationality
  if (nat !== entry.registerNationality)
    out.push({
      kind: 'nationality',
      ruleId: 'REG-13',
      field: 'Nationality',
      stated: person.nationality,
      documentValue: nat,
      registerValue: entry.registerNationality,
      summary: `Nationality: ${nat} on the document, ${entry.registerNationality} on the register`,
    })
  return out
}

export interface ComparisonRow {
  field: string
  ruleId: string
  stated: string
  document: string
  register: string
  result: ComparisonResult
  note?: string
}

/** Declared, document and register values side by side, compared under the rule set. */
export function comparisonRows(
  person: Person,
  doc: IdDocument | undefined,
  entry: RegisterEntry,
): ComparisonRow[] {
  if (!doc) return []
  const diffs = registerDifferences(person, doc, entry)
  const nameDiff = diffs.find(
    (d) => d.kind === 'name' || d.kind === 'transliteration',
  )
  const dobDiff = diffs.find((d) => d.kind === 'dob')
  const natDiff = diffs.find((d) => d.kind === 'nationality')
  const nat = doc.nationalityOnDocument ?? person.nationality
  return [
    {
      field: 'Full name',
      ruleId: nameDiff?.ruleId ?? 'REG-11',
      stated: fullName(person),
      document: doc.nameOnDocument,
      register: entry.registerName,
      result: nameDiff ? 'mismatch' : 'match',
      note: nameDiff?.note,
    },
    {
      field: 'Date of birth',
      ruleId: 'REG-12',
      stated: formatDate(person.dateOfBirth),
      document: formatDate(doc.dobOnDocument),
      register: entry.registerDobMonthYear,
      result: dobDiff ? 'mismatch' : 'match',
      note: 'The public register shows month and year only.',
    },
    {
      field: 'Nationality',
      ruleId: 'REG-13',
      stated: person.nationality,
      document: nat,
      register: entry.registerNationality,
      result: natDiff ? 'mismatch' : 'match',
    },
  ]
}

/** Describes the first differing word, for example "Aidan on the document, Aiden on the register". */
function nameDifference(docName: string, regName: string): string {
  const a = normaliseName(docName).split(' ')
  const b = normaliseName(regName).split(' ')
  const i = a.findIndex((w, k) => w !== b[k])
  if (i < 0) return 'The names differ in length.'
  const cap = (w = '') => w.charAt(0).toUpperCase() + w.slice(1)
  return `${cap(a[i])} on the document, ${cap(b[i])} on the register.`
}

/**
  Whether an identity document is expired beyond its exception (rules DOC-EXP-01
  to DOC-EXP-03). An expired passport is not accepted (H1, decided 19 October),
  so any expired passport is beyond its exception and another document is
  asked for.
*/
export function expiryStatus(
  doc: Pick<IdDocument, 'type' | 'expiresOn'>,
  rs: RuleSetVersion,
  at: number,
): 'in_date' | 'within_exception' | 'beyond_exception' {
  if (new Date(doc.expiresOn).getTime() >= at) return 'in_date'
  if (doc.type === 'passport') return 'beyond_exception'
  if (doc.type === 'biometric_residence_permit')
    return addMonths(doc.expiresOn, rs.params.brp_expiry) < at
      ? 'beyond_exception'
      : 'within_exception'
  return 'beyond_exception'
}

export interface EvidenceTrigger {
  ruleId: 'ADDL-01' | 'ADDL-03'
  reason: string
}

/**
  Rules ADDL-01 and ADDL-03, the only triggers for one supporting document ("We
  need one supporting document"). Proof of current address is separate: it is
  asked of every individual (ADDL-02, needsProofOfAddress).
*/
export function evidenceTriggers(
  person: Person,
  doc: IdDocument | Pick<IdDocument, 'type'> | undefined,
  rs: RuleSetVersion,
  formerNames: string[] = [],
  now = Date.now(),
): EvidenceTrigger[] {
  const out: EvidenceTrigger[] = []
  // An expired passport is never accepted: DOC-EXP-01 asks for another document (H1).
  if (
    doc &&
    doc.type !== 'passport' &&
    'expiresOn' in doc &&
    expiryStatus(doc, rs, now) === 'beyond_exception'
  )
    out.push({
      ruleId: 'ADDL-01',
      reason: `The ${documentNames[doc.type].toLowerCase()} expired on ${formatDate(doc.expiresOn)}, beyond its exception.`,
    })
  const names = formerNames.length ? formerNames : (person.formerNames ?? [])
  if (names.length)
    out.push({
      ruleId: 'ADDL-03',
      reason: `A former name is declared (${names.join(', ')}).`,
    })
  return out
}

/** The reviewer who would decide: the recorded one, or the signed-in reviewer for open cases. */
const reviewerFor = (data: DemoData, vc: VerificationCase) =>
  data.acsps
    .flatMap((a) => a.reviewers)
    .find((r) => r.id === (vc.reviewerId ?? PRIMARY_REVIEWER_ID))

const isNameEvidence = (e: { label: string }) =>
  /name|marriage|deed poll|certificate/i.test(e.label)

/** Every rule result for a case that has reached the reviewer. */
export function evaluateCase(
  data: DemoData,
  vc: VerificationCase,
  now = Date.now(),
): RuleResult[] {
  const person = data.people.find((p) => p.id === vc.personId)
  const entry = data.register.find(
    (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
  )
  if (!person || !entry) return []
  const rs = ruleSetFor(data, vc)
  const P = rs.params
  const doc = person.document
  const acsp = data.acsps.find((a) => a.id === vc.acspId)
  const results: RuleResult[] = []
  const decisions = vc.ruleDecisions ?? {}
  const add = (
    ruleId: string,
    step: CaseStep,
    outcome: RuleOutcome,
    title: string,
    cites: Citation[] = [],
    detail?: string,
  ) =>
    results.push({
      ruleId,
      step,
      outcome,
      title,
      detail,
      cites: [{ kind: 'rule', ref: ruleId, label: ruleId }, ...cites],
      decision: outcome === 'mandatory' ? decisions[ruleId] : undefined,
    })
  const checkAt =
    vc.idvt.completedAt ??
    vc.submittedForReviewAt ??
    new Date(now).toISOString()
  const checkMs = new Date(checkAt).getTime()
  const reached = !!vc.submittedForReviewAt || !!vc.option2
  if (!reached) return []

  // 1 Personal information
  const declared: Citation = {
    kind: 'declared',
    ref: 'personal',
    label: 'Step 1 details',
  }
  add('INFO-01', 'info', 'pass', `Full name given: ${fullName(person)}`, [
    declared,
  ])
  const former = vc.journey?.formerNames ?? person.formerNames ?? []
  add(
    'INFO-02',
    'info',
    'pass',
    former.length
      ? `Former names declared: ${former.join(', ')}`
      : 'Former names answered: none',
    [declared],
  )
  add(
    'INFO-03',
    'info',
    'pass',
    `Date of birth given: ${formatDate(person.dateOfBirth)}`,
    [declared],
  )
  add(
    'INFO-04',
    'info',
    'pass',
    `Email ${person.email} confirmed by one-time code and mobile confirmed by SMS code`,
    [declared],
  )
  add(
    'INFO-05',
    'info',
    'pass',
    'Current home address given in structured form',
    [{ kind: 'declared', ref: 'address', label: 'Address history' }],
  )
  const covers = historyCovers(person, P.address_history_months, now)
  add(
    'INFO-06',
    'info',
    covers ? 'pass' : 'request',
    covers
      ? `Address history covers the last ${P.address_history_months} months with no gap`
      : `Address history does not cover the last ${P.address_history_months} months`,
    [
      { kind: 'declared', ref: 'address', label: 'Address history' },
      {
        kind: 'param',
        ref: 'address_history_months',
        label: `${P.address_history_months} months`,
      },
    ],
  )
  add(
    'INFO-07',
    'info',
    'pass',
    'Email and mobile are not registered to another individual or to the inviting Referral Partner',
    [declared],
  )

  // 2 Register association and comparison
  const regCite = (field: string): Citation => ({
    kind: 'register',
    ref: field,
    label: `Register: ${field.toLowerCase()}`,
  })
  const docCite: Citation = {
    kind: 'evidence',
    ref: 'identity_document',
    label: doc ? documentName(doc) : 'Identity document',
  }
  const role =
    entry.role === 'director_psc'
      ? 'Both'
      : entry.role === 'director'
        ? 'Director'
        : 'PSC'
  add(
    'REG-02',
    'register',
    'pass',
    `On the register of the company as: ${role}`,
    [regCite('Role')],
  )
  if (entry.identityVerified)
    add(
      'REG-04',
      'register',
      'flag',
      'The register already showed this person’s identity as verified. They were told before payment and chose to continue.',
      [regCite('Identity verified')],
    )
  add(
    'REG-10',
    'register',
    'pass',
    'Person on the company’s register at the decision snapshot',
    [regCite('Role')],
  )
  const diffs = registerDifferences(person, doc, entry)
  const correction = vc.correctionTaskId
    ? ` A Route B register correction task (${vc.correctionTaskId}) is open for a genuine correction. Route A is not halted.`
    : ' Route A is not halted.'
  const flagged = `Flagged for your decision. Consider reporting it to Companies House.${correction}`
  const reg19: Citation = { kind: 'rule', ref: 'REG-19', label: 'REG-19' }
  if (doc) {
    const nameDiff = diffs.find(
      (d) => d.kind === 'name' || d.kind === 'transliteration',
    )
    if (!nameDiff)
      add(
        'REG-11',
        'register',
        'pass',
        'Name on the document matches the register after normalisation',
        [docCite, regCite('Full name')],
        NORMALISATION_NOTE,
      )
    else
      add(
        nameDiff.ruleId,
        'register',
        'mandatory',
        nameDiff.kind === 'transliteration'
          ? `Name differs from the register by transliteration. ${nameDiff.note ?? ''}`.trim()
          : `Name on the document differs from the register after normalisation. ${nameDiff.note ?? ''}`.trim(),
        [docCite, regCite('Full name'), reg19],
        flagged,
      )
    const dobDiff = diffs.find((d) => d.kind === 'dob')
    add(
      'REG-12',
      'register',
      dobDiff ? 'mandatory' : 'pass',
      dobDiff
        ? `Month and year of birth differ from the register (${dobDiff.registerValue})`
        : `Month and year of birth match the register (${entry.registerDobMonthYear})`,
      [docCite, regCite('Date of birth'), ...(dobDiff ? [reg19] : [])],
      dobDiff ? flagged : undefined,
    )
    const natDiff = diffs.find((d) => d.kind === 'nationality')
    add(
      'REG-13',
      'register',
      natDiff ? 'mandatory' : 'pass',
      natDiff
        ? `Nationality differs: ${natDiff.documentValue} on the document, ${natDiff.registerValue} on the register`
        : `Nationality matches the register (${entry.registerNationality})`,
      [docCite, regCite('Nationality'), ...(natDiff ? [reg19] : [])],
      natDiff ? flagged : undefined,
    )
  }
  if (diffs.length) {
    const rep = vc.discrepancyReport
    add(
      'REG-19',
      'register',
      'flag',
      `${REPORT_PROMPT}: ${diffs.map((d) => d.summary).join('; ')}`,
      [{ kind: 'declared', ref: 'discrepancy', label: 'Discrepancy report' }],
      rep?.choice
        ? `Your choice: ${rep.choice === 'will_report' ? 'you will report it to Companies House' : 'you are not reporting it'}, logged on the case${rep.choiceAt ? ` on ${formatDate(rep.choiceAt)}` : ''}. Nothing is filed through an API.`
        : 'Prompted. No choice is recorded yet. The choice is logged on the case; nothing is filed through an API.',
    )
  }
  if (
    checkMs - new Date(entry.appointedOn).getTime() <
    P.recent_appointment_days * DAY
  )
    add(
      'REG-16',
      'register',
      'flag',
      `Appointed ${formatDate(entry.appointedOn)}, within the last ${P.recent_appointment_days} days`,
      [
        regCite('Appointed'),
        {
          kind: 'param',
          ref: 'recent_appointment_days',
          label: `${P.recent_appointment_days} days`,
        },
      ],
    )
  if ((entry.activeAppointments ?? 1) > P.many_appointments)
    add(
      'REG-17',
      'register',
      'flag',
      `Holds ${entry.activeAppointments} active appointments, more than ${P.many_appointments}`,
      [
        regCite('Appointments'),
        {
          kind: 'param',
          ref: 'many_appointments',
          label: `${P.many_appointments}`,
        },
      ],
    )

  // 3 Identity document
  if (doc) {
    add(
      'DOC-01',
      'document',
      'pass',
      `${documentName(doc)} is on the accepted list for Option ${vc.option}`,
      [docCite],
    )
    const status = expiryStatus(doc, rs, checkMs)
    if (vc.option === 2) {
      // Option 2 expiry tolerances are tested under OPT-06.
    } else if (doc.type === 'passport') {
      add(
        'DOC-EXP-01',
        'document',
        status === 'in_date' ? 'pass' : 'request',
        status === 'in_date'
          ? `Passport in date at the check, expires ${formatDate(doc.expiresOn)}`
          : `Passport expired ${formatDate(doc.expiresOn)}. An expired passport is not accepted, so another document is asked for.`,
        [docCite],
      )
    } else if (doc.type === 'biometric_residence_permit') {
      add(
        'DOC-EXP-02',
        'document',
        status === 'beyond_exception' ? 'request' : 'pass',
        status === 'beyond_exception'
          ? `Permit expired beyond ${P.brp_expiry} months`
          : `Permit within tolerance, expires ${formatDate(doc.expiresOn)}`,
        [
          docCite,
          { kind: 'param', ref: 'brp_expiry', label: `${P.brp_expiry} months` },
        ],
      )
    } else {
      add(
        'DOC-EXP-03',
        'document',
        status === 'in_date' ? 'pass' : 'request',
        status === 'in_date'
          ? `Document in date at the check, expires ${formatDate(doc.expiresOn)}`
          : `Document expired ${formatDate(doc.expiresOn)}`,
        [docCite],
      )
    }
    if (doc.cancelledOrReplaced)
      add(
        'DOC-02',
        'document',
        'mandatory',
        'Cancellation marks or a replaced document reported. Never an automatic rejection.',
        [docCite],
      )
    if (doc.damaged)
      add(
        'DOC-05',
        'document',
        'mandatory',
        'Damage affecting personal details reported by the provider',
        [docCite],
      )
  }

  // 4 IDVT checks
  const i = vc.idvt
  const check = (ref: string, label: string): Citation => ({
    kind: 'check',
    ref,
    label,
  })
  if (vc.option === 1) {
    const chip = chipResultFor(vc, doc)
    if (chip === 'read' || chip === 'not_read')
      add(
        'IDVT-01',
        'idvt',
        chip === 'read' ? 'pass' : 'mandatory',
        chip === 'read'
          ? 'Chip read in the identity provider’s chip reader and its signature validated'
          : 'Chip not read. Record why you are satisfied. Companies House does not mandate chip reading, so the case continues and you decide.',
        [check('chip', 'Chip result')],
      )
    add(
      'IDVT-02',
      'idvt',
      i.documentAuthenticity === 'pass' ? 'pass' : 'block',
      i.documentAuthenticity === 'pass'
        ? 'Document authenticity validated by the certified identity provider on the browser route'
        : 'Document authenticity not validated',
      [check('authenticity', 'Document authenticity')],
    )
    add(
      'IDVT-03',
      'idvt',
      i.liveness === 'pass' ? 'pass' : 'block',
      i.liveness === 'pass' ? 'Liveness passed' : 'Liveness not passed',
      [check('liveness', 'Liveness')],
    )
    add(
      'IDVT-04',
      'idvt',
      i.faceMatch === 'pass' ? 'pass' : 'block',
      i.faceMatch === 'pass'
        ? `Face match passed${i.faceMatchScore ? ` (${i.faceMatchScore}%)` : ''}`
        : 'Face match not passed',
      [check('face', 'Face match')],
    )
    const names = {
      documentAuthenticity: 'document authenticity',
      liveness: 'liveness',
      faceMatch: 'face match',
    } as const
    const referred = (Object.keys(names) as (keyof typeof names)[]).filter(
      (k) => i[k] === 'refer',
    )
    if (referred.length)
      add(
        'IDVT-05',
        'idvt',
        'mandatory',
        `The provider returned a result for review on: ${referred.map((k) => names[k]).join(', ')}`,
        [check('authenticity', 'Provider result')],
      )
    if (doc) {
      const nameDiff =
        normaliseName(doc.nameOnDocument) !== normaliseName(fullName(person))
      const dobDiff = doc.dobOnDocument !== person.dateOfBirth
      add(
        'IDVT-06',
        'idvt',
        nameDiff || dobDiff ? 'mandatory' : 'pass',
        nameDiff || dobDiff
          ? 'Name or date of birth on the document differs from what the individual entered at Step 1'
          : 'Name and date of birth on the document match what the individual entered',
        [declared, docCite],
      )
    }
  }
  const attempts = i.attempts ?? 1
  const attemptsCite: Citation = {
    kind: 'param',
    ref: 'idvt_attempts',
    label: `${P.idvt_attempts} attempts`,
  }
  if (vc.option2?.reason === 'attempts_used' || attempts >= P.idvt_attempts)
    add(
      'IDVT-08',
      'idvt',
      'flag',
      `All ${P.idvt_attempts} attempts at the checks used. Routed to Option 2.`,
      [check('liveness', 'Attempts'), attemptsCite],
    )
  else if (vc.option2?.reason === 'no_smartphone')
    add(
      'IDVT-08',
      'idvt',
      'flag',
      'The person has no smartphone or tablet for the identity provider’s journey. Routed to Option 2.',
      [{ kind: 'declared', ref: 'option2', label: 'Option 2 request' }],
    )
  else if (vc.option2?.reason === 'unsupported_document')
    add(
      'IDVT-08',
      'idvt',
      'flag',
      'The certified identity provider cannot support this document. Routed to Option 2.',
      [check('authenticity', 'Provider result')],
    )
  else if (attempts > 1)
    add(
      'IDVT-07',
      'idvt',
      'pass',
      `Checks passed on attempt ${attempts} of ${P.idvt_attempts}`,
      [attemptsCite],
    )

  // 5 PEP and sanctions, where screening is switched on for the ACSP. Evidence for the reviewer, never a decision.
  const scr = check('screening', 'PEP and sanctions screening')
  if (acsp && !acsp.profile.pepScreening)
    add(
      'AML-01',
      'aml',
      'pass',
      `PEP and sanctions screening is switched off for ${acsp.name}. Rules AML-02 to AML-04 do not apply.`,
      [scr],
    )
  else if (i.pepSanctions === 'pending')
    add('AML-01', 'aml', 'block', 'Screening has not run yet', [scr])
  else {
    add(
      'AML-01',
      'aml',
      'pass',
      'Screening completed by the certified identity provider',
      [scr],
    )
    add(
      'AML-02',
      'aml',
      i.pepPossibleMatch ? 'mandatory' : 'pass',
      i.pepPossibleMatch
        ? 'A possible PEP match was returned. Decide whether it relates to this person.'
        : 'No possible PEP match',
      [scr],
    )
    add(
      'AML-03',
      'aml',
      i.sanctionsPossibleMatch ? 'mandatory' : 'pass',
      i.sanctionsPossibleMatch
        ? 'A possible sanctions match was returned'
        : 'No possible sanctions match',
      [scr],
    )
    if (i.adverseMedia)
      add('AML-04', 'aml', 'flag', 'Adverse media returned by the provider', [
        scr,
      ])
  }

  // 6 Proof of address from everyone (ADDL-02), supporting evidence only on ADDL-01 and ADDL-03
  const supporting = vc.evidence.filter((e) => e.kind === 'address_evidence')
  const nameEvidence = supporting.filter(isNameEvidence)
  const addressEvidence = supporting.filter((e) => !isNameEvidence(e))
  const months: Citation = {
    kind: 'param',
    ref: 'supporting_evidence_months',
    label: `${P.supporting_evidence_months} months`,
  }
  if (needsProofOfAddress(rs)) {
    const provided =
      !!vc.journey?.addressProofDone || addressEvidence.length > 0
    // Open setting, off by default: a passing electronic address check may stand in for the document.
    const checkPassed =
      rs.settings.address_check_replaces_proof &&
      vc.idvt.addressCheck === 'pass'
    add(
      'ADDL-02',
      'evidence',
      provided || checkPassed ? 'pass' : 'request',
      checkPassed && !provided
        ? 'The electronic address check passed, and the current setting accepts it in place of the document.'
        : provided
          ? `Proof of current address provided. It must be dated within ${P.supporting_evidence_months} months.`
          : `We need proof of current address dated within the last ${P.supporting_evidence_months} months`,
      [
        months,
        ...addressEvidence.map((e) => ({
          kind: 'evidence' as const,
          ref: e.id,
          label: e.label,
        })),
      ],
    )
  }
  const triggers = evidenceTriggers(person, doc, rs, former, checkMs)
  const expiredTrigger =
    vc.option === 1 && triggers.find((t) => t.ruleId === 'ADDL-01')
  const nameTrigger = triggers.find((t) => t.ruleId === 'ADDL-03')
  const uploaded = !!vc.journey?.evidenceUploaded
  if (expiredTrigger) {
    const given = uploaded || supporting.length >= 2
    add(
      'ADDL-01',
      'evidence',
      given ? 'flag' : 'request',
      given
        ? `One supporting document was requested and provided. ${expiredTrigger.reason}`
        : `We need one supporting document. ${expiredTrigger.reason}`,
      [docCite],
    )
  }
  if (nameTrigger) {
    const given = uploaded || nameEvidence.length > 0
    add(
      'ADDL-03',
      'evidence',
      given ? 'flag' : 'request',
      given
        ? `One supporting document was requested and provided. ${nameTrigger.reason}`
        : `We need one supporting document. ${nameTrigger.reason}`,
      [
        declared,
        ...nameEvidence.map((e) => ({
          kind: 'evidence' as const,
          ref: e.id,
          label: e.label,
        })),
      ],
    )
  }
  for (const e of supporting) {
    const ev: Citation = { kind: 'evidence', ref: e.id, label: e.label }
    if (!isNameEvidence(e)) {
      add(
        'ADDL-10',
        'evidence',
        'pass',
        `${e.label} is an accepted type of supporting document`,
        [ev],
      )
      if (e.documentDate) {
        const ok =
          addMonths(e.documentDate, P.supporting_evidence_months) >=
          new Date(e.uploadedAt).getTime()
        add(
          'ADDL-11',
          'evidence',
          ok ? 'pass' : 'request',
          ok
            ? `Dated ${formatDate(e.documentDate)}, within ${P.supporting_evidence_months} months of upload (date read by AI extraction)`
            : `Dated ${formatDate(e.documentDate)}, more than ${P.supporting_evidence_months} months before upload (date read by AI extraction). A more recent document is needed.`,
          [ev, months],
        )
      }
      add(
        'ADDL-12',
        'evidence',
        e.showsAddress === false ? 'mandatory' : 'pass',
        e.showsAddress === false
          ? 'The document does not clearly show the declared current address (AI extraction)'
          : 'Shows the declared current address (AI extraction)',
        [ev, { kind: 'declared', ref: 'address', label: 'Current address' }],
      )
    }
    add(
      'ADDL-13',
      'evidence',
      e.showsName === false ? 'mandatory' : 'pass',
      e.showsName === false
        ? 'The document does not show the individual’s name (AI extraction)'
        : 'Shows the individual’s name (AI extraction)',
      [ev],
    )
  }

  // 7 Option 1 and Option 2
  add(
    'OPT-01',
    'option',
    'pass',
    vc.option === 2
      ? 'The case started as Option 1'
      : 'Option 1: digital verification by a certified identity provider',
    [check('authenticity', 'Option 1')],
  )
  if (vc.option === 2 && vc.option2) {
    const o = vc.option2
    const reason = {
      attempts_used: 'all attempts at the digital checks were used',
      unsupported_document: 'the provider cannot support the document',
      no_smartphone:
        'the person has no smartphone or tablet for the identity provider’s journey',
    }[o.reason]
    add('OPT-02', 'option', 'flag', `Option 2 offered because ${reason}`, [
      { kind: 'declared', ref: 'option2', label: 'Option 2 request' },
    ])
    const reviewer = reviewerFor(data, vc)
    const att = reviewer?.attestation
    const current = att && new Date(att.expiresOn).getTime() > now
    add(
      'OPT-03',
      'option',
      current ? 'pass' : 'block',
      current
        ? `${reviewer!.name} holds a current training attestation (${att!.reference}, valid to ${formatDate(att!.expiresOn)})`
        : 'The reviewer has no current training attestation for person checks',
      [{ kind: 'declared', ref: 'attestation', label: 'Training attestation' }],
    )
    const docs = o.documents ?? []
    const a = docs.filter((d) => d.group === 'A').length
    const b = docs.filter((d) => d.group === 'B').length
    const met = a >= 2 || (a >= 1 && b >= 1)
    add(
      'OPT-04',
      'option',
      met ? 'pass' : 'request',
      met
        ? `Documents checked: ${docs.map((d) => `${d.label} (Group ${d.group})`).join(' and ')}`
        : 'Two documents are needed: two from Group A, or one from Group A and one from Group B',
      docs.map((d, k) => ({
        kind: 'evidence' as const,
        ref: `option2-${k}`,
        label: d.label,
      })),
    )
    for (const d of docs.filter(
      (x) => x.expiresOn && /passport/i.test(x.label),
    )) {
      const beyond =
        addMonths(d.expiresOn!, P.passport_expiry_option2) <
        new Date(o.checkedAt ?? checkAt).getTime()
      add(
        'OPT-06',
        'option',
        beyond ? 'request' : 'pass',
        beyond
          ? `${d.label} expired more than ${P.passport_expiry_option2} months ago`
          : `${d.label} within the ${P.passport_expiry_option2}-month Option 2 tolerance`,
        [
          {
            kind: 'param',
            ref: 'passport_expiry_option2',
            label: `${P.passport_expiry_option2} months`,
          },
        ],
      )
    }
  }

  // 8 ACSP, payment, lapse and submission rules that attach to this case
  const instructedAt = vc.journey?.instructedAt ?? vc.allocation?.instructedAt
  if (acsp && instructedAt)
    add(
      'ACSP-01',
      'decision',
      'pass',
      `${person.givenNames.split(' ')[0]} confirmed they instruct ${acsp.name} on ${formatDate(instructedAt)}`,
      [{ kind: 'declared', ref: 'instruct', label: 'Instruction recorded' }],
    )
  if (vc.payment?.payeeAcspId) {
    const payee = data.acsps.find((a) => a.id === vc.payment!.payeeAcspId)
    add(
      'ACSP-02',
      'decision',
      'pass',
      `Payment of £${vc.payment.amount} to ${payee?.name ?? 'the named ACSP'} as merchant of record, collected by Evidence One as its disclosed agent`,
      [{ kind: 'declared', ref: 'payment', label: 'Payment record' }],
    )
    const p = vc.payment
    add(
      'ACSP-03',
      'decision',
      'pass',
      p.status === 'taken'
        ? `Authorised on ${formatDate(p.authorisedAt)} and taken on approval${p.paidAt ? ` on ${formatDate(p.paidAt)}` : ''}`
        : p.status === 'released'
          ? `Authorisation released${p.releasedAt ? ` on ${formatDate(p.releasedAt)}` : ''}. Nothing was taken`
          : `Authorised on ${formatDate(p.authorisedAt)}, not yet taken. Taken only when you approve`,
      [{ kind: 'declared', ref: 'payment', label: 'Payment record' }],
    )
  }
  if (acsp && ['suspended', 'ceased', 'withdrawn'].includes(acsp.status)) {
    if (vc.reallocation) {
      const r = vc.reallocation
      const to =
        data.acsps.find((a) => a.id === r.offeredAcspId)?.name ?? 'another ACSP'
      add(
        'ACSP-13',
        'decision',
        r.individualResponse === 'pending'
          ? 'request'
          : r.individualResponse === 'agreed'
            ? 'pass'
            : 'flag',
        r.individualResponse === 'pending'
          ? `Offered to ${to}. Waiting for the individual to agree or decline.`
          : r.individualResponse === 'agreed'
            ? `The individual agreed to move to ${to}.`
            : `The individual declined the move to ${to}.`,
      )
    } else if (
      ['approved', 'submission_started', 'submitted', 'confirmed'].includes(
        vc.status,
      )
    )
      add(
        'ACSP-12',
        'decision',
        'flag',
        `Verified by ${acsp.name}, whose status is now ${acsp.status.replace('_', ' ')}. Listed for follow-up.`,
      )
  }
  if (vc.submission?.verificationReference)
    add(
      'SUB-04',
      'submission',
      'pass',
      `Companies House verification reference ${vc.submission.verificationReference} recorded. No personal code is held.`,
      [
        {
          kind: 'declared',
          ref: 'submission',
          label: 'Verification reference',
        },
      ],
    )
  return results
}

export interface Outstanding {
  ruleId: string
  outcome: RuleOutcome
  title: string
  reason: 'block' | 'halt' | 'request' | 'mandatory_open' | 'not_satisfied'
}

/** Rule DEC-02: what stands between this case and approval. */
export function outstandingFor(results: RuleResult[]): Outstanding[] {
  const out: Outstanding[] = []
  for (const r of results) {
    if (
      r.outcome === 'block' ||
      r.outcome === 'halt' ||
      r.outcome === 'request'
    )
      out.push({
        ruleId: r.ruleId,
        outcome: r.outcome,
        title: r.title,
        reason: r.outcome,
      })
    else if (r.outcome === 'mandatory' && !r.decision)
      out.push({
        ruleId: r.ruleId,
        outcome: r.outcome,
        title: r.title,
        reason: 'mandatory_open',
      })
    else if (
      r.outcome === 'mandatory' &&
      r.decision?.decision === 'not_satisfied'
    )
      out.push({
        ruleId: r.ruleId,
        outcome: r.outcome,
        title: r.title,
        reason: 'not_satisfied',
      })
  }
  return out
}

export const stepLabels: Record<CaseStep, string> = {
  info: 'Personal information',
  register: 'Register comparison',
  document: 'Identity document',
  idvt: 'IDVT checks',
  aml: 'PEP and sanctions',
  evidence: 'Supporting evidence',
  option: 'Option 1 and Option 2',
  decision: 'Decision',
  submission: 'Submission and records',
}

/** Every case in the demo where a rule produced something other than a pass. */
export function casesAffectedBy(data: DemoData, ruleId: string) {
  return data.cases
    .map((vc) => ({
      vc,
      result: evaluateCase(data, vc).find((r) => r.ruleId === ruleId),
    }))
    .filter(
      (x): x is { vc: VerificationCase; result: RuleResult } => !!x.result,
    )
}

export interface VersionChange {
  kind: 'param' | 'setting'
  key: string
  label: string
  from: string
  to: string
}

/** Exactly what differs between two rule set versions. Rule text is fixed, so only parameters and settings can change. */
export function diffVersions(
  from: RuleSetVersion,
  to: RuleSetVersion,
  labels: {
    params: Record<string, { label: string; unit: string }>
    settings: Record<
      string,
      { label: string; options: { value: unknown; label: string }[] }
    >
  },
): VersionChange[] {
  const out: VersionChange[] = []
  for (const key of Object.keys(
    to.params,
  ) as (keyof RuleSetVersion['params'])[]) {
    if (from.params[key] !== to.params[key]) {
      const l = labels.params[key]
      out.push({
        kind: 'param',
        key,
        label: l?.label ?? key,
        from: `${from.params[key]} ${l?.unit ?? ''}`.trim(),
        to: `${to.params[key]} ${l?.unit ?? ''}`.trim(),
      })
    }
  }
  for (const key of Object.keys(
    to.settings,
  ) as (keyof RuleSetVersion['settings'])[]) {
    if (from.settings[key] !== to.settings[key]) {
      const l = labels.settings[key]
      const name = (v: unknown) =>
        l?.options.find((o) => o.value === v)?.label ?? String(v)
      out.push({
        kind: 'setting',
        key,
        label: l?.label ?? key,
        from: name(from.settings[key]),
        to: name(to.settings[key]),
      })
    }
  }
  return out
}
