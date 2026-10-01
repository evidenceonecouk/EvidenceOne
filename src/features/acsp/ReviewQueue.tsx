import { ArrowRight, CircleAlert, CirclePause, Clock3, FileWarning, Gavel, Inbox, Sparkles, Waypoints } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HeroBanner, Page, Panel, StatTile } from '@/components/app/Page'
import { SlaPill } from '@/components/app/SlaPill'
import { CaseStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { ReviewIllustration } from '@/components/visual/Illustrations'
import { PRIMARY_ACSP_ID } from '@/data/organisations'
import { useNow } from '@/hooks/useNow'
import { formatShortDate, fullName, timeRemaining } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { getAcsp, getAgent, getCompany, getPerson } from '@/store/selectors'
import type { CaseStatus, VerificationCase } from '@/types/domain'

const filters: { id: string; label: string; statuses: CaseStatus[] }[] = [
  { id: 'open', label: 'All open', statuses: ['in_review', 'info_requested', 'halted_register_mismatch', 'approved'] },
  { id: 'review', label: 'Awaiting review', statuses: ['in_review'] },
  { id: 'paused', label: 'Paused', statuses: ['halted_register_mismatch'] },
  { id: 'info', label: 'Information requested', statuses: ['info_requested'] },
  { id: 'submit', label: 'Ready to submit', statuses: ['approved'] },
  { id: 'closed', label: 'Decided', statuses: ['submitted', 'declined'] },
]

export function ReviewQueue() {
  const { data } = useDemoStore()
  const now = useNow(60000)
  const navigate = useNavigate()
  const [filter, setFilter] = useState('open')
  const acsp = getAcsp(data, PRIMARY_ACSP_ID)!
  const mine = data.cases.filter((c) => c.acspId === acsp.id && !c.inHouse && c.status !== 'invited' && c.status !== 'in_progress' && c.status !== 'abandoned')
  const active = filters.find((f) => f.id === filter)!
  const shown = mine
    .filter((c) => active.statuses.includes(c.status))
    .sort((a, b) => (a.slaDueAt && b.slaDueAt && active.id !== 'closed' ? a.slaDueAt.localeCompare(b.slaDueAt) : b.createdAt.localeCompare(a.createdAt)))
  const awaiting = mine.filter((c) => c.status === 'in_review')
  const dueSoon = awaiting.filter((c) => c.slaDueAt && timeRemaining(c.slaDueAt, now).hours < 12).length
  const openTasks = data.corrections.filter((t) => t.status !== 'register_updated').length

  return (
    <Page>
      <HeroBanner
        kicker="Evidence One Compliance"
        title="Review queue"
        description={`Cases waiting for a decision by ${acsp.name}. Every case carries a 36-hour SLA from submission.`}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[0.875rem] text-graphite">
              <Avatar seed="rev-marsh" name="Eleanor Marsh" size={22} />
              Eleanor Marsh · ACSP reviewer
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 font-mono text-[0.8125rem] text-graphite">{acsp.acspNumber}</span>
          </>
        }
        actions={
          openTasks > 0 && (
            <Button asChild variant="outline">
              <Link to="/acsp/filings">
                <Waypoints aria-hidden="true" />
                {openTasks} Route B correction{openTasks === 1 ? '' : 's'}
              </Link>
            </Button>
          )
        }
        illustration={<ReviewIllustration className="h-48 w-auto" />}
      />

      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Awaiting review" value={awaiting.length} icon={Inbox} tone="progress" />
        <StatTile label="Due within 12 hours" value={dueSoon} icon={Clock3} tone="info" />
        <StatTile label="Paused for the register" value={mine.filter((c) => c.status === 'halted_register_mismatch').length} icon={CirclePause} tone="ai" />
        <StatTile label="Decided" value={mine.filter((c) => ['submitted', 'declined', 'approved'].includes(c.status)).length} icon={Gavel} tone="approve" />
      </dl>

      <div role="tablist" aria-label="Filter cases" className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => {
          const n = mine.filter((c) => f.statuses.includes(c.status)).length
          return (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-[0.9375rem] transition-colors duration-150',
                filter === f.id ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-ink hover:border-silver',
              )}
            >
              {f.label}
              <span className={cn('rounded-full px-1.5 text-[0.8125rem] tabular', filter === f.id ? 'bg-white/15' : 'bg-mist')}>{n}</span>
            </button>
          )
        })}
      </div>

      <Panel className="overflow-hidden" role="tabpanel">
        <div aria-hidden="true" className={cn(QROW, 'hidden h-10 border-b border-line/80 bg-[#f8f8f7] text-[0.8125rem] font-medium tracking-[0.04em] text-slate uppercase sm:grid')}>
          <span>Person</span>
          <span className="hidden lg:block">Company</span>
          <span>Status</span>
          <span>SLA</span>
          <span />
        </div>
        <ul className="divide-y divide-line/70">
          {shown.map((c) => (
            <QueueRow key={c.id} vc={c} onOpen={() => navigate(`/acsp/cases/${c.id}`)} />
          ))}
          {shown.length === 0 && (
            <li className="flex flex-col items-center px-6 py-14 text-center">
              <ReviewIllustration className="h-32 w-auto" />
              <p className="mt-4 text-lg text-ink">Nothing here right now</p>
              <p className="mt-1 text-base text-slate">New cases arrive as soon as an individual submits in the app.</p>
            </li>
          )}
        </ul>
      </Panel>
    </Page>
  )
}

