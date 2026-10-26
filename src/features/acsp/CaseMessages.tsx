import { BellRing, Info, MailCheck, Send } from 'lucide-react'
import { useState } from 'react'
import { CodeMessageCard } from '@/components/app/CodeMessageCard'
import { Panel, PanelHeader } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { isCodeMessage, looksLikeCode } from '@/lib/codeWarning'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { postCaseMessage } from '@/store/messageActions'
import type { CaseMessage, Person, VerificationCase } from '@/types/domain'

/** The sent-notification row under each message. */
function NotificationRow({
  m,
  person,
  acspName,
}: {
  m: CaseMessage
  person: Person
  acspName: string
}) {
  if (!m.notifiedAt) return null
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[0.8125rem] text-slate">
      <MailCheck className="size-3.5 shrink-0" aria-hidden="true" />
      {m.from === 'reviewer'
        ? `Email notification sent to ${person.email}`
        : `Email notification sent to the reviewers at ${acspName}`}
      <span>{formatDateTime(m.notifiedAt)}. Recorded in the audit trail.</span>
    </p>
  )
}

/**
  G2-18: the secure thread between the ACSP reviewer and the individual. Each
  message has an email notification and an audit entry. Code messages (P4) are
  shown hidden: only the allocated reviewer can open them, and they are deleted
  30 days after "Code received". Referral Partners never see this thread.
*/
export function CaseMessages({
  vc,
  person,
  acspName,
  reviewerName,
  reviewerId,
}: {
  vc: VerificationCase
  person: Person
  acspName: string
  /** Name shown as the author, for example "Eleanor Marsh". */
  reviewerName: string
  /** The acting reviewer. Only the allocated reviewer can open a code message. */
  reviewerId: string
}) {
  const { apply } = useDemoStore()
  const [text, setText] = useState('')
  const messages = vc.messages ?? []
  const canOpen = !vc.reviewerId || vc.reviewerId === reviewerId
  const codeLike = looksLikeCode(text)
  const open = !['declined', 'abandoned', 'invited', 'in_progress'].includes(
    vc.status,
  )

  const send = () => {
    const body = text.trim()
    if (!body) return
    apply((d) => postCaseMessage(d, vc.id, 'reviewer', reviewerName, body))
    setText('')
  }

  return (
    <Panel aria-labelledby="msg-title" className="overflow-hidden">
      <PanelHeader
        id="msg-title"
        title="Messages with the individual"
        description={`A secure thread with ${person.givenNames}. Each message sends an email notification and is written to the audit trail. Referral Partners never see it.`}
      />
      <ol className="space-y-4 px-5 py-5 sm:px-6" aria-label="Messages">
        {messages.length === 0 && (
          <li className="text-base text-slate">
            No messages yet. Use this thread for questions about the case.
          </li>
        )}
        {messages.map((m) =>
          isCodeMessage(m) ? (
            <li key={m.id} className="flex justify-end">
              <CodeMessageCard
                m={m}
                caseId={vc.id}
                viewer="reviewer"
                acspName={acspName}
                reviewerName={reviewerName}
                canOpen={canOpen}
              />
            </li>
          ) : (
            <li
              key={m.id}
              className={cn(
                'max-w-[92%] rounded-2xl border px-4 py-3',
                m.from === 'reviewer'
                  ? 'border-line bg-mist/60'
                  : 'ml-auto border-info/25 bg-info-wash/40',
              )}
            >
              <p className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem] text-slate">
                <span className="text-[0.9375rem] font-medium text-ink">
                  {m.authorName}
                </span>
                {m.from === 'reviewer' ? 'ACSP reviewer' : 'Individual'}
                <span>{formatDateTime(m.at)}</span>
              </p>
              <p className="mt-1 text-base leading-relaxed whitespace-pre-line text-ink">
                {m.body}
              </p>
              <NotificationRow m={m} person={person} acspName={acspName} />
            </li>
          ),
        )}
      </ol>
      {open ? (
        <div className="border-t border-line/70 px-5 py-4 sm:px-6">
          <label
            htmlFor="case-message"
            className="text-[0.9375rem] font-medium text-ink"
          >
            Message to {person.givenNames}
          </label>
          <textarea
            id="case-message"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
          />
          {codeLike && (
            <p
              role="status"
              className="mt-2 flex items-start gap-2.5 rounded-xl border border-info/30 bg-info-wash px-3.5 py-3 text-[0.9375rem] leading-relaxed text-info"
            >
              <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <span>
                This looks like a code. A Companies House code is best sent by{' '}
                {person.givenNames} as a code message, which only you can open
                and which is deleted after 30 days. You can still send this
                message.
              </span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button disabled={!text.trim()} onClick={send}>
              <Send aria-hidden="true" />
              Send message
            </Button>
            <span className="inline-flex items-center gap-1.5 text-[0.875rem] text-slate">
              <BellRing className="size-4" aria-hidden="true" />
              {person.givenNames} is notified by email.
            </span>
          </div>
        </div>
      ) : (
        <p className="border-t border-line/70 px-5 py-3 text-[0.9375rem] text-slate sm:px-6">
          The thread is read-only while the case is{' '}
          {vc.status.replace('_', ' ')}.
        </p>
      )}
    </Panel>
  )
}
