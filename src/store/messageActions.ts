import type { AuditInput } from '@/lib/audit'
import { looksLikeCode } from '@/lib/codeWarning'
import type { CaseMessage, DemoData } from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Case messages (G2-18): a secure thread between the ACSP reviewer and the
  individual, with an email notification and an audit entry for every message.
  Referral Partners never see it. Text that looks like a code is refused and
  never kept.
*/

export function postCaseMessage(
  data: DemoData,
  caseId: string,
  from: CaseMessage['from'],
  authorName: string,
  body: string,
): ActionResult & { accepted: boolean } {
  const text = body.trim()
  if (!text || looksLikeCode(text)) return { data, audit: [], accepted: false }
  const at = new Date().toISOString()
  const message: CaseMessage = {
    id: `msg-${caseId}-${(data.cases.find((c) => c.id === caseId)?.messages?.length ?? 0) + 1}`,
    from,
    authorName,
    at,
    body: text,
    notifiedAt: at,
  }
  const audit: AuditInput[] = [
    {
      at,
      actor: authorName,
      actorType: 'person',
      action: 'case.message.sent',
      caseId,
      detail: `Secure message sent ${from === 'reviewer' ? 'to the individual' : 'to the ACSP reviewer'}. An email notification was sent. The message text stays in the case thread.`,
    },
  ]
  return {
    accepted: true,
    data: {
      ...data,
      cases: data.cases.map((c) =>
        c.id === caseId
          ? { ...c, messages: [...(c.messages ?? []), message] }
          : c,
      ),
    },
    audit,
  }
}
