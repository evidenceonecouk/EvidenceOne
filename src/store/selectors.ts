import type {
  CaseStatus,
  DemoData,
  PartnerStatus,
  PersonStatus,
  ReferralPartner,
  VerificationCase,
} from '@/types/domain'
import {
  hasFlaggedCheck,
  partnerChecksFor,
  partnerFlagsFor,
  partnerSeesChecks,
  partnerStatusForCase,
  type PartnerChecks,
  type PartnerFlag,
} from './partnerSelectors'

export const getPerson = (data: DemoData, id: string) =>
  data.people.find((p) => p.id === id)
export const getCompany = (data: DemoData, number: string) =>
  data.companies.find((c) => c.number === number)
export const getCase = (data: DemoData, id: string) =>
  data.cases.find((c) => c.id === id)
export const getAcsp = (data: DemoData, id: string) =>
  data.acsps.find((a) => a.id === id)
export const getPartner = (data: DemoData, id: string) =>
  data.partners.find((a) => a.id === id)
export const getEntry = (data: DemoData, vc: VerificationCase) =>
  data.register.find(
    (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
  )

/** Submitted to Companies House, whether or not the verification reference is recorded yet. */
export const isSubmitted = (s: CaseStatus) =>
  s === 'submitted' || s === 'confirmed'
/** Approved, and anywhere in the submission workflow. */
export const isApprovedOrLater = (s: CaseStatus) =>
  s === 'approved' || s === 'submission_started' || isSubmitted(s)

export function casesForPerson(
  data: DemoData,
  personId: string,
): VerificationCase[] {
  return data.cases
    .filter((c) => c.personId === personId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const statusMap: Record<CaseStatus, PersonStatus> = {
  invited: 'not_started',
  in_progress: 'in_progress',
  info_requested: 'awaiting_info',
  in_review: 'with_acsp',
  approved: 'with_acsp',
  submission_started: 'with_acsp',
  submitted: 'verified',
  confirmed: 'verified',
  declined: 'not_completed',
  abandoned: 'not_completed',
}

/** Internal status of a person. A Referral Partner sees partnerStatus and check results only, never documents or evidence. */
export function personStatus(data: DemoData, personId: string): PersonStatus {
  const person = getPerson(data, personId)
  const latest = casesForPerson(data, personId)[0]
  if (!latest) return 'not_started'
  const s = statusMap[latest.status]
  return s === 'verified' && person?.reverificationDue
    ? 'reverification_due'
    : s
}

export function auditForCase(data: DemoData, caseId: string) {
  return data.audit.filter((e) => e.caseId === caseId)
}

export const roleLabel = {
  director: 'Director',
  psc: 'Person with significant control',
  director_psc: 'Director and PSC',
} as const

export function companiesForPartner(data: DemoData, partnerId: string) {
  return data.companies.filter((c) => c.lodgedByPartnerId === partnerId)
}

/** Name of whoever holds a case: the ACSP firm that verifies it. */
export function reviewerOrgName(
  data: DemoData,
  orgId: string,
): string | undefined {
  return getAcsp(data, orgId)?.name ?? getPartner(data, orgId)?.name
}

export interface PersonRow {
  personId: string
  name: string
  role: keyof typeof roleLabel
  appointedOn: string
  status: PersonStatus
  /** The status a Referral Partner sees. Null when the person has not been invited. */
  partnerStatus: PartnerStatus | null
  flags: PartnerFlag[]
  /** Check results as passed, flagged or not passed. Never a document or evidence. */
  checks?: PartnerChecks
  latestCase?: VerificationCase
  detail: string
  invitable: boolean
  /** REG-04: the register already shows this person as verified. */
  registerVerified: boolean
}

/* Status detail only. Nothing here reveals a document, extracted data, evidence or a message. */
const caseDetail: Record<CaseStatus, string> = {
  invited: 'Invite sent, not yet started',
  in_progress: 'Completing the journey in the browser',
  in_review: 'With the ACSP',
  info_requested: 'The ACSP has asked the individual for further information',
  approved: 'With the ACSP, being prepared for submission',
  submission_started: 'With the ACSP, being submitted to Companies House',
  submitted: 'Submitted to Companies House by the ACSP',
  confirmed: 'Completed. Companies House has confirmed the verification',
  declined: 'Declined by the ACSP',
  abandoned: 'The invite lapsed before the journey was completed',
}

export function peopleForCompany(
  data: DemoData,
  companyNumber: string,
  partner?: Pick<ReferralPartner, 'country'>,
): PersonRow[] {
  const showChecks = !partner || partnerSeesChecks(partner)
  return data.register
    .filter((r) => r.companyNumber === companyNumber)
    .map((r) => {
      const person = getPerson(data, r.personId)!
      const latestCase = casesForPerson(data, r.personId)[0]
      const status = personStatus(data, r.personId)
      const invite =
        latestCase && data.invites.find((i) => i.caseId === latestCase.id)
      let detail = r.identityVerified
        ? 'The register already shows this identity as verified'
        : 'Not yet invited'
      if (status === 'reverification_due')
        detail = person.reverificationNote ?? 'Reverification due'
      else if (
        latestCase?.status === 'abandoned' &&
        invite?.status === 'expired'
      )
        detail = 'Invite expired before completion'
      else if (latestCase?.status === 'invited' && invite?.status === 'opened')
        detail = 'Invite opened in the browser'
      else if (latestCase) detail = caseDetail[latestCase.status]
      return {
        personId: r.personId,
        name: `${person.givenNames} ${person.familyName}`,
        role: r.role,
        appointedOn: r.appointedOn,
        status,
        partnerStatus: partnerStatusForCase(latestCase),
        flags: partnerFlagsFor(data, r.personId, companyNumber),
        checks:
          showChecks && latestCase
            ? partnerChecksFor(data, latestCase)
            : undefined,
        latestCase,
        detail,
        invitable:
          !latestCase ||
          status === 'not_completed' ||
          status === 'reverification_due',
        registerVerified: !!r.identityVerified,
      }
    })
}

export interface AttentionItem {
  id: string
  kind:
    | 'register_verified'
    | 'not_invited'
    | 'further_information'
    | 'declined'
    | 'invite_expired'
    | 'reverification_due'
    | 'check_flagged'
  personName: string
  companyName: string
  title: string
}

/** Follow-ups for a Referral Partner, from status and check results alone. */
export function attentionForPartner(
  data: DemoData,
  partnerId: string,
): AttentionItem[] {
  const partner = getPartner(data, partnerId)
  const items: AttentionItem[] = []
  for (const company of companiesForPartner(data, partnerId)) {
    for (const row of peopleForCompany(data, company.number, partner)) {
      const base = { personName: row.name, companyName: company.name }
      const add = (kind: AttentionItem['kind'], title: string) =>
        items.push({ ...base, id: `${kind}-${row.personId}`, kind, title })
      if (row.registerVerified && !row.latestCase)
        add('register_verified', 'Register already shows identity verified')
      else if (!row.latestCase) add('not_invited', 'Not yet invited')
      if (row.partnerStatus === 'further_information')
        add('further_information', 'Further information required')
      if (row.partnerStatus === 'declined')
        add('declined', 'Declined by the ACSP')
      if (row.flags.includes('invite_expired'))
        add('invite_expired', 'Invite expired before completion')
      if (row.flags.includes('reverification_due'))
        add('reverification_due', 'Reverification due')
      if (row.checks && hasFlaggedCheck(row.checks))
        add('check_flagged', 'A check is flagged. The ACSP will decide.')
    }
  }
  return items
}
