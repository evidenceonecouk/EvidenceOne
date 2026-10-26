import type { AuditInput } from '@/lib/audit'
import { splitPayment } from '@/lib/fees'
import { addDays, formatDate, formatMoney } from '@/lib/format'
import {
  buildClientInvoice,
  consentRequiredBy,
  DEMO_REFERRAL_COMMISSION,
  nextInvoiceNumber,
  partnerReceivesCommission,
} from '@/lib/invoicing'
import type { PaymentRequest } from '@/lib/paymentStatus'
import { currentRuleSet } from '@/lib/rules'
import type {
  DemoData,
  Payment,
  ReferralRecord,
  VerificationCase,
} from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Payment after approval (P10, decided 19 and 20 October). The card, or a
  Referral Partner's Agent Payment Code, is authorised when the client
  instructs the ACSP. The total is taken only when the ACSP approves: the
  platform fee (referred and B2C cases only) is deducted then, and the client
  invoice is issued in the ACSP's name. On a decline, a lapse or an ACSP lapse
  the authorisation is released and nothing is taken. Evidence One collects the
  payment only as the ACSP's disclosed agent, with the ACSP as merchant of record.
*/

const nameOf = (data: DemoData, personId: string) => {
  const p = data.people.find((x) => x.id === personId)
  return p ? `${p.givenNames} ${p.familyName}` : 'The individual'
}

function withPayment(
  data: DemoData,
  caseId: string,
  payment: Payment,
  extra: Partial<VerificationCase> = {},
): DemoData {
  return {
    ...data,
    cases: data.cases.map((c) =>
      c.id === caseId
        ? {
            ...c,
            ...extra,
            payment,
            journey: c.journey && { ...c.journey, payment },
          }
        : c,
    ),
  }
}

export interface AuthoriseOptions {
  /** The referral arrangement disclosure was shown and acknowledged, or consent given, before authorisation. */
  disclosure?: { acknowledgedAt: string; consentAt?: string }
}

/** At the instruct step: the card or Agent Payment Code is authorised. Nothing is taken yet. */
export function authorisePayment(
  data: DemoData,
  caseId: string,
  payment: PaymentRequest,
  options: AuthoriseOptions = {},
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc) return { data, audit: [] }
  const acsp = data.acsps.find(
    (a) => a.id === (payment.payeeAcspId ?? vc.acspId),
  )
  if (!acsp) return { data, audit: [] }
  const now = new Date().toISOString()
  const name = nameOf(data, vc.personId)
  const full: Payment = {
    ...payment,
    status: 'authorised',
    authorisedAt: now,
    payeeAcspId: acsp.id,
    disclosure: options.disclosure,
  }
  const next = withPayment(data, caseId, full, {
    status: vc.status === 'invited' ? 'in_progress' : vc.status,
  })
  return {
    data: {
      ...next,
      cases: next.cases.map((c) =>
        c.id === caseId ? { ...c, journey: { ...c.journey, paid: true } } : c,
      ),
      invites: next.invites.map((i) =>
        i.caseId === caseId && payment.code && i.paymentCode === payment.code
          ? { ...i, paymentCodeUsedAt: now }
          : i,
      ),
    },
    audit: [
      {
        at: now,
        actor: name,
        actorType: 'person',
        action: 'payment.authorised',
        caseId,
        detail:
          (payment.method === 'agent_payment_code'
            ? `${formatMoney(payment.amount)} authorised, paid by ${payment.payerName} on the client’s behalf with single-use Agent Payment Code ${payment.code}.`
            : `Card authorised for ${formatMoney(payment.amount)} to ${acsp.name}. Reference ${payment.reference}.`) +
          ` Nothing is taken until ${acsp.name} approves. Evidence One acts as ${acsp.name}’s disclosed agent.`,
      },
    ],
  }
}

