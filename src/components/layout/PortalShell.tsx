import { Archive, ChevronsUpDown, Gauge, Inbox, LayoutDashboard, Menu, Search, Send, ShieldCheck, Waypoints, X, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { PRIMARY_ACSP_ID } from '@/data/organisations'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { getAcsp, getAgent } from '@/store/selectors'
import type { PersonaId } from '@/types/domain'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  count?: number
}

function useNav(persona: PersonaId): { section: string; items: NavItem[] } {
  const { data, state } = useDemoStore()
  if (persona === 'agent') {
    const sent = data.invites.filter((i) => i.agentId === state.agentId && (i.status === 'sent' || i.status === 'opened')).length
    return {
      section: 'Agent portal',
      items: [
        { to: '/agent', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/agent/lookup', label: 'Companies House lookup', icon: Search },
        { to: '/agent/invites', label: 'Invites', icon: Send, count: sent },
      ],
    }
  }
  if (persona === 'reviewer') {
    const awaiting = data.cases.filter((c) => c.acspId === PRIMARY_ACSP_ID && !c.inHouse && c.status === 'in_review').length
    const tasks = data.corrections.filter((t) => t.status !== 'register_updated').length
    return {
      section: 'Compliance',
      items: [
        { to: '/acsp/queue', label: 'Review queue', icon: Inbox, count: awaiting },
        { to: '/acsp/filings', label: 'Filings', icon: Waypoints, count: tasks },
        { to: '/records', label: 'Records', icon: Archive },
      ],
    }
  }
  return { section: 'Administration', items: [{ to: '/admin', label: 'Operations', icon: Gauge }] }
}

function OrgSwitcher({ persona }: { persona: PersonaId }) {
  const { data, state, setAgent } = useDemoStore()
  if (persona === 'agent') {
    const agent = getAgent(data, state.agentId)!
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white p-2.5 text-left transition-colors duration-150 hover:border-silver">
          <CompanyMark name={agent.name} size={38} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-medium text-ink">{agent.name}</span>
            <span className="block truncate text-[0.8125rem] text-slate">{agent.hasAcspStatus ? 'Agent with ACSP status' : 'Agent without ACSP status'}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-slate" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-sm text-slate">Switch organisation</DropdownMenuLabel>
          {data.agents.map((a) => (
            <DropdownMenuItem key={a.id} onSelect={() => setAgent(a.id)} className="gap-3 py-2">
              <CompanyMark name={a.name} size={30} />
              <span>
                <span className="block text-[0.9375rem] font-medium text-ink">{a.name}</span>
                <span className="block text-[0.8125rem] text-slate">{a.hasAcspStatus ? 'With ACSP status' : 'Without ACSP status'}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  const acsp = getAcsp(data, PRIMARY_ACSP_ID)!
  const name = persona === 'admin' ? 'Evidence One' : acsp.name
  const sub = persona === 'admin' ? 'Platform administration' : `ACSP · ${acsp.acspNumber}`
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5">
      <CompanyMark name={persona === 'admin' ? 'Evidence One' : acsp.name} size={38} />
      <span className="min-w-0">
        <span className="block truncate text-[0.9375rem] font-medium text-ink">{name}</span>
        <span className="block truncate text-[0.8125rem] text-slate">{sub}</span>
      </span>
    </div>
  )
}

function Sidebar({ persona, onNavigate }: { persona: PersonaId; onNavigate?: () => void }) {
  const { section, items } = useNav(persona)
  const user =
    persona === 'agent'
      ? { seed: 'agent-contact', name: 'Rachel Fenwick', role: 'Partner' }
      : persona === 'reviewer'
        ? { seed: 'rev-marsh', name: 'Eleanor Marsh', role: 'ACSP reviewer' }
        : { seed: 'admin-1', name: 'Platform administrator', role: 'Evidence One' }
  const { data, state } = useDemoStore()
  const userName = persona === 'agent' ? getAgent(data, state.agentId)?.contactName ?? user.name : user.name

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" onClick={onNavigate} className="px-2 pt-2" aria-label="Evidence One home">
        <Logo />
      </Link>
      <OrgSwitcher persona={persona} />
      <nav aria-label={section}>
        <p className="px-3 font-mono text-[0.75rem] tracking-[0.16em] text-slate uppercase">{section}</p>
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] transition-[background-color,color] duration-150',
                    isActive ? 'bg-ink text-paper shadow-[0_8px_20px_-12px_rgb(22_24_27/0.7)]' : 'text-graphite hover:bg-ink/[0.05] hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn('size-[1.125rem]', isActive ? 'text-highlight' : 'text-slate group-hover:text-ink')} aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.count && (
                      <span className={cn('min-w-6 rounded-full px-1.5 text-center text-[0.8125rem] font-medium tabular', isActive ? 'bg-white/15 text-paper' : 'bg-ink/[0.07] text-ink')}>
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl bg-[linear-gradient(140deg,#16181b,#2b2f36)] p-4 text-paper">
          <ShieldCheck className="size-5 text-highlight" aria-hidden="true" />
          <p className="mt-2 text-[0.9375rem] font-medium">Human decisions only</p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-paper/70">AI flags and compares. Only an ACSP reviewer can approve or decline.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
          <Avatar seed={user.seed} name={userName} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-[0.9375rem] font-medium text-ink">{userName}</span>
            <span className="block truncate text-[0.8125rem] text-slate">{user.role}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

/** App frame for the professional portals: a persistent sidebar on wide screens, a drawer on small ones. */
export function PortalShell({ persona, children }: { persona: PersonaId; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[17.5rem] shrink-0 border-r border-line/80 bg-[#fbfbfa] lg:block print:hidden">
        <Sidebar persona={persona} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-14 z-30 flex h-16 items-center justify-between border-b border-line/80 bg-white/90 px-4 backdrop-blur-xl lg:hidden print:hidden">
          <Logo />
          <button type="button" onClick={() => setOpen(true)} className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-white" aria-label="Open navigation">
            <Menu className="size-5" />
          </button>
        </div>
        {children}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="animate-rise absolute inset-y-0 left-0 w-[19rem] max-w-[85vw] bg-[#fbfbfa] shadow-2xl [animation-duration:220ms]">
            <button type="button" onClick={() => setOpen(false)} className="absolute top-4 right-4 z-10 flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink hover:bg-mist" aria-label="Close navigation">
              <X className="size-5" />
            </button>
            <Sidebar persona={persona} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
