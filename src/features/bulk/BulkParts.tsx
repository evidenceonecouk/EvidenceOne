import { Building, FileStack, Send, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { PartnerStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { partnerStatusForCase } from '@/store/partnerSelectors'
import type { BulkRequest, DemoData } from '@/types/domain'
import { StateBadge } from '@/features/admin/kit'

/* Pieces shared by the Partner and Platform Administrator views of a Bulk / Bespoke Request. */

export const OPTION_O4_NOTE =
  'Bulk / Bespoke Request is option O4, included. It is separate from normal referrals and goes to the Platform Administrator first.'

export const CORPORATE_LATER =
  'Corporate verification is added later, when Companies House publishes the final requirements.'

export function BulkStatus({ b }: { b: BulkRequest }) {
  return b.status === 'converted' ? (
    <StateBadge tone="ok">Converted to linked cases</StateBadge>
  ) : (
    <StateBadge tone="info">Being agreed</StateBadge>
  )
}

/** The message area between the Referral Partner and the Platform Administrator. */
export function BulkThread({
  b,
  viewer,
  onSend,
}: {
  b: BulkRequest
  viewer: 'partner' | 'admin'
  onSend?: (body: string) => void
}) {
  const [text, setText] = useState('')
  const id = `bulk-message-${b.id}`
  return (
    <div>
      <ol className="space-y-3">
        <li className="rounded-xl border border-line bg-mist/50 px-4 py-3">
          <p className="text-[0.875rem] text-slate">
            Request from {b.submittedBy} · {formatDateTime(b.submittedAt)}
          </p>
          <p className="mt-1 text-base text-ink">{b.request}</p>
        </li>
        {b.messages.map((m) => {
          const mine = m.from === viewer
          return (
            <li
              key={m.id}
              className={cn(
                'max-w-[85%] rounded-xl border px-4 py-3',
                mine
                  ? 'ml-auto border-ink/20 bg-white'
                  : 'border-line bg-white',
              )}
            >
              <p className="text-[0.875rem] text-slate">
                {m.authorName} · {formatDateTime(m.at)}
              </p>
              <p className="mt-1 text-base text-ink">{m.body}</p>
            </li>
          )
        })}
      </ol>
      {onSend && (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            onSend(text)
            setText('')
          }}
        >
          <label
            htmlFor={id}
            className="mb-1.5 block text-[0.9375rem] text-ink"
          >
            {viewer === 'admin'
              ? 'Message the Referral Partner'
              : 'Message the Platform Administrator'}
          </label>
          <textarea
            id={id}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.875rem] text-slate">
              The other side gets an email notification. Recorded in the audit
              trail.
            </p>
            <Button type="submit" disabled={!text.trim()}>
              <Send aria-hidden="true" />
              Send message
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

/**
  Linked cases of a converted request: individual verification cases, any
  additional Companies House services as placeholders, and a greyed corporate
  case. Status only: no documents or evidence are shown here.
*/
export function LinkedCaseList({
  data,
  b,
  linkTo,
  currentCaseId,
}: {
  data: DemoData
  b: BulkRequest
  /** Where an individual case links to, if anywhere. */
  linkTo?: (caseId: string) => string
  currentCaseId?: string
}) {
  return (
    <ul className="divide-y divide-line/70 rounded-xl border border-line/80">
      {b.caseIds.map((id) => {
        const vc = data.cases.find((c) => c.id === id)
        const person = vc && data.people.find((p) => p.id === vc.personId)
        const acsp = vc && data.acsps.find((a) => a.id === vc.acspId)
        const status = partnerStatusForCase(vc)
        const name = person
          ? `${person.givenNames} ${person.familyName}`
          : 'Individual'
        return (
          <li
            key={id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-3',
              id === currentCaseId && 'bg-mist/60',
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <UserRound
                className="mt-0.5 size-5 shrink-0 text-slate"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-medium text-ink">
                  Individual verification: {name}
                  {id === currentCaseId && (
                    <span className="ml-2 font-normal text-slate">
                      (this case)
                    </span>
                  )}
                </p>
                <p className="text-[0.875rem] text-slate">
                  {linkTo && id !== currentCaseId ? (
                    <Link
                      to={linkTo(id)}
                      className="font-mono underline underline-offset-4 hover:text-ink"
                    >
                      {id}
                    </Link>
                  ) : (
                    <span className="font-mono">{id}</span>
                  )}
                  {acsp && ` · ${acsp.name}`}
                </p>
              </div>
            </div>
            {status && <PartnerStatusChip status={status} />}
          </li>
        )
      })}
      {b.additionalServices.map((s) => (
        <li
          key={s}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-3"
        >
          <div className="flex min-w-0 items-start gap-3">
            <FileStack
              className="mt-0.5 size-5 shrink-0 text-slate"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-medium text-ink">
                Additional Companies House services
              </p>
              <p className="text-[0.875rem] text-slate">{s}</p>
            </div>
          </div>
          <StateBadge tone="neutral">Placeholder</StateBadge>
        </li>
      ))}
      {b.corporateRequested && (
        <li
          aria-disabled="true"
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 bg-mist/50 px-4 py-3 text-slate"
        >
          <div className="flex min-w-0 items-start gap-3">
            <Building className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-medium">
                Corporate verification
              </p>
              <p className="text-[0.875rem]">{CORPORATE_LATER}</p>
            </div>
          </div>
          <StateBadge tone="neutral">Later</StateBadge>
        </li>
      )}
      {b.caseIds.length === 0 &&
        !b.additionalServices.length &&
        !b.corporateRequested && (
          <li className="px-4 py-3 text-[0.9375rem] text-slate">
            No linked cases yet.
          </li>
        )}
    </ul>
  )
}
