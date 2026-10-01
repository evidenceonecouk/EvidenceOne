import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/* Layout primitives shared by every product screen. */

export function Page({
  children,
  className,
  width = 'wide',
}: {
  children: ReactNode
  className?: string
  width?: 'wide' | 'narrow'
}) {
  return (
    <div
      className={cn(
        'stagger mx-auto px-4 pt-8 pb-20 sm:px-8 lg:pt-10',
        width === 'wide' ? 'max-w-[92rem]' : 'max-w-[60rem]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
  meta,
}: {
  kicker?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-6 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {kicker && (
          <div className="mb-3 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
            {kicker}
          </div>
        )}
        <h1 className="text-[2rem] leading-[1.1] font-medium tracking-[-0.025em] text-ink sm:text-[2.25rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate sm:text-[1.0625rem]">
            {description}
          </p>
        )}
        {meta && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem] text-slate">
            {meta}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  )
}

export function Panel({
  children,
  className,
  as: Tag = 'section',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
} & Record<string, unknown>) {
  return (
    <Tag
      className={cn(
        'min-w-0 rounded-2xl border border-line/80 bg-white shadow-[0_1px_2px_rgb(22_24_27/0.04)]',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function PanelHeader({
  title,
  description,
  actions,
  id,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  id?: string
}) {
  return (
    <div className="flex min-h-[4.25rem] flex-wrap items-center justify-between gap-3 border-b border-line/80 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="text-[1.0625rem] font-medium text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-[0.9375rem] text-slate">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({
  label,
  value,
  detail,
  className,
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-5 py-5 sm:px-6', className)}>
      <dt className="text-[0.9375rem] text-slate">{label}</dt>
      <dd className="mt-2 text-[2.25rem] leading-none font-light tracking-[-0.04em] text-ink tabular">
        {value}
      </dd>
      {detail && <dd className="mt-2 text-[0.9375rem] text-slate">{detail}</dd>}
    </div>
  )
}

export function MonoLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-mono text-[0.8125rem] tracking-[0.12em] text-slate uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A native checkbox styled to the brand. The real input stays focusable; the box and tick are drawn from its state. */
export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span
      className={cn('relative inline-flex size-[1.375rem] shrink-0', className)}
    >
      <input
        type="checkbox"
        className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none flex size-full items-center justify-center rounded-[7px] border-[1.5px] border-slate bg-white text-transparent transition-[background-color,border-color,color,transform] duration-150 ease-out peer-hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-highlight peer-focus-visible:ring-[3px] peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 peer-active:scale-90 peer-disabled:opacity-40"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-[0.95rem]"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
    </span>
  )
}

/** Page header for portal home screens. Kept calm: title, context and actions on one baseline. */
export function HeroBanner({
  kicker,
  title,
  description,
  actions,
  meta,
}: {
  kicker?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  illustration?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-line/80 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {kicker && (
          <div className="mb-2.5 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
            {kicker}
          </div>
        )}
        <h1 className="text-[2rem] leading-[1.1] font-medium tracking-[-0.025em] text-ink sm:text-[2.25rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate sm:text-[1.0625rem]">
            {description}
          </p>
        )}
        {meta && (
          <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  )
}

/** A stat card: label and icon on top, the figure below. Neutral by design; colour is reserved for decisions. */
export function StatTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: string
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line/80 bg-white px-5 py-5 shadow-[0_1px_2px_rgb(22_24_27/0.04)]">
      <div className="flex items-center justify-between gap-3">
        <dt className="truncate text-[0.9375rem] text-slate">{label}</dt>
        <Icon
          className="size-[1.125rem] shrink-0 text-silver"
          aria-hidden="true"
        />
      </div>
      <dd className="mt-3 text-[2.25rem] leading-none font-medium tracking-[-0.03em] text-ink tabular">
        {typeof value === 'number' ? <CountUp value={value} /> : value}
      </dd>
      <dd className="mt-2 min-h-[1.25rem] text-[0.875rem] leading-snug text-slate">
        {detail}
      </dd>
    </div>
  )
}

/** Counts up to a number on first render; jumps straight there when motion is reduced. */
export function CountUp({
  value,
  duration = 700,
}: {
  value: number
  duration?: number
}) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value)
      return
    }
    const start = performance.now()
    const begin = from.current
    let frame = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(begin + (value - begin) * eased))
      if (p < 1) frame = requestAnimationFrame(tick)
      else from.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])
  return <>{shown}</>
}
