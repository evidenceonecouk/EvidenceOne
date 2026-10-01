/*
  Domain model for the Evidence One demo. Terminology follows CLAUDE.md and the
  client's workflow documents exactly. Everything here is synthetic.
*/

export type ISODate = string

export type PersonaId =
  'agent' | 'reviewer' | 'individual' | 'b2c' | 'admin' | 'admin2'

/** Route A is identity verification; Route B is Companies House filings. */
export type Route = 'A' | 'B'

export type RegisterRole = 'director' | 'psc' | 'director_psc'

/** Status shown to Agents per director or PSC. Agents see status only, never documents or evidence. */
export type PersonStatus =
  | 'not_started'
  | 'in_progress'
  | 'awaiting_info'
  | 'with_acsp'
  | 'verified'
  | 'not_completed'
  | 'reverification_due'

export type CaseStatus =
  | 'invited'
  | 'in_progress'
  | 'in_review'
  | 'info_requested'
  | 'halted_register_mismatch'
  | 'approved'
  | 'submission_started'
  | 'submitted'
  | 'confirmed'
  | 'declined'
  | 'abandoned'

export type DecisionOutcome = 'approve' | 'request_info' | 'decline'

/** The six outcomes a rule can produce. No rule ever declines a case. */
export type RuleOutcome =
  'pass' | 'flag' | 'mandatory' | 'request' | 'halt' | 'block'

/** The step of the journey a rule result or AI observation belongs to. */
export type CaseStep =
  | 'info'
  | 'register'
  | 'document'
  | 'idvt'
  | 'aml'
  | 'evidence'
  | 'option'
  | 'decision'
  | 'submission'

export interface Address {
  line1: string
  line2?: string
  town: string
  postcode: string
  country: string
}

export interface AddressPeriod {
  address: Address
  from: ISODate
  /** Undefined for the current address. */
  to?: ISODate
}

export type IdDocumentType =
  | 'passport'
  | 'driving_licence'
  | 'national_identity_card'
  | 'biometric_residence_permit'

export interface IdDocument {
  type: IdDocumentType
  issuingCountry: string
  /** Only the last two characters are shown, except in the submission pack. */
  numberLastTwo: string
  /** Full synthetic document number, shown only in the submission pack. */
  number?: string
  expiresOn: ISODate
  nameOnDocument: string
  dobOnDocument: ISODate
  nationalityOnDocument?: string
  hasChip: boolean
  /** Address printed on a photocard driving licence, if any. */
  addressOnDocument?: string
  /** Name printed in a non-Latin script and transliterated by the issuer. */
  nonLatinName?: boolean
  cancelledOrReplaced?: boolean
  damaged?: boolean
}

export interface Person {
  id: string
  title?: string
  givenNames: string
  familyName: string
  formerNames?: string[]
  dateOfBirth: ISODate
  nationality: string
  email: string
  mobile: string
  addressHistory: AddressPeriod[]
  document?: IdDocument
  /** Set when a previously verified person must verify again. */
  reverificationDue?: boolean
  reverificationNote?: string
}

export interface RegisterEntry {
  personId: string
  companyNumber: string
  role: RegisterRole
  appointedOn: ISODate
  /** Name exactly as held on the Companies House register. */
  registerName: string
  /** The public register shows month and year only. */
  registerDobMonthYear: string
  registerNationality: string
  natureOfControl?: string
  /** The register already shows this person's identity as verified (rule REG-04). */
  identityVerified?: boolean
  activeAppointments?: number
}

export interface Company {
  number: string
  name: string
  type: 'ltd' | 'plc' | 'llp'
  status: 'active' | 'dissolved'
  incorporatedOn: ISODate
  registeredOffice: Address
  sicCodes: string[]
  sicDescription: string
  /** Agent who lodged the company on the portal, if any. */
  lodgedByAgentId?: string
  connectedAt?: ISODate
}

export interface AgentOrg {
  id: string
  name: string
  kind: string
  /** Agents with ACSP status can approve or decline; without, they can only refer. */
  hasAcspStatus: boolean
  contactName: string
  /** Prefix for this Agent's single-use payment codes, one per invite. */
  paymentCode?: string
}

export interface AcspFirm {
  id: string
  name: string
  kind: string
  supervisor: string
  acspNumber: string
  reviewers: Reviewer[]
  /** Share of B2C allocations, as a percentage. */
  b2cAllocationShare: number
  /** Direct (B2C) cases allocated this month, used by the allocation rota. */
  b2cAllocatedThisMonth: number
  remunerationPerCase: number
}

