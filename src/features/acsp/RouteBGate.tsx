import { Lock, Waypoints } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Page, PageHeader, Panel } from '@/components/app/Page'
import { HeldOptionBadge } from '@/components/HeldOption'
import { Button } from '@/components/ui/button'
import { hasSubscription } from '@/lib/billing'
import {
  useActingAcsp,
  useDemoStore,
  useShowHeldOptions,
} from '@/store/DemoStore'

/*
  Route B filings are option O2, held until after go-live, and are available
  on subscription plans only (P2, decided 19 October). An ACSP without a
  package sees why, in place of the filing screens.
*/

export const ROUTE_B_SUBSCRIPTION_ONLY =
  'Filings are available on subscription plans'

/** Whether Route B is shown at all (held options on) and whether this ACSP can use it. */
export function useRouteB() {
  const { data } = useDemoStore()
  const { acsp } = useActingAcsp()
  return {
    shown: useShowHeldOptions(),
    available: hasSubscription(data, acsp),
  }
}

/** The note shown in place of a Route B action for an ACSP without a package. */
export function SubscriptionOnlyNote({ className }: { className?: string }) {
  return (
    <div
      role="note"
      className={`flex flex-wrap items-start gap-3 rounded-xl border border-line bg-mist px-4 py-3 ${className ?? ''}`}
    >
      <Lock
        className="mt-0.5 size-5 shrink-0 text-graphite"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-ink">
          {ROUTE_B_SUBSCRIPTION_ONLY}
        </p>
        <p className="mt-1 text-base text-graphite">
          Choose an Easy, Pro or Scale package to prepare and check Companies
          House filings here.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/acsp/billing">See packages</Link>
      </Button>
    </div>
  )
}

/** Wraps a Route B page: hidden with the held options, replaced for an ACSP without a package. */
export function RouteBGate({ children }: { children: ReactNode }) {
  const { shown, available } = useRouteB()
  if (!shown)
    return (
      <Page width="narrow">
        <PageHeader
          kicker="Route B · Filings"
          title="Filings are not shown"
          description="Route B filings are an option available after go-live. The presenter has hidden the held options."
        />
        <Button asChild variant="outline">
          <Link to="/acsp/queue">Back to the review queue</Link>
        </Button>
      </Page>
    )
  if (!available)
    return (
      <Page width="narrow">
        <PageHeader
          kicker="Route B · Filings"
          title={ROUTE_B_SUBSCRIPTION_ONLY}
          description="Evidence One prepares and checks Companies House filings, and you file them from your own WebFiling account. This is part of the Easy, Pro and Scale packages."
          meta={<HeldOptionBadge code="O2" />}
        />
        <Panel className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <Waypoints className="size-6 text-ink" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-base text-graphite">
            Your firm has no subscription package. Referred cases carry the
            platform fee and need no package.
          </p>
          <Button asChild>
            <Link to="/acsp/billing">See packages</Link>
          </Button>
        </Panel>
      </Page>
    )
  return <>{children}</>
}
