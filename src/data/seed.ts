import { buildChain, type AuditInput } from '@/lib/audit'
import { versionAt } from '@/lib/rules'
import type { DemoData } from '@/types/domain'
import { seedApplications } from './applications'
import { seedApprovals } from './approvals'
import { seedBilling } from './billing'
import { seedBulkRequests } from './bulkRequests'
import { buildCases } from './cases'
import { seedExportRequests } from './exportRequests'
import { companies, register } from './companies'
import { seedComplaints } from './complaints'
import { seedMonitoring } from './monitoring'
import { acsps, partners } from './organisations'
import { buildPeople } from './people'
import { RULE_SET_NAME, SECOND_APPROVER, seedRuleSets } from './rules'

/** Builds a fresh copy of the demo data anchored to `now`. */
export function createSeed(now = Date.now()): DemoData {
  const { cases, corrections, invites, audit } = buildCases(now)
  const people = buildPeople(now)
  const ruleSets = seedRuleSets()
  const applications = seedApplications(now)
  const approvals = seedApprovals(now)
  const monitoring = seedMonitoring()
  const bulkRequests = seedBulkRequests(now)
  const complaints = seedComplaints(cases, people, now)
  const exports = seedExportRequests(cases, now)

  // Platform events: they belong to the 'platform' chain, never to an ACSP chain.
  const platform = (e: Omit<AuditInput, 'acspId'>): AuditInput => ({
    ...e,
    acspId: 'platform',
  })

  const connections: AuditInput[] = companies
    .filter((c) => c.connectedAt && c.lodgedByPartnerId)
    .map((c) =>
      platform({
        at: c.connectedAt!,
        actor:
          partners.find((a) => a.id === c.lodgedByPartnerId)?.contactName ??
          'Referral Partner',
        actorType: 'person',
        action: 'company.connected',
        detail: `${c.name} (${c.number}) connected to the portal from the Companies House register.`,
      }),
    )

  const publications: AuditInput[] = ruleSets.map((v) =>
    platform({
      at: v.publishedAt!,
      actor: SECOND_APPROVER,
      actorType: 'person',
      action: 'ruleset.published',
      detail: `${RULE_SET_NAME} version ${v.version} published, effective ${v.effectiveFrom!.slice(0, 10)}. Proposed by ${v.submittedBy}, approved by ${v.approvedBy}.`,
    }),
  )

  const onboarding: AuditInput[] = applications.map((a) =>
    platform({
      at: a.submittedAt,
      actor: a.name,
      actorType: 'person',
      action:
        a.kind === 'acsp'
          ? 'onboarding.acsp_submitted'
          : 'onboarding.partner_submitted',
      detail: `${a.name} submitted an application to join as ${a.kind === 'acsp' ? 'an ACSP' : 'a Referral Partner'}. Reference ${a.id}. Pending platform approval.`,
    }),
  )

  const approvalEvents: AuditInput[] = approvals.map((a) =>
    platform({
      at: a.proposedAt,
      actor: a.proposedBy,
      actorType: 'person',
      action: 'approval.proposed',
      detail: `${a.summary} Waiting for a second Super Administrator. Nobody approves their own proposal.`,
    }),
  )

  const monitoringEvents: AuditInput[] = [
    platform({
      at: '2025-10-06T10:20:00.000Z',
      actor: 'Marcus Adeyemi, Platform Administrator',
      actorType: 'person',
      action: 'monitoring.yearly_upload',
      detail:
        'Yearly list uploaded (ch-acsp-opt-in-list-2025-10.csv, 1,840 rows). Every platform ACSP matched and confirmed by an administrator.',
    }),
    platform({
      at: '2026-10-05T07:30:00.000Z',
      actor: SYSTEM_ACTOR,
      actorType: 'system',
      action: 'monitoring.check_run',
      detail:
        'Both published Companies House files checked (opt-in list of ACSPs, ceased and suspended list). Two name matches raised for an administrator to confirm.',
    }),
    platform({
      at: '2026-10-05T09:12:00.000Z',
      actor: 'Marcus Adeyemi, Platform Administrator',
      actorType: 'person',
      action: 'monitoring.name_match.confirmed',
      detail:
        'Name match confirmed: Northbank Compliance Ltd is on the ceased and suspended list. Status set to Suspended.',
    }),
    platform({
      at: '2026-10-05T09:14:00.000Z',
      actor: SYSTEM_ACTOR,
      actorType: 'system',
      action: 'acsp.status_changed',
      detail:
        'Northbank Compliance Ltd: Active to Suspended. New allocation paused (ACSP-10, ACSP-11, MATCH-01). Cases it verified flagged for follow-up (ACSP-12). Open cases offered to another ACSP with the individual’s agreement (ACSP-13).',
    }),
  ]

  // Bulk / Bespoke Requests are platform events: submitted, messages, conversion.
  const bulkEvents: AuditInput[] = bulkRequests.flatMap((b) => [
    platform({
      at: b.submittedAt,
      actor: b.submittedBy,
      actorType: 'person',
      action: 'bulk_request.submitted',
      detail: `Bulk / Bespoke Request ${b.id} submitted. It goes to the Platform Administrator first.`,
    }),
    ...b.messages.map((m) =>
      platform({
        at: m.at,
        actor: m.authorName,
        actorType: 'person',
        action: 'bulk_request.message',
        detail: `Message on Bulk / Bespoke Request ${b.id}.`,
      }),
    ),
    ...(b.convertedAt
      ? [
          platform({
            at: b.convertedAt,
            actor: b.convertedBy ?? 'Platform Administrator',
            actorType: 'person',
            action: 'bulk_request.converted',
            detail: `Bulk / Bespoke Request ${b.id} converted into linked cases: ${b.caseIds.join(', ')}${b.additionalServices.length ? `, plus ${b.additionalServices.length} additional Companies House service placeholder` : ''}${b.corporateRequested ? ', and a corporate verification to be added later' : ''}.`,
          }),
        ]
      : []),
  ])

  const data: DemoData = {
    acsps,
    partners,
    companies,
    people,
    register,
    cases,
    corrections,
    invites,
    ruleSets,
    billing: seedBilling(cases, acsps, { now, people }),
    approvals,
    referralRecords: [],
    applications,
    monitoring,
    bulkRequests,
    complaints: complaints.complaints,
    exportRequests: exports.requests,
    audit: buildChain(
      [
        ...publications,
        ...connections,
        ...onboarding,
        ...approvalEvents,
        ...monitoringEvents,
        ...bulkEvents,
        ...audit,
        ...complaints.audit,
        ...exports.audit,
      ],
      cases,
    ),
  }
  // Each decided case records the rule set version in force at its decision.
  data.cases = data.cases.map((c) =>
    c.decision && c.decision.outcome !== 'request_info'
      ? { ...c, ruleSetVersion: versionAt(data, c.decision.decidedAt).version }
      : c,
  )
  return structuredClone(data)
}

const SYSTEM_ACTOR = 'Evidence One'
