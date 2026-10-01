import { PRIMARY_REVIEWER_ID } from '@/data/organisations'
import { ruleById, rules, settingDefs, sourceNames } from '@/data/rules'
import { formatDate, fullName } from '@/lib/format'
import { comparisonRows, currentRuleSet, draftRuleSet, evaluateCase, outcomeUnder, outstandingFor, ruleSetFor, stepLabels, type Citation, type RuleResult } from '@/lib/rules'
import { versionChanges } from '@/lib/versionDiff'
import type { CaseStep, DemoData, RuleSetVersion } from '@/types/domain'

/*
  The ACSP Copilot for the demo. It never calls an AI service: every answer is
  built from the case and the rule set on screen, so it is always accurate to
  what the reviewer can see, and every statement cites its source. It cannot
  take decisions and does not answer what the data cannot support.
*/

export type CopilotScope = { kind: 'case'; caseId: string } | { kind: 'rules' }

export interface Statement {
  text: string
  cites: Citation[]
}

export interface CopilotAnswer {
  intent: string
  lead?: string
  statements: Statement[]
  draft?: { to: string; body: string }
  refusal?: 'decision' | 'unsupported'
}

export const CASE_SUGGESTIONS = [
  'What remains outstanding on this case?',
  'Why was this case flagged?',
  'Which evidence supports this?',
  'Identify discrepancies across this file.',
  'Summarise this case.',
  'Draft a message to the individual asking for the outstanding item.',
]

export const RULES_SUGGESTIONS = ['What does REG-13 do?', 'Which rules can block approval?', 'What changed between versions?']

export const ANSWER_HEADER = 'AI assistant. Advisory only. Answers come from this case and your approved materials.'
export const RULES_ANSWER_HEADER = 'AI assistant. Advisory only. Answers come from your approved rule set.'
export const UNSUPPORTED = 'Not supported by approved sources. This is a matter for your professional judgement.'
export const NO_DECISIONS = 'I can’t make decisions. Only you can approve, request information or decline.'

const rule = (id: string): Citation => ({ kind: 'rule', ref: id, label: id })
const uniq = (cs: Citation[]) => cs.filter((c, i) => cs.findIndex((x) => x.kind === c.kind && x.ref === c.ref) === i)

const DECISION = [/^\s*(please\s+)?(approve|decline|reject|refuse|accept|sign off|pass|fail|verify)\b/i, /\b(can|could|will|would|should) you\s+(approve|decline|reject|decide|sign|verify|accept)/i, /\b(approve|decline|reject)\s+(this|the|it|him|her|them)\b/i, /\b(make|take) (the|a|this) decision\b/i, /\bdecide (for me|this)\b/i]
const UNSUPPORTED_RX = /(allowed to|permitted to|eligible|lawful|legal|illegal|disqualif|should i\b|should we\b|is it ok|is it safe|\badvice\b|\badvise\b|liable|offence|penalt|\bfine\b|money launder|risk rating)/i

const RULE_ID = /\b([A-Z]{2,4}(?:-EXP)?-\d{2})\b/i

