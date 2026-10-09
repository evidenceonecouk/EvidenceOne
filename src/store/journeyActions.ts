import { formatMoney } from '@/lib/format'
import type { AuditInput } from '@/lib/audit'
import { inviterNotice, type ActionResult } from './actions'
import type { DemoData, VerificationCase } from '@/types/domain'
import { fullName } from '@/lib/format'

/* Journey actions for the instruct and suggest steps. Pure, each returns audit events. */

const nameOf = (data: DemoData, vc: VerificationCase) => {
  const p = data.people.find((x) => x.id === vc.personId)
  return p ? fullName(p) : 'The individual'
}

const patch = (
  data: DemoData,
  caseId: string,
  f: (c: VerificationCase) => VerificationCase,
): DemoData => ({
  ...data,
  cases: data.cases.map((c) => (c.id === caseId ? f(c) : c)),
})

/** The individual instructs the named ACSP. Rules ACSP-01 and ACSP-02 block payment until this is recorded. */
export function instructAcsp(
  data: DemoData,
  caseId: string,
  acspId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const acsp = data.acsps.find((a) => a.id === acspId)
  if (!vc || !acsp) return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: patch(data, caseId, (c) => ({
      ...c,
      status: c.status === 'invited' ? 'in_progress' : c.status,
      acspId,
      allocation: {
        source: c.allocation?.source ?? 'invite',
        ...c.allocation,
        instructedAt: now,
      },
      journey: { ...c.journey, instructedAt: now },
    })),
    audit: [
      {
        at: now,
        actor: nameOf(data, vc),
        actorType: 'person',
        action: 'acsp.instructed',
        caseId,
        detail: `Instructed ${acsp.name} (${acsp.acspNumber}) to conduct the identity verification, at its own fee of ${formatMoney(acsp.profile.fee.standard)}. Evidence One is ${acsp.name}’s technology provider. ACSP-01 and ACSP-02 satisfied: payment may now be taken.`,
      },
    ],
  }
}

/** B2C and platform-suggested invites: record the ranked suggestions and the ACSP allocated for now. */
export function recordSuggestions(
  data: DemoData,
  caseId: string,
  rankedIds: string[],
  chosenId: string,
  answers: NonNullable<VerificationCase['journey']>['suggestionAnswers'],
  documentType: NonNullable<VerificationCase['journey']>['documentType'],
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const acsp = data.acsps.find((a) => a.id === chosenId)
  if (!vc || !acsp) return { data, audit: [] }
  const now = new Date().toISOString()
  return {
    data: patch(data, caseId, (c) => ({
      ...c,
      acspId: chosenId,
      allocation: {
        ...c.allocation,
        source: 'suggested',
        suggestedAcspIds: rankedIds,
      },
      journey: { ...c.journey, suggestionAnswers: answers, documentType },
    })),
    audit: [
      {
        at: now,
        actor: 'Evidence One',
        actorType: 'system',
        action: 'acsp.suggested',
        caseId,
        detail: `Suggested ${rankedIds.length} ACSP${rankedIds.length === 1 ? '' : 's'} from the structured answers (ranked by clear criteria, not AI). Allocated for now to ${acsp.name}. An administrator confirms the allocation at launch.`,
      },
    ],
  }
}

/** "Show me a different ACSP": allowed once, before instructing. Moves to the next suggestion. */
export function requestDifferentAcsp(
  data: DemoData,
  caseId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const ids = vc?.allocation?.suggestedAcspIds ?? []
  if (
    !vc ||
    vc.allocation?.differentRequestedAt ||
    vc.journey?.instructedAt ||
    ids.length < 2
  )
    return { data, audit: [] }
  const now = new Date().toISOString()
  const next = ids[(ids.indexOf(vc.acspId) + 1) % ids.length]
  const from = data.acsps.find((a) => a.id === vc.acspId)
  const to = data.acsps.find((a) => a.id === next)
  return {
    data: patch(data, caseId, (c) => ({
      ...c,
      acspId: next,
      allocation: { ...c.allocation!, differentRequestedAt: now },
    })),
    audit: [
      {
        at: now,
        actor: nameOf(data, vc),
        actorType: 'person',
        action: 'acsp.different_requested',
        caseId,
        detail: `Asked to see a different ACSP, once, before instructing. Moved from ${from?.name} to ${to?.name}. No further request is offered.`,
      },
    ],
  }
}

/** REG-04 notice shown: the person who sent the invite is told, once. */
export function noteAlreadyVerified(
  data: DemoData,
  caseId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc || vc.journey?.alreadyVerifiedNotifiedAt) return { data, audit: [] }
  const now = new Date().toISOString()
  const audit: AuditInput[] = [
    {
      at: now,
      actor: 'Evidence One',
      actorType: 'system',
      action: 'case.already_verified.shown',
      caseId,
      detail:
        'REG-04: the register already shows this identity as verified. The person was told calmly before payment and may continue or stop.',
    },
    ...inviterNotice(data, vc, 'shown'),
  ]
  return {
    data: patch(data, caseId, (c) => ({
      ...c,
      journey: { ...c.journey, alreadyVerifiedNotifiedAt: now },
    })),
    audit,
  }
}
