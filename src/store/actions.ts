import { PRIMARY_ACSP_ID } from '@/data/organisations'
import { paramDefs, RULE_SET_NAME, settingDefs } from '@/data/rules'
import type { AuditInput } from '@/lib/audit'
import { looksLikeCode } from '@/lib/codeWarning'
import { fullName } from '@/lib/format'
import { hasChipStep, securityFeaturesFor } from '@/lib/chip'
import { computeRegisterDifferences, evidenceLabel } from '@/lib/identityChecks'
import { defaultCriteria } from '@/lib/matchCriteria'
import { suggestAcsps } from '@/lib/matching'
import { currentRuleSet, draftRuleSet, evaluateCase } from '@/lib/rules'
import { releasePayment, takePayment, then } from './paymentActions'
import type {
  AiObservation,
  DecisionOutcome,
  DemoData,
  EvidenceItem,
  IdDocument,
  IdDocumentType,
  Invite,
  JourneyState,
  Option2Reason,
  ParamKey,
  Person,
  RuleDecision,
  RuleSettings,
  RuleSetVersion,
  SettingKey,
  SubmissionCorrection,
  VerificationCase,
} from '@/types/domain'

/*
  Pure state transitions. Each returns the next data and the audit events to
  append, so every action is recorded in the hash-chained trail.
*/

export interface ActionResult {
  data: DemoData
  audit: AuditInput[]
}

const HOUR = 3_600_000

