import { Handshake } from 'lucide-react'
import { useId, useState } from 'react'
import { Checkbox } from '@/components/app/Page'
import { cn } from '@/lib/utils'

/**
  The referral arrangement disclosure shown before payment, only when referral
  commissions are On and the partner wishes to receive payment. With
  commissions Off nothing is shown (REF-01). The wording is the client's own.
  The person acknowledges, or consents where the partner's regulator requires
  it. The ACSP's fee is not changed by the arrangement.
*/
export function ReferralDisclosureCard({
  partnerName,
  amount,
  consentRequired,
  onAcknowledge,
  className,
}: {
  partnerName: string
  amount: number
  /** Whether the regulator requires consent rather than acknowledgement. */
  consentRequired: boolean
  onAcknowledge: (acknowledged: boolean) => void
  className?: string
}) {
  const [checked, setChecked] = useState(false)
  const id = useId()
  const label = consentRequired ? 'I consent' : 'I acknowledge'
  const money = Number.isInteger(amount) ? String(amount) : amount.toFixed(2)

  return (
    <section
      aria-label="Referral arrangement disclosure"
      className={cn(
        'rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgb(22_24_27/0.04)] sm:p-6',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
          <Handshake className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-lg leading-relaxed text-graphite">
            <strong className="font-medium text-ink">
              Referral arrangement disclosure.
            </strong>{' '}
            {partnerName} introduced you to Evidence One and may receive £
            {money} if you purchase this service. This commercial arrangement
            does not increase the price you pay.
          </p>
        </div>
      </div>
      <label
        htmlFor={`${id}-ack`}
        className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-mist/60 px-4 py-3.5 text-lg text-ink"
      >
        <Checkbox
          id={`${id}-ack`}
          className="mt-0.5"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked)
            onAcknowledge(e.target.checked)
          }}
        />
        <span>
          <span className="font-medium">{label}</span>
          <span className="mt-0.5 block text-base text-slate">
            {consentRequired
              ? 'The regulator that supervises this partner requires your consent before payment.'
              : 'Please confirm you have read this before payment.'}
          </span>
        </span>
      </label>
    </section>
  )
}
