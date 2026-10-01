import { useState } from 'react'
import type { ComponentType } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Minus,
  Plus,
  Shuffle,
} from 'lucide-react'
import {
  CountUp,
  MonoLabel,
  Page,
  Panel,
  PanelHeader,
} from '@/components/app/Page'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import {
  activity,
  decisions,
  decisionTimes,
  fees,
  funnel,
  headline,
  hourSlots,
  identityChecks,
  invitesSent,
  kpis,
  rulesFired,
  volume,
  weekdays,
} from '@/data/operations'
import type { OpsPeriod } from '@/data/operations'
import { ruleById } from '@/data/rules'
import { formatMoney, VERIFICATION_FEE } from '@/lib/format'
import { cn } from '@/lib/utils'
import { nextB2cAcsp, setAllocationShare } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import type { CaseStatus } from '@/types/domain'
import { Bars, Donut, Meter, Sparkline, TrendChart } from './charts'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const MONTH_MS = 30 * 24 * 60 * 60 * 1000

const outcomeLabel = {
  pass: 'Pass',
  flag: 'Flag',
  mandatory: 'Mandatory decision',
  request: 'Request',
  halt: 'Halt',
  block: 'Block',
} as const

/** Live case stages, in journey order, grouped the way an Agent would read them. */
const pipelineStages: { label: string; statuses: CaseStatus[] }[] = [
  { label: 'Invited or in progress', statuses: ['invited', 'in_progress'] },
  { label: 'With the ACSP', statuses: ['in_review'] },
  { label: 'Awaiting information', statuses: ['info_requested'] },
  {
    label: 'Halted for a register correction',
    statuses: ['halted_register_mismatch'],
  },
  {
    label: 'Approved, ready to submit',
    statuses: ['approved', 'submission_started'],
  },
  {
    label: 'Submitted to Companies House',
    statuses: ['submitted', 'confirmed'],
  },
  { label: 'Not completed', statuses: ['declined', 'abandoned'] },
]