function nextRef(existing: string[], prefix: string, start: number): string {
  const max = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .reduce((a, b) => Math.max(a, b), start)
  return `${prefix}${String(max + 1).padStart(6, '0')}`
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** A short, clearly synthetic code derived from a seed, so the same input always gives the same code. */
export function syntheticCode(seed: string, length: number): string {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
  let out = ''
  for (let i = 0; i < length; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    out += ALPHABET[(h >>> 16) % ALPHABET.length]
  }
  return out
}

/** Single-use Agent Payment Code tied to one invite. */
export const paymentCodeFor = (prefix: string, inviteId: string) =>
  `${prefix}-${syntheticCode(inviteId, 4)}`

/** Reference recorded for a step-up authentication. */
export const newStepUpRef = (seed: string) =>
  `SU-${syntheticCode(`${seed}-${Date.now()}`, 4)}-${syntheticCode(seed, 4)}`

/** A plausible, clearly synthetic Companies House verification reference for the demo. */
export const exampleVerificationReference = (caseId: string) =>
  `CHV-${new Date().getFullYear()}-${syntheticCode(caseId, 6)}`

export function connectCompany(
  data: DemoData,
  number: string,
  partnerId: string,
  actor: string,
): ActionResult {
  const now = new Date().toISOString()
  const company = data.companies.find((c) => c.number === number)
  if (!company) return { data, audit: [] }
  return {
    data: {
      ...data,
      companies: data.companies.map((c) =>
        c.number === number
          ? { ...c, lodgedByPartnerId: partnerId, connectedAt: now }
          : c,
      ),
    },
    audit: [
      {
        at: now,
        actor,
        actorType: 'person',
        action: 'company.connected',
        detail: `${company.name} (${company.number}) connected to the portal from the Companies House register.`,
      },
    ],
  }
}

export interface SendInvitesInput {
  companyNumber: string
  personIds: string[]
  partnerId: string
  actor: string
  /** The instructing ACSP the Partner selected from the matched ACSPs shown. */
  instructingAcspId: string
  /** The 2 or 3 matched ACSPs shown to the Partner, best first. Ranked by clear criteria, not AI. */
  shownAcspIds?: string[]
  /** Who pays: the client, or the Partner with a single-use Agent Payment Code tied to the invite. */
  payer: 'client' | 'partner'
}

/**
  A Referral Partner refers people to verify. The referral names the instructing
  ACSP the Partner selected from 2 or 3 matched ACSPs, and who pays. The Partner never
  reviews or decides: every case is referred to an ACSP.
*/
export function sendInvites(
  data: DemoData,
  input: SendInvitesInput,
): ActionResult & { inviteIds: string[] } {
  const now = new Date().toISOString()
  const partner = data.partners.find((a) => a.id === input.partnerId)
  const invites: Invite[] = []
  const cases: VerificationCase[] = []
  const audit: AuditInput[] = []
  let inviteIds = data.invites.map((i) => i.id)
  let caseIds = data.cases.map((c) => c.id)

  for (const personId of input.personIds) {
    const person = data.people.find((p) => p.id === personId)
    if (!person) continue
    const inviteId = nextRef(inviteIds, 'INV-2026-', 0)
    const caseId = nextRef(caseIds, 'EO-2026-', 0)
    const code =
      input.payer === 'partner' && partner?.paymentCode
        ? paymentCodeFor(partner.paymentCode, inviteId)
        : undefined
    inviteIds = [...inviteIds, inviteId]
    caseIds = [...caseIds, caseId]
    const entry = data.register.find(
      (r) => r.personId === personId && r.companyNumber === input.companyNumber,
    )
    const acspId = input.instructingAcspId
    const acspName = data.acsps.find((a) => a.id === acspId)?.name ?? acspId
    invites.push({
      id: inviteId,
      personId,
      companyNumber: input.companyNumber,
      partnerId: input.partnerId,
      sentAt: now,
      paymentCode: code,
      status: 'sent',
      caseId,
      instructingAcspId: acspId,
      shownAcspIds: input.shownAcspIds,
      payer: input.payer,
    })
    cases.push({
      id: caseId,
      route: 'A',
      personId,
      companyNumber: input.companyNumber,
      origin: 'partner_invite',
      source: 'referred',
      partnerId: input.partnerId,
      acspId,
      option: 1,
      status: 'invited',
      createdAt: now,
      allocation: { source: 'invite' },
      idvt: {
        documentAuthenticity: 'pending',
        liveness: 'pending',
        faceMatch: 'pending',
        pepSanctions: 'pending',
      },
      observations: [],
      evidence: [],
      journey: {},
    })
    audit.push({
      at: now,
      actor: input.actor,
      actorType: 'person',
      action: 'invite.sent',
      caseId,
      detail: `Invite ${inviteId} sent to ${fullName(person)}, pre-filled from the register. Instructing ACSP: ${acspName}, selected by the Referral Partner${input.shownAcspIds?.length ? ` from ${input.shownAcspIds.length} matched ACSPs ranked by clear criteria, not AI` : ''}. ${code ? `Paid by ${partner?.name ?? 'the Referral Partner'} with single-use Agent Payment Code ${code}.` : 'The individual pays the ACSP.'}${entry?.identityVerified ? ' REG-04: the register already shows this person as verified. The sender and the individual are both told.' : ''}`,
    })
  }

  return {
    data: {
      ...data,
      invites: [...data.invites, ...invites],
      cases: [...data.cases, ...cases],
    },
    audit,
    inviteIds: invites.map((i) => i.id),
  }
}

/* Individual journey */

const personName = (data: DemoData, personId: string) => {
  const p = data.people.find((x) => x.id === personId)
  return p ? fullName(p) : 'The individual'
}

function patchCase(
  data: DemoData,
  caseId: string,
  patch: (c: VerificationCase) => VerificationCase,
): DemoData {
  return {
    ...data,
    cases: data.cases.map((c) => (c.id === caseId ? patch(c) : c)),
  }
}

export function updateJourney(
  data: DemoData,
  caseId: string,
  patch: Partial<JourneyState>,
  event?: {
    action: string
    detail: string
    actorType?: 'person' | 'system' | 'ai'
  },
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = new Date().toISOString()
  const next = patchCase(data, caseId, (c) => ({
    ...c,
    status: c.status === 'invited' ? 'in_progress' : c.status,
    journey: { ...c.journey, ...patch },
  }))
  const invites = next.invites.map((i) =>
    i.caseId === caseId && (i.status === 'sent' || i.status === 'opened')
      ? { ...i, status: 'accepted' as const }
      : i,
  )
  const actor =
    event?.actorType === 'ai'
      ? 'Evidence One Intelligence'
      : event?.actorType === 'system'
        ? 'Certified identity provider'
        : personName(data, vc.personId)
  return {
    data: { ...next, invites },
    audit: event
      ? [
          {
            at: now,
            actor,
            actorType: event.actorType ?? 'person',
            action: event.action,
            caseId,
            detail: event.detail,
          },
        ]
      : [],
  }
}

export function requestAmendment(
  data: DemoData,
  caseId: string,
  field: string,
  note: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = new Date().toISOString()
  const next = patchCase(data, caseId, (c) => ({
    ...c,
    journey: { ...c.journey, amendment: { field, note, at: now } },
  }))
  const registerCheck =
    field === 'Name' || field === 'Date of birth'
      ? ' Checked early against the register: a difference is flagged to the ACSP and never stops the verification. If the register itself is wrong, a register correction (Route B) can start before the identity checks.'
      : ''
  return {
    data: {
      ...next,
      invites: next.invites.map((i) =>
        i.caseId === caseId
          ? { ...i, status: 'amendment_requested' as const }
          : i,
      ),
    },
    audit: [
      {
        at: now,
        actor: personName(data, vc.personId),
        actorType: 'person',
        action: 'invite.amendment_requested',
        caseId,
        detail: `Amendment requested to ${field.toLowerCase()}: ${note}.${registerCheck}`,
      },
    ],
  }
}

/** The person who sent the invite is told that the register already shows this identity as verified (REG-04). */
export function inviterNotice(
  data: DemoData,
  vc: VerificationCase,
  kind: 'shown' | 'stopped',
): AuditInput[] {
  const invite = data.invites.find((i) => i.caseId === vc.id)
  const partner = data.partners.find(
    (p) => p.id === (invite?.partnerId ?? vc.partnerId),
  )
  if (!partner) return []
  return [
    {
      at: new Date().toISOString(),
      actor: 'Evidence One',
      actorType: 'system',
      action: 'notification.sent',
      caseId: vc.id,
      detail: `Email sent to ${partner.contactName}, ${partner.name}: the register already shows ${personName(data, vc.personId)} as verified${kind === 'stopped' ? ' and they chose to stop before payment' : '. They were told before payment and may continue or stop'}. Status only, no documents.`,
    },
  ]
}

/** REG-04: the register already shows the person as verified and they choose to stop. */
export function stopAlreadyVerified(
  data: DemoData,
  caseId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      status: 'abandoned',
      closedAt: now,
    })),
    audit: [
      {
        at: now,
        actor: personName(data, vc.personId),
        actorType: 'person',
        action: 'case.stopped',
        caseId,
        detail:
          'Stopped before payment after REG-04: the register already shows this identity as verified. Nothing was paid. Record retained for 7 years from closure.',
      },
      ...inviterNotice(data, vc, 'stopped'),
    ],
  }
}

