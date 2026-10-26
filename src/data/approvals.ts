import { packageText } from '@/store/superActions'
import type { ApprovalRequest } from '@/types/domain'
import { SUBSCRIPTION_PACKAGES } from './packages'

/*
  One pending change waiting for a second Super Administrator. Nobody approves
  their own proposal. The packages are provisional: the client confirms the
  final price and structure before go-live.
*/
export function seedApprovals(now: number): ApprovalRequest[] {
  const scale = SUBSCRIPTION_PACKAGES.find((p) => p.id === 'scale')!
  const proposed = { ...scale, storageGb: 30 }
  return [
    {
      id: 'APR-2026-0007',
      kind: 'subscription_plan',
      payload: { kind: 'subscription_plan', package: proposed },
      summary:
        'Scale package: storage from 25 GB to 30 GB, for discussion. The packages stay provisional until the client confirms them.',
      from: packageText(scale),
      to: packageText(proposed),
      proposedBy: 'Helen Carver, Super Administrator',
      proposedAt: new Date(now - 2 * 24 * 3_600_000).toISOString(),
      status: 'pending',
    },
  ]
}
