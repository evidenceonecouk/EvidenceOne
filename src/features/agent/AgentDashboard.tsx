import { ArrowRight, Plus, Send, ShieldCheck, Sparkles, Waypoints } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Checkbox, MonoLabel, Page, PageHeader, Panel, PanelHeader, Stat } from '@/components/app/Page'
import { PersonStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { formatShortDate, shortHash, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { aiFlagsForAgent, companiesForAgent, getAgent, peopleForCompany, roleLabel, type AiFlag } from '@/store/selectors'
import type { Company } from '@/types/domain'

export function AgentDashboard() {
  const { data, state } = useDemoStore()
  const agent = getAgent(data, state.agentId)!
  const companies = companiesForAgent(data, agent.id)
  const rows = companies.flatMap((c) => peopleForCompany(data, c.number))
  const flags = aiFlagsForAgent(data, agent.id)
  const count = (s: string) => rows.filter((r) => r.status === s).length
  const needAction = rows.filter((r) => r.invitable).length

  return (
    <Page>
      <PageHeader
        kicker="Agent portal"
        title="Client companies"
        meta={
          <>
            <span className="text-ink">{agent.name}</span>
            <span className="inline-flex items-center gap-1.5">
              {agent.hasAcspStatus ? <ShieldCheck className="size-4" aria-hidden="true" /> : <Waypoints className="size-4" aria-hidden="true" />}
              {agent.hasAcspStatus ? 'Agent with ACSP status' : 'Agent without ACSP status'}
            </span>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/agent/invites">Invite log</Link>
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

      <p className="mb-6 rounded-2xl border border-line/80 bg-white/60 px-5 py-4 text-base leading-relaxed text-graphite">
        {agent.hasAcspStatus
          ? `${agent.name} has ACSP status, so you can approve or decline verifications yourself, or refer them to an ACSP on Evidence One.`
          : `${agent.name} does not have ACSP status, so every verification you start is referred to an ACSP on Evidence One, who makes the decision.`}
      </p>

      <Panel as="div" className="mb-6">
        <dl className="grid grid-cols-2 divide-line/80 md:grid-cols-5 md:divide-x [&>div:nth-child(n+3)]:border-t [&>div:nth-child(n+3)]:border-line/80 md:[&>div:nth-child(n+3)]:border-t-0">
          <Stat label="Companies" value={companies.length} />
          <Stat label="Directors and PSCs" value={rows.length} />
          <Stat label="Verified" value={count('verified')} />
          <Stat label="In progress" value={count('in_progress')} />
          <Stat label="Need an invite" value={needAction} detail={needAction ? 'Not started, expired or due again' : 'Everyone is covered'} />
        </dl>
      </Panel>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          {companies.length === 0 && (
            <Panel className="p-10 text-center">
              <p className="text-lg text-ink">No companies connected yet.</p>
              <Button asChild className="mt-5">
                <Link to="/agent/lookup">Find a company on the register</Link>
              </Button>
            </Panel>
          )}
          {companies.map((c) => (
            <CompanyBlock key={c.number} company={c} />
          ))}
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
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

  return (
    <Panel aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-line/80 px-5 py-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-lg font-medium text-ink">
            <Link to={`/agent/companies/${company.number}`} className="underline-offset-4 hover:underline">
              {company.name}
            </Link>
          </h2>
          <p className="mt-0.5 text-[0.9375rem] text-slate">
            <span className="font-mono tabular">{company.number}</span> · Connected {company.connectedAt && formatShortDate(company.connectedAt)}
          </p>
        </div>
        <div className="w-40">
          <div className="flex justify-between text-[0.9375rem]">
            <span className="text-slate">Verified</span>
            <span className="font-medium text-ink tabular">
              {verified} of {rows.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={`${company.name} verified`} aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={verified}>
            <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${(verified / Math.max(1, rows.length)) * 100}%` }} />
          </div>
        </div>
        <Button
          variant={selected.length ? 'default' : 'outline'}
          size="sm"
          disabled={!rows.some((r) => r.invitable)}
          onClick={() => {
            const ids = selected.length ? selected : rows.filter((r) => r.invitable).map((r) => r.personId)
            navigate(`/agent/companies/${company.number}/invite?people=${ids.join(',')}`)
          }}
        >
          <Send aria-hidden="true" />
          {selected.length ? `Invite ${selected.length} selected` : 'Invite people'}
        </Button>
      </div>

      <table className="w-full text-left">
        <caption className="sr-only">Directors and PSCs of {company.name}</caption>
        <thead className="hidden text-[0.9375rem] text-slate sm:table-header-group">
          <tr>
            <th scope="col" className="w-12 py-3 pl-5 sm:pl-6">
              <span className="sr-only">Select</span>
            </th>
            <th scope="col" className="py-3 pr-4 font-normal">Person</th>
            <th scope="col" className="py-3 pr-4 font-normal">Status</th>
            <th scope="col" className="hidden py-3 pr-6 font-normal lg:table-cell">Latest</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.personId} className={cn('border-t border-line/70 align-middle transition-colors duration-150', selected.includes(r.personId) && 'bg-mist/60')}>
              <td className="py-4 pl-5 sm:pl-6">
                {r.invitable && (
                  <Checkbox aria-label={`Select ${r.name} to invite`} checked={selected.includes(r.personId)} onChange={() => toggle(r.personId)} />
                )}
              </td>
              <td className="py-4 pr-4">
                <p className="text-base font-medium text-ink">{r.name}</p>
                <p className="text-[0.9375rem] text-slate">{roleLabel[r.role]}</p>
                <p className="mt-1 text-[0.9375rem] text-slate lg:hidden">{r.detail}</p>
              </td>
              <td className="py-4 pr-4">
                <PersonStatusChip status={r.status} />
              </td>
              <td className="hidden py-4 pr-6 text-[0.9375rem] text-graphite lg:table-cell">
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

const flagLabel: Record<AiFlag['kind'], string> = {
  observation: 'Observation',
  unverified: 'Unverified',
  expired: 'Expired',
  reverification: 'Reverification',
}

function FlagsPanel({ flags }: { flags: AiFlag[] }) {
  return (
    <Panel aria-labelledby="flags-title">
      <PanelHeader
        id="flags-title"
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-[1.125rem]" aria-hidden="true" />
            AI flags
          </span>
        }
        description="Evidence One Intelligence · advisory only"
        actions={<span className="rounded-full bg-mist px-2.5 py-0.5 text-[0.9375rem] font-medium text-ink tabular">{flags.length}</span>}
      />
      <ul className="divide-y divide-line/70">
        {flags.map((f) => (
          <li key={f.id} className="px-5 py-4 sm:px-6">
            <MonoLabel>{flagLabel[f.kind]}</MonoLabel>
            <p className="mt-1.5 text-base font-medium text-ink">{f.title}</p>
            <p className="text-[0.9375rem] text-slate">
              {f.personName} · {f.companyName}
            </p>
          </li>
        ))}
        {flags.length === 0 && <li className="px-6 py-6 text-base text-slate">Nothing needs your attention.</li>}
      </ul>
      <p className="border-t border-line/70 px-5 py-3.5 text-[0.9375rem] leading-snug text-slate sm:px-6">
        Flags are observations to help you follow up. Decisions are made by an ACSP.
      </p>
    </Panel>
  )
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
    <Panel aria-labelledby="activity-title">
      <PanelHeader
        id="activity-title"
        title="Recent activity"
        description="From the audit trail"
        actions={
          <Link to="/agent/invites" className="inline-flex items-center gap-1 text-[0.9375rem] text-ink underline-offset-4 hover:underline">
            All invites
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <ol className="divide-y divide-line/70">
        {events.map((e) => (
          <li key={e.seq} className="px-5 py-4 sm:px-6">
            <p className="text-[0.9375rem] leading-snug text-ink">{e.detail}</p>
            <p className="mt-1.5 flex items-center justify-between gap-3 text-[0.875rem] text-slate">
              <span>{timeAgo(e.at)}</span>
              <span className="font-mono">
                #{e.seq} · {shortHash(e.hash)}
              </span>
            </p>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
