import { formatDateTime } from '@/lib/format'
import type { Payment } from '@/types/domain'

/** What the individual's journey sends when it authorises a payment. */
export type PaymentRequest = Omit<Payment, 'status' | 'authorisedAt'>

export const PAYMENT_STATUS_LABEL: Record<Payment['status'], string> = {
  authorised: 'Authorised, not yet taken',
  taken: 'Taken on approval',
  released: 'Released. Nothing was taken',
}

/** One plain line on where the payment stands: authorised, taken on approval or released. */
export function paymentStateLine(p: Payment): string {
  if (p.status === 'taken' && p.paidAt)
    return `Taken on approval, ${formatDateTime(p.paidAt)}.`
  if (p.status === 'released')
    return `Nothing was taken. The authorisation was released${p.releasedAt ? ` on ${formatDateTime(p.releasedAt)}` : ''}.`
  return 'Authorised, not yet taken.'
}
