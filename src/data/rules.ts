import type {
  CaseStep,
  ParamKey,
  RuleOutcome,
  RuleSetVersion,
  RuleSettings,
  SettingKey,
} from '@/types/domain'

/*
  The Route A rule set, from Gate 1 deliverable EO-G1-D7. Each rule is data: an
  ID, a plain-English condition, one outcome and its source. The platform
  evaluates them the same way every time (src/lib/rules.ts). No rule is ever
  evaluated by AI, and no rule declines a case.

  Rule text is fixed. Parameters and decision settings live in a rule set
  version, so changing one publishes a new version and never edits the old one.
*/

export const RULE_SET_NAME = 'Companies House Identity Verification, Route A'

export type RuleGroupId =
  | 'info'
  | 'register'
  | 'document'
  | 'idvt'
  | 'aml'
  | 'evidence'
  | 'option'
  | 'decision'
  | 'records'

export const ruleGroups: { id: RuleGroupId; label: string; step: CaseStep }[] =
  [
    { id: 'info', label: 'Personal information', step: 'info' },
    {
      id: 'register',
      label: 'Register association and comparison',
      step: 'register',
    },
    { id: 'document', label: 'Identity document', step: 'document' },
    { id: 'idvt', label: 'IDVT checks', step: 'idvt' },
    { id: 'aml', label: 'PEP and sanctions', step: 'aml' },
    { id: 'evidence', label: 'Supporting evidence', step: 'evidence' },
    { id: 'option', label: 'Option 1 and Option 2', step: 'option' },
    { id: 'decision', label: 'Decision', step: 'decision' },
    { id: 'records', label: 'Submission and records', step: 'submission' },
  ]

export type SourceCode = 'S' | 'R' | 'CA' | 'ICO' | 'C' | 'Design'

export const sourceNames: Record<SourceCode, string> = {
  S: 'Companies House IDV Standard',
  R: 'SI 2025/50',
  CA: 'Companies Act 2006',
  ICO: 'ICO guidance',
  C: 'Client determination',
  Design: 'Platform design choice',
}

export interface RuleDef {
  id: string
  group: RuleGroupId
  condition: string
  outcome: RuleOutcome
  /** Extra wording on the outcome, for example "Request until given". */
  outcomeNote?: string
  source: string
  sources: SourceCode[]
  inputs: string[]
  param?: ParamKey
  /** A decision setting that changes this rule's outcome. */
  setting?: SettingKey
}

const r = (
  id: string,
  group: RuleGroupId,
  condition: string,
  outcome: RuleOutcome,
  source: string,
  sources: SourceCode[],
  inputs: string[],
  extra: Partial<RuleDef> = {},
): RuleDef => ({
  id,
  group,
  condition,
  outcome,
  source,
  sources,
  inputs,
  ...extra,
})

