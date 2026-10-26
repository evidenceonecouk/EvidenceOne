import type { AuditInput } from '@/lib/audit'
import { formatMoney } from '@/lib/format'
import { paymentTotal } from '@/lib/fees'
import { currentRuleSet } from '@/lib/rules'
import type { DemoData, VerificationCase } from '@/types/domain'
import type { ActionResult } from './actions'
import { refuseOtherAcsp } from './guards'
import { postCaseMessage } from './messageActions'

/*
  Register correction with a fee (G2-10 and G2-13, client email of 23
  October). A register difference stays a flag. The Mandatory decision outcome
  "Correction needed" lets the ACSP raise a correction fee on top of the
  verification fee. The client approves the revised total (a second
  authorisation, nothing taken). The ACSP carries out the correction at
  Companies House outside the platform and ticks "Register corrected". The
  ACSP then approves, and the payment is taken once. A decline or an ACSP
  lapse releases both authorisations.

  Design interpretations to confirm with the client: who carries out the
  correction and by which route, who pays the add-on under an Agent Payment
  Code, the Referral Partner status mapping, the second authorisation, and one
  platform fee per case.
*/

const HOUR = 3_600_000

const patch = (
  data: DemoData,
  caseId: string,
  fn: (c: VerificationCase) => VerificationCase,
): DemoData => ({
  ...data,
  cases: data.cases.map((c) => (c.id === caseId ? fn(c) : c)),
})

const personName = (data: DemoData, vc: VerificationCase) => {
  const p = data.people.find((x) => x.id === vc.personId)
  return p ? `${p.givenNames} ${p.familyName}` : 'The individual'
}

const reviewerOf = (data: DemoData, reviewerId: string) =>
  data.acsps.flatMap((a) => a.reviewers).find((r) => r.id === reviewerId)
    ?.name ?? 'ACSP reviewer'

/** Rules that can lead to "Correction needed": the register differences of G2-10. */
export const CORRECTABLE_RULES = ['REG-11', 'REG-12', 'REG-13', 'REG-18']

/** The ACSP records "Correction needed" on a register difference and raises its correction fee. */
export function raiseCorrection(
  data: DemoData,
  caseId: string,
  ruleId: string,
  amount: number,
  description: string,
  reason: string,
  reviewerId: string,
): ActionResult {
  const refused = refuseOtherAcsp(
    data,
    caseId,
    reviewerId,
    'the register correction',
  )
  if (refused) return refused
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc || !vc.payment || vc.payment.status !== 'authorised')
    return { data, audit: [] }
  if (
    vc.registerCorrection &&
    vc.registerCorrection.stage !== 'declined_by_client'
  )
    return { data, audit: [] }
  if (
    !CORRECTABLE_RULES.includes(ruleId) ||
    !(amount > 0) ||
    !description.trim()
  )
    return { data, audit: [] }
  const at = new Date().toISOString()
  const actor = reviewerOf(data, reviewerId)
  const acsp = data.acsps.find((a) => a.id === vc.acspId)
  const total = paymentTotal({ amount: vc.payment.amount, addOn: { amount } })
  const body = `We need to correct your details on the Companies House register before we can approve your verification. ${acsp?.name ?? 'Your ACSP'} charges ${formatMoney(amount)} for this correction (${description.trim()}). Your original total was ${formatMoney(vc.payment.amount)}. The revised total is ${formatMoney(total)}. You are only charged when ${acsp?.name ?? 'your ACSP'} approves your verification. Please approve or decline the revised total in your case status.`
  const withCase = patch(data, caseId, (c) => ({
    ...c,
    ruleDecisions: {
      ...c.ruleDecisions,
      [ruleId]: { decision: 'correction_needed', reason, at, reviewerId },
    },
    registerCorrection: {
      ruleId,
      stage: 'awaiting_client_approval',
      raisedAt: at,
      raisedBy: actor,
      amount,
      description: description.trim(),
    },
  }))
  const msg = postCaseMessage(withCase, caseId, 'reviewer', actor, body)
  const audit: AuditInput[] = [
    {
      at,
      actor,
      actorType: 'person',
      action: 'rule.decision.recorded',
      caseId,
      detail: `Mandatory decision on ${ruleId}: correction needed. Reason: ${reason}`,
    },
    {
      at,
      actor,
      actorType: 'person',
      action: 'correction.raised',
      caseId,
      detail: `Register correction fee of ${formatMoney(amount)} raised on top of the verification fee of ${formatMoney(vc.payment.amount)} (${description.trim()}). Revised total ${formatMoney(total)}, awaiting the client’s approval. This is an outcome of the Mandatory decision. It is not a Halt or a Block.`,
    },
    ...msg.audit,
  ]
  return { data: msg.data, audit }
}

