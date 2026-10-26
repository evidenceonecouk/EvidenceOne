import type { AuditInput } from '@/lib/audit'
import { monthYear } from '@/lib/register'
import { comparisonRows } from '@/lib/rules'
import type {
  CorrectionTask,
  DemoData,
  DiscrepancyReport,
  VerificationCase,
} from '@/types/domain'
import { reviewerName, type ActionResult } from './actions'
import { refuseOtherAcsp } from './guards'

/*
  Reviewer-side actions for register differences (G2-10). A difference in name,
  date of birth, nationality or transliteration is flagged to the reviewer with
  a Mandatory decision. It never halts Route A. The reviewer is prompted to
  report the difference to Companies House; the platform logs the choice and
  does not file anything through an API.
*/

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

/** The reviewer on a case: the recorded one, or the first reviewer of the ACSP holding it. */
export function reviewerIdFor(data: DemoData, vc: VerificationCase): string {
  return (
    vc.reviewerId ??
    data.acsps.find((a) => a.id === vc.acspId)?.reviewers[0]?.id ??
    ''
  )
}

/** One line per differing field, for the discrepancy prompt and the audit trail. */
export function differenceSummary(
  data: DemoData,
  vc: VerificationCase,
): string[] {
  const person = data.people.find((p) => p.id === vc.personId)
  const entry = data.register.find(
    (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
  )
  if (!person || !entry) return []
  return comparisonRows(person, person.document, entry)
    .filter((r) => r.result === 'mismatch')
    .map((r) =>
      r.field === 'Full name' && r.note
        ? `${r.field}: ${r.note.replace(/\.$/, '')}`
        : `${r.field}: ${r.document} on the document, ${r.register} on the register`,
    )
}

/**
  Records the reviewer's choice on the "Report this difference to Companies
  House" prompt. Logged on the case and in the audit trail with who and when.
*/
export function recordDiscrepancyChoice(
  data: DemoData,
  caseId: string,
  summary: string,
  choice: NonNullable<DiscrepancyReport['choice']>,
  note: string,
  reviewerId: string,
): ActionResult {
  const refused = refuseOtherAcsp(
    data,
    caseId,
    reviewerId,
    'the discrepancy choice',
  )
  if (refused) return refused
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const now = new Date().toISOString()
  const who = reviewerName(data, reviewerId)
  const report: DiscrepancyReport = {
    summary: vc.discrepancyReport?.summary ?? summary,
    promptedAt: vc.discrepancyReport?.promptedAt ?? now,
    choice,
    choiceNote: note.trim() || undefined,
    choiceAt: now,
    choiceBy: who,
  }
  const audit: AuditInput[] = [
    {
      at: now,
      actor: who,
      actorType: 'person',
      action: 'register.discrepancy.choice',
      caseId,
      detail: `${choice === 'will_report' ? 'Will report' : 'Will not report'} the register difference to Companies House (${report.summary}).${report.choiceNote ? ` Note: ${report.choiceNote}` : ''} The choice is logged only. Evidence One does not file the report.`,
    },
  ]
  return {
    data: patchCase(data, caseId, (c) => ({ ...c, discrepancyReport: report })),
    audit,
  }
}

const nextTaskId = (data: DemoData) => {
  const max = data.corrections
    .map((t) => Number(t.id.replace('FL-2026-', '')))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0)
  return `FL-2026-${String(max + 1).padStart(6, '0')}`
}

/**
  Raises a Route B register correction task for a genuine register error. This
  is a separate action from the discrepancy prompt, and the case is not halted:
  Route A carries on and the decision stays with the reviewer.
*/
export function raiseRegisterCorrection(
  data: DemoData,
  caseId: string,
  field: string,
  reviewerId: string,
): ActionResult {
  const refused = refuseOtherAcsp(
    data,
    caseId,
    reviewerId,
    'the register correction task',
  )
  if (refused) return refused
  const vc = data.cases.find((c) => c.id === caseId)
  const person = vc && data.people.find((p) => p.id === vc.personId)
  const entry =
    vc &&
    data.register.find(
      (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
    )
  if (!vc || !person || !entry || vc.correctionTaskId)
    return { data, audit: [] }
  const row = comparisonRows(person, person.document, entry).find(
    (r) => r.field === field,
  )
  if (!row) return { data, audit: [] }
  const now = new Date().toISOString()
  const id = nextTaskId(data)
  const task: CorrectionTask = {
    id,
    route: 'B',
    form: 'ACSP04',
    caseId,
    companyNumber: vc.companyNumber,
    personId: vc.personId,
    field,
    registerValue: row.register,
    correctValue:
      field === 'Full name'
        ? `${person.familyName.toUpperCase()}, ${person.givenNames}`
        : field === 'Date of birth'
          ? monthYear(person.document?.dobOnDocument ?? person.dateOfBirth)
          : row.document,
    status: 'open',
    createdAt: now,
  }
  return {
    data: {
      ...patchCase(data, caseId, (c) => ({ ...c, correctionTaskId: id })),
      corrections: [...data.corrections, task],
    },
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'route_b.task.raised',
        caseId,
        detail: `Route B register correction task ${id} raised: ${field.toLowerCase()} ${task.registerValue} to ${task.correctValue}. Route A is not halted and the decision stays with the reviewer.`,
      },
    ],
  }
}
