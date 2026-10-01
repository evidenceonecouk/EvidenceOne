/*
  Domain model for the Evidence One demo. Terminology follows CLAUDE.md and the
  client's workflow documents exactly. Everything here is synthetic.
*/

export type ISODate = string

export type PersonaId = 'agent' | 'reviewer' | 'individual' | 'b2c' | 'admin'

/** Route A is identity verification; Route B is Companies House filings. */
export type Route = 'A' | 'B'

export type RegisterRole = 'director' | 'psc' | 'director_psc'

/** Status shown on Agent dashboards per director or PSC. */
export type PersonStatus =
  | 'verified'
  | 'in_progress'
  | 'not_started'
  | 'expired'
  | 'reverification_due'

export type CaseStatus =
  | 'invited'
  | 'in_progress'
  | 'in_review'
  | 'info_requested'
  | 'halted_register_mismatch'
  | 'approved'
  | 'submitted'
  | 'declined'
  | 'abandoned'

export type DecisionOutcome = 'approve' | 'request_info' | 'decline'

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
  /** Only the last two characters are ever shown. */
  numberLastTwo: string
  expiresOn: ISODate
  nameOnDocument: string
  dobOnDocument: ISODate
  hasChip: boolean
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
  natureOfControl?: string
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
  remunerationPerCase: number
}

export interface Reviewer {
  id: string
  name: string
  role: string
}

export type CheckResult = 'pass' | 'fail' | 'refer' | 'pending' | 'not_applicable'

export interface IdvtResults {
  nfcChipRead: CheckResult
  documentAuthenticity: CheckResult
  liveness: CheckResult
  faceMatch: CheckResult
  faceMatchScore?: number
  pepSanctions: CheckResult
  pepSanctionsDetail?: string
  completedAt?: ISODate
  providerReference?: string
}

export type ObservationSeverity = 'info' | 'attention' | 'mismatch'

export interface AiObservation {
  id: string
  severity: ObservationSeverity
  title: string
  detail: string
  source: string
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

export interface EvidenceItem {
  id: string
  kind: 'identity_document' | 'selfie' | 'address_evidence'
  label: string
  uploadedAt: ISODate
  /** For address evidence: the date printed on the document. */
  documentDate?: ISODate
  aiCheck: 'accepted' | 'flagged' | 'pending'
  aiNote?: string
}

export type PaymentMethod = 'pay_myself' | 'agent_payment_code'

export interface Payment {
  method: PaymentMethod
  amount: number
  code?: string
  paidAt?: ISODate
  reference: string
}

export interface Decision {
  outcome: DecisionOutcome
  reasonCode: string
  note?: string
  decidedAt: ISODate
  reviewerId: string
}

export interface Submission {
  handedOffAt?: ISODate
  submittedAt?: ISODate
  personalCode?: string
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
  comparison: RegisterComparisonRow[]
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
  paymentCode?: string
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

export interface DemoData {
  acsps: AcspFirm[]
  agents: AgentOrg[]
  companies: Company[]
  people: Person[]
  register: RegisterEntry[]
  cases: VerificationCase[]
  corrections: CorrectionTask[]
  invites: Invite[]
  audit: AuditEvent[]
}
