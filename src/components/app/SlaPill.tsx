import { Clock3 } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { timeRemaining } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Live countdown against the review target (36 hours, shown to reviewers only). Colour and wording both carry the urgency. */
export function SlaPill({ due, className }: { due: string; className?: string }) {
  const now = useNow(1000)
  const t = timeRemaining(due, now)
  const tone = t.overdue ? 'bg-decline-wash text-decline border-decline/25' : t.hours < 12 ? 'bg-info-wash text-info border-info/25' : 'bg-progress-wash text-progress border-progress/20'
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.875rem] whitespace-nowrap tabular', tone, className)}>
      <Clock3 className="size-4" aria-hidden="true" />
      {t.overdue ? `Overdue ${t.label}` : `${t.label} left`}
    </span>
  )
}
