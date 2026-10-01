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
