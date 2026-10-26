import { CircleCheck, Hourglass } from 'lucide-react'
import { ProviderConfirmation } from '@/components/ProviderConfirmation'
import { Button } from '@/components/ui/button'
import {
  PROVIDER_STATUSES,
  PROVIDER_STATUS_LABEL,
  arePaymentsActive,
} from '@/lib/payments'
import { cn } from '@/lib/utils'
import type { PaymentProviderStatus } from '@/types/domain'

/*
  G2-02: the two gates side by side. Payments are active only when the secure
  payment provider shows Eligible and Evidence One has approved. Evidence One
  never holds the ACSP's bank credentials, so there is nothing to show but the
  two statuses.
*/

function Gate({
  title,
  met,
  value,
  note,
}: {
  title: string
  met: boolean
  value: string
  note: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        met ? 'border-approve/40 bg-approve-wash/40' : 'border-line bg-white',
      )}
    >
      <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-ink">
        {met ? (
          <CircleCheck className="size-4 text-approve" aria-hidden="true" />
        ) : (
          <Hourglass className="size-4 text-slate" aria-hidden="true" />
        )}
        {title}
      </p>
      <p className="mt-1 text-base font-medium text-ink">
        <span className="sr-only">{met ? 'Met. ' : 'Not met. '}</span>
        {value}
      </p>
      <p className="mt-1 text-[0.875rem] text-slate">{note}</p>
    </div>
  )
}

export function PaymentGates({
  providerStatus,
  evidenceOneApproved,
  onSimulate,
}: {
  providerStatus: PaymentProviderStatus
  evidenceOneApproved: boolean
  /** Presenter control: the provider reports a new status. Only shown once the ACSP exists. */
  onSimulate?: (s: PaymentProviderStatus) => void
}) {
  const active = arePaymentsActive({ providerStatus, evidenceOneApproved })
  return (
    <section aria-label="Payment activation" className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-[0.9375rem] font-medium text-ink">
          Payment activation
        </h3>
        <ProviderConfirmation label="Subject to payment provider confirmation" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Gate
          title="Gate 1: secure payment provider"
          met={providerStatus === 'eligible'}
          value={PROVIDER_STATUS_LABEL[providerStatus]}
          note="Business, representative and payout details are held by the provider, never by Evidence One."
        />
        <Gate
          title="Gate 2: Evidence One approval"
          met={evidenceOneApproved}
          value={evidenceOneApproved ? 'Approved' : 'Waiting for approval'}
          note="Given when a Platform Administrator approves the ACSP."
        />
      </div>
      <p
        className={cn(
          'rounded-xl px-4 py-3 text-base font-medium',
          active ? 'bg-approve-wash text-approve' : 'bg-mist text-graphite',
        )}
      >
        {active
          ? 'Payments active'
          : 'Payments not active. Both gates must be met. Until then the ACSP is not allocated paid cases and is not offered in referral matching.'}
      </p>
      {onSimulate && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.875rem] text-slate">
            Presenter control. The provider reports:
          </span>
          {PROVIDER_STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === providerStatus ? 'default' : 'outline'}
              aria-pressed={s === providerStatus}
              onClick={() => onSimulate(s)}
            >
              {PROVIDER_STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      )}
    </section>
  )
}
