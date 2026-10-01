import { ArrowRight, CalendarClock, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import {
  CountUp,
  MonoLabel,
  Page,
  Panel,
  PanelHeader,
} from '@/components/app/Page'
import { CompanyMark } from '@/components/visual/Avatar'
import { buildObligations } from '@/data/adminPages'
import { verifyChain } from '@/lib/audit'
import { formatDate } from '@/lib/format'
import { currentRuleSet, draftRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { AdminHeader, StateBadge, type Tone } from './kit'

const DAY = 86_400_000

interface Indicator {
  label: string
  status: string
  detail: string
  tone: Tone
  to?: string
}

export function CompliancePage() {
  const { data } = useDemoStore()
  const now = Date.now()
  const rs = currentRuleSet(data)
  const draft = draftRuleSet(data)
  const chainOk = verifyChain(data.audit)
  const inReview = data.cases.filter(
    (c) => c.status === 'in_review' && c.slaDueAt,
  )
  const overdue = inReview.filter((c) => new Date(c.slaDueAt!).getTime() < now)
  const dueSoon = inReview.filter((c) => {
    const left = new Date(c.slaDueAt!).getTime() - now
    return left >= 0 && left < 6 * 3_600_000
  })
  const corrections = data.corrections.filter(
    (t) => t.status !== 'register_updated',
  )
  const holds = Object.keys(data.retentionHolds ?? {}).length
  const reviewers = data.acsps.flatMap((a) => a.reviewers)
  const attested = reviewers.filter(
    (r) => r.attestation && new Date(r.attestation.expiresOn).getTime() > now,
  )

  const groups: { title: string; items: Indicator[] }[] = [
    {
      title: 'Registration and supervision',
      items: [
        {
          label: 'ACSP registration',
          status: `${data.acsps.length} of ${data.acsps.length} registered`,
          detail: 'Every ACSP firm holds a current Companies House ACSP number',
          tone: 'ok',
        },
        {
          label: 'AML supervision',
          status: 'All supervised',
          detail: 'Next review: Harcourt Lane Solicitors LLP, March 2027',
          tone: 'ok',
        },
        {
          label: 'Option 2 training',
          status: `${attested.length} of ${reviewers.length} reviewers`,
          detail:
            'Only trained reviewers can carry out an Option 2 person check',
          tone: attested.length ? 'ok' : 'attention',
        },
      ],
    },
    {
      title: 'Rules and decisions',
      items: [
        {
          label: 'Rule set in force',
          status: `Version ${rs.version}`,
          detail: `Effective ${rs.effectiveFrom ? formatDate(rs.effectiveFrom) : 'now'}${draft ? `. Draft ${draft.version} is ${draft.status === 'pending_approval' ? 'awaiting second approval' : 'in progress'}` : ''}`,
          tone: draft?.status === 'pending_approval' ? 'attention' : 'ok',
          to: '/rules',
        },
        {
          label: 'Review target',
          status: overdue.length
            ? `${overdue.length} past 36 hours`
            : dueSoon.length
              ? `${dueSoon.length} due within 6 hours`
              : 'All within target',
          detail: `${inReview.length} cases with reviewers now`,
          tone: overdue.length ? 'action' : dueSoon.length ? 'attention' : 'ok',
        },
        {
          label: 'Register corrections',
          status: corrections.length
            ? `${corrections.length} open`
            : 'None open',
          detail: corrections.length
            ? 'Route A is paused for these people until the register is updated'
            : 'Every register matches the evidence',
          tone: corrections.length ? 'attention' : 'ok',
        },
        {
          label: 'AI decisions',
          status: 'None possible',
          detail:
            'AI writes observations only. Its service account cannot approve or decline',
          tone: 'ok',
          to: '/admin/users',
        },
      ],
    },
    {
      title: 'Records and data',
      items: [
        {
          label: 'Audit trail integrity',
          status: chainOk ? 'Chain intact' : 'Chain broken',
          detail: `${data.audit.length} entries, every hash checked`,
          tone: chainOk ? 'ok' : 'action',
          to: '/admin/audit',
        },
        {
          label: 'Retention',
          status: 'No exceptions',
          detail: holds
            ? `${holds} record${holds === 1 ? '' : 's'} on hold. Nothing past its retention date`
            : 'Nothing past its retention date',
          tone: 'ok',
          to: '/admin/retention',
        },
        {
          label: 'Biometric deletion',
          status: `Within ${rs.params.biometric_deletion_days} days`,
          detail:
            'Raw samples deleted after completion. Next run tomorrow at 02:00',
          tone: 'ok',
        },
        {
          label: 'Personal code',
          status: 'Never held',
          detail:
            'Companies House emails it to the individual. Evidence One does not receive or keep it',
          tone: 'ok',
        },
      ],
    },
    {
      title: 'Security and complaints',
      items: [
        {
          label: 'Security incidents',
          status: '0',
          detail: 'Last penetration test 14 August 2026, no high findings',
          tone: 'ok',
        },
        {
          label: 'Regulatory information requests',
          status: '0 open',
          detail: 'None received this year',
          tone: 'ok',
        },
        {
          label: 'Complaints',
          status: '1 open',
          detail: 'About a reminder email, response due 8 October',
          tone: 'attention',
        },
      ],
    },
  ]

  const all = groups.flatMap((g) => g.items)
  const ok = all.filter((i) => i.tone === 'ok').length
  const attention = all.filter((i) => i.tone === 'attention').length
  const action = all.filter((i) => i.tone === 'action').length
  const obligations = buildObligations(now)

  return (
    <Page>
      <AdminHeader
        title="Compliance"
        description="Regulatory posture across every ACSP on the platform, kept apart from the operational figures on purpose."
      />

      <section
        aria-labelledby="posture-title"
        className="mb-6 overflow-hidden rounded-3xl bg-ink text-paper shadow-[0_24px_60px_-28px_rgb(22_24_27/0.55)]"
      >
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
          <div
            className="pointer-events-none absolute -top-32 -left-24 size-[24rem] rounded-full bg-highlight/10 blur-3xl"
            aria-hidden="true"
          />
          <PostureRing ok={ok} total={all.length} />
          <div className="relative min-w-0">
            <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/70 uppercase">
              Compliance posture
            </p>
            <h2
              id="posture-title"
              className="mt-2 text-[1.75rem] leading-tight font-light tracking-[-0.02em] sm:text-[2rem]"
            >
              {action
                ? `${action} item needs action now`
                : attention
                  ? `${attention} items to keep an eye on, nothing overdue`
                  : 'Everything is in order'}
            </h2>
            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/12 pt-6 sm:max-w-xl">
              <PostureStat label="In order" value={ok} dot="bg-approve" />
              <PostureStat
                label="Attention"
                value={attention}
                dot="bg-[#e3a43a]"
              />
              <PostureStat label="Action" value={action} dot="bg-[#f0705f]" />
            </dl>
            <p className="mt-5 flex items-center gap-2 text-[0.9375rem] text-paper/75">
              <ShieldCheck
                className="size-4 text-highlight"
                aria-hidden="true"
              />
              Checked continuously from live platform records. Interpretation
              stays with the ACSP.
            </p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {groups.map((g) => (
            <Panel
              key={g.title}
              aria-labelledby={`g-${g.title}`}
              className="overflow-hidden"
            >
              <PanelHeader
                id={`g-${g.title}`}
                title={g.title}
                actions={
                  <MonoLabel>
                    {g.items.filter((i) => i.tone === 'ok').length}/
                    {g.items.length} in order
                  </MonoLabel>
                }
              />
              <ul className="divide-y divide-line/70">
                {g.items.map((i) => {
                  const body = (
                    <>
                      <span
                        className={cn(
                          'mt-1.5 size-2 shrink-0 rounded-full',
                          i.tone === 'ok'
                            ? 'bg-approve'
                            : i.tone === 'attention'
                              ? 'bg-info'
                              : 'bg-decline',
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-medium text-ink">
                          {i.label}
                        </span>
                        <span className="mt-0.5 block text-[0.9375rem] text-slate">
                          {i.detail}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1.5 text-right">
                        <StateBadge tone={i.tone}>
                          {i.tone === 'ok'
                            ? 'In order'
                            : i.tone === 'attention'
                              ? 'Attention'
                              : 'Action'}
                        </StateBadge>
                        <span className="text-[0.875rem] text-ink tabular">
                          {i.status}
                        </span>
                      </span>
                      {i.to && (
                        <ArrowRight
                          className="mt-1 size-4 shrink-0 text-slate transition-transform duration-150 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )
                  return (
                    <li key={i.label}>
                      {i.to ? (
                        <Link
                          to={i.to}
                          className="group flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-mist/50 focus-visible:bg-mist/50 sm:px-6"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-4 px-5 py-4 sm:px-6">
                          {body}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </Panel>
          ))}
        </div>

        <div className="space-y-6 xl:sticky xl:top-20">
          <Panel aria-labelledby="obl-title" className="overflow-hidden">
            <PanelHeader
              id="obl-title"
              title="Coming up"
              description="Dated obligations, nearest first"
              actions={
                <CalendarClock
                  className="size-5 text-slate"
                  aria-hidden="true"
                />
              }
            />
            <ol className="relative px-5 py-5 sm:px-6">
              <span
                className="absolute top-7 bottom-7 left-[1.84rem] w-px bg-line sm:left-[2.34rem]"
                aria-hidden="true"
              />
              {obligations.map((o) => {
                const days = Math.round((new Date(o.due).getTime() - now) / DAY)
                return (
                  <li
                    key={o.label}
                    className="relative flex gap-4 pb-5 last:pb-0"
                  >
                    <span
                      className={cn(
                        'relative z-10 mt-1 size-3 shrink-0 rounded-full border-2',
                        days <= 10
                          ? 'border-ink bg-ink'
                          : 'border-silver bg-white',
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] font-medium text-ink">
                        {o.label}
                      </p>
                      <p className="text-[0.875rem] text-slate">
                        {formatDate(o.due)} · {o.owner}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.8125rem] text-graphite tabular">
                      {days === 1 ? '1 day' : `${days} days`}
                    </span>
                  </li>
                )
              })}
            </ol>
          </Panel>

          <Panel aria-labelledby="sup-title" className="overflow-hidden">
            <PanelHeader
              id="sup-title"
              title="Supervision"
              description="Each ACSP and its AML supervisor"
            />
            <ul className="divide-y divide-line/70">
              {data.acsps.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-4 sm:px-6"
                >
                  <CompanyMark name={a.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9375rem] font-medium text-ink">
                      {a.name}
                    </p>
                    <p className="truncate text-[0.875rem] text-slate">
                      {a.supervisor}
                    </p>
                  </div>
                  <span className="font-mono text-[0.8125rem] text-graphite">
                    {a.acspNumber}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </Page>
  )
}

function PostureRing({ ok, total }: { ok: number; total: number }) {
  const size = 176
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const len = (ok / total) * c
  return (
    <div
      className="relative mx-auto shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${ok} of ${total} indicators in order`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(250 250 249 / 0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--highlight)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${len} ${c}`}
          className="animate-ring"
          style={{ '--ring': `${c}px` } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[3rem] leading-none font-light tracking-[-0.04em] tabular">
          <CountUp value={ok} />
          <span className="text-paper/50">/{total}</span>
        </span>
        <span className="mt-1.5 text-[0.875rem] text-paper/70">in order</span>
      </div>
    </div>
  )
}

function PostureStat({
  label,
  value,
  dot,
}: {
  label: string
  value: number
  dot: string
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-[0.875rem] text-paper/75">
        <span className={cn('size-2 rounded-full', dot)} aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-[1.75rem] leading-none font-medium tabular">
        {value}
      </dd>
    </div>
  )
}
