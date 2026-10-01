import { PRIMARY_ACSP_ID } from '@/data/organisations'
import type { AuditInput } from '@/lib/audit'
import { formatMoney, fullName } from '@/lib/format'
import { compareToRegister } from '@/lib/register'
import type { AiObservation, CorrectionTask, DecisionOutcome, DemoData, EvidenceItem, IdDocument, IdDocumentType, Invite, JourneyState, Payment, PaymentMethod, Person, VerificationCase } from '@/types/domain'

/*
  Pure state transitions. Each returns the next data and the audit events to
  append, so every action is recorded in the hash-chained trail.
*/

export interface ActionResult {
  data: DemoData
  audit: AuditInput[]
}

function nextRef(existing: string[], prefix: string, start: number): string {
  const max = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .reduce((a, b) => Math.max(a, b), start)
  return `${prefix}${String(max + 1).padStart(6, '0')}`
}

export function connectCompany(data: DemoData, number: string, agentId: string, actor: string): ActionResult {
  const now = new Date().toISOString()
  const company = data.companies.find((c) => c.number === number)
  if (!company) return { data, audit: [] }
  return {
    data: {
      ...data,
      companies: data.companies.map((c) => (c.number === number ? { ...c, lodgedByAgentId: agentId, connectedAt: now } : c)),
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
  agentId: string
  actor: string
  payment: PaymentMethod
  review: 'referred' | 'in_house'
}

export function sendInvites(data: DemoData, input: SendInvitesInput): ActionResult & { inviteIds: string[] } {
  const now = new Date().toISOString()
  const agent = data.agents.find((a) => a.id === input.agentId)
  const code = input.payment === 'agent_payment_code' ? agent?.paymentCode : undefined
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
    inviteIds = [...inviteIds, inviteId]
    caseIds = [...caseIds, caseId]
    const inHouse = input.review === 'in_house'
    invites.push({
      id: inviteId,
      personId,
      companyNumber: input.companyNumber,
      agentId: input.agentId,
      sentAt: now,
      paymentCode: code,
      status: 'sent',
      caseId,
      review: input.review,
    })
    cases.push({
      id: caseId,
      route: 'A',
      personId,
      companyNumber: input.companyNumber,
      origin: 'agent_invite',
      agentId: input.agentId,
      acspId: inHouse ? input.agentId : PRIMARY_ACSP_ID,
      inHouse,
      option: 1,
      status: 'invited',
      createdAt: now,
      idvt: { nfcChipRead: 'pending', documentAuthenticity: 'pending', liveness: 'pending', faceMatch: 'pending', pepSanctions: 'pending' },
      comparison: [],
      observations: [],
      evidence: [],
    })
    audit.push({
      at: now,
      actor: input.actor,
      actorType: 'person',
      action: 'invite.sent',
      caseId,
      detail: `Invite ${inviteId} sent to ${fullName(person)}, pre-filled from the register${code ? ` with Agent Payment Code ${code}` : ', individual pays by card'}. ${inHouse ? 'Reviewed in-house.' : 'Referred to Harcourt Lane Solicitors LLP.'}`,
    })
  }

  return {
    data: { ...data, invites: [...data.invites, ...invites], cases: [...data.cases, ...cases] },
    audit,
    inviteIds: invites.map((i) => i.id),
  }
}

/* Individual journey */

const personName = (data: DemoData, personId: string) => {
  const p = data.people.find((x) => x.id === personId)
  return p ? fullName(p) : 'The individual'
}

function patchCase(data: DemoData, caseId: string, patch: (c: VerificationCase) => VerificationCase): DemoData {
  return { ...data, cases: data.cases.map((c) => (c.id === caseId ? patch(c) : c)) }
}

export function updateJourney(data: DemoData, caseId: string, patch: Partial<JourneyState>, event?: { action: string; detail: string; actorType?: 'person' | 'system' | 'ai' }): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = new Date().toISOString()
  const next = patchCase(data, caseId, (c) => ({ ...c, status: c.status === 'invited' ? 'in_progress' : c.status, journey: { ...c.journey, ...patch } }))
  const invites = next.invites.map((i) => (i.caseId === caseId && (i.status === 'sent' || i.status === 'opened') ? { ...i, status: 'accepted' as const } : i))
  return {
    data: { ...next, invites },
    audit: event
      ? [{ at: now, actor: event.actorType === 'ai' ? 'Evidence One Intelligence' : event.actorType === 'system' ? 'Certified identity provider' : personName(data, vc.personId), actorType: event.actorType ?? 'person', action: event.action, caseId, detail: event.detail }]
      : [],
  }
}

