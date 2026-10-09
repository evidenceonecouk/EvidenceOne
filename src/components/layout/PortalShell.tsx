import {
  Archive,
  ChevronsUpDown,
  Coins,
  Database,
  Gauge,
  GitMerge,
  Handshake,
  Hourglass,
  Inbox,
  LayoutDashboard,
  Link2,
  ListChecks,
  Menu,
  Palette,
  Radar,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
  Waypoints,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { NotificationsPreview } from '@/features/admin/NotificationsPreview'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { cn } from '@/lib/utils'
import { SUPER_ADMINS, useDemoStore } from '@/store/DemoStore'
import { getAcsp, getPartner } from '@/store/selectors'
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
  if (persona === 'partner') {
    const sent = data.invites.filter(
      (i) =>
        i.partnerId === state.partnerId &&
        (i.status === 'sent' || i.status === 'opened'),
    ).length
    return {
      section: 'Referral Partner portal',
      items: [
        { to: '/partner', label: 'Overview', icon: LayoutDashboard, end: true },
        {
          to: '/partner/lookup',
          label: 'Companies House lookup',
          icon: Search,
        },
        { to: '/partner/invites', label: 'Invites', icon: Send, count: sent },
      ],
    }
  }
  if (persona === 'reviewer') {
    const acsp = data.acsps.find((a) => a.id === state.acspId) ?? data.acsps[0]
    const awaiting = data.cases.filter(
      (c) => c.acspId === acsp.id && c.status === 'in_review',
    ).length
    const tasks = data.corrections.filter(
      (t) => t.status !== 'register_updated',
    ).length
    const lapsed = ['suspended', 'ceased', 'withdrawn'].includes(acsp.status)
    return {
      section: 'Compliance',
      items: [
        {
          to: '/acsp/queue',
          label: 'Review queue',
          icon: Inbox,
          count: awaiting,
        },
        {
          to: '/acsp/filings',
          label: 'Filings',
          icon: Waypoints,
          count: tasks,
        },
        { to: '/records', label: 'Records', icon: Archive },
        { to: '/acsp/billing', label: 'Billing', icon: Receipt },
        ...(lapsed
          ? [
              {
                to: '/acsp/affected',
                label: 'Affected cases',
                icon: UsersRound,
              },
            ]
          : []),
        { to: '/rules', label: 'Rules', icon: ListChecks },
      ],
    }
  }
  const pendingApprovals =
    data.approvals.filter((a) => a.status === 'pending').length +
    data.ruleSets.filter((v) => v.status === 'pending_approval').length
  if (persona === 'superAdmin')
    return {
      section: 'Super Administrator',
      items: [
        {
          to: '/super',
          label: 'Approvals',
          icon: UserCheck,
          end: true,
          count: pendingApprovals,
        },
        { to: '/admin/fees', label: 'Fees and plans', icon: Coins },
        {
          to: '/admin/commissions',
          label: 'Referral commissions',
          icon: Handshake,
        },
        {
          to: '/rules',
          label: 'Rules',
          icon: ListChecks,
          count: data.ruleSets.filter(
            (v) => v.status !== 'current' && v.status !== 'superseded',
          ).length,
        },
        { to: '/admin/audit', label: 'Audit trail', icon: Link2 },
      ],
    }
  return {
    section: 'Platform administration',
    items: [
      { to: '/admin', label: 'Operations', icon: Gauge, end: true },
      {
        to: '/admin/approvals',
        label: 'Approvals',
        icon: UserCheck,
        count: data.applications.filter((a) => a.status === 'pending_approval')
          .length,
      },
      {
        to: '/admin/matching',
        label: 'Matching and allocation',
        icon: GitMerge,
      },
      { to: '/admin/monitoring', label: 'ACSP monitoring', icon: Radar },
      { to: '/admin/fees', label: 'Fees and plans', icon: Coins },
      {
        to: '/admin/commissions',
        label: 'Referral commissions',
        icon: Handshake,
      },
      { to: '/admin/compliance', label: 'Compliance', icon: ShieldCheck },
      { to: '/rules', label: 'Rules', icon: ListChecks },
      { to: '/admin/audit', label: 'Audit trail', icon: Link2 },
      { to: '/admin/storage', label: 'Storage and retention', icon: Database },
      { to: '/admin/retention', label: 'Retention holds', icon: Hourglass },
      { to: '/admin/users', label: 'Users and roles', icon: Users },
      { to: '/admin/white-label', label: 'White label', icon: Palette },
    ],
  }
}

