import { paymentTotal } from '@/lib/fees'
import { formatMoney } from '@/lib/format'
import type { Complaint, DemoData } from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Complaints and refunds, handled by a Platform Administrator (P10). A refund
  is possible only where a payment was taken on approval. What happens to the
  platform fee on a refunded case is not yet decided, so a refund leaves it as
  it was. Every step is recorded in the audit trail of the ACSP that holds the case.
*/

function patchComplaint(
  data: DemoData,
  id: string,
  patch: (c: Complaint) => Complaint,
): DemoData {
  return {
    ...data,
    complaints: (data.complaints ?? []).map((c) =>
      c.id === id ? patch(c) : c,
    ),
  }
}

/** Whether a refund is possible: only a payment that was taken can be refunded. */
export function refundableAmount(data: DemoData, complaint: Complaint) {
  const vc = data.cases.find((c) => c.id === complaint.caseId)
  return vc?.payment?.status === 'taken' ? paymentTotal(vc.payment) : undefined
}

export function refundComplaint(
  data: DemoData,
  id: string,
  reason: string,
  actor: string,
  stepUpRef: string,
): ActionResult {
  const complaint = data.complaints?.find((c) => c.id === id)
  if (!complaint || complaint.status !== 'open') return { data, audit: [] }
  const amount = refundableAmount(data, complaint)
  if (amount === undefined) return { data, audit: [] }
  const at = new Date().toISOString()
  return {
    data: patchComplaint(data, id, (c) => ({
      ...c,
      status: 'refunded',
      refund: { amount, reason, at, by: actor, stepUpRef },
    })),
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'auth.stepup.succeeded',
        caseId: complaint.caseId,
        detail: `Step-up ${stepUpRef} confirmed before a refund.`,
      },
      {
        at,
        actor,
        actorType: 'person',
        action: 'payment.refunded',
        caseId: complaint.caseId,
        detail: `Complaint ${id}: refund of ${formatMoney(amount)} to the payer through the secure payment provider. Reason: ${reason} What happens to the platform fee on a refunded case is not yet decided.`,
      },
    ],
  }
}

export function closeComplaint(
  data: DemoData,
  id: string,
  note: string,
  actor: string,
): ActionResult {
  const complaint = data.complaints?.find((c) => c.id === id)
  if (!complaint || complaint.status !== 'open') return { data, audit: [] }
  const at = new Date().toISOString()
  return {
    data: patchComplaint(data, id, (c) => ({
      ...c,
      status: 'closed',
      closedNote: note,
      closedAt: at,
      closedBy: actor,
    })),
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'complaint.closed',
        caseId: complaint.caseId,
        detail: `Complaint ${id} closed without a refund. ${note}`,
      },
    ],
  }
}
