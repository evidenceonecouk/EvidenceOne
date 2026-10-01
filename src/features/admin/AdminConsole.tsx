import { BadgeCheck, Briefcase, Building2, Minus, Plus, PoundSterling, Shuffle } from 'lucide-react'
import { AdminIllustration } from '@/components/visual/Illustrations'
import { HeroBanner, MonoLabel, Page, Panel, PanelHeader, StatTile } from '@/components/app/Page'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { formatMoney, VERIFICATION_FEE } from '@/lib/format'
import { cn } from '@/lib/utils'
import { nextB2cAcsp, setAllocationShare } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'

const MONTH_MS = 30 * 24 * 60 * 60 * 1000
/* Illustrative history for the trend; the last bar adds this demo's live submissions. */
const weeklyBase = [6, 9, 8, 14, 11, 17, 21, 19]

export function AdminConsole() {
  const { data, apply } = useDemoStore()
  const now = Date.now()
  const recent = (iso?: string) => !!iso && now - new Date(iso).getTime() < MONTH_MS
  const decided = data.cases.filter((c) => recent(c.decision?.decidedAt) && c.decision?.outcome !== 'request_info')
  const paid = data.cases.filter((c) => recent(c.payment?.paidAt))
  const next = nextB2cAcsp(data)
  const totalShare = data.acsps.reduce((s, a) => s + a.b2cAllocationShare, 0)
  const liveThisWeek = data.cases.filter((c) => c.submission?.submittedAt && now - new Date(c.submission.submittedAt).getTime() < 7 * 86400000).length
  const weekly = [...weeklyBase.slice(0, -1), weeklyBase[weeklyBase.length - 1] + liveThisWeek]
  const max = Math.max(...weekly)

  const rows = data.acsps.map((a) => {
    const live = decided.filter((c) => c.acspId === a.id).length
    const casesThisMonth = a.b2cAllocatedThisMonth + live
    return { a, casesThisMonth, remuneration: casesThisMonth * a.remunerationPerCase, fees: casesThisMonth * VERIFICATION_FEE }
  })
  const totalFees = rows.reduce((s, r) => s + r.fees, 0)
  const totalRem = rows.reduce((s, r) => s + r.remuneration, 0)

  return (
    <Page>
      <HeroBanner
        kicker="Platform administration"
        title="Evidence One operations"
        description="ACSPs on the platform, how direct clients are allocated between them, and what each is owed this month."
        illustration={<AdminIllustration className="h-48 w-auto" />}
      />

      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="ACSPs on the platform" value={data.acsps.length} icon={Building2} tone="ink" />
        <StatTile label="Agents" value={data.agents.length} icon={Briefcase} tone="teal" detail={`${data.agents.filter((a) => a.hasAcspStatus).length} with ACSP status`} />
        <StatTile label="Decided in the last 30 days" value={rows.reduce((s, r) => s + r.casesThisMonth, 0)} icon={BadgeCheck} tone="approve" />
        <StatTile label="Fees this month" value={formatMoney(totalFees)} icon={PoundSterling} tone="progress" detail={`${paid.length} live payments in this demo`} />
      </dl>

      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel aria-labelledby="acsp-title" className="overflow-hidden">
          <PanelHeader id="acsp-title" title="ACSPs" description="Each is supervised for AML and registered with Companies House" />
          <ul className="divide-y divide-line/70">
            {data.acsps.map((a) => {
              const open = data.cases.filter((c) => c.acspId === a.id && ['in_review', 'info_requested', 'halted_register_mismatch', 'approved'].includes(c.status)).length
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6">
                  <CompanyMark name={a.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-ink">{a.name}</p>
                    <p className="text-[0.9375rem] text-slate">
                      {a.kind} · {a.supervisor} · <span className="font-mono">{a.acspNumber}</span>
                    </p>
                  </div>
                  <div className="flex -space-x-2" aria-label={`${a.reviewers.length} reviewers`}>
                    {a.reviewers.map((r) => (
                      <Avatar key={r.id} seed={r.id} name={r.name} size={34} />
                    ))}
                  </div>
                  <span className="rounded-full bg-progress-wash px-3 py-1 text-[0.875rem] font-medium text-progress tabular">{open} open</span>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel aria-labelledby="rota-title" className="overflow-hidden">
          <PanelHeader
            id="rota-title"
            title="B2C allocation rota"
            description="Direct clients go to the ACSP furthest below its share"
            actions={<Shuffle className="size-5 text-slate" aria-hidden="true" />}
          />
          <ul className="space-y-5 p-5 sm:p-6">
            {data.acsps.map((a) => {
              const pct = Math.round((a.b2cAllocationShare / totalShare) * 100)
              return (
                <li key={a.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[0.9375rem] font-medium text-ink">{a.name}</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Lower share for ${a.name}`}
                        onClick={() => apply((d) => setAllocationShare(d, a.id, a.b2cAllocationShare - 5))}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-mist"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-12 text-center font-mono text-[0.9375rem] text-ink tabular">{pct}%</span>
                      <button
                        type="button"
                        aria-label={`Raise share for ${a.name}`}
                        onClick={() => apply((d) => setAllocationShare(d, a.id, a.b2cAllocationShare + 5))}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-mist"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-mist">
                    <div className="h-full rounded-full bg-ink transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-[0.875rem] text-slate tabular">{a.b2cAllocatedThisMonth} direct clients this month</p>
                </li>
              )
            })}
          </ul>
          <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
            Next direct client goes to <span className="font-medium text-ink">{next.name}</span>
          </p>
        </Panel>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel aria-labelledby="rem-title" className="overflow-hidden">
          <PanelHeader id="rem-title" title="Remuneration this month" description={`${formatMoney(VERIFICATION_FEE)} flat fee per verification`} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left">
              <thead className="bg-mist/50 text-[0.875rem] text-slate">
                <tr>
                  <th scope="col" className="py-2.5 pr-4 pl-5 font-normal sm:pl-6">ACSP</th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-normal">Verifications</th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-normal">Rate</th>
                  <th scope="col" className="py-2.5 pr-6 text-right font-normal">Owed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ a, casesThisMonth, remuneration }) => (
                  <tr key={a.id} className="border-t border-line/70">
                    <td className="py-3.5 pr-4 pl-5 text-[0.9375rem] text-ink sm:pl-6">{a.name}</td>
                    <td className="py-3.5 pr-4 text-right text-[0.9375rem] text-ink tabular">{casesThisMonth}</td>
                    <td className="py-3.5 pr-4 text-right text-[0.9375rem] text-slate tabular">{formatMoney(a.remunerationPerCase)}</td>
                    <td className="py-3.5 pr-6 text-right text-[0.9375rem] font-medium text-ink tabular">{formatMoney(remuneration)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-mist/40">
                  <td className="py-3.5 pr-4 pl-5 text-[0.9375rem] font-medium text-ink sm:pl-6">Total</td>
                  <td colSpan={2} className="py-3.5 pr-4 text-right text-[0.9375rem] text-slate">
                    Fees {formatMoney(totalFees)}
                  </td>
                  <td className="py-3.5 pr-6 text-right text-[0.9375rem] font-medium text-ink tabular">{formatMoney(totalRem)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <Panel aria-labelledby="weekly-title" className="overflow-hidden">
          <PanelHeader id="weekly-title" title="Verifications completed per week" description="Last eight weeks" />
          <div className="p-5 sm:p-6">
            <div className="relative flex h-44 items-end gap-2 border-b border-line" role="img" aria-label={`Weekly completed verifications: ${weekly.join(', ')}`}>
              {weekly.map((v, i) => (
                <div key={i} className="group relative flex h-full flex-1 items-end">
                  <div className={cn('w-full rounded-t-[4px] transition-colors duration-150', i === weekly.length - 1 ? 'bg-ink' : 'bg-silver group-hover:bg-slate')} style={{ height: `${(v / max) * 100}%` }} />
                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-ink px-2 py-0.5 text-[0.8125rem] text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100 tabular">
                    {v}
                  </span>
                  {i === weekly.length - 1 && <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[0.875rem] font-medium text-ink tabular group-hover:opacity-0">{v}</span>}
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {weekly.map((_, i) => (
                <span key={i} className="flex-1 text-center font-mono text-[0.75rem] text-slate">
                  {i === weekly.length - 1 ? 'Now' : `W${i + 1}`}
                </span>
              ))}
            </div>
            <MonoLabel className="mt-4 block">This week includes live demo submissions</MonoLabel>
          </div>
        </Panel>
      </div>
    </Page>
  )
}
