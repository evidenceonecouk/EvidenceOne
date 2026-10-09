import type { MatchCriteria } from '@/lib/matching'
import type {
  CaseStatus,
  CheckResult,
  DemoData,
  IdDocumentType,
  PartnerCheckResult,
  PartnerStatus,
  ReferralPartner,
  RegisterRole,
  VerificationCase,
} from '@/types/domain'

/*
  What a Referral Partner sees. Status and check results only. Nothing here
  reads a document image, extracted document data, a provider payload,
  evidence or a case message, and no function returns one.

  This file does not import from selectors.ts, so selectors.ts can import it.
*/

const latestCaseFor = (data: DemoData, personId: string) =>
  data.cases
    .filter((c) => c.personId === personId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

/**
  The four statuses plus Declined. A person with no case, and an abandoned case,
  have no partner status: the person is shown as not invited.
*/
const partnerStatusByCase: Record<CaseStatus, PartnerStatus | null> = {
  invited: 'invited',
  in_progress: 'in_progress',
  in_review: 'in_progress',
  info_requested: 'further_information',
  approved: 'in_progress',
  submission_started: 'in_progress',
  submitted: 'completed',
  confirmed: 'completed',
  declined: 'declined',
  abandoned: null,
}

export function partnerStatusForCase(vc: VerificationCase | undefined) {
  return vc ? partnerStatusByCase[vc.status] : null
}

/** Invited, In progress, Further information required, Completed or Declined. Null when not invited. */
export function partnerStatusFor(
  data: DemoData,
  personId: string,
): PartnerStatus | null {
  return partnerStatusForCase(latestCaseFor(data, personId))
}

/** A Referral Partner outside the UK sees status only (P11, pending the client's DPIA). */
export const partnerSeesChecks = (partner: Pick<ReferralPartner, 'country'>) =>
  partner.country === 'United Kingdom'

export interface PartnerChecks {
  identityDocument: PartnerCheckResult
  livenessAndFaceMatch: PartnerCheckResult
  registerComparison: PartnerCheckResult
}

const fromCheck = (r: CheckResult | undefined): PartnerCheckResult => {
  if (r === 'pass') return 'passed'
  if (r === 'fail') return 'not_passed'
  if (r === 'refer') return 'flagged'
  return 'pending'
}

/** Worst result wins: not passed, then flagged, then pending, then passed. */
const combine = (results: PartnerCheckResult[]): PartnerCheckResult => {
  if (results.includes('not_passed')) return 'not_passed'
  if (results.includes('flagged')) return 'flagged'
  if (results.includes('pending')) return 'pending'
  return 'passed'
}

/**
  Result of each check as passed, flagged or not passed. The provider is not
  named and no detail is returned. A register difference is Flagged, never
  Not passed, because a difference is flagged for the ACSP reviewer to decide.
*/
export function partnerChecksFor(
  data: DemoData,
  vc: VerificationCase,
): PartnerChecks {
  void data
  const i = vc.idvt
  let register = fromCheck(i.registerComparison)
  if (register === 'not_passed') register = 'flagged'
  if (
    vc.discrepancyReport ||
    vc.observations.some((o) => o.severity === 'mismatch')
  )
    register = 'flagged'
  else if (register === 'pending' && i.completedAt) register = 'passed'
  return {
    identityDocument: fromCheck(i.documentAuthenticity),
    livenessAndFaceMatch: combine([
      fromCheck(i.liveness),
      fromCheck(i.faceMatch),
    ]),
    registerComparison: register,
  }
}

export const partnerCheckLabels: Record<keyof PartnerChecks, string> = {
  identityDocument: 'Identity document',
  livenessAndFaceMatch: 'Liveness and face match',
  registerComparison: 'Register comparison',
}

export const hasFlaggedCheck = (c: PartnerChecks) =>
  Object.values(c).includes('flagged') ||
  Object.values(c).includes('not_passed')

/* Flags on a person: status-level only. */
export type PartnerFlag =
  'unverified' | 'invite_expired' | 'reverification_due' | 'register_verified'

export const partnerFlagLabels: Record<PartnerFlag, string> = {
  unverified: 'Unverified',
  invite_expired: 'Invite expired',
  reverification_due: 'Reverification due',
  register_verified: 'Register shows verified',
}

export function partnerFlagsFor(
  data: DemoData,
  personId: string,
  companyNumber: string,
): PartnerFlag[] {
  const person = data.people.find((p) => p.id === personId)
  const entry = data.register.find(
    (r) => r.personId === personId && r.companyNumber === companyNumber,
  )
  const latest = latestCaseFor(data, personId)
  const status = partnerStatusForCase(latest)
  const flags: PartnerFlag[] = []
  const invite = latest && data.invites.find((i) => i.caseId === latest.id)
  if (status !== 'completed' && !entry?.identityVerified)
    flags.push('unverified')
  if (invite?.status === 'expired' || latest?.status === 'abandoned')
    flags.push('invite_expired')
  if (status === 'completed' && person?.reverificationDue)
    flags.push('reverification_due')
  if (entry?.identityVerified && status !== 'completed')
    flags.push('register_verified')
  return flags
}

/* Matching criteria for an invite, derived from the register and the person's details. */

const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  British: 'United Kingdom',
  Irish: 'Ireland',
  Ukrainian: 'Ukraine',
  Swedish: 'Sweden',
  German: 'Germany',
  Emirati: 'United Arab Emirates',
}

export function criteriaForPerson(
  data: DemoData,
  personId: string,
  companyNumber: string,
  overrides: Partial<
    Pick<
      MatchCriteria,
      'languages' | 'maxTurnaroundHours' | 'needsCapacityToday'
    >
  > = {},
): MatchCriteria {
  const person = data.people.find((p) => p.id === personId)
  const entry = data.register.find(
    (r) => r.personId === personId && r.companyNumber === companyNumber,
  )
  const current =
    person?.addressHistory.find((a) => !a.to) ?? person?.addressHistory[0]
  const documentType: IdDocumentType = person?.document?.type ?? 'passport'
  const issuing =
    person?.document?.issuingCountry ??
    NATIONALITY_TO_COUNTRY[person?.nationality ?? ''] ??
    'United Kingdom'
  const role: RegisterRole = entry?.role ?? 'director'
  return {
    residenceCountry: current?.address.country ?? 'United Kingdom',
    documentType,
    issuingCountry: issuing,
    role,
    languages: overrides.languages?.length ? overrides.languages : ['English'],
    higherRisk: false,
    maxTurnaroundHours: overrides.maxTurnaroundHours,
    needsCapacityToday: overrides.needsCapacityToday ?? true,
  }
}

export const documentTypeLabel: Record<IdDocumentType, string> = {
  passport: 'passport',
  driving_licence: 'UK photocard driving licence',
  national_identity_card: 'national identity card',
  biometric_residence_permit: 'biometric residence permit',
}

/** Roles in a Referral Partner organisation, and what each may do. */
export const partnerRoleLabel = {
  partner_admin: 'Partner Administrator',
  referrer: 'Referrer',
  portfolio_viewer: 'Portfolio Viewer',
} as const

export const partnerRoleCan = {
  partner_admin: { invite: true, connect: true, manageTeam: true },
  referrer: { invite: true, connect: true, manageTeam: false },
  portfolio_viewer: { invite: false, connect: false, manageTeam: false },
} as const
