import { CircleAlert, Handshake, Layers, Repeat } from 'lucide-react'
import type { ReactNode } from 'react'
import { Panel } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { UsageBar } from '@/components/app/UsageBar'
import { Button } from '@/components/ui/button'
import { PACKAGE_INCLUDES, PACKAGES_PROVISIONAL_NOTE } from '@/data/packages'
import { StateBadge } from '@/features/admin/kit'
import { gbp, planUsage } from '@/lib/billing'
import { useDemoStore } from '@/store/DemoStore'
import type { AcspFirm } from '@/types/domain'
import { Note } from './BillingParts'

function PlanCard({
  icon,
  title,
  applies,
  children,
  badge,
}: {
  icon: ReactNode
  title: string
  applies: string
  children: ReactNode
  badge?: ReactNode
}) {
  return (
    <Panel className="flex flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start gap-3">
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
        {badge && <span className="ml-auto">{badge}</span>}
      </div>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-graphite">
        {children}
      </div>
    </Panel>
  )
}

/**
  How an ACSP pays Evidence One: the platform fee on referred and B2C cases,
  and optionally a subscription package (Easy, Pro or Scale) for its own
  clients. Referred cases sit outside the package allowance.
*/
export function BillingPlan({ acsp }: { acsp: AcspFirm }) {
  const { data } = useDemoStore()
  const toast = useToast()
  const s = data.billing.settings
  const usage = planUsage(data, acsp)
  const pkg = usage.pkg
  const vat = Math.round(s.platformFee * s.vatRate * 100) / 100
  const upgrade = () =>
    toast({
      title: 'Request sent',
      description:
        'A Platform Administrator will contact you about a larger package or added storage. Nothing changes until you agree.',
    })

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <PlanCard
          icon={<Handshake className="size-5" />}
          title="Referred and B2C cases"
          applies="Platform fee, deducted when the payment is taken"
        >
          <p className="text-[2rem] leading-none font-medium tracking-[-0.03em] text-ink">
            {gbp(s.platformFee)}{' '}
            <span className="text-base font-normal tracking-normal text-slate">
              plus VAT ({gbp(s.platformFee + vat)} with VAT) per case
            </span>
          </p>
          <p>
            Applies to a client who reaches you through a Referral Partner or
            directly through the platform. Evidence One deducts it from the
            payment when it is taken on your approval, and its invoices document
            the amount deducted.
          </p>
          <p>
            It never applies to your own clients, and referred cases never count
            towards your package.
          </p>
        </PlanCard>

        <PlanCard
          icon={<Repeat className="size-5" />}
          title="Your own clients"
          applies={
            pkg
              ? `${pkg.name} package, monthly subscription`
              : 'No subscription package'
          }
          badge={<StateBadge tone="info">Provisional</StateBadge>}
        >
          {pkg ? (
            <>
              <p className="text-[2rem] leading-none font-medium tracking-[-0.03em] text-ink">
                {gbp(pkg.monthlyPrice)}{' '}
                <span className="text-base font-normal tracking-normal text-slate">
                  a month, up to {pkg.casesIncluded} own-client cases
                </span>
              </p>
              <p>
                {gbp(pkg.extraCaseFee)} for each additional case.{' '}
                {pkg.storageGb} GB of storage for your account, kept for seven
                years. Up to {pkg.filesPerCase} files of {pkg.maxFileMb} MB each
                per verification request.
              </p>
            </>
          ) : (
            <>
              <p className="text-[1.5rem] leading-tight font-medium text-ink">
                Referred cases only
              </p>
              <p>
                Without a package your records are kept for seven years in
                archive storage. Route B filings and ongoing monitoring need a
                package.
              </p>
            </>
          )}
          <p className="text-[0.9375rem] text-slate">
            {PACKAGES_PROVISIONAL_NOTE}
          </p>
        </PlanCard>
      </div>

      {pkg && <UsagePanel acsp={acsp} onUpgrade={upgrade} />}

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Layers className="size-5 text-ink" aria-hidden="true" />
          <h3 className="text-lg font-medium text-ink">Packages</h3>
          <StateBadge tone="info">Provisional</StateBadge>
        </div>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {s.packages.map((p) => {
            const mine = p.id === pkg?.id
            return (
              <li
                key={p.id}
                className={`rounded-xl border p-4 ${mine ? 'border-ink bg-mist/50' : 'border-line'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-medium text-ink">{p.name}</p>
                  {mine && (
                    <span className="rounded-full border border-ink/20 bg-mist px-3 py-0.5 text-[0.875rem] font-medium text-ink">
                      Your package
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[1.5rem] leading-tight font-medium text-ink tabular">
                  {gbp(p.monthlyPrice)}
                  <span className="ml-1 text-base font-normal text-slate">
                    a month
                  </span>
                </p>
                <ul className="mt-3 space-y-1 text-base text-graphite">
                  <li>Up to {p.casesIncluded} own-client cases a month</li>
                  <li>{p.storageGb} GB storage, account total</li>
                  <li>
                    {p.filesPerCase} files per request, up to {p.maxFileMb} MB
                    each
                  </li>
                  <li>{gbp(p.extraCaseFee)} per additional case</li>
                </ul>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 text-base text-graphite">
          Every package includes: {PACKAGE_INCLUDES.join(', ').toLowerCase()}.
        </p>
        <dl className="mt-4 grid gap-3 text-base sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <dt className="font-medium text-ink">Route B filings</dt>
            <dd className="mt-1 text-graphite">
              Available on subscription plans only.
            </dd>
          </div>
          <div className="rounded-xl border border-line p-4">
            <dt className="flex flex-wrap items-center gap-2 font-medium text-ink">
              Ongoing PEP and sanctions monitoring
              <StateBadge tone="neutral">Later</StateBadge>
            </dt>
            <dd className="mt-1 text-graphite">
              Subscription only. Off at launch.
            </dd>
          </div>
        </dl>
      </Panel>

      <Note title="Who changes these fees">
        The platform fee and the subscription packages are set by a Super
        Administrator with a second approver. Your professional fee for each
        verification is yours to set, in your ACSP profile.
      </Note>
    </div>
  )
}

function UsagePanel({
  acsp,
  onUpgrade,
}: {
  acsp: AcspFirm
  onUpgrade: () => void
}) {
  const { data } = useDemoStore()
  const u = planUsage(data, acsp)
  const pkg = u.pkg!
  const prompt = u.atCaseLimit || u.atStorageLimit
  return (
    <Panel className="p-5 sm:p-6">
      <h3 className="text-lg font-medium text-ink">This month</h3>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <UsageBar
          label="Own-client cases"
          used={u.ownClientCases}
          limit={pkg.casesIncluded}
          unit="cases"
        />
        <UsageBar
          label="Storage, account total"
          used={u.storageUsedGb}
          limit={pkg.storageGb}
          unit="GB"
        />
      </div>
      <dl className="mt-5 divide-y divide-line/70 border-y border-line/70 text-base">
        <div className="flex flex-wrap justify-between gap-2 py-3">
          <dt className="text-graphite">
            Referred cases: covered by the £69, not counted
          </dt>
          <dd className="text-ink tabular">{u.referredCases}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 py-3">
          <dt className="text-graphite">
            Additional cases at {gbp(pkg.extraCaseFee)} each
          </dt>
          <dd className="text-ink tabular">
            {u.extraCases > 0
              ? `${u.extraCases}, ${gbp(u.extraCasesCharge)}`
              : 'None'}
          </dd>
        </div>
      </dl>
      {prompt && (
        <div
          role="note"
          className="mt-5 flex flex-wrap items-start gap-3 rounded-xl border border-info/30 bg-info-wash px-4 py-3"
        >
          <CircleAlert
            className="mt-0.5 size-5 shrink-0 text-info"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-ink">
              Upgrade your package or add storage
            </p>
            <p className="mt-1 text-base text-graphite">
              {u.atCaseLimit
                ? `You have used your ${pkg.casesIncluded} own-client cases this month. Each further case is ${gbp(pkg.extraCaseFee)}.`
                : 'Your storage is nearly full.'}{' '}
              Storage is a fair-use guide: no retained record is ever deleted
              because of it.
            </p>
          </div>
          <Button variant="outline" onClick={onUpgrade}>
            Ask about upgrading
          </Button>
        </div>
      )}
    </Panel>
  )
}
