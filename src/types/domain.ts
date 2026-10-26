/*
  Domain model for the Evidence One demo. Terminology follows CLAUDE.md and the
  client's workflow documents exactly. Everything here is synthetic.
*/

export type ISODate = string

export type PersonaId =
  'partner' | 'reviewer' | 'individual' | 'b2c' | 'platformAdmin' | 'superAdmin'

/** Route A is identity verification; Route B is Companies House filings. */
export type Route = 'A' | 'B'

export type RegisterRole = 'director' | 'psc' | 'director_psc'

/**
  Status shown to Referral Partners per director or PSC, with the result of each
  check. Referral Partners never see documents, evidence or case messages.
*/
export type PartnerStatus =
  'invited' | 'in_progress' | 'further_information' | 'completed' | 'declined'

/** Result of one check as a Referral Partner sees it. */
export type PartnerCheckResult = 'passed' | 'flagged' | 'not_passed' | 'pending'

/** Internal status of a director or PSC, used to derive the Partner-facing status. */
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
  lodgedByPartnerId?: string
  connectedAt?: ISODate
}

/** Referral Partners bring clients to the platform. They never verify and never decide. */
export type PartnerKind =
  | 'Accountancy firm'
  | 'Law firm'
  | 'Corporate service provider'
  | 'Formation agent'
  | 'Tax adviser'
  | 'Consultant'
  | 'Family office'
  | 'Introducer'

export type PartnerRole = 'partner_admin' | 'referrer' | 'portfolio_viewer'

export interface ReferralPartner {
  id: string
  name: string
  kind: string
  /** Country the partner operates from. A partner outside the UK sees status only (P11, decided 19 October). */
  country: string
  /** True when this firm is also onboarded separately as an ACSP (two memberships, never merged). */
  alsoAcspId?: string
  contactName: string
  contactMobile?: string
  /** Prefix for this Partner's single-use Agent Payment Codes, one per invite. */
  paymentCode?: string
  /** Status of the platform approval of this partner. */
  approval: 'approved' | 'pending_approval'
  /** Answer to "Do you wish to receive payment for referrals?" and the regulator. */
  referralPayment: { wishes: boolean; regulator?: string }
  users: PartnerUser[]
}

export interface PartnerUser {
  id: string
  name: string
  role: PartnerRole
  email: string
  mobile: string
  mobileConfirmed: boolean
}

/** One status set everywhere (CLAUDE.md). */
export type AcspStatus =
  | 'pending_approval'
  | 'active'
  | 'not_yet_listed'
  | 'suspended'
  | 'ceased'
  | 'withdrawn'

export type AcspRole = 'acsp_admin' | 'acsp_reviewer'

export interface AcspFee {
  standard: number
  enhanced: number
  currency: 'GBP'
}

/** Structured profile, used by matching. Every answer is a typed field. */
export interface AcspProfile {
  /** Countries of residence the ACSP accepts. 'Any' means all except the excluded list. */
  residenceCountries: string[]
  excludedJurisdictions: string[]
  /** Issuing countries accepted per document type. 'Any' for all. */
  documentTypes: IdDocumentType[]
  issuingCountries: string[]
  acceptsNonBiometricDocuments: boolean
  languages: string[]
  roles: RegisterRole[]
  acceptsProposedDirectors: boolean
  acceptsHigherRisk: boolean
  capacity: { perDay: number; perWeek: number; perMonth: number }
  /** Cases already accepted today, so capacity left today = perDay minus this. */
  usedToday: number
  acceptingNewCases: boolean
  targetTurnaroundHours: number
  fee: AcspFee
  evidenceRetention: 'platform' | 'own'
  /** PEP and sanctions screening on or off for this ACSP. Each ACSP chooses (P6). */
  pepScreening: boolean
  /** Electronic address check for UK residents, on or off for this ACSP. Each ACSP chooses. */
  addressCheck?: boolean
  vatNumber?: string
  address: string
  /** Payment account connected through the secure payment provider. Synthetic identifier. */
  connectedAccount: string
}

export interface AcspMonitoring {
  /** Source of the last published-file check. Both are published files; there is no API. */
  lastCheckAt: ISODate
  lastSource: 'opt_in_list' | 'ceased_suspended_list' | 'yearly_upload'
  lastReconfirmedAt: ISODate
  nextReconfirmationDue: ISODate
  /** An administrator confirmed the name match against the published list. */
  nameMatchConfirmedBy?: string
  notYetListedSince?: ISODate
}