/** Classifies a free-text question into one of the supported intents, or a refusal. */
export function classify(scope: CopilotScope, q: string): string {
  if (DECISION.some((rx) => rx.test(q))) return 'decision'
  if (UNSUPPORTED_RX.test(q)) return 'unsupported'
  const s = q.toLowerCase()
  if (scope.kind === 'rules') {
    if (RULE_ID.test(q) && ruleById(q.match(RULE_ID)![1].toUpperCase())) return 'explain'
    if (/block|halt|stop|prevent|cannot approve|can't approve/.test(s)) return 'blocking'
    if (/chang|version|diff|differ|publish|history/.test(s)) return 'versions'
    return 'none'
  }
  if (RULE_ID.test(q) && ruleById(q.match(RULE_ID)![1].toUpperCase()) && /what does|explain|mean/.test(s)) return 'explain'
  if (/draft|message|write to|email (the|him|her|them)|ask (him|her|them|the individual) for/.test(s)) return 'draft'
  if (/outstanding|remain|left to|still need|to do|open item|blocking|before i can/.test(s)) return 'outstanding'
  if (/discrepanc|differ|mismatch|inconsisten|conflict/.test(s)) return 'discrepancies'
  if (/summar|overview|brief|recap/.test(s)) return 'summary'
  if (/evidence|support|backs|proof|why .*pass/.test(s)) return 'evidence'
  if (/why|flag|concern|issue|problem|risk/.test(s)) return 'flagged'
  return 'none'
}

export function answerQuestion(data: DemoData, scope: CopilotScope, question: string): CopilotAnswer {
  const intent = classify(scope, question)
  if (intent === 'decision') return { intent, refusal: 'decision', statements: [{ text: NO_DECISIONS, cites: [rule('DEC-01'), rule('DEC-02')] }] }
  if (intent === 'unsupported' || intent === 'none')
    return {
      intent,
      refusal: 'unsupported',
      statements: [{ text: UNSUPPORTED, cites: [] }],
      lead: intent === 'none' ? 'I can answer the suggested questions about this case and the rule set.' : undefined,
    }
  return scope.kind === 'rules' ? rulesAnswer(data, intent, question) : caseAnswer(data, scope.caseId, intent, question)
}

/* Case answers */

const outcomeVerb: Record<string, string> = {
  block: 'blocks approval',
  halt: 'halted the case',
  request: 'is waiting on a request',
  mandatory: 'needs your Mandatory decision',
  flag: 'raised a flag for you to note',
}

const resultCites = (r: RuleResult) => uniq(r.cites)

function caseAnswer(data: DemoData, caseId: string, intent: string, question: string): CopilotAnswer {
  const vc = data.cases.find((c) => c.id === caseId)
  const person = vc && data.people.find((p) => p.id === vc.personId)
  const entry = vc && data.register.find((r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber)
  if (!vc || !person || !entry) return { intent, refusal: 'unsupported', statements: [{ text: UNSUPPORTED, cites: [] }] }
  const results = evaluateCase(data, vc)
  const rs = ruleSetFor(data, vc)
  const version: Citation = { kind: 'version', ref: rs.version, label: `Rule set ${rs.version}` }
  const outstanding = outstandingFor(results)
  const notPassed = results.filter((r) => r.outcome !== 'pass')
  const name = fullName(person)
  const first = person.givenNames.split(' ')[0]

  if (!results.length) return { intent, statements: [{ text: `${name} has not finished the app journey yet, so no rules have been evaluated on this case.`, cites: [{ kind: 'declared', ref: 'personal', label: 'Case status' }] }] }

  switch (intent) {
    case 'explain': {
      const id = question.match(RULE_ID)![1].toUpperCase()
      return rulesAnswer(data, 'explain', id, rs)
    }
    case 'outstanding': {
      if (!outstanding.length)
        return { intent, lead: 'Nothing is outstanding.', statements: [{ text: `No Block, Halt or Request is open, and every Mandatory decision has been recorded under rule set ${rs.version}. The decision is yours.`, cites: [rule('DEC-02'), version] }] }
      return {
        intent,
        lead: `${outstanding.length} item${outstanding.length === 1 ? '' : 's'} must be cleared before approval (DEC-02).`,
        statements: outstanding.map((o) => {
          const r = results.find((x) => x.ruleId === o.ruleId && x.title === o.title)!
          const how = o.reason === 'mandatory_open' ? 'Record your decision with a reason.' : o.reason === 'not_satisfied' ? 'You recorded that you are not satisfied. Approval stays closed; you can request information or decline.' : o.reason === 'request' ? 'Waiting for the individual.' : o.reason === 'halt' ? 'Resumes automatically once the register matches.' : 'Approval stays closed while this stands. The case can still be declined.'
          return { text: `${o.ruleId} ${outcomeVerb[o.outcome] ?? ''}: ${o.title} ${how}`, cites: resultCites(r) }
        }),
      }
    }
    case 'flagged': {
      if (!notPassed.length) return { intent, lead: 'Nothing was flagged.', statements: [{ text: `Every rule evaluated on this case passed under rule set ${rs.version}.`, cites: [rule('DEC-02'), version] }] }
      return {
        intent,
        lead: `${notPassed.length} rule result${notPassed.length === 1 ? '' : 's'} need${notPassed.length === 1 ? 's' : ''} your attention.`,
        statements: notPassed.map((r) => ({ text: `${r.ruleId} ${outcomeVerb[r.outcome]}. ${explain(r)}`, cites: resultCites(r) })),
      }
    }
    case 'evidence': {
      const steps = [...new Set(results.map((r) => r.step))] as CaseStep[]
      const statements: Statement[] = []
      for (const step of steps) {
        const passed = results.filter((r) => r.step === step && r.outcome === 'pass')
        if (!passed.length) continue
        const cites = uniq(passed.flatMap((r) => r.cites))
        const sources = cites.filter((c) => c.kind !== 'rule' && c.kind !== 'param' && c.kind !== 'setting').map((c) => c.label)
        statements.push({ text: `${stepLabels[step]}: ${passed.map((r) => r.ruleId).join(', ')} passed, supported by ${sources.length ? [...new Set(sources)].join(', ').toLowerCase() : 'the case data'}.`, cites })
      }
      const held = vc.evidence.map((e) => e.label)
      if (held.length) statements.push({ text: `Evidence held on file: ${held.join('; ')}.`, cites: vc.evidence.map((e) => ({ kind: 'evidence' as const, ref: e.kind === 'identity_document' ? 'identity_document' : e.id, label: e.label })) })
      return { intent, lead: 'What stands behind each passed step:', statements }
    }
    case 'discrepancies': {
      const statements: Statement[] = []
      for (const row of comparisonRows(person, person.document, entry)) {
        if (row.result === 'mismatch') statements.push({ text: `${row.field}: ${row.document} on the document, ${row.register} on the register${row.stated !== row.document ? `, ${row.stated} as stated` : ''}. ${row.note ?? ''}`.trim(), cites: [rule(row.ruleId), { kind: 'register', ref: row.field, label: `Register: ${row.field.toLowerCase()}` }, { kind: 'evidence', ref: 'identity_document', label: 'Identity document' }] })
      }
      for (const r of results.filter((x) => (x.ruleId === 'IDVT-06' && x.outcome !== 'pass') || (x.ruleId === 'ADDL-02' && x.outcome !== 'pass') || (x.ruleId === 'ADDL-11' && x.outcome !== 'pass') || x.ruleId === 'REG-04')) statements.push({ text: `${r.ruleId}: ${r.title}`, cites: resultCites(r) })
      if (!statements.length) return { intent, lead: 'No discrepancies found.', statements: [{ text: 'Declared details, the identity document and the Companies House register agree on name, month and year of birth and nationality after normalisation.', cites: [rule('REG-11'), rule('REG-12'), rule('REG-13'), { kind: 'register', ref: 'Full name', label: 'Register: full name' }] }] }
      return { intent, lead: `${statements.length} difference${statements.length === 1 ? '' : 's'} across declared data, the document and the register:`, statements }
    }
    case 'summary': {
      const checks = results.filter((r) => r.step === 'idvt' && r.outcome === 'pass').map((r) => r.ruleId)
      const mandatory = results.filter((r) => r.outcome === 'mandatory')
      const diffs = comparisonRows(person, person.document, entry).filter((r) => r.result === 'mismatch')
      return {
        intent,
        lead: `${name}, ${vc.id}, under rule set ${rs.version}.`,
        statements: [
          { text: vc.option === 2 ? 'Option 2 person check in use, because Option 1 could not support the document.' : `Checks completed: ${checks.length ? checks.join(', ') : 'none yet'} passed, with PEP and sanctions screening ${vc.idvt.pepSanctions === 'pending' ? 'not yet run' : 'completed'}.`, cites: [...checks.map(rule), { kind: 'check', ref: vc.option === 2 ? 'screening' : 'liveness', label: 'Identity checks' }] },
          { text: `Evidence held: ${vc.evidence.length} item${vc.evidence.length === 1 ? '' : 's'} (${vc.evidence.map((e) => e.label).join('; ')}).`, cites: vc.evidence.map((e) => ({ kind: 'evidence' as const, ref: e.kind === 'identity_document' ? 'identity_document' : e.id, label: e.label })) },
          { text: diffs.length ? `Discrepancies: ${diffs.map((d) => `${d.field.toLowerCase()} differs from the register`).join('; ')}.` : 'Discrepancies: none between declared data, the document and the register.', cites: [rule('REG-11'), rule('REG-12'), rule('REG-13')] },
          { text: outstanding.length ? `Outstanding actions: ${outstanding.map((o) => o.ruleId).join(', ')}.` : 'Outstanding actions: none. The decision is yours.', cites: outstanding.length ? outstanding.map((o) => rule(o.ruleId)) : [rule('DEC-02')] },
          { text: mandatory.length ? `Needs your attention: ${mandatory.map((m) => `${m.ruleId}${m.decision ? ' (decision recorded)' : ''}`).join(', ')}.` : 'Needs your attention: no Mandatory decision on this case.', cites: mandatory.length ? mandatory.map((m) => rule(m.ruleId)) : [rule('DEC-02')] },
        ],
      }
    }
    case 'draft': {
      const requests = outstanding.filter((o) => o.reason === 'request')
      const custom = question.match(/asking (?:them |him |her )?for (.+?)[.?!]*$/i)?.[1]
      const useCustom = custom && !/outstanding item/i.test(custom)
      const item = useCustom ? custom : requests.length ? requests.map((o) => o.title.replace(/^.*?\. /, '').trim()).join(' ') : undefined
      if (!item) return { intent, lead: 'There is nothing outstanding to ask for.', statements: [{ text: 'No Request is open on this case, so there is no item to draft a message about.', cites: [rule('DEC-04')] }] }
      const acsp = data.acsps.find((a) => a.id === vc.acspId)
      const reviewer = acsp?.reviewers.find((r) => r.id === PRIMARY_REVIEWER_ID) ?? acsp?.reviewers[0]
      const body = `Dear ${first},\n\nYour identity verification is being conducted by ${acsp?.name ?? 'your ACSP'} using the Evidence One platform. To continue, we need the following from you:\n\n${requests.length && !useCustom ? requests.map((o) => `- ${o.title}`).join('\n') : `- ${item}`}\n\nYou can upload it in the Evidence One app without starting again. If you have any questions, reply to this message.\n\nKind regards,\n${reviewer?.name ?? 'ACSP reviewer'}\n${acsp?.name ?? ''}`
      return {
        intent,
        lead: 'Here is a draft. Review it before sending.',
        statements: [{ text: useCustom ? `Draft asks for: ${item}.` : `Draft asks for the open request${requests.length === 1 ? '' : 's'}: ${requests.map((o) => o.ruleId).join(', ')}.`, cites: useCustom ? [rule('DEC-04')] : requests.map((o) => rule(o.ruleId)) }],
        draft: { to: `${name} <${person.email}>`, body },
      }
    }
  }
  return { intent, refusal: 'unsupported', statements: [{ text: UNSUPPORTED, cites: [] }] }
}

function explain(r: RuleResult): string {
  const def = ruleById(r.ruleId)
  return `${r.title}${r.title.endsWith('.') ? '' : '.'}${def ? ` The rule tests: ${def.condition.charAt(0).toLowerCase()}${def.condition.slice(1)}.` : ''}`
}

/* Rule set answers */

function rulesAnswer(data: DemoData, intent: string, question: string, rsOverride?: RuleSetVersion): CopilotAnswer {
  const rs = rsOverride ?? currentRuleSet(data)
  const version: Citation = { kind: 'version', ref: rs.version, label: `Version ${rs.version}` }
  if (intent === 'explain') {
    const id = question.match(RULE_ID)![1].toUpperCase()
    const def = ruleById(id)!
    const outcome = outcomeUnder(id, rs)
    const statements: Statement[] = [
      { text: `${id} tests: ${def.condition}.`, cites: [rule(id)] },
      { text: `Outcome in version ${rs.version}: ${outcomeName[outcome]}${def.outcomeNote ? `. ${def.outcomeNote}` : ''}.`, cites: [rule(id), version] },
      { text: `Source: ${def.source} (${def.sources.map((s) => sourceNames[s]).join('; ')}).`, cites: [rule(id)] },
    ]
    if (def.param) statements.push({ text: `It reads the parameter ${def.param}, set to ${rs.params[def.param]} in version ${rs.version}.`, cites: [{ kind: 'param', ref: def.param, label: def.param }, version] })
    if (def.setting) {
      const s = settingDefs.find((x) => x.key === def.setting)!
      statements.push({ text: `Its outcome depends on the decision setting "${s.label}", currently ${s.options.find((o) => o.value === rs.settings[def.setting!])?.label}. That setting is pending your decision (${s.decisionPoint}).`, cites: [{ kind: 'setting', ref: s.key, label: s.label }] })
    }
    statements.push({ text: 'It is evaluated the same way every time. It is never evaluated by AI.', cites: [rule(id)] })
    return { intent, lead: `${id}, ${groupName(def.group)}`, statements }
  }
  if (intent === 'blocking') {
    const blocking = rules.filter((r) => ['block', 'halt'].includes(outcomeUnder(r.id, rs)) && !['SUB-01', 'SUB-02', 'SUB-03', 'RET-04'].includes(r.id))
    return {
      intent,
      lead: `In version ${rs.version}, these rules can stop approval:`,
      statements: [
        ...blocking.map((r) => ({ text: `${r.id} (${outcomeName[outcomeUnder(r.id, rs)]}): ${r.condition}.`, cites: [rule(r.id)] })),
        { text: 'Every Mandatory decision also keeps approval closed until you record a decision with a reason (DEC-02). Requests keep the case waiting on the individual.', cites: [rule('DEC-02')] },
        { text: 'No rule declines a case. Only the ACSP reviewer approves or declines.', cites: [rule('DEC-01')] },
      ],
    }
  }
  if (intent === 'versions') {
    const draft = draftRuleSet(data)
    const published = data.ruleSets.filter((v) => v.status === 'current' || v.status === 'superseded').sort((a, b) => (a.effectiveFrom ?? '').localeCompare(b.effectiveFrom ?? ''))
    const statements: Statement[] = []
    const cur = currentRuleSet(data)
    const prev = published[published.indexOf(cur) - 1]
    if (prev) {
      const changes = versionChanges(prev, cur)
      statements.push({
        text: changes.length ? `From ${prev.version} to ${cur.version}: ${changes.map((c) => `${c.label} changed from ${c.from} to ${c.to}`).join('; ')}.` : `${cur.version} holds the same parameters and settings as ${prev.version}.`,
        cites: [{ kind: 'version', ref: prev.version, label: `Version ${prev.version}` }, { kind: 'version', ref: cur.version, label: `Version ${cur.version}` }, ...changes.map((c) => ({ kind: c.kind, ref: c.key, label: c.label }) as Citation)],
      })
      if (cur.effectiveFrom) statements.push({ text: `${cur.version} is current, effective ${formatDate(cur.effectiveFrom)}, published by ${cur.publishedBy} after approval by a second approver.`, cites: [{ kind: 'version', ref: cur.version, label: `Version ${cur.version}` }] })
    }
    if (draft) {
      const changes = versionChanges(cur, draft)
      statements.push({ text: `Draft ${draft.version} (${draft.status === 'pending_approval' ? 'waiting for the second approver' : 'not yet submitted'}) changes: ${changes.length ? changes.map((c) => `${c.label} from ${c.from} to ${c.to}`).join('; ') : 'nothing yet'}.`, cites: [{ kind: 'version', ref: draft.version, label: `Draft ${draft.version}` }, ...changes.map((c) => ({ kind: c.kind, ref: c.key, label: c.label }) as Citation)] })
    }
    statements.push({ text: 'Decided cases keep the version applied at their decision.', cites: [{ kind: 'version', ref: cur.version, label: `Version ${cur.version}` }] })
    return { intent, lead: 'Version history', statements }
  }
  return { intent, refusal: 'unsupported', statements: [{ text: UNSUPPORTED, cites: [] }] }
}

const outcomeName: Record<string, string> = { pass: 'Pass', flag: 'Flag', mandatory: 'Mandatory decision', request: 'Request', halt: 'Halt', block: 'Block' }
const groupName = (g: string) => ({ info: 'Personal information', register: 'Register association and comparison', document: 'Identity document', idvt: 'IDVT checks', aml: 'PEP and sanctions', evidence: 'Supporting evidence', option: 'Option 1 and Option 2', decision: 'Decision', records: 'Submission and records' })[g] ?? g

/** Flat list of what an answer relied on, for the audit entry. */
export function answerSources(a: CopilotAnswer): string[] {
  return [...new Set(a.statements.flatMap((s) => s.cites.map((c) => (c.kind === 'rule' ? c.ref : c.label))))]
}

export function answerText(a: CopilotAnswer): string {
  return [a.lead, ...a.statements.map((s) => s.text)].filter(Boolean).join(' ')
}
