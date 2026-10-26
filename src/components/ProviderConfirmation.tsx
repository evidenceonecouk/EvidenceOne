import { Hourglass } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
  Awaiting a provider, not the client. Distinct from "Pending your decision":
  the identity provider or the secure payment provider has yet to confirm
  something. Never names a provider.
*/
export function ProviderConfirmation({
  label = 'Subject to provider confirmation',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-mist px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap text-graphite',
        className,
      )}
    >
      <Hourglass className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}
