import { normaliseName, sameName } from '@/lib/acspList'
import type { AuditInput } from '@/lib/audit'
import { fullName } from '@/lib/format'
import { suggestAcsps, type MatchCriteria } from '@/lib/matching'
import type {
  AcspFirm,
  AcspStatus,
  DemoData,
  LanguageCode,
  NameMatch,
  OnboardingApplication,
  ReferralPartner,
  VerificationCase,
  YearlyUpload,
} from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Platform Administrator actions: approving ACSPs and Referral Partners,
  confirming B2C allocation, ACSP status monitoring, the yearly list upload and
  the individual's answer when an open case is offered to another ACSP.
  Every action is recorded in the audit trail on the platform chain. A
  Platform Administrator cannot approve a case, read identity evidence or alter
  an audit record.
*/

export const PLATFORM_ADMIN = 'Marcus Adeyemi, Platform Administrator'

const DAY = 86_400_000
const nowIso = () => new Date().toISOString()

/* Published files: there is no API, so names are compared after normalisation. */

export interface PublishedLists {
  /** Names on the Companies House opt-in list of ACSPs. */
  optIn: string[]
  /** Names on the ceased and suspended list, published fortnightly. */
  ceasedSuspended: string[]
}

/** The simulated published files at the start: every active platform ACSP is on the opt-in list. */
export function defaultPublishedLists(data: DemoData): PublishedLists {
  return {
    optIn: data.acsps
      .filter((a) => a.status === 'active')
      .map((a) => a.name.replace(/,/g, '').toUpperCase()),
    ceasedSuspended: data.acsps
      .filter((a) => a.status === 'suspended' || a.status === 'ceased')
      .map((a) => a.name.replace(/,/g, '').toUpperCase()),
  }
}

const onList = (list: string[], name: string) =>
  list.find((n) => sameName(n, name))

/** An ACSP counts as listed when a name match against the opt-in list or the yearly upload exists. */
export function isOnPublishedList(data: DemoData, name: string): boolean {
  return data.monitoring.nameMatches.some(
    (m) =>
      m.status !== 'not_found' &&
      m.source !== 'ceased_suspended_list' &&
      sameName(m.listedName, name),
  )
}

/** Status a newly approved ACSP is given: Active when on the published list, otherwise Not yet listed. */
export const statusOnApproval = (data: DemoData, name: string): AcspStatus =>
  isOnPublishedList(data, name) ? 'active' : 'not_yet_listed'

/** Allocation is Open only for an Active or Not yet listed ACSP whose reconfirmation is not overdue (ACSP-10, ACSP-11, MATCH-01). */
export function allocationState(
  acsp: AcspFirm,
  now = Date.now(),
): { open: boolean; reason: string } {
  if (acsp.status === 'pending_approval')
    return { open: false, reason: 'Pending approval' }
  if (acsp.status === 'suspended' || acsp.status === 'ceased')
    return {
      open: false,
      reason: `${acsp.status === 'suspended' ? 'Suspended' : 'Ceased'}, new allocation paused (ACSP-10, MATCH-01)`,
    }
  if (acsp.status === 'withdrawn')
    return { open: false, reason: 'Withdrawn from the platform' }
  if (new Date(acsp.monitoring.nextReconfirmationDue).getTime() < now)
    return {
      open: false,
      reason: 'Reconfirmation overdue, new allocation paused (ACSP-11)',
    }
  if (!acsp.profile.acceptingNewCases)
    return { open: false, reason: 'Not accepting new cases' }
  return {
    open: true,
    reason:
      acsp.status === 'not_yet_listed'
        ? 'Open while it registers (Time to register: to be set)'
        : 'Open',
  }
}

/* Applications */