export const rules: RuleDef[] = [
  // 1 Personal information, Step 1
  r(
    'INFO-01',
    'info',
    'Full name given, as given names and family name',
    'request',
    'IDV Standard, Step 1',
    ['S'],
    ['person.given_names', 'person.family_name'],
    { outcomeNote: 'Request until given' },
  ),
  r(
    'INFO-02',
    'info',
    'Former names answered, as names or an explicit "none". A blank is not an answer',
    'request',
    'IDV Standard, Step 1',
    ['S'],
    ['person.former_names'],
    { outcomeNote: 'Request until answered' },
  ),
  r(
    'INFO-03',
    'info',
    'Date of birth given and a valid date',
    'request',
    'IDV Standard, Step 1',
    ['S'],
    ['person.date_of_birth'],
    { outcomeNote: 'Request until given' },
  ),
  r(
    'INFO-04',
    'info',
    'Email address confirmed by one-time code',
    'request',
    'IDV Standard, Step 1; Design',
    ['S', 'Design'],
    ['contact.email_confirmed'],
    { outcomeNote: 'Request until confirmed' },
  ),
  r(
    'INFO-05',
    'info',
    'Current home address given, structured',
    'request',
    'IDV Standard, Step 1',
    ['S'],
    ['person.current_address'],
    { outcomeNote: 'Request until given' },
  ),
  r(
    'INFO-06',
    'info',
    'Address history covers a continuous 12 months up to today, as dated periods with no gap',
    'request',
    'IDV Standard, Step 1',
    ['S'],
    ['person.address_history'],
    { outcomeNote: 'Request until covered', param: 'address_history_months' },
  ),
  r(
    'INFO-07',
    'info',
    'Email and mobile not already registered to another individual, and not an Agent’s own contact details on an invite they sent',
    'request',
    'Design, kept by the client on 1 October',
    ['Design'],
    ['contact.email', 'contact.mobile', 'invite.agent_contact'],
    { outcomeNote: 'Request a different contact detail' },
  ),

  // 2 Register association and comparison
  r(
    'REG-01',
    'register',
    'The company is selected from a register search, not typed',
    'request',
    'Client determination',
    ['C'],
    ['case.company_number'],
    { outcomeNote: 'Request until selected' },
  ),
  r(
    'REG-02',
    'register',
    'The person appears on that company’s register as a director, PSC or both',
    'pass',
    'Client determination',
    ['C'],
    ['register.officers', 'register.pscs'],
    { outcomeNote: 'Recorded as Director, PSC, Both or Not found' },
  ),
  r(
    'REG-03',
    'register',
    'The person does not appear on the company’s register at entry',
    'flag',
    'Client determination; D6 Part 2.4',
    ['C'],
    ['register.officers', 'register.pscs'],
    { outcomeNote: 'Recorded and shown, does not stop the case at entry' },
  ),
  r(
    'REG-04',
    'register',
    'The register shows the person’s identity is already verified',
    'flag',
    'Client determination, V4 Step 7; Design',
    ['C', 'Design'],
    ['register.identity_verified'],
    { outcomeNote: 'Shown to the Agent and the individual before payment' },
  ),
  r(
    'REG-10',
    'register',
    'Person not on the company’s register at the decision',
    'block',
    'Client determination, V4 Step 7',
    ['C'],
    ['register.snapshot'],
  ),
  r(
    'REG-11',
    'register',
    'Name on the document differs from the register after normalisation',
    'halt',
    'Client determination, 28 September',
    ['C'],
    ['document.name', 'register.name'],
    { outcomeNote: 'Halt, and a register correction task is raised' },
  ),
  r(
    'REG-12',
    'register',
    'Month and year of birth on the document differ from the register',
    'halt',
    'Client determination, 28 September',
    ['C'],
    ['document.date_of_birth', 'register.month_year_of_birth'],
    { outcomeNote: 'Halt, and a correction task is raised' },
  ),
  r(
    'REG-13',
    'register',
    'Nationality differs from the register',
    'halt',
    'Client determination, 28 September',
    ['C'],
    ['document.nationality', 'register.nationality'],
    { setting: 'nationality_difference' },
  ),
  r(
    'REG-14',
    'register',
    'Declared home address differs from the register’s correspondence address',
    'flag',
    'Client determination, V4 Step 7',
    ['C'],
    ['person.current_address', 'register.correspondence_address'],
    { outcomeNote: 'Flag only. The two can legitimately differ' },
  ),
  r(
    'REG-15',
    'register',
    'Register shows a Companies House default address',
    'flag',
    'Client determination, V4 open question 7',
    ['C'],
    ['register.correspondence_address'],
  ),
  r(
    'REG-16',
    'register',
    'Appointment more recent than the recent appointment period',
    'flag',
    'Client determination, V4 Step 7',
    ['C'],
    ['register.appointed_on'],
    { param: 'recent_appointment_days' },
  ),
  r(
    'REG-17',
    'register',
    'Person holds more active appointments than the many appointments threshold',
    'flag',
    'Client determination, V4 Step 7',
    ['C'],
    ['register.active_appointments'],
    { param: 'many_appointments' },
  ),

  // 3 Identity document
  r(
    'DOC-01',
    'document',
    'The document type is on the accepted list for the option in use',
    'request',
    'IDV Standard, Step 2',
    ['S'],
    ['document.type', 'case.option'],
    { outcomeNote: 'Request a different document, showing the accepted list' },
  ),
  r(
    'DOC-EXP-01',
    'document',
    'Passport or Irish passport card expired beyond its tolerance, or expired at all without a validated chip',
    'request',
    'IDV Standard, Step 2, Option 1',
    ['S'],
    [
      'document.type',
      'document.expiry_date',
      'idvt.chip_result',
      'check.completed_at',
    ],
    {
      outcomeNote: 'Request another document',
      param: 'passport_expiry_option1',
    },
  ),
  r(
    'DOC-EXP-02',
    'document',
    'Biometric residence permit expired beyond its tolerance',
    'request',
    'IDV Standard, Step 2',
    ['S'],
    ['document.type', 'document.expiry_date', 'check.completed_at'],
    { outcomeNote: 'Request another document', param: 'brp_expiry' },
  ),
  r(
    'DOC-EXP-03',
    'document',
    'Any other document expired',
    'request',
    'IDV Standard, Step 2',
    ['S'],
    ['document.type', 'document.expiry_date', 'check.completed_at'],
    { outcomeNote: 'Request another document' },
  ),
  r(
    'DOC-02',
    'document',
    'Cancellation marks, such as a cut corner, or the document reported as replaced',
    'mandatory',
    'Client determination',
    ['C'],
    ['idvt.document_flags'],
    { outcomeNote: 'Never an automatic rejection' },
  ),
  r(
    'DOC-03',
    'document',
    'A foreign equivalent where the standard names a specific issuer',
    'request',
    'IDV Standard, Step 2',
    ['S'],
    ['document.type', 'document.issuing_country'],
    { outcomeNote: 'Request a different document' },
  ),
  r(
    'DOC-04',
    'document',
    'The same document already submitted for this individual',
    'flag',
    'Client determination, V4 section 5',
    ['C'],
    ['document.number', 'person.previous_cases'],
  ),
  r(
    'DOC-05',
    'document',
    'Damage or tampering affecting personal details',
    'mandatory',
    'IDV Standard, Step 3',
    ['S'],
    ['idvt.document_flags'],
  ),

  // 4 IDVT checks
  r(
    'IDVT-01',
    'idvt',
    'Document has a chip and the chip’s cryptographic features are not validated',
    'block',
    'IDV Standard, Option 1',
    ['S'],
    ['document.has_chip', 'idvt.chip_result'],
  ),
  r(
    'IDVT-02',
    'idvt',
    'Document has no chip and its physical security features are not validated',
    'block',
    'IDV Standard, Option 1',
    ['S'],
    ['document.has_chip', 'idvt.authenticity_result'],
  ),
  r(
    'IDVT-03',
    'idvt',
    'Liveness not passed',
    'block',
    'IDV Standard, Step 4',
    ['S'],
    ['idvt.liveness_result'],
  ),
  r(
    'IDVT-04',
    'idvt',
    'Face match not passed',
    'block',
    'IDV Standard, Step 4',
    ['S'],
    ['idvt.face_match_result'],
  ),
  r(
    'IDVT-05',
    'idvt',
    'Provider returns a result for review rather than a clear pass on any check',
    'mandatory',
    'Design',
    ['Design'],
    ['idvt.*_result'],
  ),
  r(
    'IDVT-06',
    'idvt',
    'Name or date of birth from the chip or document differs from what the individual entered at Step 1',
    'mandatory',
    'IDV Standard, Step 4; D6 Step 4',
    ['S'],
    [
      'document.name',
      'document.date_of_birth',
      'person.name',
      'person.date_of_birth',
    ],
  ),
  r(
    'IDVT-07',
    'idvt',
    'A check fails, and attempts so far are fewer than the attempts allowed',
    'request',
    'Design',
    ['Design'],
    ['idvt.attempts'],
    { outcomeNote: 'The individual may try again', param: 'idvt_attempts' },
  ),
  r(
    'IDVT-08',
    'idvt',
    'All attempts used, or the provider cannot support the document',
    'request',
    'Client determination, 26 September',
    ['C'],
    ['idvt.attempts', 'idvt.supported'],
    { outcomeNote: 'Route to Option 2', param: 'idvt_attempts' },
  ),

  // 5 PEP and sanctions
  r(
    'AML-01',
    'aml',
    'Screening has not yet run on the individual',
    'block',
    'Client determination, 28 September',
    ['C'],
    ['screening.completed_at'],
    { outcomeNote: 'Block until it has' },
  ),
  r(
    'AML-02',
    'aml',
    'A possible PEP match',
    'mandatory',
    'Client determination, 28 September',
    ['C'],
    ['screening.pep'],
  ),
  r(
    'AML-03',
    'aml',
    'A possible sanctions match',
    'mandatory',
    'Client determination, 28 September',
    ['C'],
    ['screening.sanctions'],
  ),
  r(
    'AML-04',
    'aml',
    'Adverse media, where the provider returns it',
    'flag',
    'Client determination, 28 September',
    ['C'],
    ['screening.adverse_media'],
  ),

  // 6 Supporting evidence
  r(
    'ADDL-01',
    'evidence',
    'The identity document is expired beyond its exception',
    'request',
    'Client determination, 30 September',
    ['C'],
    ['document.expiry_date'],
    {
      outcomeNote:
        'Request another identity document, and flag it to the reviewer',
    },
  ),
  r(
    'ADDL-02',
    'evidence',
    'The identity document does not confirm the current address',
    'request',
    'Client determination, 30 September; IDV Standard',
    ['C', 'S'],
    ['document.type', 'document.address', 'person.address_history'],
    {
      outcomeNote: 'Request one supporting document for the current address',
      setting: 'passport_address_evidence',
    },
  ),
  r(
    'ADDL-03',
    'evidence',
    'A former name is declared, or a name change is detected',
    'request',
    'Client determination, 30 September; IDV Standard',
    ['C', 'S'],
    ['person.former_names', 'document.name'],
    { outcomeNote: 'Request evidence of the name change' },
  ),
  r(
    'ADDL-10',
    'evidence',
    'Supporting document is not one of: bank or credit card statement with recent transactions; utility or council tax bill; insurance policy document showing the home address; evidence of recent passport use',
    'request',
    'Client determination, 30 September',
    ['C'],
    ['evidence.type'],
    { outcomeNote: 'Request a different document' },
  ),
  r(
    'ADDL-11',
    'evidence',
    'Supporting document is not dated within the supporting evidence period of upload',
    'request',
    'Client determination, 28 September',
    ['C'],
    ['evidence.document_date', 'evidence.uploaded_at'],
    {
      outcomeNote: 'Request a more recent document',
      param: 'supporting_evidence_months',
    },
  ),
  r(
    'ADDL-12',
    'evidence',
    'Supporting document does not clearly show the declared current address',
    'mandatory',
    'Client determination',
    ['C'],
    ['evidence.address (AI extraction)', 'person.current_address'],
  ),
  r(
    'ADDL-13',
    'evidence',
    'Supporting document does not show the individual’s name or a declared former name',
    'mandatory',
    'Client determination',
    ['C'],
    ['evidence.name (AI extraction)', 'person.name'],
  ),
  r(
    'ADDL-14',
    'evidence',
    'Supporting evidence could not be provided',
    'mandatory',
    'IDV Standard, Step 4; D6 Part 5, position 3',
    ['S'],
    ['evidence.declined'],
    { outcomeNote: 'The reviewer considers whether to continue' },
  ),

  // 7 Option 1 and Option 2
  r(
    'OPT-01',
    'option',
    'Every case starts as Option 1',
    'pass',
    'Client determination, 26 September',
    ['C'],
    ['case.option'],
  ),
  r(
    'OPT-02',
    'option',
    'Option 1 cannot support the document, under IDVT-08',
    'flag',
    'Client determination, 26 September',
    ['C'],
    ['idvt.attempts', 'idvt.supported'],
    { outcomeNote: 'Offer Option 2' },
  ),
  r(
    'OPT-03',
    'option',
    'Option 2 in use and the reviewer has no current training attestation',
    'block',
    'IDV Standard, Step 3; D6 Part 5, position 4',
    ['S'],
    ['reviewer.attestation'],
  ),
  r(
    'OPT-04',
    'option',
    'Option 2 documents are not two from Group A, or one from Group A and one from Group B',
    'request',
    'IDV Standard, Option 2',
    ['S'],
    ['option2.documents'],
    { outcomeNote: 'Request until met' },
  ),
  r(
    'OPT-05',
    'option',
    'Option 2 and the person is not resident in the UK, with no government-issued document',
    'request',
    'IDV Standard, Option 2',
    ['S'],
    ['person.residence', 'option2.documents'],
    { outcomeNote: 'Request until met' },
  ),
  r(
    'OPT-06',
    'option',
    'Option 2 passport or Irish passport card expired beyond its tolerance, or BRP beyond its tolerance',
    'request',
    'IDV Standard, Option 2',
    ['S'],
    ['option2.documents'],
    {
      outcomeNote: 'Request another document',
      param: 'passport_expiry_option2',
    },
  ),

  // 8 Decision
  r(
    'DEC-01',
    'decision',
    'Approval only by a user holding the ACSP Reviewer role, with a valid step-up authentication',
    'block',
    'Client determination; Design',
    ['C', 'Design'],
    ['user.role', 'auth.step_up'],
    { outcomeNote: 'Block otherwise' },
  ),
  r(
    'DEC-02',
    'decision',
    'Approval only with no Block or Halt open, and every Mandatory decision recorded with a reason',
    'block',
    'Design',
    ['Design'],
    ['case.rule_results', 'case.rule_decisions'],
    { outcomeNote: 'Block otherwise' },
  ),
  r(
    'DEC-03',
    'decision',
    'A decline records a reason code and detail',
    'block',
    'Client determination',
    ['C'],
    ['decision.reason_code', 'decision.detail'],
    { outcomeNote: 'Block otherwise' },
  ),
  r(
    'DEC-04',
    'decision',
    'A request for information names exactly what is needed',
    'block',
    'Client determination, V4 Step 8',
    ['C'],
    ['decision.request_detail'],
    { outcomeNote: 'Block otherwise' },
  ),
  r(
    'DEC-05',
    'decision',
    'The reviewer confirms they are satisfied the person is who they claim to be and the checks meet the standard',
    'block',
    'IDV Standard, Step 6',
    ['S'],
    ['decision.confirmation'],
    { outcomeNote: 'Block otherwise' },
  ),

  // 9 Submission and records
  r(
    'SUB-01',
    'records',
    'The submission pack holds every item of the verification statement under Regulations 10 and 11',
    'block',
    'SI 2025/50, Regs 10 and 11',
    ['R'],
    ['submission.pack'],
    { outcomeNote: 'Block submission otherwise' },
  ),
  r(
    'SUB-02',
    'records',
    'The case has already been submitted',
    'block',
    'Client determination, D6 Part 3.2',
    ['C'],
    ['submission.submitted_at'],
    { outcomeNote: 'Block a second submission. Corrections go through SUB-03' },
  ),
  r(
    'SUB-03',
    'records',
    'A correction is prepared only against a submitted case with a recorded verification reference',
    'block',
    'Client determination; EO-G1-D9 Part 2.3',
    ['C'],
    ['submission.verification_reference'],
    { outcomeNote: 'Block otherwise' },
  ),
  r(
    'RET-01',
    'records',
    'Records are kept for 7 years from the decision timestamp, approvals and declines alike',
    'pass',
    'SI 2025/50, Reg 15(4)(a) and (b)',
    ['R'],
    ['decision.decided_at'],
    { outcomeNote: 'Scheduled', param: 'retention_years' },
  ),
  r(
    'RET-02',
    'records',
    'Failed and abandoned cases are kept on the same basis, an abandoned case from the date it is closed',
    'pass',
    'IDV Standard, Step 5; EO-G1-D12',
    ['S'],
    ['case.closed_at'],
    { outcomeNote: 'Scheduled', param: 'retention_years' },
  ),
  r(
    'RET-03',
    'records',
    'Raw biometric samples are deleted once verification completes, and within 30 days at most',
    'pass',
    'ICO; V4 Step 6',
    ['ICO'],
    ['biometrics.captured_at'],
    { outcomeNote: 'Scheduled', param: 'biometric_deletion_days' },
  ),
  r(
    'RET-04',
    'records',
    'A regulatory or litigation hold suspends destruction',
    'block',
    'ICO; client framework, section 8',
    ['ICO', 'C'],
    ['case.legal_hold'],
    { outcomeNote: 'Block destruction' },
  ),
]

