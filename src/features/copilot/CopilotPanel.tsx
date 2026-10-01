import {
  Ban,
  Check,
  CircleSlash,
  Pencil,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useToast } from '@/components/app/Toaster'
import { Button } from '@/components/ui/button'
import { ModelTag } from '@/components/visual/AiObservationCard'
import { PRIMARY_REVIEWER_ID } from '@/data/organisations'
import { highlightCite } from '@/lib/cite'
import {
  ANSWER_HEADER,
  answerQuestion,
  answerSources,
  answerText,
  CASE_SUGGESTIONS,
  RULES_ANSWER_HEADER,
  RULES_SUGGESTIONS,
  type CopilotAnswer,
  type CopilotScope,
} from '@/lib/copilot'
import { citeKey, type Citation } from '@/lib/rules'
import { cn } from '@/lib/utils'
import {
  logCopilotExchange,
  reviewerName,
  sendCopilotDraft,
} from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'

interface Exchange {
  id: number
  question: string
  answer: CopilotAnswer
}

/**
  The ACSP Copilot: a panel that slides in from the right, scoped to one case
  or to the rule set. It stays non-modal so cited items on the page can be
  highlighted while it is open.
*/
export function CopilotPanel({
  open,
  onClose,
  scope,
}: {
  open: boolean
  onClose: () => void
  scope: CopilotScope
}) {
  const { data, state, apply } = useDemoStore()
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const suggestions =
    scope.kind === 'case' ? CASE_SUGGESTIONS : RULES_SUGGESTIONS
  const asker =
    state.persona === 'reviewer'
      ? reviewerName(data, PRIMARY_REVIEWER_ID)
      : state.persona === 'admin2'
        ? 'Second approver'
        : 'Platform administrator'

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 250)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [exchanges.length])

  const ask = (question: string) => {
    const q = question.trim()
    if (!q) return
    const answer = answerQuestion(data, scope, q)
    setExchanges((xs) => [...xs, { id: Date.now(), question: q, answer }])
    setText('')
    apply((d) =>
      logCopilotExchange(d, {
        caseId: scope.kind === 'case' ? scope.caseId : undefined,
        question: q,
        answer: answerText(answer),
        sources: answerSources(answer),
        reviewer: asker,
      }),
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    ask(text)
  }

  return (
    <aside
      id="copilot-panel"
      aria-label="ACSP Copilot"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        'fixed top-14 right-0 bottom-0 z-40 flex w-full flex-col border-l border-line bg-paper transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] sm:w-[26rem] print:hidden',
        open
          ? 'translate-x-0 shadow-[-24px_0_60px_-40px_rgb(22_24_27/0.5)]'
          : 'pointer-events-none invisible translate-x-full',
      )}
    >
      <header className="flex items-start gap-3 border-b border-line/80 bg-white px-5 py-4">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-ink text-highlight">
          <Sparkles className="size-[1.125rem]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.0625rem] font-medium text-ink">
            ACSP Copilot
          </h2>
          <p className="text-[0.875rem] text-slate">
            {scope.kind === 'case'
              ? `Scoped to case ${scope.caseId}`
              : 'Scoped to the Route A rule set'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink hover:bg-mist"
          aria-label="Close the Copilot"
        >
          <X className="size-5" />
        </button>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5"
        aria-live="polite"
      >
        {exchanges.length === 0 && (
          <div>
            <p className="text-base leading-relaxed text-graphite">
              Ask about {scope.kind === 'case' ? 'this case' : 'the rules'}.
              Every answer cites where it comes from, and you can click a
              citation to find it on the page.
            </p>
            <p className="mt-2 text-[0.9375rem] text-slate">
              The Copilot cannot approve, request information or decline.
            </p>
          </div>
        )}
        {exchanges.map((x) => (
          <div key={x.id} className="space-y-2.5">
            <p className="ml-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[0.9375rem] text-paper">
              {x.question}
            </p>
            <AnswerCard answer={x.answer} scope={scope} />
          </div>
        ))}
      </div>

      <div className="border-t border-line/80 bg-white px-5 pt-3 pb-4">
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="shrink-0 cursor-pointer rounded-full border border-line bg-paper px-3 py-1.5 text-[0.875rem] whitespace-nowrap text-ink hover:border-silver hover:bg-mist"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor="copilot-input" className="sr-only">
            Ask the Copilot
          </label>
          <input
            ref={inputRef}
            id="copilot-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              scope.kind === 'case'
                ? 'Ask about this case'
                : 'Ask about the rules'
            }
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
          />
          <Button type="submit" disabled={!text.trim()} aria-label="Ask">
            <Send aria-hidden="true" />
          </Button>
        </form>
        <p className="mt-2.5 text-[0.8125rem] leading-snug text-slate">
          In this demonstration, answers are generated from the data on screen.
          No AI service is called. Each exchange is written to the audit trail.
        </p>
      </div>
    </aside>
  )
}

