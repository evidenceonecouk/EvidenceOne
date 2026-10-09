import type { ApprovalRequest } from '@/types/domain'

/*
  One pending change waiting for a second Super Administrator. Nobody approves
  their own proposal. The price is not set, so the proposal is the structure only.
*/
export function seedApprovals(now: number): ApprovalRequest[] {
  return [
    {
      id: 'APR-2026-0007',
      kind: 'subscription_plan',
      summary:
        'Subscription for an ACSP’s own clients: a monthly fee alone, price not set. Terms to be set by the client by 4 January 2027.',
      from: 'Monthly fee with a number of cases included, price not set',
      to: 'Monthly fee alone, price not set',
      proposedBy: 'Helen Carver, Super Administrator',
      proposedAt: new Date(now - 2 * 24 * 3_600_000).toISOString(),
      status: 'pending',
    },
  ]
}