export function requestAmendment(data: DemoData, caseId: string, field: string, note: string): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = new Date().toISOString()
  const next = patchCase(data, caseId, (c) => ({ ...c, journey: { ...c.journey, amendment: { field, note, at: now } } }))
  return {
    data: { ...next, invites: next.invites.map((i) => (i.caseId === caseId ? { ...i, status: 'amendment_requested' as const } : i)) },
    audit: [{ at: now, actor: personName(data, vc.personId), actorType: 'person', action: 'invite.amendment_requested', caseId, detail: `Amendment requested to ${field.toLowerCase()}: ${note}` }],
  }
}

export function requestOption2(data: DemoData, caseId: string): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: patchCase(data, caseId, (c) => ({ ...c, option: 2, status: 'in_progress' })),
    audit: [{ at: now, actor: personName(data, vc.personId), actorType: 'person', action: 'option2.requested', caseId, detail: 'Document cannot be checked digitally. Option 2 trained human check requested as a fallback.' }],
  }
}

export interface SubmitInput {
  caseId: string
  documentType: IdDocumentType
  payment: Payment
  evidenceUploaded: boolean
}

export function submitForReview(data: DemoData, input: SubmitInput): ActionResult {
  const vc = data.cases.find((c) => c.id === input.caseId)
  const person = vc && data.people.find((p) => p.id === vc.personId)
  const entry = vc && data.register.find((r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber)
  if (!vc || !person || !entry) return { data, audit: [] }
  const now = Date.now()
  const iso = (offset = 0) => new Date(now + offset).toISOString()
  const document = person.document ?? syntheticDocument(person, input.documentType)
  const comparison = compareToRegister(person, entry, document.nameOnDocument, document.dobOnDocument)
  const mismatch = comparison.some((r) => r.result === 'mismatch')
  const score = 95 + ((person.id.length * 7) % 40) / 10
  const ref = `IDV-7F31-${String(now).slice(-4)}`
  const observations: AiObservation[] = mismatch
    ? [{ id: `o-${vc.id}-m`, severity: 'mismatch', title: 'Name does not match the Companies House register', detail: 'Identity details must match the register exactly. The reviewer can pause this verification and open a register correction.', source: 'Identity document, Companies House officer record' }]
    : [{ id: `o-${vc.id}-1`, severity: 'info', title: 'All details match the register', detail: 'Name and date of birth from the identity document agree with the application and the Companies House register.', source: 'Identity document, Companies House officer record' }]
  if (input.evidenceUploaded) {
    observations.push({ id: `o-${vc.id}-2`, severity: 'info', title: 'Supporting evidence confirms the current address', detail: 'The address moved within the last 12 months. The bank statement uploaded is dated within 3 months and shows the current address.', source: 'Bank statement, issue date and address' })
  } else {
    observations.push({ id: `o-${vc.id}-3`, severity: 'info', title: 'One identity document was sufficient', detail: 'The document was validated and the address history is consistent, so no supporting evidence was needed.', source: 'Application, identity document' })
  }
  const evidence: EvidenceItem[] = [
    { id: `ev-${vc.id}-1`, kind: 'identity_document', label: documentLabel[input.documentType], uploadedAt: iso(-6 * 60000), aiCheck: 'accepted', aiNote: 'Document in date. Security features validated by the certified identity provider.' },
    { id: `ev-${vc.id}-2`, kind: 'selfie', label: 'Liveness capture', uploadedAt: iso(-4 * 60000), aiCheck: 'accepted' },
  ]
  if (input.evidenceUploaded) evidence.push({ id: `ev-${vc.id}-3`, kind: 'address_evidence', label: 'Bank statement', uploadedAt: iso(-2 * 60000), documentDate: iso(-18 * 24 * 3600000), aiCheck: 'accepted', aiNote: 'Dated within the last 3 months. Name and current address match.' })

  const next = patchCase(data, vc.id, (c) => ({
    ...c,
    status: 'in_review',
    submittedForReviewAt: iso(),
    slaDueAt: iso(36 * 3600000),
    idvt: {
      nfcChipRead: input.documentType === 'passport' ? 'pass' : 'not_applicable',
      documentAuthenticity: 'pass',
      liveness: 'pass',
      faceMatch: 'pass',
      faceMatchScore: Math.round(score * 10) / 10,
      pepSanctions: 'pass',
      pepSanctionsDetail: 'No match on PEP, sanctions or adverse media lists.',
      completedAt: iso(-3 * 60000),
      providerReference: ref,
    },
    comparison,
    observations,
    evidence,
    payment: input.payment,
    journey: { ...c.journey, paid: true },
  }))
  const people = person.document ? next.people : next.people.map((p) => (p.id === person.id ? { ...p, document } : p))
  const actor = fullName(person)
  return {
    data: { ...next, people },
    audit: [
      { at: iso(), actor: 'Certified identity provider', actorType: 'system', action: 'idvt.result.received', caseId: vc.id, detail: `${input.documentType === 'passport' ? 'Chip read, ' : ''}authenticity, liveness, face match ${Math.round(score * 10) / 10}%, PEP and sanctions: all passed.` },
      { at: iso(1000), actor: 'Evidence One Intelligence', actorType: 'ai', action: mismatch ? 'ai.flag.register_mismatch' : 'ai.observation.created', caseId: vc.id, detail: mismatch ? 'Register comparison found a difference. Advisory flag raised for the reviewer.' : 'Register comparison complete. No mismatch. Advisory only.' },
      { at: iso(2000), actor, actorType: 'person', action: 'payment.completed', caseId: vc.id, detail: input.payment.method === 'agent_payment_code' ? `Paid with Agent Payment Code ${input.payment.code}.` : `Paid ${formatMoney(input.payment.amount)} by card. Reference ${input.payment.reference}.` },
      { at: iso(3000), actor, actorType: 'person', action: 'case.submitted', caseId: vc.id, detail: 'Submitted for ACSP review. 36-hour SLA started.' },
    ],
  }
}

const documentLabel: Record<IdDocumentType, string> = {
  passport: 'Passport, chip read in app',
  driving_licence: 'UK photocard driving licence',
  national_identity_card: 'National identity card',
  biometric_residence_permit: 'Biometric residence permit',
}

function syntheticDocument(person: Person, type: IdDocumentType): IdDocument {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 6)
  return {
    type,
    issuingCountry: 'United Kingdom',
    numberLastTwo: String(person.id.length * 7).slice(-2).padStart(2, '0'),
    expiresOn: expires.toISOString().slice(0, 10),
    nameOnDocument: `${person.givenNames} ${person.familyName}`.toUpperCase(),
    dobOnDocument: person.dateOfBirth,
    hasChip: type === 'passport',
  }
}

