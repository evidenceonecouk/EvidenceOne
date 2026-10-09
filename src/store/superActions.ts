import type { AuditInput } from '@/lib/audit'
import { formatMoney } from '@/lib/format'
import type {
  ApprovalKind,
  ApprovalPayload,
  ApprovalRequest,
  BillingSettings,
  DemoData,
} from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Super Administrator actions. A change to the platform fee, the subscription
  plan, referral commissions or the disclosure text is proposed by one Super
  Administrator and approved by a different one. Both steps use step-up
  (passkey or authenticator code, never SMS) and the step-up references go in
  the audit entries. Rule publication lives on the Rules page.
*/

export const SUPER_ROLE = 'Super Administrator'

/** The name written to the audit trail for a Super Administrator seat. */
export const superActorName = (name: string) => `${name}, ${SUPER_ROLE}`

/** The person part of an actor string, so "Helen Carver, Super Administrator" and "Helen Carver" are the same person. */
const personOf = (actor: string) => actor.split(',')[0].trim().toLowerCase()

export const isSamePerson = (a: string, b: string) =>
  personOf(a) === personOf(b)

/** Nobody approves their own change. */
export const canDecide = (approval: ApprovalRequest, actor: string) =>
  approval.status === 'pending' && !isSamePerson(approval.proposedBy, actor)

export const KIND_LABELS: Record<ApprovalKind, string> = {
  platform_fee: 'Platform fee',
  subscription_plan: 'Subscription plan',
  referral_commissions: 'Referral commissions',
  disclosure_text: 'Disclosure text',
}

export const BASE_DISCLOSURE_VERSION = 'D-2026.1'

/** The disclosure version in force: the latest approved disclosure text, or the launch version. */
export function currentDisclosureVersion(data: DemoData): string {
  const approved = data.approvals
    .filter((a) => a.kind === 'disclosure_text' && a.status === 'approved')
    .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''))[0]
  if (!approved) return BASE_DISCLOSURE_VERSION
  return approved.payload?.kind === 'disclosure_text'
    ? approved.payload.version
    : approved.to
}

export const nextDisclosureVersion = (data: DemoData) => {
  const current = currentDisclosureVersion(data)
  const m = current.match(/^(D-\d{4}\.)(\d+)$/)
  return m ? `${m[1]}${Number(m[2]) + 1}` : `${BASE_DISCLOSURE_VERSION}.1`
}

export const pendingOfKind = (data: DemoData, kind: ApprovalKind) =>
  data.approvals.find((a) => a.kind === kind && a.status === 'pending')

function nextApprovalId(data: DemoData) {
  const max = data.approvals
    .map((a) => Number(a.id.match(/(\d+)$/)?.[1] ?? 0))
    .reduce((a, b) => Math.max(a, b), 0)
  return `APR-2026-${String(max + 1).padStart(4, '0')}`
}

export interface ProposeInput {
  kind: ApprovalKind
  payload: ApprovalPayload
  summary: string
  from: string
  to: string
}

/** Describes the platform fee for a summary, ex VAT. */
export const feeText = (n: number) =>
  `£${Number.isInteger(n) ? n : n.toFixed(2)} plus VAT`

export function subscriptionText(
  structure: BillingSettings['subscription']['structure'],
  casesIncluded: number | null,
  price: number | null,
) {
  const shape =
    structure === 'monthly_with_cases'
      ? `Monthly fee with ${casesIncluded ?? 'a number of'} cases included`
      : 'Monthly fee alone'
  return `${shape}, ${price === null ? 'price not set' : `${formatMoney(price)} a month`}`
}

/** Proposes a change. Only one request of each kind can be pending at a time. */
export function proposeChange(
  data: DemoData,
  input: ProposeInput,
  proposedBy: string,
  stepUpRef: string,
): ActionResult {
  if (pendingOfKind(data, input.kind)) return { data, audit: [] }
  const at = new Date().toISOString()
  const request: ApprovalRequest = {
    id: nextApprovalId(data),
    kind: input.kind,
    payload: input.payload,
    summary: input.summary,
    from: input.from,
    to: input.to,
    proposedBy,
    proposedAt: at,
    status: 'pending',
    stepUpRef,
  }
  return {
    data: { ...data, approvals: [request, ...data.approvals] },
    audit: [
      {
        at,
        actor: proposedBy,
        actorType: 'person',
        action: `approval.${input.kind}.proposed`,
        detail: `${request.id} proposed: ${input.summary}. Waiting for a second approver, who must be a different Super Administrator. Step-up ${stepUpRef} confirmed.`,
      },
    ],
  }
}

