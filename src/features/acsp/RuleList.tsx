import { ChevronDown, ClipboardCheck } from 'lucide-react'
import { useState } from 'react'
import { OutcomeChip, RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import type { RuleResult } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { recordRuleDecision } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import type { RuleDecision } from '@/types/domain'

/**
  Rule results for one step. Anything other than a pass is shown in full;
  passes are listed compactly below, so the reviewer sees what needs them first.
*/
export function RuleList({
  results,
  caseId,
  reviewerId,
  decidable,
}: {
  results: RuleResult[]
  caseId: string
  reviewerId: string
  decidable: boolean
}) {
  const open = results.filter((r) => r.outcome !== 'pass')
  const passed = results.filter((r) => r.outcome === 'pass')
  if (!results.length) return null
  return (
    <div className="border-t border-line/70">
      {open.length > 0 && (
        <ul className="divide-y divide-line/70">
          {open.map((r) => (
            <RuleRow
              key={r.ruleId + r.title}
              r={r}
              caseId={caseId}
              reviewerId={reviewerId}
              decidable={decidable}
            />
          ))}
        </ul>
      )}
      {passed.length > 0 && (
        <details
          className={cn('group', open.length > 0 && 'border-t border-line/70')}
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-[0.9375rem] text-graphite hover:bg-mist/40 sm:px-6 [&::-webkit-details-marker]:hidden">
            <ChevronDown
              className="size-4 transition-transform duration-150 group-open:rotate-180"
              aria-hidden="true"
            />
            {passed.length} rule{passed.length === 1 ? '' : 's'} passed
            <span className="ml-auto hidden font-mono text-[0.8125rem] text-slate sm:inline">
              {passed.map((r) => r.ruleId).join(' · ')}
            </span>
          </summary>
          <ul className="divide-y divide-line/60 border-t border-line/60 bg-mist/25">
            {passed.map((r) => (
              <li
                key={r.ruleId + r.title}
                data-cite={`rule:${r.ruleId}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 sm:px-6"
              >
                <RuleIdTag id={r.ruleId} />
                <OutcomeChip outcome="pass" />
                <span className="min-w-0 flex-1 text-[0.9375rem] text-graphite">
                  {r.title}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function RuleRow({
  r,
  caseId,
  reviewerId,
  decidable,
}: {
  r: RuleResult
  caseId: string
  reviewerId: string
  decidable: boolean
}) {
  return (
    <li
      data-cite={`rule:${r.ruleId}`}
      className={cn(
        'px-5 py-4 sm:px-6',
        r.outcome === 'halt' || r.outcome === 'block'
          ? 'bg-info-wash/30'
          : undefined,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <RuleIdTag id={r.ruleId} />
        <OutcomeChip outcome={r.outcome} />
      </div>
      <p className="mt-2 text-base text-ink">{r.title}</p>
      {r.detail && (
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-slate">
          {r.detail}
        </p>
      )}
      {r.outcome === 'mandatory' && (
        <MandatoryDecision
          ruleId={r.ruleId}
          decision={r.decision}
          caseId={caseId}
          reviewerId={reviewerId}
          decidable={decidable}
        />
      )}
    </li>
  )
}

/** A Mandatory decision: the reviewer cannot approve until they record a decision on it, with a reason. */
function MandatoryDecision({
  ruleId,
  decision,
  caseId,
  reviewerId,
  decidable,
}: {
  ruleId: string
  decision?: RuleDecision
  caseId: string
  reviewerId: string
  decidable: boolean
}) {
  const { apply } = useDemoStore()
  const [editing, setEditing] = useState(false)
  const [choice, setChoice] = useState<RuleDecision['decision']>('satisfied')
  const [reason, setReason] = useState('')

  if (decision && !editing) {
    return (
      <div
        className={cn(
          'mt-3 flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3',
          decision.decision === 'satisfied'
            ? 'border-approve/25 bg-approve-wash/60'
            : 'border-decline/25 bg-decline-wash/60',
        )}
      >
        <ClipboardCheck
          className={cn(
            'mt-0.5 size-4 shrink-0',
            decision.decision === 'satisfied' ? 'text-approve' : 'text-decline',
          )}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 text-[0.9375rem]">
          <p className="font-medium text-ink">
            Your decision:{' '}
            {decision.decision === 'satisfied'
              ? 'satisfied, continue'
              : 'not satisfied'}
          </p>
          <p className="text-graphite">{decision.reason}</p>
          <p className="mt-0.5 text-[0.8125rem] text-slate">
            Recorded {formatDateTime(decision.at)}
          </p>
        </div>
        {decidable && (
          <Button size="xs" variant="ghost" onClick={() => setEditing(true)}>
            Change
          </Button>
        )}
      </div>
    )
  }
  if (!decidable)
    return (
      <p className="mt-2 text-[0.9375rem] text-slate">No decision recorded.</p>
    )
  if (!editing)
    return (
      <Button
        size="sm"
        variant="outline"
        className="mt-3 border-info/40 text-info hover:bg-info-wash"
        onClick={() => setEditing(true)}
      >
        <ClipboardCheck aria-hidden="true" />
        Record your decision
      </Button>
    )
  const id = `md-${ruleId}`
  return (
    <div className="mt-3 rounded-xl border border-line bg-white p-4">
      <fieldset>
        <legend className="text-[0.9375rem] font-medium text-ink">
          Your decision on {ruleId}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ['satisfied', 'Satisfied, continue'],
              ['not_satisfied', 'Not satisfied'],
            ] as const
          ).map(([v, label]) => (
            <label
              key={v}
              className={cn(
                'cursor-pointer rounded-lg border px-3.5 py-2 text-[0.9375rem] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
                choice === v
                  ? 'border-ink bg-mist text-ink'
                  : 'border-line text-graphite',
              )}
            >
              <input
                type="radio"
                name={id}
                className="sr-only"
                checked={choice === v}
                onChange={() => setChoice(v)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <label
        htmlFor={`${id}-reason`}
        className="mt-3 block text-[0.9375rem] font-medium text-ink"
      >
        Reason
      </label>
      <textarea
        id={`${id}-reason`}
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
      />
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          disabled={!reason.trim()}
          onClick={() => {
            apply((d) =>
              recordRuleDecision(
                d,
                caseId,
                ruleId,
                choice,
                reason.trim(),
                reviewerId,
              ),
            )
            setEditing(false)
          }}
        >
          Record decision
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