function norm(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Finds an answer across every section by key, exact first and then by containment. */
function answerOf(
  app: OnboardingApplication,
  ...candidates: string[]
): string | number | boolean | string[] | undefined {
  const entries = Object.values(app.answers).flatMap((s) => Object.entries(s))
  const wanted = candidates.map(norm)
  for (const w of wanted) {
    const hit = entries.find(([k]) => norm(k) === w)
    if (hit) return hit[1]
  }
  for (const w of wanted) {
    const hit = entries.find(([k]) => norm(k).includes(w))
    if (hit) return hit[1]
  }
  return undefined
}

const asText = (v: unknown): string | undefined =>
  v === undefined || v === null || v === ''
    ? undefined
    : Array.isArray(v)
      ? v.join(', ')
      : String(v)
const asNumber = (v: unknown): number | undefined => {
  const n =
    typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : undefined
}
const asList = (v: unknown): string[] | undefined => {
  if (Array.isArray(v)) return v.length ? v.map(String) : undefined
  const t = asText(v)
  return t
    ? t
        .split(/[,;]/)
        .map((x) => x.trim())
        .filter(Boolean)
    : undefined
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 2)
    .join('-')

function uniqueId(prefix: string, name: string, taken: string[]) {
  const base = `${prefix}-${slug(name) || 'new'}`
  let id = base
  let n = 2
  while (taken.includes(id)) id = `${base}-${n++}`
  return id
}

function buildAcsp(
  data: DemoData,
  app: OnboardingApplication,
  status: AcspStatus,
  at: string,
  actor: string,
): AcspFirm {
  const id = uniqueId(
    'acsp',
    app.name,
    data.acsps.map((a) => a.id),
  )
  const fee =
    asNumber(answerOf(app, 'standardfee', 'professionalfee', 'fee')) ?? 120
  const perDay =
    asNumber(answerOf(app, 'maxcasesperday', 'capacityperday', 'perday')) ?? 5
  const contact =
    asText(
      answerOf(
        app,
        'contactname',
        'maincontact',
        'administratorname',
        'responsibleperson',
      ),
    ) ?? 'Named reviewer to be confirmed'
  const mobile = asText(answerOf(app, 'contactmobile', 'mobile'))
  const listed = status === 'active'
  const next = new Date(new Date(at).getTime() + 365 * DAY).toISOString()
  return {
    id,
    name: app.name,
    kind:
      asText(answerOf(app, 'firmtype', 'organisationtype', 'kind')) ??
      'Law firm',
    supervisor:
      asText(answerOf(app, 'amlsupervisor', 'supervisor', 'supervisedby')) ??
      'To be confirmed',
    supervisorNumber:
      asText(
        answerOf(
          app,
          'amlnumber',
          'supervisornumber',
          'supervisorreference',
          'amlreference',
        ),
      ) ?? 'To be confirmed',
    acspNumber:
      asText(answerOf(app, 'acspreference', 'acspnumber', 'acspid')) ??
      'To be confirmed',
    status,
    statusNote: listed
      ? `Approved by ${actor}. Name matched to the Companies House published list of ACSPs.`
      : `Approved by ${actor}. Not found on the Companies House published list of ACSPs. Time to register: to be set (Pending your decision, M4). Can become Active when the listing arrives.`,
    approval: 'approved',
    reviewers: [
      {
        id: `rev-${id.slice(5)}`,
        name: contact,
        role: 'ACSP Administrator and ACSP Reviewer',
        roles: ['acsp_admin', 'acsp_reviewer'],
        mobile,
        mobileConfirmed: false,
      },
    ],
    profile: {
      residenceCountries: asList(
        answerOf(app, 'residencecountries', 'countriesaccepted', 'countries'),
      ) ?? ['United Kingdom'],
      excludedJurisdictions:
        asList(answerOf(app, 'excluded', 'excludedjurisdictions')) ?? [],
      documentTypes: ['passport', 'driving_licence'],
      issuingCountries: ['United Kingdom'],
      acceptsNonBiometricDocuments: false,
      languages: asList(answerOf(app, 'languages')) ?? ['English'],
      roles: ['director', 'psc', 'director_psc'],
      acceptsProposedDirectors: false,
      acceptsHigherRisk: false,
      capacity: {
        perDay,
        perWeek:
          asNumber(answerOf(app, 'maxcasesperweek', 'perweek')) ?? perDay * 4,
        perMonth:
          asNumber(answerOf(app, 'maxcasespermonth', 'permonth')) ??
          perDay * 14,
      },
      usedToday: 0,
      acceptingNewCases: true,
      targetTurnaroundHours: asNumber(answerOf(app, 'turnaround')) ?? 48,
      fee: {
        standard: fee,
        enhanced:
          asNumber(answerOf(app, 'enhancedfee')) ?? Math.round(fee * 1.5),
        currency: 'GBP',
      },
      evidenceRetention: 'platform',
      pepScreening: true,
      address:
        asText(answerOf(app, 'address', 'registeredaddress')) ??
        'Address as given in the application',
      connectedAccount: `acct_${id.slice(5, 7).toUpperCase()}_synthetic_${String(1000 + data.acsps.length * 137).slice(0, 4)}`,
    },
    monitoring: {
      lastCheckAt: at,
      lastSource: 'opt_in_list',
      lastReconfirmedAt: at,
      nextReconfirmationDue: next,
      nameMatchConfirmedBy: listed ? actor : undefined,
      notYetListedSince: listed ? undefined : at,
    },
    plan: { invoiceMode: 'per_case', subscription: 'monthly_only' },
    b2cAllocationShare: 0,
    b2cAllocatedThisMonth: 0,
  }
}

function buildPartner(
  data: DemoData,
  app: OnboardingApplication,
): ReferralPartner {
  const id = uniqueId(
    'partner',
    app.name,
    data.partners.map((p) => p.id),
  )
  const contact =
    asText(answerOf(app, 'contactname', 'maincontact', 'administratorname')) ??
    'Named contact to be confirmed'
  const mobile = asText(answerOf(app, 'contactmobile', 'mobile')) ?? ''
  const email =
    asText(answerOf(app, 'contactemail', 'email')) ?? 'contact@example.invalid'
  const wishes = answerOf(
    app,
    'wishtoreceivepayment',
    'receivepayment',
    'referralpayment',
  )
  const initials = app.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter((c) => /[A-Za-z]/.test(c))
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return {
    id,
    name: app.name,
    kind:
      asText(answerOf(app, 'natureofbusiness', 'organisationtype', 'kind')) ??
      'Introducer',
    country: asText(answerOf(app, 'country')) ?? 'United Kingdom',
    contactName: contact,
    contactMobile: mobile || undefined,
    paymentCode: `APC-${initials || 'RP'}`,
    approval: 'approved',
    referralPayment: {
      wishes: wishes === true || String(wishes).toLowerCase() === 'yes',
      regulator: asText(answerOf(app, 'regulator')),
    },
    users: [
      {
        id: `pu-${id.slice(8)}-1`,
        name: contact,
        role: 'partner_admin',
        email,
        mobile,
        mobileConfirmed: false,
      },
    ],
  }
}

export function approveApplication(
  data: DemoData,
  applicationId: string,
  actor = PLATFORM_ADMIN,
): ActionResult {
  const app = data.applications.find((a) => a.id === applicationId)
  if (!app || app.status !== 'pending_approval') return { data, audit: [] }
  const at = nowIso()
  const audit: AuditInput[] = []
  let createdOrgId: string
  let next: DemoData = data
  if (app.kind === 'acsp') {
    const status = statusOnApproval(data, app.name)
    const acsp = buildAcsp(data, app, status, at, actor)
    createdOrgId = acsp.id
    next = { ...data, acsps: [...data.acsps, acsp] }
    audit.push({
      at,
      actor,
      actorType: 'person',
      action: 'onboarding.acsp_approved',
      detail: `${app.name} approved as an ACSP (application ${app.id}). Status ${status === 'active' ? 'Active: name found on the Companies House published list' : 'Not yet listed: name not found on the published list. Time to register: to be set'}.`,
    })
  } else {
    const partner = buildPartner(data, app)
    createdOrgId = partner.id
    next = { ...data, partners: [...data.partners, partner] }
    audit.push({
      at,
      actor,
      actorType: 'person',
      action: 'onboarding.partner_approved',
      detail: `${app.name} approved as a Referral Partner (application ${app.id}). It sees status and check results only and is not the verifying ACSP.`,
    })
  }
  return {
    data: {
      ...next,
      applications: next.applications.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              status: 'approved',
              decidedBy: actor,
              decidedAt: at,
              createdOrgId,
            }
          : a,
      ),
    },
    audit,
  }
}

