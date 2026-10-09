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
  /** Country the partner operates from. A partner outside the UK sees status only (P11, Pending your decision). */
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
  /** PEP and sanctions screening on or off for this ACSP (P6, Pending your decision for the default). */
  pepScreening: boolean
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
  /** Share of B2C allocations, as a percentage. Allocation is confirmed by an administrator at launch. */
  b2cAllocationShare: number
  b2cAllocatedThisMonth: number
}

export interface AcspPlan {
  /** How Evidence One invoices the platform fee it deducts from each referred payment. */
  invoiceMode: 'per_case' | 'monthly'
  /** Own clients are covered by a subscription. Price and terms are not set. */
  subscription: 'monthly_only' | 'monthly_with_cases'
  casesIncluded?: number
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
  Agency model. The individual pays the named ACSP. Evidence One collects the
  payment as the ACSP's disclosed agent, by split payment, with the ACSP as
  merchant of record. The four fee types are never merged.
*/
export interface Payment {
  method: PaymentMethod
  /** The ACSP's professional fee, paid by the client or by the Partner on their behalf. */
  amount: number
  /** ACSP that received the payment (merchant of record). */
  payeeAcspId?: string
  code?: string
  /** Who paid, for Agent Payment Codes. */
  payerName?: string
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

export type Option2Reason = 'attempts_used' | 'unsupported_document'

export interface Option2State {
  reason: Option2Reason
  requestedAt: ISODate
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
  origin: 'partner_invite' | 'b2c'
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
  escalatedTo?: { reviewerId: string; at: ISODate; note: string }
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
  documentType?: IdDocumentType
  /** Document capture: upload from this computer, continue on the phone's browser, or direct camera on mobile. */
  captureRoute?: 'upload' | 'phone' | 'camera'
  /** Liveness: continue on the phone (preferred) or use this computer's camera. */
  livenessRoute?: 'phone' | 'computer'
  photoPageDone?: boolean
  selfieDone?: boolean
  checksDone?: boolean
  /** Failed attempts at the identity checks so far (IDVT-07). After idvt_attempts, Option 2 is offered (IDVT-08). */
  checkAttempts?: number
  /** The person holds an eVisa: passport plus any one Group B document until the provider confirms an eVisa check in the browser. */
  eVisa?: boolean
  eVisaSecondDocument?: string
  /** Expired document (DOC-EXP-01, H1): use another document, or continue with one supporting document (ADDL-01, a Request). */
  expiredChoice?: 'other_document' | 'supporting_document'
  /** The individual confirmed they instruct the named ACSP (rules ACSP-01 and ACSP-02). */
  instructedAt?: ISODate
  /** Proof of current address uploaded (ADDL-02, every individual). */
  addressProofDone?: boolean
  /** Supporting evidence uploaded for ADDL-01 or ADDL-03. */
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
  partnerId: string
  sentAt: ISODate
  /** Single-use Agent Payment Code tied to this invite only. */
  paymentCode?: string
  paymentCodeUsedAt?: ISODate
  status: 'sent' | 'opened' | 'accepted' | 'amendment_requested' | 'expired'
  caseId?: string
  /** The instructing ACSP chosen by the Partner, or 'platform_suggest' to let the platform suggest. */
  instructingAcspId?: string | 'platform_suggest'
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
  | 'reminder_day_1'
  | 'reminder_day_2'
  | 'reminder_day_3'
  | 'abandon_after_days'
  | 'invite_valid_days'
  | 'acsp_status_check_days'
  | 'acsp_reconfirmation_months'

/**
  Decision settings. Most carry a "Pending your decision" badge on the Rules page
  because the client has not decided them. They are settings, never hard-coded.
*/
export interface RuleSettings {
  /** IDVT-01. Pending Companies House's answer on whether Option 1 requires the chip to be read (P1). */
  chip_not_read_fallback: 'accept_web_result' | 'request_other_then_option2'
  /** DOC-EXP-01 (H1). An expired passport is asked for another document until Companies House replies. */
  expired_passport_handling:
    'ask_other_document' | 'accept_to_six_months_if_chip_validated'
  /** H2. SMS is never used for step-up. */
  step_up_channels: 'passkey_or_authenticator' | 'passkey_authenticator_or_sms'
  /** M7. */
  personal_code_prompt: 'day_after_confirmation' | 'day_after_submission'
  /** M4. How long a Not yet listed ACSP has to register. */
  acsp_register_period: 'to_be_set' | '30_days' | '60_days' | '90_days'
  /** M4. Whether the yearly upload replaces or sits beside the fortnightly check. */
  yearly_upload_role: 'sits_beside' | 'replaces'
  /** P6. PEP and sanctions screening is a per-ACSP setting; this is its default. */
  pep_screening_default: 'on' | 'off'
  escalate_enabled: boolean
  /** Referral commissions are off at launch. Switching on needs a second approver. */
  referral_commissions: boolean
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
  subscription: {
    structure: 'monthly_only' | 'monthly_with_cases'
    /** null means "Price not set". */
    price: number | null
    casesIncluded: number | null
    /** The client sets the terms by this date. */
    termsDueBy: ISODate
  }
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

export interface ApprovalRequest {
  id: string
  kind: ApprovalKind
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
}

export interface RetentionHold {
  reason: string
  placedAt: ISODate
  placedBy: string
}
