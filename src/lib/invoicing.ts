import { invoiceBreakdown } from '@/lib/fees'
import type {
  AcspFirm,
  BillingData,
  ClientInvoice,
  ReferralPartner,
} from '@/types/domain'

/*
  Client invoices are issued in the ACSP's name, with its address and VAT number.
  Evidence One generates them on the ACSP's behalf. Numbering is per ACSP, for
  example HLS-2026-0048.
*/

const SKIP_WORDS = new Set(['and', '&', 'llp', 'ltd', 'limited', 'plc', 'the'])

/** Invoice prefix for an ACSP: the initials of its name, or the prefix already used on its invoices. */
export function invoicePrefix(acsp: AcspFirm, billing: BillingData): string {
  const used = billing.clientInvoices.find((i) => i.acspId === acsp.id)
  if (used) {
    const m = /^([A-Z]+)-\d{4}-\d+$/.exec(used.id)
    if (m) return m[1]
  }
  const initials = acsp.name
    .replace(/[,.]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !SKIP_WORDS.has(w.toLowerCase()))
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('')
  return initials || 'INV'
}

/** The next invoice number for this ACSP and year. */
export function nextInvoiceNumber(
  acsp: AcspFirm,
  billing: BillingData,
  year: number,
): string {
  const prefix = invoicePrefix(acsp, billing)
  const stem = `${prefix}-${year}-`
  const max = billing.clientInvoices
    .filter((i) => i.acspId === acsp.id && i.id.startsWith(stem))
    .map((i) => Number(i.id.slice(stem.length)))
    .reduce((a, b) => Math.max(a, b), 0)
  return `${stem}${String(max + 1).padStart(4, '0')}`
}

/** An ACSP registered for VAT adds VAT to its fee; otherwise the whole fee is net. */
export function invoiceAmounts(acsp: AcspFirm, gross: number, vatRate: number) {
  return acsp.profile.vatNumber
    ? invoiceBreakdown(gross, vatRate)
    : { net: gross, vat: 0, gross }
}

export function buildClientInvoice(input: {
  id: string
  acsp: AcspFirm
  caseId: string
  clientName: string
  gross: number
  vatRate: number
  paidBy: string
  issuedAt: string
}): ClientInvoice {
  const a = invoiceAmounts(input.acsp, input.gross, input.vatRate)
  return {
    id: input.id,
    acspId: input.acsp.id,
    caseId: input.caseId,
    issuedAt: input.issuedAt,
    clientName: input.clientName,
    description: `Identity verification for Companies House, conducted by ${input.acsp.name} using the Evidence One platform`,
    net: a.net,
    vat: a.vat,
    gross: a.gross,
    paidBy: input.paidBy,
  }
}

/*
  Referral commissions are Off at launch. When a Super Administrator switches
  them on, the disclosure and the referral record use these demonstration
  values. The amount and the regulator's wording are the client's to set.
*/
export const DEMO_REFERRAL_COMMISSION = {
  type: 'fixed_fee_per_completed_case',
  amount: 25,
  disclosureVersion: 'DISC-2026.1',
} as const

/** Whether this regulator needs the customer's consent rather than an acknowledgement. Demonstration rule. */
export const consentRequiredBy = (regulator?: string) =>
  !!regulator && !/^SRA/i.test(regulator.trim())

/** True when this partner has said it wishes to receive payment for referrals and named a regulator. */
export const partnerReceivesCommission = (p?: ReferralPartner) =>
  !!p?.referralPayment.wishes && !!p.referralPayment.regulator