/** The individual approves or declines the revised total. Approving is a second authorisation. Nothing is taken. */
export function answerRevisedTotal(
  data: DemoData,
  caseId: string,
  approve: boolean,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const b = vc?.registerCorrection
  if (!vc || !b || b.stage !== 'awaiting_client_approval' || !vc.payment)
    return { data, audit: [] }
  const at = new Date().toISOString()
  const name = personName(data, vc)
  const acspName =
    data.acsps.find((a) => a.id === vc.acspId)?.name ?? 'the ACSP'
  if (!approve)
    return {
      data: patch(data, caseId, (c) => {
        const { [b.ruleId]: _removed, ...rest } = c.ruleDecisions ?? {}
        return {
          ...c,
          ruleDecisions: rest,
          registerCorrection: {
            ...b,
            stage: 'declined_by_client',
            clientDeclinedAt: at,
          },
        }
      }),
      audit: [
        {
          at,
          actor: name,
          actorType: 'person',
          action: 'correction.declined_by_client',
          caseId,
          detail: `${name} declined the revised total of ${formatMoney(paymentTotal({ amount: vc.payment.amount, addOn: { amount: b.amount } }))}. The case returns to the reviewer, who can proceed without a correction, request information, or decline. The Mandatory decision on ${b.ruleId} is open again. Nothing was taken.`,
        },
      ],
    }
  const params = currentRuleSet(data).params
  const reference = `${vc.payment.reference}-ADD`
  const total = paymentTotal({
    amount: vc.payment.amount,
    addOn: { amount: b.amount },
  })
  return {
    data: patch(data, caseId, (c) => {
      const payment = {
        ...c.payment!,
        addOn: {
          amount: b.amount,
          description: b.description,
          authorisedAt: at,
          reference,
          paidBy: 'client' as const,
        },
      }
      return {
        ...c,
        payment,
        journey: c.journey && { ...c.journey, payment },
        registerCorrection: {
          ...b,
          stage: 'awaiting_register_correction',
          clientApprovedAt: at,
          expectedFrom: new Date(
            new Date(at).getTime() +
              params.correction_turnaround_hours_min * HOUR,
          ).toISOString(),
          expectedBy: new Date(
            new Date(at).getTime() +
              params.correction_turnaround_hours_max * HOUR,
          ).toISOString(),
        },
      }
    }),
    audit: [
      {
        at,
        actor: name,
        actorType: 'person',
        action: 'correction.approved_by_client',
        caseId,
        detail: `${name} approved the revised total of ${formatMoney(total)}. A second authorisation of ${formatMoney(b.amount)} was placed on the card (reference ${reference}). Nothing is taken until ${acspName} approves.`,
      },
    ],
  }
}

/** The ACSP ticks "Register corrected". It carried out the correction at Companies House outside the platform. */
export function markRegisterCorrected(
  data: DemoData,
  caseId: string,
  reviewerId: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const b = vc?.registerCorrection
  if (!vc || !b || b.stage !== 'awaiting_register_correction')
    return { data, audit: [] }
  const refused = refuseOtherAcsp(
    data,
    caseId,
    reviewerId,
    'the register correction',
  )
  if (refused) return refused
  const at = new Date().toISOString()
  const actor = reviewerOf(data, reviewerId)
  return {
    data: patch(data, caseId, (c) => ({
      ...c,
      registerCorrection: {
        ...b,
        stage: 'register_corrected',
        registerCorrectedAt: at,
        registerCorrectedBy: actor,
      },
    })),
    audit: [
      {
        at,
        actor,
        actorType: 'person',
        action: 'correction.register_corrected',
        caseId,
        detail:
          'Register corrected. The ACSP carried out the correction at Companies House outside the platform and confirmed it here. Approve is now available.',
      },
    ],
  }
}

/** True while a correction branch holds the case back from Approve. */
export const correctionOpen = (vc: VerificationCase) =>
  !!vc.registerCorrection &&
  (vc.registerCorrection.stage === 'awaiting_client_approval' ||
    vc.registerCorrection.stage === 'awaiting_register_correction')