/* Shared columns for the queue header and rows. */
const QROW = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 px-6 sm:grid-cols-[minmax(0,1.5fr)_14rem_9rem_6rem] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_14rem_9rem_6rem]'

function QueueRow({ vc, onOpen }: { vc: VerificationCase; onOpen: () => void }) {
  const { data } = useDemoStore()
  const person = getPerson(data, vc.personId)!
  const company = getCompany(data, vc.companyNumber)!
  const agent = vc.agentId ? getAgent(data, vc.agentId) : undefined
  const flags = vc.observations.filter((o) => o.severity !== 'info')
  const mismatch = vc.comparison.some((r) => r.result === 'mismatch')
  const name = fullName(person)

  const origin = vc.origin === 'b2c' ? 'Direct client, allocated by rota' : `Referred by ${agent?.name}`
  const waiting =
    vc.status === 'info_requested' ? 'Waiting on the individual' : vc.status === 'halted_register_mismatch' ? 'Waiting on the register' : vc.decision ? `Decided ${formatShortDate(vc.decision.decidedAt)}` : ''

  return (
    <li className={cn(QROW, 'group relative min-h-[5rem] py-4 transition-colors duration-150 hover:bg-[#fafaf9]')}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar seed={vc.personId} name={name} size={40} />
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-medium text-ink">
            <Link to={`/acsp/cases/${vc.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {name}
            </Link>
          </p>
          <p className="truncate text-[0.875rem] text-slate">
            <span className="font-mono">{vc.id}</span> · {origin}
          </p>
        </div>
      </div>
      <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
        <CompanyMark name={company.name} size={28} />
        <span className="min-w-0 truncate text-[0.9375rem] text-graphite">{company.name}</span>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <CaseStatusChip status={vc.status} />
        {mismatch && vc.status === 'in_review' ? (
          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-info">
            <FileWarning className="size-3.5" aria-hidden="true" />
            Register mismatch
          </span>
        ) : flags.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-graphite">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {flags.length} AI flag{flags.length === 1 ? '' : 's'} · advisory
          </span>
        ) : vc.idvt.pepSanctionsDetail?.includes('possible') ? (
          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-graphite">
            <CircleAlert className="size-3.5" aria-hidden="true" />
            PEP name match discounted
          </span>
        ) : null}
      </div>
      <div className="hidden sm:block">{vc.status === 'in_review' && vc.slaDueAt ? <SlaPill due={vc.slaDueAt} /> : <span className="text-[0.875rem] text-slate">{waiting}</span>}</div>
      <span className="relative z-10 hidden justify-end sm:flex">
        <Button size="sm" variant="outline" onClick={onOpen} tabIndex={-1} aria-hidden="true">
          Open
          <ArrowRight aria-hidden="true" />
        </Button>
      </span>
    </li>
  )
}
