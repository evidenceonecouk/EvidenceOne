import { useState } from 'react'
import { CircleCheck, CircleX, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { PendingDecision } from '@/components/PendingDecision'
import { AcspStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import {
  approveApplication,
  PLATFORM_ADMIN,
  rejectApplication,
  statusOnApproval,
} from '@/store/platformActions'
import type { OnboardingApplication } from '@/types/domain'
import { AdminHeader, Figure, StateBadge } from './kit'

const humanise = (key: string) => {
  const t = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const show = (v: string | number | boolean | string[]) =>
  typeof v === 'boolean'
    ? v
      ? 'Yes'
      : 'No'
    : Array.isArray(v)
      ? v.join(', ') || 'None'
      : String(v)

export function ApprovalsPage() {
  const { data, state, apply } = useDemoStore()
  const toast = useToast()
  const canAct = state.persona === 'platformAdmin'
  const pending = data.applications.filter(
    (a) => a.status === 'pending_approval',
  )
  const decided = data.applications.filter(
    (a) => a.status !== 'pending_approval',
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const app: OnboardingApplication | undefined =
    data.applications.find((a) => a.id === selectedId) ??
    pending[0] ??
    decided[0]

  const outcome =
    app?.kind === 'acsp' && app.status === 'pending_approval'
      ? statusOnApproval(data, app.name)
      : undefined

  return (
    <Page>
      <AdminHeader
        kicker="Platform Administrator"
        title="Approvals"
        description="A Platform Administrator approves every ACSP and every Referral Partner before it goes live. Read the answers by section, then approve or reject."
      />

      <Panel aria-label="Approval summary" className="mb-6 overflow-hidden">
        <dl className="grid divide-line/70 sm:grid-cols-3 sm:divide-x">
          <Figure label="Waiting for approval" value={pending.length} />
          <Figure
            label="Approved"
            value={decided.filter((a) => a.status === 'approved').length}
          />
          <Figure
            label="Rejected"
            value={decided.filter((a) => a.status === 'rejected').length}
          />
        </dl>
      </Panel>

      {!canAct && (
        <p className="mb-6 flex items-center gap-2 rounded-2xl border border-line bg-mist/50 px-5 py-3.5 text-[0.9375rem] text-graphite">
          <Lock className="size-4 shrink-0 text-slate" aria-hidden="true" />
          Approving an ACSP or a Referral Partner is for the Platform
          Administrator. You can read the applications here.
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.9fr]">
        <Panel aria-labelledby="apps-title" className="overflow-hidden">
          <PanelHeader id="apps-title" title="Applications" />
          {data.applications.length === 0 ? (
            <p className="px-5 py-6 text-[0.9375rem] text-slate sm:px-6">
              No applications yet. A new ACSP or Referral Partner appears here
              after it submits the join form.
            </p>
          ) : (
            <ul className="divide-y divide-line/70">
              {[...pending, ...decided].map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    aria-pressed={app?.id === a.id}
                    onClick={() => {
                      setSelectedId(a.id)
                      setRejecting(false)
                    }}
                    className={cn(
                      'w-full cursor-pointer px-5 py-4 text-left transition-colors focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none focus-visible:ring-inset sm:px-6',
                      app?.id === a.id ? 'bg-mist/60' : 'hover:bg-mist/40',
                    )}
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-base font-medium text-ink">
                        {a.name}
                      </span>
                      <StateBadge
                        tone={
                          a.status === 'approved'
                            ? 'ok'
                            : a.status === 'rejected'
                              ? 'action'
                              : 'info'
                        }
                      >
                        {a.status === 'approved'
                          ? 'Approved'
                          : a.status === 'rejected'
                            ? 'Rejected'
                            : 'Pending approval'}
                      </StateBadge>
                    </span>
                    <span className="mt-1 block text-[0.875rem] text-slate">
                      {a.kind === 'acsp' ? 'ACSP' : 'Referral Partner'} ·{' '}
                      <span className="font-mono">{a.id}</span> ·{' '}
                      {formatDateTime(a.submittedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {app && (
          <Panel aria-labelledby="detail-title" className="overflow-hidden">
            <PanelHeader
              id="detail-title"
              title={app.name}
              description={`${app.kind === 'acsp' ? 'Application to join as an ACSP' : 'Application to join as a Referral Partner'}, submitted ${formatDateTime(app.submittedAt)}`}
              actions={<MonoLabel>{app.id}</MonoLabel>}
            />
            <div className="space-y-6 p-5 sm:p-6">
              {app.kind === 'partner' && (
                <p className="rounded-xl bg-mist/60 px-4 py-3 text-[0.9375rem] text-graphite">
                  The applicant joins as a Referral Partner. It is not the
                  verifying ACSP, sees status and check results only and never
                  decides.
                </p>
              )}
              {Object.entries(app.answers).map(([section, fields]) => (
                <section key={section} aria-label={humanise(section)}>
                  <h3 className="mb-2 text-[0.9375rem] font-medium text-ink">
                    {humanise(section)}
                  </h3>
                  <dl className="divide-y divide-line/70 rounded-xl border border-line/80">
                    {Object.entries(fields).map(([k, v]) => (
                      <div
                        key={k}
                        className="grid gap-1 px-4 py-2.5 sm:grid-cols-[14rem_1fr]"
                      >
                        <dt className="text-[0.9375rem] text-slate">
                          {humanise(k)}
                        </dt>
                        <dd className="text-[0.9375rem] text-ink">{show(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              {Object.keys(app.answers).length === 0 && (
                <p className="text-[0.9375rem] text-slate">
                  No answers were recorded for this application.
                </p>
              )}

              {outcome && (
                <p className="flex flex-wrap items-center gap-2 rounded-xl border border-line px-4 py-3 text-[0.9375rem] text-graphite">
                  On approval the ACSP is created as
                  <AcspStatusChip status={outcome} />
                  {outcome === 'not_yet_listed' && (
                    <>
                      because its name is not on the Companies House published
                      list. Time to register: to be set{' '}
                      <PendingDecision code="M4" />. It can still be allocated
                      and becomes Active when the listing arrives.
                    </>
                  )}
                </p>
              )}

              {app.status === 'pending_approval' ? (
                rejecting ? (
                  <div className="space-y-3 rounded-xl border border-line p-4">
                    <label className="block text-[0.9375rem] font-medium text-ink">
                      Reason for rejecting
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-base text-ink focus-visible:border-ink focus-visible:ring-[3px] focus-visible:ring-ink/20 focus-visible:outline-none"
                      />
                    </label>
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        disabled={!canAct || !reason.trim()}
                        onClick={() => {
                          apply((d) =>
                            rejectApplication(d, app.id, reason.trim()),
                          )
                          toast({
                            title: `${app.name} rejected`,
                            description:
                              'Recorded on the platform audit chain.',
                          })
                          setRejecting(false)
                          setReason('')
                        }}
                      >
                        <CircleX className="size-4" aria-hidden="true" />
                        Reject application
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRejecting(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={!canAct}
                      onClick={() => {
                        apply((d) => approveApplication(d, app.id))
                        toast({
                          title: `${app.name} approved`,
                          description: `By ${PLATFORM_ADMIN}. Recorded on the platform audit chain.`,
                        })
                      }}
                    >
                      <CircleCheck className="size-4" aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!canAct}
                      onClick={() => setRejecting(true)}
                    >
                      <CircleX className="size-4" aria-hidden="true" />
                      Reject
                    </Button>
                  </div>
                )
              ) : (
                <p className="text-[0.9375rem] text-graphite">
                  {app.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                  {app.decidedBy ?? 'a Platform Administrator'}
                  {app.decidedAt ? `, ${formatDateTime(app.decidedAt)}` : ''}.
                  {app.decisionNote ? ` Reason: ${app.decisionNote}` : ''}{' '}
                  {app.status === 'approved' && app.kind === 'acsp' && (
                    <Link
                      to="/admin/monitoring"
                      className="underline underline-offset-2"
                    >
                      See it in ACSP monitoring
                    </Link>
                  )}
                </p>
              )}
            </div>
          </Panel>
        )}
      </div>
    </Page>
  )
}