/** Option 2 is a fallback only, offered once Option 1 cannot support the person's document. */
export function requestOption2(
  data: DemoData,
  caseId: string,
  reason: Option2Reason,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = Date.now()
  const iso = (o = 0) => new Date(now + o).toISOString()
  const hours = currentRuleSet(data).params.review_target_hours
  const why = {
    attempts_used: 'All attempts at the digital checks were used.',
    unsupported_document:
      'The certified identity provider cannot support the document.',
    no_smartphone:
      'The person has no smartphone or tablet for the certified identity provider’s journey.',
  }[reason]
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      option: 2,
      status: 'in_review',
      submittedForReviewAt: iso(),
      slaDueAt: iso(hours * HOUR),
      option2: { reason, requestedAt: iso() },
    })),
    audit: [
      {
        at: iso(),
        actor: 'Evidence One rules',
        actorType: 'system',
        action: 'rules.option2',
        caseId,
        detail: `${reason === 'attempts_used' ? 'IDVT-08' : 'OPT-02'}: ${why} Option 2 person check offered. Needs the reviewer’s agreement.${reason === 'no_smartphone' ? ' Pending the client’s decision.' : ''}`,
      },
      {
        at: iso(1000),
        actor: personName(data, vc.personId),
        actorType: 'person',
        action: 'option2.requested',
        caseId,
        detail: 'Option 2 person check requested. The ACSP will arrange it.',
      },
    ],
  }
}

export interface SubmitInput {
  caseId: string
  documentType: IdDocumentType
  evidenceUploaded: boolean
}

