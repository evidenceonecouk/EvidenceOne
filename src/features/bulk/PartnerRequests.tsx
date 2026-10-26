import { ArrowLeft, Layers, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { Button } from '@/components/ui/button'
import { BULK_EXAMPLE } from '@/data/bulkRequests'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  bulkRequestsOf,
  postBulkMessage,
  submitBulkRequest,
} from '@/store/bulkActions'
import { useActingPartner, useDemoStore } from '@/store/DemoStore'
import { useActingPartnerUser } from '@/features/partner/usePartnerUser'
import {
  BulkStatus,
  BulkThread,
  LinkedCaseList,
  OPTION_O4_NOTE,
} from './BulkParts'

/*
  Referral Partner view of Bulk / Bespoke Requests (option O4). A free-text
  request goes to the Platform Administrator, who agrees it in the message
  area and converts it into linked cases. The Partner sees status only, never
  documents.
*/
export function PartnerRequests() {
  const { requestId } = useParams()
  const { data, apply } = useDemoStore()
  const partner = useActingPartner()
  const { user, can } = useActingPartnerUser()
  const toast = useToast()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const mine = bulkRequestsOf(data)
    .filter((b) => b.partnerId === partner.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  const selected =
    mine.find((b) => b.id === requestId) ?? (requestId ? undefined : mine[0])
  const actor = `${user.name}, ${partner.name}`

  const submit = () => {
    apply((d) =>
      submitBulkRequest(d, { partnerId: partner.id, request: text, actor }),
    )
    setText('')
    toast({
      title: 'Request sent to the Platform Administrator',
      description: 'You will be notified by email when they reply.',
    })
    // The newest request opens first.
    navigate('/partner/requests')
  }

  return (
    <Page>
      <Link
        to="/partner"
        className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Portfolio
      </Link>
      <PageHeader
        kicker="Bulk / Bespoke Request"
        title="Several clients, or a mix of services"
        description="Describe what you need in your own words. The Platform Administrator agrees it with you, then opens linked cases. For one client and a named ACSP, use a normal referral."
      />
      <p className="mb-6 rounded-xl border border-line bg-mist/50 px-4 py-3 text-[0.9375rem] text-graphite">
        {OPTION_O4_NOTE}
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel aria-labelledby="new-request">
            <PanelHeader id="new-request" title="New request" />
            <form
              className="p-5 sm:p-6"
              onSubmit={(e) => {
                e.preventDefault()
                if (text.trim() && can.invite) submit()
              }}
            >
              <label
                htmlFor="bulk-request-text"
                className="mb-1.5 block text-[0.9375rem] text-ink"
              >
                What do you need?
              </label>
              <textarea
                id="bulk-request-text"
                rows={6}
                value={text}
                placeholder={`For example: ${BULK_EXAMPLE}`}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-slate focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
              />
              <Button
                type="submit"
                className="mt-3 w-full"
                disabled={!text.trim() || !can.invite}
              >
                <Plus aria-hidden="true" />
                Send to the Platform Administrator
              </Button>
              {!can.invite && (
                <p className="mt-2 text-[0.875rem] text-slate">
                  A Portfolio Viewer cannot send requests.
                </p>
              )}
            </form>
          </Panel>

          <Panel aria-labelledby="my-requests" className="overflow-hidden">
            <PanelHeader id="my-requests" title="Your requests" />
            {mine.length === 0 ? (
              <p className="px-5 py-4 text-[0.9375rem] text-slate sm:px-6">
                No requests yet.
              </p>
            ) : (
              <ul className="divide-y divide-line/70">
                {mine.map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/partner/requests/${b.id}`}
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
                      <span className="mt-1 line-clamp-2 block text-[0.9375rem] text-graphite">
                        {b.request}
                      </span>
                      <span className="mt-1 block text-[0.8125rem] text-slate">
                        {formatDateTime(b.submittedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {selected ? (
          <div className="space-y-6">
            <Panel aria-labelledby="request-thread">
              <PanelHeader
                id="request-thread"
                title={`Request ${selected.id}`}
                description="Between you and the Platform Administrator"
                actions={<BulkStatus b={selected} />}
              />
              <div className="p-5 sm:p-6">
                <BulkThread
                  b={selected}
                  viewer="partner"
                  onSend={
                    can.invite
                      ? (body) =>
                          apply((d) =>
                            postBulkMessage(d, {
                              requestId: selected.id,
                              from: 'partner',
                              authorName: user.name,
                              body,
                            }),
                          )
                      : undefined
                  }
                />
              </div>
            </Panel>
            <Panel aria-labelledby="request-linked">
              <PanelHeader
                id="request-linked"
                title={
                  <span className="flex items-center gap-2">
                    <Layers className="size-5" aria-hidden="true" />
                    Linked cases
                  </span>
                }
                description={
                  selected.status === 'converted'
                    ? `Opened by ${selected.convertedBy} on ${formatDateTime(selected.convertedAt!)}. You see status only.`
                    : 'Linked cases appear here once the Platform Administrator converts the request.'
                }
              />
              <div className="p-5 sm:p-6">
                <LinkedCaseList data={data} b={selected} />
              </div>
            </Panel>
          </div>
        ) : (
          <Panel className="p-6 text-base text-slate">
            Choose a request to see its messages and linked cases.
          </Panel>
        )}
      </div>
    </Page>
  )
}
