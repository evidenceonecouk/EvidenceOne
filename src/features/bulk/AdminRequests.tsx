import { Layers, Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Checkbox, Page, Panel, PanelHeader } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { Button } from '@/components/ui/button'
import { AdminHeader } from '@/features/admin/kit'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  bulkRequestsOf,
  convertBulkRequest,
  postBulkMessage,
} from '@/store/bulkActions'
import { useDemoStore } from '@/store/DemoStore'
import { PLATFORM_ADMIN } from '@/store/platformActions'
import { companiesForPartner, peopleForCompany } from '@/store/selectors'
import type { BulkRequest } from '@/types/domain'
import {
  BulkStatus,
  BulkThread,
  CORPORATE_LATER,
  LinkedCaseList,
  OPTION_O4_NOTE,
} from './BulkParts'

const ADMIN_NAME = PLATFORM_ADMIN.split(',')[0]

/*
  Platform Administrator view of Bulk / Bespoke Requests. Agree the request in
  the message area, then "Convert to linked cases". Each person gets an
  individual verification case with the best matched ACSP, ranked by clear
  criteria and not AI, confirmed by the administrator. The administrator never
  opens identity evidence.
*/
export function AdminRequests() {
  const { requestId } = useParams()
  const { data, state, apply } = useDemoStore()
  const canAct = state.persona === 'platformAdmin'
  const all = [...bulkRequestsOf(data)].sort(
    (a, b) =>
      Number(a.status === 'converted') - Number(b.status === 'converted') ||
      b.submittedAt.localeCompare(a.submittedAt),
  )
  const selected =
    all.find((b) => b.id === requestId) ?? (requestId ? undefined : all[0])

  return (
    <Page>
      <AdminHeader
        kicker="Platform Administrator"
        title="Bulk / Bespoke Requests"
        description="Requests from Referral Partners for several clients or a mix of services. Agree each one with the Partner, then convert it into linked cases."
      />
      <p className="mb-6 rounded-xl border border-line bg-mist/50 px-4 py-3 text-[0.9375rem] text-graphite">
        {OPTION_O4_NOTE}
      </p>
      {!canAct && (
        <p className="mb-6 flex items-center gap-2 rounded-2xl border border-line bg-mist/50 px-5 py-3.5 text-[0.9375rem] text-graphite">
          <Lock className="size-4 shrink-0 text-slate" aria-hidden="true" />
          Replies and conversion are for the Platform Administrator. You can
          read this page.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Panel aria-labelledby="requests-list" className="overflow-hidden">
          <PanelHeader id="requests-list" title="Requests" />
          <ul className="divide-y divide-line/70">
            {all.map((b) => {
              const partner = data.partners.find((p) => p.id === b.partnerId)
              return (
                <li key={b.id}>
                  <Link
                    to={`/admin/requests/${b.id}`}
                    aria-current={selected?.id === b.id ? 'page' : undefined}
                    className={cn(
                      'block px-5 py-3.5 hover:bg-mist/60 focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none focus-visible:ring-inset sm:px-6',
                      selected?.id === b.id && 'bg-mist/70',
                    )}
                  >
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[0.875rem] text-ink">
                        {b.id}
                      </span>
                      <BulkStatus b={b} />
                    </span>
                    <span className="mt-1 block text-[0.9375rem] font-medium text-ink">
                      {partner?.name}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[0.9375rem] text-graphite">
                      {b.request}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>

        {selected ? (
          <div className="space-y-6">
            <Panel aria-labelledby="admin-thread">
              <PanelHeader
                id="admin-thread"
                title={`Request ${selected.id}`}
                description={`From ${selected.submittedBy}, ${formatDateTime(selected.submittedAt)}`}
                actions={<BulkStatus b={selected} />}
              />
              <div className="p-5 sm:p-6">
                <BulkThread
                  b={selected}
                  viewer="admin"
                  onSend={
                    canAct
                      ? (body) =>
                          apply((d) =>
                            postBulkMessage(d, {
                              requestId: selected.id,
                              from: 'admin',
                              authorName: ADMIN_NAME,
                              body,
                            }),
                          )
                      : undefined
                  }
                />
              </div>
            </Panel>
            {selected.status === 'converted' ? (
              <Panel aria-labelledby="admin-linked">
                <PanelHeader
                  id="admin-linked"
                  title={
                    <span className="flex items-center gap-2">
                      <Layers className="size-5" aria-hidden="true" />
                      Linked cases
                    </span>
                  }
                  description={`Converted by ${selected.convertedBy} on ${formatDateTime(selected.convertedAt!)}`}
                />
                <div className="p-5 sm:p-6">
                  <LinkedCaseList data={data} b={selected} />
                </div>
              </Panel>
            ) : (
              <ConvertPanel key={selected.id} b={selected} canAct={canAct} />
            )}
          </div>
        ) : (
          <Panel className="p-6 text-base text-slate">
            Choose a request to read it.
          </Panel>
        )}
      </div>
    </Page>
  )
}

function ConvertPanel({ b, canAct }: { b: BulkRequest; canAct: boolean }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const partner = data.partners.find((p) => p.id === b.partnerId)
  const candidates = companiesForPartner(data, b.partnerId).flatMap((c) =>
    peopleForCompany(data, c.number)
      .filter((r) => r.invitable)
      .map((r) => ({ ...r, companyNumber: c.number, companyName: c.name })),
  )
  const [picked, setPicked] = useState<string[]>([])
  const [amendments, setAmendments] = useState(false)
  const [amendmentNote, setAmendmentNote] = useState(
    'Companies House amendments, to be scoped with the instructing ACSP',
  )
  const [corporate, setCorporate] = useState(false)
  const key = (r: { personId: string; companyNumber: string }) =>
    `${r.companyNumber}:${r.personId}`
  const nothing = !picked.length && !amendments && !corporate

  const convert = () => {
    apply((d) =>
      convertBulkRequest(d, {
        requestId: b.id,
        people: candidates
          .filter((r) => picked.includes(key(r)))
          .map((r) => ({
            personId: r.personId,
            companyNumber: r.companyNumber,
          })),
        additionalServices: amendments ? [amendmentNote.trim()] : [],
        corporateRequested: corporate,
        actor: PLATFORM_ADMIN,
      }),
    )
    toast({
      title: `${b.id} converted to linked cases`,
      description: `${picked.length} individual verification case${picked.length === 1 ? '' : 's'} opened. ${partner?.name ?? 'The Referral Partner'} is notified. Recorded on the platform audit chain.`,
    })
  }

  return (
    <Panel aria-labelledby="convert-title">
      <PanelHeader
        id="convert-title"
        title="Convert to linked cases"
        description="Once the request is agreed, choose who to verify and what else to record. Each case goes to the best matched ACSP, ranked by clear criteria, not AI."
      />
      <div className="space-y-6 p-5 sm:p-6">
        <fieldset>
          <legend className="mb-2 text-[0.9375rem] font-medium text-ink">
            Individual verifications
          </legend>
          {candidates.length === 0 ? (
            <p className="text-[0.9375rem] text-slate">
              Everyone on {partner?.name ?? 'this Partner'}&rsquo;s connected
              companies is already invited or verified.
            </p>
          ) : (
            <ul className="divide-y divide-line/70 rounded-xl border border-line/80">
              {candidates.map((r) => {
                const id = `pick-${key(r)}`
                return (
                  <li key={key(r)} className="flex items-start gap-3 px-4 py-3">
                    <Checkbox
                      id={id}
                      className="mt-0.5"
                      disabled={!canAct}
                      checked={picked.includes(key(r))}
                      onChange={() =>
                        setPicked((p) =>
                          p.includes(key(r))
                            ? p.filter((x) => x !== key(r))
                            : [...p, key(r)],
                        )
                      }
                    />
                    <label htmlFor={id} className="min-w-0 cursor-pointer">
                      <span className="block text-base text-ink">{r.name}</span>
                      <span className="block text-[0.875rem] text-slate">
                        {r.companyName} · {r.detail}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-[0.9375rem] font-medium text-ink">
            Also record
          </legend>
          <label className="flex items-start gap-3 text-base text-ink">
            <Checkbox
              className="mt-0.5"
              disabled={!canAct}
              checked={amendments}
              onChange={() => setAmendments((v) => !v)}
            />
            <span>Additional Companies House services, as a placeholder</span>
          </label>
          {amendments && (
            <div className="pl-9">
              <label
                htmlFor="amendment-note"
                className="mb-1 block text-[0.875rem] text-slate"
              >
                Description
              </label>
              <input
                id="amendment-note"
                value={amendmentNote}
                onChange={(e) => setAmendmentNote(e.target.value)}
                className="h-11 w-full rounded-lg border border-line bg-white px-3 text-base text-ink focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>
          )}
          <label className="flex items-start gap-3 text-base text-ink">
            <Checkbox
              className="mt-0.5"
              disabled={!canAct}
              checked={corporate}
              onChange={() => setCorporate((v) => !v)}
            />
            <span>
              Corporate verification requested
              <span className="block text-[0.875rem] text-slate">
                {CORPORATE_LATER} No corporate evidence is collected now.
              </span>
            </span>
          </label>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-5">
          <p className="text-[0.875rem] text-slate">
            The client pays the ACSP they instruct. Recorded on the platform
            audit chain.
          </p>
          <Button disabled={!canAct || nothing} onClick={convert}>
            <Layers aria-hidden="true" />
            Convert to linked cases
          </Button>
        </div>
      </div>
    </Panel>
  )
}