export function submitForReview(
  data: DemoData,
  input: SubmitInput,
): ActionResult {
  const vc = data.cases.find((c) => c.id === input.caseId)
  const person = vc && data.people.find((p) => p.id === vc.personId)
  const entry =
    vc &&
    data.register.find(
      (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
    )
  if (!vc || !person || !entry) return { data, audit: [] }
  const now = Date.now()
  const iso = (offset = 0) => new Date(now + offset).toISOString()
  const rs = currentRuleSet(data)
  const document =
    person.document && person.document.type === input.documentType
      ? person.document
      : syntheticDocument(person, input.documentType)
  const score = 95 + ((person.id.length * 7) % 40) / 10
  const ref = `IDV-7F31-${String(now).slice(-4)}`
  const acsp = data.acsps.find((a) => a.id === vc.acspId)
  const pepOn = !!acsp?.profile.pepScreening
  const ukResident =
    person.addressHistory.find((a) => !a.to)?.address.country ===
    'United Kingdom'
  const addressOn = !!acsp?.profile.addressCheck && ukResident
  const chipResult = hasChipStep(document, input.documentType)
    ? (vc.journey?.chipResult ?? 'read')
    : 'not_applicable'
  const differences = computeRegisterDifferences(person, document, entry)
  const flagged = differences.length > 0

  const evidence: EvidenceItem[] = [
    {
      id: `ev-${vc.id}-1`,
      kind: 'identity_document',
      label: evidenceLabel(document, vc.journey?.captureRoute),
      uploadedAt: iso(-6 * 60000),
      note: 'Security features validated by the certified identity provider.',
    },
    {
      id: `ev-${vc.id}-2`,
      kind: 'selfie',
      label: 'Liveness capture',
      uploadedAt: iso(-4 * 60000),
      note: 'Liveness media kept with the record for seven years.',
    },
    ...vc.evidence.filter(
      (e) => e.kind === 'address_evidence' || e.kind === 'option2_document',
    ),
  ]
  if (
    input.evidenceUploaded &&
    !evidence.some((e) => e.kind === 'address_evidence')
  )
    evidence.push({
      id: `ev-${vc.id}-3`,
      kind: 'address_evidence',
      supportingType: 'bank_statement',
      label: 'Bank statement',
      uploadedAt: iso(-2 * 60000),
      documentDate: iso(-18 * 24 * HOUR),
      showsAddress: true,
      showsName: true,
    })

  const people = data.people.map((p) =>
    p.id === person.id ? { ...p, document } : p,
  )
  const draft = patchCase({ ...data, people }, vc.id, (c) => ({
    ...c,
    // A register difference is flagged, never halted (G2-10).
    status: 'in_review',
    submittedForReviewAt: iso(),
    slaDueAt: iso(rs.params.review_target_hours * HOUR),
    idvt: {
      documentAuthenticity: 'pass',
      liveness: 'pass',
      faceMatch: 'pass',
      faceMatchScore: Math.round(score * 10) / 10,
      pepSanctions: pepOn ? 'pass' : 'not_applicable',
      pepSanctionsDetail: pepOn
        ? 'No match on PEP, sanctions or adverse media lists.'
        : 'Screening is not switched on for this ACSP.',
      completedAt: iso(-3 * 60000),
      providerReference: ref,
      attempts: (vc.journey?.checkAttempts ?? 0) + 1,
      registerComparison: flagged ? 'refer' : 'pass',
      chipResult,
      addressCheck: addressOn ? 'pass' : 'not_applicable',
    },
    evidence,
  }))
  const withFeatures = draft.cases.find((c) => c.id === vc.id)!
  const securityFeatures = securityFeaturesFor(withFeatures, document)
  draft.cases = draft.cases.map((c) =>
    c.id === vc.id ? { ...c, idvt: { ...c.idvt, securityFeatures } } : c,
  )

  // Rules run deterministically; the Mandatory decision comes from the rules engine.
  const updated = draft.cases.find((c) => c.id === vc.id)!
  const results = evaluateCase(draft, updated, now)
  const regRuleIds = results
    .filter(
      (r) =>
        r.ruleId.startsWith('REG-1') &&
        (r.outcome === 'mandatory' || r.outcome === 'flag'),
    )
    .map((r) => r.ruleId)
  const ruleText = regRuleIds.length
    ? regRuleIds.join(', ')
    : differences.map((d) => d.ruleId).join(', ')

  // AI only explains the comparison and checks supporting evidence, never the identity document.
  const observations: AiObservation[] = flagged
    ? differences.map((d, i) => ({
        id: `o-${vc.id}-m${i}`,
        step: 'register' as const,
        ruleId: d.ruleId,
        severity: 'mismatch' as const,
        title: `${d.field} differs from the Companies House register`,
        detail: `${d.summary}. This is flagged for your decision. It does not stop the case. You may report the difference to Companies House.`,
        source: 'Register comparison result',
      }))
    : [
        {
          id: `o-${vc.id}-1`,
          step: 'register',
          ruleId: 'REG-11',
          severity: 'info',
          title: 'Name, date of birth and nationality agree with the register',
          detail:
            'The details on the document and the Companies House register agree after normalisation.',
          source: 'Register comparison result',
        },
      ]
  if (input.evidenceUploaded)
    observations.push({
      id: `o-${vc.id}-2`,
      step: 'evidence',
      ruleId: 'ADDL-11',
      severity: 'info',
      title: 'Supporting document checked at upload',
      detail:
        'The document appears to be dated within the supporting evidence period and shows the declared name and current address.',
      source: 'Supporting document, issue date and address (AI extraction)',
    })

  const summary = differences.map((d) => d.summary).join('; ')
  let next = patchCase(draft, vc.id, (c) => ({
    ...c,
    observations,
    discrepancyReport: flagged
      ? { summary, promptedAt: iso(1500) }
      : c.discrepancyReport,
  }))
  const audit: AuditInput[] = [
    {
      at: iso(),
      actor: 'Certified identity provider',
      actorType: 'system',
      action: 'idvt.result.received',
      caseId: vc.id,
      detail: `Document authenticity and security features, liveness and face match ${Math.round(score * 10) / 10}% passed. ${chipResult === 'read' ? 'Chip read in the identity provider’s chip reader.' : chipResult === 'not_read' ? 'No chip read.' : 'The document has no chip.'} PEP and sanctions ${pepOn ? 'passed' : 'not switched on for this ACSP'}.${addressOn ? ' Electronic address check passed.' : ''}`,
    },
    {
      at: iso(500),
      actor: 'Evidence One rules',
      actorType: 'system',
      action: flagged ? 'rules.flagged' : 'rules.evaluated',
      caseId: vc.id,
      detail: flagged
        ? `${ruleText}: ${summary}. Flagged for the reviewer, with a Mandatory decision. The case continues to review.`
        : `Route A rules evaluated under rule set ${rs.version}.`,
    },
    {
      at: iso(1000),
      actor: 'Evidence One Intelligence',
      actorType: 'ai',
      action: 'ai.observation.created',
      caseId: vc.id,
      detail: `AI observation on ${observations[0].ruleId}${input.evidenceUploaded ? ' and ADDL-11' : ''}. Advisory only.`,
    },
  ]
  if (flagged)
    audit.push({
      at: iso(1500),
      actor: 'Evidence One rules',
      actorType: 'system',
      action: 'discrepancy.prompted',
      caseId: vc.id,
      detail:
        'The reviewer is prompted to report the difference to Companies House. Filing is not done by the platform.',
    })
  audit.push({
    at: iso(3000),
    actor: fullName(person),
    actorType: 'person',
    action: 'case.submitted',
    caseId: vc.id,
    detail: `Submitted for ACSP review. ${rs.params.review_target_hours}-hour review target started.`,
  })
  return { data: next, audit }
}

function syntheticDocument(person: Person, type: IdDocumentType): IdDocument {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 6)
  const current = person.addressHistory.find((a) => !a.to)
  const lastTwo = String(person.id.length * 7)
    .slice(-2)
    .padStart(2, '0')
  return {
    type,
    issuingCountry: 'United Kingdom',
    numberLastTwo: lastTwo,
    number:
      type === 'driving_licence'
        ? `${person.familyName.toUpperCase().slice(0, 5).padEnd(5, '9')}${person.dateOfBirth.slice(2, 4)}${syntheticCode(person.id, 5)}${lastTwo}`
        : `5${syntheticCode(person.id, 6).replace(/\D/g, '7')}${lastTwo}`,
    expiresOn: expires.toISOString().slice(0, 10),
    nameOnDocument: `${person.givenNames} ${person.familyName}`.toUpperCase(),
    dobOnDocument: person.dateOfBirth,
    hasChip: type === 'passport',
    addressOnDocument:
      type === 'driving_licence' && current
        ? `${current.address.line1}, ${current.address.town}, ${current.address.postcode}`
        : undefined,
  }
}

/* B2C: a member of the public who comes to Evidence One directly */

/** Deprecated rota, kept only for the Admin console. B2C clients are now suggested ACSPs on clear criteria. */
export function nextB2cAcsp(data: DemoData) {
  return [...data.acsps].sort(
    (a, b) =>
      a.b2cAllocatedThisMonth / a.b2cAllocationShare -
      b.b2cAllocatedThisMonth / b.b2cAllocationShare,
  )[0]
}

export const nextCaseId = (data: DemoData) =>
  nextRef(
    data.cases.map((c) => c.id),
    'EO-2026-',
    0,
  )

