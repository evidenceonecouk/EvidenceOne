import {
  ChevronDown,
  CircleCheck,
  CircleDashed,
  CircleX,
  Flag,
  Info,
  Play,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Panel } from '@/components/app/Page'
import type { Field, ProviderFlag, ProviderResult } from '@/lib/providerReport'
import { cn } from '@/lib/utils'

/* Building blocks for the provider report. Never colour alone: every result has an icon and a word. */

const resultSpec: Record<
  ProviderResult,
  { label: string; icon: LucideIcon; text: string; chip: string }
> = {
  passed: {
    label: 'Passed',
    icon: CircleCheck,
    text: 'text-approve',
    chip: 'bg-approve-wash text-approve border-approve/25',
  },
  flagged: {
    label: 'Flagged',
    icon: Flag,
    text: 'text-info',
    chip: 'bg-info-wash text-info border-info/25',
  },
  not_passed: {
    label: 'Not passed',
    icon: CircleX,
    text: 'text-decline',
    chip: 'bg-decline-wash text-decline border-decline/25',
  },
  pending: {
    label: 'Not finished',
    icon: CircleDashed,
    text: 'text-slate',
    chip: 'bg-mist text-graphite border-line',
  },
}

export function ResultIcon({
  result,
  className,
}: {
  result: ProviderResult
  className?: string
}) {
  const spec = resultSpec[result]
  const Icon = spec.icon
  return (
    <Icon
      className={cn('size-4 shrink-0', spec.text, className)}
      aria-label={spec.label}
    />
  )
}

export function ResultChip({
  result,
  label,
  className,
}: {
  result: ProviderResult
  label?: string
  className?: string
}) {
  const spec = resultSpec[result]
  const Icon = spec.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap',
        spec.chip,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label ?? spec.label}
    </span>
  )
}