export interface Reviewer {
  id: string
  name: string
  role: string
  /** Training attestation for Option 2 person checks (rule OPT-03). */
  attestation?: {
    course: string
    completedOn: ISODate
    expiresOn: ISODate
    reference: string
  }
  senior?: boolean
}

export type CheckResult =
  'pass' | 'fail' | 'refer' | 'pending' | 'not_applicable'

export interface IdvtResults {
  nfcChipRead: CheckResult
  documentAuthenticity: CheckResult
  liveness: CheckResult
  faceMatch: CheckResult
  faceMatchScore?: number
  pepSanctions: CheckResult
  pepSanctionsDetail?: string
  /** Screening returned a possible PEP match (rule AML-02). */
  pepPossibleMatch?: boolean
  sanctionsPossibleMatch?: boolean
  adverseMedia?: boolean
  completedAt?: ISODate
  providerReference?: string
  /** Attempts at the checks so far (rule IDVT-07). */
  attempts?: number
}

export type ObservationSeverity = 'info' | 'attention' | 'mismatch'

export interface AiObservation {
  id: string
  severity: ObservationSeverity
  title: string
  detail: string
  source: string
  /** The step it relates to and the rule it explains. */
  step: CaseStep
  ruleId: string
}

export type ComparisonResult = 'match' | 'mismatch' | 'not_compared'

export interface RegisterComparisonRow {
  field: string
  stated: string
  document: string
  register: string
  result: ComparisonResult
  note?: string
}

export type SupportingEvidenceType =
  'bank_statement' | 'utility_bill' | 'insurance' | 'passport_use'

export interface EvidenceItem {
  id: string
  kind: 'identity_document' | 'selfie' | 'address_evidence' | 'option2_document'
  label: string
  uploadedAt: ISODate
  /** For supporting evidence: the date printed on the document. */
  documentDate?: ISODate
  supportingType?: SupportingEvidenceType
  /** AI extraction results for supporting evidence (rules ADDL-12 and ADDL-13). */
  showsAddress?: boolean
  showsName?: boolean
  /** Provider result for identity documents; AI is never applied to them. */
  note?: string
}

export type PaymentMethod = 'pay_myself' | 'agent_payment_code'

export interface Payment {
  method: PaymentMethod
  amount: number
  code?: string
  /** Who paid, for Agent Payment Codes. */
  payerName?: string
  paidAt?: ISODate
  reference: string
}

export interface Decision {
  outcome: DecisionOutcome
  reasonCode: string
  note?: string
  decidedAt: ISODate
  reviewerId: string
  stepUpRef?: string
}

/** A reviewer's recorded decision on a Mandatory decision rule result. */
export interface RuleDecision {
  decision: 'satisfied' | 'not_satisfied'
  reason: string
  at: ISODate
  reviewerId: string
}

export interface SubmissionCorrection {
  id: string
  startedAt: ISODate
  fields: { label: string; from: string; to: string }[]
  handedOffAt?: ISODate
  recordedAt?: ISODate
  stepUpRef?: string
}

/**
  The ACSP submits through the Companies House service. Companies House emails the
  personal code to the individual; the platform never collects or keeps it.
*/
export interface Submission {
  startedAt?: ISODate
  stepUpRef?: string
  fieldsDone?: string[]
  handedOffAt?: ISODate
  submittedAt?: ISODate
  confirmedAt?: ISODate
  verificationReference?: string
  referenceSource?: 'entered' | 'forwarded_email'
  corrections?: SubmissionCorrection[]
}

export type Option2Reason =
  'attempts_used' | 'unsupported_document' | 'no_chip_phone'

export interface Option2State {
  reason: Option2Reason
  requestedAt: ISODate
  /** Needed when the person could not use the chip read (2.2). */
  reviewerAgreedAt?: ISODate
  documents?: { group: 'A' | 'B'; label: string; expiresOn?: ISODate }[]
  checkedAt?: ISODate
  checkedBy?: string
}