/**
  A B2C client comes directly. The case starts with a provisional suggestion from
  the register details; the person's own answers rank the suggestions again at
  the suggest step. An administrator confirms the allocation at launch.
*/
export function createB2cCase(
  data: DemoData,
  personId: string,
  companyNumber: string,
  caseId = nextCaseId(data),
): ActionResult & { caseId: string } {
  const now = new Date().toISOString()
  const ranked = suggestAcsps(
    data,
    defaultCriteria(data, personId, companyNumber),
  )
  const suggestedAcspIds = ranked.map((s) => s.acsp.id)
  const acspId =
    suggestedAcspIds[0] ??
    data.acsps.find((a) => a.status === 'active')?.id ??
    PRIMARY_ACSP_ID
  const vc: VerificationCase = {
    id: caseId,
    route: 'A',
    personId,
    companyNumber,
    origin: 'b2c',
    source: 'b2c',
    acspId,
    option: 1,
    status: 'in_progress',
    createdAt: now,
    idvt: {
      documentAuthenticity: 'pending',
      liveness: 'pending',
      faceMatch: 'pending',
      pepSanctions: 'pending',
    },
    observations: [],
    evidence: [],
    allocation: { source: 'suggested', suggestedAcspIds },
  }
  return {
    caseId,
    data: { ...data, cases: [...data.cases, vc] },
    audit: [
      {
        at: now,
        actor: personName(data, personId),
        actorType: 'person',
        action: 'b2c.started',
        caseId,
        detail: 'Started a verification directly on Evidence One.',
      },
    ],
  }
}

/* ACSP review */

export function reviewerName(data: DemoData, reviewerId: string) {
  for (const a of data.acsps) {
    const r = a.reviewers.find((x) => x.id === reviewerId)
    if (r) return `${r.name}, ${a.name.replace(' Solicitors LLP', '')}`
  }
  return 'ACSP reviewer'
}

export function decideCase(
  data: DemoData,
  caseId: string,
  outcome: DecisionOutcome,
  reasonCode: string,
  note: string,
  reviewerId: string,
  stepUpRef?: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = Date.now()
  const iso = (o = 0) => new Date(now + o).toISOString()
  const status =
    outcome === 'approve'
      ? 'approved'
      : outcome === 'request_info'
        ? 'info_requested'
        : 'declined'
  const actor = reviewerName(data, reviewerId)
  const version = currentRuleSet(data).version
  const verb = {
    approve: 'Approved',
    request_info: 'More information requested',
    decline: 'Declined',
  }[outcome]
  const audit: AuditInput[] = []
  if (stepUpRef)
    audit.push({
      at: iso(),
      actor,
      actorType: 'person',
      action: 'auth.stepup.succeeded',
      caseId,
      detail: `Step-up ${stepUpRef} confirmed before the decision.`,
    })
  audit.push({
    at: iso(1000),
    actor,
    actorType: 'person',
    action: `case.decision.${outcome}`,
    caseId,
    detail: `${verb}. Reason ${reasonCode}.${outcome === 'request_info' ? ` Requested: ${note}` : ` Decided under Route A rule set ${version}.`}${outcome === 'approve' ? ' Retention of 7 years starts from this decision.' : outcome === 'decline' ? ' The individual is shown the client’s rejection message. Record retained for 7 years.' : ''}`,
  })
  const decided: ActionResult = {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      status,
      reviewerId,
      escalatedTo: undefined,
      ruleSetVersion: outcome === 'request_info' ? c.ruleSetVersion : version,
      decision: {
        outcome,
        reasonCode,
        note: note || undefined,
        decidedAt: iso(1000),
        reviewerId,
        stepUpRef,
      },
    })),
    audit,
  }
  // P10: the payment is taken on approval and released on a decline.
  if (outcome === 'approve')
    return then(decided, (d) => takePayment(d, caseId, iso(2000)))
  if (outcome === 'decline')
    return then(decided, (d) =>
      releasePayment(d, caseId, 'Verification declined', iso(2000)),
    )
  return decided
}

export function recordRuleDecision(
  data: DemoData,
  caseId: string,
  ruleId: string,
  decision: RuleDecision['decision'],
  reason: string,
  reviewerId: string,
): ActionResult {
  const now = new Date().toISOString()
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      ruleDecisions: {
        ...c.ruleDecisions,
        [ruleId]: { decision, reason, at: now, reviewerId },
      },
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'rule.decision.recorded',
        caseId,
        detail: `Mandatory decision on ${ruleId}: ${decision === 'satisfied' ? 'satisfied' : 'not satisfied'}. Reason: ${reason}`,
      },
    ],
  }
}

export function escalateCase(
  data: DemoData,
  caseId: string,
  toReviewerId: string,
  note: string,
  reviewerId: string,
): ActionResult {
  const now = new Date().toISOString()
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      escalatedTo: { reviewerId: toReviewerId, at: now, note },
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'case.escalated',
        caseId,
        detail: `Escalated to ${reviewerName(data, toReviewerId)} without a decision. Note: ${note}`,
      },
    ],
  }
}

/** The reviewer records the Option 2 person check: the documents seen in person. */
export function recordOption2Check(
  data: DemoData,
  caseId: string,
  reviewerId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const person = vc && data.people.find((p) => p.id === vc.personId)
  if (!vc || !person) return { data, audit: [] }
  const now = new Date().toISOString()
  const documents = [
    {
      group: 'A' as const,
      label: 'UK passport',
      expiresOn: person.document?.expiresOn,
    },
    { group: 'B' as const, label: 'Bank statement, dated within 6 months' },
  ]
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      option2: {
        ...c.option2!,
        documents,
        checkedAt: now,
        checkedBy: reviewerId,
      },
      evidence: [
        ...c.evidence.filter((e) => e.kind !== 'option2_document'),
        ...documents.map((d, i) => ({
          id: `ev-${c.id}-o2-${i}`,
          kind: 'option2_document' as const,
          label: `${d.label}, seen at the person check`,
          uploadedAt: now,
          note: 'Checked in person by a trained reviewer.',
        })),
      ],
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'option2.check_recorded',
        caseId,
        detail:
          'Person check recorded: UK passport (Group A) and bank statement (Group B).',
      },
    ],
  }
}

