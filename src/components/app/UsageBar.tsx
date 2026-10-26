import { cn } from '@/lib/utils'

/**
  Usage against a limit, for package allowances and storage. The figures are
  always written out, so the bar never carries meaning by colour alone.
*/
export function UsageBar({
  label,
  used,
  limit,
  unit,
  className,
}: {
  label: string
  used: number
  limit: number
  /** Written after both figures, for example "cases" or "GB". */
  unit: string
  className?: string
}) {
  const share = limit > 0 ? used / limit : 0
  const over = share >= 1
  const near = !over && share >= 0.9
  const fmt = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 2 : 1)
  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-base font-medium text-ink">{label}</span>
        <span className="text-base text-graphite tabular">
          {fmt(used)} of {fmt(limit)} {unit}
          {over ? ' (limit reached)' : near ? ' (nearly full)' : ''}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        aria-valuetext={`${fmt(used)} of ${fmt(limit)} ${unit}`}
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-mist"
      >
        <div
          className={cn(
            'h-full rounded-full',
            over ? 'bg-decline' : near ? 'bg-info' : 'bg-ink',
          )}
          style={{ width: `${Math.min(100, share * 100)}%` }}
        />
      </div>
    </div>
  )
}
