import { ShieldCheck } from 'lucide-react'
import { attributionText, technologyProviderText } from '@/lib/attribution'
import { cn } from '@/lib/utils'

/**
  The attribution line. By default it is said to the individual. With
  `audience="acsp"` it is said on the ACSP's own screens and names Evidence One
  as the ACSP's technology provider.
*/
export function AttributionNote({
  acspName,
  className,
  tone = 'light',
  audience = 'individual',
}: {
  acspName?: string
  className?: string
  tone?: 'light' | 'dark'
  audience?: 'individual' | 'acsp'
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
      <span>
        {audience === 'acsp' && acspName
          ? `This verification is being conducted by ${acspName} using the Evidence One platform. ${technologyProviderText(acspName)}`
          : attributionText(acspName)}
      </span>
    </p>
  )
}
