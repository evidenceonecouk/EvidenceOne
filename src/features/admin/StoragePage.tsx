import { Archive, Database, FileText, HardDrive, Receipt } from 'lucide-react'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { PendingDecision } from '@/components/PendingDecision'
import { currentRuleSet } from '@/lib/rules'
import { useDemoStore } from '@/store/DemoStore'
import { AdminHeader, StateBadge } from './kit'

const MB_PER_CASE = 10
/** Indicative storage price per GB a month. Seed number, to be confirmed. */
const PRICE_PER_GB = 0.02

const stores = [
  {
    icon: HardDrive,
    name: 'Evidence store',
    holds:
      'Identity document images, liveness results, proof of address and supporting documents, with the provider result.',
  },
  {
    icon: Database,
    name: 'Application database',
    holds: 'Cases, rule results, decisions, messages and reference data.',
  },
  {
    icon: Receipt,
    name: 'Invoices and statements',
    holds:
      'Client invoices in each ACSP name, platform-fee invoices and monthly statements.',
  },
  {
    icon: FileText,
    name: 'Audit anchors',
    holds:
      'Daily hash anchors for each ACSP chain and the platform chain, in write-once storage.',
  },
]

const volumes = [100, 1000, 10000]

const decisions = [
  {
    code: 'S1',
    title: 'Archive evidence after 12 months',
    body: 'Move evidence to cheaper, slower storage after a year. It stays retrievable for the full seven years.',
  },
  {
    code: 'S2',
    title: 'Liveness media: full recording or stills',
    body: 'Keep the full liveness media, or stills plus the provider result. Biometric samples are deleted within 30 days either way.',
  },
  {
    code: 'S3',
    title: 'Upload limit',
    body: 'Suggested: 10 MB a file and five files per request.',
  },
  {
    code: 'S4',
    title: 'An ACSP that keeps its own retention',
    body: 'Export the records to the ACSP, then remove them from the platform. Each ACSP controls its own verification records.',
  },
  {
    code: 'S5',
    title: 'Storage in subscriptions',
    body: 'Whether storage is included in every subscription, or capped.',
  },
]

const gb = (mb: number) => (mb >= 1000 ? `${(mb / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })} GB` : `${mb} MB`)
const tb = (mb: number) =>
  mb >= 1_000_000
    ? `${(mb / 1_000_000).toLocaleString('en-GB', { maximumFractionDigits: 1 })} TB`
    : gb(mb)

export function StoragePage() {
  const { data } = useDemoStore()
  const rs = currentRuleSet(data)
  const years = rs.params.retention_years

  return (
    <Page>
      <AdminHeader
        kicker="Platform administration"
        title="Storage and retention"
        description={`What is kept and where. Every record is kept for ${years} years from the reviewer decision (decided_at), failed and abandoned cases too.`}
      />

      <Panel aria-labelledby="where-title" className="mb-6 overflow-hidden">
        <PanelHeader
          id="where-title"
          title="What is kept and where"
          description="All of it in the client's own Google Cloud account in London (europe-west2), with customer-managed keys"
        />
        <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          {stores.map((s) => (
            <li key={s.name} className="rounded-xl border border-line/80 p-4">
              <s.icon className="size-5 text-ink" aria-hidden="true" />
              <p className="mt-2 text-base font-medium text-ink">{s.name}</p>
              <p className="mt-1 text-[0.9375rem] text-slate">{s.holds}</p>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2 border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
          <Archive className="mt-0.5 size-4 shrink-0 text-slate" aria-hidden="true" />
          Each ACSP controls its own verification records. Evidence One
          processes them on its behalf, and each ACSP&rsquo;s records are kept
          separate.
        </p>
      </Panel>

      <Panel aria-labelledby="est-title" className="mb-6 overflow-hidden">
        <PanelHeader
          id="est-title"
          title="Storage estimate"
          description={`About ${MB_PER_CASE} MB per case. Seed numbers, never real data.`}
          actions={<StateBadge tone="info">Indicative, to be confirmed</StateBadge>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="bg-mist/50 text-[0.875rem] text-slate">
              <tr>
                <th scope="col" className="py-2.5 pr-4 pl-6 font-normal">Cases a month</th>
                <th scope="col" className="py-2.5 pr-4 text-right font-normal">Added each year</th>
                <th scope="col" className="py-2.5 pr-4 text-right font-normal">Held at {years} years</th>
                <th scope="col" className="py-2.5 pr-6 text-right font-normal">Indicative cost a month at {years} years</th>
              </tr>
            </thead>
            <tbody>
              {volumes.map((v) => {
                const yearly = v * 12 * MB_PER_CASE
                const held = yearly * years
                const cost = (held / 1000) * PRICE_PER_GB
                return (
                  <tr key={v} className="border-t border-line/70">
                    <th scope="row" className="py-3.5 pr-4 pl-6 text-left text-[0.9375rem] font-medium text-ink">
                      {v.toLocaleString('en-GB')}
                    </th>
                    <td className="py-3.5 pr-4 text-right text-[0.9375rem] text-ink tabular">{tb(yearly)}</td>
                    <td className="py-3.5 pr-4 text-right text-[0.9375rem] text-ink tabular">{tb(held)}</td>
                    <td className="py-3.5 pr-6 text-right text-[0.9375rem] text-ink tabular">
                      about £{Math.round(cost).toLocaleString('en-GB')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
          Indicative, to be confirmed. The cost assumes standard storage at about
          £{PRICE_PER_GB.toFixed(2)} a GB a month and ignores archiving and
          retrieval charges.
        </p>
      </Panel>

      <section aria-labelledby="dec-title">
        <div className="mb-3 flex items-center gap-3">
          <h2 id="dec-title" className="text-[1.0625rem] font-medium text-ink">
            Open storage decisions
          </h2>
          <MonoLabel>{decisions.length} open</MonoLabel>
        </div>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {decisions.map((d) => (
            <li key={d.code} className="rounded-2xl border border-line/80 bg-white p-5">
              <PendingDecision />
              <p className="mt-3 text-base font-medium text-ink">{d.title}</p>
              <p className="mt-1 text-[0.9375rem] text-slate">{d.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  )
}