export function fileCorrection(
  data: DemoData,
  taskId: string,
  reviewerId: string,
): ActionResult {
  const task = data.corrections.find((t) => t.id === taskId)
  if (!task || task.status !== 'open') return { data, audit: [] }
  const now = new Date().toISOString()
  // A synthetic filing reference. The company authentication code and One Login details are never seen or stored.
  const filingReference = `WF-2026-${syntheticCode(taskId, 6)}`
  return {
    data: {
      ...data,
      corrections: data.corrections.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'filed',
              filedAt: now,
              filingReference,
              filingOutcome: 'accepted',
            }
          : t,
      ),
    },
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'route_b.filing.recorded',
        caseId: task.caseId,
        detail: `Filing ${task.id} made by the ACSP through its own Companies House WebFiling account: ${task.field.toLowerCase()} ${task.registerValue} to ${task.correctValue}. Outcome accepted, filing reference ${filingReference}. Evidence One did not see the login or the company authentication code.`,
      },
    ],
  }
}

/**
  Once Companies House updates the register, the register comparison passes. A
  register difference no longer halts Route A, so the case is not paused or
  resumed by this task: it stays where the reviewer has it.
*/
export function registerUpdated(data: DemoData, taskId: string): ActionResult {
  const task = data.corrections.find((t) => t.id === taskId)
  if (!task || task.status !== 'filed') return { data, audit: [] }
  const now = Date.now()
  const iso = (o = 0) => new Date(now + o).toISOString()
  const person = data.people.find((p) => p.id === task.personId)
  const register = data.register.map((r) => {
    if (r.personId !== task.personId || r.companyNumber !== task.companyNumber)
      return r
    if (task.field === 'First name')
      return {
        ...r,
        registerName: r.registerName.replace(
          task.registerValue,
          task.correctValue,
        ),
      }
    if (task.field === 'Full name' && person)
      return {
        ...r,
        registerName: `${person.familyName.toUpperCase()}, ${person.givenNames}`,
      }
    return r
  })
  const next = patchCase({ ...data, register }, task.caseId, (c) => ({
    ...c,
    observations: [
      {
        id: `o-${c.id}-fix`,
        step: 'register',
        ruleId: 'REG-11',
        severity: 'info',
        title: 'Register corrected, details now match',
        detail: `Companies House updated the register after filing ${task.id}. The details on the document now match the register after normalisation. The reviewer's decision on the earlier difference stands on the record.`,
        source: 'Companies House officer record',
      },
      ...c.observations.filter((o) => o.severity !== 'mismatch'),
    ],
  }))
  return {
    data: {
      ...next,
      corrections: next.corrections.map((t) =>
        t.id === taskId
          ? { ...t, status: 'register_updated', updatedAt: iso() }
          : t,
      ),
    },
    audit: [
      {
        at: iso(),
        actor: 'Companies House register',
        actorType: 'system',
        action: 'register.updated',
        caseId: task.caseId,
        detail: `Register updated: ${task.field.toLowerCase()} now ${task.correctValue}. Route A was not paused by task ${task.id}.`,
      },
    ],
  }
}

/* Submission to Companies House. The personal code is never collected or kept. */

export function startSubmission(
  data: DemoData,
  caseId: string,
  reviewerId: string,
  stepUpRef: string,
): ActionResult {
  const now = new Date().toISOString()
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      status: 'submission_started',
      submission: {
        ...c.submission,
        startedAt: now,
        stepUpRef,
        fieldsDone: [],
      },
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'submission.started',
        caseId,
        detail: `Submission workspace started. Step-up ${stepUpRef} confirmed. Status SUBMISSION_STARTED.`,
      },
    ],
  }
}

export function toggleSubmissionField(
  data: DemoData,
  caseId: string,
  key: string,
): ActionResult {
  return {
    data: patchCase(data, caseId, (c) => {
      const done = c.submission?.fieldsDone ?? []
      return {
        ...c,
        submission: {
          ...c.submission,
          fieldsDone: done.includes(key)
            ? done.filter((k) => k !== key)
            : [...done, key],
        },
      }
    }),
    audit: [],
  }
}

export function handOffSubmission(
  data: DemoData,
  caseId: string,
  reviewerId: string,
): ActionResult {
  const now = new Date().toISOString()
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      submission: { ...c.submission, handedOffAt: now },
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'submission.handoff',
        caseId,
        detail:
          'Continued to GOV.UK One Login with the submission pack. The reviewer signs in with their own GOV.UK One Login.',
      },
    ],
  }
}

export function returnFromSubmission(
  data: DemoData,
  caseId: string,
  reviewerId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc || vc.status !== 'submission_started') return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      status: 'submitted',
      submission: { ...c.submission, submittedAt: now },
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'submission.submitted',
        caseId,
        detail:
          'Returned from the Companies House service. Submission made. Status SUBMITTED.',
      },
    ],
  }
}

