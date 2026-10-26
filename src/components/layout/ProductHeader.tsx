import { NavLink, Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAcsp, getPartner } from '@/store/selectors'
import { useDemoStore, useShowHeldOptions } from '@/store/DemoStore'
import type { PersonaId } from '@/types/domain'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const navByPersona: Record<PersonaId, NavItem[]> = {
  partner: [
    { to: '/partner', label: 'Dashboard', end: true },
    { to: '/partner/lookup', label: 'Companies House lookup' },
    { to: '/partner/invites', label: 'Invites' },
    { to: '/partner/requests', label: 'Requests' },
  ],
  reviewer: [
    { to: '/acsp/queue', label: 'Review queue' },
    { to: '/acsp/filings', label: 'Filings' },
    { to: '/records', label: 'Records' },
  ],
  individual: [],
  b2c: [],
  platformAdmin: [
    { to: '/admin', label: 'Operations', end: true },
    { to: '/admin/compliance', label: 'Compliance' },
    { to: '/admin/audit', label: 'Audit trail' },
  ],
  superAdmin: [{ to: '/super', label: 'Approvals' }],
}

const publicLinks = [
  ['For ACSPs', '#for-acsps'],
  ['For partners', '#for-partners'],
  ['How it works', '#how-it-works'],
  ['Platform', '#platform-title'],
] as const

const suffixByPersona: Record<PersonaId, string | undefined> = {
  partner: 'Portal',
  reviewer: 'Compliance',
  individual: 'Verify',
  b2c: 'Verify',
  platformAdmin: 'Admin',
  superAdmin: 'Admin',
}

function OrgBadge({ persona }: { persona: PersonaId }) {
  const { data, state } = useDemoStore()
  let primary: string | undefined
  let secondary: string | undefined
  if (persona === 'partner') {
    const partner = getPartner(data, state.partnerId)
    primary = partner?.name
    secondary = partner ? `Referral Partner · ${partner.country}` : undefined
  } else if (persona === 'reviewer') {
    const acsp = getAcsp(data, state.acspId)
    primary = acsp?.reviewers[0].name
    secondary = acsp?.name
  } else if (persona === 'platformAdmin' || persona === 'superAdmin') {
    primary =
      persona === 'superAdmin'
        ? state.superAdminSeat === 2
          ? 'Daniel Achebe'
          : 'Helen Carver'
        : 'Marcus Adeyemi'
    secondary =
      persona === 'superAdmin'
        ? 'Super Administrator'
        : 'Platform Administrator'
  }
  if (!primary) return null
  return (
    <div className="hidden text-right leading-tight md:block">
      <div className="text-[0.9375rem] font-medium text-ink">{primary}</div>
      <div className="text-sm text-slate">{secondary}</div>
    </div>
  )
}

export function ProductHeader({
  persona,
  publicNav = false,
  className,
}: {
  persona: PersonaId
  publicNav?: boolean
  className?: string
}) {
  const showHeldOptions = useShowHeldOptions()
  // Route B filings are a held option (O2): hidden with the held options.
  const items = publicNav
    ? []
    : navByPersona[persona].filter(
        (i) => showHeldOptions || i.to !== '/acsp/filings',
      )
  return (
    <header
      className={cn(
        'sticky top-0 z-30 print:hidden border-b border-line/80 backdrop-blur-xl backdrop-saturate-150',
        publicNav ? 'bg-[#f4f4f3]/[0.92]' : 'bg-white/[0.92]',
        className,
      )}
    >
      <div
        className={cn(
          'relative mx-auto flex max-w-[88rem] items-center gap-6 px-4 sm:px-6',
          publicNav ? 'h-20' : 'h-16',
        )}
      >
        <Link to="/" className="rounded-lg" aria-label="Evidence One home">
          {publicNav ? (
            <Wordmark />
          ) : (
            <Logo suffix={suffixByPersona[persona]} />
          )}
        </Link>
        {items.length > 0 && (
          <nav
            aria-label="Main"
            className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto"
          >
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-150',
                    isActive
                      ? 'bg-ink/[0.06] text-ink'
                      : 'text-slate hover:bg-ink/[0.04] hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3">
          {publicNav ? (
            <>
              <nav
                aria-label="Main"
                className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 xl:flex"
              >
                {publicLinks.map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="rounded-lg px-3 py-2 text-[0.9375rem] text-ink transition-colors duration-150 hover:bg-ink/[0.05]"
                  >
                    {label}
                  </a>
                ))}
              </nav>
              <Link
                to="/signin"
                className="hidden rounded-lg px-3 py-2 text-base text-ink hover:bg-ink/[0.05] sm:inline-block"
              >
                Log in
              </Link>
              <Button asChild size="sm" className="rounded-full px-5">
                <Link to="/verify">
                  Get started
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </>
          ) : (
            <OrgBadge persona={persona} />
          )}
        </div>
      </div>
    </header>
  )
}
