import { CheckCircle2, Eye, EyeOff, FastForward, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CODE_KIND_LABEL,
  codeCarrierLine,
  codeDeleted,
} from '@/lib/codeWarning'
import { formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import {
  fastForwardCodeDeletion,
  markCodeReceived,
  viewCodeMessage,
} from '@/store/messageActions'
import type { CaseMessage } from '@/types/domain'

/**
  A code message (P4). The individual passes a Companies House code to the
  allocated ACSP. Only the allocated ACSP reviewer and the individual can open
  it. The ACSP marks it received and the text is deleted automatically 30 days
  later. Opening it is audited, never the value.
*/
export function CodeMessageCard({
  m,
  caseId,
  viewer,
  acspName,
  reviewerName,
  canOpen,
  className,
}: {
  m: CaseMessage
  caseId: string
  viewer: 'individual' | 'reviewer'
  acspName: string
  /** The acting reviewer's name, for the audit entries. */
  reviewerName?: string
  /** False for an ACSP user who is not the allocated reviewer. */
  canOpen: boolean
  className?: string
}) {
  const { state, apply } = useDemoStore()
  const [shown, setShown] = useState(false)
  const deleted = codeDeleted(m)
  const label = CODE_KIND_LABEL[m.codeKind ?? 'personal_code']

  const show = () => {
    if (!shown && viewer === 'reviewer')
      apply((d) =>
        viewCodeMessage(d, caseId, m.id, reviewerName ?? 'ACSP reviewer'),
      )
    setShown((v) => !v)
  }

  return (
    <div
      className={cn(
        'w-full max-w-[92%] rounded-2xl border border-ink/25 bg-white px-4 py-3 text-ink',
        className,
      )}
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-slate">
        <KeyRound className="size-4 shrink-0 text-ink" aria-hidden="true" />
        <span className="text-[0.9375rem] font-medium text-ink">
          Code message: {label}
        </span>
        <span>
          {m.authorName}, {formatDateTime(m.at)}
        </span>
      </p>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-graphite">
        {codeCarrierLine(acspName)} Only the allocated reviewer at {acspName}{' '}
        and {viewer === 'individual' ? 'you' : 'the individual'} can open it.
      </p>

      {deleted ? (
        <p className="mt-2 text-base text-ink">
          Deleted automatically
          {m.deletedAt || m.deleteOn
            ? ` on ${formatDate((m.deletedAt ?? m.deleteOn)!)}`
            : ''}
          .
        </p>
      ) : !canOpen ? (
        <p className="mt-2 text-[0.9375rem] text-slate">
          Hidden. Only the reviewer allocated to this case can open it.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span
            className="rounded-lg bg-mist px-3 py-1.5 font-mono text-base tracking-wider"
            aria-live="polite"
          >
            {shown ? m.body : '••••••••'}
            {!shown && <span className="sr-only">Code hidden</span>}
          </span>
          <Button variant="outline" size="sm" onClick={show}>
            {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            {shown ? 'Hide code' : 'Show code'}
          </Button>
          {viewer === 'reviewer' && !shown && (
            <span className="text-[0.8125rem] text-slate">
              Opening it is recorded in the audit trail. The code is not.
            </span>
          )}
        </div>
      )}

      {m.receivedAt ? (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.9375rem] text-graphite">
          <CheckCircle2
            className="size-4 shrink-0 text-approve"
            aria-hidden="true"
          />
          Code received by {acspName} on {formatDate(m.receivedAt)}.
          {!deleted && m.deleteOn && (
            <span>
              This message will be deleted on {formatDate(m.deleteOn)}.
            </span>
          )}
        </p>
      ) : viewer === 'reviewer' ? (
        canOpen && (
          <Button
            className="mt-3"
            size="sm"
            onClick={() =>
              apply((d) =>
                markCodeReceived(
                  d,
                  caseId,
                  m.id,
                  reviewerName ?? 'ACSP reviewer',
                ),
              )
            }
          >
            <CheckCircle2 aria-hidden="true" />
            Mark code received
          </Button>
        )
      ) : (
        <p className="mt-2 text-[0.9375rem] text-slate">
          Waiting for {acspName} to mark it received. It is deleted 30 days
          after that.
        </p>
      )}

      {state.guided.on && m.receivedAt && !deleted && (
        <div className="mt-3 rounded-xl border border-dashed border-silver p-2.5">
          <p className="text-sm text-slate">Guided demo control</p>
          <Button
            className="mt-1.5"
            variant="outline"
            size="sm"
            onClick={() =>
              apply((d) => fastForwardCodeDeletion(d, caseId, m.id))
            }
          >
            <FastForward aria-hidden="true" />
            Fast-forward 30 days
          </Button>
        </div>
      )}
    </div>
  )
}
