import { Hourglass } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
  Where the client has not decided, the demo shows this badge and builds the
  point as a setting. It never chooses for her. The optional code is the
  reference on the call agenda, for example "P3" or "H1".
*/
export function PendingDecision({
  code,
  className,
}: {
  code?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-info-wash px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap text-info',
        className,
      )}
    >
      <Hourglass className="size-3.5" aria-hidden="true" />
      Pending your decision
      {code && (
        <span className="font-mono text-[0.75rem] opacity-80">{code}</span>
      )}
    </span>
  )
}
