import { ArrowRight, BadgeCheck, Building2, CircleDot, Link2, Plus, RefreshCw, Send, ShieldCheck, Sparkles, Users, Waypoints } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Checkbox, HeroBanner, Page, Panel, PanelHeader, StatTile } from '@/components/app/Page'
import { PersonStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { AiTag } from '@/components/visual/AiTag'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { formatShortDate, shortHash, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { aiFlagsForAgent, companiesForAgent, getAgent, peopleForCompany, roleLabel, type AiFlag } from '@/store/selectors'
import type { Company, PersonStatus } from '@/types/domain'

/* One column template shared by the header row and every person row, so all companies line up. */
const ROW = 'grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 px-6 sm:grid-cols-[2.5rem_minmax(0,1.2fr)_11rem_minmax(0,1.4fr)]'

const segment: Record<PersonStatus, string> = {
  verified: 'bg-approve',
  in_progress: 'bg-ink',
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[0.875rem] text-graphite">
            {agent.hasAcspStatus ? <ShieldCheck className="size-4" aria-hidden="true" /> : <Waypoints className="size-4" aria-hidden="true" />}
            {agent.hasAcspStatus ? 'Agent with ACSP status' : 'Agent without ACSP status'}
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/agent/invites">
                <Send aria-hidden="true" />
                Invite log
              </Link>
            </Button>
            <Button asChild>
              <Link to="/agent/lookup">
                <Plus aria-hidden="true" />
                Connect a company
              </Link>
            </Button>
          </>
        }
      />

      <dl className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Companies" value={companies.length} icon={Building2} />
        <StatTile label="Directors and PSCs" value={rows.length} icon={Users} />
        <StatTile label="Verified" value={count('verified')} icon={BadgeCheck} />
        <StatTile label="In progress" value={count('in_progress')} icon={CircleDot} />
        <StatTile label="Need an invite" value={needAction} icon={RefreshCw} detail={needAction ? 'Not started, expired or due again' : 'Everyone is covered'} />
      </dl>

      <section aria-labelledby="companies-title" className="mb-8">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="companies-title" className="text-[1.25rem] font-medium tracking-[-0.01em] text-ink">
            Client companies
          </h2>
          <span className="text-[0.9375rem] text-slate">{companies.length} connected</span>
        </div>
        <div className="space-y-5">
          {companies.length === 0 && (
            <Panel className="flex flex-col items-center px-6 py-14 text-center">
              <p className="text-lg text-ink">No companies connected yet</p>
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
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <FlagsPanel flags={flags} />
        <ActivityPanel />
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
  const invitable = rows.filter((r) => r.invitable)
  const headingId = `co-${company.number}`

  return (
    <Panel aria-labelledby={headingId} className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <CompanyMark name={company.name} size={44} />
          <div className="min-w-0">
            <h3 id={headingId} className="truncate text-[1.0625rem] font-medium text-ink">
              <Link to={`/agent/companies/${company.number}`} className="underline-offset-4 hover:underline">
                {company.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-[0.9375rem] text-slate">
              <span className="font-mono tabular">{company.number}</span>
              {company.connectedAt && <> · Connected {formatShortDate(company.connectedAt)}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-40">
            <div className="flex items-baseline justify-between text-[0.875rem]">
              <span className="text-slate">Verified</span>
              <span className="font-medium text-ink tabular">
                {verified} of {rows.length}
              </span>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {rows.map((r) => (
                <span key={r.personId} className={cn('h-1.5 flex-1 rounded-full', segment[r.status])} />
              ))}
            </div>
          </div>
          <Button
            variant={selected.length ? 'default' : 'outline'}
            size="sm"
            className="w-44"
            disabled={!invitable.length}
            onClick={() => {
              const ids = selected.length ? selected : invitable.map((r) => r.personId)
              navigate(`/agent/companies/${company.number}/invite?people=${ids.join(',')}`)
            }}
          >
            <Send aria-hidden="true" />
            {selected.length ? `Invite ${selected.length} selected` : invitable.length ? 'Invite people' : 'Everyone invited'}
          </Button>
        </div>
      </div>

      <div role="table" aria-label={`Directors and PSCs of ${company.name}`}>
        <div role="row" className={cn(ROW, 'hidden h-10 border-y border-line/80 bg-[#f8f8f7] text-[0.8125rem] font-medium tracking-[0.04em] text-slate uppercase sm:grid')}>
          <span role="columnheader">
            <span className="sr-only">Select</span>
          </span>
          <span role="columnheader">Person</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Latest</span>
        </div>
        {rows.map((r) => {
          const isSelected = selected.includes(r.personId)
          return (
            <div
              key={r.personId}
              role="row"
              className={cn(ROW, 'min-h-[4.5rem] border-t border-line/70 py-3 transition-colors duration-150 first-of-type:border-t-0 sm:first-of-type:border-t', isSelected ? 'bg-mist' : 'hover:bg-[#fafaf9]')}
            >
              <span role="cell" className="flex items-center">
                {r.invitable ? <Checkbox aria-label={`Select ${r.name} to invite`} checked={isSelected} onChange={() => toggle(r.personId)} /> : <span className="size-[1.375rem]" />}
              </span>
              <span role="cell" className="flex min-w-0 items-center gap-3">
                <Avatar seed={r.personId} name={r.name} size={36} />
                <span className="min-w-0">
                  <span className="block truncate text-[0.9375rem] font-medium text-ink">{r.name}</span>
                  <span className="block truncate text-[0.875rem] text-slate">{roleLabel[r.role]}</span>
                  <PersonStatusChip status={r.status} className="mt-1.5 sm:hidden" />
                </span>
              </span>
              <span role="cell" className="hidden sm:block">
                <PersonStatusChip status={r.status} />
              </span>
              <span role="cell" className="hidden min-w-0 sm:block">
                <span className="line-clamp-2 text-[0.9375rem] text-graphite">{r.detail}</span>
                {r.latestCase && <span className="mt-0.5 block font-mono text-[0.8125rem] text-slate">{r.latestCase.id}</span>}
              </span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

const flagLabel: Record<AiFlag['kind'], string> = {
  observation: 'AI observation',
  unverified: 'Not verified',
  expired: 'Expired',
  reverification: 'Reverification due',
}

function FlagsPanel({ flags }: { flags: AiFlag[] }) {
  return (
    <Panel aria-labelledby="flags-title" className="overflow-hidden">
      <PanelHeader
        id="flags-title"
        title="Needs your attention"
        actions={
          <>
            <AiTag label="Advisory" />
            <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[0.8125rem] font-medium text-paper tabular">{flags.length}</span>
          </>
        }
      />
      <ul className="divide-y divide-line/70">
        {flags.map((f) => (
          <li key={f.id} className="flex items-start gap-3.5 px-6 py-4">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-mist text-graphite">
              {f.kind === 'observation' ? <Sparkles className="size-4" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] font-medium text-ink">{f.title}</p>
              <p className="mt-0.5 truncate text-[0.875rem] text-slate">
                {f.personName} · {f.companyName}
              </p>
            </div>
            <span className="shrink-0 text-[0.8125rem] text-slate">{flagLabel[f.kind]}</span>
          </li>
        ))}
        {flags.length === 0 && <li className="px-6 py-6 text-base text-slate">Nothing needs your attention.</li>}
      </ul>
      <p className="border-t border-line/70 px-6 py-3.5 text-[0.875rem] text-slate">Flags help you follow up. Decisions are always made by an ACSP.</p>
    </Panel>
  )
}

function ActivityPanel() {
  const { data, state } = useDemoStore()
  const caseIds = new Set(data.cases.filter((c) => c.agentId === state.agentId).map((c) => c.id))
  const companyNames = companiesForAgent(data, state.agentId).map((c) => c.name)
  const events = data.audit
    .filter((e) => (e.caseId && caseIds.has(e.caseId)) || (e.action === 'company.connected' && companyNames.some((n) => e.detail.startsWith(n))))
    .slice(-6)
    .reverse()

  return (
    <Panel aria-labelledby="activity-title" className="overflow-hidden">
      <PanelHeader
        id="activity-title"
        title="Recent activity"
        actions={
          <Link to="/agent/invites" className="inline-flex items-center gap-1 text-[0.9375rem] text-ink underline-offset-4 hover:underline">
            All invites
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <ol className="divide-y divide-line/70">
        {events.map((e) => (
          <li key={e.seq} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 px-6 py-3.5">
            <p className="truncate text-[0.9375rem] text-ink">{e.detail}</p>
            <span className="text-[0.8125rem] whitespace-nowrap text-slate">{timeAgo(e.at)}</span>
            <p className="mt-0.5 font-mono text-[0.75rem] text-slate">
              #{e.seq} · {shortHash(e.hash)}
            </p>
          </li>
        ))}
      </ol>
      <p className="border-t border-line/70 px-6 py-3.5 text-[0.875rem] text-slate">From the hash-chained audit trail.</p>
    </Panel>
  )
}
