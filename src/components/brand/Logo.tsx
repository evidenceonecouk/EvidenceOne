import { cn } from '@/lib/utils'

/** Placeholder mark until the client's final Evidence One logo arrives. Easy to swap. */
export function LogoMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-8 shrink-0 grid-cols-2 gap-[3px] rounded-[9px] p-[7px]',
        inverted ? 'bg-paper' : 'bg-ink',
        className,
      )}
    >
      <i className={cn('rounded-[2px]', inverted ? 'bg-ink' : 'bg-paper')} />
      <i className="rounded-[2px] bg-highlight" />
      <i className={cn('rounded-[2px]', inverted ? 'bg-ink' : 'bg-paper')} />
      <i className={cn('rounded-[2px]', inverted ? 'bg-ink' : 'bg-paper')} />
    </span>
  )
}

export function Logo({ className, inverted = false, suffix }: { className?: string; inverted?: boolean; suffix?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark inverted={inverted} />
      <span className={cn('text-[1.0625rem] font-semibold tracking-[-0.02em]', inverted ? 'text-paper' : 'text-ink')}>
        Evidence One
        {suffix && <span className={cn('ml-1.5 font-normal', inverted ? 'text-silver' : 'text-slate')}>{suffix}</span>}
      </span>
    </span>
  )
}
