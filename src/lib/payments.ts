import type {
  AcspFirm,
  AcspPayments,
  PaymentProviderStatus,
} from '@/types/domain'

/*
  Connect payments (G2-02, subject to the payment provider's confirmation).
  The ACSP connects payments through the secure payment provider's own
  onboarding. Payments activate only when the provider's requirements and
  Evidence One's own approval are both met. Evidence One never collects or
  stores the ACSP's bank credentials.
*/

export const PROVIDER_STATUS_LABEL: Record<PaymentProviderStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  more_information_needed: 'More information needed',
  eligible: 'Eligible',
}

export const PROVIDER_STATUSES = Object.keys(
  PROVIDER_STATUS_LABEL,
) as PaymentProviderStatus[]

/** The five stages shown on the Connect payments panel. */
export const CONNECT_STAGES = [
  'You register with Evidence One.',
  'You connect payments.',
  'The secure payment provider collects your business, representative and payout details.',
  'The secure payment provider confirms whether your account can receive payments and payouts.',
  'Evidence One activates payments once the provider’s requirements and Evidence One’s own approval are both met.',
]

export const NO_BANK_DETAILS_LINE =
  'Evidence One does not collect or store your bank account details. You enter them only with the secure payment provider.'

/** Payments are active only when the provider says Eligible and Evidence One has approved. */
export const arePaymentsActive = (p: {
  providerStatus: PaymentProviderStatus
  evidenceOneApproved: boolean
}) => p.providerStatus === 'eligible' && p.evidenceOneApproved

export const paymentsActive = (acsp: AcspFirm) => acsp.payments.paymentsActive

export function withGates(
  p: Pick<AcspPayments, 'providerStatus' | 'evidenceOneApproved'> &
    Partial<AcspPayments>,
): AcspPayments {
  return { ...p, paymentsActive: arePaymentsActive(p) }
}

/** Reads the status an application recorded, tolerating the label form. */
export function providerStatusFromAnswer(v: unknown): PaymentProviderStatus {
  const t = String(v ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
  if (t === 'eligible') return 'eligible'
  if (t === 'moreinformationneeded') return 'more_information_needed'
  if (t === 'inprogress') return 'in_progress'
  return 'not_started'
}
