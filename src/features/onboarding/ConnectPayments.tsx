import { CheckCircle2, Circle, ExternalLink, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Wordmark } from '@/components/brand/Wordmark'
import { ProviderConfirmation } from '@/components/ProviderConfirmation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CONNECT_STAGES,
  NO_BANK_DETAILS_LINE,
  PROVIDER_STATUS_LABEL,
} from '@/lib/payments'
import { cn } from '@/lib/utils'
import type { PaymentProviderStatus } from '@/types/domain'

/*
  G2-02: Connect payments, in the ACSP onboarding commercial step. The ACSP
  registers, connects payments, and the secure payment provider collects the
  business, representative and payout details on its own screens. Evidence One
  holds only the status. There is no bank account number, sort code or any
  bank credential field anywhere in this demo.
*/

const stageDone = (stage: number, status: PaymentProviderStatus) => {
  if (stage === 0) return true
  if (stage === 1) return status !== 'not_started'
  if (stage === 2)
    return status === 'more_information_needed' || status === 'eligible'
  if (stage === 3) return status === 'eligible'
  return false
}

export function ConnectPayments({
  status,
  onChange,
}: {
  status: PaymentProviderStatus
  onChange: (s: PaymentProviderStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const back = (s: PaymentProviderStatus) => {
    onChange(s)
    setOpen(false)
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ProviderConfirmation label="Subject to payment provider confirmation" />
        <span className="text-[0.9375rem] text-graphite">
          Status with the secure payment provider:{' '}
          <strong className="font-medium text-ink">
            {PROVIDER_STATUS_LABEL[status]}
          </strong>
        </span>
      </div>
      <p className="text-base text-graphite">
        Clients pay you. Evidence One collects the payment as your disclosed
        agent, and the secure payment provider pays out to your own account.
        Payments activate only when the provider’s requirements and Evidence
        One’s own approval are both met.
      </p>
      <ol aria-label="Connect payments stages" className="space-y-2">
        {CONNECT_STAGES.map((t, i) => {
          const done = stageDone(i, status)
          return (
            <li key={t} className="flex items-start gap-3 text-base text-ink">
              {done ? (
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-approve"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="mt-0.5 size-5 shrink-0 text-slate"
                  aria-hidden="true"
                />
              )}
              <span>
                <span className="sr-only">
                  {done ? 'Done. ' : 'Not done yet. '}
                </span>
                {i + 1}. {t}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="rounded-xl bg-mist/60 px-4 py-3 text-[0.9375rem] text-graphite">
        {NO_BANK_DETAILS_LINE}
      </p>
      {status === 'eligible' ? (
        <p className="text-base font-medium text-approve">
          The secure payment provider shows your account as Eligible. Payments
          go live when Evidence One approves your registration.
        </p>
      ) : (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <ExternalLink aria-hidden="true" />
          {status === 'not_started'
            ? 'Connect payments'
            : 'Continue connecting payments'}
        </Button>
      )}
      {status === 'more_information_needed' && (
        <p className="text-base text-ink">
          The secure payment provider needs more information. Continue with the
          provider to finish.
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn('sm:max-w-lg')}>
          <DialogHeader>
            <Wordmark />
            <p className="mt-4 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
              Evidence One · Leaving the platform
            </p>
            <DialogTitle className="text-[1.5rem] leading-tight font-medium">
              You are continuing with the secure payment provider
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-graphite">
              In the live platform this opens the secure payment provider’s own
              onboarding. It collects your business details, your
              representative’s details and your payout details, then confirms
              whether your account can receive payments and payouts.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-line bg-mist/60 px-5 py-4 text-[0.9375rem] leading-relaxed text-graphite">
            <p className="font-medium text-ink">This is a demonstration</p>
            <p className="mt-1">
              The screens of the provider are not shown or imitated here.{' '}
              {NO_BANK_DETAILS_LINE}
            </p>
          </div>
          <DialogFooter className="sm:flex-col sm:items-stretch">
            <Button type="button" size="lg" onClick={() => back('eligible')}>
              <Undo2 aria-hidden="true" />
              Simulate return: provider confirms Eligible
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => back('more_information_needed')}
            >
              Simulate return: more information needed
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => back('in_progress')}
            >
              Simulate return: still in progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