export function confirmSubmission(
  data: DemoData,
  caseId: string,
  reference: string,
  source: 'entered' | 'forwarded_email',
  reviewerId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const person = vc && data.people.find((p) => p.id === vc.personId)
  if (!vc || !person) return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: patchCase(data, caseId, (c) => ({
      ...c,
      status: 'confirmed',
      submission: {
        ...c.submission,
        confirmedAt: now,
        verificationReference: reference,
        referenceSource: source,
      },
      // The day after Companies House confirms, the individual is asked whether the code has arrived (M7). Only the question is held, never the code.
      personalCodeReceipt: c.personalCodeReceipt ?? {
        askedAt: new Date(Date.now() + 24 * HOUR).toISOString(),
      },
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'submission.confirmed',
        caseId,
        detail: `Verification reference ${reference} recorded${source === 'forwarded_email' ? ' from the forwarded confirmation email' : ''}. Status CONFIRMED. Companies House emails the personal code directly to ${fullName(person)}; Evidence One does not receive or keep it.`,
      },
    ],
  }
}

/** Corrections go against the original case and its verification reference. Never a second submission. */
export function startCorrection(
  data: DemoData,
  caseId: string,
  fields: SubmissionCorrection['fields'],
  reviewerId: string,
  stepUpRef: string,
): ActionResult & { correctionId: string } {
  const vc = data.cases.find((c) => c.id === caseId)
  const now = new Date().toISOString()
  const existing = vc?.submission?.corrections ?? []
  const correctionId = `${caseId}-C${existing.length + 1}`
  if (!vc?.submission?.verificationReference)
    return { data, audit: [], correctionId }
  const correction: SubmissionCorrection = {
    id: correctionId,
    startedAt: now,
    fields,
    stepUpRef,
  }
  return {
    correctionId,
    data: patchCase(data, caseId, (c) => ({
      ...c,
      submission: { ...c.submission, corrections: [...existing, correction] },
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'submission.correction.started',
        caseId,
        detail: `Correction pack ${correctionId} prepared against verification reference ${vc.submission.verificationReference}: ${fields.map((f) => f.label.toLowerCase()).join(', ')}. Step-up ${stepUpRef}.`,
      },
    ],
  }
}

function patchCorrection(
  data: DemoData,
  caseId: string,
  correctionId: string,
  patch: Partial<SubmissionCorrection>,
) {
  return patchCase(data, caseId, (c) => ({
    ...c,
    submission: {
      ...c.submission,
      corrections: (c.submission?.corrections ?? []).map((x) =>
        x.id === correctionId ? { ...x, ...patch } : x,
      ),
    },
  }))
}

export function handOffCorrection(
  data: DemoData,
  caseId: string,
  correctionId: string,
  reviewerId: string,
): ActionResult {
  const now = new Date().toISOString()
  return {
    data: patchCorrection(data, caseId, correctionId, { handedOffAt: now }),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'submission.correction.handoff',
        caseId,
        detail: `Continued to the Companies House service "Correct someone's identity verification details" with correction pack ${correctionId}.`,
      },
    ],
  }
}

export function recordCorrection(
  data: DemoData,
  caseId: string,
  correctionId: string,
  reviewerId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const corr = vc?.submission?.corrections?.find((x) => x.id === correctionId)
  if (!vc || !corr || corr.recordedAt) return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: patchCorrection(data, caseId, correctionId, { recordedAt: now }),
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'submission.correction.recorded',
        caseId,
        detail: `Correction ${correctionId} made and recorded against the original case and verification reference ${vc.submission?.verificationReference}.`,
      },
    ],
  }
}

export function recordExport(
  data: DemoData,
  caseId: string,
  stepUpRef: string,
  actor: string,
): ActionResult {
  return {
    data,
    audit: [
      {
        at: new Date().toISOString(),
        actor,
        actorType: 'person',
        action: 'record.exported',
        caseId,
        detail: `Verification record exported as PDF. Step-up ${stepUpRef} confirmed. Code messages are never included.`,
      },
    ],
  }
}

/* Rule set versions. A published version never changes; a change makes a draft. */

function nextVersionName(data: DemoData): string {
  const [year, n] = currentRuleSet(data).version.split('.').map(Number)
  const thisYear = new Date().getFullYear()
  return year === thisYear ? `${year}.${n + 1}` : `${thisYear}.1`
}

const settingLabel = (key: SettingKey, value: RuleSettings[SettingKey]) =>
  settingDefs.find((s) => s.key === key)?.options.find((o) => o.value === value)
    ?.label ?? String(value)

export type RuleChange =
  | { kind: 'param'; key: ParamKey; value: number }
  | { kind: 'setting'; key: SettingKey; value: RuleSettings[SettingKey] }

export function proposeRuleChange(
  data: DemoData,
  change: RuleChange,
  actor: string,
): ActionResult {
  const now = new Date().toISOString()
  const current = currentRuleSet(data)
  const existing = draftRuleSet(data)
  if (existing?.status === 'pending_approval') return { data, audit: [] }
  const base: RuleSetVersion = existing ?? {
    version: nextVersionName(data),
    status: 'draft',
    params: { ...current.params },
    settings: { ...current.settings },
    createdAt: now,
    createdBy: actor,
  }
  const draft: RuleSetVersion =
    change.kind === 'param'
      ? { ...base, params: { ...base.params, [change.key]: change.value } }
      : {
          ...base,
          settings: {
            ...base.settings,
            [change.key]: change.value,
          } as RuleSettings,
        }
  const label =
    change.kind === 'param'
      ? `${paramDefs.find((p) => p.key === change.key)?.label} set to ${change.value}`
      : `${settingDefs.find((s) => s.key === change.key)?.label} set to ${settingLabel(change.key, change.value)}`
  const audit: AuditInput[] = []
  if (!existing)
    audit.push({
      at: now,
      actor,
      actorType: 'person',
      action: 'ruleset.draft.created',
      detail: `Draft version ${draft.version} created from ${current.version}. Version ${current.version} is unchanged.`,
    })
  audit.push({
    at: now,
    actor,
    actorType: 'person',
    action: 'ruleset.draft.changed',
    detail: `Draft ${draft.version}: ${label}.`,
  })
  return {
    data: {
      ...data,
      ruleSets: existing
        ? data.ruleSets.map((v) => (v.version === existing.version ? draft : v))
        : [...data.ruleSets, draft],
    },
    audit,
  }
}

