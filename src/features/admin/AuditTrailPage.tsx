import { useMemo, useState } from 'react'
import { ArrowRight, Bot, Cog, FlaskConical, Loader2, RotateCcw, Search, ShieldCheck, ShieldX, User } from 'lucide-react'
import { Link } from 'react-router'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { verifyChain } from '@/lib/audit'
import { formatDateTime, shortHash, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { recordChainCheck } from '@/store/adminActions'
import { useDemoStore } from '@/store/DemoStore'
import type { AuditActorType, AuditEvent } from '@/types/domain'
import { AdminHeader } from './kit'

const actorMeta: Record<AuditActorType, { label: string; icon: typeof User; cls: string }> = {
  person: { label: 'Person', icon: User, cls: 'bg-ink text-paper' },
  system: { label: 'System', icon: Cog, cls: 'bg-mist text-ink' },
  ai: { label: 'AI', icon: Bot, cls: 'bg-ai-wash text-ai ring-1 ring-line' },
}

type Filter = 'all' | AuditActorType

/** Finds the first entry whose hash no longer matches, the way an independent checker would. */
function firstBreak(chain: AuditEvent[]) {
  for (let i = 1; i <= chain.length; i++) if (!verifyChain(chain.slice(0, i))) return chain[i - 1].seq
  return null
}

export function AuditTrailPage() {
  const { data, apply } = useDemoStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<string | null>(null)
  const [tamper, setTamper] = useState<{ seq: number; breakAt: number | null } | null>(null)
  const chainOk = useMemo(() => verifyChain(data.audit), [data.audit])

  const counts = useMemo(() => {
    const c = { person: 0, system: 0, ai: 0 }
    data.audit.forEach((e) => c[e.actorType]++)
    return c
  }, [data.audit])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...data.audit]
      .reverse()
      .filter((e) => filter === 'all' || e.actorType === filter)
      .filter((e) => !q || [e.action, e.detail, e.actor, e.caseId ?? '', e.hash].some((s) => s.toLowerCase().includes(q)))
  }, [data.audit, filter, query])

  const runCheck = () => {
    setChecking(true)
    window.setTimeout(() => {
      const ok = verifyChain(data.audit)
      apply((d) => recordChainCheck(d, d.audit.length, ok, 'Chain checker, read-only'))
      setLastCheck(new Date().toISOString())
      setChecking(false)
    }, 900)
  }

  // Edits one entry in a copy of the chain and re-checks it. The real chain is never changed.
  const simulateTamper = () => {
    const target = data.audit[Math.max(0, data.audit.length - 12)]
    const copy = data.audit.map((e) => (e.seq === target.seq ? { ...e, detail: `${e.detail} (edited)` } : e))
    setTamper({ seq: target.seq, breakAt: firstBreak(copy) })
  }

  const latest = data.audit[data.audit.length - 1]

  return (
    <Page>
      <AdminHeader
        title="Audit trail"
        description="Every action on the platform, append-only. Each entry's hash includes the one before it, so changing any entry breaks every entry after it."
        actions={
          <>
            <Button variant="outline" onClick={simulateTamper}>
              <FlaskConical className="size-4" aria-hidden="true" />
              Show what tampering looks like
            </Button>
            <Button onClick={runCheck} disabled={checking}>
              {checking ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
              {checking ? 'Checking every hash' : 'Check the chain now'}
            </Button>
          </>
        }
      />

      <section
        aria-live="polite"
        className={cn('mb-6 overflow-hidden rounded-3xl border p-6 sm:p-7', chainOk ? 'border-approve/25 bg-approve-wash' : 'border-decline/30 bg-decline-wash')}
      >
        <div className="flex flex-wrap items-start gap-5">
          <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-2xl text-white', chainOk ? 'bg-approve' : 'bg-decline')}>
            {chainOk ? <ShieldCheck className="size-6" aria-hidden="true" /> : <ShieldX className="size-6" aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className={cn('text-[1.375rem] font-medium', chainOk ? 'text-approve' : 'text-decline')}>{chainOk ? 'Chain verified' : 'Chain broken'}</h2>
            <p className="mt-1 text-[0.9375rem] text-graphite">
              {data.audit.length} entries from genesis to <span className="font-mono">{shortHash(latest.hash)}</span>.{' '}
              {lastCheck ? `Checked ${timeAgo(lastCheck)} by an independent read-only job.` : 'Re-checked automatically every night at 05:00 by an independent read-only job.'}
            </p>
            <p className="mt-1 text-[0.9375rem] text-graphite">Daily anchor written to write-once storage, kept for 7 years.</p>
          </div>
          <dl className="grid grid-cols-3 gap-6">
            {(['person', 'system', 'ai'] as const).map((k) => (
              <div key={k}>
                <dt className="text-[0.875rem] text-graphite">{actorMeta[k].label}</dt>
                <dd className="text-[1.5rem] leading-tight font-medium text-ink tabular">{counts[k]}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ChainStrip chain={data.audit} brokenFrom={tamper?.breakAt ?? null} />
      </section>

      {tamper && (
        <section aria-live="polite" className="mb-6 flex flex-wrap items-start gap-4 rounded-2xl border border-decline/30 bg-white p-5 sm:p-6">
          <ShieldX className="mt-0.5 size-5 shrink-0 text-decline" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-medium text-ink">Simulation: entry #{String(tamper.seq).padStart(4, '0')} edited in a copy</p>
            <p className="mt-1 text-[0.9375rem] text-graphite">
              The checker fails at #{String(tamper.breakAt ?? tamper.seq).padStart(4, '0')} and flags every entry after it, shown in red above. The live chain was not touched and is still intact.
            </p>
          </div>
          <Button variant="outline" onClick={() => setTamper(null)}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Clear simulation
          </Button>
        </section>
      )}

      <Panel aria-labelledby="entries-title" className="overflow-hidden">
        <PanelHeader id="entries-title" title="Entries" description={`${rows.length} shown, newest first`} />
        <div className="flex flex-col gap-3 border-b border-line/70 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div role="radiogroup" aria-label="Actor" className="inline-flex shrink-0 rounded-xl border border-line bg-white p-1">
            {(['all', 'person', 'system', 'ai'] as const).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  'min-h-10 cursor-pointer rounded-lg px-3.5 text-[0.9375rem] font-medium transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none',
                  filter === f ? 'bg-ink text-paper' : 'text-graphite hover:bg-mist',
                )}
              >
                {f === 'all' ? 'All' : actorMeta[f].label}
              </button>
            ))}
          </div>
          <label className="relative flex-1 sm:max-w-sm">
            <span className="sr-only">Search entries</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search action, case, actor or hash"
              className="h-12 w-full rounded-xl border border-line bg-white pr-4 pl-10 text-base text-ink placeholder:text-slate focus-visible:border-ink focus-visible:ring-[3px] focus-visible:ring-ink/20 focus-visible:outline-none"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left">
            <thead className="bg-mist/50 text-[0.875rem] text-slate">
              <tr>
                <th scope="col" className="py-2.5 pr-4 pl-5 font-normal sm:pl-6">#</th>
                <th scope="col" className="py-2.5 pr-4 font-normal">Time</th>
                <th scope="col" className="py-2.5 pr-4 font-normal">Actor</th>
                <th scope="col" className="py-2.5 pr-4 font-normal">Action</th>
                <th scope="col" className="py-2.5 pr-4 font-normal">Detail</th>
                <th scope="col" className="py-2.5 pr-6 font-normal">Chain</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 120).map((e) => {
                const meta = actorMeta[e.actorType]
                const broken = tamper?.breakAt != null && e.seq >= tamper.breakAt
                return (
                  <tr key={e.seq} className={cn('border-t border-line/70 align-top', e.actorType === 'ai' && 'bg-ai-wash/40', broken && 'bg-decline-wash/60')}>
                    <td className="py-3.5 pr-4 pl-5 font-mono text-[0.875rem] text-slate tabular sm:pl-6">{String(e.seq).padStart(4, '0')}</td>
                    <td className="py-3.5 pr-4 font-mono text-[0.8125rem] whitespace-nowrap text-graphite">{formatDateTime(e.at)}</td>
                    <td className="py-3.5 pr-4">
                      <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.75rem] font-medium tracking-[0.06em] uppercase', meta.cls)}>
                        <meta.icon className="size-3" aria-hidden="true" />
                        {meta.label}
                      </span>
                      <p className="mt-1 max-w-[12rem] text-[0.875rem] text-ink">{e.actor}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <p className="font-mono text-[0.8125rem] text-ink">{e.action}</p>
                      {e.caseId && (
                        <Link to={`/records/${e.caseId}`} className="font-mono text-[0.8125rem] text-slate underline-offset-2 hover:text-ink hover:underline">
                          {e.caseId}
                        </Link>
                      )}
                    </td>
                    <td className="max-w-[26rem] py-3.5 pr-4 text-[0.9375rem] text-graphite">{e.detail}</td>
                    <td className="py-3.5 pr-6 font-mono text-[0.8125rem] whitespace-nowrap text-slate">
                      <span className="flex items-center gap-1">
                        {shortHash(e.prevHash)}
                        <ArrowRight className="size-3" aria-label="then" />
                        <span className={broken ? 'text-decline line-through' : 'text-ink'}>{shortHash(e.hash)}</span>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
          No role can edit or delete an entry, including administrators. The AI service account can only add observations. <MonoLabel className="ml-1">Synthetic data</MonoLabel>
        </p>
      </Panel>
    </Page>
  )
}

/** The chain as a row of linked blocks, newest on the right. A break turns every block after it red. */
function ChainStrip({ chain, brokenFrom }: { chain: AuditEvent[]; brokenFrom: number | null }) {
  const tail = chain.slice(-36)
  return (
    <div className="mt-6 overflow-hidden" aria-hidden="true">
      <div className="flex items-center gap-1">
        {tail.map((e, i) => {
          const broken = brokenFrom != null && e.seq >= brokenFrom
          return (
            <div key={e.seq} className="flex min-w-0 flex-1 items-center gap-1">
              <span
                title={`#${e.seq} ${shortHash(e.hash)}`}
                className={cn(
                  'animate-grow-y h-7 min-w-0 flex-1 origin-bottom rounded-[5px] transition-colors duration-300',
                  broken ? 'bg-decline' : e.actorType === 'person' ? 'bg-ink' : e.actorType === 'ai' ? 'bg-graphite-soft/60' : 'bg-approve/70',
                )}
                style={{ animationDelay: `${i * 18}ms` }}
              />
              {i < tail.length - 1 && <span className={cn('h-px w-1 shrink-0', broken ? 'bg-decline' : 'bg-approve/50')} />}
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[0.75rem] text-graphite">
        <span>#{tail[0]?.seq}</span>
        <span className="flex items-center gap-3 font-sans text-[0.8125rem]">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-ink" />Person</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-approve/70" />System</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-graphite-soft/60" />AI</span>
        </span>
        <span>Latest #{tail[tail.length - 1]?.seq}</span>
      </div>
    </div>
  )
}
