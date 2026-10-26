import { invoiceBreakdown, round2, splitPayment } from '@/lib/fees'
import { fullName } from '@/lib/format'
import type {
  AcspFirm,
  CaseSource,
  ClientInvoice,
  DemoData,
  ISODate,
  SubscriptionPackage,
  VerificationCase,
} from '@/types/domain'

/*
  Billing views for one ACSP, built from data.billing and the cases' Payment
  fields. All arithmetic comes from src/lib/fees.ts. The four fee types stay
  separate: the ACSP's professional fee, referral commission, platform fee and
  marketplace commission are never merged into one figure.
*/

export const gbp = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
    n,
  )

export const SOURCE_LABEL: Record<CaseSource, string> = {
  referred: 'Referred',
  b2c: 'B2C',
  own_client: 'Own client',
}

export interface StatementRow {
  caseId: string
  clientName: string
  source: CaseSource
  paidAt: ISODate
  gross: number
  providerFee: number
  /** Platform fee ex VAT, VAT on it, and the total deducted. All zero for an own client. */
  platformFee: number
  platformFeeVat: number
  platformFeeGross: number
  net: number
  payoutAt?: ISODate
}

/** Cases whose payment this ACSP received as merchant of record. */
function paidCases(data: DemoData, acspId: string): VerificationCase[] {
  return data.cases.filter(
    (c) =>
      c.payment?.paidAt &&
      (c.payment.payeeAcspId ?? c.acspId) === acspId &&
      c.status !== 'abandoned',
  )
}

export function statementRows(data: DemoData, acspId: string): StatementRow[] {
  const settings = data.billing.settings
  return paidCases(data, acspId)
    .map((vc) => {
      const p = vc.payment!
      const person = data.people.find((x) => x.id === vc.personId)
      const split = splitPayment(p.amount, vc.source, settings)
      const platformFee = p.platformFee ?? split.platformFee
      const platformFeeVat =
        p.platformFeeVat ?? round2(platformFee * settings.vatRate)
      const providerFee = p.providerFee ?? split.providerFee
      const platformFeeGross = round2(platformFee + platformFeeVat)
      return {
        caseId: vc.id,
        clientName: person ? fullName(person) : 'Client',
        source: vc.source,
        paidAt: p.paidAt!,
        gross: p.amount,
        providerFee,
        platformFee,
        platformFeeVat,
        platformFeeGross,
        net: p.netPayout ?? round2(p.amount - providerFee - platformFeeGross),
        payoutAt: p.payoutAt,
      }
    })
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
}

export const monthKey = (iso: ISODate) => iso.slice(0, 7)

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function totals(rows: StatementRow[]) {
  const sum = (f: (r: StatementRow) => number) =>
    round2(rows.reduce((a, r) => a + f(r), 0))
  return {
    gross: sum((r) => r.gross),
    providerFee: sum((r) => r.providerFee),
    platformFee: sum((r) => r.platformFee),
    platformFeeVat: sum((r) => r.platformFeeVat),
    platformFeeGross: sum((r) => r.platformFeeGross),
    net: sum((r) => r.net),
  }
}

export interface InvoiceView extends ClientInvoice {
  /** How the client's payment reached the ACSP, for the invoice's "paid by" line. */
  paidByLine: string
  source?: CaseSource
}

/** Who paid, from the case's Payment: the client, or a Referral Partner with an Agent Payment Code. */
export function paidByLine(data: DemoData, vc?: VerificationCase): string {
  const p = vc?.payment
  if (!p) return 'The client'
  if (p.method === 'agent_payment_code') {
    const partner = data.partners.find((x) => x.id === vc?.partnerId)
    const payer = p.payerName ?? partner?.name ?? 'The Referral Partner'
    return `${payer}, on the client's behalf, with Agent Payment Code ${p.code ?? ''}`.trim()
  }
  return 'The client'
}

