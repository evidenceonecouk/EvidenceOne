import type { DemoData } from '@/types/domain'
import type { ActionResult } from './actions'

/* Admin actions. Each is recorded in the hash-chained audit trail. */

export function placeHold(
  data: DemoData,
  caseId: string,
  reason: string,
  actor: string,
): ActionResult {
  const at = new Date().toISOString()
  return {
    data: {
      ...data,
      retentionHolds: {
        ...data.retentionHolds,
        [caseId]: { reason, placedAt: at, placedBy: actor },
      },
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'retention.hold_placed',
        caseId,
        detail: `Retention hold placed: ${reason}. Destruction is suspended until the hold is lifted.`,
      },
    ],
  }
}

export function liftHold(
  data: DemoData,
  caseId: string,
  actor: string,
  stepUpRef: string,
): ActionResult {
  const holds = { ...data.retentionHolds }
  delete holds[caseId]
  return {
    data: { ...data, retentionHolds: holds },
    audit: [
      {
        at: new Date().toISOString(),
        actor,
        actorType: 'person',
        action: 'retention.hold_lifted',
        caseId,
        detail: `Retention hold lifted. The normal retention date applies again. Step-up ${stepUpRef} confirmed.`,
      },
    ],
  }
}

export function recordChainCheck(
  data: DemoData,
  entries: number,
  ok: boolean,
  actor: string,
): ActionResult {
  return {
    data,
    audit: [
      {
        at: new Date().toISOString(),
        actor,
        actorType: 'system',
        action: 'audit.chain_verified',
        detail: ok
          ? `Independent check of ${entries} entries. Every hash matches; the chain is intact.`
          : `Independent check of ${entries} entries found a break.`,
      },
    ],
  }
}
