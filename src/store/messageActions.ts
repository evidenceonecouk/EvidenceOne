import type { AuditInput } from '@/lib/audit'
import { looksLikeCode } from '@/lib/codeWarning'
import type { CaseMessage, DemoData } from '@/types/domain'
import type { ActionResult } from './actions'
import { refuseOtherAcsp } from './guards'

/*
  Case messages (G2-18): a secure thread between the ACSP reviewer and the
  individual, with an email notification and an audit entry for every message.
  Referral Partners never see it.

  Messages carry no codes (G2-12 and G2-18, 23 October). Text that looks like a
  code is refused here as well as on screen, and is never saved or audited.
*/

const nextId = (data: DemoData, caseId: string) =>
  `msg-${caseId}-${(data.cases.find((c) => c.id === caseId)?.messages?.length ?? 0) + 1}`

const withMessages = (
  data: DemoData,
  caseId: string,
  fn: (messages: CaseMessage[]) => CaseMessage[],
): DemoData => ({
  ...data,
  cases: data.cases.map((c) =>
    c.id === caseId ? { ...c, messages: fn(c.messages ?? []) } : c,
  ),
})

export function postCaseMessage(
  data: DemoData,
  caseId: string,
  from: CaseMessage['from'],
  authorName: string,
  body: string,
  /** The acting reviewer. Required for a message from an ACSP reviewer. */
  reviewerId?: string,
): ActionResult & { accepted: boolean } {
  if (from === 'reviewer') {
    const refused = reviewerId
      ? refuseOtherAcsp(data, caseId, reviewerId, 'the case messages')
      : null
    if (refused) return { ...refused, accepted: false }
    if (!reviewerId) return { data, audit: [], accepted: false }
  }
  const text = body.trim()
  if (!text || looksLikeCode(text)) return { data, audit: [], accepted: false }
  const at = new Date().toISOString()
  const message: CaseMessage = {
    id: nextId(data, caseId),
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
    data: withMessages(data, caseId, (m) => [...m, message]),
    audit,
  }
}
