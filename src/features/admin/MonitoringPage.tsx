import { useRef, useState } from 'react'
import { Check, FileUp, Lock, RefreshCw, Users } from 'lucide-react'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { AcspStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import {
  parseAcspCsv,
  registerCountdownText,
  sameName,
  sampleAcspCsv,
} from '@/lib/acspList'
import { formatDate, formatDateTime, fullName } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import {
  allocationState,
  casesVerifiedBy,
  checkPublishedLists,
  confirmNameMatch,
  defaultPublishedLists,
  markAsListed,
  matchSourceLabel,
  reallocationRows,
  runStatusCheck,
  uploadYearlyList,
  type PublishedLists,
} from '@/store/platformActions'
import { AdminHeader, Figure, StateBadge } from './kit'

const SOURCE_NOTE =
  'Companies House publishes files. There is no API, so the platform reads the files and an administrator confirms every name match.'

const responseLabel = {
  pending: 'Not yet responded',
  agreed: 'Agreed',
  declined: 'Declined',
} as const
const responseTone = {
  pending: 'info',
  agreed: 'ok',
  declined: 'action',
} as const

export function MonitoringPage() {
  const { data, state, apply } = useDemoStore()
  const toast = useToast()
  const canAct = state.persona === 'platformAdmin'
  const fileRef = useRef<HTMLInputElement>(null)
  const [lists, setLists] = useState<PublishedLists>(() =>
    defaultPublishedLists(data),
  )
  const [uploadNote, setUploadNote] = useState<string | null>(null)
  const now = Date.now()
  const { monitoring } = data

  const toConfirm = monitoring.nameMatches.filter(
    (m) =>
      !m.confirmedAt && (m.status === 'to_confirm' || m.status === 'not_found'),
  )
  const history = monitoring.nameMatches.filter((m) => m.confirmedAt)
  const lapsed = data.acsps.filter(
    (a) => a.status === 'suspended' || a.status === 'ceased',
  )

  const toggle = (key: keyof PublishedLists, name: string, on: boolean) =>
    setLists((l) => ({
      ...l,
      [key]: on ? [...l[key], name] : l[key].filter((n) => !sameName(n, name)),
    }))

  const ingest = (fileName: string, text: string) => {
    const names = parseAcspCsv(text)
    if (!names.length) {
      setUploadNote('No firm names were found in that file.')
      return
    }
    apply((d) => uploadYearlyList(d, { fileName, names }))
    setUploadNote(null)
    toast({
      title: 'Yearly list cross-checked',
      description: `${names.length} names read from ${fileName}. Each match is for an administrator to confirm.`,
    })
  }

  return (
    <Page>
      <AdminHeader
        kicker="Platform Administrator"
        title="ACSP monitoring"
        description="Each ACSP is checked against what Companies House publishes, and each reconfirms its regulatory information every 12 months. A lapse pauses new allocation and flags the cases that ACSP verified."
        meta={<StateBadge tone="neutral">{SOURCE_NOTE}</StateBadge>}
      />

      {!canAct && (
        <p className="mb-6 flex items-center gap-2 rounded-2xl border border-line bg-mist/50 px-5 py-3.5 text-[0.9375rem] text-graphite">
          <Lock className="size-4 shrink-0 text-slate" aria-hidden="true" />
          Checks, confirmations and uploads are for the Platform Administrator.
          You can read this page.
        </p>
      )}

      <Panel aria-label="Monitoring summary" className="mb-6 overflow-hidden">
        <dl className="grid divide-line/70 sm:grid-cols-2 sm:divide-x xl:grid-cols-4">
          <Figure
            label="Last check of both lists"
            value={formatDate(monitoring.lastFortnightlyCheckAt)}
            detail="Checked every two weeks"
          />
          <Figure
            label="Name matches to confirm"
            value={toConfirm.length}
            detail="An administrator confirms each one"
          />
          <Figure
            label="Allocation paused"
            value={
              data.acsps.filter(
                (a) =>
                  !allocationState(a, now).open &&
                  a.status !== 'pending_approval',
              ).length
            }
            detail="Lapse, overdue or not accepting"
          />
          <Figure
            label="Not yet listed"
            value={
              data.acsps.filter((a) => a.status === 'not_yet_listed').length
            }
            detail="Time to register: 3 months"
          />
        </dl>
      </Panel>

      <Panel aria-labelledby="acsp-title" className="mb-6 overflow-hidden">
        <PanelHeader id="acsp-title" title="ACSPs" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left">
            <thead className="bg-mist/50 text-[0.875rem] text-slate">
              <tr>
                {[
                  'ACSP',
                  'Status',
                  'Last check and source',
                  'Last reconfirmed',
                  'Next due',
                  'Allocation',
                ].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-2.5 font-normal first:pl-6"
                  >
                    {h}
                  </th>
                ))}
                <th scope="col" className="py-2.5 pr-6 font-normal">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.acsps.map((a) => {
                const al = allocationState(a, now)
                const overdue =
                  new Date(a.monitoring.nextReconfirmationDue).getTime() < now
                return (
                  <tr key={a.id} className="border-t border-line/70 align-top">
                    <td className="py-3.5 pr-4 pl-6">
                      <span className="block text-[0.9375rem] font-medium text-ink">
                        {a.name}
                      </span>
                      <span className="block font-mono text-[0.8125rem] text-slate">
                        {a.acspNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <AcspStatusChip status={a.status} />
                      {a.statusNote && (
                        <p className="mt-1.5 max-w-[16rem] text-[0.8125rem] text-slate">
                          {a.statusNote}
                        </p>
                      )}
                      {a.status === 'not_yet_listed' && (
                        <p className="mt-1.5 max-w-[16rem] text-[0.8125rem] font-medium text-ink">
                          {registerCountdownText(a, now)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[0.875rem] text-graphite">
                      {formatDate(a.monitoring.lastCheckAt)}
                      <span className="block text-slate">
                        {matchSourceLabel(a.monitoring.lastSource)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[0.9375rem] text-graphite">
                      {formatDate(a.monitoring.lastReconfirmedAt)}
                    </td>
                    <td className="px-4 py-3.5 text-[0.9375rem] text-graphite">
                      {formatDate(a.monitoring.nextReconfirmationDue)}
                      {overdue && (
                        <span className="block text-[0.8125rem] font-medium text-decline">
                          Overdue (ACSP-11)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StateBadge tone={al.open ? 'ok' : 'action'}>
                        {al.open ? 'Open' : 'Paused'}
                      </StateBadge>
                      <p className="mt-1.5 max-w-[14rem] text-[0.8125rem] text-slate">
                        {al.reason}
                      </p>
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      {a.status === 'not_yet_listed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canAct}
                          onClick={() => {
                            apply((d) => markAsListed(d, a.id))
                            toast({
                              title: `${a.name} marked as listed`,
                              description:
                                'Status Active. Recorded on the audit trail.',
                            })
                          }}
                        >
                          <Check className="size-4" aria-hidden="true" />
                          Mark as listed
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="flex flex-wrap items-center gap-2 border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
          Not yet listed ACSPs are not blocked. Each has 3 months to register
          and becomes Active when the listing arrives.
        </p>
      </Panel>

      <div className="mb-6 grid items-start gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel aria-labelledby="files-title" className="overflow-hidden">
          <PanelHeader
            id="files-title"
            title="Published files, simulated"
            description="Tick where each firm appears in this simulation"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-mist/50 text-[0.875rem] text-slate">
                <tr>
                  <th scope="col" className="py-2.5 pr-3 pl-5 font-normal">
                    ACSP
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-normal">
                    On the opt-in list
                  </th>
                  <th scope="col" className="px-2 py-2.5 pr-5 font-normal">
                    On the ceased and suspended list
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.acsps.map((a) => (
                  <tr key={a.id} className="border-t border-line/70">
                    <th
                      scope="row"
                      className="py-3 pr-3 pl-5 text-left text-[0.9375rem] font-normal text-ink"
                    >
                      {a.name}
                    </th>
                    {(['optIn', 'ceasedSuspended'] as const).map((k) => (
                      <td key={k} className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          className="size-5 accent-ink"
                          aria-label={`${a.name} on the ${k === 'optIn' ? 'opt-in list' : 'ceased and suspended list'}`}
                          checked={lists[k].some((n) => sameName(n, a.name))}
                          onChange={(e) =>
                            toggle(
                              k,
                              a.name.replace(/,/g, '').toUpperCase(),
                              e.target.checked,
                            )
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-line/70 p-5 sm:px-6">
            <Button
              disabled={!canAct}
              onClick={() => {
                apply((d) => checkPublishedLists(d, lists))
                toast({
                  title: 'Both published lists checked',
                  description: 'Confirm each name match below.',
                })
              }}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Check both published Companies House lists
            </Button>
            <Button
              variant="outline"
              disabled={!canAct}
              onClick={() => {
                apply((d) => runStatusCheck(d, lists))
                toast({
                  title: 'Status check run',
                  description: 'Matches confirmed and consequences applied.',
                })
              }}
            >
              Run status check
            </Button>
          </div>
          <p className="px-5 pb-5 text-[0.875rem] text-slate sm:px-6">
            Run status check is a shortcut for the demonstration: it checks both
            files and records the administrator&rsquo;s confirmation of every
            match in one step.
          </p>
        </Panel>

        <Panel aria-labelledby="match-title" className="overflow-hidden">
          <PanelHeader
            id="match-title"
            title="Name matches to confirm"
            description="Names are compared after normalising case, spacing and punctuation"
            actions={<MonoLabel>{toConfirm.length} to confirm</MonoLabel>}
          />
          {toConfirm.length === 0 ? (
            <p className="px-5 py-6 text-[0.9375rem] text-slate sm:px-6">
              Nothing to confirm. Check the published lists to create name
              matches.
            </p>
          ) : (
            <ul className="divide-y divide-line/70">
              {toConfirm.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-medium text-ink">
                      {m.status === 'not_found'
                        ? `${m.platformName} not found`
                        : `${m.listedName} matches ${m.platformName}`}
                    </p>
                    <p className="text-[0.875rem] text-slate">
                      {matchSourceLabel(m.source)}
                      {m.status === 'not_found' &&
                        '. Confirming records it as Not yet listed.'}
                      {m.source === 'ceased_suspended_list' &&
                        m.status !== 'not_found' &&
                        '. Confirming suspends the ACSP and pauses allocation.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={!canAct}
                    onClick={() => {
                      apply((d) => confirmNameMatch(d, m.id))
                      toast({ title: 'Name match confirmed' })
                    }}
                  >
                    <Check className="size-4" aria-hidden="true" />
                    {m.status === 'not_found'
                      ? 'Confirm not listed'
                      : 'Confirm match'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {history.length > 0 && (
            <details className="border-t border-line/70 px-5 py-4 sm:px-6">
              <summary className="cursor-pointer text-[0.9375rem] font-medium text-ink">
                Confirmed matches ({history.length})
              </summary>
              <ul className="mt-3 space-y-2">
                {history.map((m) => (
                  <li key={m.id} className="text-[0.875rem] text-graphite">
                    {m.platformName ?? m.listedName},{' '}
                    {matchSourceLabel(m.source)}. Confirmed by {m.confirmedBy}
                    {m.confirmedAt ? `, ${formatDateTime(m.confirmedAt)}` : ''}.
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Panel>
      </div>

      {lapsed.map((a) => {
        const verified = casesVerifiedBy(data, a.id)
        const rows = reallocationRows(data, a.id)
        return (
          <Panel
            key={a.id}
            aria-labelledby={`lapse-${a.id}`}
            className="mb-6 overflow-hidden"
          >
            <PanelHeader
              id={`lapse-${a.id}`}
              title={`${a.name}: cases affected`}
              description="Visible to a Platform Administrator and to that ACSP only"
              actions={<AcspStatusChip status={a.status} />}
            />
            <div className="grid gap-0 divide-line/70 xl:grid-cols-2 xl:divide-x">
              <div className="p-5 sm:p-6">
                <h3 className="text-[0.9375rem] font-medium text-ink">
                  Cases it verified{' '}
                  <span className="font-mono text-[0.8125rem] text-slate">
                    ACSP-12
                  </span>
                </h3>
                <p className="mt-1 text-[0.875rem] text-slate">
                  Directors verified by this ACSP may need to verify again.
                </p>
                {verified.length === 0 ? (
                  <p className="mt-3 text-[0.9375rem] text-slate">None.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-line/70 rounded-xl border border-line/80">
                    {verified.map((c) => {
                      const p = data.people.find((x) => x.id === c.personId)
                      return (
                        <li
                          key={c.id}
                          className="flex justify-between gap-3 px-4 py-2.5 text-[0.9375rem]"
                        >
                          <span className="text-ink">
                            {p ? fullName(p) : c.personId}
                          </span>
                          <span className="font-mono text-[0.8125rem] text-slate">
                            {c.id}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-[0.9375rem] font-medium text-ink">
                  Open cases offered to another ACSP{' '}
                  <span className="font-mono text-[0.8125rem] text-slate">
                    ACSP-13
                  </span>
                </h3>
                <p className="mt-1 text-[0.875rem] text-slate">
                  A case moves only if the individual agrees.
                </p>
                {rows.length === 0 ? (
                  <p className="mt-3 text-[0.9375rem] text-slate">
                    None offered.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-line/70 rounded-xl border border-line/80">
                    {rows.map((r) => (
                      <li key={r.vc.id} className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[0.9375rem] text-ink">
                            {r.person ? fullName(r.person) : r.vc.personId}
                          </span>
                          <StateBadge tone={responseTone[r.response]}>
                            {responseLabel[r.response]}
                          </StateBadge>
                        </div>
                        <p className="text-[0.8125rem] text-slate">
                          <span className="font-mono">{r.vc.id}</span>, offered
                          to {r.offered?.name ?? 'another ACSP'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <Button variant="outline" disabled>
                    <Users className="size-4" aria-hidden="true" />
                    Contact individuals
                  </Button>
                  <p className="mt-2 text-[0.875rem] text-slate">
                    Individuals are contacted only on the client&rsquo;s
                    instruction.
                  </p>
                </div>
              </div>
            </div>
            <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
              This full list is for an administrator and {a.name} only. Each
              Referral Partner is notified of its own affected clients and sees
              only those, with status and which ACSP lapsed, never documents.
            </p>
          </Panel>
        )
      })}

      <Panel aria-labelledby="yearly-title" className="overflow-hidden">
        <PanelHeader
          id="yearly-title"
          title="Yearly list upload"
          description="Upload the Companies House ACSP list. The platform cross-checks every name against its own register."
        />
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-[0.9375rem] text-graphite">
            Every 12 months an administrator uploads the fresh list. The yearly
            upload sits beside the two-weekly check of both published files; it
            does not replace it. Use a synthetic file only.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              id="yearly-file"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) ingest(f.name, await f.text())
                e.target.value = ''
              }}
            />
            <Button
              variant="outline"
              disabled={!canAct}
              onClick={() => fileRef.current?.click()}
            >
              <FileUp className="size-4" aria-hidden="true" />
              Choose a CSV file
            </Button>
            <Button
              disabled={!canAct}
              onClick={() =>
                ingest(
                  'companies-house-acsp-list-sample.csv',
                  sampleAcspCsv(data.acsps),
                )
              }
            >
              Use sample file
            </Button>
          </div>
          {uploadNote && (
            <p role="alert" className="text-[0.9375rem] text-decline">
              {uploadNote}
            </p>
          )}
          {monitoring.yearlyUploads.length > 0 && (
            <ul className="divide-y divide-line/70 rounded-xl border border-line/80">
              {monitoring.yearlyUploads.map((u) => (
                <li key={u.id} className="px-4 py-3">
                  <p className="text-[0.9375rem] text-ink">
                    <span className="font-mono text-[0.875rem]">
                      {u.fileName}
                    </span>
                    , {formatDateTime(u.uploadedAt)} by {u.uploadedBy}
                  </p>
                  <p className="text-[0.875rem] text-slate">
                    {u.rows} rows, {u.matched} matched,{' '}
                    {u.notFoundAcspIds.length} not found
                    {u.notFoundAcspIds.length > 0 &&
                      `: ${u.notFoundAcspIds
                        .map(
                          (id) =>
                            data.acsps.find((a) => a.id === id)?.name ?? id,
                        )
                        .join(', ')}`}
                    {u.notFoundAcspIds.length > 0 &&
                      '. Each has 3 months to register'}
                    .
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </Page>
  )
}