export function rejectApplication(
  data: DemoData,
  applicationId: string,
  reason: string,
  actor = PLATFORM_ADMIN,
): ActionResult {
  const app = data.applications.find((a) => a.id === applicationId)
  if (!app || app.status !== 'pending_approval') return { data, audit: [] }
  const at = nowIso()
  return {
    data: {
      ...data,
      applications: data.applications.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              status: 'rejected',
              decidedBy: actor,
              decidedAt: at,
              decisionNote: reason,
            }
          : a,
      ),
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'onboarding.rejected',
        detail: `Application ${app.id} from ${app.name} rejected. Reason recorded: ${reason}`,
      },
    ],
  }
}

/* B2C allocation */

const languageName: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  zh: 'Chinese (Simplified)',
}

/** Criteria derived from a case, used to rank or offer ACSPs. */
export function criteriaForCase(
  data: DemoData,
  vc: VerificationCase,
): MatchCriteria {
  const person = data.people.find((p) => p.id === vc.personId)
  const entry = data.register.find(
    (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
  )
  const current = person?.addressHistory.find((a) => !a.to)?.address
  const languages = ['English']
  if (vc.language && vc.language !== 'en')
    languages.push(languageName[vc.language])
  return {
    residenceCountry: current?.country ?? 'United Kingdom',
    documentType: person?.document?.type ?? 'passport',
    issuingCountry:
      person?.document?.issuingCountry ??
      person?.nationality ??
      'United Kingdom',
    role: entry?.role ?? 'director',
    languages,
    higherRisk: false,
    needsCapacityToday: true,
  }
}

/** B2C cases waiting for an administrator to confirm the allocation. */
export const casesAwaitingAllocation = (data: DemoData) =>
  data.cases.filter(
    (c) => c.allocation?.source === 'suggested' && !c.allocation.confirmedAt,
  )

export function confirmAllocation(
  data: DemoData,
  caseId: string,
  acspId: string,
  actor = PLATFORM_ADMIN,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const acsp = data.acsps.find((a) => a.id === acspId)
  if (!vc || !acsp || !vc.allocation) return { data, audit: [] }
  const at = nowIso()
  return {
    data: {
      ...data,
      cases: data.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              acspId,
              allocation: {
                ...c.allocation!,
                source: 'administrator',
                confirmedBy: actor,
                confirmedAt: at,
              },
            }
          : c,
      ),
      acsps: data.acsps.map((a) =>
        a.id === acspId
          ? { ...a, b2cAllocatedThisMonth: a.b2cAllocatedThisMonth + 1 }
          : a,
      ),
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'allocation.confirmed',
        caseId,
        detail: `Allocation confirmed by ${actor}. B2C case allocated to ${acsp.name}. The client confirms the instruction before paying.`,
      },
    ],
  }
}

