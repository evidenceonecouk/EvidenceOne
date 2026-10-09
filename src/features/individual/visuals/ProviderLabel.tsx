import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
  Marks every capture and check as the certified identity provider's browser
  route. The provider is never named.
*/
export function ProviderLabel({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[0.875rem] font-medium text-ink',
        className,
      )}
    >
      <ShieldCheck className="size-4" aria-hidden="true" />
      Certified identity provider
    </p>
  )
}
