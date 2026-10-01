import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/*
  The brand's yellow tick. Appears only when a step, document requirement or
  decision stage has been completed. Yellow is a filled block with dark ink on
  top, never yellow text on a light background.
*/
export function CompletionTick({
  className,
  label = 'Completed',
}: {
  className?: string
  label?: string
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-highlight text-ink',
        className,
      )}
    >
      <Check className="size-[60%]" strokeWidth={3} aria-hidden="true" />
    </span>
  )
}

/** Neutral marker for a step that is not yet complete. */
export function PendingMarker({
  className,
  label = 'Not yet completed',
  step,
}: {
  className?: string
  label?: string
  step?: number
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-silver text-xs font-semibold text-slate',
        className,
      )}
    >
      {step}
    </span>
  )
}
