import { cn } from '@/lib/utils'
import { Wordmark } from './Wordmark'

/** Compact monogram from the wordmark, for small square spaces (app bars, emails, documents). */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[0.9375rem] leading-none font-semibold tracking-[-0.06em]',
        inverted ? 'bg-paper text-ink' : 'bg-ink text-paper',
        className,
      )}
    >
      e<span className={inverted ? 'text-ink/45' : 'text-paper/55'}>o</span>
    </span>
  )
}

/** The full logo: the client's wordmark, with an optional product name for the app. */
export function Logo({ className, inverted = false, suffix }: { className?: string; inverted?: boolean; suffix?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <Wordmark inverted={inverted} tagline={false} className="[&>span:first-child]:text-[1.5rem]" />
      {suffix && (
        <span className={cn('rounded-full px-2.5 py-0.5 text-[0.8125rem] font-medium', inverted ? 'bg-white/10 text-paper/80' : 'bg-ink/[0.06] text-graphite')}>{suffix}</span>
      )}
    </span>
  )
}
