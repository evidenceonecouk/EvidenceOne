import { buildChain, type AuditInput } from '@/lib/audit'
import { versionAt } from '@/lib/rules'
import type { DemoData } from '@/types/domain'
import { buildCases } from './cases'
import { companies, register } from './companies'
import { acsps, agents } from './organisations'
import { people } from './people'
import { RULE_SET_NAME, SECOND_APPROVER, seedRuleSets } from './rules'

/** Builds a fresh copy of the demo data anchored to `now`. */
export function createSeed(now = Date.now()): DemoData {
  const { cases, corrections, invites, audit } = buildCases(now)
  const ruleSets = seedRuleSets()

  const connections: AuditInput[] = companies
    .filter((c) => c.connectedAt && c.lodgedByAgentId)
    .map((c) => ({
      at: c.connectedAt!,
      actor:
        agents.find((a) => a.id === c.lodgedByAgentId)?.contactName ?? 'Agent',
      actorType: 'person' as const,
      action: 'company.connected',
      detail: `${c.name} (${c.number}) connected to the portal from the Companies House register.`,
    }))

  const publications: AuditInput[] = ruleSets.map((v) => ({
    at: v.publishedAt!,
    actor: SECOND_APPROVER,
    actorType: 'person' as const,
    action: 'ruleset.published',
    detail: `${RULE_SET_NAME} version ${v.version} published, effective ${v.effectiveFrom!.slice(0, 10)}. Proposed by ${v.submittedBy}, approved by ${v.approvedBy}.`,
  }))

  const data: DemoData = {
    acsps,
    agents,
    companies,
    people,
    register,
    cases,
    corrections,
    invites,
    ruleSets,
    audit: buildChain([...publications, ...connections, ...audit]),
  }
  // Each decided case records the rule set version in force at its decision.
  data.cases = data.cases.map((c) =>
    c.decision && c.decision.outcome !== 'request_info'
      ? { ...c, ruleSetVersion: versionAt(data, c.decision.decidedAt).version }
      : c,
  )
  return structuredClone(data)
}
