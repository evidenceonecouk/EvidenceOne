import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Every AI output carries this advisory label. */
export function AiTag({ className, label = 'AI · advisory only' }: { className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-ai-wash px-2.5 py-0.5 text-[0.8125rem] font-medium text-ai', className)}>
      <Sparkles className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}