/** A collapsible report section, headed like the rest of the portal: mono label, result on the right. */
export function Section({
  id,
  icon: Icon,
  label,
  result,
  extra,
  children,
}: {
  id: string
  icon: LucideIcon
  label: string
  result?: ProviderResult
  extra?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-36">
      <h2 id={`${id}-h`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line/80 bg-mist px-4 py-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ink"
        >
          <ChevronDown
            className={cn(
              'size-4 text-slate transition-transform duration-150',
              !open && '-rotate-90',
            )}
            aria-hidden="true"
          />
          <Icon className="size-[1.125rem] text-graphite" aria-hidden="true" />
          <span className="font-mono text-[0.8125rem] tracking-[0.12em] text-graphite uppercase">
            {label}
          </span>
          {extra}
          {result && <ResultChip result={result} className="ml-auto" />}
        </button>
      </h2>
      {open && <div className="mt-4 space-y-4">{children}</div>}
    </section>
  )
}

export function Card({
  title,
  children,
  className,
}: {
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Panel className={cn('p-5 sm:p-6', className)}>
      {title && (
        <h3 className="mb-4 text-[1.0625rem] font-medium text-ink">{title}</h3>
      )}
      {children}
    </Panel>
  )
}

/** Label and value rows, as on the session details card. Long values wrap under their own width. */
export function DetailList({ rows }: { rows: Field[] }) {
  return (
    <dl className="divide-y divide-line/60 text-[0.9375rem]">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 py-2 first:pt-0 last:pb-0"
        >
          <dt className="text-slate">{r.label}</dt>
          <dd className="min-w-0 font-medium [overflow-wrap:anywhere] text-ink">
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Read-only extracted data, laid out in two columns like a form the reviewer cannot edit. */
export function FieldGrid({ fields }: { fields: Field[] }) {
  return (
    <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.label} className="min-w-0">
          <dt className="mb-1.5 text-[0.9375rem] text-slate">{f.label}</dt>
          <dd className="min-h-11 rounded-lg border border-line bg-mist/70 px-3.5 py-2.5 text-[0.9375rem] break-words text-ink">
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** A score shown as a figure and a bar. The bar is decoration; the figure carries the meaning. */
export function ScoreBar({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-line/80 bg-white p-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[0.9375rem] text-slate">{label}</span>
        <span className="text-[1.75rem] leading-none font-medium tracking-[-0.03em] text-ink tabular">
          {value === undefined ? 'Not given' : `${value.toFixed(2)}%`}
        </span>
      </div>
      {value !== undefined && (
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-mist"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-graphite"
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function Metric({
  label,
  value,
  note,
}: {
  label: string
  value?: number | string
  note?: string
}) {
  return (
    <div className="rounded-2xl border border-line/80 bg-white p-5">
      <div className="text-[0.9375rem] text-slate">{label}</div>
      <div className="mt-2 text-[1.75rem] leading-none font-medium tracking-[-0.03em] text-ink tabular">
        {value === undefined
          ? 'Not given'
          : typeof value === 'number'
            ? `${value.toFixed(1)}%`
            : value}
      </div>
      {note && <div className="mt-2 text-[0.875rem] text-slate">{note}</div>}
    </div>
  )
}

const levelIcon = { information: Info, warning: Flag, error: CircleX }
const levelText = {
  information: 'text-slate',
  warning: 'text-info',
  error: 'text-decline',
}

/** The provider's observations for one check. Each opens to the provider's longer explanation. */
export function Observations({ flags }: { flags: ProviderFlag[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Panel>
      <div className="flex items-center gap-2 border-b border-line/80 px-5 py-3.5">
        {flags.length === 0 ? (
          <CircleCheck className="size-4 text-approve" aria-hidden="true" />
        ) : (
          <Info className="size-4 text-graphite" aria-hidden="true" />
        )}
        <span className="font-medium text-ink">Provider observations</span>
        <span className="text-[0.9375rem] text-slate">
          {flags.length === 0
            ? `None for this check`
            : `${flags.length} for this check`}
        </span>
      </div>
      {flags.length > 0 && (
        <ul className="divide-y divide-line/80">
          {flags.map((f, i) => {
            const Icon = levelIcon[f.level]
            return (
              <li key={i}>
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full cursor-pointer items-start gap-3 px-5 py-3.5 text-left outline-none hover:bg-mist/60 focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-inset"
                >
                  <Icon
                    className={cn('mt-0.5 size-4 shrink-0', levelText[f.level])}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] text-ink">
                      {f.title}
                    </span>
                    {open === i && f.detail && (
                      <span className="mt-1.5 block text-[0.9375rem] leading-relaxed text-slate">
                        {f.detail}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-[0.875rem] text-slate capitalize">
                    {f.level}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

/** An image or video from the provider. Media links expire, so a failed load says so plainly. */
export function Media({
  src,
  kind,
  label,
  fallback,
  className,
}: {
  src?: string
  kind: 'image' | 'video'
  label: string
  fallback?: ReactNode
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const box = cn(
    'relative overflow-hidden rounded-xl border border-line/80 bg-mist',
    className,
  )
  if (!src)
    return (
      <figure className={box}>
        {fallback ?? (
          <div className="flex h-full min-h-40 items-center justify-center p-4 text-center text-[0.9375rem] text-slate">
            Not captured
          </div>
        )}
        <figcaption className="sr-only">{label}</figcaption>
      </figure>
    )
  if (failed)
    return (
      <figure
        className={cn(box, 'flex min-h-40 items-center justify-center p-4')}
      >
        <figcaption className="text-center text-[0.9375rem] text-slate">
          {label}: the link has expired. Refresh to load it again.
        </figcaption>
      </figure>
    )
  if (kind === 'video')
    return (
      <figure className={box}>
        {playing ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="h-full w-full bg-ink object-contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="flex h-full min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 text-[0.9375rem] text-graphite outline-none hover:bg-line-soft focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-inset"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-ink text-paper">
              <Play className="size-5" aria-hidden="true" />
            </span>
            Play {label.toLowerCase()}
          </button>
        )}
      </figure>
    )
  return (
    <figure className={box}>
      <img
        src={src}
        alt={label}
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
      <figcaption className="absolute bottom-2 left-2 rounded-md bg-ink/80 px-2 py-0.5 text-[0.8125rem] text-paper">
        {label}
      </figcaption>
    </figure>
  )
}
