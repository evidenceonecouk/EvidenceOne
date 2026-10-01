import { buildChain, type AuditInput } from '@/lib/audit'
import type { DemoData } from '@/types/domain'
import { buildCases } from './cases'
import { companies, register } from './companies'
import { acsps, agents } from './organisations'
import { people } from './people'

/** Builds a fresh copy of the demo data anchored to `now`. */
export function createSeed(now = Date.now()): DemoData {
  const { cases, corrections, invites, audit } = buildCases(now)

  const connections: AuditInput[] = companies
    .filter((c) => c.connectedAt && c.lodgedByAgentId)
    .map((c) => ({
      at: c.connectedAt!,
      actor: agents.find((a) => a.id === c.lodgedByAgentId)?.contactName ?? 'Agent',
      actorType: 'person' as const,
      action: 'company.connected',
      detail: `${c.name} (${c.number}) connected to the portal from the Companies House register.`,
    }))

  return structuredClone({
    acsps,
    agents,
    companies,
    people,
    register,
    cases,
    corrections,
    invites,
    audit: buildChain([...connections, ...audit]),
  })
}