/**
  G2-02: where the ACSP is with the secure payment provider's own onboarding.
  Evidence One never collects or stores the ACSP's bank credentials.
*/
export type PaymentProviderStatus =
  'not_started' | 'in_progress' | 'more_information_needed' | 'eligible'

export interface AcspPayments {
  providerStatus: PaymentProviderStatus
  /** Evidence One's own approval of the ACSP. The second gate. */
  evidenceOneApproved: boolean
  /** True only when the provider status is Eligible and Evidence One has approved. */
  paymentsActive: boolean
  /** Set when an administrator last changed a gate. */
  updatedAt?: ISODate
}

export interface AcspFirm {
  id: string
  name: string
  kind: string
  supervisor: string
  /** Supervisor reference number. */
  supervisorNumber: string
  acspNumber: string
  status: AcspStatus
  /** Why the status is what it is, shown on the monitoring page. */
  statusNote?: string
  reviewers: Reviewer[]
  profile: AcspProfile
  monitoring: AcspMonitoring
  /** Per-case platform fee applies to referred cases; own clients are on a subscription. */
  plan: AcspPlan
  /** Set when this firm is also a Referral Partner (separate membership). */
  alsoPartnerId?: string
  approval: 'approved' | 'pending_approval'
  /** Connect payments (G2-02). Payments are active only when both gates are met. */
  payments: AcspPayments
  /** Share of B2C allocations, as a percentage. Allocation is confirmed by an administrator at launch. */
  b2cAllocationShare: number
  b2cAllocatedThisMonth: number
}

export interface AcspPlan {
  /** How Evidence One invoices the platform fee it deducts from each referred payment. */
  invoiceMode: 'per_case' | 'monthly'
  /** Subscription package for the ACSP's own clients, or null for none. Referred cases carry the platform fee either way. */
  packageId: PackageId | null
  /** Usage earlier this month, before the cases held in the demo. Referred cases are shown but never counted. */
  usageBaseline?: { ownClientCases: number; referredCases: number }
  /** Account storage used, in GB, against the package's limit. */
  storageUsedGb: number
}

export type PackageId = 'easy' | 'pro' | 'scale'

/**
  A provisional subscription package for an ACSP's own clients (client email of
  15 October). Every value is a setting, changed only by a Super Administrator
  with a second approver. Referred cases sit outside the allowance.
*/
export interface SubscriptionPackage {
  id: PackageId
  name: string
  monthlyPrice: number
  /** Own-client cases included each month. */
  casesIncluded: number
  filesPerCase: number
  maxFileMb: number
  /** Account total, kept for seven years. */
  storageGb: number
  /** Each own-client case over the allowance. */
  extraCaseFee: number
}

export interface Reviewer {
  id: string
  name: string
  role: string
  roles?: AcspRole[]
  mobile?: string
  mobileConfirmed?: boolean
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
  /** Attempts at the checks so far (rule IDVT-07, three allowed). */
  attempts?: number
  /** Register comparison result, shown to Referral Partners as passed or flagged. */
  registerComparison?: CheckResult
  /**
    Chip result from the certified identity provider's chip reader on the
    person's phone. Not applicable where the document has no chip. Evidence One
    itself never reads a chip.
  */
  chipResult?: ChipResult
  /** Security features the certified identity provider validated on this case. */
  securityFeatures?: string[]
  /** Electronic address check (UK residents), where the ACSP switched it on. */
  addressCheck?: CheckResult
}

export type ChipResult = 'read' | 'not_read' | 'not_applicable'

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
  /** Option O3: bank statement redaction. Only the redacted copy reaches the reviewer. */
  redaction?: {
    status: 'confirmed_by_individual'
    confirmedAt: ISODate
    /** What was masked, for the reviewer's information. */
    masked: string[]
  }
}

export type PaymentMethod = 'pay_myself' | 'agent_payment_code'

/**
  The card is authorised when the client instructs the ACSP and the total is
  taken only when the ACSP approves. On a decline, a lapse or an ACSP lapse the
  authorisation is released and nothing is taken (P10).
*/
export type PaymentStatus = 'authorised' | 'taken' | 'released'

