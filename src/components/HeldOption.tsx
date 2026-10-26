import { PackageOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useShowHeldOptions } from '@/store/DemoStore'

/*
  Options held until after go-live (decided 22 October): O1 language help, O2
  Route B filings, O3 bank statement redaction. Each carries this badge. The
  presenter setting showHeldOptions hides them; journeys work without them.
*/

export type HeldOptionCode = 'O1' | 'O2' | 'O3'

export const HELD_OPTION_LABEL = 'Option. Available after go-live.'

export function HeldOptionBadge({
  code,
  className,
}: {
  code?: HeldOptionCode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap text-graphite',
        className,
      )}
    >
      <PackageOpen className="size-3.5" aria-hidden="true" />
      {HELD_OPTION_LABEL}
      {code && (
        <span className="font-mono text-[0.75rem] opacity-80">{code}</span>
      )}
    </span>
  )
}

/** Renders its children only while held options are shown. */
export function HeldOption({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return useShowHeldOptions() ? <>{children}</> : <>{fallback}</>
}
