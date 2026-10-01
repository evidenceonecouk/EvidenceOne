import type { CaseStatus, DemoData, PersonStatus, VerificationCase } from '@/types/domain'

const ACTIVE: CaseStatus[] = ['invited', 'in_progress', 'in_review', 'info_requested', 'halted_register_mismatch', 'approved']

export const getPerson = (data: DemoData, id: string) => data.people.find((p) => p.id === id)
export const getCompany = (data: DemoData, number: string) => data.companies.find((c) => c.number === number)
export const getCase = (data: DemoData, id: string) => data.cases.find((c) => c.id === id)
export const getAcsp = (data: DemoData, id: string) => data.acsps.find((a) => a.id === id)
export const getAgent = (data: DemoData, id: string) => data.agents.find((a) => a.id === id)

export function casesForPerson(data: DemoData, personId: string): VerificationCase[] {
  return data.cases.filter((c) => c.personId === personId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Derives the status chip shown to Agents for a director or PSC. */
export function personStatus(data: DemoData, personId: string): PersonStatus {
  const person = getPerson(data, personId)
  const latest = casesForPerson(data, personId)[0]
  if (!latest) return 'not_started'
  if (ACTIVE.includes(latest.status)) return 'in_progress'
  if (latest.status === 'submitted') return person?.reverificationDue ? 'reverification_due' : 'verified'
  if (latest.status === 'abandoned') return 'expired'
  return 'not_started'
}

export function auditForCase(data: DemoData, caseId: string) {
  return data.audit.filter((e) => e.caseId === caseId)
}

export const roleLabel = { director: 'Director', psc: 'Person with significant control', director_psc: 'Director and PSC' } as const

export function companiesForAgent(data: DemoData, agentId: string) {
  return data.companies.filter((c) => c.lodgedByAgentId === agentId)
}

/** Name of whoever reviews a case: an ACSP firm, or an Agent reviewing in-house. */
export function reviewerOrgName(data: DemoData, orgId: string): string | undefined {
  return getAcsp(data, orgId)?.name ?? getAgent(data, orgId)?.name
}

export interface PersonRow {
  personId: string
  name: string
  role: keyof typeof roleLabel
  appointedOn: string
  status: PersonStatus
  latestCase?: VerificationCase
  detail: string
  invitable: boolean
}

const caseDetail: Partial<Record<CaseStatus, string>> = {
  invited: 'Invite sent, not yet started',
  in_progress: 'Completing the app journey',
  in_review: 'Awaiting ACSP review',
  info_requested: 'More information requested by the ACSP',
  halted_register_mismatch: 'Paused: name does not match the register',
  approved: 'Approved, awaiting submission',
}

export function peopleForCompany(data: DemoData, companyNumber: string): PersonRow[] {
  return data.register
    .filter((r) => r.companyNumber === companyNumber)
    .map((r) => {
      const person = getPerson(data, r.personId)!
      const latestCase = casesForPerson(data, r.personId)[0]
      const status = personStatus(data, r.personId)
      const invite = latestCase && data.invites.find((i) => i.caseId === latestCase.id)
      let detail = 'Not yet invited'
      if (status === 'reverification_due') detail = person.reverificationNote ?? 'Reverification due'
      else if (latestCase?.status === 'submitted') detail = 'Verified · personal code issued'
      else if (latestCase?.status === 'abandoned') detail = 'Invite expired before completion'
      else if (latestCase?.status === 'invited' && invite?.status === 'opened') detail = 'Invite opened in the app'
      else if (latestCase) detail = caseDetail[latestCase.status] ?? detail
      return {
        personId: r.personId,
        name: `${person.givenNames} ${person.familyName}`,
        role: r.role,
        appointedOn: r.appointedOn,
        status,
        latestCase,
        detail,
        invitable: status === 'not_started' || status === 'expired' || status === 'reverification_due',
      }
    })
}

export interface AiFlag {
  id: string
  kind: 'observation' | 'unverified' | 'expired' | 'reverification'
  personName: string
  companyName: string
  title: string
  caseId?: string
}

/** Advisory flags across an Agent's companies: unverified, expired, reverification due, and AI observations on open cases. */
export function aiFlagsForAgent(data: DemoData, agentId: string): AiFlag[] {
  const flags: AiFlag[] = []
  for (const company of companiesForAgent(data, agentId)) {
    for (const row of peopleForCompany(data, company.number)) {
      if (row.status === 'not_started') flags.push({ id: `u-${row.personId}`, kind: 'unverified', personName: row.name, companyName: company.name, title: 'Not yet verified' })
      if (row.status === 'expired') flags.push({ id: `e-${row.personId}`, kind: 'expired', personName: row.name, companyName: company.name, title: 'Previous invite expired' })
      if (row.status === 'reverification_due') flags.push({ id: `r-${row.personId}`, kind: 'reverification', personName: row.name, companyName: company.name, title: 'Reverification due' })
      const c = row.latestCase
      if (c && row.status === 'in_progress') {
        for (const o of c.observations.filter((o) => o.severity !== 'info')) {
          flags.push({ id: o.id, kind: 'observation', personName: row.name, companyName: company.name, title: o.title, caseId: c.id })
        }
      }
    }
  }
  return flags
}
