import {
  ArrowRight,
  CircleAlert,
  Clock3,
  FileWarning,
  Gavel,
  Inbox,
  Sparkles,
  Waypoints,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { HeroBanner, Page, Panel, StatTile } from '@/components/app/Page'
import { SlaPill } from '@/components/app/SlaPill'
import { CaseStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { ReviewIllustration } from '@/components/visual/Illustrations'
import { useNow } from '@/hooks/useNow'
import { allocationLabel, sourceLabel } from '@/lib/attribution'
import { formatShortDate, fullName, timeRemaining } from '@/lib/format'
import { currentRuleSet, evaluateCase, outstandingFor } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'
import { getCompany, getPartner, getPerson } from '@/store/selectors'
import type {
  CaseSource,
  CaseStatus,
  DemoData,
  VerificationCase,
} from '@/types/domain'
import { ReconfirmBanner } from './ReconfirmBanner'
import { useRouteB } from './RouteBGate'

const filters: { id: string; label: string; statuses: CaseStatus[] }[] = [
  {
    id: 'open',
    label: 'All open',
    statuses: [
      'in_review',
      'info_requested',
      'approved',
      'submission_started',
      'submitted',
    ],
  },
  { id: 'review', label: 'Awaiting review', statuses: ['in_review'] },
  { id: 'info', label: 'Information requested', statuses: ['info_requested'] },
  {
    id: 'submit',
    label: 'To submit',
    statuses: ['approved', 'submission_started', 'submitted'],
  },
  { id: 'closed', label: 'Decided', statuses: ['confirmed', 'declined'] },
]

const sourceFilters: { id: CaseSource | 'all'; label: string }[] = [
  { id: 'all', label: 'All sources' },
  { id: 'referred', label: 'Referred' },
  { id: 'b2c', label: 'B2C' },
  { id: 'own_client', label: 'Own client' },
]

const flagGroups: [string, string][] = [
  ['REG', 'Register difference'],
  ['AML', 'PEP or sanctions'],
  ['ADDL', 'Supporting document'],
  ['DOC', 'Document'],
  ['IDVT', 'Identity check'],
]

export function ReviewQueue() {
  const { data } = useDemoStore()
  const { acsp, reviewer } = useActingAcsp()
  const now = useNow(60000)
  const [filter, setFilter] = useState('open')
  const [source, setSource] = useState<CaseSource | 'all'>('all')
  const mine = data.cases.filter(
    (c) =>
      c.acspId === acsp.id &&
      c.status !== 'invited' &&
      c.status !== 'in_progress' &&
      c.status !== 'abandoned',
  )
  const flagged = useMemo(
    () =>
      mine.filter(
        (c) =>
          c.status === 'in_review' &&
          evaluateCase(data, c).some(
            (r) => r.ruleId.startsWith('REG') && r.outcome !== 'pass',
          ),
      ).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, acsp.id],
  )
  const active = filters.find((f) => f.id === filter)!
  const shown = mine
    .filter((c) => active.statuses.includes(c.status))
    .filter((c) => source === 'all' || (c.source ?? 'referred') === source)
    .sort((a, b) =>
      a.slaDueAt && b.slaDueAt && active.id !== 'closed'
        ? a.slaDueAt.localeCompare(b.slaDueAt)
        : b.createdAt.localeCompare(a.createdAt),
    )
  const awaiting = mine.filter((c) => c.status === 'in_review')
  const dueSoon = awaiting.filter(
    (c) => c.slaDueAt && timeRemaining(c.slaDueAt, now).hours < 12,
  ).length
  const openTasks = data.corrections.filter(
    (t) =>
      t.status !== 'register_updated' &&
      data.cases.find((c) => c.id === t.caseId)?.acspId === acsp.id,
  ).length
  const target = currentRuleSet(data).params.review_target_hours
  const routeB = useRouteB()

  return (
    <Page>
      <ReconfirmBanner />
      <HeroBanner
        kicker="Evidence One Compliance"
        title="Review queue"
        description={`Cases waiting for a decision by ${acsp.name}. Every case carries a ${target}-hour review target from submission, shown to reviewers only.`}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[0.875rem] text-graphite">
              <Avatar seed={reviewer.id} name={reviewer.name} size={22} />
              {reviewer.name} · {reviewer.role}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 font-mono text-[0.8125rem] text-graphite">
              {acsp.acspNumber}
            </span>
          </>
        }
        actions={
          openTasks > 0 &&
          routeB.shown && (
            <Button asChild variant="outline">
              <Link to="/acsp/filings">
                <Waypoints aria-hidden="true" />
                {openTasks} Route B correction{openTasks === 1 ? '' : 's'}
              </Link>
            </Button>
          )
        }
      />

      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Awaiting review"
          value={awaiting.length}
          icon={Inbox}
        />
        <StatTile label="Due within 12 hours" value={dueSoon} icon={Clock3} />
        <StatTile
          label="Register differences flagged"
          value={flagged}
          icon={FileWarning}
          detail="Flagged for your decision, never halted"
        />
        <StatTile
          label="Decided"
          value={
            mine.filter((c) =>
              [
                'submitted',
                'confirmed',
                'declined',
                'approved',
                'submission_started',
              ].includes(c.status),
            ).length
          }
          icon={Gavel}
        />
      </dl>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter cases by status"
          className="flex flex-wrap gap-2"
        >
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
                  filter === f.id
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-white text-ink hover:border-silver',
                )}
              >
                {f.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[0.8125rem] tabular',
                    filter === f.id ? 'bg-white/15' : 'bg-mist',
                  )}
                >
                  {n}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="source-filter"
            className="text-[0.9375rem] text-slate"
          >
            Case source
          </label>
          <select
            id="source-filter"
            value={source}
            onChange={(e) => setSource(e.target.value as CaseSource | 'all')}
            className="h-10 rounded-lg border border-line bg-white px-3 text-[0.9375rem] text-ink focus:border-ink focus:ring-4 focus:ring-ink/10 focus:outline-none"
          >
            {sourceFilters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Panel className="overflow-hidden" role="tabpanel">
        <div
          aria-hidden="true"
          className={cn(
            QROW,
            'hidden h-10 border-b border-line/80 bg-[#f8f8f7] text-[0.8125rem] font-medium tracking-[0.04em] text-slate uppercase sm:grid',
          )}
        >
          <span>Person</span>
          <span className="hidden lg:block">Company and route</span>
          <span>Status and flags</span>
          <span>Source</span>
          <span>Review target</span>
        </div>
        <ul className="divide-y divide-line/70">
          {shown.map((c) => (
            <QueueRow key={c.id} vc={c} data={data} />
          ))}
          {shown.length === 0 && (
            <li className="flex flex-col items-center px-6 py-14 text-center">
              <ReviewIllustration className="h-32 w-auto" />
              <p className="mt-4 text-lg text-ink">Nothing here right now</p>
              <p className="mt-1 text-base text-slate">
                New cases arrive as soon as an individual submits in their
                browser.
              </p>
            </li>
          )}
        </ul>
      </Panel>
    </Page>
  )
}