/**
  Agency model. The individual pays the named ACSP. Evidence One collects the
  payment as the ACSP's disclosed agent, by split payment, with the ACSP as
  merchant of record. The four fee types are never merged.
*/
export interface PaymentAddOn {
  /** The ACSP's correction fee, part of its Professional Fee, shown as its own line. VAT inclusive like the fee. */
  amount: number
  description: string
  /** The second authorisation, for the revised total. Nothing is taken until the ACSP approves. */
  authorisedAt: ISODate
  reference: string
  /** Who pays the add-on. The client, even where a Partner paid with an Agent Payment Code (Pending your decision). */
  paidBy: 'client'
}

export interface Payment {
  method: PaymentMethod
  status: PaymentStatus
  /** When the card or Agent Payment Code was authorised, at the instruct step. */
  authorisedAt: ISODate
  releasedAt?: ISODate
  releaseReason?: string
  /** The referral arrangement disclosure shown before authorisation. The referral record is kept when the payment is taken. */
  disclosure?: { acknowledgedAt: ISODate; consentAt?: ISODate }
  /** The ACSP's professional fee, paid by the client or by the Partner on their behalf. */
  amount: number
  /** Register correction add-on (G2-10, G2-13), authorised a second time when the client approves the revised total. */
  addOn?: PaymentAddOn
  /** ACSP that received the payment (merchant of record). */
  payeeAcspId?: string
  code?: string
  /** Who paid, for Agent Payment Codes. */
  payerName?: string
  /** When the payment was taken, on the ACSP's approval. Absent while only authorised. */
  paidAt?: ISODate
  reference: string
  /** Payment provider fee, borne by the ACSP and shown on its statement. */
  providerFee?: number
  /** Platform fee deducted automatically, ex VAT. Zero for an ACSP's own client. */
  platformFee?: number
  /** VAT on the platform fee. Zero for an ACSP's own client. */
  platformFeeVat?: number
  /** Net paid out to the ACSP's own payment account. */
  netPayout?: number
  payoutAt?: ISODate
  clientInvoiceId?: string
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
  /** 'correction_needed' is an outcome of the Mandatory decision on a register difference (G2-10), not a fourth reviewer action. */
  decision: 'satisfied' | 'not_satisfied' | 'correction_needed'
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
  personal code to the individual; the submission never asks for or holds it.
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
  | 'attempts_used'
  | 'unsupported_document'
  /** The person has no smartphone or tablet for the provider's journey (Pending your decision). */
  | 'no_smartphone'

/**
  Findings the identity provider's manual document review returns for an
  Option 2 case (G2-14, subject to the provider confirming it can). The
  provider does the supported checks and returns findings. It never decides.
*/
export interface ProviderFindings {
  returnedAt: ISODate
  /** Outcome of each supported check. */
  checks: {
    label: string
    outcome: 'passed' | 'flagged' | 'not_passed'
    note?: string
  }[]
  /** Anything the provider could not check, left for the ACSP. */
  couldNotCheck: string[]
}

/** One additional check the ACSP completes itself before deciding. */
export interface AdditionalCheck {
  id: string
  label: string
  done: boolean
  doneAt?: ISODate
}

export interface Option2State {
  reason: Option2Reason
  requestedAt: ISODate
  reviewerAgreedAt?: ISODate
  /** Documents the provider's reviewers checked. */
  documents?: { group: 'A' | 'B'; label: string; expiresOn?: ISODate }[]
  /** When the provider returned its findings. */
  checkedAt?: ISODate
  /** The provider's findings (simulated). */
  providerFindings?: ProviderFindings
  /** The ACSP's own additional checks. The ACSP keeps the final decision. */
  additionalChecks?: AdditionalCheck[]
  /** Why the ACSP is satisfied, recorded with the checklist. */
  additionalReason?: string
  additionalCompletedAt?: ISODate
}

export interface VerificationCase {
  id: string
  route: 'A'
  personId: string
  companyNumber: string
  origin: 'partner_invite' | 'b2c' | 'acsp_invite'
  /** Drives the fee: referred and B2C carry the platform fee, an ACSP's own client does not. */
  source: CaseSource
  partnerId?: string
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
  /** Reviewed by the Partner's own ACSP team rather than referred. */
  inHouse?: boolean
  /** Progress through the individual's browser journey before submission. */
  journey?: JourneyState
  /** How the ACSP was chosen: invite, suggested to a B2C client, or confirmed by an administrator. */
  allocation?: CaseAllocation
  /** Secure messages between the ACSP reviewer and the individual. Referral Partners never see them. */
  messages?: CaseMessage[]
  /** A register difference was flagged and the reviewer was prompted to report it to Companies House (G2-10). */
  discrepancyReport?: DiscrepancyReport
  /** The day after Companies House confirms, the individual is asked whether the code has arrived (G2-12, M7). */
  personalCodeReceipt?: {
    askedAt: ISODate
    answer?: 'yes' | 'not_yet'
    answeredAt?: ISODate
  }
  /** Open case of a lapsed ACSP, offered to another ACSP with the individual's agreement (ACSP-13). */
  reallocation?: Reallocation
  /** The individual's chosen language for guidance. English is the version of record. */
  language?: LanguageCode
  /** Rule set version applied at the decision. Open cases use the version in force. */
  ruleSetVersion?: string
  ruleDecisions?: Record<string, RuleDecision>
  option2?: Option2State
  /** Register correction branch, started by the Mandatory decision "Correction needed". */
  registerCorrection?: RegisterCorrectionBranch
  escalatedTo?: { reviewerId: string; at: ISODate; note: string }
}

/**
  Register correction with a fee (G2-10 and G2-13, client email of 23 October).
  A register difference stays a flag. Where the ACSP decides it needs correcting
  before approval, the Mandatory decision outcome "Correction needed" raises a
  correction fee on top of the verification fee. Nothing here is a Halt, a
  Block or a fourth reviewer action. Design interpretations are marked in the
  rules and on the Decisions page.
*/
export type CorrectionStage =
  | 'awaiting_client_approval'
  | 'awaiting_register_correction'
  | 'register_corrected'
  | 'declined_by_client'

export interface RegisterCorrectionBranch {
  /** The Mandatory decision rule it came from, for example REG-11. */
  ruleId: string
  stage: CorrectionStage
  raisedAt: ISODate
  raisedBy: string
  /** The add-on, set by the ACSP. There is no platform-wide value. */
  amount: number
  description: string
  clientApprovedAt?: ISODate
  clientDeclinedAt?: ISODate
  /** The window in which the register is expected to be corrected, from correction_turnaround_hours_min and _max. */
  expectedFrom?: ISODate
  expectedBy?: ISODate
  registerCorrectedAt?: ISODate
  registerCorrectedBy?: string
  /** Both authorisations released: the case was declined or the ACSP lapsed. */
  releasedAt?: ISODate
}

export type CaseSource = 'referred' | 'b2c' | 'own_client'

export interface CaseAllocation {
  source: 'invite' | 'suggested' | 'administrator'
  /** B2C only: the ranked ACSPs suggested from the onboarding answers. Ranked by clear criteria, not AI. */
  suggestedAcspIds?: string[]
  /** The client asked for "Show me a different ACSP". Allowed once, before instructing. */
  differentRequestedAt?: ISODate
  /** An administrator confirms the allocation at launch. */
  confirmedBy?: string
  confirmedAt?: ISODate
  instructedAt?: ISODate
}

export interface CaseMessage {
  id: string
  from: 'reviewer' | 'individual'
  authorName: string
  at: ISODate
  body: string
  /** Email notification sent to the other party. Shown as a sent-notification row. */
  notifiedAt?: ISODate
}

export interface DiscrepancyReport {
  /** What differs, for example "First name: AIDAN on the document, AIDEN on the register". */
  summary: string
  promptedAt: ISODate
  /** The reviewer's choice. Filing a report through an API is not in scope; this logs the choice only. */
  choice?: 'will_report' | 'not_reporting'
  choiceNote?: string
  choiceAt?: ISODate
  choiceBy?: string
}

export interface Reallocation {
  fromAcspId: string
  offeredAcspId: string
  offeredAt: ISODate
  individualResponse: 'pending' | 'agreed' | 'declined'
  respondedAt?: ISODate
}

export type LanguageCode = 'en' | 'ru' | 'ar' | 'es' | 'fr' | 'it' | 'zh'

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
  /** The person who sent the invite was told that the register already shows this identity as verified. */
  alreadyVerifiedNotifiedAt?: ISODate
  /** Residence country, issuing country and languages the person gave for ACSP suggestions (B2C and platform-suggested invites). */
  suggestionAnswers?: {
    residenceCountry: string
    issuingCountry: string
    languages: string[]
  }
  documentType?: IdDocumentType
  /**
    Document capture. On desktop the provider journey continues on a phone or
    tablet ('phone'); on mobile it is direct ('camera'). 'upload' is kept only
    for cases recorded before the provider required a phone or tablet.
  */
  captureRoute?: 'upload' | 'phone' | 'camera'
  /** Liveness: on the phone or tablet the person handed off to, or direct on mobile. There is no webcam-only route. */
  livenessRoute?: 'phone'
  photoPageDone?: boolean
  /** The chip step in the provider's journey, where the document has a chip. Absent until the step is done. */
  chipResult?: ChipResult
  selfieDone?: boolean
  checksDone?: boolean
  /** Failed attempts at the identity checks so far (IDVT-07). After idvt_attempts, Option 2 is offered (IDVT-08). */
  checkAttempts?: number
  /** The person holds an eVisa. The certified identity provider checks it directly with the Home Office, on the same Option 1 route. */
  eVisa?: boolean
  /** Expired document (DOC-EXP-01): an expired passport is not accepted, so another document is used (a Request). */
  expiredChoice?: 'other_document'
  /** The individual confirmed they instruct the named ACSP (rules ACSP-01 and ACSP-02). */
  instructedAt?: ISODate
  /** Proof of current address uploaded (ADDL-02, every individual). */
  addressProofDone?: boolean
  /** Supporting evidence uploaded for ADDL-01 or ADDL-03. */
  evidenceUploaded?: boolean
  /** Supporting documents as held for review: the redacted copy only, never the original. */
  supportingItems?: EvidenceItem[]
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
  /** The ACSP continued to its own WebFiling account through the Evidence One interstitial. */
  handedOffAt?: ISODate
  /** Outcome recorded on return. The company authentication code and One Login details are never stored. */
  filingReference?: string
  filingOutcome?: 'accepted'
  filedAt?: ISODate
  updatedAt?: ISODate
}

