import type { DemoData, ExportRequest, VerificationCase } from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Verification file export (decided 19 October). The ACSP downloads its file
  immediately after pressing Approve. Later, within the seven years, it asks a
  Platform Administrator, who releases the download and never opens the
  evidence. Every download needs step-up. Code messages are never part of the
  file.
*/

/**
  How long after the decision the ACSP can download without a request.
  Design interpretation of "immediately after pressing Approve": the same
  working day. Confirm with the client.
*/
export const DIRECT_EXPORT_HOURS = 24

/** True while the ACSP can download directly after its decision. */
export function directExportOpen(vc: VerificationCase, now = Date.now()) {
  const at = vc.decision?.decidedAt
  if (!at || vc.decision?.outcome === 'request_info') return false
  return now - new Date(at).getTime() < DIRECT_EXPORT_HOURS * 3_600_000
}

/** The latest export request for a case, if any. */
export const exportRequestFor = (data: DemoData, caseId: string) =>
  (data.exportRequests ?? [])
    .filter((x) => x.caseId === caseId)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0]

function nextId(data: DemoData) {
  const n = (data.exportRequests ?? []).length + 31
  return `EXP-2026-${String(n).padStart(4, '0')}`
}

export function requestExport(
  data: DemoData,
  caseId: string,
  requestedBy: string,
  reason: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const at = new Date().toISOString()
  const request: ExportRequest = {
    id: nextId(data),
    caseId,
    acspId: vc.acspId,
    requestedBy,
    requestedAt: at,
    reason,
    status: 'requested',
  }
  return {
    data: {
      ...data,
      exportRequests: [request, ...(data.exportRequests ?? [])],
    },
    audit: [
      {
        at,
        actor: requestedBy,
        actorType: 'person',
        action: 'export.requested',
        caseId,
        detail: `${request.id}: export of the verification file requested. Reason: ${reason}. Waiting for a Platform Administrator to release it.`,
      },
    ],
  }
}

export function releaseExport(
  data: DemoData,
  id: string,
  releasedBy: string,
): ActionResult {
  const req = (data.exportRequests ?? []).find((x) => x.id === id)
  if (!req || req.status !== 'requested') return { data, audit: [] }
  const at = new Date().toISOString()
  return {
    data: {
      ...data,
      exportRequests: (data.exportRequests ?? []).map((x) =>
        x.id === id
          ? { ...x, status: 'released', releasedBy, releasedAt: at }
          : x,
      ),
    },
    audit: [
      {
        at,
        actor: releasedBy,
        actorType: 'person',
        action: 'export.released',
        caseId: req.caseId,
        acspId: req.acspId,
        detail: `${req.id}: download released to the ACSP. The administrator did not open the evidence.`,
      },
    ],
  }
}

export function recordExportDownload(
  data: DemoData,
  id: string,
  actor: string,
  stepUpRef: string,
): ActionResult {
  const req = (data.exportRequests ?? []).find((x) => x.id === id)
  if (!req || req.status !== 'released') return { data, audit: [] }
  const at = new Date().toISOString()
  return {
    data: {
      ...data,
      exportRequests: (data.exportRequests ?? []).map((x) =>
        x.id === id
          ? { ...x, status: 'downloaded', downloadedAt: at, stepUpRef }
          : x,
      ),
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'export.downloaded',
        caseId: req.caseId,
        detail: `${req.id}: verification file downloaded after release. Step-up ${stepUpRef} confirmed.`,
      },
    ],
  }
}