export function discardDraft(data: DemoData, actor: string): ActionResult {
  const draft = draftRuleSet(data)
  if (!draft) return { data, audit: [] }
  return {
    data: {
      ...data,
      ruleSets: data.ruleSets.filter((v) => v.version !== draft.version),
    },
    audit: [
      {
        at: new Date().toISOString(),
        actor,
        actorType: 'person',
        action: 'ruleset.draft.discarded',
        detail: `Draft version ${draft.version} discarded. Nothing was published.`,
      },
    ],
  }
}

export function submitDraft(data: DemoData, actor: string): ActionResult {
  const draft = draftRuleSet(data)
  if (!draft || draft.status !== 'draft') return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: {
      ...data,
      ruleSets: data.ruleSets.map((v) =>
        v.version === draft.version
          ? {
              ...v,
              status: 'pending_approval',
              submittedAt: now,
              submittedBy: actor,
            }
          : v,
      ),
    },
    audit: [
      {
        at: now,
        actor,
        actorType: 'person',
        action: 'ruleset.submitted',
        detail: `Draft version ${draft.version} submitted for approval. Publishing needs a second approver.`,
      },
    ],
  }
}

export function returnDraft(
  data: DemoData,
  actor: string,
  note: string,
): ActionResult {
  const draft = draftRuleSet(data)
  if (!draft || draft.status !== 'pending_approval') return { data, audit: [] }
  return {
    data: {
      ...data,
      ruleSets: data.ruleSets.map((v) =>
        v.version === draft.version
          ? {
              ...v,
              status: 'draft',
              submittedAt: undefined,
              submittedBy: undefined,
            }
          : v,
      ),
    },
    audit: [
      {
        at: new Date().toISOString(),
        actor,
        actorType: 'person',
        action: 'ruleset.returned',
        detail: `Version ${draft.version} returned to draft by the second approver. ${note}`,
      },
    ],
  }
}

export function publishDraft(
  data: DemoData,
  effectiveFrom: string,
  actor: string,
): ActionResult {
  const draft = draftRuleSet(data)
  if (
    !draft ||
    draft.status !== 'pending_approval' ||
    draft.submittedBy === actor
  )
    return { data, audit: [] }
  const now = new Date().toISOString()
  const current = currentRuleSet(data)
  return {
    data: {
      ...data,
      ruleSets: data.ruleSets.map((v) =>
        v.version === draft.version
          ? {
              ...v,
              status: 'current',
              approvedBy: actor,
              publishedBy: actor,
              publishedAt: now,
              effectiveFrom,
            }
          : v.version === current.version
            ? { ...v, status: 'superseded', supersededAt: effectiveFrom }
            : v,
      ),
    },
    audit: [
      {
        at: now,
        actor,
        actorType: 'person',
        action: 'ruleset.published',
        detail: `${RULE_SET_NAME} version ${draft.version} published, effective ${effectiveFrom.slice(0, 10)}. Proposed by ${draft.submittedBy}, approved by ${actor}. Version ${current.version} is now superseded. Decided cases keep the version applied at their decision.`,
      },
    ],
  }
}

/* ACSP Copilot. Every exchange is recorded. */

export const COPILOT_ACTOR = 'ACSP Copilot, Evidence One Intelligence'
export const MODEL_LABEL = 'Gemini, London region, pinned version'

export function logCopilotExchange(
  data: DemoData,
  input: {
    caseId?: string
    question: string
    answer: string
    sources: string[]
    reviewer: string
  },
): ActionResult {
  const now = new Date().toISOString()
  const answer =
    input.answer.length > 160
      ? `${input.answer.slice(0, 157)}...`
      : input.answer
  return {
    data,
    audit: [
      {
        at: now,
        actor: COPILOT_ACTOR,
        actorType: 'ai',
        action: 'copilot.exchange',
        caseId: input.caseId,
        detail: `Asked by ${input.reviewer}: ${looksLikeCode(input.question) ? '[question not kept: it looked like a code]' : `"${input.question}"`} Answer: ${answer} Sources: ${input.sources.length ? input.sources.join(', ') : 'none'}. Model: ${MODEL_LABEL}. Advisory only.`,
      },
    ],
  }
}

export function sendCopilotDraft(
  data: DemoData,
  caseId: string,
  body: string,
  reviewerId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data,
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'message.sent',
        caseId,
        detail: `Message sent to ${personName(data, vc.personId)} after the reviewer checked the Copilot draft: "${body.length > 120 ? `${body.slice(0, 117)}...` : body}"`,
      },
    ],
  }
}

/* Admin */

export function setAllocationShare(
  data: DemoData,
  acspId: string,
  share: number,
): ActionResult {
  const acsp = data.acsps.find((a) => a.id === acspId)
  if (!acsp) return { data, audit: [] }
  const next = Math.max(5, Math.min(80, share))
  return {
    data: {
      ...data,
      acsps: data.acsps.map((a) =>
        a.id === acspId ? { ...a, b2cAllocationShare: next } : a,
      ),
    },
    audit: [
      {
        at: new Date().toISOString(),
        actor: 'Marcus Adeyemi, Platform Administrator',
        actorType: 'person',
        action: 'admin.allocation.updated',
        detail: `B2C allocation weight for ${acsp.name} set to ${next}.`,
      },
    ],
  }
}
