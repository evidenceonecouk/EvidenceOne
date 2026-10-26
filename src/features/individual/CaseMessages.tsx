import { Info, KeyRound, Mail, MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'
import { CodeMessageCard } from '@/components/app/CodeMessageCard'
import { Button } from '@/components/ui/button'
import {
  CODE_KIND_LABEL,
  codeCarrierLine,
  codePrompt,
  isCodeMessage,
  looksLikeCode,
} from '@/lib/codeWarning'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { postCaseMessage, sendCodeMessage } from '@/store/messageActions'
import type { CodeKind } from '@/types/domain'

/**
  G2-18: the secure thread between the ACSP reviewer and the individual. Each
  message has a sent-notification row. The individual may send a Companies
  House code to the allocated ACSP as a code message (P4): hidden, opened only
  by the allocated reviewer and the individual, and deleted 30 days after the
  ACSP marks it received. Referral Partners never see this thread.
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
  const [mode, setMode] = useState<'message' | 'code'>('message')
  const [codeKind, setCodeKind] = useState<CodeKind>('personal_code')
  const [code, setCode] = useState('')
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
  const codeLike = mode === 'message' && looksLikeCode(text)
  const send = () => {
    if (!text.trim()) return
    apply((d) => postCaseMessage(d, caseId, viewer, myName, text))
    setText('')
  }
  const sendCode = () => {
    if (!code.trim()) return
    apply((d) => sendCodeMessage(d, caseId, myName, codeKind, code))
    setCode('')
    setMode('message')
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
          if (isCodeMessage(m))
            return (
              <li
                key={m.id}
                className={cn(
                  'flex flex-col',
                  mine ? 'items-end' : 'items-start',
                )}
              >
                <CodeMessageCard
                  m={m}
                  caseId={caseId}
                  viewer={viewer}
                  acspName={acspName}
                  reviewerName={myName}
                  canOpen
                />
              </li>
            )
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

      {viewer === 'individual' && (
        <div
          role="group"
          aria-label="What to send"
          className="mt-4 flex flex-wrap gap-2"
        >
          <Button
            size="sm"
            variant={mode === 'message' ? 'default' : 'outline'}
            aria-pressed={mode === 'message'}
            onClick={() => setMode('message')}
          >
            <MessageSquare aria-hidden="true" />
            Message
          </Button>
          <Button
            size="sm"
            variant={mode === 'code' ? 'default' : 'outline'}
            aria-pressed={mode === 'code'}
            onClick={() => setMode('code')}
          >
            <KeyRound aria-hidden="true" />
            Send a Companies House code to {acspName}
          </Button>
        </div>
      )}

      {mode === 'code' && viewer === 'individual' ? (
        <div className="mt-4">
          <p className="rounded-xl bg-mist px-3.5 py-3 text-[0.9375rem] leading-relaxed text-ink">
            {codeCarrierLine(acspName)} Only the reviewer allocated to your case
            at {acspName} and you can open it. The message is deleted
            automatically 30 days after {acspName} marks it received.
          </p>
          <fieldset className="mt-3">
            <legend className="text-[0.9375rem] font-medium text-ink">
              Which code is it?
            </legend>
            <div className="mt-2 flex flex-col gap-2">
              {(Object.keys(CODE_KIND_LABEL) as CodeKind[]).map((k) => (
                <label
                  key={k}
                  className="flex items-center gap-2.5 text-base text-ink"
                >
                  <input
                    type="radio"
                    name={`${id}-kind`}
                    value={k}
                    checked={codeKind === k}
                    onChange={() => setCodeKind(k)}
                    className="size-5 accent-ink"
                  />
                  {CODE_KIND_LABEL[k]}
                </label>
              ))}
            </div>
          </fieldset>
          <label
            htmlFor={`${id}-code`}
            className="mt-3 block text-[0.9375rem] font-medium text-ink"
          >
            Code
          </label>
          <input
            id={`${id}-code`}
            value={code}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white p-3 font-mono text-base tracking-wider text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
          />
          <Button className="mt-3" disabled={!code.trim()} onClick={sendCode}>
            <KeyRound aria-hidden="true" />
            Send code message
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <label
            htmlFor={`${id}-t`}
            className="text-[0.9375rem] font-medium text-ink"
          >
            Write a message
          </label>
          <textarea
            id={`${id}-t`}
            value={text}
            rows={3}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white p-3 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
          />
          {codeLike && (
            <div
              role="status"
              className="mt-2 rounded-xl bg-info-wash px-3 py-2.5 text-[0.9375rem] text-info"
            >
              <p className="flex gap-2">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {viewer === 'individual'
                  ? codePrompt(acspName)
                  : 'This looks like a code. A Companies House code is best sent by the individual as a code message. You can still send this message.'}
              </p>
              {viewer === 'individual' && (
                <Button
                  className="mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() => setMode('code')}
                >
                  <KeyRound aria-hidden="true" />
                  Send it as a code message
                </Button>
              )}
            </div>
          )}
          <Button className="mt-3" disabled={!text.trim()} onClick={send}>
            <Send aria-hidden="true" />
            Send message
          </Button>
        </div>
      )}
    </section>
  )
}
