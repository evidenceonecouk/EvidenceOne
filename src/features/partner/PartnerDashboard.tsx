import { auditEventKey } from '@/lib/audit'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDot,
  Flag,
  Hourglass,
  Info,
  Layers,
  Link2,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Checkbox,
  HeroBanner,
  Page,
  Panel,
  PanelHeader,
  StatTile,
} from '@/components/app/Page'
import { PartnerCheckLine, PartnerStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { formatShortDate, shortHash, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useActingPartner, useDemoStore } from '@/store/DemoStore'
import {
  partnerCheckLabels,
  partnerFlagLabels,
  partnerRoleLabel,
  partnerSeesChecks,
  type PartnerChecks,
  type PartnerFlag,
} from '@/store/partnerSelectors'
import {
  attentionForPartner,
  companiesForPartner,
  getAcsp,
  peopleForCompany,
  roleLabel,
  type AttentionItem,
  type PersonRow,
} from '@/store/selectors'
import type { Company, PartnerStatus } from '@/types/domain'
import { AffectedClientsNotice } from './AffectedClientsNotice'
import { useActingPartnerUser } from './usePartnerUser'

/* One column template shared by the header row and every person row, so all companies line up. */
const ROW =
  'grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 px-6 lg:grid-cols-[2.5rem_minmax(0,1.2fr)_16rem_15rem_minmax(0,1fr)]'

const segment: Record<PartnerStatus | 'none', string> = {
  completed: 'bg-approve',
  in_progress: 'bg-ink',
  invited: 'bg-silver',
  further_information: 'bg-info',
  declined: 'bg-decline',
  none: 'bg-line',
}

export function PartnerDashboard() {
  const { data } = useDemoStore()
  const partner = useActingPartner()
  const { can } = useActingPartnerUser()
  const companies = companiesForPartner(data, partner.id)
  const rows = companies.flatMap((c) =>
    peopleForCompany(data, c.number, partner),
  )
  const flags = attentionForPartner(data, partner.id)
  const count = (s: PartnerStatus) =>
    rows.filter((r) => r.partnerStatus === s).length
  const needAction = rows.filter((r) => r.invitable).length
  const statusOnly = !partnerSeesChecks(partner)

  return (
    <Page>
      <HeroBanner
        kicker="Referral Partner portal"
        title={`Good to see you, ${partner.contactName.split(' ')[0]}`}
        description={`${partner.name} introduces clients to Evidence One and tracks their progress. The ACSP each person instructs makes the verification and the decision. You are not the verifying ACSP.`}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[0.875rem] text-graphite">
              <Waypoints className="size-4" aria-hidden="true" />
              Referral Partner · {partner.country}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[0.875rem] text-graphite">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {statusOnly
                ? 'You see status only'
                : 'You see status and check results only'}
            </span>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/partner/invites">
                <Send aria-hidden="true" />
                Invite log
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/partner/requests">
                <Layers aria-hidden="true" />
                Bulk / Bespoke Request
              </Link>
            </Button>
            {can.connect ? (
              <Button asChild>
                <Link to="/partner/lookup">
                  <Plus aria-hidden="true" />
                  Connect a company
                </Link>
              </Button>
            ) : (
              <Button disabled>
                <Plus aria-hidden="true" />
                Connect a company
              </Button>
            )}
          </>
        }
      />

      <AffectedClientsNotice partnerId={partner.id} />

      <div className="mb-8 grid items-start gap-5 lg:grid-cols-2">
        <SignedInAs />
        {partner.alsoAcspId && <MembershipCard />}
      </div>

      <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Companies" value={companies.length} icon={Building2} />
        <StatTile label="Directors and PSCs" value={rows.length} icon={Users} />
        <StatTile
          label="Completed"
          value={count('completed')}
          icon={BadgeCheck}
        />
        <StatTile
          label="Open"
          value={
            count('invited') +
            count('in_progress') +
            count('further_information')
          }
          icon={CircleDot}
          detail="Invited, in progress or further information required"
        />
        <StatTile
          label="Need an invite"
          value={needAction}
          icon={RefreshCw}
          detail={
            needAction
              ? 'Not invited, not completed or due again'
              : 'Everyone is covered'
          }
        />
      </dl>

      <section aria-labelledby="companies-title" className="mb-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2
            id="companies-title"
            className="text-[1.25rem] font-medium tracking-[-0.01em] text-ink"
          >
            Client companies
          </h2>
          <span className="text-[0.9375rem] text-slate">
            {companies.length} connected
          </span>
        </div>
        <div className="space-y-5">
          {companies.length === 0 && (
            <Panel className="flex flex-col items-center px-6 py-14 text-center">
              <p className="text-lg text-ink">No companies connected yet</p>
              <p className="mt-1 text-base text-slate">
                Find a client company on the Companies House register to get
                started.
              </p>
              <Button asChild className="mt-5">
                <Link to="/partner/lookup">
                  <Link2 aria-hidden="true" />
                  Find a company
                </Link>
              </Button>
            </Panel>
          )}
          {companies.map((c) => (
            <CompanyBlock key={c.number} company={c} />
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <FlagsPanel flags={flags} />
        <ActivityPanel />
      </div>
    </Page>
  )
}

/** Who is signed in, and what that role may do. Roles: Partner Administrator, Referrer, Portfolio Viewer. */
function SignedInAs() {
  const { user, users, setUser, can } = useActingPartnerUser()
  return (
    <Panel aria-labelledby="signed-in-title" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id="signed-in-title"
            className="flex items-center gap-2 text-[1.0625rem] font-medium text-ink"
          >
            <UserRound className="size-5" aria-hidden="true" />
            Signed in as {user.name}
          </h2>
          <p className="mt-1 text-[0.9375rem] text-slate">
            Role: {partnerRoleLabel[user.role]}.{' '}
            {can.invite
              ? 'You can connect companies and send invites. You see status and check results only.'
              : 'You can see status but you cannot send invites or connect companies.'}
          </p>
        </div>
        <div>
          <label
            htmlFor="partner-user"
            className="mb-1 block text-[0.875rem] text-slate"
          >
            Show the portal as
          </label>
          <select
            id="partner-user"
            value={user.id}
            onChange={(e) => setUser(e.target.value)}
            className="h-11 rounded-lg border border-line bg-white px-3 text-base text-ink focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}, {partnerRoleLabel[u.role]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Panel>
  )
}

/** A firm that is both a Referral Partner and an ACSP holds two memberships. They never merge. */
function MembershipCard() {
  const { data, setAcsp, setPersona } = useDemoStore()
  const partner = useActingPartner()
  const navigate = useNavigate()
  const acsp = partner.alsoAcspId ? getAcsp(data, partner.alsoAcspId) : null
  if (!acsp) return null
  return (
    <Panel aria-labelledby="membership-title" className="p-5 sm:p-6">
      <h2
        id="membership-title"
        className="text-[1.0625rem] font-medium text-ink"
      >
        Two memberships
      </h2>
      <ul className="mt-3 space-y-1.5 text-[0.9375rem] text-graphite">
        <li>
          <span className="font-medium text-ink">Referral Partner</span>:{' '}
          {partner.name}. You are acting through this one now.
        </li>
        <li>
          <span className="font-medium text-ink">ACSP</span>: {acsp.name}.
          Onboarded separately, with its own reviewers and records.
        </li>
      </ul>
      <p className="mt-3 text-[0.9375rem] text-slate">
        The two roles never merge. You act through one at a time, and a Referral
        Partner is never the verifying ACSP.
      </p>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => {
          setAcsp(acsp.id)
          setPersona('reviewer')
          navigate('/acsp/queue')
        }}
      >
        <Waypoints aria-hidden="true" />
        Also an ACSP: switch membership
      </Button>
    </Panel>
  )
}

const flagIcon: Record<PartnerFlag, LucideIcon> = {
  unverified: Info,
  invite_expired: Hourglass,
  reverification_due: RefreshCw,
  register_verified: BadgeCheck,
}

function FlagTags({ flags }: { flags: PartnerFlag[] }) {
  if (!flags.length) return null
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1.5">
      {flags.map((f) => {
        const Icon = flagIcon[f]
        return (
          <li
            key={f}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-1.5 py-0.5 text-[0.8125rem] text-graphite"
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {partnerFlagLabels[f]}
          </li>
        )
      })}
    </ul>
  )
}

