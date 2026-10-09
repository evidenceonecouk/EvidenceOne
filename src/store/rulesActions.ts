import { fullName } from '@/lib/format'
import type { DemoData, DiscrepancyReport } from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Rule-related actions. The reviewer's choice on the "Report this difference to
  Companies House" prompt (G2-10) is logged on the case. Nothing is filed
  through an API.
*/
export function recordDiscrepancyChoice(
  data: DemoData,
  caseId: string,
  choice: NonNullable<DiscrepancyReport['choice']>,
  reviewerName: string,
  note?: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc?.discrepancyReport) return { data, audit: [] }
  const at = new Date().toISOString()
  const person = data.people.find((p) => p.id === vc.personId)
  return {
    data: {
      ...data,
      cases: data.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              discrepancyReport: {
                ...c.discrepancyReport!,
                choice,
                choiceNote: note,
                choiceAt: at,
                choiceBy: reviewerName,
              },
            }
          : c,
      ),
    },
    audit: [
      {
        at,
        actor: reviewerName,
        actorType: 'person',
        action: 'case.discrepancy.choice',
        caseId,
        detail: `Register difference for ${person ? fullName(person) : 'the individual'}: ${vc.discrepancyReport.summary}. Choice: ${choice === 'will_report' ? 'will report it to Companies House' : 'not reporting it'}.${note ? ` ${note}` : ''} Logged on the case; nothing is filed through an API.`,
      },
    ],
  }
}