function OrgSwitcher({ persona }: { persona: PersonaId }) {
  const { data, state, setPartner, setAcsp } = useDemoStore()
  if (persona === 'partner') {
    const partner = getPartner(data, state.partnerId)!
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white p-2.5 text-left transition-colors duration-150 hover:border-silver">
          <CompanyMark name={partner.name} size={38} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-medium text-ink">
              {partner.name}
            </span>
            <span className="block truncate text-[0.8125rem] text-slate">
              Referral Partner · {partner.country}
            </span>
          </span>
          <ChevronsUpDown
            className="size-4 shrink-0 text-slate"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-sm text-slate">
            Switch Referral Partner
          </DropdownMenuLabel>
          {data.partners.map((a) => (
            <DropdownMenuItem
              key={a.id}
              onSelect={() => setPartner(a.id)}
              className="gap-3 py-2"
            >
              <CompanyMark name={a.name} size={30} />
              <span>
                <span className="block text-[0.9375rem] font-medium text-ink">
                  {a.name}
                </span>
                <span className="block text-[0.8125rem] text-slate">
                  {a.kind} · {a.country}
                  {a.alsoAcspId ? ' · also an ACSP' : ''}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  if (persona === 'reviewer') {
    const acsp = getAcsp(data, state.acspId) ?? data.acsps[0]
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white p-2.5 text-left transition-colors duration-150 hover:border-silver">
          <CompanyMark name={acsp.name} size={38} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.9375rem] font-medium text-ink">
              {acsp.name}
            </span>
            <span className="block truncate text-[0.8125rem] text-slate">
              ACSP · {acsp.acspNumber}
            </span>
          </span>
          <ChevronsUpDown
            className="size-4 shrink-0 text-slate"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel className="text-sm text-slate">
            Act as ACSP
          </DropdownMenuLabel>
          {data.acsps
            .filter((a) => a.approval === 'approved')
            .map((a) => (
              <DropdownMenuItem
                key={a.id}
                onSelect={() => setAcsp(a.id)}
                className="gap-3 py-2"
              >
                <CompanyMark name={a.name} size={30} />
                <span>
                  <span className="block text-[0.9375rem] font-medium text-ink">
                    {a.name}
                  </span>
                  <span className="block text-[0.8125rem] text-slate">
                    {a.kind}
                    {a.alsoPartnerId ? ' · also a Referral Partner' : ''}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  const superAdmin = persona === 'superAdmin'
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-2.5">
      <CompanyMark name="Evidence One" size={38} />
      <span className="min-w-0">
        <span className="block truncate text-[0.9375rem] font-medium text-ink">
          Evidence One
        </span>
        <span className="block truncate text-[0.8125rem] text-slate">
          {superAdmin ? 'Super Administrator' : 'Platform Administrator'}
        </span>
      </span>
    </div>
  )
}

function Sidebar({
  persona,
  onNavigate,
}: {
  persona: PersonaId
  onNavigate?: () => void
}) {
  const { section, items } = useNav(persona)
  const { data, state, setSeat } = useDemoStore()
  const acsp = getAcsp(data, state.acspId) ?? data.acsps[0]
  const partner = getPartner(data, state.partnerId)
  const seat = SUPER_ADMINS.find((x) => x.seat === state.superAdminSeat)!
  const user =
    persona === 'partner'
      ? {
          seed: `partner-${state.partnerId}`,
          name: partner?.contactName ?? 'Referral Partner',
          role: 'Partner Administrator',
        }
      : persona === 'reviewer'
        ? {
            seed: acsp.reviewers[0].id,
            name: acsp.reviewers[0].name,
            role: acsp.reviewers[0].role,
          }
        : persona === 'superAdmin'
          ? { seed: `super-${seat.seat}`, name: seat.name, role: seat.role }
          : {
              seed: 'platform-admin',
              name: 'Marcus Adeyemi',
              role: 'Platform Administrator',
            }
  const userName = user.name

  return (
    <div className="flex h-full flex-col gap-5 p-4 short:gap-3 short:py-3">
      <Link
        to="/"
        onClick={onNavigate}
        className="shrink-0 px-2 pt-2 short:pt-1"
        aria-label="Evidence One home"
      >
        <Logo />
      </Link>
      <div className="shrink-0">
        <OrgSwitcher persona={persona} />
      </div>
      <nav
        aria-label={section}
        className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 [scrollbar-width:thin]"
      >
        <p className="px-3 font-mono text-[0.75rem] tracking-[0.16em] text-slate uppercase">
          {section}
        </p>
        <ul className="mt-2 space-y-1 short:space-y-0.5 shorter:space-y-0">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] short:py-2 shorter:py-1.5 transition-[background-color,color] duration-150',
                    isActive
                      ? 'bg-ink text-paper shadow-[0_8px_20px_-12px_rgb(22_24_27/0.7)]'
                      : 'text-graphite hover:bg-ink/[0.05] hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'size-[1.125rem]',
                        isActive
                          ? 'text-highlight'
                          : 'text-slate group-hover:text-ink',
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{item.label}</span>
                    {!!item.count && (
                      <span
                        className={cn(
                          'min-w-6 rounded-full px-1.5 text-center text-[0.8125rem] font-medium tabular',
                          isActive
                            ? 'bg-white/15 text-paper'
                            : 'bg-ink/[0.07] text-ink',
                        )}
                      >
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

      <div className="shrink-0 space-y-3 short:space-y-2">
        {persona === 'platformAdmin' && (
          <NotificationsPreview onNavigate={onNavigate} />
        )}
        {persona === 'superAdmin' && (
          <div className="rounded-2xl border border-line bg-white p-3">
            <p className="font-mono text-[0.75rem] tracking-[0.16em] text-slate uppercase">
              Acting as
            </p>
            <div
              className="mt-2 grid grid-cols-2 gap-1"
              role="group"
              aria-label="Super Administrator seat"
            >
              {SUPER_ADMINS.map((x) => (
                <button
                  key={x.seat}
                  type="button"
                  aria-pressed={state.superAdminSeat === x.seat}
                  onClick={() => setSeat(x.seat)}
                  className={cn(
                    'cursor-pointer rounded-lg px-2 py-2 text-left text-[0.8125rem] leading-tight',
                    state.superAdminSeat === x.seat
                      ? 'bg-ink text-paper'
                      : 'bg-mist text-ink hover:bg-ink/[0.08]',
                  )}
                >
                  <span className="block font-medium">{x.name}</span>
                  <span className="block opacity-75">
                    {x.seat === 1 ? 'Proposes' : 'Second approver'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div
          className={cn(
            'rounded-2xl bg-[linear-gradient(140deg,#16181b,#2b2f36)] p-4 text-paper',
            persona === 'platformAdmin' && 'hidden',
            'short:hidden',
          )}
        >
          <ShieldCheck className="size-5 text-highlight" aria-hidden="true" />
          <p className="mt-2 text-[0.9375rem] font-medium">
            Human decisions only
          </p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-paper/70">
            Rules are deterministic and AI is advisory. Only an ACSP reviewer
            can approve or decline.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl px-2 py-1.5">
          <Avatar seed={user.seed} name={userName} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-[0.9375rem] font-medium text-ink">
              {userName}
            </span>
            <span className="block truncate text-[0.8125rem] text-slate">
              {user.role}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

/** App frame for the professional portals: a persistent sidebar on wide screens, a drawer on small ones. */
export function PortalShell({
  persona,
  children,
}: {
  persona: PersonaId
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)]">
      <div className="hidden w-[17.5rem] shrink-0 border-r border-line/80 bg-[#fbfbfa] lg:block print:hidden">
        <aside className="sticky top-14 h-[calc(100dvh-3.5rem)]">
          <Sidebar persona={persona} />
        </aside>
      </div>

      <div className="min-w-0 flex-1">
        <div className="sticky top-14 z-30 flex h-16 items-center justify-between border-b border-line/80 bg-white/90 px-4 backdrop-blur-xl lg:hidden print:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-white"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
        </div>
        {children}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <div className="animate-rise absolute inset-y-0 left-0 w-[19rem] max-w-[85vw] bg-[#fbfbfa] shadow-2xl [animation-duration:220ms]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink hover:bg-mist"
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
            <Sidebar persona={persona} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
