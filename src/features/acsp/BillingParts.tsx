import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Small table pieces shared by the billing tabs. 16px body text, real table markup. */

export function Table({
  children,
  min = '48rem',
  caption,
}: {
  children: ReactNode
  min?: string
  caption: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left" style={{ minWidth: min }}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  )
}

export function Th({
  children,
  right,
  className,
}: {
  children: ReactNode
  right?: boolean
  className?: string
}) {
  return (
    <th
      scope="col"
      className={cn(
        'bg-mist/50 px-4 py-3 text-[0.9375rem] font-medium text-slate first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6',
        right && 'text-right',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  right,
  strong,
  muted,
  className,
  colSpan,
}: {
  children?: ReactNode
  right?: boolean
  strong?: boolean
  muted?: boolean
  className?: string
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-4 py-3.5 align-top text-base first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6',
        right && 'tabular text-right',
        strong ? 'font-medium text-ink' : muted ? 'text-slate' : 'text-ink',
        className,
      )}
    >
      {children}
    </td>
  )
}

/** A note panel inside a tab: quiet, with an optional badge on the right. */
export function Note({
  title,
  children,
  badge,
}: {
  title: string
  children: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line/80 bg-mist/40 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-base font-medium text-ink">{title}</p>
        <div className="mt-1 text-base leading-relaxed text-graphite">
          {children}
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  )
}
