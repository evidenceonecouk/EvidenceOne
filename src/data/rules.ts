import type {
  CaseStep,
  ParamKey,
  RuleOutcome,
  RuleSetVersion,
  RuleSettings,
  SettingKey,
} from '@/types/domain'

/*
  The Route A rule set, from Gate 1 deliverable EO-G1-D7, with the client's
  determinations of 6, 7 and 9 October applied. Each rule is data: an ID, a
  plain-English condition, one outcome and its source. The platform evaluates
  them the same way every time (src/lib/rules.ts). No rule is ever evaluated by
  AI, and no rule declines a case.

  Rule text is fixed. Parameters and decision settings live in a rule set
  version, so changing one publishes a new version and never edits the old one.
  Where the client has not decided, the rule carries a `pending` call-agenda
  code and the decision is built as a setting.
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
  | 'acsp'
  | 'records'
  | 'messages'

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
    {
      id: 'acsp',
      label: 'ACSPs, allocation and Referral Partners',
      step: 'decision',
    },
    { id: 'records', label: 'Submission and records', step: 'submission' },
    { id: 'messages', label: 'Case messages', step: 'decision' },
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
  /** Call-agenda code (for example "P3" or "H1") where the client has not decided. Shows "Pending your decision". */
  pending?: string
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

/** Source labels for determinations made by the client on a given date, and for design proposals. */
const C6 = 'C, 6 October'
const C7 = 'C, 7 October'
const C9 = 'C, 9 October'
const PROPOSED = 'Design, proposed'

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
    'Email address confirmed by one-time code, and mobile number confirmed by SMS code',
    'request',
    'IDV Standard, Step 1; Design',
    ['S', 'Design'],
    ['contact.email_confirmed', 'contact.mobile_confirmed'],
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
    'Email and mobile not already registered to another individual, and not a Referral Partner’s own contact details on an invite they sent',
    'request',
    'Design, kept by the client on 1 October',
    ['Design'],
    ['contact.email', 'contact.mobile', 'invite.partner_contact'],
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
    {
      outcomeNote:
        'Said calmly to the individual before payment, who may continue or stop. The person who sent the invite is told too',
    },
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
    'Name on the document differs from the register after normalisation of case, spacing, hyphens and apostrophes',
    'mandatory',
    C7,
    ['C'],
    ['document.name', 'register.name'],
    {
      outcomeNote:
        'Flag and Mandatory decision, with a prompt to report the difference to Companies House. Route A is not halted',
    },
  ),
  r(
    'REG-12',
    'register',
    'Month and year of birth on the document differ from the register',
    'mandatory',
    C7,
    ['C'],
    ['document.date_of_birth', 'register.month_year_of_birth'],
    {
      outcomeNote:
        'Flag and Mandatory decision, with a prompt to report the difference to Companies House. Route A is not halted',
    },
  ),
  r(
    'REG-13',
    'register',
    'Nationality on the document differs from the register',
    'mandatory',
    C7,
    ['C'],
    ['document.nationality', 'register.nationality'],
    {
      outcomeNote:
        'Flag and Mandatory decision, with a prompt to report the difference to Companies House. Route A is not halted',
    },
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
  r(
    'REG-18',
    'register',
    'Name on the document differs from the register only by transliteration of a non-Latin script',
    'mandatory',
    C7,
    ['C'],
    ['document.name', 'document.non_latin_name', 'register.name'],
    {
      outcomeNote:
        'Flag and Mandatory decision, with a prompt to report the difference to Companies House. Route A is not halted',
    },
  ),
  r(
    'REG-19',
    'register',
    'Any difference in name, date of birth, nationality or transliteration is flagged to the reviewer for a final decision, with the prompt "Report this difference to Companies House"',
    'flag',
    C7,
    ['C'],
    ['case.discrepancy_report'],
    {
      outcomeNote:
        'The prompt and the reviewer’s choice are logged on the case. Filing a report through an API is not in scope',
    },
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
    'Passport or Irish passport card is expired. The standard allows up to six months expired only where the chip is validated, so until Companies House replies another document is asked for',
    'request',
    'IDV Standard, Step 2, Option 1; C, 9 October',
    ['S', 'C'],
    ['document.type', 'document.expiry_date', 'check.completed_at'],
    {
      outcomeNote:
        'Ask for another document. Where an expired document triggers ADDL-01 it is a Request, never a Halt',
      param: 'passport_expiry_option1',
      setting: 'expired_passport_handling',
      pending: 'H1',
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
  r(
    'DOC-06',
    'document',
    'The person holds an eVisa. Until the provider confirms how it checks an eVisa in the browser, the person provides their passport plus any one document from Group B',
    'request',
    C9,
    ['C'],
    ['document.type', 'option2.documents'],
    { outcomeNote: 'Request the passport and one Group B document' },
  ),

  // 4 IDVT checks
  r(
    'IDVT-01',
    'idvt',
    'Document has a chip and the chip is not read on the case. Outcome set by chip_not_read_fallback.',
    'request',
    'IDV Standard, Option 1; C, 9 October',
    ['S', 'C'],
    ['document.has_chip', 'idvt.chip_result'],
    {
      outcomeNote:
        'Accepted while the Companies House answer is awaited, or another Option 1 document requested, then Option 2',
      setting: 'chip_not_read_fallback',
      pending: 'P1',
    },
  ),
  r(
    'IDVT-02',
    'idvt',
    'The document’s authenticity is not validated by the certified identity provider on the browser route',
    'block',
    'IDV Standard, Option 1',
    ['S'],
    ['idvt.authenticity_result'],
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
    'Name or date of birth from the document differs from what the individual entered at Step 1',
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
    'A check fails, and attempts so far are fewer than the three attempts allowed',
    'request',
    C7,
    ['C'],
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
    'Screening has not yet run on the individual, where screening is switched on for the ACSP',
    'block',
    'Client determination, 28 September; C, 9 October',
    ['C'],
    ['acsp.pep_screening', 'screening.completed_at'],
    {
      outcomeNote:
        'Block until it has. Screening is a per-ACSP setting and ongoing monitoring is off',
      setting: 'pep_screening_default',
      pending: 'P6',
    },
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
    C7,
    ['C'],
    ['document.expiry_date'],
    {
      outcomeNote:
        'Request: "We need one supporting document". Never a second identity document, never a Halt',
    },
  ),
  r(
    'ADDL-02',
    'evidence',
    'Every individual provides one proof of current address dated within the supporting evidence period, including people whose licence, identity card or BRP shows an address',
    'request',
    C7,
    ['C'],
    ['person.current_address', 'evidence.document_date'],
    {
      outcomeNote:
        'Request until provided. The exact wording is to be confirmed',
      param: 'supporting_evidence_months',
      pending: 'P3',
    },
  ),
  r(
    'ADDL-03',
    'evidence',
    'A former name is declared, or a name change is detected',
    'request',
    C7,
    ['C'],
    ['person.former_names', 'document.name'],
    {
      outcomeNote:
        'Request: "We need one supporting document", as evidence of the name change',
    },
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
    C7,
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
    'Approval only by a user holding the ACSP Reviewer role, with a valid step-up authentication by passkey or authenticator code. SMS is never used for step-up',
    'block',
    'Client determination; Design',
    ['C', 'Design'],
    ['user.role', 'auth.step_up'],
    {
      outcomeNote: 'Block otherwise',
      setting: 'step_up_channels',
      pending: 'H2',
    },
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
  r(
    'DEC-06',
    'decision',
    'The reviewer has three actions: Approve, Request information and Decline. Escalate appears only when escalate_enabled is on',
    'pass',
    C7,
    ['C'],
    ['setting.escalate_enabled'],
    {
      outcomeNote: 'Escalate is off for the launch',
      setting: 'escalate_enabled',
    },
  ),

  // 9 ACSPs, allocation and Referral Partners
  r(
    'ACSP-01',
    'acsp',
    'The individual has been shown the named ACSP, its fee and turnaround, and that Evidence One is its technology provider, and has confirmed they instruct that ACSP',
    'block',
    C6,
    ['C'],
    ['journey.instructed_at', 'case.acsp_id'],
    { outcomeNote: 'Block payment until recorded' },
  ),
  r(
    'ACSP-02',
    'acsp',
    'The payment goes to the named ACSP as merchant of record. Evidence One collects it only as the ACSP’s disclosed agent, by split payment, and the invoice is issued in the ACSP’s name',
    'block',
    C6,
    ['C'],
    ['payment.payee_acsp_id', 'payment.platform_fee'],
    { outcomeNote: 'Block payment otherwise' },
  ),
  r(
    'ACSP-10',
    'acsp',
    'The ACSP is Suspended, Ceased or Withdrawn on a Companies House published file. Both files are checked at the status check interval, there is no API, and an administrator confirms every name match',
    'block',
    C9,
    ['C'],
    ['acsp.status', 'acsp.monitoring.last_check_at'],
    {
      outcomeNote: 'Pauses new allocation (MATCH-01)',
      param: 'acsp_status_check_days',
    },
  ),
  r(
    'ACSP-11',
    'acsp',
    'The ACSP’s reconfirmation of its regulatory information is overdue. Each ACSP reconfirms every 12 months',
    'block',
    PROPOSED,
    ['Design'],
    ['acsp.monitoring.next_reconfirmation_due'],
    {
      outcomeNote: 'Pauses new allocation (MATCH-01)',
      param: 'acsp_reconfirmation_months',
    },
  ),
  r(
    'ACSP-12',
    'acsp',
    'Every case a lapsed ACSP verified is listed for follow-up. The list is visible to a Platform Administrator and to that ACSP only. Individuals are contacted only on the client’s instruction. Whether a Referral Partner may see its own affected clients is open, so it is not shown',
    'flag',
    C9,
    ['C'],
    ['acsp.status', 'case.verified_by'],
    {
      outcomeNote: 'Follow-up list. Referral Partner view pending',
      pending: 'M3',
    },
  ),
  r(
    'ACSP-13',
    'acsp',
    'Open cases of a lapsed ACSP are offered to another ACSP, with the individual’s agreement',
    'request',
    'C, 9 October; Design, proposed',
    ['C', 'Design'],
    ['acsp.status', 'case.reallocation'],
    {
      outcomeNote:
        'Waits for the individual to agree or decline. No case is moved without agreement',
    },
  ),
  r(
    'ACSP-14',
    'acsp',
    'An ACSP not on the Companies House published list is Not yet listed, given a reasonable time to register, and can still be allocated. It becomes Active when the listing arrives',
    'flag',
    PROPOSED,
    ['Design'],
    ['acsp.status', 'acsp.monitoring.not_yet_listed_since'],
    {
      outcomeNote:
        'An administrator confirms every allocation to a Not yet listed ACSP',
      setting: 'acsp_register_period',
      pending: 'M4',
    },
  ),
  r(
    'ACSP-15',
    'acsp',
    'Every 12 months an administrator uploads the fresh Companies House ACSP list. The platform cross-checks it against the platform register and an administrator confirms each match',
    'pass',
    C9,
    ['C'],
    ['monitoring.yearly_upload'],
    {
      outcomeNote:
        'Scheduled. Whether it replaces or sits beside the fortnightly check is open',
      setting: 'yearly_upload_role',
      pending: 'M4',
    },
  ),
  r(
    'MATCH-01',
    'acsp',
    'The ACSP is Active or Not yet listed, approved by the platform, and its reconfirmation is not overdue',
    'block',
    C6,
    ['C'],
    ['acsp.status', 'acsp.approval', 'acsp.monitoring.next_reconfirmation_due'],
    {
      outcomeNote:
        'Not eligible otherwise. A Not yet listed ACSP stays eligible with a caveat',
    },
  ),
  r(
    'MATCH-02',
    'acsp',
    'The ACSP is accepting new cases',
    'block',
    C6,
    ['C'],
    ['acsp.profile.accepting_new_cases'],
    { outcomeNote: 'Not eligible otherwise' },
  ),
  r(
    'MATCH-03',
    'acsp',
    'The person’s country of residence is one the ACSP accepts and is not on its excluded jurisdictions',
    'block',
    C6,
    ['C'],
    [
      'person.residence_country',
      'acsp.profile.residence_countries',
      'acsp.profile.excluded_jurisdictions',
    ],
    { outcomeNote: 'Not eligible otherwise' },
  ),
  r(
    'MATCH-04',
    'acsp',
    'The ACSP accepts the document type and its issuing country',
    'block',
    C6,
    ['C'],
    [
      'document.type',
      'document.issuing_country',
      'acsp.profile.document_types',
      'acsp.profile.issuing_countries',
    ],
    { outcomeNote: 'Not eligible otherwise' },
  ),
  r(
    'MATCH-05',
    'acsp',
    'The ACSP accepts the person’s role: director, PSC or proposed director',
    'block',
    C6,
    ['C'],
    ['register.role', 'acsp.profile.roles'],
    { outcomeNote: 'Not eligible otherwise' },
  ),
  r(
    'MATCH-06',
    'acsp',
    'The ACSP supports at least one of the languages the person needs',
    'block',
    C6,
    ['C'],
    ['person.languages', 'acsp.profile.languages'],
    { outcomeNote: 'Not eligible otherwise' },
  ),
  r(
    'MATCH-07',
    'acsp',
    'For a higher-risk case, the ACSP accepts higher-risk cases',
    'block',
    C6,
    ['C'],
    ['case.higher_risk', 'acsp.profile.accepts_higher_risk'],
    { outcomeNote: 'Not eligible otherwise' },
  ),
  r(
    'MATCH-08',
    'acsp',
    'The ACSP has capacity left today and its target turnaround is within the turnaround asked for',
    'block',
    C6,
    ['C'],
    [
      'acsp.profile.capacity',
      'acsp.profile.used_today',
      'acsp.profile.target_turnaround_hours',
    ],
    {
      outcomeNote:
        'Not eligible otherwise. Matching is evaluated by rules. An administrator allocates',
    },
  ),
  r(
    'REF-01',
    'acsp',
    'Referral commissions are Off at launch. While referral_commissions is Off nothing is disclosed and no commission is credited',
    'block',
    C6,
    ['C'],
    ['setting.referral_commissions'],
    {
      outcomeNote:
        'Switching on needs a draft rule version and a second approver',
      setting: 'referral_commissions',
    },
  ),
  r(
    'REF-02',
    'acsp',
    'Where commissions are on and the Referral Partner answered Yes with a regulator, the client sees the referral arrangement disclosure before payment',
    'block',
    C6,
    ['C'],
    ['referral.disclosure_version', 'referral.disclosed_at'],
    { outcomeNote: 'Block payment until disclosed' },
  ),
  r(
    'REF-03',
    'acsp',
    'Where the regulator requires consent, the client’s consent is recorded before payment',
    'block',
    C6,
    ['C'],
    ['referral.consent_required', 'referral.consent_at'],
    { outcomeNote: 'Block payment until recorded' },
  ),
  r(
    'REF-04',
    'acsp',
    'A referral record stores exactly nine fields: referral_partner, regulator, commission_type, commission_amount, disclosure_version, disclosed_at, consent_required, consent_at, payment_at',
    'pass',
    C6,
    ['C'],
    ['referral.record'],
    { outcomeNote: 'Recorded' },
  ),
  r(
    'REF-05',
    'acsp',
    'The four fee types are never merged: ACSP Professional Fee, Referral Commission, Platform Fee and Marketplace Commission',
    'block',
    C6,
    ['C'],
    ['fee.kind'],
    { outcomeNote: 'Block otherwise' },
  ),
  r(
    'REF-06',
    'acsp',
    'An Agent Payment Code is single-use and tied to one invite',
    'block',
    C6,
    ['C'],
    ['invite.payment_code', 'invite.payment_code_used_at'],
    { outcomeNote: 'Block a second use' },
  ),
  r(
    'REF-10',
    'acsp',
    'A Referral Partner sees only the status Invited, In progress, Further information required, Completed or Declined. A Referral Partner is never presented as the verifying ACSP and never decides',
    'block',
    C7,
    ['C'],
    ['partner.status'],
    { outcomeNote: 'Nothing beyond the status and check results is shown' },
  ),
  r(
    'REF-11',
    'acsp',
    'A Referral Partner also sees the result of each check done (identity document, liveness and face match, register comparison) as passed, flagged or not passed, and never a document image, extracted document data, provider payload or case message',
    'block',
    C7,
    ['C'],
    ['partner.check_results'],
    { outcomeNote: 'No grant, role or setting gives a path to documents' },
  ),
  r(
    'REF-12',
    'acsp',
    'A Referral Partner outside the UK sees status only',
    'block',
    PROPOSED,
    ['Design'],
    ['partner.country'],
    {
      outcomeNote: 'Awaiting the client’s data protection assessment',
      pending: 'P11',
    },
  ),

  // 10 Submission and records
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
    'SUB-04',
    'records',
    'The Companies House verification reference is recorded on the case. There is no field for the personal code: Companies House emails it directly to the individual and Evidence One does not receive or keep it',
    'block',
    C7,
    ['C'],
    ['submission.verification_reference'],
    { outcomeNote: 'Block completion until the reference is recorded' },
  ),
  r(
    'SUB-05',
    'records',
    'A submission is started only by a user of the instructing ACSP holding the ACSP Reviewer role, with a valid step-up, who signs in to Companies House with the ACSP’s own One Login. Evidence One never holds the login',
    'block',
    PROPOSED,
    ['Design'],
    ['user.role', 'auth.step_up', 'case.acsp_id'],
    { outcomeNote: 'Block otherwise' },
  ),
  r(
    'SUB-06',
    'records',
    'The individual is asked to confirm that the personal code has arrived from Companies House. The timing is set by personal_code_prompt. The code itself is never collected',
    'pass',
    C9,
    ['C'],
    ['submission.confirmed_at', 'case.personal_code_receipt'],
    {
      outcomeNote:
        'Scheduled. A prompt to the individual, answered Yes or Not yet',
      setting: 'personal_code_prompt',
      pending: 'M7',
    },
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
  r(
    'RET-05',
    'records',
    'Each ACSP controls its own verification records. Evidence One processes them on its behalf, and each ACSP’s records and audit chain are kept separate',
    'pass',
    C6,
    ['C'],
    ['acsp.id', 'audit.chain'],
    { outcomeNote: 'Enforced' },
  ),

  // 11 Case messages
  r(
    'MSG-01',
    'messages',
    'A case message that looks like a personal code or a company authentication code is refused with a warning and is not kept',
    'block',
    C9,
    ['C'],
    ['message.body'],
    {
      outcomeNote:
        '"Please do not share codes here. Companies House sends the personal code directly to the person."',
    },
  ),
  r(
    'MSG-02',
    'messages',
    'Every case has a secure message thread between the ACSP reviewer and the individual. Each message sends an email notification and is logged in the audit trail. Referral Partners never see it',
    'pass',
    C7,
    ['C'],
    ['case.messages', 'audit.case_message'],
    { outcomeNote: 'Enforced' },
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
    label: 'Proof of address and supporting evidence dated within',
    unit: 'months',
    basis: C7,
    min: 1,
    max: 12,
  },
  {
    key: 'passport_expiry_option1',
    label:
      'Passport expiry tolerance, Option 1 (only where the chip is validated)',
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
    basis: C7,
    min: 1,
    max: 10,
  },
  {
    key: 'recent_appointment_days',
    label: 'Recent appointment flag',
    unit: 'days',
    basis: PROPOSED,
    min: 1,
    max: 365,
  },
  {
    key: 'many_appointments',
    label: 'Many appointments flag',
    unit: 'active appointments',
    basis: PROPOSED,
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
  {
    key: 'reminder_day_1',
    label: 'First reminder to the individual',
    unit: 'days after the invite',
    basis: C7,
    min: 1,
    max: 30,
  },
  {
    key: 'reminder_day_2',
    label: 'Second reminder',
    unit: 'days after the invite',
    basis: C7,
    min: 1,
    max: 30,
  },
  {
    key: 'reminder_day_3',
    label: 'Third reminder',
    unit: 'days after the invite',
    basis: C7,
    min: 1,
    max: 30,
  },
  {
    key: 'abandon_after_days',
    label: 'Case abandoned after',
    unit: 'days',
    basis: C7,
    min: 7,
    max: 90,
  },
  {
    key: 'invite_valid_days',
    label: 'Invite valid for',
    unit: 'days',
    basis: C7,
    min: 1,
    max: 60,
  },
  {
    key: 'acsp_status_check_days',
    label: 'ACSP status check against the published files',
    unit: 'days',
    basis: C9,
    min: 1,
    max: 31,
  },
  {
    key: 'acsp_reconfirmation_months',
    label: 'ACSP reconfirmation of regulatory information',
    unit: 'months',
    basis: PROPOSED,
    min: 1,
    max: 24,
  },
]

export interface SettingOption {
  value: RuleSettings[SettingKey]
  label: string
  /** Shown beside the option when the platform recommends it. */
  recommended?: boolean
}

export interface SettingDef {
  key: SettingKey
  label: string
  question: string
  options: SettingOption[]
  rules: string[]
  /** Call-agenda code. Present where the client has not decided: shows "Pending your decision". */
  pending?: string
  /** Plain-English help shown under the setting. */
  help: string
}

export const settingDefs: SettingDef[] = [
  {
    key: 'chip_not_read_fallback',
    label: 'Chip not read',
    question: 'When a document has a chip and the chip is not read on the case',
    options: [
      {
        value: 'accept_web_result',
        label:
          'Accept a passing web-route result while the Companies House answer is awaited',
      },
      {
        value: 'request_other_then_option2',
        label: 'Request another Option 1 document, then Option 2',
      },
    ],
    rules: ['IDVT-01'],
    pending: 'P1',
    help: 'Evidence One does not read passport chips. Companies House has not yet answered whether Option 1 requires the chip to be read. Chip reading in the identity provider’s own app is an optional later step that would exist only if the chosen provider needs it and Companies House requires it. It is not built into the journey.',
  },
  {
    key: 'expired_passport_handling',
    label: 'Expired passports',
    question: 'How to treat an expired passport (DOC-EXP-01)',
    options: [
      {
        value: 'ask_other_document',
        label: 'Ask for another document until Companies House replies',
      },
      {
        value: 'accept_to_six_months_if_chip_validated',
        label: 'Accept up to six months expired where the chip is validated',
      },
    ],
    rules: ['DOC-EXP-01', 'ADDL-01'],
    pending: 'H1',
    help: 'The standard allows an expired passport up to six months only where the chip is validated. Evidence One does not read the chip, so for now an expired passport is asked for another document. Where it triggers ADDL-01 it is a Request, never a Halt.',
  },
  {
    key: 'step_up_channels',
    label: 'Step-up channels',
    question:
      'Which channels confirm "Confirm it’s you" before approve, decline, export or starting a submission',
    options: [
      {
        value: 'passkey_or_authenticator',
        label: 'Passkey or authenticator code only',
        recommended: true,
      },
      {
        value: 'passkey_authenticator_or_sms',
        label: 'Also allow SMS (not recommended)',
      },
    ],
    rules: ['DEC-01'],
    pending: 'H2',
    help: 'SMS is never used for step-up in the demo. Passkey or authenticator code only is recommended because of SIM swap. SMS stays for individuals’ one-time codes and for confirming mobile numbers.',
  },
  {
    key: 'personal_code_prompt',
    label: 'Personal code prompt',
    question:
      'When the individual is asked to confirm that the personal code has arrived from Companies House',
    options: [
      {
        value: 'day_after_confirmation',
        label: 'The day after Companies House confirms the verification',
      },
      {
        value: 'day_after_submission',
        label: 'The day after submission',
      },
    ],
    rules: ['SUB-06'],
    pending: 'M7',
    help: 'The earlier documents said the day after submission. The platform never collects the code itself: the individual answers Yes or Not yet.',
  },
  {
    key: 'acsp_register_period',
    label: 'ACSP time to register',
    question:
      'How long an ACSP that is Not yet listed has to appear on the Companies House published list',
    options: [
      { value: 'to_be_set', label: 'To be set' },
      { value: '30_days', label: '30 days' },
      { value: '60_days', label: '60 days' },
      { value: '90_days', label: '90 days' },
    ],
    rules: ['ACSP-14'],
    pending: 'M4',
    help: 'A Not yet listed ACSP is not blocked. It can still be allocated, with an administrator confirming each allocation, and becomes Active when the listing arrives.',
  },
  {
    key: 'yearly_upload_role',
    label: 'Yearly list upload',
    question:
      'Whether the yearly upload of the Companies House ACSP list replaces the fortnightly check or sits beside it',
    options: [
      { value: 'sits_beside', label: 'Sits beside the fortnightly check' },
      { value: 'replaces', label: 'Replaces the fortnightly check' },
    ],
    rules: ['ACSP-15', 'ACSP-10'],
    pending: 'M4',
    help: 'An administrator uploads the list and confirms each name match either way. Companies House publishes files and has no API.',
  },
  {
    key: 'pep_screening_default',
    label: 'PEP and sanctions screening default',
    question:
      'Whether screening is switched on by default for a new ACSP. Each ACSP can change it for itself',
    options: [
      { value: 'on', label: 'On by default' },
      { value: 'off', label: 'Off by default' },
    ],
    rules: ['AML-01'],
    pending: 'P6',
    help: 'Screening is a per-ACSP setting. Ongoing monitoring is off. Where screening is switched off for an ACSP, AML-01 to AML-04 do not apply to its cases.',
  },
  {
    key: 'escalate_enabled',
    label: 'Escalate',
    question:
      'A fourth reviewer action that routes a case to a named senior reviewer without deciding it',
    options: [
      { value: true, label: 'On' },
      { value: false, label: 'Off' },
    ],
    rules: ['DEC-06'],
    help: 'Off for the launch: the reviewer has three actions, Approve, Request information and Decline.',
  },
  {
    key: 'referral_commissions',
    label: 'Referral commissions',
    question: 'Whether Referral Partners may receive a commission',
    options: [
      { value: false, label: 'Off' },
      { value: true, label: 'On' },
    ],
    rules: ['REF-01', 'REF-02', 'REF-03'],
    help: 'Off at launch. Switching on needs a draft rule version and a second approver, and shows the referral arrangement disclosure and consent records to clients. A Super Administrator only.',
  },
]

export const defaultParams: Record<ParamKey, number> = {
  address_history_months: 12,
  supporting_evidence_months: 6,
  passport_expiry_option1: 6,
  passport_expiry_option2: 18,
  brp_expiry: 18,
  idvt_attempts: 3,
  recent_appointment_days: 30,
  many_appointments: 10,
  biometric_deletion_days: 30,
  retention_years: 7,
  review_target_hours: 36,
  reminder_day_1: 2,
  reminder_day_2: 5,
  reminder_day_3: 10,
  abandon_after_days: 30,
  invite_valid_days: 14,
  acsp_status_check_days: 14,
  acsp_reconfirmation_months: 12,
}

export const defaultSettings: RuleSettings = {
  chip_not_read_fallback: 'accept_web_result',
  expired_passport_handling: 'ask_other_document',
  step_up_channels: 'passkey_or_authenticator',
  personal_code_prompt: 'day_after_confirmation',
  acsp_register_period: 'to_be_set',
  yearly_upload_role: 'sits_beside',
  pep_screening_default: 'on',
  escalate_enabled: false,
  referral_commissions: false,
}

export const SUPER_ADMIN = 'Helen Carver, Super Administrator'
export const SECOND_APPROVER = 'Daniel Achebe, Super Administrator'

/** The Super Administrator's seat names, as written in audit entries. Seat 2 is the second approver. */
export const superAdminActor = (seat: 1 | 2) =>
  seat === 1 ? SUPER_ADMIN : SECOND_APPROVER

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
