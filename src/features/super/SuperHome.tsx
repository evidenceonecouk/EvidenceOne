import { ArrowRight, Coins, Handshake, ListChecks } from 'lucide-react'
import { Link } from 'react-router'
import { Page, Panel, PanelHeader } from '@/components/app/Page'
import { AdminHeader, StateBadge } from '@/features/admin/kit'
import {
  ApprovalCard,
  SeatNotice,
  SuperOnlyNotice,
  useSuperSeat,
} from '@/features/super/ApprovalFlow'
import { formatDateTime } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import { isSamePerson, KIND_LABELS } from '@/store/superActions'

/** The Super Administrator's approvals inbox. */
export function SuperHome() {
  const { data } = useDemoStore()
  const { isSuper, seat, other, actor } = useSuperSeat()
  const pending = data.approvals.filter((a) => a.status === 'pending')
  const decided = data.approvals
    .filter((a) => a.status !== 'pending')
    .sort((a, b) => (b.decidedAt ?? '').localeCompare(a.decidedAt ?? ''))
  const rulesWaiting = data.ruleSets.filter(
    (v) => v.status === 'pending_approval',
  )
  const published = data.ruleSets
    .filter((v) => v.publishedAt)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, 3)

  return (
    <Page>
      <AdminHeader
        kicker="Super Administrator"
        title="Approvals"
        description="Changes to the platform fee, subscription plans, referral commissions, disclosure text and rule sets wait here for a second approver. Nobody approves their own change."
      />
      {isSuper ? (
        <SeatNotice />
      ) : (
        <SuperOnlyNotice what="the approvals inbox" />
      )}

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          { to: '/admin/fees', label: 'Fees and plans', icon: Coins },
          {
            to: '/admin/commissions',
            label: 'Referral commissions',
            icon: Handshake,
          },
          { to: '/rules', label: 'Rules and publication', icon: ListChecks },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center justify-between rounded-2xl border border-line/80 bg-white px-5 py-4 text-base font-medium text-ink hover:border-silver hover:bg-mist/50"
          >
            <span className="flex items-center gap-3">
              <l.icon className="size-5" aria-hidden="true" />
              {l.label}
            </span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ))}
      </div>

      <section className="space-y-4" aria-label="Waiting for a second approver">
        <h2 className="text-lg font-medium text-ink">
          Waiting for a second approver ({pending.length + rulesWaiting.length})
        </h2>
        {pending.length + rulesWaiting.length === 0 && (
          <p className="rounded-2xl border border-line/80 bg-white px-5 py-6 text-base text-slate">
            Nothing is waiting. Propose a change on one of the pages above.
          </p>
        )}
        {pending.map((a) => (
          <ApprovalCard key={a.id} approval={a} readOnly={!isSuper} />
        ))}
        {rulesWaiting.map((v) => {
          const mine = v.submittedBy
            ? isSamePerson(v.submittedBy, actor)
            : false
          return (
            <article
              key={v.version}
              className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[0.8125rem] tracking-[0.12em] text-slate uppercase">
                  Rule set
                </p>
                <StateBadge tone="info">Waiting for second approver</StateBadge>
              </div>
              <h3 className="mt-2 text-lg font-medium text-ink">
                Rule set {v.version} is ready to publish
              </h3>
              <p className="mt-1 text-base text-graphite">
                Submitted by{' '}
                {v.submittedBy?.split(',')[0] ?? 'a Super Administrator'}
                {v.submittedAt
                  ? `, ${formatDateTime(v.submittedAt)}`
                  : ''}.{' '}
                {isSuper && mine
                  ? `You submitted it, so ${other.name} publishes it.`
                  : 'A different Super Administrator publishes it on the Rules page, with step-up.'}
              </p>
              <Link
                to="/rules"
                className="mt-3 inline-flex items-center gap-1.5 text-base font-medium text-ink underline underline-offset-4 decoration-silver hover:decoration-ink"
              >
                Open the Rules page
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          )
        })}
      </section>

      <Panel className="mt-8" aria-labelledby="seat-can">
        <PanelHeader
          id="seat-can"
          title="What this seat can do"
          description={isSuper ? `${seat.name}` : 'Read only'}
        />
        <ul className="list-disc space-y-1.5 px-5 py-5 pl-10 text-base text-graphite sm:px-6 sm:pl-11">
          <li>
            {seat.seat === 1
              ? 'Propose a change to the platform fee, a plan, commissions or the disclosure text, with step-up.'
              : `Approve or reject changes proposed by ${other.name}, with step-up.`}
          </li>
          <li>Never approve a change you proposed yourself.</li>
          <li>Rule sets are published on the Rules page by the other seat.</li>
          <li>Neither seat can approve a case or read identity evidence.</li>
        </ul>
      </Panel>

      <Panel className="mt-8" aria-labelledby="recent">
        <PanelHeader id="recent" title="Recent decisions" />
        <ul className="divide-y divide-line/60">
          {decided.length + published.length === 0 && (
            <li className="px-5 py-5 text-base text-slate sm:px-6">
              No decisions yet.
            </li>
          )}
          {decided.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 sm:px-6"
            >
              <div>
                <p className="text-base text-ink">{a.summary}</p>
                <p className="text-[0.875rem] text-slate">
                  {KIND_LABELS[a.kind]} · proposed by{' '}
                  {a.proposedBy.split(',')[0]}, {a.status} by{' '}
                  {a.decidedBy?.split(',')[0]}
                  {a.decidedAt ? `, ${formatDateTime(a.decidedAt)}` : ''}
                  {a.stepUpRef ? ` · step-up ${a.stepUpRef}` : ''}
                </p>
              </div>
              <StateBadge tone={a.status === 'approved' ? 'ok' : 'action'}>
                {a.status === 'approved' ? 'Approved' : 'Rejected'}
              </StateBadge>
            </li>
          ))}
          {published.map((v) => (
            <li
              key={v.version}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 sm:px-6"
            >
              <div>
                <p className="text-base text-ink">
                  Rule set {v.version} published
                </p>
                <p className="text-[0.875rem] text-slate">
                  Proposed by {v.submittedBy?.split(',')[0]}, approved by{' '}
                  {v.approvedBy?.split(',')[0]}
                  {v.publishedAt ? `, ${formatDateTime(v.publishedAt)}` : ''}
                </p>
              </div>
              <StateBadge tone="ok">Published</StateBadge>
            </li>
          ))}
        </ul>
      </Panel>
    </Page>
  )
}
