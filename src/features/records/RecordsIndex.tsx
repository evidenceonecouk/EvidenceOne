import { Archive, ChevronRight, FileCheck2, ShieldCheck, Timer } from 'lucide-react'
import { Link } from 'react-router'
import { HeroBanner, Page, Panel, StatTile } from '@/components/app/Page'
import { CaseStatusChip } from '@/components/StatusChip'
import { Avatar } from '@/components/visual/Avatar'
import { verifyChain } from '@/lib/audit'
import { formatShortDate, fullName, retentionExpiry } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import { getCompany, getPerson } from '@/store/selectors'

/** Every closed verification, with the seven-year retention date counted from the decision. */
export function RecordsIndex() {
  const { data } = useDemoStore()
  const records = data.cases
    .filter((c) => ['submitted', 'confirmed', 'declined', 'abandoned', 'approved', 'submission_started'].includes(c.status))
    .map((c) => ({ c, decided: (c.decision?.outcome !== 'request_info' ? c.decision?.decidedAt : undefined) ?? c.closedAt }))
    .sort((a, b) => (b.decided ?? '').localeCompare(a.decided ?? ''))
  const chainOk = verifyChain(data.audit)

  return (
    <Page>
      <HeroBanner
        kicker="Evidence One File"
        title="Verification records"
        description="Approved, declined and abandoned verifications are all kept for seven years from the decision. Nothing is deleted automatically."
        illustration={
          <div className="flex size-44 items-center justify-center rounded-[32px] bg-white/70 shadow-[0_20px_40px_-24px_rgb(22_24_27/0.35)]">
            <Archive className="size-20 text-ink" strokeWidth={1.25} aria-hidden="true" />
          </div>
        }
      />
      <dl className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile label="Records held" value={records.length} icon={FileCheck2} tone="ink" />
        <StatTile label="Audit entries" value={data.audit.length} icon={ShieldCheck} tone={chainOk ? 'approve' : 'decline'} detail={chainOk ? 'Hash chain verified' : 'Hash chain broken'} />
        <StatTile label="Retention period" value="7 yrs" icon={Timer} tone="teal" detail="From the decision date" />
      </dl>
      <Panel className="overflow-hidden">
        <ul className="divide-y divide-line/70">
          {records.map(({ c, decided }) => {
            const p = getPerson(data, c.personId)!
            const co = getCompany(data, c.companyNumber)!
            return (
              <li key={c.id}>
                <Link to={`/records/${c.id}`} className="group grid items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors duration-150 hover:bg-mist/50 sm:px-6 md:grid-cols-[1.5fr_1fr_auto_auto_auto]">
                  <span className="flex items-center gap-3">
                    <Avatar seed={c.personId} name={fullName(p)} size={40} />
                    <span className="min-w-0">
                      <span className="block text-base font-medium text-ink">{fullName(p)}</span>
                      <span className="block font-mono text-[0.875rem] text-slate">{c.id}</span>
                    </span>
                  </span>
                  <span className="truncate text-[0.9375rem] text-graphite">{co.name}</span>
                  <CaseStatusChip status={c.status} />
                  <span className="text-[0.9375rem] text-slate tabular">
                    {decided ? (
                      <>
                        Kept until <span className="text-ink">{formatShortDate(retentionExpiry(decided))}</span>
                      </>
                    ) : (
                      'Open'
                    )}
                  </span>
                  <ChevronRight className="hidden size-5 text-slate transition-transform duration-150 group-hover:translate-x-0.5 md:block" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      </Panel>
    </Page>
  )
}