/* B2C: a member of the public who comes to Evidence One directly */

/** The ACSP furthest below its share of this month's direct cases gets the next one. */
export function nextB2cAcsp(data: DemoData) {
  return [...data.acsps].sort((a, b) => a.b2cAllocatedThisMonth / a.b2cAllocationShare - b.b2cAllocatedThisMonth / b.b2cAllocationShare)[0]
}

export const nextCaseId = (data: DemoData) => nextRef(data.cases.map((c) => c.id), 'EO-2026-', 0)

export function createB2cCase(data: DemoData, personId: string, companyNumber: string, acspId: string, caseId = nextCaseId(data)): ActionResult & { caseId: string } {
  const now = new Date().toISOString()
  const acsp = data.acsps.find((a) => a.id === acspId)
  const vc: VerificationCase = {
    id: caseId,
    route: 'A',
    personId,
    companyNumber,
    origin: 'b2c',
    acspId,
    option: 1,
    status: 'in_progress',
    createdAt: now,
    idvt: { nfcChipRead: 'pending', documentAuthenticity: 'pending', liveness: 'pending', faceMatch: 'pending', pepSanctions: 'pending' },
    comparison: [],
    observations: [],
    evidence: [],
  }
  return {
    caseId,
    data: { ...data, cases: [...data.cases, vc], acsps: data.acsps.map((a) => (a.id === acspId ? { ...a, b2cAllocatedThisMonth: a.b2cAllocatedThisMonth + 1 } : a)) },
    audit: [
      { at: now, actor: personName(data, personId), actorType: 'person', action: 'b2c.started', caseId, detail: 'Started a verification directly on Evidence One.' },
      { at: now, actor: 'Evidence One', actorType: 'system', action: 'b2c.allocated', caseId, detail: `Allocated to ${acsp?.name} by the allocation rota.` },
    ],
  }
}

/* ACSP review */

function reviewerName(data: DemoData, reviewerId: string) {
  for (const a of data.acsps) {
    const r = a.reviewers.find((x) => x.id === reviewerId)
    if (r) return `${r.name}, ${a.name.replace(' Solicitors LLP', '')}`
  }
  return 'ACSP reviewer'
}