/** The amount in the "to" text of an older record, for example "£72 plus VAT". */
const feeFromText = (text: string) => {
  const m = text.match(/£\s*([\d,]+(?:\.\d+)?)/)
  return m ? Number(m[1].replace(/,/g, '')) : undefined
}

function applyApproved(
  data: DemoData,
  approval: ApprovalRequest,
): { data: DemoData; note: string } {
  const payload = approval.payload
  if (approval.kind === 'platform_fee') {
    const fee =
      payload?.kind === 'platform_fee'
        ? payload.platformFee
        : feeFromText(approval.to)
    if (fee === undefined) return { data, note: 'No change applied.' }
    return {
      data: {
        ...data,
        billing: {
          ...data.billing,
          settings: { ...data.billing.settings, platformFee: fee },
        },
      },
      note: `The platform fee is now ${feeText(fee)} per referred case, deducted from each referred and B2C payment.`,
    }
  }
  if (
    approval.kind === 'subscription_plan' &&
    payload?.kind === 'subscription_plan'
  ) {
    return {
      data: {
        ...data,
        billing: {
          ...data.billing,
          settings: {
            ...data.billing.settings,
            subscription: {
              ...data.billing.settings.subscription,
              structure: payload.structure,
              price: payload.price,
              casesIncluded: payload.casesIncluded,
            },
          },
        },
      },
      note: `The subscription plan is now: ${approval.to}.`,
    }
  }
  if (approval.kind === 'disclosure_text')
    return {
      data,
      note: `Disclosure text ${approval.to} is in force for referral disclosures shown from now on.`,
    }
  return { data, note: 'Recorded.' }
}

/** The second approver approves or rejects. The proposer cannot. Approval applies the change. */
export function decideApproval(
  data: DemoData,
  id: string,
  outcome: 'approved' | 'rejected',
  decidedBy: string,
  stepUpRef: string,
  reason?: string,
): ActionResult {
  const approval = data.approvals.find((a) => a.id === id)
  if (!approval || !canDecide(approval, decidedBy)) return { data, audit: [] }
  const at = new Date().toISOString()
  let next = data
  let note = `The change was not applied.${reason ? ` Reason: ${reason}.` : ''}`
  if (outcome === 'approved') {
    const applied = applyApproved(data, approval)
    next = applied.data
    note = applied.note
  }
  const decided: ApprovalRequest = {
    ...approval,
    status: outcome,
    decidedBy,
    decidedAt: at,
    stepUpRef,
  }
  const audit: AuditInput[] = [
    {
      at,
      actor: decidedBy,
      actorType: 'person',
      action: `approval.${approval.kind}.${outcome}`,
      detail: `${approval.id} ${outcome} by the second approver. Proposed by ${approval.proposedBy}. ${approval.summary}. ${note} Step-up ${stepUpRef} confirmed.`,
    },
  ]
  return {
    data: {
      ...next,
      approvals: next.approvals.map((a) => (a.id === id ? decided : a)),
    },
    audit,
  }
}

/** The proposer withdraws their own pending request before anyone decides it. */
export function withdrawApproval(
  data: DemoData,
  id: string,
  actor: string,
): ActionResult {
  const approval = data.approvals.find((a) => a.id === id)
  if (!approval || approval.status !== 'pending') return { data, audit: [] }
  if (!isSamePerson(approval.proposedBy, actor)) return { data, audit: [] }
  return {
    data: { ...data, approvals: data.approvals.filter((a) => a.id !== id) },
    audit: [
      {
        at: new Date().toISOString(),
        actor,
        actorType: 'person',
        action: `approval.${approval.kind}.withdrawn`,
        detail: `${approval.id} withdrawn by its proposer before a decision. Nothing was changed.`,
      },
    ],
  }
}

/**
  Records the step-up reference for a step taken through another store action,
  such as proposing or publishing a rule version, so the reference is in the
  audit trail beside the action itself.
*/
export function recordStepUp(
  data: DemoData,
  actor: string,
  action: string,
  detail: string,
  stepUpRef: string,
): ActionResult {
  return {
    data,
    audit: [
      {
        at: new Date().toISOString(),
        actor,
        actorType: 'person',
        action,
        detail: `${detail} Step-up ${stepUpRef} confirmed.`,
      },
    ],
  }
}