function StatusCell({ row }: { row: PersonRow }) {
  return row.partnerStatus ? (
    <PartnerStatusChip status={row.partnerStatus} />
  ) : (
    <span className="inline-flex items-center rounded-full border border-dashed border-silver px-2.5 py-1 text-sm font-medium whitespace-nowrap text-graphite">
      Not invited
    </span>
  )
}

/** Passed, flagged or not passed for each check. Never a document, extracted data or evidence. */
function ChecksCell({
  checks,
  statusOnly,
}: {
  checks?: PartnerChecks
  statusOnly: boolean
}) {
  if (statusOnly)
    return <span className="text-[0.875rem] text-slate">Status only</span>
  if (!checks)
    return <span className="text-[0.875rem] text-slate">No checks yet</span>
  return (
    <ul>
      {(Object.keys(partnerCheckLabels) as (keyof PartnerChecks)[]).map((k) => (
        <li key={k}>
          <PartnerCheckLine label={partnerCheckLabels[k]} result={checks[k]} />
        </li>
      ))}
    </ul>
  )
}

function CompanyBlock({ company }: { company: Company }) {
  const { data } = useDemoStore()
  const partner = useActingPartner()
  const { can } = useActingPartnerUser()
  const navigate = useNavigate()
  const rows = peopleForCompany(data, company.number, partner)
  const statusOnly = !partnerSeesChecks(partner)
  const [selected, setSelected] = useState<string[]>([])
  const completed = rows.filter((r) => r.partnerStatus === 'completed').length
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    )
  const invitable = rows.filter((r) => r.invitable)
  const headingId = `co-${company.number}`

  return (
    <Panel aria-labelledby={headingId} className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <CompanyMark name={company.name} size={44} />
          <div className="min-w-0">
            <h3
              id={headingId}
              className="truncate text-[1.0625rem] font-medium text-ink"
            >
              <Link
                to={`/partner/companies/${company.number}`}
                className="underline-offset-4 hover:underline"
              >
                {company.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-[0.9375rem] text-slate">
              <span className="font-mono tabular">{company.number}</span>
              {company.connectedAt && (
                <> · Connected {formatShortDate(company.connectedAt)}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-40">
            <div className="flex items-baseline justify-between text-[0.875rem]">
              <span className="text-slate">Completed</span>
              <span className="font-medium text-ink tabular">
                {completed} of {rows.length}
              </span>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {rows.map((r) => (
                <span
                  key={r.personId}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    segment[r.partnerStatus ?? 'none'],
                  )}
                />
              ))}
            </div>
          </div>
          <Button
            variant={selected.length ? 'default' : 'outline'}
            size="sm"
            className="w-44"
            disabled={!invitable.length || !can.invite}
            onClick={() => {
              const ids = selected.length
                ? selected
                : invitable.map((r) => r.personId)
              navigate(
                `/partner/companies/${company.number}/invite?people=${ids.join(',')}`,
              )
            }}
          >
            <Send aria-hidden="true" />
            {selected.length
              ? `Refer ${selected.length} selected`
              : invitable.length
                ? 'Refer to an ACSP'
                : 'Everyone invited'}
          </Button>
        </div>
      </div>

      <div role="table" aria-label={`Directors and PSCs of ${company.name}`}>
        <div
          role="row"
          className={cn(
            ROW,
            'hidden h-10 border-y border-line/80 bg-[#f8f8f7] text-[0.8125rem] font-medium tracking-[0.04em] text-slate uppercase lg:grid',
          )}
        >
          <span role="columnheader">
            <span className="sr-only">Select</span>
          </span>
          <span role="columnheader">Person</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Check results</span>
          <span role="columnheader">Latest</span>
        </div>
        {rows.map((r) => {
          const isSelected = selected.includes(r.personId)
          return (
            <div
              key={r.personId}
              role="row"
              className={cn(
                ROW,
                'min-h-[4.5rem] border-t border-line/70 py-3 transition-colors duration-150 first-of-type:border-t-0 lg:first-of-type:border-t',
                isSelected ? 'bg-mist' : 'hover:bg-[#fafaf9]',
              )}
            >
              <span role="cell" className="flex items-center">
                {r.invitable && can.invite ? (
                  <Checkbox
                    aria-label={`Select ${r.name} to invite`}
                    checked={isSelected}
                    onChange={() => toggle(r.personId)}
                  />
                ) : (
                  <span className="size-[1.375rem]" />
                )}
              </span>
              <span role="cell" className="flex min-w-0 items-center gap-3">
                <Avatar seed={r.personId} name={r.name} size={36} />
                <span className="min-w-0">
                  <span className="block truncate text-[0.9375rem] font-medium text-ink">
                    {r.name}
                  </span>
                  <span className="block truncate text-[0.875rem] text-slate">
                    {roleLabel[r.role]}
                  </span>
                  <span className="mt-1.5 block lg:hidden">
                    <StatusCell row={r} />
                  </span>
                </span>
              </span>
              <span role="cell" className="hidden lg:block">
                <StatusCell row={r} />
                <FlagTags flags={r.flags} />
              </span>
              <span role="cell" className="hidden lg:block">
                <ChecksCell checks={r.checks} statusOnly={statusOnly} />
              </span>
              <span role="cell" className="hidden min-w-0 lg:block">
                <span className="line-clamp-2 text-[0.9375rem] text-graphite">
                  {r.detail}
                </span>
                {r.registerVerified && !r.latestCase && (
                  <span className="mt-0.5 block font-mono text-[0.8125rem] text-slate">
                    REG-04 · the person is told before payment
                  </span>
                )}
                {r.latestCase && (
                  <span className="mt-0.5 block font-mono text-[0.8125rem] text-slate">
                    {r.latestCase.id}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

const attentionIcon: Record<AttentionItem['kind'], LucideIcon> = {
  register_verified: Info,
  not_invited: Send,
  further_information: Hourglass,
  declined: RefreshCw,
  invite_expired: Hourglass,
  reverification_due: RefreshCw,
  check_flagged: Flag,
}

/** Follow-ups from status and check results alone. Referral Partners never see documents or evidence. */
function FlagsPanel({ flags }: { flags: AttentionItem[] }) {
  return (
    <Panel aria-labelledby="flags-title" className="overflow-hidden">
      <PanelHeader
        id="flags-title"
        title="Needs your attention"
        actions={
          <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[0.8125rem] font-medium text-paper tabular">
            {flags.length}
          </span>
        }
      />
      <ul className="divide-y divide-line/70">
        {flags.map((f) => {
          const Icon = attentionIcon[f.kind]
          return (
            <li key={f.id} className="flex items-start gap-3.5 px-6 py-4">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-mist text-graphite">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-medium text-ink">
                  {f.title}
                </p>
                <p className="mt-0.5 truncate text-[0.875rem] text-slate">
                  {f.personName} · {f.companyName}
                </p>
              </div>
            </li>
          )
        })}
        {flags.length === 0 && (
          <li className="px-6 py-6 text-base text-slate">
            Nothing needs your attention.
          </li>
        )}
      </ul>
      <p className="border-t border-line/70 px-6 py-3.5 text-[0.875rem] text-slate">
        You see each person’s status and check results only. Documents and
        evidence stay with the ACSP, who makes every decision.
      </p>
    </Panel>
  )
}

function ActivityPanel() {
  const { data, state } = useDemoStore()
  const caseIds = new Set(
    data.cases.filter((c) => c.partnerId === state.partnerId).map((c) => c.id),
  )
  const companyNames = companiesForPartner(data, state.partnerId).map(
    (c) => c.name,
  )
  // Status-level events only, reworded, so nothing about documents or evidence reaches the Referral Partner.
  const name = (caseId?: string) => {
    const vc = data.cases.find((c) => c.id === caseId)
    const p = vc && data.people.find((x) => x.id === vc.personId)
    return p ? `${p.givenNames.split(' ')[0]} ${p.familyName}` : 'Someone'
  }
  const safe: Record<string, (caseId?: string) => string> = {
    'invite.sent': (id) => `Invite sent to ${name(id)}`,
    'invite.opened': (id) => `${name(id)} opened their invite`,
    'payment.authorised': (id) =>
      `${name(id)}: payment authorised, taken only on approval`,
    'payment.taken': (id) => `${name(id)}: payment taken on approval`,
    'payment.released': (id) => `${name(id)}: nothing was taken`,
    'case.submitted': (id) => `${name(id)}: In progress, with the ACSP`,
    'case.decision.request_info': (id) =>
      `${name(id)}: Further information required`,
    'case.decision.decline': (id) => `${name(id)}: Declined`,
    'submission.confirmed': (id) => `${name(id)}: Completed`,
  }
  const events = data.audit
    .filter(
      (e) =>
        (e.caseId && caseIds.has(e.caseId) && safe[e.action]) ||
        (e.action === 'company.connected' &&
          companyNames.some((n) => e.detail.startsWith(n))),
    )
    .slice(-6)
    .reverse()
    .map((e) => ({
      ...e,
      detail:
        e.action === 'company.connected' ? e.detail : safe[e.action](e.caseId),
    }))

  return (
    <Panel aria-labelledby="activity-title" className="overflow-hidden">
      <PanelHeader
        id="activity-title"
        title="Recent activity"
        actions={
          <Link
            to="/partner/invites"
            className="inline-flex items-center gap-1 text-[0.9375rem] text-ink underline-offset-4 hover:underline"
          >
            All invites
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <ol className="divide-y divide-line/70">
        {events.map((e) => (
          <li
            key={auditEventKey(e)}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 px-6 py-3.5"
          >
            <p className="truncate text-[0.9375rem] text-ink">{e.detail}</p>
            <span className="text-[0.8125rem] whitespace-nowrap text-slate">
              {timeAgo(e.at)}
            </span>
            <p className="mt-0.5 font-mono text-[0.75rem] text-slate">
              #{e.seq} · {shortHash(e.hash)}
            </p>
          </li>
        ))}
        {events.length === 0 && (
          <li className="px-6 py-6 text-base text-slate">
            No activity to show yet.
          </li>
        )}
      </ol>
      <p className="border-t border-line/70 px-6 py-3.5 text-[0.875rem] text-slate">
        From the hash-chained audit trail.
      </p>
    </Panel>
  )
}