export function decideCase(data: DemoData, caseId: string, outcome: DecisionOutcome, reasonCode: string, note: string, reviewerId: string): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = Date.now()
  const iso = (o = 0) => new Date(now + o).toISOString()
  const status = outcome === 'approve' ? 'approved' : outcome === 'request_info' ? 'info_requested' : 'declined'
  const actor = reviewerName(data, reviewerId)
  const verb = { approve: 'Approved', request_info: 'More information requested', decline: 'Declined' }[outcome]
  return {
    data: patchCase(data, caseId, (c) => ({ ...c, status, reviewerId, decision: { outcome, reasonCode, note: note || undefined, decidedAt: iso(1000), reviewerId } })),
    audit: [
      { at: iso(), actor, actorType: 'person', action: 'auth.stepup.succeeded', caseId, detail: 'Second factor confirmed before the decision.' },
      { at: iso(1000), actor, actorType: 'person', action: `case.decision.${outcome}`, caseId, detail: `${verb}. Reason ${reasonCode}.${outcome === 'approve' ? ' Retention period of 7 years starts.' : outcome === 'decline' ? ' Record retained for 7 years.' : ''}` },
    ],
  }
}

export function haltForMismatch(data: DemoData, caseId: string, reviewerId: string): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const row = vc?.comparison.find((r) => r.result === 'mismatch')
  if (!vc || !row) return { data, audit: [] }
  const now = new Date().toISOString()
  const taskId = nextRef(data.corrections.map((t) => t.id), 'FL-2026-', 0)
  const task: CorrectionTask = {
    id: taskId,
    route: 'B',
    form: 'ACSP04',
    caseId,
    companyNumber: vc.companyNumber,
    personId: vc.personId,
    field: row.field,
    registerValue: row.register,
    correctValue: row.document,
    status: 'open',
    createdAt: now,
  }
  return {
    data: { ...patchCase(data, caseId, (c) => ({ ...c, status: 'halted_register_mismatch', reviewerId, correctionTaskId: taskId })), corrections: [...data.corrections, task] },
    audit: [{ at: now, actor: reviewerName(data, reviewerId), actorType: 'person', action: 'route_a.halted', caseId, detail: `Route A paused. Route B correction task ${taskId} (ACSP04) created.` }],
  }
}

export function fileCorrection(data: DemoData, taskId: string, reviewerId: string): ActionResult {
  const task = data.corrections.find((t) => t.id === taskId)
  if (!task) return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: { ...data, corrections: data.corrections.map((t) => (t.id === taskId ? { ...t, status: 'filed', filedAt: now } : t)) },
    audit: [{ at: now, actor: reviewerName(data, reviewerId), actorType: 'person', action: 'route_b.acsp04.filed', caseId: task.caseId, detail: `ACSP04 correction filed with Companies House: ${task.field.toLowerCase()} ${task.registerValue} to ${task.correctValue}.` }],
  }
}

/** Once Companies House updates the register, the paused verification resumes. */
export function registerUpdated(data: DemoData, taskId: string): ActionResult {
  const task = data.corrections.find((t) => t.id === taskId)
  if (!task) return { data, audit: [] }
  const now = Date.now()
  const iso = (o = 0) => new Date(now + o).toISOString()
  const entry = data.register.find((r) => r.personId === task.personId && r.companyNumber === task.companyNumber)
  const person = data.people.find((p) => p.id === task.personId)
  const register =
    entry && person && task.field === 'Full name'
      ? data.register.map((r) => (r === entry ? { ...r, registerName: `${person.familyName.toUpperCase()}, ${person.givenNames}` } : r))
      : entry && task.field === 'First name'
        ? data.register.map((r) => (r === entry ? { ...r, registerName: r.registerName.replace(task.registerValue, task.correctValue) } : r))
        : data.register
  const next = patchCase({ ...data, register }, task.caseId, (c) => ({
    ...c,
    status: 'in_review',
    submittedForReviewAt: iso(1000),
    slaDueAt: iso(1000 + 36 * 3600000),
    comparison: c.comparison.map((r) => (r.result === 'mismatch' ? { ...r, register: register.find((x) => x.personId === task.personId && x.companyNumber === task.companyNumber)?.registerName ?? r.register, result: 'match', note: 'Corrected on the register by ACSP04.' } : r)),
    observations: [
      { id: `o-${c.id}-fix`, severity: 'info', title: 'Register corrected, details now match', detail: `Companies House updated the register after ACSP04 correction ${task.id}. Name and date of birth now match the identity document.`, source: 'Companies House officer record' },
      ...c.observations.filter((o) => o.severity !== 'mismatch'),
    ],
  }))
  return {
    data: { ...next, corrections: next.corrections.map((t) => (t.id === taskId ? { ...t, status: 'register_updated', updatedAt: iso() } : t)) },
    audit: [
      { at: iso(), actor: 'Companies House register', actorType: 'system', action: 'register.updated', caseId: task.caseId, detail: `Register updated: ${task.field.toLowerCase()} now ${task.correctValue}.` },
      { at: iso(1000), actor: 'Evidence One', actorType: 'system', action: 'route_a.resumed', caseId: task.caseId, detail: 'Register now matches. Route A resumed and returned to the review queue with a new 36-hour SLA.' },
    ],
  }
}
