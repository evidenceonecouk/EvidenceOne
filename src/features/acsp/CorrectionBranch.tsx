import {
  CalendarClock,
  CircleCheck,
  Hourglass,
  ReceiptText,
} from 'lucide-react'
import { PendingDecision } from '@/components/PendingDecision'
import { formatDateTime, formatMoney } from '@/lib/format'
import { paymentTotal } from '@/lib/fees'
import { useDemoStore } from '@/store/DemoStore'
import { markRegisterCorrected } from '@/store/correctionActions'
import type { VerificationCase } from '@/types/domain'

/*
  The ACSP's view of the register correction branch (G2-10 and G2-13). The
  ACSP carries out the correction at Companies House outside the platform,
  because Route B filing is the held option O2. The platform tracks it with a
  "Register corrected" tick and its date. Design interpretation: confirm with
  the client.
*/

const STAGE_LABEL = {
  awaiting_client_approval: 'Awaiting client approval of revised total',
  awaiting_register_correction: 'Awaiting register correction',
  register_corrected: 'Register corrected',
  declined_by_client: 'Client declined the revised total',
} as const

export function CorrectionBranch({
  vc,
  reviewerId,
  decidable,
}: {
  vc: VerificationCase
  reviewerId: string
  decidable: boolean
}) {
  const { apply } = useDemoStore()
  const b = vc.registerCorrection
  if (!b || !vc.payment) return null
  const base = vc.payment.amount
  const total = paymentTotal({ amount: base, addOn: { amount: b.amount } })
  const heldByApcode = vc.payment.method === 'agent_payment_code'
  return (
    <div
      data-cite="declared:correction"
      className="border-b border-line/70 bg-white px-5 py-5 sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ReceiptText className="size-5 text-ink" aria-hidden="true" />
        <h3 className="text-base font-medium text-ink">
          Register correction: {STAGE_LABEL[b.stage]}
        </h3>
        <PendingDecision />
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-[0.9375rem] sm:grid-cols-[14rem_1fr]">
        <dt className="text-slate">What will be corrected</dt>
        <dd className="text-ink">{b.description}</dd>
        <dt className="text-slate">Verification fee</dt>
        <dd className="text-ink">{formatMoney(base)}</dd>
        <dt className="text-slate">Correction add-on</dt>
        <dd className="text-ink">
          {formatMoney(b.amount)}, set by you. Part of your Professional Fee,
          shown as its own line.
        </dd>
        <dt className="text-slate">Revised total</dt>
        <dd className="font-medium text-ink">{formatMoney(total)}</dd>
      </dl>
      {heldByApcode && (
        <p className="mt-2 text-[0.875rem] text-slate">
          The base fee was paid with an Agent Payment Code. The add-on is shown
          as paid by the client. Who pays the add-on in that case has not been
          decided.
        </p>
      )}
      {b.stage === 'awaiting_client_approval' && (
        <p className="mt-3 flex items-center gap-2 text-base text-graphite">
          <Hourglass className="size-4" aria-hidden="true" />
          The client has the revised total in their case status and messages.
          Raised {formatDateTime(b.raisedAt)}. Nothing is taken.
        </p>
      )}
      {b.stage === 'declined_by_client' && (
        <p className="mt-3 text-base text-graphite">
          The client declined on {formatDateTime(b.clientDeclinedAt!)}. You can
          proceed without a correction, request information, or decline.
        </p>
      )}
      {(b.stage === 'awaiting_register_correction' ||
        b.stage === 'register_corrected') && (
        <div className="mt-3 rounded-xl bg-mist/60 px-4 py-3">
          <p className="flex items-center gap-2 text-[0.9375rem] text-graphite">
            <CalendarClock className="size-4" aria-hidden="true" />
            Client approved {formatDateTime(b.clientApprovedAt!)}. A second
            authorisation of {formatMoney(b.amount)} was placed. Expected{' '}
            {formatDateTime(b.expectedFrom!)} to {formatDateTime(b.expectedBy!)}
            .
          </p>
          <p className="mt-2 text-[0.9375rem] text-graphite">
            You carry out the correction at Companies House, outside the
            platform. Then tick Register corrected.
          </p>
          {b.stage === 'register_corrected' ? (
            <p className="mt-3 flex items-center gap-2 text-base font-medium text-approve">
              <CircleCheck className="size-5" aria-hidden="true" />
              Register corrected {formatDateTime(b.registerCorrectedAt!)}
              {b.registerCorrectedBy ? `, ${b.registerCorrectedBy}` : ''}.
              Approve is available.
            </p>
          ) : (
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-base text-ink">
              <input
                type="checkbox"
                className="mt-1 size-5 accent-ink"
                checked={false}
                disabled={!decidable}
                onChange={() =>
                  apply((d) => markRegisterCorrected(d, vc.id, reviewerId))
                }
              />
              Register corrected
            </label>
          )}
        </div>
      )}
      {b.releasedAt && (
        <p className="mt-3 text-base text-graphite">
          Both authorisations were released on {formatDateTime(b.releasedAt)}.
          Nothing was taken.
        </p>
      )}
    </div>
  )
}