/* Shared columns for the queue header and rows. */
const QROW =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 px-6 sm:grid-cols-[minmax(0,1.4fr)_13rem_11rem_8rem] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_13rem_11rem_8rem]'

function QueueRow({ vc, data }: { vc: VerificationCase; data: DemoData }) {
  const person = getPerson(data, vc.personId)!
  const company = getCompany(data, vc.companyNumber)!
  const partner = vc.partnerId ? getPartner(data, vc.partnerId) : undefined
  const results = evaluateCase(data, vc)
  const outstanding = outstandingFor(results)
  const mandatory = outstanding.filter((o) => o.reason === 'mandatory_open')
  const flags = flagGroups.filter(([prefix]) =>
    results.some((r) => r.ruleId.startsWith(prefix) && r.outcome !== 'pass'),
  )
  const name = fullName(person)
  const src = vc.source ?? 'referred'
  const waiting =
    vc.status === 'info_requested'
      ? 'Waiting on the individual'
      : vc.status === 'submitted'
        ? 'Reference to record'
        : vc.decision
          ? `Decided ${formatShortDate(vc.decision.decidedAt)}`
          : ''

  return (
    <li
      className={cn(
        QROW,
        'group relative min-h-[5rem] py-4 transition-colors duration-150 hover:bg-[#fafaf9]',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar seed={vc.personId} name={name} size={40} />
        <div className="min-w-0">
          <p className="truncate text-[0.9375rem] font-medium text-ink">
            <Link
              to={`/acsp/cases/${vc.id}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {name}
            </Link>
          </p>
          <p className="truncate font-mono text-[0.875rem] text-slate">
            {vc.id}
          </p>
        </div>
      </div>
      <div className="hidden min-w-0 lg:block">
        <p className="flex items-center gap-2.5">
          <CompanyMark name={company.name} size={24} />
          <span className="min-w-0 truncate text-[0.9375rem] text-graphite">
            {company.name}
          </span>
        </p>
        <p className="mt-0.5 text-[0.8125rem] text-slate">
          Route A · Option {vc.option}
        </p>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1.5">
        <CaseStatusChip status={vc.status} />
        {mandatory.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-info">
            <CircleAlert className="size-3.5" aria-hidden="true" />
            {mandatory.length} Mandatory decision
            {mandatory.length === 1 ? '' : 's'}
          </span>
        )}
        {flags.slice(0, 2).map(([prefix, label]) => (
          <span
            key={prefix}
            className="inline-flex items-center gap-1.5 text-[0.8125rem] text-graphite"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {label} flagged
          </span>
        ))}
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="text-[0.9375rem] font-medium text-ink">
          {sourceLabel[src]}
        </p>
        <p className="line-clamp-2 text-[0.8125rem] leading-snug text-slate">
          {src === 'referred' && partner ? `${partner.name}. ` : ''}
          {allocationLabel(vc)}
        </p>
      </div>
      <div className="hidden items-center justify-between gap-2 sm:flex">
        {vc.status === 'in_review' && vc.slaDueAt ? (
          <SlaPill due={vc.slaDueAt} />
        ) : (
          <span className="text-[0.875rem] text-slate">{waiting}</span>
        )}
        <ArrowRight
          className="relative z-10 size-4 shrink-0 text-slate"
          aria-hidden="true"
        />
      </div>
    </li>
  )
}
