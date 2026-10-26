import type { AuditInput } from '@/lib/audit'
import { CODE_KIND_LABEL, codeDeleteOn } from '@/lib/codeWarning'
import type { CaseMessage, CodeKind, DemoData } from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Case messages (G2-18): a secure thread between the ACSP reviewer and the
  individual, with an email notification and an audit entry for every message.
  Referral Partners never see it.

  Code messages (P4): the individual may pass a Companies House code to the
  allocated ACSP. The audit trail records that it was sent, viewed, received and
  deleted, never the code itself.
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
): ActionResult & { accepted: boolean } {
  const text = body.trim()
  if (!text) return { data, audit: [], accepted: false }
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

/** The individual sends a Companies House code to the allocated ACSP as a hidden code message. */
export function sendCodeMessage(
  data: DemoData,
  caseId: string,
  authorName: string,
  codeKind: CodeKind,
  value: string,
): ActionResult & { accepted: boolean } {
  const text = value.trim()
  if (!text) return { data, audit: [], accepted: false }
  const at = new Date().toISOString()
  const message: CaseMessage = {
    id: nextId(data, caseId),
    from: 'individual',
    authorName,
    at,
    body: text,
    notifiedAt: at,
    kind: 'code',
    codeKind,
  }
  return {
    accepted: true,
    data: withMessages(data, caseId, (m) => [...m, message]),
    audit: [
      {
        at,
        actor: authorName,
        actorType: 'person',
        action: 'case.code_message.sent',
        caseId,
        detail: `Code message sent to the allocated ACSP reviewer (${CODE_KIND_LABEL[codeKind].toLowerCase()}). Only the allocated reviewer and the individual can open it. The code is not recorded in the audit trail.`,
      },
    ],
  }
}

/** The allocated reviewer opens a code message. The view is audited, never the value. */
export function viewCodeMessage(
  data: DemoData,
  caseId: string,
  messageId: string,
  reviewerName: string,
): ActionResult {
  const m = data.cases
    .find((c) => c.id === caseId)
    ?.messages?.find((x) => x.id === messageId)
  if (!m || m.kind !== 'code') return { data, audit: [] }
  return {
    data,
    audit: [
      {
        at: new Date().toISOString(),
        actor: reviewerName,
        actorType: 'person',
        action: 'case.code_message.viewed',
        caseId,
        detail: `The allocated ACSP reviewer opened a code message (${CODE_KIND_LABEL[m.codeKind ?? 'personal_code'].toLowerCase()}). The code is not recorded in the audit trail.`,
      },
    ],
  }
}

/** "Mark code received": the text is deleted automatically 30 days later. */
export function markCodeReceived(
  data: DemoData,
  caseId: string,
  messageId: string,
  reviewerName: string,
): ActionResult {
  const at = new Date().toISOString()
  const deleteOn = codeDeleteOn(at)
  return {
    data: withMessages(data, caseId, (ms) =>
      ms.map((m) =>
        m.id === messageId && m.kind === 'code' && !m.receivedAt
          ? { ...m, receivedAt: at, receivedBy: reviewerName, deleteOn }
          : m,
      ),
    ),
    audit: [
      {
        at,
        actor: reviewerName,
        actorType: 'person',
        action: 'case.code_message.received',
        caseId,
        detail: `The ACSP marked the code received. The message text will be deleted automatically on ${deleteOn.slice(0, 10)}, 30 days later. The code is not recorded in the audit trail.`,
      },
    ],
  }
}

/** Guided demo only: move a received code message 30 days on, so its text is deleted. */
export function fastForwardCodeDeletion(
  data: DemoData,
  caseId: string,
  messageId: string,
): ActionResult {
  const at = new Date().toISOString()
  return {
    data: withMessages(data, caseId, (ms) =>
      ms.map((m) =>
        m.id === messageId && m.kind === 'code' && m.receivedAt
          ? { ...m, body: '', deletedAt: at, deleteOn: m.deleteOn ?? at }
          : m,
      ),
    ),
    audit: [
      {
        at,
        actor: 'Evidence One',
        actorType: 'system',
        action: 'case.code_message.deleted',
        caseId,
        detail:
          'Code message text deleted automatically 30 days after the ACSP marked it received (simulated in the guided demo). The record that a code message was sent remains.',
      },
    ],
  }
}
