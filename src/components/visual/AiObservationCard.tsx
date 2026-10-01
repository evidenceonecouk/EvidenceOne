import { Sparkles } from 'lucide-react'
import { RuleIdTag } from '@/components/StatusChip'
import { cn } from '@/lib/utils'
import { MODEL_LABEL } from '@/store/actions'
import type { AiObservation } from '@/types/domain'

export const AI_LABEL = 'AI observation. Advisory only.'

/** Small model and version tag shown on every AI output. */
export function ModelTag({ className }: { className?: string }) {
  return (
    <span className={cn('font-mono text-[0.75rem] text-slate', className)}>
      Model: {MODEL_LABEL}
    </span>
  )
}

const tone = {
  info: 'border-line bg-white',
  attention: 'border-info/30 bg-info-wash/40',
  mismatch: 'border-info/40 bg-info-wash/70',
}

/** An AI observation sits against the step it relates to and names the rule it explains. */
export function AiObservationCard({ o }: { o: AiObservation }) {
  return (
    <div
      data-cite={`ai:${o.id}`}
      className={cn('rounded-2xl border p-4', tone[o.severity])}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-graphite">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {AI_LABEL}
        </span>
        <span className="text-[0.8125rem] text-slate">Explains</span>
        <RuleIdTag id={o.ruleId} />
        <ModelTag className="sm:ml-auto" />
      </div>
      <p className="mt-2 text-base font-medium text-ink">{o.title}</p>
      <p className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">
        {o.detail}
      </p>
      <p className="mt-2 text-[0.875rem] text-slate">Source: {o.source}</p>
    </div>
  )
}
