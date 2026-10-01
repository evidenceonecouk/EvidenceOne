import { CompletionTick } from '@/components/brand/CompletionTick'
import { cn } from '@/lib/utils'

/** Horizontal progress through a multi-step task. Completed steps get the brand's yellow tick. */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center gap-3" aria-current={active ? 'step' : undefined}>
            {done ? (
              <CompletionTick label={`${label}: completed`} />
            ) : (
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-[0.8125rem] font-semibold',
                  active ? 'bg-ink text-paper' : 'border-[1.5px] border-silver text-slate',
                )}
              >
                {i + 1}
              </span>
            )}
            <span className={cn('text-base', active ? 'font-medium text-ink' : 'text-slate')}>{label}</span>
            {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-8 bg-line sm:w-12" />}
          </li>
        )
      })}
    </ol>
  )
}