export function AdminConsole() {
  const { data, apply } = useDemoStore()
  const [period, setPeriod] = useState<OpsPeriod>('months')
  const now = Date.now()

  // Live demo activity is added to the illustrative history so the presenter's own actions show up.
  const within = (iso: string | undefined, ms: number) =>
    !!iso && now - new Date(iso).getTime() < ms
  const liveDecided = data.cases.filter(
    (c) =>
      within(c.decision?.decidedAt, WEEK_MS) &&
      c.decision?.outcome !== 'request_info',
  ).length
  const series = volume[period]
  const decidedSeries = [
    ...series.decided.slice(0, -1),
    series.decided[series.decided.length - 1] + liveDecided,
  ]
  const head = headline[period]
  const decidedNow = head.decided + liveDecided
  const growth = Math.round(
    ((decidedNow - head.previous) / head.previous) * 100,
  )

  const recentDecided = data.cases.filter(
    (c) =>
      within(c.decision?.decidedAt, MONTH_MS) &&
      c.decision?.outcome !== 'request_info',
  )
  const next = nextB2cAcsp(data)
  const totalShare = data.acsps.reduce((s, a) => s + a.b2cAllocationShare, 0)
  const rows = data.acsps.map((a) => {
    const casesThisMonth =
      a.b2cAllocatedThisMonth +
      recentDecided.filter((c) => c.acspId === a.id).length
    return {
      a,
      casesThisMonth,
      remuneration: casesThisMonth * a.remunerationPerCase,
      fees: casesThisMonth * VERIFICATION_FEE,
    }
  })
  const totalFees = rows.reduce((s, r) => s + r.fees, 0)
  const totalRem = rows.reduce((s, r) => s + r.remuneration, 0)

  const pipeline = pipelineStages.map((s) => ({
    ...s,
    count: data.cases.filter((c) => s.statuses.includes(c.status)).length,
  }))
  const pipelineMax = Math.max(1, ...pipeline.map((p) => p.count))

  return (
    <Page>
      <header className="mb-8 flex flex-col gap-5 border-b border-line/80 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2.5 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
            Platform administration
          </div>
          <h1 className="text-[2rem] leading-[1.1] font-medium tracking-[-0.025em] text-ink sm:text-[2.25rem]">
            Evidence One operations
          </h1>
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate sm:text-[1.0625rem]">
            Volume, review performance and fees across every ACSP on the
            platform, with direct client allocation and what each ACSP is owed.
          </p>
          <p className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-[0.875rem] text-graphite">
            <span className="relative flex size-2.5" aria-hidden="true">
              <span className="animate-live absolute inset-0 rounded-full bg-approve" />
              <span className="relative size-2.5 rounded-full bg-approve" />
            </span>
            Live demo activity included
          </p>
        </div>
        <PeriodSwitch value={period} onChange={setPeriod} />
      </header>

      {/* Headline: decisions over time */}
      <section
        aria-labelledby="volume-title"
        className="relative mb-6 overflow-hidden rounded-3xl bg-ink text-paper shadow-[0_24px_60px_-28px_rgb(22_24_27/0.55)]"
      >
        <div
          className="pointer-events-none absolute -top-40 -right-24 size-[28rem] rounded-full bg-highlight/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[19rem_1fr] lg:gap-10">
          <div className="flex flex-col">
            <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/70 uppercase">
              Reviewer decisions
            </p>
            <h2
              id="volume-title"
              className="mt-1 text-[1.0625rem] text-paper/85"
            >
              {head.caption}
            </h2>
            <p className="mt-5 flex flex-col items-start gap-3">
              <span className="text-[4.5rem] leading-[0.85] font-light tracking-[-0.05em] tabular">
                <CountUp key={period} value={decidedNow} duration={900} />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[0.875rem] whitespace-nowrap text-paper tabular">
                <ArrowUpRight
                  className="size-4 text-highlight"
                  aria-hidden="true"
                />
                {growth}% on the previous{' '}
                {period === 'weeks' ? 'week' : 'month'}
              </span>
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/12 pt-6 lg:grid-cols-1 lg:gap-5">
              <HeroStat
                label="Median time to decision"
                value={`${head.medianHours} h`}
                note={<>Target 36 h</>}
                fill={head.medianHours / 36}
              />
              <HeroStat
                label="Within review target"
                value={`${head.withinTarget}%`}
                note="Decided inside 36 hours"
                fill={head.withinTarget / 100}
              />
              <HeroStat
                label="Approved first time"
                value={`${head.firstPass}%`}
                note="No information requested"
                fill={head.firstPass / 100}
              />
            </dl>
          </div>
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[0.9375rem] text-paper/80">
                Journeys started and decided,{' '}
                {period === 'weeks' ? 'last 12 weeks' : 'last 12 months'}
              </p>
              <ul className="flex items-center gap-5 text-[0.875rem] text-paper/85">
                <li className="flex items-center gap-2">
                  <span
                    className="h-[3px] w-4 rounded-full bg-highlight"
                    aria-hidden="true"
                  />
                  Decided
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="w-4 border-t-2 border-dashed border-silver"
                    aria-hidden="true"
                  />
                  Started
                </li>
              </ul>
            </div>
            <TrendChart
              key={period}
              dark
              height={300}
              labels={series.labels}
              series={[
                {
                  label: 'Started',
                  values: series.started,
                  color: 'var(--silver)',
                  dashed: true,
                },
                {
                  label: 'Decided',
                  values: decidedSeries,
                  color: 'var(--highlight)',
                  area: true,
                },
              ]}
              ariaLabel={`Journeys started and decided by ${period === 'weeks' ? 'week' : 'month'}. Decided: ${decidedSeries.join(', ')}. Started: ${series.started.join(', ')}. Use the arrow keys to read each point.`}
            />
            <p className="mt-3 text-right font-mono text-[0.75rem] tracking-[0.1em] text-paper/60 uppercase">
              Illustrative history for the demo
            </p>
          </div>
        </div>
      </section>

      {/* KPI tiles */}
      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const up = k.delta.startsWith('+')
          const good =
            (up && k.goodWhen === 'up') || (!up && k.goodWhen === 'down')
          const Arrow = up ? ArrowUpRight : ArrowDownRight
          return (
            <div
              key={k.id}
              className="lift group flex flex-col rounded-2xl border border-line/80 bg-white px-5 pt-5 pb-4 shadow-[0_1px_2px_rgb(22_24_27/0.04)]"
            >
              <dt className="text-[0.9375rem] text-slate">{k.label}</dt>
              <dd className="mt-2.5 flex items-baseline justify-between gap-3">
                <span className="text-[2rem] leading-none font-medium tracking-[-0.03em] text-ink tabular">
                  {k.value}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[0.8125rem] font-medium tabular',
                    good
                      ? 'bg-approve-wash text-approve'
                      : 'bg-info-wash text-info',
                  )}
                >
                  <Arrow className="size-3.5" aria-hidden="true" />
                  {k.delta}
                  <span className="sr-only">
                    {good ? ', an improvement' : ', worse than last month'}
                  </span>
                </span>
              </dd>
              <dd className="mt-3">
                <Sparkline values={k.trend} />
              </dd>
              <dd className="mt-2 text-[0.875rem] text-slate">{k.detail}</dd>
            </div>
          )
        })}
      </dl>

      {/* Journey funnel and decisions */}
      <div className="mb-6 grid items-stretch gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Panel aria-labelledby="funnel-title" className="overflow-hidden">
          <PanelHeader
            id="funnel-title"
            title="Journey completion"
            description={`September, from ${invitesSent} invites sent`}
            actions={
              <MonoLabel>
                {Math.round(
                  (funnel[funnel.length - 1].count / invitesSent) * 100,
                )}
                % end to end
              </MonoLabel>
            }
          />
          <ol className="space-y-3.5 p-5 sm:p-6">
            {funnel.map((f, i) => {
              const prev = i === 0 ? invitesSent : funnel[i - 1].count
              const drop = prev - f.count
              return (
                <li
                  key={f.step}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[15.5rem_1fr_auto]"
                >
                  <span className="text-[0.9375rem] text-ink">
                    <span className="mr-2 font-mono text-[0.8125rem] text-slate">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {f.step}
                  </span>
                  <Meter
                    value={f.count}
                    max={invitesSent}
                    delay={i * 60}
                    tone={i === funnel.length - 1 ? 'highlight' : 'ink'}
                    className="order-last col-span-2 h-3 sm:order-none sm:col-span-1"
                  />
                  <span className="w-[6.5rem] text-right text-[0.9375rem] tabular">
                    <span className="font-medium text-ink">{f.count}</span>
                    <span className="ml-2 text-[0.8125rem] text-slate">
                      -{drop}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
          <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
            Most journeys that stop do so before the ACSP decision. The step
            after review reflects information requests and declines, not
            drop-off.
          </p>
        </Panel>

        <Panel aria-labelledby="decisions-title" className="overflow-hidden">
          <PanelHeader
            id="decisions-title"
            title="Reviewer decisions"
            description="September, every decision made by a person"
          />
          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:p-6 xl:flex-col 2xl:flex-row">
            <Donut
              ariaLabel={`Approved ${decisions.approve}, information requested ${decisions.request_info}, declined ${decisions.decline}`}
              segments={[
                {
                  label: 'Approved',
                  value: decisions.approve,
                  color: 'var(--approve)',
                },
                {
                  label: 'Information requested',
                  value: decisions.request_info,
                  color: 'var(--info)',
                },
                {
                  label: 'Declined',
                  value: decisions.decline,
                  color: 'var(--decline)',
                },
              ]}
            >
              <span className="text-[2.25rem] leading-none font-medium tracking-[-0.03em] text-ink tabular">
                <CountUp
                  value={
                    decisions.approve +
                    decisions.request_info +
                    decisions.decline
                  }
                />
              </span>
              <span className="mt-1.5 text-[0.875rem] text-slate">
                decisions
              </span>
            </Donut>
            <ul className="w-full min-w-0 flex-1 space-y-3">
              <DecisionRow
                icon={CircleCheck}
                tone="text-approve"
                label="Approved"
                value={decisions.approve}
              />
              <DecisionRow
                icon={CircleAlert}
                tone="text-info"
                label="Information requested"
                value={decisions.request_info}
              />
              <DecisionRow
                icon={CircleX}
                tone="text-decline"
                label="Declined"
                value={decisions.decline}
              />
            </ul>
          </div>
          <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
            AI raises observations only. No rule and no AI ever declines a case.
          </p>
        </Panel>
      </div>

      {/* Review time, identity checks, rules */}
      <div className="mb-6 grid items-stretch gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel aria-labelledby="sla-title" className="overflow-hidden">
          <PanelHeader
            id="sla-title"
            title="Time to decision"
            description="Decisions by hours taken, up to each mark"
          />
          <div className="p-5 pt-8 sm:p-6 sm:pt-9">
            <Bars
              height={168}
              ariaLabel={`Decisions by hours taken: ${decisionTimes.map((d) => `up to ${d.label} hours, ${d.count}`).join('; ')}. Two decisions took longer than the 36 hour target.`}
              marker={{
                before: decisionTimes.length - 1,
                label: '36 h target',
              }}
              data={decisionTimes.map((d) => ({
                label: d.label,
                value: d.count,
                tone: d.overTarget ? 'warn' : 'ink',
                tip: `${d.count} decisions`,
              }))}
            />
            <p className="mt-4 flex items-center gap-2 text-[0.9375rem] text-graphite">
              <CircleAlert
                className="size-4 shrink-0 text-info"
                aria-hidden="true"
              />
              2 decisions passed the 36 hour review target this month.
            </p>
          </div>
        </Panel>

        <Panel aria-labelledby="idvt-title" className="overflow-hidden">
          <PanelHeader
            id="idvt-title"
            title="Identity checks"
            description="First-attempt pass rate, certified identity provider"
          />
          <ul className="space-y-4 p-5 sm:p-6">
            {identityChecks.map((c, i) => (
              <li key={c.label}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-[0.9375rem] text-ink">{c.label}</span>
                  <span className="text-[0.9375rem] font-medium text-ink tabular">
                    {c.rate}%
                  </span>
                </div>
                <Meter value={c.rate} delay={i * 80} />
                <p className="mt-1 text-[0.8125rem] text-slate tabular">
                  {c.referred} referred to the reviewer
                </p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          aria-labelledby="rules-title"
          className="overflow-hidden lg:col-span-2 xl:col-span-1"
        >
          <PanelHeader
            id="rules-title"
            title="Rules raised most often"
            description="Cases this month, by rule"
          />
          <ul className="divide-y divide-line/70">
            {rulesFired.map((r, i) => {
              const def = ruleById(r.id)
              return (
                <li key={r.id} className="px-5 py-3.5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-mist px-2 py-0.5 font-mono text-[0.8125rem] text-ink">
                      {r.id}
                    </span>
                    {def && (
                      <span className="text-[0.8125rem] text-slate">
                        {outcomeLabel[def.outcome]}
                      </span>
                    )}
                    <span className="ml-auto text-[0.9375rem] font-medium text-ink tabular">
                      {r.count}
                    </span>
                  </div>
                  {def && (
                    <p className="mt-1.5 line-clamp-1 text-[0.9375rem] text-graphite">
                      {def.condition}
                    </p>
                  )}
                  <Meter
                    value={r.count}
                    max={rulesFired[0].count}
                    delay={i * 60}
                    tone="muted"
                    className="mt-2 h-1.5"
                  />
                </li>
              )
            })}
          </ul>
          <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
            Rules are evaluated the same way every time. No rule is ever
            evaluated by AI.
          </p>
        </Panel>
      </div>

      {/* Fees and activity */}
      <div className="mb-6 grid items-stretch gap-6 xl:grid-cols-[1.15fr_1fr]">
        <FeesPanel />
        <ActivityPanel />
      </div>

      {/* Live cases and ACSPs */}
      <div className="mb-6 grid items-start gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel aria-labelledby="pipeline-title" className="overflow-hidden">
          <PanelHeader
            id="pipeline-title"
            title="Cases in this demo"
            description="Live, updates as you work through the story"
            actions={<MonoLabel>{data.cases.length} cases</MonoLabel>}
          />
          <ul className="space-y-3.5 p-5 sm:p-6">
            {pipeline.map((p) => (
              <li
                key={p.label}
                className="grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-x-4 gap-y-1.5"
              >
                <span className="truncate text-[0.9375rem] text-ink">
                  {p.label}
                </span>
                <span className="text-right text-[0.9375rem] font-medium text-ink tabular">
                  {p.count}
                </span>
                <div
                  className="col-span-2 h-2 overflow-hidden rounded-full bg-mist"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out"
                    style={{ width: `${(p.count / pipelineMax) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel aria-labelledby="acsp-title" className="overflow-hidden">
          <PanelHeader
            id="acsp-title"
            title="ACSPs"
            description="Each is supervised for AML and registered with Companies House"
          />
          <ul className="divide-y divide-line/70">
            {data.acsps.map((a) => {
              const open = data.cases.filter(
                (c) =>
                  c.acspId === a.id &&
                  [
                    'in_review',
                    'info_requested',
                    'halted_register_mismatch',
                    'approved',
                  ].includes(c.status),
              ).length
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6"
                >
                  <CompanyMark name={a.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-ink">{a.name}</p>
                    <p className="text-[0.9375rem] text-slate">
                      {a.kind} · {a.supervisor} ·{' '}
                      <span className="font-mono">{a.acspNumber}</span>
                    </p>
                  </div>
                  <div
                    className="flex -space-x-2"
                    aria-label={`${a.reviewers.length} reviewers`}
                  >
                    {a.reviewers.map((r) => (
                      <Avatar key={r.id} seed={r.id} name={r.name} size={34} />
                    ))}
                  </div>
                  <span className="rounded-full bg-progress-wash px-3 py-1 text-[0.875rem] font-medium text-progress tabular">
                    {open} open
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel aria-labelledby="rota-title" className="overflow-hidden">
          <PanelHeader
            id="rota-title"
            title="B2C allocation rota"
            description="Direct clients go to the ACSP furthest below its share"
            actions={
              <Shuffle className="size-5 text-slate" aria-hidden="true" />
            }
          />
          <ul className="space-y-5 p-5 sm:p-6">
            {data.acsps.map((a) => {
              const pct = Math.round((a.b2cAllocationShare / totalShare) * 100)
              return (
                <li key={a.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[0.9375rem] font-medium text-ink">
                      {a.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Lower share for ${a.name}`}
                        onClick={() =>
                          apply((d) =>
                            setAllocationShare(
                              d,
                              a.id,
                              a.b2cAllocationShare - 5,
                            ),
                          )
                        }
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-mist"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-12 text-center font-mono text-[0.9375rem] text-ink tabular">
                        {pct}%
                      </span>
                      <button
                        type="button"
                        aria-label={`Raise share for ${a.name}`}
                        onClick={() =>
                          apply((d) =>
                            setAllocationShare(
                              d,
                              a.id,
                              a.b2cAllocationShare + 5,
                            ),
                          )
                        }
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-mist"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-mist">
                    <div
                      className="h-full rounded-full bg-ink transition-[width] duration-300 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[0.875rem] text-slate tabular">
                    {a.b2cAllocatedThisMonth} direct clients this month
                  </p>
                </li>
              )
            })}
          </ul>
          <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
            Next direct client goes to{' '}
            <span className="font-medium text-ink">{next.name}</span>
          </p>
        </Panel>

        <Panel aria-labelledby="rem-title" className="overflow-hidden">
          <PanelHeader
            id="rem-title"
            title="Remuneration this month"
            description={`Direct clients, ${formatMoney(VERIFICATION_FEE)} flat fee per verification`}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left">
              <thead className="bg-mist/50 text-[0.875rem] text-slate">
                <tr>
                  <th
                    scope="col"
                    className="py-2.5 pr-4 pl-5 font-normal sm:pl-6"
                  >
                    ACSP
                  </th>
                  <th
                    scope="col"
                    className="py-2.5 pr-4 text-right font-normal"
                  >
                    Verifications
                  </th>
                  <th
                    scope="col"
                    className="py-2.5 pr-4 text-right font-normal"
                  >
                    Rate
                  </th>
                  <th
                    scope="col"
                    className="py-2.5 pr-6 text-right font-normal"
                  >
                    Owed
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ a, casesThisMonth, remuneration }) => (
                  <tr key={a.id} className="border-t border-line/70">
                    <td className="py-3.5 pr-4 pl-5 text-[0.9375rem] text-ink sm:pl-6">
                      {a.name}
                    </td>
                    <td className="py-3.5 pr-4 text-right text-[0.9375rem] text-ink tabular">
                      {casesThisMonth}
                    </td>
                    <td className="py-3.5 pr-4 text-right text-[0.9375rem] text-slate tabular">
                      {formatMoney(a.remunerationPerCase)}
                    </td>
                    <td className="py-3.5 pr-6 text-right text-[0.9375rem] font-medium text-ink tabular">
                      {formatMoney(remuneration)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-mist/40">
                  <td className="py-3.5 pr-4 pl-5 text-[0.9375rem] font-medium text-ink sm:pl-6">
                    Total
                  </td>
                  <td
                    colSpan={2}
                    className="py-3.5 pr-4 text-right text-[0.9375rem] text-slate"
                  >
                    Fees {formatMoney(totalFees)}
                  </td>
                  <td className="py-3.5 pr-6 text-right text-[0.9375rem] font-medium text-ink tabular">
                    {formatMoney(totalRem)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>
      </div>
    </Page>
  )
}

function PeriodSwitch({
  value,
  onChange,
}: {
  value: OpsPeriod
  onChange: (p: OpsPeriod) => void
}) {
  const options: { id: OpsPeriod; label: string }[] = [
    { id: 'weeks', label: 'Weekly' },
    { id: 'months', label: 'Monthly' },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Period"
      className="inline-flex shrink-0 rounded-xl border border-line bg-white p-1"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'min-h-10 cursor-pointer rounded-lg px-4 text-[0.9375rem] font-medium transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none',
            value === o.id
              ? 'bg-ink text-paper'
              : 'text-graphite hover:bg-mist',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function HeroStat({
  label,
  value,
  note,
  fill,
}: {
  label: string
  value: string
  note: React.ReactNode
  fill: number
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.875rem] leading-snug text-paper/75">{label}</dt>
      <dd className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-[1.5rem] leading-none font-medium tracking-[-0.02em] tabular">
          {value}
        </span>
        <span className="hidden text-[0.8125rem] text-paper/65 lg:inline">
          {note}
        </span>
      </dd>
      <dd
        className="mt-2 h-1 overflow-hidden rounded-full bg-white/12"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-paper/85"
          style={{ width: `${Math.min(1, fill) * 100}%` }}
        />
      </dd>
    </div>
  )
}

function DecisionRow({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  tone: string
  label: string
  value: number
}) {
  const total = decisions.approve + decisions.request_info + decisions.decline
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line/70 px-3.5 py-3">
      <Icon className={cn('size-5 shrink-0', tone)} aria-hidden="true" />
      <span className="min-w-0 flex-1 text-[0.9375rem] text-ink">{label}</span>
      <span className="text-[0.9375rem] font-medium text-ink tabular">
        {value}
      </span>
      <span className="w-10 text-right text-[0.8125rem] text-slate tabular">
        {Math.round((value / total) * 100)}%
      </span>
    </li>
  )
}

function FeesPanel() {
  const max = Math.max(...fees.map((f) => f.agentCode + f.payMyself))
  const latest = fees[fees.length - 1]
  const latestTotal = (latest.agentCode + latest.payMyself) * VERIFICATION_FEE
  const prior = fees[fees.length - 2]
  const change = Math.round(
    ((latest.agentCode + latest.payMyself) /
      (prior.agentCode + prior.payMyself) -
      1) *
      100,
  )
  return (
    <Panel aria-labelledby="fees-title" className="overflow-hidden">
      <PanelHeader
        id="fees-title"
        title="Verification fees"
        description="By payment route, last six months"
        actions={
          <div className="text-right">
            <p className="text-[1.5rem] leading-none font-medium tracking-[-0.02em] text-ink tabular">
              {formatMoney(latestTotal)}
            </p>
            <p className="mt-1 text-[0.8125rem] text-slate">
              September, up {change}%
            </p>
          </div>
        }
      />
      <div className="p-5 sm:p-6">
        <ul className="mb-5 flex flex-wrap gap-5 text-[0.875rem] text-graphite">
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-[3px] bg-ink" aria-hidden="true" />
            Agent Payment Code
          </li>
          <li className="flex items-center gap-2">
            <span
              className="size-3 rounded-[3px] bg-silver"
              aria-hidden="true"
            />
            Pay myself
          </li>
        </ul>
        <StackedFees max={max} />
      </div>
    </Panel>
  )
}

function StackedFees({ max }: { max: number }) {
  return (
    <div
      role="img"
      aria-label={`Fees by month: ${fees.map((f) => `${f.month} ${formatMoney((f.agentCode + f.payMyself) * VERIFICATION_FEE)}`).join(', ')}`}
    >
      <div className="flex h-52 items-end gap-3 border-b border-line sm:gap-5">
        {fees.map((f, i) => {
          const total = f.agentCode + f.payMyself
          return (
            <div
              key={f.month}
              className="group relative flex h-full flex-1 flex-col justify-end"
            >
              <span className="mb-1.5 text-center text-[0.8125rem] font-medium text-ink tabular opacity-80 group-hover:opacity-100">
                {formatMoney(total * VERIFICATION_FEE)}
              </span>
              <div
                className="animate-grow-y flex origin-bottom flex-col gap-[2px]"
                style={{
                  height: `${(total / max) * 82}%`,
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div
                  className="rounded-t-[4px] bg-silver transition-colors group-hover:bg-slate"
                  style={{ flex: f.payMyself }}
                />
                <div className="bg-ink" style={{ flex: f.agentCode }} />
              </div>
              <div className="pointer-events-none absolute -top-14 left-1/2 z-10 w-max -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-[0.8125rem] text-paper opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 tabular">
                {f.agentCode} by code · {f.payMyself} paid directly
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-3 sm:gap-5">
        {fees.map((f) => (
          <span
            key={f.month}
            className="flex-1 text-center font-mono text-[0.75rem] text-slate"
          >
            {f.month}
          </span>
        ))}
      </div>
    </div>
  )
}

const heatSteps = [
  'var(--mist)',
  '#dfe2e5',
  '#bfc4c9',
  '#8a9097',
  '#4a5057',
  'var(--ink)',
]

function ActivityPanel() {
  const max = Math.max(...activity.flat())
  const peak = activity
    .flatMap((row, d) => row.map((v, h) => ({ v, d, h })))
    .sort((a, b) => b.v - a.v)[0]
  return (
    <Panel aria-labelledby="activity-title" className="overflow-hidden">
      <PanelHeader
        id="activity-title"
        title="When people verify"
        description="Journeys started by day and time, last four weeks"
      />
      <div className="p-5 sm:p-6">
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[26rem] border-separate border-spacing-[3px]"
            aria-describedby="activity-peak"
          >
            <thead>
              <tr>
                <th scope="col" className="w-10">
                  <span className="sr-only">Day</span>
                </th>
                {hourSlots.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="pb-1 text-center font-mono text-[0.75rem] font-normal text-slate"
                  >
                    {h}:00
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activity.map((row, d) => (
                <tr key={weekdays[d]}>
                  <th
                    scope="row"
                    className="pr-2 text-left text-[0.875rem] font-normal text-slate"
                  >
                    {weekdays[d]}
                  </th>
                  {row.map((v, h) => {
                    const step = Math.round((v / max) * (heatSteps.length - 1))
                    return (
                      <td key={h} className="p-0">
                        <div
                          title={`${weekdays[d]} ${hourSlots[h]}:00, ${v} journeys`}
                          className="h-8 rounded-[5px] transition-transform duration-150 hover:scale-110"
                          style={{ background: heatSteps[step] }}
                        >
                          <span className="sr-only">{v}</span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p id="activity-peak" className="text-[0.9375rem] text-graphite">
            Busiest: {weekdays[peak.d]} around {hourSlots[peak.h]}:00, with a
            second peak in the early evening.
          </p>
          <div
            className="flex items-center gap-1.5 text-[0.8125rem] text-slate"
            aria-hidden="true"
          >
            Fewer
            {heatSteps.map((c) => (
              <span
                key={c}
                className="size-3.5 rounded-[3px]"
                style={{ background: c }}
              />
            ))}
            More
          </div>
        </div>
      </div>
    </Panel>
  )
}