/* Monitoring against the published files */

const sourceLabel: Record<NameMatch['source'], string> = {
  opt_in_list: 'Companies House published list of ACSPs (opt-in)',
  ceased_suspended_list: 'Companies House ceased and suspended list',
  yearly_upload: 'Yearly list upload',
}
export const matchSourceLabel = (s: NameMatch['source']) => sourceLabel[s]

/** Verified-by-this-ACSP cases (ACSP-12): approved, submitted or confirmed. */
export const casesVerifiedBy = (data: DemoData, acspId: string) =>
  data.cases.filter(
    (c) =>
      c.acspId === acspId &&
      (c.status === 'approved' ||
        c.status === 'submission_started' ||
        c.status === 'submitted' ||
        c.status === 'confirmed'),
  )

/** Open cases that a lapse affects (ACSP-13). */
export const openCasesOf = (data: DemoData, acspId: string) =>
  data.cases.filter(
    (c) =>
      c.acspId === acspId &&
      (c.status === 'in_progress' ||
        c.status === 'in_review' ||
        c.status === 'info_requested'),
  )

/** The status changes that follow a confirmed lapse: Suspended, allocation paused, cases flagged, open cases offered. */
function applyLapse(
  data: DemoData,
  acspId: string,
  at: string,
  actor: string,
): { data: DemoData; audit: AuditInput[] } {
  const acsp = data.acsps.find((a) => a.id === acspId)
  if (!acsp) return { data, audit: [] }
  const audit: AuditInput[] = []
  let next: DemoData = data
  if (acsp.status !== 'suspended' && acsp.status !== 'ceased') {
    next = {
      ...next,
      acsps: next.acsps.map((a) =>
        a.id === acspId
          ? {
              ...a,
              status: 'suspended',
              statusNote: `Appears on the Companies House ceased and suspended list. Name match confirmed by ${actor}.`,
              monitoring: {
                ...a.monitoring,
                lastCheckAt: at,
                lastSource: 'ceased_suspended_list',
                nameMatchConfirmedBy: actor,
              },
            }
          : a,
      ),
    }
    audit.push({
      at,
      actor,
      actorType: 'person',
      action: 'acsp.status_changed',
      detail: `${acsp.name} is now Suspended (found on the Companies House ceased and suspended list). New allocation is paused (ACSP-10, ACSP-11, MATCH-01).`,
    })
    const verified = casesVerifiedBy(next, acspId).length
    audit.push({
      at,
      actor: 'Platform, automatic',
      actorType: 'system',
      action: 'acsp.verified_cases_flagged',
      detail: `${verified} case${verified === 1 ? '' : 's'} verified by ${acsp.name} flagged for follow-up (ACSP-12). Visible to a Platform Administrator and to that ACSP only. Directors verified by this ACSP may need to verify again.`,
    })
  }
  // Offer each open case to another ACSP, with the individual's agreement (ACSP-13).
  const open = openCasesOf(next, acspId).filter((c) => !c.reallocation)
  for (const c of open) {
    const offer = suggestAcsps(next, criteriaForCase(next, c)).find(
      (s) => s.acsp.id !== acspId,
    )
    if (!offer) {
      audit.push({
        at,
        actor: 'Platform, automatic',
        actorType: 'system',
        action: 'case.reallocation_unavailable',
        caseId: c.id,
        detail: `No eligible ACSP could be offered for this open case. An administrator will allocate it by hand.`,
      })
      continue
    }
    next = {
      ...next,
      cases: next.cases.map((x) =>
        x.id === c.id
          ? {
              ...x,
              reallocation: {
                fromAcspId: acspId,
                offeredAcspId: offer.acsp.id,
                offeredAt: at,
                individualResponse: 'pending',
              },
            }
          : x,
      ),
    }
    audit.push({
      at,
      actor: 'Platform, automatic',
      actorType: 'system',
      action: 'case.reallocation_offered',
      caseId: c.id,
      detail: `Open case offered to ${offer.acsp.name}. It moves only if the individual agrees (ACSP-13).`,
    })
  }
  return { data: next, audit }
}

