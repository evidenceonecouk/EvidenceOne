import { sha256 } from '@/lib/sha256'
import type { AuditEvent, VerificationCase } from '@/types/domain'

/*
  Append-only, hash-chained audit trail, one chain per ACSP. Events for a case
  belong to the chain of the ACSP that held the case when the event happened.
  Platform events (rule publication, approvals, monitoring, onboarding) go in
  the 'platform' chain. The events of every chain sit in one list in time
  order; each event stores the chain it belongs to, its sequence number within
  that chain and the hash of the previous event in the same chain.
*/

export const GENESIS_HASH = '0'.repeat(64)
export const PLATFORM_CHAIN = 'platform'

export type AuditInput = Omit<AuditEvent, 'seq' | 'prevHash' | 'hash'>

type CaseLookup = Pick<VerificationCase, 'id' | 'acspId'>

/** The chain an event belongs to. Events saved before chains existed count as platform events. */
export const chainIdOf = (e: Pick<AuditEvent, 'acspId'>): string =>
  e.acspId ?? PLATFORM_CHAIN

/** Chain for a new event: explicit acspId, else the case's ACSP, else the platform chain. */
export function resolveChainId(
  input: Pick<AuditInput, 'acspId' | 'caseId'>,
  cases?: CaseLookup[],
): string {
  if (input.acspId) return input.acspId
  if (input.caseId && cases) {
    const found = cases.find((c) => c.id === input.caseId)
    if (found) return found.acspId
  }
  return PLATFORM_CHAIN
}

function payloadFor(
  e: Pick<
    AuditEvent,
    'seq' | 'at' | 'actor' | 'actorType' | 'action' | 'caseId' | 'detail'
  > &
    Pick<AuditEvent, 'acspId'>,
  prevHash: string,
): string {
  return JSON.stringify([
    e.seq,
    e.at,
    e.actor,
    e.actorType,
    e.action,
    e.caseId ?? '',
    e.detail,
    prevHash,
    // Events saved before chains existed carry no chain id and keep their original payload.
    ...(e.acspId ? [e.acspId] : []),
  ])
}

/** The latest event of one chain, or undefined for a new chain. */
export function chainHead(
  audit: AuditEvent[],
  chainId: string,
): AuditEvent | undefined {
  for (let i = audit.length - 1; i >= 0; i--) {
    if (chainIdOf(audit[i]) === chainId) return audit[i]
  }
  return undefined
}

/**
  Appends an event to its chain. Each hash covers the previous hash in the same
  chain, so editing any record breaks every later one. Pass the cases so an
  event with a caseId lands in the chain of that case's ACSP.
*/
export function appendAudit(
  chain: AuditEvent[],
  input: AuditInput,
  cases?: CaseLookup[],
): AuditEvent[] {
  const acspId = resolveChainId(input, cases)
  const prev = chainHead(chain, acspId)
  const seq = prev ? prev.seq + 1 : 1
  const prevHash = prev ? prev.hash : GENESIS_HASH
  const event = { ...input, acspId, seq }
  return [
    ...chain,
    { ...event, prevHash, hash: sha256(payloadFor(event, prevHash)) },
  ]
}

export function buildChain(
  inputs: AuditInput[],
  cases?: CaseLookup[],
): AuditEvent[] {
  const sorted = [...inputs].sort((a, b) => a.at.localeCompare(b.at))
  return sorted.reduce<AuditEvent[]>(
    (chain, input) => appendAudit(chain, input, cases),
    [],
  )
}

/** The events of one chain, in order. */
export const eventsInChain = (audit: AuditEvent[], chainId: string) =>
  audit.filter((e) => chainIdOf(e) === chainId)

/** Every chain present, platform first, then ACSPs in the order they first appear. */
export function chainIds(audit: AuditEvent[]): string[] {
  const ids = new Set<string>()
  for (const e of audit) ids.add(chainIdOf(e))
  const rest = [...ids].filter((id) => id !== PLATFORM_CHAIN)
  return ids.has(PLATFORM_CHAIN) ? [PLATFORM_CHAIN, ...rest] : rest
}

/** Verifies every chain. Pass a whole audit list, or the events of one chain. */
export function verifyChain(chain: AuditEvent[]): boolean {
  const prevHashes = new Map<string, string>()
  for (const e of chain) {
    const id = chainIdOf(e)
    const prevHash = prevHashes.get(id) ?? GENESIS_HASH
    if (e.prevHash !== prevHash || sha256(payloadFor(e, prevHash)) !== e.hash)
      return false
    prevHashes.set(id, e.hash)
  }
  return true
}

/** Result of verifying each chain on its own, keyed by chain id. */
export function verifyEachChain(audit: AuditEvent[]): Record<string, boolean> {
  return Object.fromEntries(
    chainIds(audit).map((id) => [id, verifyChain(eventsInChain(audit, id))]),
  )
}

/** A stable React key for an event: sequence numbers repeat across chains. */
export const auditEventKey = (e: AuditEvent) => `${chainIdOf(e)}#${e.seq}`
