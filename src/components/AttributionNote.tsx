import { ShieldCheck } from 'lucide-react'
import { attributionText } from '@/lib/attribution'
import { cn } from '@/lib/utils'

export function AttributionNote({
  acspName,
  className,
  tone = 'light',
}: {
  acspName?: string
  className?: string
  tone?: 'light' | 'dark'
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2.5 text-base leading-relaxed',
        tone === 'light' ? 'text-graphite' : 'text-paper/85',
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{attributionText(acspName)}</span>
    </p>
  )
}
