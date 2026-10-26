import type { AuditInput } from '@/lib/audit'
import type { ExportRequest, VerificationCase } from '@/types/domain'
import { PRIMARY_ACSP_ID } from './organisations'

/*
  Seeded export requests: one waiting for a Platform Administrator to release,
  one released and ready for the ACSP to download behind step-up. Both are for
  decided cases of the primary ACSP, decided more than a day ago.
*/
export function seedExportRequests(
  cases: VerificationCase[],
  now: number,
): { requests: ExportRequest[]; audit: AuditInput[] } {
  const day = 86_400_000
  const old = cases
    .filter(
      (c) =>
        c.acspId === PRIMARY_ACSP_ID &&
        c.decision &&
        c.decision.outcome !== 'request_info' &&
        now - new Date(c.decision.decidedAt).getTime() > 2 * day,
    )
    .sort((a, b) => a.decision!.decidedAt.localeCompare(b.decision!.decidedAt))
  const [first, second] = old
  const requests: ExportRequest[] = []
  const audit: AuditInput[] = []
  const iso = (ms: number) => new Date(ms).toISOString()
  if (first) {
    const at = now - 3 * day
    requests.push({
      id: 'EXP-2026-0029',
      caseId: first.id,
      acspId: first.acspId,
      requestedBy: 'Eleanor Marsh',
      requestedAt: iso(at),
      reason: 'Supervisor file review',
      status: 'released',
      releasedBy: 'Marcus Adeyemi, Platform Administrator',
      releasedAt: iso(at + 2 * 3_600_000),
    })
    audit.push(
      {
        at: iso(at),
        actor: 'Eleanor Marsh',
        actorType: 'person',
        action: 'export.requested',
        caseId: first.id,
        detail:
          'EXP-2026-0029: export of the verification file requested. Reason: Supervisor file review. Waiting for a Platform Administrator to release it.',
      },
      {
        at: iso(at + 2 * 3_600_000),
        actor: 'Marcus Adeyemi, Platform Administrator',
        actorType: 'person',
        action: 'export.released',
        caseId: first.id,
        detail:
          'EXP-2026-0029: download released to the ACSP. The administrator did not open the evidence.',
      },
    )
  }
  if (second) {
    const at = now - 5 * 3_600_000
    requests.push({
      id: 'EXP-2026-0030',
      caseId: second.id,
      acspId: second.acspId,
      requestedBy: 'James Okoro',
      requestedAt: iso(at),
      reason: 'Client asked for a copy of its verification record',
      status: 'requested',
    })
    audit.push({
      at: iso(at),
      actor: 'James Okoro',
      actorType: 'person',
      action: 'export.requested',
      caseId: second.id,
      detail:
        'EXP-2026-0030: export of the verification file requested. Reason: Client asked for a copy of its verification record. Waiting for a Platform Administrator to release it.',
    })
  }
  return { requests, audit }
}
