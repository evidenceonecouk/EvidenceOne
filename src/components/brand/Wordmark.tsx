import { cn } from '@/lib/utils'

/** The client's wordmark direction: lowercase "evidence" with a lighter "one", over the brand statement. */
export function Wordmark({ className, inverted = false, tagline = true }: { className?: string; inverted?: boolean; tagline?: boolean }) {
  return (
    <span className={cn('inline-flex flex-col leading-none', className)}>
      <span className={cn('text-[1.75rem] font-medium tracking-[-0.05em]', inverted ? 'text-paper' : 'text-ink')}>
        evidence<span className={inverted ? 'text-paper/55' : 'text-[#8b9096]'}>one</span>
      </span>
      {tagline && (
        <span className={cn('mt-1.5 text-[0.5625rem] font-medium tracking-[0.32em] uppercase', inverted ? 'text-paper/60' : 'text-slate')}>
          Clarity creates confidence
        </span>
      )}
    </span>
  )
}
