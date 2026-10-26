import { ReceiptText } from 'lucide-react'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import { paymentTotal } from '@/lib/fees'
import { formatDateTime, formatMoney } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import { answerRevisedTotal } from '@/store/correctionActions'
import type { VerificationCase } from '@/types/domain'

/*
  The individual's view of the register correction branch (G2-10 and G2-13).
  The ACSP decided a difference needs correcting before approval and raised a
  fee. The individual sees the original total, the add-on and the revised total,
  and approves or declines. Approving is a second authorisation. Nothing is
  taken until the ACSP approves.
*/
export function CorrectionRequest({
  vc,
  acsp,
}: {
  vc: VerificationCase
  acsp: string
}) {
  const { apply } = useDemoStore()
  const b = vc.registerCorrection
  const pay = vc.payment
  if (!b || !pay || b.stage === 'declined_by_client') return null
  const total = paymentTotal({
    amount: pay.amount,
    addOn: { amount: b.amount },
  })
  if (b.releasedAt)
    return (
      <p className="mt-3 rounded-2xl bg-mist px-4 py-3 text-[0.9375rem] text-ink">
        Nothing was taken. Both authorisations were released on{' '}
        {formatDateTime(b.releasedAt)}.
      </p>
    )
  return (
    <div
      role="group"
      aria-label="Register correction"
      className="mt-4 rounded-2xl border border-ink bg-white p-4"
    >
      <p className="flex items-center gap-2 text-base font-medium text-ink">
        <ReceiptText className="size-5 shrink-0" aria-hidden="true" />
        {b.stage === 'awaiting_client_approval'
          ? 'A correction is needed on the register'
          : b.stage === 'awaiting_register_correction'
            ? 'Awaiting register correction'
            : 'The register has been corrected'}
      </p>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite">
        {acsp} needs to correct your details on the Companies House register
        before it can approve your verification: {b.description}.
      </p>
      <dl className="mt-3 divide-y divide-line/70 text-[0.9375rem]">
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-graphite">Original total</dt>
          <dd className="text-ink tabular">{formatMoney(pay.amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-graphite">Correction add-on</dt>
          <dd className="text-ink tabular">{formatMoney(b.amount)}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="font-medium text-ink">Revised total</dt>
          <dd className="font-medium text-ink tabular">{formatMoney(total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[0.9375rem] font-medium text-ink">
        You are only charged when {acsp} approves your verification.
      </p>
      {pay.method === 'agent_payment_code' && (
        <p className="mt-2 flex flex-wrap items-center gap-2 text-[0.875rem] text-slate">
          The correction add-on is paid by you.
          <PendingDecision />
        </p>
      )}
      {b.stage === 'awaiting_client_approval' ? (
        <div className="mt-3 flex flex-col gap-2">
          <Button
            onClick={() => apply((d) => answerRevisedTotal(d, vc.id, true))}
          >
            Approve the revised total of {formatMoney(total)}
          </Button>
          <Button
            variant="outline"
            onClick={() => apply((d) => answerRevisedTotal(d, vc.id, false))}
          >
            Decline the revised total
          </Button>
          <p className="text-[0.8125rem] text-slate">
            Approving places a second authorisation on your card for the
            correction. Nothing is taken now.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[0.9375rem] text-graphite">
          {b.stage === 'awaiting_register_correction'
            ? `You approved on ${formatDateTime(b.clientApprovedAt!)}. ${acsp} is correcting the register. This usually takes 24 to 48 hours.`
            : `The register was corrected on ${formatDateTime(b.registerCorrectedAt!)}. ${acsp} will now complete its review.`}
        </p>
      )}
    </div>
  )
}
