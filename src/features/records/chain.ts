import { verifyChain } from '@/lib/audit'
import type { AuditEvent } from '@/types/domain'

/*
  The audit trail is one hash chain per ACSP. Events carry the ACSP they belong
  to; where an event has none (older data) the whole chain is used.
*/
type WithAcsp = AuditEvent & { acspId?: string }

export function acspChain(audit: AuditEvent[], acspId: string): AuditEvent[] {
  const any = (audit as WithAcsp[]).some((e) => e.acspId)
  return any ? (audit as WithAcsp[]).filter((e) => e.acspId === acspId) : audit
}

export const chainIntact = (audit: AuditEvent[], acspId: string) =>
  verifyChain(acspChain(audit, acspId))