function AnswerCard({
  answer,
  scope,
}: {
  answer: CopilotAnswer
  scope: CopilotScope
}) {
  const refused = !!answer.refusal
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white p-4',
        refused ? 'border-line' : 'border-line',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-line/70 pb-2.5">
        <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-graphite">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {scope.kind === 'case' ? ANSWER_HEADER : RULES_ANSWER_HEADER}
        </p>
        <ModelTag />
      </div>
      {answer.lead && (
        <p className="mt-3 text-[0.9375rem] font-medium text-ink">
          {answer.lead}
        </p>
      )}
      <ul className="mt-2.5 space-y-3">
        {answer.statements.map((s, i) => (
          <li
            key={i}
            className={cn(
              'text-[0.9375rem] leading-relaxed',
              refused ? 'flex gap-2 text-ink' : 'text-graphite',
            )}
          >
            {answer.refusal === 'decision' && (
              <Ban
                className="mt-1 size-4 shrink-0 text-decline"
                aria-hidden="true"
              />
            )}
            {answer.refusal === 'unsupported' && (
              <CircleSlash
                className="mt-1 size-4 shrink-0 text-slate"
                aria-hidden="true"
              />
            )}
            <span>
              {s.text}
              {s.cites.length > 0 && (
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  {s.cites.map((c) => (
                    <CiteChip key={citeKey(c)} c={c} />
                  ))}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {answer.draft && scope.kind === 'case' && (
        <DraftCard caseId={scope.caseId} draft={answer.draft} />
      )}
    </div>
  )
}

function CiteChip({ c }: { c: Citation }) {
  const [missing, setMissing] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setMissing(!highlightCite(citeKey(c)))}
      title={missing ? 'Not shown on this screen' : 'Show on the page'}
      className={cn(
        'inline-flex cursor-pointer items-center rounded-md border px-1.5 py-0.5 font-mono text-[0.75rem] leading-tight transition-colors duration-150',
        missing
          ? 'border-line bg-mist text-slate'
          : 'border-silver/70 bg-paper text-ink hover:border-ink hover:bg-highlight-wash',
      )}
    >
      {c.label}
    </button>
  )
}

function DraftCard({
  caseId,
  draft,
}: {
  caseId: string
  draft: { to: string; body: string }
}) {
  const { apply } = useDemoStore()
  const toast = useToast()
  const [body, setBody] = useState(draft.body)
  const [editing, setEditing] = useState(false)
  const [sent, setSent] = useState(false)
  return (
    <div className="mt-4 rounded-xl border border-info/30 bg-info-wash/40">
      <p className="flex items-center gap-2 border-b border-info/20 px-3.5 py-2 text-[0.8125rem] font-medium text-info">
        <Pencil className="size-3.5" aria-hidden="true" />
        {sent
          ? 'Sent by you. Logged in the audit trail.'
          : 'Draft, not sent. Review before sending'}
      </p>
      <p className="px-3.5 pt-2.5 text-[0.8125rem] text-slate">
        To: {draft.to}
      </p>
      {editing ? (
        <>
          <label htmlFor={`draft-${caseId}`} className="sr-only">
            Edit the draft
          </label>
          <textarea
            id={`draft-${caseId}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="m-3.5 mt-2 w-[calc(100%-1.75rem)] rounded-lg border border-line bg-white px-3 py-2 text-[0.875rem] leading-relaxed text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
          />
        </>
      ) : (
        <p className="px-3.5 pt-2 pb-3 text-[0.875rem] leading-relaxed whitespace-pre-line text-ink">
          {body}
        </p>
      )}
      {!sent && (
        <div className="flex gap-2 border-t border-info/20 px-3.5 py-2.5">
          <Button
            size="xs"
            variant="outline"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? (
              <Check aria-hidden="true" />
            ) : (
              <Pencil aria-hidden="true" />
            )}
            {editing ? 'Done' : 'Edit'}
          </Button>
          <Button
            size="xs"
            onClick={() => {
              apply((d) =>
                sendCopilotDraft(d, caseId, body, PRIMARY_REVIEWER_ID),
              )
              setSent(true)
              setEditing(false)
              toast({
                title: 'Message sent',
                description: 'Simulated. Recorded in the audit trail.',
              })
            }}
          >
            <Send aria-hidden="true" />
            Send
          </Button>
        </div>
      )}
    </div>
  )
}