/**
  Client invoices issued in this ACSP's name. They come from data.billing; if
  a paid case has no invoice yet, one is derived from its Payment so the list
  always agrees with the statement.
*/
export function clientInvoices(data: DemoData, acspId: string): InvoiceView[] {
  const settings = data.billing.settings
  const fromData = data.billing.clientInvoices.filter(
    (i) => i.acspId === acspId,
  )
  const known = new Set(fromData.map((i) => i.caseId))
  const derived: ClientInvoice[] = paidCases(data, acspId)
    .filter((c) => !known.has(c.id))
    .map((c) => {
      const person = data.people.find((x) => x.id === c.personId)
      const b = invoiceBreakdown(c.payment!.amount, settings.vatRate)
      return {
        id: c.payment!.clientInvoiceId ?? `INV-${c.id.slice(-6)}`,
        acspId,
        caseId: c.id,
        issuedAt: c.payment!.paidAt!,
        clientName: person ? fullName(person) : 'Client',
        description: 'Identity verification for Companies House',
        net: b.net,
        vat: b.vat,
        gross: b.gross,
        paidBy: c.payment!.payerName ?? 'Client',
      }
    })
  return [...fromData, ...derived]
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    .map((i) => {
      const vc = data.cases.find((c) => c.id === i.caseId)
      return { ...i, paidByLine: paidByLine(data, vc), source: vc?.source }
    })
}

/** Referred and B2C cases whose platform fee was deducted but is not yet on an Evidence One invoice. */
export function uninvoicedPlatformCases(
  data: DemoData,
  acspId: string,
): StatementRow[] {
  const invoiced = new Set(
    data.billing.platformInvoices
      .filter((i) => i.acspId === acspId)
      .flatMap((i) => i.caseIds),
  )
  return statementRows(data, acspId).filter(
    (r) => r.platformFee > 0 && !invoiced.has(r.caseId),
  )
}

/** The ACSP's subscription package, or undefined when it has none. */
export function packageOf(
  data: DemoData,
  acsp: AcspFirm,
): SubscriptionPackage | undefined {
  const id = acsp.plan.packageId
  return id
    ? data.billing.settings.packages.find((p) => p.id === id)
    : undefined
}

/** True when the ACSP has a subscription package. Route B filings need one (P2). */
export const hasSubscription = (data: DemoData, acsp: AcspFirm) =>
  !!packageOf(data, acsp)

export interface PlanUsage {
  pkg?: SubscriptionPackage
  /** Own-client cases this month. Only these count towards the allowance. */
  ownClientCases: number
  /** Referred and B2C cases this month. Covered by the platform fee, never counted. */
  referredCases: number
  extraCases: number
  extraCasesCharge: number
  storageUsedGb: number
  /** Share of the allowance used, 0 to 1 or more. */
  casesShare: number
  storageShare: number
  atCaseLimit: boolean
  atStorageLimit: boolean
}

/**
  Usage of the ACSP's package this month: the seeded baseline for earlier in
  the month plus the cases held in the demo that were opened this month.
*/
export function planUsage(
  data: DemoData,
  acsp: AcspFirm,
  now = Date.now(),
): PlanUsage {
  const pkg = packageOf(data, acsp)
  const month = new Date(now).toISOString().slice(0, 7)
  const mine = data.cases.filter(
    (c) => c.acspId === acsp.id && monthKey(c.createdAt) === month,
  )
  const base = acsp.plan.usageBaseline ?? {
    ownClientCases: 0,
    referredCases: 0,
  }
  const ownClientCases =
    base.ownClientCases + mine.filter((c) => c.source === 'own_client').length
  const referredCases =
    base.referredCases + mine.filter((c) => c.source !== 'own_client').length
  const included = pkg?.casesIncluded ?? 0
  const extraCases = pkg ? Math.max(0, ownClientCases - included) : 0
  const storageUsedGb = acsp.plan.storageUsedGb
  const casesShare = pkg ? ownClientCases / pkg.casesIncluded : 0
  const storageShare = pkg ? storageUsedGb / pkg.storageGb : 0
  return {
    pkg,
    ownClientCases,
    referredCases,
    extraCases,
    extraCasesCharge: round2(extraCases * (pkg?.extraCaseFee ?? 0)),
    storageUsedGb,
    casesShare,
    storageShare,
    atCaseLimit: !!pkg && ownClientCases >= pkg.casesIncluded,
    atStorageLimit: !!pkg && storageShare >= 0.9,
  }
}
