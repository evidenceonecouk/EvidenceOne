import { Info, Mail, MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  MESSAGE_NOTICE,
  codeBlockedMessage,
  looksLikeCode,
} from '@/lib/codeWarning'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { postCaseMessage } from '@/store/messageActions'

/**
  G2-18: the secure thread between the ACSP reviewer and the individual. Each
  message has a sent-notification row. Messages carry no codes: a notice is
  always shown, and text that looks like a code is not sent until it is
  edited. Referral Partners never see this thread.
*/
export function CaseMessages({
  caseId,
  viewer = 'individual',
  className,
}: {
  caseId: string
  viewer?: 'individual' | 'reviewer'
  className?: string
}) {
  const { data, state, apply } = useDemoStore()
  const [text, setText] = useState('')
  const vc = data.cases.find((c) => c.id === caseId)
  if (!vc || state.persona === 'partner') return null
  const person = data.people.find((p) => p.id === vc.personId)
  const acsp = data.acsps.find((a) => a.id === vc.acspId)
  const acspName = acsp?.name ?? 'your ACSP'
  const reviewer = acsp?.reviewers.find((r) => r.id === vc.reviewerId)
  const myName =
    viewer === 'individual'
      ? person
        ? `${person.givenNames} ${person.familyName}`
        : 'Individual'
      : (reviewer?.name ?? acsp?.reviewers[0]?.name ?? 'ACSP reviewer')
  const messages = vc.messages ?? []
  const codeLike = looksLikeCode(text)
  const send = () => {
    if (!text.trim() || codeLike) return
    apply((d) => postCaseMessage(d, caseId, viewer, myName, text, reviewer?.id))
    setText('')
  }
  const notifyLine = (from: 'reviewer' | 'individual') =>
    from === 'reviewer'
      ? `Email notification sent to ${person?.email ?? 'the individual'}`
      : `Email notification sent to ${reviewer?.name ?? 'the ACSP reviewer'} at ${acspName}`
  const id = `msg-${caseId}`

  return (
    <section
      aria-labelledby={`${id}-h`}
      className={cn('rounded-2xl border border-line bg-white p-4', className)}
    >
      <h2
        id={`${id}-h`}
        className="flex items-center gap-2 text-base font-medium text-ink"
      >
        <MessageSquare className="size-4" aria-hidden="true" />
        Messages with{' '}
        {viewer === 'individual'
          ? acspName
          : (person?.givenNames ?? 'the individual')}
      </h2>
      <p className="mt-1 text-sm text-slate">
        A secure thread for this case only. Referral Partners cannot see it.
      </p>
      <ol className="mt-3 space-y-3" aria-live="polite">
        {messages.length === 0 && (
          <li className="text-[0.9375rem] text-slate">No messages yet.</li>
        )}
        {messages.map((m) => {
          const mine = m.from === viewer
          return (
            <li
              key={m.id}
              className={cn(
                'flex flex-col',
                mine ? 'items-end' : 'items-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[0.9375rem] leading-relaxed',
                  mine ? 'bg-ink text-paper' : 'bg-mist text-ink',
                )}
              >
                <p
                  className={cn(
                    'text-[0.8125rem]',
                    mine ? 'text-paper/80' : 'text-slate',
                  )}
                >
                  {m.authorName} · {formatDateTime(m.at)}
                </p>
                <p className="mt-0.5">{m.body}</p>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[0.8125rem] text-slate">
                <Mail className="size-3.5" aria-hidden="true" />
                {notifyLine(m.from)}
                {m.notifiedAt ? `, ${formatDateTime(m.notifiedAt)}` : ''}
              </p>
            </li>
          )
        })}
      </ol>

      <div className="mt-4">
        <label
          htmlFor={`${id}-t`}
          className="text-[0.9375rem] font-medium text-ink"
        >
          Write a message
        </label>
        <textarea
          id={`${id}-t`}
          aria-describedby={`${id}-notice`}
          value={text}
          rows={3}
          onChange={(e) => setText(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
        />
        <p className="mt-2 flex gap-2 text-[0.9375rem] leading-relaxed text-graphite">
          <Info
            className="mt-0.5 size-4 shrink-0 text-slate"
            aria-hidden="true"
          />
          <span id={`${id}-notice`}>{MESSAGE_NOTICE}</span>
        </p>
        {codeLike && (
          <p
            role="alert"
            className="mt-2 rounded-xl bg-info-wash px-3 py-2.5 text-[0.9375rem] text-info"
          >
            {codeBlockedMessage(acspName)}
          </p>
        )}
        <Button
          className="mt-3"
          disabled={!text.trim() || codeLike}
          onClick={send}
        >
          <Send aria-hidden="true" />
          Send message
        </Button>
      </div>
    </section>
  )
}
