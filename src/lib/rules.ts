import { PRIMARY_REVIEWER_ID } from '@/data/organisations'
import { ruleById } from '@/data/rules'
import { formatDate, fullName } from '@/lib/format'
import { historyCovers, monthYear, movedWithin, normaliseName, NORMALISATION_NOTE, registerNameToDocumentOrder } from '@/lib/register'
import type { CaseStep, ComparisonResult, DemoData, IdDocument, Person, RegisterEntry, RuleDecision, RuleOutcome, RuleSetVersion, VerificationCase } from '@/types/domain'

/*
  Deterministic rule evaluation. The same inputs always give the same results,
  and nothing here calls an AI model. Where an input came from AI extraction
  (the date or address on a bank statement) the result says so.
*/

/** Something on screen a statement can point to. Rendered as data-cite="kind:ref". */
export interface Citation {
  kind: 'rule' | 'evidence' | 'register' | 'check' | 'declared' | 'param' | 'version' | 'setting'
  ref: string
  label: string
}

export const citeKey = (c: Pick<Citation, 'kind' | 'ref'>) => `${c.kind}:${c.ref}`

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

export const currentRuleSet = (data: DemoData): RuleSetVersion => data.ruleSets.find((v) => v.status === 'current') ?? data.ruleSets[0]
export const draftRuleSet = (data: DemoData) => data.ruleSets.find((v) => v.status === 'draft' || v.status === 'pending_approval')

/** The version in force at a moment, from the effective dates of published versions. */
export function versionAt(data: DemoData, iso: string): RuleSetVersion {
  const t = new Date(iso).getTime()
  const published = data.ruleSets.filter((v) => v.effectiveFrom && (v.status === 'current' || v.status === 'superseded'))
  const inForce = published.filter((v) => new Date(v.effectiveFrom!).getTime() <= t).sort((a, b) => b.effectiveFrom!.localeCompare(a.effectiveFrom!))[0]
  return inForce ?? published.sort((a, b) => a.effectiveFrom!.localeCompare(b.effectiveFrom!))[0] ?? currentRuleSet(data)
}

/** Decided cases keep the version applied at their decision; open cases use the version in force. */
export function ruleSetFor(data: DemoData, vc: VerificationCase): RuleSetVersion {
  if (vc.decision && vc.decision.outcome !== 'request_info' && vc.ruleSetVersion) return data.ruleSets.find((v) => v.version === vc.ruleSetVersion) ?? currentRuleSet(data)
  return currentRuleSet(data)
}

/** The outcome a rule produces under a version, after any decision setting. */
export function outcomeUnder(ruleId: string, rs: RuleSetVersion): RuleOutcome {
  if (ruleId === 'REG-13') return rs.settings.nationality_difference === 'halt' ? 'halt' : 'mandatory'
  return ruleById(ruleId)?.outcome ?? 'flag'
}

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

