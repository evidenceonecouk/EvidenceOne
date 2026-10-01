import { sha256 } from '@/lib/sha256'
import type { AuditEvent } from '@/types/domain'

export const GENESIS_HASH = '0'.repeat(64)

export type AuditInput = Omit<AuditEvent, 'seq' | 'prevHash' | 'hash'>

/** Appends an event to the chain. Each hash covers the previous hash, so editing any record breaks every later one. */
export function appendAudit(chain: AuditEvent[], input: AuditInput): AuditEvent[] {
  const prev = chain[chain.length - 1]
  const seq = prev ? prev.seq + 1 : 1
  const prevHash = prev ? prev.hash : GENESIS_HASH
  const payload = JSON.stringify([seq, input.at, input.actor, input.actorType, input.action, input.caseId ?? '', input.detail, prevHash])
  return [...chain, { ...input, seq, prevHash, hash: sha256(payload) }]
}

export function buildChain(inputs: AuditInput[]): AuditEvent[] {
  const sorted = [...inputs].sort((a, b) => a.at.localeCompare(b.at))
  return sorted.reduce<AuditEvent[]>((chain, input) => appendAudit(chain, input), [])
}

export function verifyChain(chain: AuditEvent[]): boolean {
  let prevHash = GENESIS_HASH
  for (const e of chain) {
    const payload = JSON.stringify([e.seq, e.at, e.actor, e.actorType, e.action, e.caseId ?? '', e.detail, prevHash])
    if (e.prevHash !== prevHash || sha256(payload) !== e.hash) return false
    prevHash = e.hash
  }
  return true
}
