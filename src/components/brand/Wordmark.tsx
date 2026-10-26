import { cn } from '@/lib/utils'

/** The client's wordmark direction: lowercase "evidence" with a lighter "one", over the brand statement. */
export function Wordmark({
  className,
  inverted = false,
  tagline = true,
  align = 'start',
  size = 'md',
}: {
  className?: string
  inverted?: boolean
  tagline?: boolean
  /** Centre the statement under the word, for a lockup on its own. */
  align?: 'start' | 'center'
  size?: 'md' | 'lg'
}) {
  return (
    <span
      className={cn(
        'inline-flex flex-col leading-none',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      <span
        className={cn(
          'font-medium tracking-[-0.05em]',
          size === 'lg' ? 'text-[2.5rem]' : 'text-[1.75rem]',
          inverted ? 'text-paper' : 'text-ink',
        )}
      >
        evidence
        <span className={inverted ? 'text-paper/55' : 'text-[#8b9096]'}>
          one
        </span>
      </span>
      {tagline && (
        <span
          className={cn(
            // The negative margin cancels the tracking after the last letter, so the statement sits true under the word.
            'hidden font-medium tracking-[0.32em] whitespace-nowrap uppercase sm:block',
            size === 'lg'
              ? 'mt-2.5 -mr-[0.32em] text-[0.6875rem]'
              : 'mt-1.5 -mr-[0.32em] text-[0.5625rem]',
            inverted ? 'text-paper/60' : 'text-slate',
          )}
        >
          Clarity creates confidence
        </span>
      )}
    </span>
  )
}
