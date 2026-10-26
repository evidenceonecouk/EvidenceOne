import { MonoLabel, Panel } from '@/components/app/Page'
import { carriesPlatformFee, paymentTotal, splitPayment } from '@/lib/fees'
import { CircleCheck, CircleSlash, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { PAYMENT_STATUS_LABEL } from '@/lib/paymentStatus'
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
  const split = splitPayment(
    paymentTotal(p),
    vc.source ?? 'referred',
    data.billing.settings,
  )
  const platformFee = p.platformFee ?? split.platformFee
  const platformFeeVat = p.platformFeeVat ?? split.platformFeeVat
  return {
    payment: p,
    gross: paymentTotal(p),
    addOn: p.addOn,
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
      <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-0.5 text-[0.875rem] font-medium text-ink">
        {p.status === 'taken' ? (
          <CircleCheck className="size-4 text-approve" aria-hidden="true" />
        ) : p.status === 'released' ? (
          <CircleSlash className="size-4 text-slate" aria-hidden="true" />
        ) : (
          <Clock className="size-4 text-info" aria-hidden="true" />
        )}
        {PAYMENT_STATUS_LABEL[p.status]}
      </p>
      <p className="mt-2 text-[0.9375rem] text-slate">
        {p.method === 'agent_payment_code'
          ? `Paid by ${p.payerName ?? 'the Referral Partner'} on the client's behalf with single-use Agent Payment Code ${p.code ?? ''}, taken on approval.`
          : 'Paid by the client by card, taken on approval.'}{' '}
        Authorised {formatDateTime(p.authorisedAt)}.
        {p.status === 'taken' &&
          p.paidAt &&
          ` Taken when you approved, ${formatDateTime(p.paidAt)}.`}
        {p.status === 'authorised' &&
          ' Nothing is taken unless you approve. A decline or a lapse releases the authorisation.'}
      </p>
      {p.status === 'released' ? (
        <p className="mt-3 rounded-xl bg-mist px-4 py-3 text-[0.9375rem] text-ink">
          Nothing was taken.{' '}
          {p.releaseReason ?? 'The authorisation was released'}
          {p.releasedAt && `, ${formatDateTime(p.releasedAt)}`}. No invoice was
          issued.
        </p>
      ) : (
        <dl className="mt-3 divide-y divide-line/70">
          {line('ACSP Professional Fee', gbp(rows.gross), true)}
          {rows.addOn && (
            <>
              {line('Verification fee', gbp(p.amount))}
              {line(
                `Register correction add-on: ${rows.addOn.description}`,
                gbp(rows.addOn.amount),
              )}
              <p className="py-1.5 text-[0.8125rem] text-slate">
                The add-on is part of your Professional Fee, shown as its own
                line. It was authorised a second time when the client approved
                the revised total, {formatDateTime(rows.addOn.authorisedAt)}.
                The platform fee is deducted once, not per correction. It is
                paid by the client
                {p.method === 'agent_payment_code'
                  ? ' (who pays it under an Agent Payment Code is yet to be decided)'
                  : ''}
                .
              </p>
            </>
          )}
          {line(
            'Payment provider fee (borne by the ACSP)',
            `-${gbp(rows.providerFee)}`,
          )}
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
                None. Your own client carries no platform fee.
              </dd>
            </div>
          )}
          {line(
            p.status === 'taken'
              ? 'Paid out to your payment account'
              : 'Paid out on approval',
            gbp(rows.net),
            true,
          )}
        </dl>
      )}
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