export const documentName = (doc: IdDocument) => `${doc.issuingCountry === 'United Kingdom' ? 'UK ' : doc.issuingCountry === 'Ireland' ? 'Irish ' : `${doc.issuingCountry} `}${documentNames[doc.type].toLowerCase()}`

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
export function comparisonRows(person: Person, doc: IdDocument | undefined, entry: RegisterEntry): ComparisonRow[] {
  if (!doc) return []
  const regName = registerNameToDocumentOrder(entry.registerName)
  const nameOk = normaliseName(regName) === normaliseName(doc.nameOnDocument)
  const dobOk = monthYear(doc.dobOnDocument) === entry.registerDobMonthYear
  const nat = doc.nationalityOnDocument ?? person.nationality
  const natOk = nat === entry.registerNationality
  return [
    { field: 'Full name', ruleId: 'REG-11', stated: fullName(person), document: doc.nameOnDocument, register: entry.registerName, result: nameOk ? 'match' : 'mismatch', note: nameOk ? undefined : nameDifference(doc.nameOnDocument, regName) },
    { field: 'Date of birth', ruleId: 'REG-12', stated: formatDate(person.dateOfBirth), document: formatDate(doc.dobOnDocument), register: entry.registerDobMonthYear, result: dobOk ? 'match' : 'mismatch', note: 'The public register shows month and year only.' },
    { field: 'Nationality', ruleId: 'REG-13', stated: person.nationality, document: nat, register: entry.registerNationality, result: natOk ? 'match' : 'mismatch' },
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

export interface EvidenceTrigger {
  ruleId: 'ADDL-01' | 'ADDL-02' | 'ADDL-03'
  reason: string
}

/** Rules ADDL-01 to ADDL-03: whether this case calls for one supporting document. */
export function evidenceTriggers(person: Person, doc: IdDocument | Pick<IdDocument, 'type'> | undefined, rs: RuleSetVersion, formerNames: string[] = [], now = Date.now()): EvidenceTrigger[] {
  const out: EvidenceTrigger[] = []
  const current = person.addressHistory.find((a) => !a.to)
  const type = doc?.type ?? 'passport'
  const licenceAddress = doc && 'addressOnDocument' in doc ? doc.addressOnDocument : undefined
  if (type === 'driving_licence') {
    if (licenceAddress && current && !licenceAddress.startsWith(current.address.line1)) out.push({ ruleId: 'ADDL-02', reason: 'The driving licence shows a different address from the current address declared.' })
  } else if (rs.settings.passport_address_evidence === 'always') {
    out.push({ ruleId: 'ADDL-02', reason: `A ${documentNames[type].toLowerCase()} does not show an address, and this rule set asks every passport holder for current address evidence.` })
  } else if (movedWithin(person, rs.params.address_history_months, now)) {
    out.push({ ruleId: 'ADDL-02', reason: `The person moved within the last ${rs.params.address_history_months} months and a ${documentNames[type].toLowerCase()} does not show an address.` })
  }
  const names = formerNames.length ? formerNames : (person.formerNames ?? [])
  if (names.length) out.push({ ruleId: 'ADDL-03', reason: `A former name is declared (${names.join(', ')}).` })
  return out
}

/** The reviewer who would decide: the recorded one, or the signed-in reviewer for open cases. */
const reviewerFor = (data: DemoData, vc: VerificationCase) => data.acsps.flatMap((a) => a.reviewers).find((r) => r.id === (vc.reviewerId ?? PRIMARY_REVIEWER_ID))

/** Every rule result for a case that has reached the reviewer. */
export function evaluateCase(data: DemoData, vc: VerificationCase, now = Date.now()): RuleResult[] {
  const person = data.people.find((p) => p.id === vc.personId)
  const entry = data.register.find((r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber)
  if (!person || !entry) return []
  const rs = ruleSetFor(data, vc)
  const P = rs.params
  const doc = person.document
  const results: RuleResult[] = []
  const decisions = vc.ruleDecisions ?? {}
  const add = (ruleId: string, step: CaseStep, outcome: RuleOutcome, title: string, cites: Citation[] = [], detail?: string) =>
    results.push({ ruleId, step, outcome, title, detail, cites: [{ kind: 'rule', ref: ruleId, label: ruleId }, ...cites], decision: outcome === 'mandatory' ? decisions[ruleId] : undefined })
  const checkAt = vc.idvt.completedAt ?? vc.submittedForReviewAt ?? new Date(now).toISOString()
  const reached = !!vc.submittedForReviewAt || !!vc.option2
  if (!reached) return []

  // 1 Personal information
  const declared: Citation = { kind: 'declared', ref: 'personal', label: 'Step 1 details' }
  add('INFO-01', 'info', 'pass', `Full name given: ${fullName(person)}`, [declared])
  const former = vc.journey?.formerNames ?? person.formerNames ?? []
  add('INFO-02', 'info', 'pass', former.length ? `Former names declared: ${former.join(', ')}` : 'Former names answered: none', [declared])
  add('INFO-03', 'info', 'pass', `Date of birth given: ${formatDate(person.dateOfBirth)}`, [declared])
  add('INFO-04', 'info', 'pass', `Email ${person.email} confirmed by one-time code`, [declared])
  add('INFO-05', 'info', 'pass', 'Current home address given in structured form', [{ kind: 'declared', ref: 'address', label: 'Address history' }])
  const covers = historyCovers(person, P.address_history_months, now)
  add('INFO-06', 'info', covers ? 'pass' : 'request', covers ? `Address history covers the last ${P.address_history_months} months with no gap` : `Address history does not cover the last ${P.address_history_months} months`, [{ kind: 'declared', ref: 'address', label: 'Address history' }, { kind: 'param', ref: 'address_history_months', label: `${P.address_history_months} months` }])
  add('INFO-07', 'info', 'pass', 'Email and mobile are not registered to another individual or to the inviting Agent', [declared])

  // 2 Register association and comparison
  const regCite = (field: string): Citation => ({ kind: 'register', ref: field, label: `Register: ${field.toLowerCase()}` })
  const role = entry.role === 'director_psc' ? 'Both' : entry.role === 'director' ? 'Director' : 'PSC'
  add('REG-02', 'register', 'pass', `On the register of the company as: ${role}`, [regCite('Role')])
  if (entry.identityVerified) add('REG-04', 'register', 'flag', 'The register already showed this person’s identity as verified. They were told before payment and chose to continue.', [regCite('Identity verified')])
  add('REG-10', 'register', 'pass', 'Person on the company’s register at the decision snapshot', [regCite('Role')])
  for (const row of comparisonRows(person, doc, entry)) {
    const docCite: Citation = { kind: 'evidence', ref: 'identity_document', label: 'Identity document' }
    if (row.ruleId === 'REG-11') {
      if (row.result === 'match') add('REG-11', 'register', 'pass', 'Name on the document matches the register after normalisation', [docCite, regCite('Full name')], NORMALISATION_NOTE)
      else {
        const nonLatin = !!doc?.nonLatinName
        const outcome: RuleOutcome = nonLatin && rs.settings.non_latin_difference === 'mandatory' ? 'mandatory' : 'halt'
        add('REG-11', 'register', outcome, `Name on the document differs from the register after normalisation. ${row.note ?? ''}`.trim(), [docCite, regCite('Full name')], nonLatin ? 'The name is transliterated from a non-Latin script.' : NORMALISATION_NOTE)
      }
    } else if (row.ruleId === 'REG-12') {
      add('REG-12', 'register', row.result === 'match' ? 'pass' : 'halt', row.result === 'match' ? `Month and year of birth match the register (${row.register})` : `Month and year of birth differ from the register (${row.register})`, [docCite, regCite('Date of birth')])
    } else {
      add('REG-13', 'register', row.result === 'match' ? 'pass' : outcomeUnder('REG-13', rs), row.result === 'match' ? `Nationality matches the register (${row.register})` : `Nationality differs: ${row.document} on the document, ${row.register} on the register`, [docCite, regCite('Nationality')])
    }
  }
  if (new Date(checkAt).getTime() - new Date(entry.appointedOn).getTime() < P.recent_appointment_days * DAY) add('REG-16', 'register', 'flag', `Appointed ${formatDate(entry.appointedOn)}, within the last ${P.recent_appointment_days} days`, [regCite('Appointed'), { kind: 'param', ref: 'recent_appointment_days', label: `${P.recent_appointment_days} days` }])
  if ((entry.activeAppointments ?? 1) > P.many_appointments) add('REG-17', 'register', 'flag', `Holds ${entry.activeAppointments} active appointments, more than ${P.many_appointments}`, [regCite('Appointments'), { kind: 'param', ref: 'many_appointments', label: `${P.many_appointments}` }])

  // 3 Identity document
  if (doc) {
    const docCite: Citation = { kind: 'evidence', ref: 'identity_document', label: documentName(doc) }
    add('DOC-01', 'document', 'pass', `${documentName(doc)} is on the accepted list for Option ${vc.option}`, [docCite])
    const expired = new Date(doc.expiresOn).getTime() < new Date(checkAt).getTime()
    if (vc.option === 2) {
      // Option 2 expiry tolerances are tested under OPT-06.
    } else if (doc.type === 'passport') {
      const beyond = expired && (addMonths(doc.expiresOn, P.passport_expiry_option1) < new Date(checkAt).getTime() || vc.idvt.nfcChipRead !== 'pass')
      add('DOC-EXP-01', 'document', beyond ? 'request' : 'pass', beyond ? `Passport expired ${formatDate(doc.expiresOn)}, beyond the ${P.passport_expiry_option1}-month tolerance for a chip-validated passport` : expired ? `Passport expired ${formatDate(doc.expiresOn)}, within the ${P.passport_expiry_option1}-month tolerance with a validated chip` : `Passport in date at the check, expires ${formatDate(doc.expiresOn)}`, [docCite, { kind: 'param', ref: 'passport_expiry_option1', label: `${P.passport_expiry_option1} months` }])
    } else if (doc.type === 'biometric_residence_permit') {
      const beyond = expired && addMonths(doc.expiresOn, P.brp_expiry) < new Date(checkAt).getTime()
      add('DOC-EXP-02', 'document', beyond ? 'request' : 'pass', beyond ? `Permit expired beyond ${P.brp_expiry} months` : `Permit within tolerance, expires ${formatDate(doc.expiresOn)}`, [docCite, { kind: 'param', ref: 'brp_expiry', label: `${P.brp_expiry} months` }])
    } else {
      add('DOC-EXP-03', 'document', expired ? 'request' : 'pass', expired ? `Document expired ${formatDate(doc.expiresOn)}` : `Document in date at the check, expires ${formatDate(doc.expiresOn)}`, [docCite])
    }
    if (doc.cancelledOrReplaced) add('DOC-02', 'document', 'mandatory', 'Provider reports cancellation marks or the document as replaced. Never an automatic rejection.', [docCite])
    if (doc.damaged) add('DOC-05', 'document', 'mandatory', 'Damage affecting personal details reported by the provider', [docCite])
  }

  // 4 IDVT checks
  const i = vc.idvt
  const check = (ref: string, label: string): Citation => ({ kind: 'check', ref, label })
  if (vc.option === 1) {
    if (doc?.hasChip && !vc.browserCapture) add('IDVT-01', 'idvt', i.nfcChipRead === 'pass' ? 'pass' : 'block', i.nfcChipRead === 'pass' ? 'Chip read in the app and its cryptographic signature validated' : 'Chip signature not validated', [check('chip', 'Chip read')])
    else add('IDVT-02', 'idvt', i.documentAuthenticity === 'pass' ? 'pass' : 'block', i.documentAuthenticity === 'pass' ? 'Physical security features validated by the certified identity provider' : 'Physical security features not validated', [check('authenticity', 'Document authenticity')])
    add('IDVT-03', 'idvt', i.liveness === 'pass' ? 'pass' : 'block', i.liveness === 'pass' ? 'Liveness passed' : 'Liveness not passed', [check('liveness', 'Liveness')])
    add('IDVT-04', 'idvt', i.faceMatch === 'pass' ? 'pass' : 'block', i.faceMatch === 'pass' ? `Face match passed${i.faceMatchScore ? ` (${i.faceMatchScore}%)` : ''}` : 'Face match not passed', [check('face', 'Face match')])
    const referred = (['nfcChipRead', 'documentAuthenticity', 'liveness', 'faceMatch'] as const).filter((k) => i[k] === 'refer')
    if (referred.length) add('IDVT-05', 'idvt', 'mandatory', `The provider returned a result for review on: ${referred.map((k) => ({ nfcChipRead: 'chip read', documentAuthenticity: 'document authenticity', liveness: 'liveness', faceMatch: 'face match' })[k]).join(', ')}`, [check('authenticity', 'Provider result')])
    if (doc) {
      const nameDiff = normaliseName(doc.nameOnDocument) !== normaliseName(fullName(person))
      const dobDiff = doc.dobOnDocument !== person.dateOfBirth
      add('IDVT-06', 'idvt', nameDiff || dobDiff ? 'mandatory' : 'pass', nameDiff || dobDiff ? 'Name or date of birth on the document differs from what the individual entered at Step 1' : 'Name and date of birth on the document match what the individual entered', [declared, { kind: 'evidence', ref: 'identity_document', label: 'Identity document' }])
    }
  }
  const attempts = i.attempts ?? 1
  if (vc.option2?.reason === 'attempts_used' || attempts >= P.idvt_attempts) add('IDVT-08', 'idvt', 'flag', `All ${P.idvt_attempts} attempts at the checks used. Routed to Option 2.`, [check('liveness', 'Attempts'), { kind: 'param', ref: 'idvt_attempts', label: `${P.idvt_attempts} attempts` }])
  else if (vc.option2?.reason === 'unsupported_document') add('IDVT-08', 'idvt', 'flag', 'The certified identity provider cannot support this document. Routed to Option 2.', [check('authenticity', 'Provider result')])
  else if (attempts > 1) add('IDVT-07', 'idvt', 'pass', `Checks passed on attempt ${attempts} of ${P.idvt_attempts}`, [{ kind: 'param', ref: 'idvt_attempts', label: `${P.idvt_attempts} attempts` }])

  // 5 PEP and sanctions: supporting evidence for the reviewer, never a decision
  const scr = check('screening', 'PEP and sanctions screening')
  if (i.pepSanctions === 'pending') add('AML-01', 'aml', 'block', 'Screening has not run yet', [scr])
  else {
    add('AML-01', 'aml', 'pass', 'Screening completed by the certified identity provider', [scr])
    add('AML-02', 'aml', i.pepPossibleMatch ? 'mandatory' : 'pass', i.pepPossibleMatch ? 'A possible PEP match was returned. Decide whether it relates to this person.' : 'No possible PEP match', [scr])
    add('AML-03', 'aml', i.sanctionsPossibleMatch ? 'mandatory' : 'pass', i.sanctionsPossibleMatch ? 'A possible sanctions match was returned' : 'No possible sanctions match', [scr])
    if (i.adverseMedia) add('AML-04', 'aml', 'flag', 'Adverse media returned by the provider', [scr])
  }

  // 6 Supporting evidence, only when a trigger applies
  const triggers = doc ? evidenceTriggers(person, doc, rs, former, new Date(checkAt).getTime()) : []
  const supporting = vc.evidence.filter((e) => e.kind === 'address_evidence')
  if (doc && vc.option === 1) {
    const expiredBeyond = results.some((x) => x.ruleId.startsWith('DOC-EXP') && x.outcome === 'request')
    if (expiredBeyond) add('ADDL-01', 'evidence', 'request', 'The identity document is expired beyond its exception. Another identity document is needed.', [{ kind: 'evidence', ref: 'identity_document', label: 'Identity document' }])
    const addr = triggers.find((t) => t.ruleId === 'ADDL-02')
    const p = { kind: 'setting' as const, ref: 'passport_address_evidence', label: rs.settings.passport_address_evidence === 'always' ? 'Setting: always' : 'Setting: only when needed' }
    if (addr) add('ADDL-02', 'evidence', supporting.length ? 'flag' : 'request', supporting.length ? `One supporting document was requested and provided. ${addr.reason}` : `One supporting document is needed for the current address. ${addr.reason}`, [p, ...supporting.map((e) => ({ kind: 'evidence' as const, ref: e.id, label: e.label }))])
    else add('ADDL-02', 'evidence', 'pass', doc.type === 'driving_licence' ? 'The driving licence shows the current address. No supporting document needed.' : 'No supporting document needed. The identity document and address history were sufficient.', [p])
    const name = triggers.find((t) => t.ruleId === 'ADDL-03')
    if (name) add('ADDL-03', 'evidence', 'request', `Evidence of the name change is needed. ${name.reason}`, [declared])
  }
  for (const e of supporting) {
    const ev: Citation = { kind: 'evidence', ref: e.id, label: e.label }
    add('ADDL-10', 'evidence', 'pass', `${e.label} is an accepted type of supporting document`, [ev])
    if (e.documentDate) {
      const ok = addMonths(e.documentDate, P.supporting_evidence_months) >= new Date(e.uploadedAt).getTime()
      add('ADDL-11', 'evidence', ok ? 'pass' : 'request', ok ? `Dated ${formatDate(e.documentDate)}, within ${P.supporting_evidence_months} months of upload (date read by AI extraction)` : `Dated ${formatDate(e.documentDate)}, more than ${P.supporting_evidence_months} months before upload (date read by AI extraction). A more recent document is needed.`, [ev, { kind: 'param', ref: 'supporting_evidence_months', label: `${P.supporting_evidence_months} months` }])
    }
    add('ADDL-12', 'evidence', e.showsAddress === false ? 'mandatory' : 'pass', e.showsAddress === false ? 'The document does not clearly show the declared current address (AI extraction)' : 'Shows the declared current address (AI extraction)', [ev, { kind: 'declared', ref: 'address', label: 'Current address' }])
    add('ADDL-13', 'evidence', e.showsName === false ? 'mandatory' : 'pass', e.showsName === false ? 'The document does not show the individual’s name (AI extraction)' : 'Shows the individual’s name (AI extraction)', [ev])
  }

  // 7 Option 1 and Option 2
  add('OPT-01', 'option', 'pass', vc.option === 2 ? 'The case started as Option 1' : 'Option 1: digital verification by a certified identity provider', [check('authenticity', 'Option 1')])
  if (vc.option === 2 && vc.option2) {
    const o = vc.option2
    const reason = { attempts_used: 'all attempts at the digital checks were used', unsupported_document: 'the provider cannot support the document', no_chip_phone: 'the person’s phone cannot read the passport chip and they have no photocard driving licence' }[o.reason]
    if (o.reason === 'no_chip_phone') add('OPT-02', 'option', 'mandatory', `Option 2 requested because ${reason}. Your agreement is needed before a person check is used.`, [{ kind: 'declared', ref: 'option2', label: 'Option 2 request' }])
    else add('OPT-02', 'option', 'flag', `Option 2 offered because ${reason}`, [{ kind: 'declared', ref: 'option2', label: 'Option 2 request' }])
    const reviewer = reviewerFor(data, vc)
    const att = reviewer?.attestation
    const current = att && new Date(att.expiresOn).getTime() > now
    add('OPT-03', 'option', current ? 'pass' : 'block', current ? `${reviewer!.name} holds a current training attestation (${att!.reference}, valid to ${formatDate(att!.expiresOn)})` : 'The reviewer has no current training attestation for person checks', [{ kind: 'declared', ref: 'attestation', label: 'Training attestation' }])
    const docs = o.documents ?? []
    const a = docs.filter((d) => d.group === 'A').length
    const b = docs.filter((d) => d.group === 'B').length
    const met = a >= 2 || (a >= 1 && b >= 1)
    add('OPT-04', 'option', met ? 'pass' : 'request', met ? `Documents checked: ${docs.map((d) => `${d.label} (Group ${d.group})`).join(' and ')}` : 'Two documents are needed: two from Group A, or one from Group A and one from Group B', docs.map((d, k) => ({ kind: 'evidence' as const, ref: `option2-${k}`, label: d.label })))
    for (const d of docs.filter((x) => x.expiresOn && /passport/i.test(x.label))) {
      const beyond = addMonths(d.expiresOn!, P.passport_expiry_option2) < new Date(o.checkedAt ?? checkAt).getTime()
      add('OPT-06', 'option', beyond ? 'request' : 'pass', beyond ? `${d.label} expired more than ${P.passport_expiry_option2} months ago` : `${d.label} within the ${P.passport_expiry_option2}-month Option 2 tolerance`, [{ kind: 'param', ref: 'passport_expiry_option2', label: `${P.passport_expiry_option2} months` }])
    }
  }
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
    if (r.outcome === 'block' || r.outcome === 'halt' || r.outcome === 'request') out.push({ ruleId: r.ruleId, outcome: r.outcome, title: r.title, reason: r.outcome })
    else if (r.outcome === 'mandatory' && !r.decision) out.push({ ruleId: r.ruleId, outcome: r.outcome, title: r.title, reason: 'mandatory_open' })
    else if (r.outcome === 'mandatory' && r.decision?.decision === 'not_satisfied') out.push({ ruleId: r.ruleId, outcome: r.outcome, title: r.title, reason: 'not_satisfied' })
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
    .map((vc) => ({ vc, result: evaluateCase(data, vc).find((r) => r.ruleId === ruleId) }))
    .filter((x): x is { vc: VerificationCase; result: RuleResult } => !!x.result)
}


export interface VersionChange {
  kind: 'param' | 'setting'
  key: string
  label: string
  from: string
  to: string
}

/** Exactly what differs between two rule set versions. Rule text is fixed, so only parameters and settings can change. */
export function diffVersions(from: RuleSetVersion, to: RuleSetVersion, labels: { params: Record<string, { label: string; unit: string }>; settings: Record<string, { label: string; options: { value: unknown; label: string }[] }> }): VersionChange[] {
  const out: VersionChange[] = []
  for (const key of Object.keys(to.params) as (keyof RuleSetVersion['params'])[]) {
    if (from.params[key] !== to.params[key]) {
      const l = labels.params[key]
      out.push({ kind: 'param', key, label: l?.label ?? key, from: `${from.params[key]} ${l?.unit ?? ''}`.trim(), to: `${to.params[key]} ${l?.unit ?? ''}`.trim() })
    }
  }
  for (const key of Object.keys(to.settings) as (keyof RuleSetVersion['settings'])[]) {
    if (from.settings[key] !== to.settings[key]) {
      const l = labels.settings[key]
      const name = (v: unknown) => l?.options.find((o) => o.value === v)?.label ?? String(v)
      out.push({ kind: 'setting', key, label: l?.label ?? key, from: name(from.settings[key]), to: name(to.settings[key]) })
    }
  }
  return out
}