/** Marks an ACSP as Not yet listed because the published list does not carry its name. */
function applyNotListed(
  data: DemoData,
  acspId: string,
  at: string,
  actor: string,
): { data: DemoData; audit: AuditInput[] } {
  const acsp = data.acsps.find((a) => a.id === acspId)
  if (!acsp || acsp.status !== 'active') return { data, audit: [] }
  return {
    data: {
      ...data,
      acsps: data.acsps.map((a) =>
        a.id === acspId
          ? {
              ...a,
              status: 'not_yet_listed',
              statusNote:
                'Not found on the Companies House published list of ACSPs. Time to register: to be set (Pending your decision, M4). Can become Active when the listing arrives.',
              monitoring: {
                ...a.monitoring,
                lastCheckAt: at,
                notYetListedSince: at,
                nameMatchConfirmedBy: undefined,
              },
            }
          : a,
      ),
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'acsp.status_changed',
        detail: `${acsp.name} is now Not yet listed. Time to register: to be set (Pending your decision, M4). It is not blocked and becomes Active when the listing arrives.`,
      },
    ],
  }
}

let matchCounter = 0
const matchId = (prefix: string) =>
  `nm-${prefix}-${Date.now().toString(36)}-${matchCounter++}`

/** The fortnightly check of both published files: creates name matches for an administrator to confirm. */
export function checkPublishedLists(
  data: DemoData,
  lists: PublishedLists,
  actor = PLATFORM_ADMIN,
): ActionResult {
  const at = nowIso()
  const kept = data.monitoring.nameMatches.filter(
    (m) =>
      m.status === 'confirmed' ||
      (m.status === 'not_found' && m.confirmedAt) ||
      m.source === 'yearly_upload',
  )
  const fresh: NameMatch[] = []
  for (const a of data.acsps) {
    if (a.status === 'pending_approval' || a.status === 'withdrawn') continue
    const opt = onList(lists.optIn, a.name)
    if (opt)
      fresh.push({
        id: matchId('opt'),
        acspId: a.id,
        source: 'opt_in_list',
        listedName: opt,
        platformName: a.name,
        status: 'to_confirm',
      })
    else if (a.status === 'active' || a.status === 'not_yet_listed')
      fresh.push({
        id: matchId('opt'),
        acspId: a.id,
        source: 'opt_in_list',
        listedName: '',
        platformName: a.name,
        status: 'not_found',
      })
    const ceased = onList(lists.ceasedSuspended, a.name)
    if (ceased)
      fresh.push({
        id: matchId('cs'),
        acspId: a.id,
        source: 'ceased_suspended_list',
        listedName: ceased,
        platformName: a.name,
        status: 'to_confirm',
      })
  }
  const toConfirm = fresh.length
  return {
    data: {
      ...data,
      monitoring: {
        ...data.monitoring,
        lastFortnightlyCheckAt: at,
        nameMatches: [...kept, ...fresh],
      },
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'monitoring.lists_checked',
        detail: `Both published Companies House lists checked (opt-in list of ACSPs and the ceased and suspended list). ${toConfirm} name match${toConfirm === 1 ? '' : 'es'} to confirm. There is no API: the files are published by Companies House.`,
      },
    ],
  }
}

