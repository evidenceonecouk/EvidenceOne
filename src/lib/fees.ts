import { SUBSCRIPTION_PACKAGES } from '@/data/packages'
import type { BillingSettings, CaseSource } from '@/types/domain'

/*
  Agency money flow. The client pays the named ACSP. Evidence One collects the
  payment as the ACSP's disclosed agent, by split payment. The £69 plus VAT
  platform fee applies to referred and B2C cases only, is deducted automatically
  from the payment, and never applies to an ACSP's own client (who is covered by
  the ACSP's subscription). Payment provider fees are borne by the ACSP.
  The four fee types are never merged.
*/

/** Indicative payment provider fee, shown on the ACSP's statement. */
export const PROVIDER_FEE_RATE = 0.014
export const PROVIDER_FEE_FIXED = 0.2

export const round2 = (n: number) => Math.round(n * 100) / 100

/**
  What is taken on approval: the ACSP's verification fee plus any register
  correction add-on. The add-on is part of the ACSP Professional Fee, shown as
  its own line, never a fifth fee type.
*/
export const paymentTotal = (p: {
  amount: number
  addOn?: { amount: number }
}) => round2(p.amount + (p.addOn?.amount ?? 0))

export interface PaymentSplit {
  /** What the client pays the ACSP (the ACSP's professional fee, VAT inclusive). */
  gross: number
  providerFee: number
  /** Platform fee ex VAT, VAT on it, and the total deducted. All zero for an own client. */
  platformFee: number
  platformFeeVat: number
  platformFeeGross: number
  /** Paid out to the ACSP's own payment account. */
  net: number
}

/** The platform fee applies to referred and B2C cases only. */
export const carriesPlatformFee = (source: CaseSource) =>
  source !== 'own_client'

export function splitPayment(
  gross: number,
  source: CaseSource,
  settings: Pick<BillingSettings, 'platformFee' | 'vatRate'>,
): PaymentSplit {
  const providerFee = round2(gross * PROVIDER_FEE_RATE + PROVIDER_FEE_FIXED)
  const platformFee = carriesPlatformFee(source) ? settings.platformFee : 0
  const platformFeeVat = round2(platformFee * settings.vatRate)
  const platformFeeGross = round2(platformFee + platformFeeVat)
  return {
    gross,
    providerFee,
    platformFee,
    platformFeeVat,
    platformFeeGross,
    net: round2(gross - providerFee - platformFeeGross),
  }
}

/** Splits a VAT-inclusive amount into net and VAT, for an invoice in the ACSP's name. */
export function invoiceBreakdown(gross: number, vatRate: number) {
  const net = round2(gross / (1 + vatRate))
  return { net, vat: round2(gross - net), gross }
}

export const DEFAULT_BILLING_SETTINGS: BillingSettings = {
  platformFee: 69,
  vatRate: 0.2,
  packages: SUBSCRIPTION_PACKAGES,
}
