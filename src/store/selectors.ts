import type { CaseStatus, DemoData, PersonStatus, VerificationCase } from '@/types/domain'

export const getPerson = (data: DemoData, id: string) => data.people.find((p) => p.id === id)
export const getCompany = (data: DemoData, number: string) => data.companies.find((c) => c.number === number)
export const getCase = (data: DemoData, id: string) => data.cases.find((c) => c.id === id)
export const getAcsp = (data: DemoData, id: string) => data.acsps.find((a) => a.id === id)
export const getAgent = (data: DemoData, id: string) => data.agents.find((a) => a.id === id)
export const getEntry = (data: DemoData, vc: VerificationCase) => data.register.find((r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber)

/** Submitted to Companies House, whether or not the verification reference is recorded yet. */
export const isSubmitted = (s: CaseStatus) => s === 'submitted' || s === 'confirmed'
/** Approved, and anywhere in the submission workflow. */
export const isApprovedOrLater = (s: CaseStatus) => s === 'approved' || s === 'submission_started' || isSubmitted(s)

export function casesForPerson(data: DemoData, personId: string): VerificationCase[] {
  return data.cases.filter((c) => c.personId === personId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const statusMap: Record<CaseStatus, PersonStatus> = {
  invited: 'not_started',
  in_progress: 'in_progress',
  info_requested: 'awaiting_info',
  in_review: 'with_acsp',
  halted_register_mismatch: 'with_acsp',
  approved: 'with_acsp',
  submission_started: 'with_acsp',
  submitted: 'verified',
  confirmed: 'verified',
  declined: 'not_completed',
  abandoned: 'not_completed',
}

/** Derives the status shown to Agents. Agents see status only, never documents or evidence. */
export function personStatus(data: DemoData, personId: string): PersonStatus {
  const person = getPerson(data, personId)
  const latest = casesForPerson(data, personId)[0]
  if (!latest) return 'not_started'
  const s = statusMap[latest.status]
  return s === 'verified' && person?.reverificationDue ? 'reverification_due' : s
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
  /** REG-04: the register already shows this person as verified. */
  registerVerified: boolean
}

/* Status detail only. Nothing here reveals a document, a check result or evidence. */
const caseDetail: Record<CaseStatus, string> = {
  invited: 'Invite sent, not yet started',
  in_progress: 'Completing the app journey',
  in_review: 'With the ACSP for review',
  info_requested: 'The ACSP has asked the individual for information',
  halted_register_mismatch: 'Paused until the register is corrected (Route B)',
  approved: 'Approved, awaiting submission to Companies House',
  submission_started: 'Being submitted to Companies House',
  submitted: 'Submitted to Companies House',
  confirmed: 'Verified. Companies House emails the personal code to the individual',
  declined: 'Not completed',
  abandoned: 'Not completed',
}

export function peopleForCompany(data: DemoData, companyNumber: string): PersonRow[] {
  return data.register
    .filter((r) => r.companyNumber === companyNumber)
    .map((r) => {
      const person = getPerson(data, r.personId)!
      const latestCase = casesForPerson(data, r.personId)[0]
      const status = personStatus(data, r.personId)
      const invite = latestCase && data.invites.find((i) => i.caseId === latestCase.id)
      let detail = r.identityVerified ? 'The register already shows this identity as verified' : 'Not yet invited'
      if (status === 'reverification_due') detail = person.reverificationNote ?? 'Reverification due'
      else if (latestCase?.status === 'abandoned' && invite?.status === 'expired') detail = 'Invite expired before completion'
      else if (latestCase?.status === 'invited' && invite?.status === 'opened') detail = 'Invite opened in the app'
      else if (latestCase) detail = caseDetail[latestCase.status]
      return {
        personId: r.personId,
        name: `${person.givenNames} ${person.familyName}`,
        role: r.role,
        appointedOn: r.appointedOn,
        status,
        latestCase,
        detail,
        invitable: !latestCase || status === 'not_completed' || status === 'reverification_due',
        registerVerified: !!r.identityVerified,
      }
    })
}

export interface AttentionItem {
  id: string
  status: PersonStatus | 'register_verified'
  personName: string
  companyName: string
  title: string
}

/** Follow-ups for an Agent, from status alone. */
export function attentionForAgent(data: DemoData, agentId: string): AttentionItem[] {
  const items: AttentionItem[] = []
  for (const company of companiesForAgent(data, agentId)) {
    for (const row of peopleForCompany(data, company.number)) {
      const base = { personName: row.name, companyName: company.name }
      if (row.registerVerified && !row.latestCase) items.push({ ...base, id: `v-${row.personId}`, status: 'register_verified', title: 'Register already shows identity verified' })
      else if (row.status === 'not_started' && !row.latestCase) items.push({ ...base, id: `u-${row.personId}`, status: 'not_started', title: 'Not yet invited' })
      if (row.status === 'not_completed') items.push({ ...base, id: `n-${row.personId}`, status: 'not_completed', title: 'Verification not completed' })
      if (row.status === 'awaiting_info') items.push({ ...base, id: `a-${row.personId}`, status: 'awaiting_info', title: 'Awaiting information from the individual' })
      if (row.status === 'reverification_due') items.push({ ...base, id: `r-${row.personId}`, status: 'reverification_due', title: 'Reverification due' })
    }
  }
  return items
}