/** The administrator confirms one name match. Confirming a ceased or suspended match applies the lapse. */
export function confirmNameMatch(
  data: DemoData,
  id: string,
  actor = PLATFORM_ADMIN,
): ActionResult {
  const m = data.monitoring.nameMatches.find((x) => x.id === id)
  if (!m || m.confirmedAt) return { data, audit: [] }
  const at = nowIso()
  let next: DemoData = {
    ...data,
    monitoring: {
      ...data.monitoring,
      nameMatches: data.monitoring.nameMatches.map((x) =>
        x.id === id
          ? {
              ...x,
              status: x.status === 'not_found' ? 'not_found' : 'confirmed',
              confirmedBy: actor,
              confirmedAt: at,
            }
          : x,
      ),
    },
  }
  const audit: AuditInput[] = [
    {
      at,
      actor,
      actorType: 'person',
      action: 'monitoring.name_match_confirmed',
      detail:
        m.status === 'not_found'
          ? `Confirmed that ${m.platformName ?? 'the ACSP'} is not on the ${sourceLabel[m.source]}.`
          : `Name match confirmed: "${m.listedName}" on the ${sourceLabel[m.source]} is ${m.platformName ?? 'the platform ACSP'}.`,
    },
  ]
  if (m.acspId) {
    if (m.source === 'ceased_suspended_list' && m.status !== 'not_found') {
      const r = applyLapse(next, m.acspId, at, actor)
      next = r.data
      audit.push(...r.audit)
    } else if (m.status === 'not_found') {
      const r = applyNotListed(next, m.acspId, at, actor)
      next = r.data
      audit.push(...r.audit)
    } else if (m.source === 'opt_in_list') {
      next = {
        ...next,
        acsps: next.acsps.map((a) =>
          a.id === m.acspId
            ? {
                ...a,
                monitoring: {
                  ...a.monitoring,
                  lastCheckAt: at,
                  lastSource: 'opt_in_list',
                  nameMatchConfirmedBy: actor,
                },
              }
            : a,
        ),
      }
    }
  }
  return { data: next, audit }
}