export interface Invite {
  id: string
  personId: string
  companyNumber: string
  partnerId: string
  sentAt: ISODate
  /** Single-use Agent Payment Code tied to this invite only. */
  paymentCode?: string
  paymentCodeUsedAt?: ISODate
  status: 'sent' | 'opened' | 'accepted' | 'amendment_requested' | 'expired'
  caseId?: string
  /** The instructing ACSP the Partner selected from the 2 or 3 matched ACSPs shown, or an administrator confirmed for a Bulk Request. */
  instructingAcspId?: string
  /** The matched ACSPs shown to the Partner, best first. Ranked by clear criteria, not AI. */
  shownAcspIds?: string[]
  payer?: 'client' | 'partner'
}

export type AuditActorType = 'person' | 'system' | 'ai'

export interface AuditEvent {
  seq: number
  at: ISODate
  actor: string
  actorType: AuditActorType
  action: string
  caseId?: string
  /** Which hash chain the event belongs to: an ACSP id, or 'platform'. One chain per ACSP. */
  acspId?: string
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
  | 'liveness_media_retention_years'
  | 'max_file_mb'
  | 'max_files_per_request'
  | 'retention_years'
  | 'review_target_hours'
  | 'reminder_day_1'
  | 'reminder_day_2'
  | 'reminder_day_3'
  | 'abandon_after_days'
  | 'invite_valid_days'
  | 'acsp_status_check_days'
  | 'acsp_reconfirmation_months'
  /** M4, decided 19 October: a Not yet listed ACSP has 3 months to register. */
  | 'acsp_register_period_months'
  /** G2-13: the register is expected to be corrected within this many hours of the client approving the revised total. */
  | 'correction_turnaround_hours_min'
  | 'correction_turnaround_hours_max'

/**
  Decision settings. Most carry a "Pending your decision" badge on the Rules page
  because the client has not decided them. They are settings, never hard-coded.
*/
export interface RuleSettings {
  /** M7, decided 19 October: the day after Companies House confirms. The prompt never asks for the code. */
  personal_code_prompt: 'day_after_confirmation'
  /** Open: whether a passing electronic address check for a UK resident removes the proof of address document. Off by default. */
  address_check_replaces_proof: boolean
  /**
    Whether an expired document is accepted within its expiryAllowanceMonths.
    Off: expired passports are not accepted (H1, decided 19 October). Subject
    to the identity provider's answer.
  */
  expired_document_allowance: boolean
  escalate_enabled: boolean
  /** Referral commissions are off at launch. Switching on needs a second approver. */
  referral_commissions: boolean
}

export type SettingKey = keyof RuleSettings

export type RuleSetStatus =
  'current' | 'draft' | 'pending_approval' | 'superseded'

export type DocumentListId = 'option1' | 'option2_a' | 'option2_b'

/**
  One document on an eligibility list (G2-07). The lists are part of the rule
  set, changed only through a draft version and a second approver.
*/
export interface EligibleDocument {
  id: string
  label: string
  list: DocumentListId
  /** Whether the document carries a chip: yes, no, or on some. */
  chip: 'yes' | 'no' | 'sometimes'
  /** Months an expired document is still accepted. 0 throughout until the client decides. */
  expiryAllowanceMonths: number
  /** Switched on for its list. */
  enabled: boolean
  /** The tile on the individual's document step this Option 1 document sits behind. */
  tile?: IdDocumentType | 'evisa'
}

export interface RuleSetVersion {
  version: string
  status: RuleSetStatus
  params: Record<ParamKey, number>
  settings: RuleSettings
  /** Document eligibility lists for Option 1 and Option 2 (G2-07). */
  documents: EligibleDocument[]
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

/* Billing, agency model. Four fee types, never merged. */

export type FeeKind =
  | 'acsp_professional_fee'
  | 'referral_commission'
  | 'platform_fee'
  | 'marketplace_commission'

export interface ClientInvoice {
  id: string
  acspId: string
  caseId: string
  issuedAt: ISODate
  clientName: string
  description: string
  net: number
  vat: number
  gross: number
  /** Who paid: the client, or a Referral Partner on their behalf with an Agent Payment Code. */
  paidBy: string
  /** The invoice itemises the verification fee and the correction add-on, each VAT inclusive. */
  lines?: { description: string; gross: number }[]
}

/** Evidence One invoices the ACSP, documenting the platform fee already deducted. */
export interface PlatformInvoice {
  id: string
  acspId: string
  mode: 'per_case' | 'monthly'
  issuedAt: ISODate
  /** For a monthly invoice, the month covered, for example "2026-09". */
  period?: string
  caseIds: string[]
  net: number
  vat: number
  gross: number
}

export interface BillingSettings {
  /** Platform fee per referred case, ex VAT. Set only by a Super Administrator with a second approver. */
  platformFee: number
  vatRate: number
  /** Provisional packages. The client confirms the final price and structure before go-live. */
  packages: SubscriptionPackage[]
}

export interface BillingData {
  settings: BillingSettings
  clientInvoices: ClientInvoice[]
  platformInvoices: PlatformInvoice[]
}

/** A change that needs a Super Administrator and a different Super Administrator as second approver. */
export type ApprovalKind =
  | 'platform_fee'
  | 'subscription_plan'
  | 'referral_commissions'
  | 'disclosure_text'

/** The value a change would apply on approval. Absent on older records; the action then reads the "to" text. */
export type ApprovalPayload =
  | { kind: 'platform_fee'; platformFee: number }
  | { kind: 'subscription_plan'; package: SubscriptionPackage }
  | { kind: 'disclosure_text'; version: string }
  | { kind: 'referral_commissions'; value: boolean }

export interface ApprovalRequest {
  id: string
  kind: ApprovalKind
  payload?: ApprovalPayload
  summary: string
  from: string
  to: string
  proposedBy: string
  proposedAt: ISODate
  status: 'pending' | 'approved' | 'rejected'
  decidedBy?: string
  decidedAt?: ISODate
  stepUpRef?: string
}

/** Referral records store exactly these nine fields. */
export interface ReferralRecord {
  referral_partner: string
  regulator: string
  commission_type: string
  commission_amount: number
  disclosure_version: string
  disclosed_at?: ISODate
  consent_required: boolean
  consent_at?: ISODate
  payment_at?: ISODate
}

/* Onboarding applications, approved by a Platform Administrator before going live. */

export interface OnboardingApplication {
  id: string
  kind: 'acsp' | 'partner'
  name: string
  submittedAt: ISODate
  status: 'pending_approval' | 'approved' | 'rejected'
  /** Structured, typed answers by section. Never free-text blobs. */
  answers: Record<string, Record<string, string | number | boolean | string[]>>
  decidedBy?: string
  decidedAt?: ISODate
  /** Reason given when an application is rejected. */
  decisionNote?: string
  /** The ACSP or Referral Partner created when the application was approved. */
  createdOrgId?: string
}

/* ACSP status monitoring. Companies House publishes files; there is no API. */

export interface NameMatch {
  id: string
  acspId?: string
  source: 'opt_in_list' | 'ceased_suspended_list' | 'yearly_upload'
  /** Name as it appears on the published file. */
  listedName: string
  /** Name on the platform register, if one matched. */
  platformName?: string
  status: 'to_confirm' | 'confirmed' | 'not_found'
  confirmedBy?: string
  confirmedAt?: ISODate
}

export interface YearlyUpload {
  id: string
  uploadedAt: ISODate
  uploadedBy: string
  fileName: string
  rows: number
  matched: number
  /** Platform ACSPs not found on the uploaded list. Each is confirmed by an administrator. */
  notFoundAcspIds: string[]
}

export interface MonitoringState {
  lastFortnightlyCheckAt: ISODate
  nameMatches: NameMatch[]
  yearlyUploads: YearlyUpload[]
}

export interface DemoData {
  acsps: AcspFirm[]
  partners: ReferralPartner[]
  companies: Company[]
  people: Person[]
  register: RegisterEntry[]
  cases: VerificationCase[]
  corrections: CorrectionTask[]
  invites: Invite[]
  ruleSets: RuleSetVersion[]
  audit: AuditEvent[]
  billing: BillingData
  approvals: ApprovalRequest[]
  referralRecords: ReferralRecord[]
  applications: OnboardingApplication[]
  monitoring: MonitoringState
  /** Retention holds by case ID. A hold suspends destruction until it is lifted. */
  retentionHolds?: Record<string, RetentionHold>
  /** Bulk / Bespoke Requests from Referral Partners (option O4), handled by a Platform Administrator. */
  bulkRequests?: BulkRequest[]
  /** Complaints and refunds, handled by a Platform Administrator (P10). */
  complaints?: Complaint[]
  /** ACSP requests to download a verification file after the decision, released by a Platform Administrator. */
  exportRequests?: ExportRequest[]
}

/* Bulk / Bespoke Request (option O4). Separate from normal automated referrals. */

export interface BulkRequestMessage {
  id: string
  from: 'partner' | 'admin'
  authorName: string
  at: ISODate
  body: string
}

/**
  A Referral Partner asks in free text for several verifications or a mix of
  services. The Platform Administrator agrees it in the message area, then
  converts it into linked cases: one Bulk Request, several individual
  verification cases, and placeholders for anything else.
*/
export interface BulkRequest {
  id: string
  partnerId: string
  submittedBy: string
  submittedAt: ISODate
  /** The request as the Partner wrote it. */
  request: string
  status: 'open' | 'converted'
  messages: BulkRequestMessage[]
  convertedAt?: ISODate
  convertedBy?: string
  /** Individual verification cases created on conversion. */
  caseIds: string[]
  /** Placeholder rows for additional Companies House services, arranged separately. */
  additionalServices: string[]
  /** A corporate verification was asked for. Added later, when Companies House publishes the final requirements (G2-19). */
  corporateRequested: boolean
}

/**
  A client's complaint about a case. A Platform Administrator handles it and may
  refund a payment that was taken. What happens to the platform fee on a
  refunded case is not yet decided, so a refund never changes it here.
*/
export interface Complaint {
  id: string
  caseId: string
  raisedBy: string
  raisedAt: ISODate
  summary: string
  status: 'open' | 'refunded' | 'closed'
  refund?: {
    amount: number
    reason: string
    at: ISODate
    by: string
    stepUpRef: string
  }
  /** Why it was closed without a refund. */
  closedNote?: string
  closedAt?: ISODate
  closedBy?: string
}

/**
  An ACSP asks for its verification file within the seven years. A Platform
  Administrator releases the download and never opens the evidence. The ACSP
  downloads behind step-up.
*/
export interface ExportRequest {
  id: string
  caseId: string
  acspId: string
  requestedBy: string
  requestedAt: ISODate
  reason: string
  status: 'requested' | 'released' | 'downloaded'
  releasedBy?: string
  releasedAt?: ISODate
  downloadedAt?: ISODate
  stepUpRef?: string
}

export interface RetentionHold {
  reason: string
  placedAt: ISODate
  placedBy: string
}