export interface VerificationCase {
  id: string
  route: 'A'
  personId: string
  companyNumber: string
  origin: 'agent_invite' | 'b2c'
  agentId?: string
  acspId: string
  reviewerId?: string
  /** Option 1 (certified IDVT) is the default; Option 2 is a fallback only. */
  option: 1 | 2
  status: CaseStatus
  createdAt: ISODate
  submittedForReviewAt?: ISODate
  slaDueAt?: ISODate
  idvt: IdvtResults
  observations: AiObservation[]
  evidence: EvidenceItem[]
  payment?: Payment
  decision?: Decision
  /** For abandoned cases, which never reach a reviewer decision. */
  closedAt?: ISODate
  submission?: Submission
  /** Linked Route B correction task when the register does not match. */
  correctionTaskId?: string
  /** Reviewed by the Agent's own ACSP team rather than referred. */
  inHouse?: boolean
  /** Progress through the individual's app journey before submission. */
  journey?: JourneyState
  /** Rule set version applied at the decision. Open cases use the version in force. */
  ruleSetVersion?: string
  ruleDecisions?: Record<string, RuleDecision>
  option2?: Option2State
  escalatedTo?: { reviewerId: string; at: ISODate; note: string }
  /** The document was captured in a browser rather than the app (no chip read). */
  browserCapture?: boolean
}

export interface JourneyState {
  emailConfirmed?: boolean
  mobileConfirmed?: boolean
  passkeySet?: boolean
  detailsConfirmed?: boolean
  amendment?: { field: string; note: string; at: ISODate }
  personalConfirmed?: boolean
  formerNames?: string[]
  /** Saw the "already verified" notice (REG-04) and chose to continue. */
  alreadyVerifiedAcknowledged?: boolean
  documentType?: IdDocumentType
  /** Chose "My phone can't read the chip" (2.2). */
  noChipPhone?: boolean
  photoPageDone?: boolean
  chipDone?: boolean
  selfieDone?: boolean
  checksDone?: boolean
  evidenceUploaded?: boolean
  paid?: boolean
  payment?: Payment
}

export interface CorrectionTask {
  id: string
  route: 'B'
  form: 'ACSP04'
  caseId: string
  companyNumber: string
  personId: string
  field: string
  registerValue: string
  correctValue: string
  status: 'open' | 'filed' | 'register_updated'
  createdAt: ISODate
  filedAt?: ISODate
  updatedAt?: ISODate
}

export interface Invite {
  id: string
  personId: string
  companyNumber: string
  agentId: string
  sentAt: ISODate
  /** Single-use Agent Payment Code tied to this invite only. */
  paymentCode?: string
  paymentCodeUsedAt?: ISODate
  status: 'sent' | 'opened' | 'accepted' | 'amendment_requested' | 'expired'
  caseId?: string
  /** Agents with ACSP status may review in-house; everyone else refers to an ACSP. */
  review?: 'referred' | 'in_house'
}

export type AuditActorType = 'person' | 'system' | 'ai'

export interface AuditEvent {
  seq: number
  at: ISODate
  actor: string
  actorType: AuditActorType
  action: string
  caseId?: string
  detail: string
  prevHash: string
  hash: string
}

/* Rule set: parameters and decision settings are versioned; rule text is fixed. */

export type ParamKey =
  | 'address_history_months'
  | 'supporting_evidence_months'
  | 'passport_expiry_option1'
  | 'passport_expiry_option2'
  | 'brp_expiry'
  | 'idvt_attempts'
  | 'recent_appointment_days'
  | 'many_appointments'
  | 'biometric_deletion_days'
  | 'retention_years'
  | 'review_target_hours'

export interface RuleSettings {
  nationality_difference: 'halt' | 'mandatory'
  passport_address_evidence: 'always' | 'when_needed'
  non_latin_difference: 'halt' | 'mandatory'
  escalate_enabled: boolean
}

export type SettingKey = keyof RuleSettings

export type RuleSetStatus =
  'current' | 'draft' | 'pending_approval' | 'superseded'

export interface RuleSetVersion {
  version: string
  status: RuleSetStatus
  params: Record<ParamKey, number>
  settings: RuleSettings
  createdAt: ISODate
  createdBy: string
  submittedAt?: ISODate
  submittedBy?: string
  approvedBy?: string
  publishedBy?: string
  publishedAt?: ISODate
  effectiveFrom?: ISODate
  supersededAt?: ISODate
}

export interface DemoData {
  acsps: AcspFirm[]
  agents: AgentOrg[]
  companies: Company[]
  people: Person[]
  register: RegisterEntry[]
  cases: VerificationCase[]
  corrections: CorrectionTask[]
  invites: Invite[]
  ruleSets: RuleSetVersion[]
  audit: AuditEvent[]
  /** Retention holds by case ID. A hold suspends destruction until it is lifted. */
  retentionHolds?: Record<string, RetentionHold>
}

export interface RetentionHold {
  reason: string
  placedAt: ISODate
  placedBy: string
}
