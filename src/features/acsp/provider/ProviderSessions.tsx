import { Lock, LockOpen, RefreshCw, ScanFace } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { HeroBanner, Page, Panel } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { Portrait } from '@/components/visual/Portrait'
import { portraitFor } from '@/data/portraits'
import { formatDateTime } from '@/lib/format'
import type { ProviderReport } from '@/lib/providerReport'
import { cn } from '@/lib/utils'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'
import { ProviderReportView } from './ProviderReportView'
import { ResultChip, ResultIcon } from './ReportParts'
import { useProviderReports } from './useProviderReports'

const BASE = '/acsp/identity-checks'

function Face({ report, size }: { report: ProviderReport; size: number }) {
  const { data } = useDemoStore()
  const person = data.people.find((p) => p.id === report.samplePersonId)
  const src = report.document?.portrait ?? report.liveness?.reference
  const [failed, setFailed] = useState(false)
  return (
    <span
      className="block shrink-0 overflow-hidden rounded-xl border border-line/80 bg-mist"
      style={{ width: size, height: size * 1.15 }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : person ? (
        <Portrait look={portraitFor(person)} className="h-full w-full" />
      ) : null}
    </span>
  )
}

const resultWords = {
  passed: 'Checks passed',
  flagged: 'Checks flagged',
  not_passed: 'Checks not passed',
  pending: 'In progress',
} as const

function SessionCard({
  report,
  selected,
}: {
  report: ProviderReport
  selected: boolean
}) {
  const doc = report.document
  return (
    <Link
      to={`${BASE}/${report.id}`}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'block rounded-2xl border bg-white p-4 outline-none transition-[border-color,box-shadow] duration-150 focus-visible:ring-[3px] focus-visible:ring-ink',
        selected
          ? 'border-ink shadow-[0_0_0_1px_var(--ink)]'
          : 'border-line/80 hover:border-silver',
      )}
    >
      <div className="flex gap-3">
        <Face report={report} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate font-medium text-ink">{report.name}</span>
            <ResultIcon result={report.result} className="mt-1" />
          </div>
          <div className="truncate text-[0.875rem] text-slate">
            {[doc?.issuingState, doc?.type].filter(Boolean).join(' · ')}
            {report.number !== undefined && ` · Session ${report.number}`}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2 text-[0.875rem] text-slate">
        <span>{resultWords[report.result]}</span>
        {report.createdAt && (
          <span className="tabular">{formatDateTime(report.createdAt)}</span>
        )}
      </div>
    </Link>
  )
}

/* Live sessions hold real identity data, so they need the password the server checks. */
function UnlockPanel({
  wrong,
  onUnlock,
}: {
  wrong: boolean
  onUnlock: (password: string) => void
}) {
  const [value, setValue] = useState('')
  return (
    <Panel className="p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value) onUnlock(value)
        }}
      >
        <label
          htmlFor="provider-password"
          className="flex items-center gap-2 font-medium text-ink"
        >
          <Lock className="size-4" aria-hidden="true" />
          Live sessions are locked
        </label>
        <p
          id="provider-password-hint"
          className="mt-1 text-[0.875rem] leading-snug text-slate"
        >
          They hold real identity data. Enter the password to see them. It is
          forgotten when you close this tab.
        </p>
        <input
          id="provider-password"
          type="password"
          autoComplete="current-password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={
            wrong
              ? 'provider-password-hint provider-password-error'
              : 'provider-password-hint'
          }
          aria-invalid={wrong || undefined}
          className="mt-3 h-11 w-full rounded-lg border border-line bg-white px-3.5 text-base text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-ink"
        />
        {wrong && (
          <p
            id="provider-password-error"
            className="mt-2 text-[0.875rem] text-decline"
          >
            That password was not accepted.
          </p>
        )}
        <Button type="submit" size="sm" className="mt-3 w-full">
          <LockOpen className="size-4" aria-hidden="true" />
          Unlock live sessions
        </Button>
      </form>
    </Panel>
  )
}

/*
  The certified identity provider's reports for this ACSP's sessions. The page
  shows what the provider checked and found; it never decides. The decision stays
  with the ACSP reviewer on the case. The provider is never named.
*/
export function ProviderSessions() {
  const { sessionId } = useParams()
  const { acsp } = useActingAcsp()
  const { feed, reload, unlock, lock } = useProviderReports()
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    await reload()
    setRefreshing(false)
  }

  const reports = feed.state === 'ready' ? feed.reports : []
  const selected = reports.find((r) => r.id === sessionId) ?? reports[0]

  return (
    <Page>
      <HeroBanner
        kicker="Compliance"
        title="Identity checks"
        description="Reports from the certified identity provider: the document, chip, liveness, face match and device checks for each session. They inform your review. The decision is yours."
        meta={
          feed.state === 'ready' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-0.5 text-[0.8125rem] font-medium text-graphite">
              <span
                className={cn(
                  'size-2 rounded-full',
                  feed.live ? 'bg-approve' : 'bg-silver',
                )}
                aria-hidden="true"
              />
              {feed.live
                ? 'Live from the certified identity provider'
                : 'Sample session, fictional person'}
            </span>
          )
        }
        actions={
          <>
            {feed.state === 'ready' && feed.live && (
              <Button variant="ghost" onClick={lock}>
                <Lock className="size-4" aria-hidden="true" />
                Lock
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={refreshing || feed.state === 'loading'}
            >
              <RefreshCw
                className={cn('size-4', refreshing && 'animate-spin')}
                aria-hidden="true"
              />
              Refresh
            </Button>
          </>
        }
      />

      {feed.state === 'loading' ? (
        <Panel className="p-8 text-slate" role="status">
          Loading the provider reports.
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside aria-label="Sessions" className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="font-medium text-ink">Sessions</h2>
              <span className="text-[0.875rem] text-slate">
                {reports.length} {reports.length === 1 ? 'session' : 'sessions'}
              </span>
            </div>
            {reports.map((r) => (
              <SessionCard
                key={r.id}
                report={r}
                selected={r.id === selected?.id}
              />
            ))}
            {(feed.access === 'locked' || feed.access === 'wrong') && (
              <UnlockPanel wrong={feed.access === 'wrong'} onUnlock={unlock} />
            )}
            {feed.failed.map((f) => (
              <Panel key={f.id} className="p-4 text-[0.875rem] text-slate">
                Session {f.id.slice(0, 8)} could not be read (
                {f.status === 404 ? 'not found' : `error ${f.status}`}).
              </Panel>
            ))}
          </aside>

          {selected ? (
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center gap-4">
                <Face report={selected} size={52} />
                <div className="min-w-0">
                  <h2 className="text-[1.75rem] leading-tight font-medium tracking-[-0.02em] text-ink">
                    {selected.name}
                  </h2>
                  <p className="text-[0.9375rem] text-slate">
                    Checks by the certified identity provider for {acsp.name}.
                    Advisory to your review.
                  </p>
                </div>
                <ResultChip
                  result={selected.result}
                  label={resultWords[selected.result]}
                  className="ml-auto px-3 py-1 text-[0.9375rem]"
                />
              </div>
              <ProviderReportView key={selected.id} report={selected} />
            </div>
          ) : (
            <Panel className="flex flex-col items-center gap-3 p-10 text-center">
              <ScanFace className="size-8 text-silver" aria-hidden="true" />
              <p className="text-slate">No provider sessions to show yet.</p>
            </Panel>
          )}
        </div>
      )}
    </Page>
  )
}
