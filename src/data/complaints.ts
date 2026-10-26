import { paymentTotal } from '@/lib/fees'
import type { AuditInput } from '@/lib/audit'
import type { Complaint, Person, VerificationCase } from '@/types/domain'

/*
  Seeded complaints for the Platform Administrator (P10, decided 19 and 20
  October: platform administrators handle complaints and refunds). Fictional
  clients only. A refund is possible only where a payment was taken, that is
  on an approved case: nothing is taken on a declined case.
*/

const DAY = 86_400_000
const ADMIN = 'Marcus Adeyemi, Platform Administrator'

export function seedComplaints(
  cases: VerificationCase[],
  people: Person[],
  now: number,
): { complaints: Complaint[]; audit: AuditInput[] } {
  const at = (offset: number) => new Date(now + offset).toISOString()
  const has = (id: string) => cases.some((c) => c.id === id)
  const who = (caseId: string) => {
    const vc = cases.find((c) => c.id === caseId)
    const p = people.find((x) => x.id === vc?.personId)
    return p ? `${p.givenNames} ${p.familyName}` : 'The client'
  }
  const taken = (caseId: string) => {
    const p = cases.find((c) => c.id === caseId)?.payment
    return p ? paymentTotal(p) : 0
  }
  const complaints: Complaint[] = [
    {
      id: 'CMP-2026-0012',
      caseId: 'EO-2026-000129',
      raisedBy: who('EO-2026-000129'),
      raisedAt: at(-1 * DAY - 2 * 3_600_000),
      summary:
        'My card shows a pending amount but my verification is not finished. Have I been charged?',
      status: 'open',
    },
    {
      id: 'CMP-2026-0011',
      caseId: 'EO-2026-000124',
      raisedBy: who('EO-2026-000124'),
      raisedAt: at(-20 * DAY),
      summary:
        'The turnaround shown before I instructed the ACSP was 24 hours. It took four days and I missed a filing deadline.',
      status: 'open',
    },
    {
      id: 'CMP-2026-0010',
      caseId: 'EO-2025-000088',
      raisedBy: who('EO-2025-000088'),
      raisedAt: at(-320 * DAY),
      summary: 'I do not agree with the decision to decline my verification.',
      status: 'closed',
      closedNote:
        'Nothing was taken on the declined case, so there is nothing to refund. The decision is the ACSP’s; the client was pointed to the rejection reason and to the ACSP for any further documents.',
      closedAt: at(-318 * DAY),
      closedBy: ADMIN,
    },
    {
      id: 'CMP-2026-0009',
      caseId: 'EO-2026-000118',
      raisedBy: who('EO-2026-000118'),
      raisedAt: at(-30 * DAY),
      summary:
        'I was asked for the same proof of address twice, after I had already uploaded it.',
      status: 'refunded',
      refund: {
        amount: taken('EO-2026-000118'),
        reason:
          'Service not as described: the same document was requested twice. Full refund of the ACSP Professional Fee agreed with the ACSP.',
        at: at(-28 * DAY),
        by: ADMIN,
        stepUpRef: 'SU-4C1A-118R',
      },
    },
  ].filter((c) => has(c.caseId)) as Complaint[]

  const audit: AuditInput[] = []
  for (const c of complaints) {
    audit.push({
      at: c.raisedAt,
      actor: c.raisedBy,
      actorType: 'person',
      action: 'complaint.raised',
      caseId: c.caseId,
      detail: `Complaint ${c.id} raised. Handled by a Platform Administrator.`,
    })
    if (c.refund)
      audit.push({
        at: c.refund.at,
        actor: c.refund.by,
        actorType: 'person',
        action: 'payment.refunded',
        caseId: c.caseId,
        detail: `Complaint ${c.id}: refund of £${c.refund.amount.toFixed(2)} to the payer. Reason: ${c.refund.reason} Step-up ${c.refund.stepUpRef} confirmed. What happens to the platform fee on a refunded case is not yet decided.`,
      })
    if (c.closedAt)
      audit.push({
        at: c.closedAt,
        actor: c.closedBy ?? ADMIN,
        actorType: 'person',
        action: 'complaint.closed',
        caseId: c.caseId,
        detail:
          `Complaint ${c.id} closed without a refund. ${c.closedNote ?? ''}`.trim(),
      })
  }
  return { complaints, audit }
}