/**
  "Run status check": the demonstration shortcut. Checks both published files
  and records the administrator's confirmation of every match in one step, so
  the lapsed ACSP shows Suspended, allocation pauses, its verified cases are
  listed and its open cases are offered to another ACSP.
*/
export function runStatusCheck(
  data: DemoData,
  lists: PublishedLists,
  actor = PLATFORM_ADMIN,
): ActionResult {
  const first = checkPublishedLists(data, lists, actor)
  let next = first.data
  const audit = [...first.audit]
  const pending = next.monitoring.nameMatches.filter(
    (m) =>
      !m.confirmedAt &&
      m.source !== 'yearly_upload' &&
      (m.status === 'to_confirm' || m.status === 'not_found'),
  )
  // Lapses first so the allocation offers are made against the updated register.
  const ordered = [
    ...pending.filter((m) => m.source === 'ceased_suspended_list'),
    ...pending.filter((m) => m.source !== 'ceased_suspended_list'),
  ]
  for (const m of ordered) {
    const r = confirmNameMatch(next, m.id, actor)
    next = r.data
    audit.push(...r.audit)
  }
  return { data: next, audit }
}

/** "Mark as listed": a Not yet listed ACSP becomes Active when its listing arrives. */
export function markAsListed(
  data: DemoData,
  acspId: string,
  actor = PLATFORM_ADMIN,
): ActionResult {
  const acsp = data.acsps.find((a) => a.id === acspId)
  if (!acsp || acsp.status !== 'not_yet_listed') return { data, audit: [] }
  const at = nowIso()
  return {
    data: {
      ...data,
      acsps: data.acsps.map((a) =>
        a.id === acspId
          ? {
              ...a,
              status: 'active',
              statusNote: `Listing confirmed by ${actor}. Name matched to the Companies House published list of ACSPs.`,
              monitoring: {
                ...a.monitoring,
                lastCheckAt: at,
                lastSource: 'opt_in_list',
                nameMatchConfirmedBy: actor,
                notYetListedSince: undefined,
              },
            }
          : a,
      ),
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'acsp.marked_listed',
        detail: `${acsp.name} marked as listed. Status Active. Allocation is open again, subject to its own criteria.`,
      },
    ],
  }
}

