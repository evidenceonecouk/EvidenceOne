import { SearchX } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/*
  A full-page state: access refused, not available yet, not found, held option
  hidden. One centred card so the screen reads as a deliberate outcome, with
  the facts behind it laid out underneath. Neutral by design; decision colours
  stay reserved for approve, request information and decline.
*/

export interface StateDetail {
  label: string
  value: ReactNode
  /** References, hashes and timestamps read better in mono. */
  mono?: boolean
}

export function StateScreen({
  icon: Icon,
  kicker,
  title,
  description,
  details,
  detailsTitle,
  children,
  actions,
  note,
  tone = 'ink',
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  kicker?: ReactNode
  title: ReactNode
  description?: ReactNode
  details?: StateDetail[]
  detailsTitle?: string
  children?: ReactNode
  actions?: ReactNode
  note?: ReactNode
  /** Ink for a firm stop (refused, blocked); mist for a softer "not yet". */
  tone?: 'ink' | 'mist'
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-[58rem] items-center px-4 py-8 sm:px-8">
      <section
        aria-labelledby="state-title"
        className="stagger w-full overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_30px_60px_-40px_rgb(22_24_27/0.35)]"
      >
        <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:gap-6 sm:px-9 sm:py-8">
          <span
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-2xl',
              tone === 'ink'
                ? 'bg-ink text-white shadow-[0_10px_24px_-12px_rgb(22_24_27/0.6)]'
                : 'border border-line bg-mist text-ink',
            )}
          >
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            {kicker && (
              <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
                {kicker}
              </p>
            )}
            <h1
              id="state-title"
              className={cn(
                'text-[1.625rem] leading-[1.15] font-medium tracking-[-0.025em] text-ink sm:text-[1.875rem]',
                kicker && 'mt-1.5',
              )}
            >
              {title}
            </h1>
            {description && (
              <p className="mt-2.5 max-w-[44rem] text-base leading-relaxed text-graphite">
                {description}
              </p>
            )}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="border-t border-line/80 bg-mist/50 px-6 py-5 sm:px-9">
            {detailsTitle && (
              <h2 className="mb-3 text-[0.9375rem] font-medium text-ink">
                {detailsTitle}
              </h2>
            )}
            <dl className="grid gap-2.5 sm:grid-cols-2">
              {details.map((d) => (
                <div
                  key={d.label}
                  className="min-w-0 rounded-xl border border-line/70 bg-white px-4 py-3"
                >
                  <dt className="text-[0.875rem] text-slate">{d.label}</dt>
                  <dd
                    className={cn(
                      'mt-0.5 text-ink',
                      d.mono
                        ? 'font-mono text-[0.875rem] tracking-[0.02em] break-all'
                        : 'text-[0.9375rem]',
                    )}
                  >
                    {d.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {(actions || note) && (
          <div className="flex flex-col gap-4 border-t border-line/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-9">
            {note && (
              <div className="flex min-w-0 items-start gap-2 text-[0.875rem] leading-snug text-slate">
                {note}
              </div>
            )}
            {actions && (
              <div className="flex shrink-0 flex-col gap-2 sm:ml-auto sm:flex-row">
                {actions}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

/** A case or record link that points at nothing: an old link, or a demo reset since. */
export function CaseNotFound({ kind = 'case' }: { kind?: 'case' | 'record' }) {
  const to = kind === 'record' ? '/records' : '/acsp/queue'
  return (
    <StateScreen
      icon={SearchX}
      tone="mist"
      kicker={kind === 'record' ? 'Verification records' : 'Review queue'}
      title={kind === 'record' ? 'Record not found' : 'Case not found'}
      description={`There is no ${kind} at this link. It may be an old link, or the demo may have been reset since it was opened.`}
      actions={
        <Button asChild>
          <Link to={to}>
            {kind === 'record'
              ? 'Back to records'
              : 'Back to your review queue'}
          </Link>
        </Button>
      }
    />
  )
}
