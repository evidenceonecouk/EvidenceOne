import { Handshake, Layers, Repeat } from 'lucide-react'
import type { ReactNode } from 'react'
import { Panel } from '@/components/app/Page'
import { PendingDecision } from '@/components/PendingDecision'
import { gbp } from '@/lib/billing'
import { formatDate } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import type { AcspFirm } from '@/types/domain'
import { Note } from './BillingParts'

function PlanCard({
  icon,
  title,
  applies,
  children,
  current,
}: {
  icon: ReactNode
  title: string
  applies: string
  children: ReactNode
  current?: boolean
}) {
  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-medium text-ink">{title}</h3>
          <p className="text-base text-slate">{applies}</p>
        </div>
        {current && (
          <span className="ml-auto rounded-full border border-ink/20 bg-mist px-3 py-1 text-[0.875rem] font-medium whitespace-nowrap text-ink">
            Your plan
          </span>
        )}
      </div>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-graphite">
        {children}
      </div>
    </Panel>
  )
}

/** The two ways an ACSP pays Evidence One: a platform fee on referred cases, a subscription for its own clients. */
export function BillingPlan({ acsp }: { acsp: AcspFirm }) {
  const { data } = useDemoStore()
  const s = data.billing.settings
  const withCases = acsp.plan.subscription === 'monthly_with_cases'
  const vat = Math.round(s.platformFee * s.vatRate * 100) / 100
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <PlanCard
          icon={<Handshake className="size-5" />}
          title="Referred and B2C cases"
          applies="Platform fee, deducted automatically"
        >
          <p className="text-[2rem] leading-none font-medium tracking-[-0.03em] text-ink">
            {gbp(s.platformFee)}{' '}
            <span className="text-base font-normal tracking-normal text-slate">
              plus VAT ({gbp(s.platformFee + vat)} with VAT) per case
            </span>
          </p>
          <p>
            Applies to a client who reaches you through a Referral Partner or
            directly through the platform. Evidence One deducts it from each
            payment before paying you out, and its invoices document the amount
            deducted.
          </p>
          <p>It never applies to your own clients.</p>
        </PlanCard>

        <PlanCard
          icon={<Repeat className="size-5" />}
          title="Your own clients"
          applies="Monthly subscription instead of the platform fee"
        >
          <p className="text-[2rem] leading-none font-medium tracking-[-0.03em] text-ink">
            Price not set
          </p>
          <p>
            Terms to be set by the client by{' '}
            <span className="font-medium text-ink">
              {formatDate(s.subscription.termsDueBy)}
            </span>
            .
          </p>
          <PendingDecision />
          <p>
            {withCases
              ? `You are on a monthly fee with ${acsp.plan.casesIncluded ?? 'a number of'} cases included.`
              : 'You are on a monthly fee alone.'}
          </p>
        </PlanCard>
      </div>

      <Panel className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Layers className="size-5 text-ink" aria-hidden="true" />
          <h3 className="text-lg font-medium text-ink">
            The two subscription structures
          </h3>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            {
              key: 'monthly_only',
              title: 'A monthly fee alone',
              body: 'One monthly fee covers all of your own clients. No per-case charge.',
            },
            {
              key: 'monthly_with_cases',
              title: 'A monthly fee with a number of cases included',
              body: 'One monthly fee includes a set number of own-client cases each month. The number of cases included is not set either.',
            },
          ].map((o) => (
            <div
              key={o.key}
              className={`rounded-xl border p-4 ${acsp.plan.subscription === o.key ? 'border-ink bg-mist/50' : 'border-line'}`}
            >
              <p className="text-base font-medium text-ink">{o.title}</p>
              <p className="mt-1 text-base text-graphite">{o.body}</p>
              <p className="mt-3 text-base font-medium text-ink">
                Price not set
              </p>
              <p className="text-base text-slate">
                Terms to be set by the client by{' '}
                {formatDate(s.subscription.termsDueBy)}.
              </p>
              <div className="mt-2">
                <PendingDecision />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Note title="Who changes these fees">
        The platform fee and the subscription plans are set by a Super
        Administrator with a second approver. Your professional fee for each
        verification is yours to set, in your ACSP profile.
      </Note>
    </div>
  )
}
