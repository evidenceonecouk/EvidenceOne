import { Archive, Database, FileText, HardDrive, Receipt } from 'lucide-react'
import { Page, Panel, PanelHeader } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { UsageBar } from '@/components/app/UsageBar'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import { planUsage } from '@/lib/billing'
import { formatDateTime } from '@/lib/format'
import { currentRuleSet } from '@/lib/rules'
import { useDemoStore } from '@/store/DemoStore'
import { releaseExport } from '@/store/exportActions'
import { PLATFORM_ADMIN } from '@/store/platformActions'
import type { ParamKey } from '@/types/domain'
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

const gb = (mb: number) =>
  mb >= 1000
    ? `${(mb / 1000).toLocaleString('en-GB', { maximumFractionDigits: 1 })} GB`
    : `${mb} MB`
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
          <Archive
            className="mt-0.5 size-4 shrink-0 text-slate"
            aria-hidden="true"
          />
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
          actions={
            <StateBadge tone="info">Indicative, to be confirmed</StateBadge>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left">
            <thead className="bg-mist/50 text-[0.875rem] text-slate">
              <tr>
                <th scope="col" className="py-2.5 pr-4 pl-6 font-normal">
                  Cases a month
                </th>
                <th scope="col" className="py-2.5 pr-4 text-right font-normal">
                  Added each year
                </th>
                <th scope="col" className="py-2.5 pr-4 text-right font-normal">
                  Held at {years} years
                </th>
                <th scope="col" className="py-2.5 pr-6 text-right font-normal">
                  Indicative cost a month at {years} years
                </th>
              </tr>
            </thead>
            <tbody>
              {volumes.map((v) => {
                const yearly = v * 12 * MB_PER_CASE
                const held = yearly * years
                const cost = (held / 1000) * PRICE_PER_GB
                return (
                  <tr key={v} className="border-t border-line/70">
                    <th
                      scope="row"
                      className="py-3.5 pr-4 pl-6 text-left text-[0.9375rem] font-medium text-ink"
                    >
                      {v.toLocaleString('en-GB')}
                    </th>
                    <td className="py-3.5 pr-4 text-right text-[0.9375rem] text-ink tabular">
                      {tb(yearly)}
                    </td>
                    <td className="py-3.5 pr-4 text-right text-[0.9375rem] text-ink tabular">
                      {tb(held)}
                    </td>
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
          Indicative, to be confirmed. The cost assumes standard storage at
          about £{PRICE_PER_GB.toFixed(2)} a GB a month and ignores archiving
          and retrieval charges.
        </p>
      </Panel>

      <Panel aria-labelledby="rules-title" className="mb-6 overflow-hidden">
        <PanelHeader
          id="rules-title"
          title="Storage and retention rules"
          description="Decided by the client on 19 and 20 October"
        />
        <ul className="grid gap-4 p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
          {decided(years, rs.params).map((d) => (
            <li key={d.title} className="rounded-2xl border border-line/80 p-5">
              <StateBadge tone="ok">Decided, {d.date}</StateBadge>
              <p className="mt-3 text-base font-medium text-ink">{d.title}</p>
              <p className="mt-1 text-[0.9375rem] text-slate">{d.body}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <AcspStorage />

      <ExportReleases />

      <section aria-labelledby="open-title">
        <h2
          id="open-title"
          className="mb-3 text-[1.0625rem] font-medium text-ink"
        >
          Still open
        </h2>
        <div className="rounded-2xl border border-line/80 bg-white p-5">
          <PendingDecision />
          <p className="mt-3 text-base font-medium text-ink">
            Liveness media kept for seven years
          </p>
          <p className="mt-1 text-[0.9375rem] text-slate">
            Whether keeping liveness media for seven years needs the client’s
            data framework updated.
          </p>
        </div>
      </section>
    </Page>
  )
}

function decided(years: number, params: Record<ParamKey, number>) {
  return [
    {
      title: `Kept ${years} years from the decision`,
      body: 'From the reviewer decision (decided_at), approvals, declines, failed and abandoned cases alike.',
      date: '19 Oct',
    },
    {
      title: `Liveness media kept ${params.liveness_media_retention_years} years`,
      body: 'Kept with the case for the same period. The certified identity provider holds its own copy for 7 days.',
      date: '20 Oct',
    },
    {
      title: 'Live storage with a paid subscription',
      body: 'An ACSP with no paid subscription has its records moved to cheaper archive storage. They are still kept for seven years.',
      date: '19 Oct',
    },
    {
      title: 'Upload limit',
      body: `${params.max_file_mb} MB a file and ${params.max_files_per_request} files per request.`,
      date: '19 Oct',
    },
    {
      title: 'ACSP export',
      body: 'Immediately after the ACSP presses Approve, or at any time within the seven years on a request to an administrator, who releases the download and never opens the evidence.',
      date: '19 Oct',
    },
    {
      title: 'Storage included in the packages',
      body: 'Easy 2 GB, Pro 10 GB and Scale 25 GB, each an account total kept for seven years. A fair-use guide, never a reason to delete a retained record.',
      date: '19 Oct',
    },
  ]
}

function AcspStorage() {
  const { data } = useDemoStore()
  return (
    <Panel aria-labelledby="acsp-storage" className="mb-6 overflow-hidden">
      <PanelHeader
        id="acsp-storage"
        title="Storage by ACSP"
        description="Account totals against each package. Each ACSP’s records are kept separate."
        actions={<StateBadge tone="info">Provisional packages</StateBadge>}
      />
      <ul className="divide-y divide-line/70">
        {data.acsps.map((a) => {
          const u = planUsage(data, a)
          return (
            <li
              key={a.id}
              className="grid gap-3 px-5 py-4 sm:px-6 md:grid-cols-[16rem_1fr] md:items-center"
            >
              <div>
                <p className="text-base font-medium text-ink">{a.name}</p>
                <p className="text-[0.875rem] text-slate">
                  {u.pkg
                    ? `${u.pkg.name} package · live storage`
                    : 'No subscription · archive storage'}
                </p>
              </div>
              {u.pkg ? (
                <UsageBar
                  label="Storage"
                  used={u.storageUsedGb}
                  limit={u.pkg.storageGb}
                  unit="GB"
                />
              ) : (
                <p className="text-[0.9375rem] text-graphite">
                  {u.storageUsedGb} GB in archive storage, kept for seven years
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function ExportReleases() {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const requests = data.exportRequests ?? []
  return (
    <Panel aria-labelledby="exports-title" className="mb-6 overflow-hidden">
      <PanelHeader
        id="exports-title"
        title="Export release requests"
        description="An ACSP asks for its verification file after the decision. You release the download. You never open the evidence."
      />
      {requests.length === 0 ? (
        <p className="px-6 py-8 text-center text-base text-slate">
          No export requests.
        </p>
      ) : (
        <ul className="divide-y divide-line/70">
          {requests.map((x) => {
            const acsp = data.acsps.find((a) => a.id === x.acspId)
            return (
              <li
                key={x.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-ink">
                    <span className="font-mono">{x.id}</span> · case{' '}
                    <span className="font-mono">{x.caseId}</span>
                  </p>
                  <p className="text-[0.9375rem] text-slate">
                    {acsp?.name}, requested by {x.requestedBy} on{' '}
                    {formatDateTime(x.requestedAt)}. {x.reason}.
                  </p>
                </div>
                {x.status === 'requested' ? (
                  <Button
                    onClick={() => {
                      apply((d) => releaseExport(d, x.id, PLATFORM_ADMIN))
                      toast({
                        title: 'Download released',
                        description:
                          'The ACSP can now download the file behind step-up. Recorded in the audit trail.',
                      })
                    }}
                  >
                    Release the download
                  </Button>
                ) : (
                  <StateBadge tone={x.status === 'downloaded' ? 'ok' : 'info'}>
                    {x.status === 'downloaded'
                      ? 'Downloaded by the ACSP'
                      : `Released ${x.releasedAt ? formatDateTime(x.releasedAt) : ''}`}
                  </StateBadge>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