export const ruleById = (id: string) => rules.find((x) => x.id === id)

export interface ParamDef {
  key: ParamKey
  label: string
  unit: string
  basis: string
  min: number
  max: number
}

export const paramDefs: ParamDef[] = [
  {
    key: 'address_history_months',
    label: 'Address history',
    unit: 'months',
    basis: 'IDV Standard, Step 1',
    min: 12,
    max: 60,
  },
  {
    key: 'supporting_evidence_months',
    label: 'Supporting evidence dated within',
    unit: 'months',
    basis: 'Client determination, 28 September',
    min: 1,
    max: 12,
  },
  {
    key: 'passport_expiry_option1',
    label: 'Passport expiry tolerance, Option 1 (chip validated)',
    unit: 'months',
    basis: 'IDV Standard, Option 1',
    min: 0,
    max: 6,
  },
  {
    key: 'passport_expiry_option2',
    label: 'Passport expiry tolerance, Option 2',
    unit: 'months',
    basis: 'IDV Standard, Option 2',
    min: 0,
    max: 18,
  },
  {
    key: 'brp_expiry',
    label: 'BRP expiry tolerance',
    unit: 'months',
    basis: 'IDV Standard',
    min: 0,
    max: 18,
  },
  {
    key: 'idvt_attempts',
    label: 'Attempts at the IDVT checks',
    unit: 'attempts',
    basis: 'Design, proposed',
    min: 1,
    max: 10,
  },
  {
    key: 'recent_appointment_days',
    label: 'Recent appointment flag',
    unit: 'days',
    basis: 'Design, proposed',
    min: 1,
    max: 365,
  },
  {
    key: 'many_appointments',
    label: 'Many appointments flag',
    unit: 'active appointments',
    basis: 'Design, proposed',
    min: 2,
    max: 100,
  },
  {
    key: 'biometric_deletion_days',
    label: 'Raw biometric samples deleted within',
    unit: 'days',
    basis: 'ICO; V4 Step 6',
    min: 1,
    max: 30,
  },
  {
    key: 'retention_years',
    label: 'Record retention from the decision',
    unit: 'years',
    basis: 'SI 2025/50, Reg 15',
    min: 7,
    max: 15,
  },
  {
    key: 'review_target_hours',
    label: 'Review target, shown to reviewers only',
    unit: 'hours',
    basis: 'Pending EO-G1-D1, Part 4, decision 8',
    min: 1,
    max: 120,
  },
]

