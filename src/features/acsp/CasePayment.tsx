import { MonoLabel, Panel } from '@/components/app/Page'
import { carriesPlatformFee, splitPayment } from '@/lib/fees'
import { formatDateTime } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import type { VerificationCase } from '@/types/domain'

const gbp = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
    n,
  )

/**
  What the client paid and how it splits. Four fee types are never merged: the
  ACSP's professional fee is shown on its own, and the platform fee only on
  referred and B2C cases. An ACSP's own client carries no platform fee.
*/
export function useCasePaymentRows(vc: VerificationCase) {
  const { data } = useDemoStore()
  const p = vc.payment
  if (!p) return undefined
  const split = splitPayment(p.amount, vc.source ?? 'referred', data.billing.settings)
  const platformFee = p.platformFee ?? split.platformFee
  const platformFeeVat = p.platformFeeVat ?? split.platformFeeVat
  return {
    payment: p,
    gross: p.amount,
    providerFee: p.providerFee ?? split.providerFee,
    platformFee,
    platformFeeVat,
    platformFeeGross: Math.round((platformFee + platformFeeVat) * 100) / 100,
    net: p.netPayout ?? split.net,
    referred: carriesPlatformFee(vc.source ?? 'referred'),
  }
}

export function CasePayment({
  vc,
  acspName,
  className,
}: {
  vc: VerificationCase
  acspName: string
  className?: string
}) {
  const rows = useCasePaymentRows(vc)
  if (!rows)
    return (
      <Panel className={className ?? 'p-5 sm:p-6'}>
        <MonoLabel>Payment</MonoLabel>
        <p className="mt-3 text-base text-slate">
          No payment recorded on this case yet.
        </p>
      </Panel>
    )
  const { payment: p } = rows
  const line = (label: string, value: string, strong = false) => (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-[0.9375rem] text-graphite">{label}</dt>
      <dd
        className={
          strong
            ? 'text-base font-medium text-ink tabular'
            : 'text-[0.9375rem] text-ink tabular'
        }
      >
        {value}
      </dd>
    </div>
  )
  return (
    <Panel className={className ?? 'p-5 sm:p-6'} aria-label="Payment">
      <MonoLabel>Payment to {acspName}</MonoLabel>
      <p className="mt-2 text-[0.9375rem] text-slate">
        {p.method === 'agent_payment_code'
          ? `Paid by ${p.payerName ?? 'the Referral Partner'} on the client's behalf with single-use Agent Payment Code ${p.code ?? ''}.`
          : 'Paid by the client by card.'}
        {p.paidAt && ` ${formatDateTime(p.paidAt)}.`}
      </p>
      <dl className="mt-3 divide-y divide-line/70">
        {line('ACSP Professional Fee', gbp(rows.gross), true)}
        {line('Payment provider fee (borne by the ACSP)', `-${gbp(rows.providerFee)}`)}
        {rows.referred ? (
          <>
            {line(
              'Platform Fee, deducted automatically',
              `-${gbp(rows.platformFeeGross)}`,
            )}
            <p className="py-1.5 text-[0.8125rem] text-slate">
              {gbp(rows.platformFee)} plus VAT {gbp(rows.platformFeeVat)}.
              Referred and B2C cases only.
            </p>
          </>
        ) : (
          <div className="py-1.5">
            <dt className="text-[0.9375rem] text-graphite">Platform Fee</dt>
            <dd className="text-[0.9375rem] font-medium text-ink">
              None. Included in your subscription.
            </dd>
          </div>
        )}
        {line(
          'Paid out to your payment account',
          gbp(rows.net),
          true,
        )}
      </dl>
      <p className="mt-3 text-[0.8125rem] leading-snug text-slate">
        {p.reference}
        {p.clientInvoiceId &&
          `. Client invoice ${p.clientInvoiceId}, issued in ${acspName}'s name.`}
        {p.payoutAt && ` Paid out ${formatDateTime(p.payoutAt)}.`}
      </p>
      <p className="mt-2 text-[0.8125rem] leading-snug text-slate">
        Evidence One collected this payment as {acspName}'s disclosed agent.{' '}
        {acspName} is the merchant of record.
      </p>
    </Panel>
  )
}
