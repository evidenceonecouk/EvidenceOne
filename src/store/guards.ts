import type { AuditInput } from '@/lib/audit'
import { PLATFORM_CHAIN } from '@/lib/audit'
import type { DemoData, VerificationCase } from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Record separation (Gate 2 acceptance scenario 5). An ACSP cannot read or
  change another ACSP's records. Screens refuse, and so do the actions: a store
  action that takes a reviewer refuses a case held by an ACSP the reviewer does
  not belong to, changes nothing, and writes an "Access refused" event to the
  requesting ACSP's own audit chain. The event holds a case reference only, no
  name and no other personal data, and is never written to the holder's chain.
*/

/** The ACSP a reviewer belongs to, if any. */
export const acspOfReviewer = (data: DemoData, reviewerId: string) =>
  data.acsps.find((a) => a.reviewers.some((r) => r.id === reviewerId))

/** True when the reviewer belongs to the ACSP that holds the case. */
export const canActOnCase = (
  data: DemoData,
  vc: VerificationCase,
  reviewerId: string,
) => acspOfReviewer(data, reviewerId)?.id === vc.acspId

/** The "Access refused" audit input for an ACSP that tried to reach a case it does not hold. */
export function accessRefusedEvent(
  data: DemoData,
  requestingAcspId: string | undefined,
  caseId: string,
  area: string,
  actor?: string,
): AuditInput {
  const acsp = data.acsps.find((a) => a.id === requestingAcspId)
  return {
    at: new Date().toISOString(),
    actor: actor ?? acsp?.name ?? 'ACSP user',
    actorType: 'person',
    action: 'access.refused',
    acspId: requestingAcspId ?? PLATFORM_CHAIN,
    detail: `Access refused: ${area} for case reference ${caseId}, which this ACSP does not hold. Nothing was shown or changed.`,
  }
}

/**
  Null when the reviewer may act on the case (or the case does not exist).
  Otherwise an action result that changes nothing and records the refusal.
*/
export function refuseOtherAcsp(
  data: DemoData,
  caseId: string,
  reviewerId: string,
  area: string,
): ActionResult | null {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc || canActOnCase(data, vc, reviewerId)) return null
  const reviewer = data.acsps
    .flatMap((a) => a.reviewers)
    .find((r) => r.id === reviewerId)
  return {
    data,
    audit: [
      accessRefusedEvent(
        data,
        acspOfReviewer(data, reviewerId)?.id,
        caseId,
        area,
        reviewer?.name,
      ),
    ],
  }
}

/** Screens call this once when they refuse: the same event, recorded from the page. */
export function recordAccessRefused(
  data: DemoData,
  requestingAcspId: string,
  caseId: string,
  area: string,
): ActionResult {
  // One event per screen visit: skip when the same refusal is already the latest event of the chain.
  const detail = accessRefusedEvent(data, requestingAcspId, caseId, area).detail
  const last = [...data.audit]
    .reverse()
    .find((e) => (e.acspId ?? PLATFORM_CHAIN) === requestingAcspId)
  if (last?.action === 'access.refused' && last.detail === detail)
    return { data, audit: [] }
  return {
    data,
    audit: [accessRefusedEvent(data, requestingAcspId, caseId, area)],
  }
}