/** Yearly list upload: cross-checks every name on the synthetic file against the platform register. */
export function uploadYearlyList(
  data: DemoData,
  input: { fileName: string; names: string[] },
  actor = PLATFORM_ADMIN,
): ActionResult & { upload?: YearlyUpload } {
  const at = nowIso()
  const matches: NameMatch[] = []
  let matched = 0
  const expected = data.acsps.filter(
    (a) => a.status === 'active' || a.status === 'not_yet_listed',
  )
  for (const a of expected) {
    const hit = input.names.find(
      (n) => normaliseName(n) === normaliseName(a.name),
    )
    if (hit) {
      matched++
      matches.push({
        id: matchId('yr'),
        acspId: a.id,
        source: 'yearly_upload',
        listedName: hit,
        platformName: a.name,
        status: 'to_confirm',
      })
    } else {
      matches.push({
        id: matchId('yr'),
        acspId: a.id,
        source: 'yearly_upload',
        listedName: '',
        platformName: a.name,
        status: 'not_found',
      })
    }
  }
  const notFoundAcspIds = matches
    .filter((m) => m.status === 'not_found')
    .map((m) => m.acspId!)
  const upload: YearlyUpload = {
    id: `yu-${Date.now().toString(36)}`,
    uploadedAt: at,
    uploadedBy: actor,
    fileName: input.fileName,
    rows: input.names.length,
    matched,
    notFoundAcspIds,
  }
  return {
    upload,
    data: {
      ...data,
      monitoring: {
        ...data.monitoring,
        yearlyUploads: [upload, ...data.monitoring.yearlyUploads],
        nameMatches: [
          ...data.monitoring.nameMatches.filter(
            (m) => m.source !== 'yearly_upload' || m.confirmedAt,
          ),
          ...matches,
        ],
      },
    },
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'monitoring.yearly_upload',
        detail: `Yearly Companies House ACSP list uploaded (${input.fileName}, ${input.names.length} rows). ${matched} platform ACSP${matched === 1 ? '' : 's'} matched, ${notFoundAcspIds.length} not found. Each is confirmed by an administrator.`,
      },
    ],
  }
}

/* The individual's answer to an offer of another ACSP (ACSP-13). Called from the individual's own screen. */

export function respondToReallocation(
  data: DemoData,
  caseId: string,
  response: 'agreed' | 'declined',
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc?.reallocation || vc.reallocation.individualResponse !== 'pending')
    return { data, audit: [] }
  const at = nowIso()
  const person = data.people.find((p) => p.id === vc.personId)
  const who = person ? fullName(person) : 'The individual'
  const to = data.acsps.find((a) => a.id === vc.reallocation!.offeredAcspId)
  const from = data.acsps.find((a) => a.id === vc.reallocation!.fromAcspId)
  return {
    data: {
      ...data,
      cases: data.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              acspId:
                response === 'agreed'
                  ? vc.reallocation!.offeredAcspId
                  : c.acspId,
              reviewerId: response === 'agreed' ? undefined : c.reviewerId,
              reallocation: {
                ...c.reallocation!,
                individualResponse: response,
                respondedAt: at,
              },
            }
          : c,
      ),
    },
    audit: [
      {
        at,
        actor: who,
        actorType: 'person',
        action:
          response === 'agreed'
            ? 'case.reallocation_agreed'
            : 'case.reallocation_declined',
        caseId,
        detail:
          response === 'agreed'
            ? `${who} agreed to move this case from ${from?.name ?? 'the previous ACSP'} to ${to?.name ?? 'another ACSP'}. The case now sits with ${to?.name ?? 'the new ACSP'}.`
            : `${who} declined the offer of ${to?.name ?? 'another ACSP'}. The case stays with ${from?.name ?? 'the previous ACSP'} and an administrator follows up.`,
      },
    ],
  }
}

/** Where each open case offered after a lapse stands, for the monitoring page. */
export function reallocationRows(data: DemoData, fromAcspId: string) {
  return data.cases
    .filter((c) => c.reallocation?.fromAcspId === fromAcspId)
    .map((c) => ({
      vc: c,
      person: data.people.find((p) => p.id === c.personId),
      offered: data.acsps.find((a) => a.id === c.reallocation!.offeredAcspId),
      response: c.reallocation!.individualResponse,
    }))
}