/** On approval: the total is taken, the platform fee deducted and the client invoice issued in the ACSP's name. */
export function takePayment(
  data: DemoData,
  caseId: string,
  at: string,
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const payment = vc?.payment
  if (!vc || !payment || payment.status !== 'authorised')
    return { data, audit: [] }
  const acsp = data.acsps.find(
    (a) => a.id === (payment.payeeAcspId ?? vc.acspId),
  )
  if (!acsp) return { data, audit: [] }
  const name = nameOf(data, vc.personId)
  const split = splitPayment(payment.amount, vc.source, data.billing.settings)
  const paidBy =
    payment.method === 'agent_payment_code'
      ? (payment.payerName ?? 'Referral Partner')
      : name
  const invoice = buildClientInvoice({
    id: nextInvoiceNumber(acsp, data.billing, new Date(at).getFullYear()),
    acsp,
    caseId,
    clientName: name,
    gross: payment.amount,
    vatRate: data.billing.settings.vatRate,
    paidBy,
    issuedAt: at,
  })
  const full: Payment = {
    ...payment,
    status: 'taken',
    paidAt: at,
    providerFee: split.providerFee,
    platformFee: split.platformFee,
    platformFeeVat: split.platformFeeVat,
    netPayout: split.net,
    payoutAt: addDays(at, 2),
    clientInvoiceId: invoice.id,
  }
  const next = withPayment(data, caseId, full)

  // Referral commissions are Off at launch. When On, the nine-field referral record is kept.
  const partner = data.partners.find((p) => p.id === vc.partnerId)
  const commissionsOn = currentRuleSet(data).settings.referral_commissions
  const disclosure = payment.disclosure
  const record: ReferralRecord | undefined =
    commissionsOn && partnerReceivesCommission(partner) && disclosure
      ? {
          referral_partner: partner!.name,
          regulator: partner!.referralPayment.regulator!,
          commission_type: DEMO_REFERRAL_COMMISSION.type,
          commission_amount: DEMO_REFERRAL_COMMISSION.amount,
          disclosure_version: DEMO_REFERRAL_COMMISSION.disclosureVersion,
          disclosed_at: disclosure.acknowledgedAt,
          consent_required: consentRequiredBy(
            partner!.referralPayment.regulator,
          ),
          consent_at: disclosure.consentAt,
          payment_at: at,
        }
      : undefined

  const platformLine =
    split.platformFee > 0
      ? ` Platform fee of ${formatMoney(split.platformFee)} plus VAT deducted automatically.`
      : ' No platform fee: the ACSP’s own client.'
  const audit: AuditInput[] = [
    {
      at,
      actor: 'Evidence One',
      actorType: 'system',
      action: 'payment.taken',
      caseId,
      detail:
        (payment.method === 'agent_payment_code'
          ? `Approved, so ${formatMoney(payment.amount)} was taken from ${payment.payerName}, paid on the client’s behalf with Agent Payment Code ${payment.code}.`
          : `Approved, so ${formatMoney(payment.amount)} was taken from ${name}’s card. Reference ${payment.reference}.`) +
        ` Evidence One collected it as ${acsp.name}’s disclosed agent, with ${acsp.name} as merchant of record.${platformLine} Net ${formatMoney(split.net)} to ${acsp.name}’s own payment account.`,
    },
    {
      at,
      actor: 'Evidence One',
      actorType: 'system',
      action: 'invoice.issued',
      caseId,
      detail: `Invoice ${invoice.id} issued in the name of ${acsp.name} (${acsp.profile.vatNumber ? `VAT ${acsp.profile.vatNumber}` : 'not VAT registered'}), generated by Evidence One on its behalf.`,
    },
  ]
  if (record)
    audit.push({
      at,
      actor: 'Evidence One',
      actorType: 'system',
      action: 'referral.recorded',
      caseId,
      detail: `Referral record kept for ${record.referral_partner}: disclosure ${record.disclosure_version} shown on ${formatDate(record.disclosed_at!)}${record.consent_at ? ', consent given' : record.consent_required ? ', consent required' : ', acknowledged'}.`,
    })

  return {
    data: {
      ...next,
      billing: {
        ...next.billing,
        clientInvoices: [...next.billing.clientInvoices, invoice],
      },
      referralRecords: record
        ? [...next.referralRecords, record]
        : next.referralRecords,
    },
    audit,
  }
}

/** On a decline, a lapse or an ACSP lapse: the authorisation is released and nothing is taken. */
export function releasePayment(
  data: DemoData,
  caseId: string,
  reason: string,
  at = new Date().toISOString(),
): ActionResult {
  const vc = data.cases.find((c) => c.id === caseId)
  const payment = vc?.payment
  if (!vc || !payment || payment.status !== 'authorised')
    return { data, audit: [] }
  const full: Payment = {
    ...payment,
    status: 'released',
    releasedAt: at,
    releaseReason: reason,
  }
  return {
    data: withPayment(data, caseId, full),
    audit: [
      {
        at,
        actor: 'Evidence One',
        actorType: 'system',
        action: 'payment.released',
        caseId,
        detail: `${reason}. The authorisation of ${formatMoney(payment.amount)} was released. Nothing was taken and no invoice was issued.`,
      },
    ],
  }
}

/** Chains two actions, keeping both audit lists in order. */
export function then(
  first: ActionResult,
  next: (data: DemoData) => ActionResult,
): ActionResult {
  const second = next(first.data)
  return { data: second.data, audit: [...first.audit, ...second.audit] }
}