export interface SettingDef {
  key: SettingKey
  label: string
  question: string
  options: { value: RuleSettings[SettingKey]; label: string }[]
  rules: string[]
  decisionPoint: string
}

export const settingDefs: SettingDef[] = [
  {
    key: 'nationality_difference',
    label: 'Nationality difference',
    question: 'When nationality on the document differs from the register',
    options: [
      { value: 'halt', label: 'Halt' },
      { value: 'mandatory', label: 'Mandatory decision' },
    ],
    rules: ['REG-13'],
    decisionPoint: 'Point 2',
  },
  {
    key: 'passport_address_evidence',
    label: 'Current address evidence for passport holders',
    question:
      'When to ask a passport holder for one supporting document for their current address',
    options: [
      { value: 'always', label: 'Always' },
      { value: 'when_needed', label: 'Only when the case calls for it' },
    ],
    rules: ['ADDL-02'],
    decisionPoint: 'Point 3',
  },
  {
    key: 'non_latin_difference',
    label: 'Non-Latin name differences',
    question: 'When a name differs from the register only by transliteration',
    options: [
      { value: 'halt', label: 'Halt' },
      { value: 'mandatory', label: 'Mandatory decision' },
    ],
    rules: ['REG-11'],
    decisionPoint: 'Point 4',
  },
  {
    key: 'escalate_enabled',
    label: 'Escalate',
    question:
      'A fifth reviewer action that routes a case to a named senior reviewer without deciding it',
    options: [
      { value: true, label: 'On' },
      { value: false, label: 'Off' },
    ],
    rules: ['DEC-02'],
    decisionPoint: 'Point 8',
  },
]

