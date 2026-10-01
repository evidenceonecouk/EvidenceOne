import { NavLink, Link } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAcsp, getAgent } from '@/store/selectors'
import { useDemoStore } from '@/store/DemoStore'
import { PRIMARY_ACSP_ID } from '@/data/organisations'
import type { PersonaId } from '@/types/domain'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const navByPersona: Record<PersonaId, NavItem[]> = {
  agent: [
    { to: '/agent', label: 'Dashboard', end: true },
    { to: '/agent/lookup', label: 'Companies House lookup' },
    { to: '/agent/invites', label: 'Invites' },
  ],
  reviewer: [
    { to: '/acsp/queue', label: 'Review queue' },
    { to: '/acsp/filings', label: 'Filings' },
    { to: '/records/EO-2026-000118', label: 'Records' },
  ],
  individual: [],
  b2c: [],
  admin: [{ to: '/admin', label: 'ACSPs and allocation' }],
}

const publicLinks = [
  ['How it works', '#product-verify'],
  ['Platform', '#platform-title'],
  ['Who it is for', '#audiences-title'],
  ['Standards', '#standards-title'],
] as const

const suffixByPersona: Record<PersonaId, string | undefined> = {
  agent: 'Portal',
  reviewer: 'Compliance',
  individual: 'Verify',
  b2c: 'Verify',
  admin: 'Admin',
}

function OrgBadge({ persona }: { persona: PersonaId }) {
  const { data, state } = useDemoStore()
  let primary: string | undefined
  let secondary: string | undefined
  if (persona === 'agent') {
    const agent = getAgent(data, state.agentId)
    primary = agent?.name
    secondary = agent ? (agent.hasAcspStatus ? 'Agent with ACSP status' : 'Agent without ACSP status') : undefined
  } else if (persona === 'reviewer') {
    const acsp = getAcsp(data, PRIMARY_ACSP_ID)
    primary = acsp?.reviewers[0].name
    secondary = acsp?.name
  } else if (persona === 'admin') {
    primary = 'Platform administrator'
    secondary = 'Evidence One'
  }
  if (!primary) return null
  return (
    <div className="hidden text-right leading-tight md:block">
      <div className="text-[0.9375rem] font-medium text-ink">{primary}</div>
      <div className="text-sm text-slate">{secondary}</div>
    </div>
  )
}

export function ProductHeader({ persona, publicNav = false, className }: { persona: PersonaId; publicNav?: boolean; className?: string }) {
  const items = publicNav ? [] : navByPersona[persona]
  return (
    <header className={cn('sticky top-0 z-30 border-b border-line/80 bg-white/[0.92] backdrop-blur-xl backdrop-saturate-150', className)}>
      <div className="relative mx-auto flex h-16 max-w-[88rem] items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="rounded-lg" aria-label="Evidence One home">
          <Logo suffix={publicNav ? undefined : suffixByPersona[persona]} />
        </Link>
        {items.length > 0 && (
          <nav aria-label="Main" className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-150',
                    isActive ? 'bg-ink/[0.06] text-ink' : 'text-slate hover:bg-ink/[0.04] hover:text-ink',
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
              <nav aria-label="Main" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
                {publicLinks.map(([label, href]) => (
                  <a key={label} href={href} className="rounded-lg px-4 py-2 text-base text-ink transition-colors duration-150 hover:bg-ink/[0.05]">
                    {label}
                  </a>
                ))}
              </nav>
              <Button asChild size="sm">
                <Link to="/verify">Verify my identity</Link>
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
