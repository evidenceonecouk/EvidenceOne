import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleDot,
  Link2,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundX,
  Users,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Checkbox, HeroBanner, Page, Panel, PanelHeader, StatTile } from '@/components/app/Page'
import { PersonStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { AiTag } from '@/components/visual/AiTag'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { VerifyIllustration } from '@/components/visual/Illustrations'
import { formatShortDate, shortHash, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { aiFlagsForAgent, companiesForAgent, getAgent, peopleForCompany, roleLabel, type AiFlag } from '@/store/selectors'
import type { Company, PersonStatus } from '@/types/domain'

const segmentColour: Record<PersonStatus, string> = {
  verified: 'bg-approve',
  in_progress: 'bg-progress',
  not_started: 'bg-line',
  expired: 'bg-decline',
  reverification_due: 'bg-info',
}

export function AgentDashboard() {
  const { data, state } = useDemoStore()
  const agent = getAgent(data, state.agentId)!
  const companies = companiesForAgent(data, agent.id)
  const rows = companies.flatMap((c) => peopleForCompany(data, c.number))
  const flags = aiFlagsForAgent(data, agent.id)
  const count = (s: PersonStatus) => rows.filter((r) => r.status === s).length
  const needAction = rows.filter((r) => r.invitable).length

  return (
    <Page>
      <HeroBanner
        kicker="Agent portal"
        title={`Good to see you, ${agent.contactName.split(' ')[0]}`}
        description={
          agent.hasAcspStatus
            ? `${agent.name} has ACSP status, so you can approve or decline verifications yourself, or refer them to an ACSP on Evidence One.`
            : `${agent.name} does not have ACSP status, so every verification you start is referred to an ACSP on Evidence One, who makes the decision.`
        }
        meta={
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.875rem] font-medium', agent.hasAcspStatus ? 'bg-approve-wash text-approve' : 'bg-teal-wash text-teal')}>
            {agent.hasAcspStatus ? <ShieldCheck className="size-4" aria-hidden="true" /> : <Waypoints className="size-4" aria-hidden="true" />}
            {agent.hasAcspStatus ? 'Agent with ACSP status' : 'Agent without ACSP status'}
          </span>
        }
        actions={
          <>
            <Button asChild>
              <Link to="/agent/lookup">
                <Plus aria-hidden="true" />
                Connect a company
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/agent/invites">
                <Send aria-hidden="true" />
                Invite log
              </Link>
            </Button>
          </>
        }
        illustration={<VerifyIllustration className="h-48 w-auto" />}
      />

      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Companies" value={companies.length} icon={Building2} tone="ink" />
        <StatTile label="Directors and PSCs" value={rows.length} icon={Users} tone="teal" />
        <StatTile label="Verified" value={count('verified')} icon={BadgeCheck} tone="approve" />
        <StatTile label="In progress" value={count('in_progress')} icon={CircleDot} tone="progress" />
        <StatTile label="Need an invite" value={needAction} icon={RefreshCw} tone="info" detail={needAction ? 'Not started, expired or due again' : 'Everyone is covered'} />
      </dl>

      <div className="grid items-start gap-6 2xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          {companies.length === 0 && (
            <Panel className="flex flex-col items-center p-10 text-center">
              <VerifyIllustration className="h-36 w-auto" />
              <p className="mt-4 text-lg text-ink">No companies connected yet</p>
              <p className="mt-1 text-base text-slate">Find a client company on the Companies House register to get started.</p>
              <Button asChild className="mt-5">
                <Link to="/agent/lookup">
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

        <div className="grid items-start gap-6 lg:grid-cols-2 2xl:sticky 2xl:top-24 2xl:grid-cols-1">
          <FlagsPanel flags={flags} />
          <ActivityPanel />
        </div>
      </div>
    </Page>
  )
}

function CompanyBlock({ company }: { company: Company }) {
  const { data } = useDemoStore()
  const navigate = useNavigate()
  const rows = peopleForCompany(data, company.number)
  const [selected, setSelected] = useState<string[]>([])
  const verified = rows.filter((r) => r.status === 'verified').length
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const headingId = `co-${company.number}`
  const anyInvitable = rows.some((r) => r.invitable)

  return (
    <Panel aria-labelledby={headingId} className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4 border-b border-line/80 px-5 py-5 sm:px-6">
        <CompanyMark name={company.name} />
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-lg font-medium text-ink">
            <Link to={`/agent/companies/${company.number}`} className="underline-offset-4 hover:underline">
              {company.name}
            </Link>
          </h2>
          <p className="mt-0.5 text-[0.9375rem] text-slate">
            <span className="font-mono tabular">{company.number}</span>
            <span className="hidden 2xl:inline"> · {company.sicDescription}</span>
            {company.connectedAt && <> · Connected {formatShortDate(company.connectedAt)}</>}
          </p>
        </div>
        <div className="w-full sm:w-44">
          <div className="flex justify-between text-[0.9375rem]">
            <span className="text-slate">Verified</span>
            <span className="font-medium text-ink tabular">
              {verified} of {rows.length}
            </span>
          </div>
          {/* One segment per person, coloured by status */}
          <div className="mt-2 flex gap-1" aria-hidden="true">
            {rows.map((r) => (
              <span key={r.personId} className={cn('h-2 flex-1 rounded-full', segmentColour[r.status])} />
            ))}
          </div>
        </div>
        <Button
          variant={selected.length ? 'default' : 'outline'}
          size="sm"
          disabled={!anyInvitable}
          onClick={() => {
            const ids = selected.length ? selected : rows.filter((r) => r.invitable).map((r) => r.personId)
            navigate(`/agent/companies/${company.number}/invite?people=${ids.join(',')}`)
          }}
        >
          <Send aria-hidden="true" />
          {selected.length ? `Invite ${selected.length} selected` : anyInvitable ? 'Invite people' : 'All invited'}
        </Button>
      </div>

      <table className="w-full text-left">
        <caption className="sr-only">Directors and PSCs of {company.name}</caption>
        <thead className="hidden bg-mist/50 text-[0.875rem] text-slate sm:table-header-group">
          <tr>
            {anyInvitable && (
              <th scope="col" className="w-12 py-2.5 pl-5 sm:pl-6">
                <span className="sr-only">Select</span>
              </th>
            )}
            <th scope="col" className={cn('py-2.5 pr-4 font-normal', !anyInvitable && 'pl-5 sm:pl-6')}>
              Person
            </th>
            <th scope="col" className="hidden py-2.5 pr-4 font-normal sm:table-cell">Status</th>
            <th scope="col" className="hidden py-2.5 pr-6 font-normal lg:table-cell">Latest</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.personId} className={cn('border-t border-line/70 transition-colors duration-150', selected.includes(r.personId) && 'bg-highlight-wash/40')}>
              {anyInvitable && (
                <td className="py-4 pl-5 align-middle sm:pl-6">
                  {r.invitable && <Checkbox aria-label={`Select ${r.name} to invite`} checked={selected.includes(r.personId)} onChange={() => toggle(r.personId)} />}
                </td>
              )}
              <td className={cn('py-4 pr-4 align-middle', !anyInvitable && 'pl-5 sm:pl-6')}>
                <div className="flex items-center gap-3">
                  <Avatar seed={r.personId} name={r.name} size={40} />
                  <div className="min-w-0">
                    <p className="text-base font-medium text-ink">{r.name}</p>
                    <p className="text-[0.9375rem] text-slate">{roleLabel[r.role]}</p>
                    <PersonStatusChip status={r.status} className="mt-1.5 sm:hidden" />
                    <p className="mt-1 text-[0.9375rem] text-slate lg:hidden">{r.detail}</p>
                  </div>
                </div>
              </td>
              <td className="hidden py-4 pr-4 align-middle sm:table-cell">
                <PersonStatusChip status={r.status} />
              </td>
              <td className="hidden py-4 pr-6 align-middle text-[0.9375rem] text-graphite lg:table-cell">
                {r.detail}
                {r.latestCase && <span className="mt-0.5 block font-mono text-[0.8125rem] text-slate">{r.latestCase.id}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

const flagSpec: Record<AiFlag['kind'], { label: string; icon: LucideIcon; tone: string }> = {
  observation: { label: 'AI observation', icon: Sparkles, tone: 'bg-ai-wash text-ai' },
  unverified: { label: 'Not verified', icon: UserRoundX, tone: 'bg-mist text-graphite' },
  expired: { label: 'Expired', icon: UserRoundX, tone: 'bg-decline-wash text-decline' },
  reverification: { label: 'Reverification', icon: RefreshCw, tone: 'bg-info-wash text-info' },
}

function FlagsPanel({ flags }: { flags: AiFlag[] }) {
  return (
    <Panel aria-labelledby="flags-title" className="overflow-hidden">
      <PanelHeader
        id="flags-title"
        title="Needs your attention"
        description={<AiTag className="mt-1.5" label="Flagged by AI · advisory only" />}
        actions={<span className="flex size-8 items-center justify-center rounded-full bg-ink text-[0.9375rem] font-medium text-paper tabular">{flags.length}</span>}
      />
      <ul className="divide-y divide-line/70">
        {flags.map((f) => {
          const spec = flagSpec[f.kind]
          return (
            <li key={f.id} className="flex gap-3 px-5 py-4 sm:px-6">
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', spec.tone)}>
                <spec.icon className="size-[1.125rem]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-medium tracking-wide text-slate uppercase">{spec.label}</p>
                <p className="mt-0.5 text-base font-medium text-ink">{f.title}</p>
                <p className="text-[0.9375rem] text-slate">
                  {f.personName} · {f.companyName}
                </p>
              </div>
            </li>
          )
        })}
        {flags.length === 0 && <li className="px-6 py-6 text-base text-slate">Nothing needs your attention.</li>}
      </ul>
      <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] leading-snug text-slate sm:px-6">
        Flags help you follow up. Decisions are always made by an ACSP.
      </p>
    </Panel>
  )
}

const activityIcon: Record<string, { icon: LucideIcon; tone: string }> = {
  'invite.sent': { icon: Send, tone: 'bg-progress-wash text-progress' },
  'company.connected': { icon: Link2, tone: 'bg-teal-wash text-teal' },
  'case.decision.approved': { icon: BadgeCheck, tone: 'bg-approve-wash text-approve' },
}

function ActivityPanel() {
  const { data, state } = useDemoStore()
  const caseIds = new Set(data.cases.filter((c) => c.agentId === state.agentId).map((c) => c.id))
  const companyNames = companiesForAgent(data, state.agentId).map((c) => c.name)
  const events = data.audit
    .filter((e) => (e.caseId && caseIds.has(e.caseId)) || (e.action === 'company.connected' && companyNames.some((n) => e.detail.startsWith(n))))
    .slice(-5)
    .reverse()

  return (
    <Panel aria-labelledby="activity-title" className="overflow-hidden">
      <PanelHeader
        id="activity-title"
        title="Recent activity"
        description="From the hash-chained audit trail"
        actions={
          <Link to="/agent/invites" className="inline-flex items-center gap-1 text-[0.9375rem] text-ink underline-offset-4 hover:underline">
            All invites
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <ol className="divide-y divide-line/70">
        {events.map((e) => {
          const spec = activityIcon[e.action] ?? (e.actorType === 'ai' ? { icon: Sparkles, tone: 'bg-ai-wash text-ai' } : { icon: CircleDot, tone: 'bg-mist text-graphite' })
          return (
            <li key={e.seq} className="flex gap-3 px-5 py-4 sm:px-6">
              <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', spec.tone)}>
                <spec.icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] leading-snug text-ink">{e.detail}</p>
                <p className="mt-1.5 flex items-center justify-between gap-3 text-[0.875rem] text-slate">
                  <span>{timeAgo(e.at)}</span>
                  <span className="font-mono">
                    #{e.seq} · {shortHash(e.hash)}
                  </span>
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