export const defaultParams: Record<ParamKey, number> = {
  address_history_months: 12,
  supporting_evidence_months: 3,
  passport_expiry_option1: 6,
  passport_expiry_option2: 18,
  brp_expiry: 18,
  idvt_attempts: 3,
  recent_appointment_days: 30,
  many_appointments: 10,
  biometric_deletion_days: 30,
  retention_years: 7,
  review_target_hours: 36,
}

export const defaultSettings: RuleSettings = {
  nationality_difference: 'halt',
  passport_address_evidence: 'when_needed',
  non_latin_difference: 'halt',
  escalate_enabled: false,
}

export const SUPER_ADMIN = 'Helen Carver, Super Administrator'
export const SECOND_APPROVER = 'Daniel Achebe, Compliance Administrator'

/**
  Version history. 2026.1 is the version in force. 2025.3 holds the same values
  and is kept so decisions made before 2026.1 can be reconstructed against it.
*/
export function seedRuleSets(): RuleSetVersion[] {
  return [
    {
      version: '2025.3',
      status: 'superseded',
      params: { ...defaultParams },
      settings: { ...defaultSettings },
      createdAt: '2025-06-16T09:00:00.000Z',
      createdBy: SUPER_ADMIN,
      submittedAt: '2025-06-18T11:30:00.000Z',
      submittedBy: SUPER_ADMIN,
      approvedBy: SECOND_APPROVER,
      publishedBy: SECOND_APPROVER,
      publishedAt: '2025-06-20T08:45:00.000Z',
      effectiveFrom: '2025-07-01T00:00:00.000Z',
      supersededAt: '2026-09-30T09:05:00.000Z',
    },
    {
      version: '2026.1',
      status: 'current',
      params: { ...defaultParams },
      settings: { ...defaultSettings },
      createdAt: '2026-09-29T10:00:00.000Z',
      createdBy: SUPER_ADMIN,
      submittedAt: '2026-09-29T16:20:00.000Z',
      submittedBy: SUPER_ADMIN,
      approvedBy: SECOND_APPROVER,
      publishedBy: SECOND_APPROVER,
      publishedAt: '2026-09-30T09:05:00.000Z',
      effectiveFrom: '2026-09-30T09:05:00.000Z',
    },
  ]
}
