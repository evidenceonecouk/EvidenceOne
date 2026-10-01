import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Layout primitives shared by every product screen. */

export function Page({ children, className, width = 'wide' }: { children: ReactNode; className?: string; width?: 'wide' | 'narrow' }) {
  return (
    <div className={cn('mx-auto px-4 pt-8 pb-20 sm:px-6 lg:pt-10', width === 'wide' ? 'max-w-[88rem]' : 'max-w-[60rem]', className)}>
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
        {kicker && <div className="mb-3 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">{kicker}</div>}
        <h1 className="text-[2.25rem] leading-[1.08] font-normal tracking-[-0.035em] text-ink sm:text-[2.75rem]">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-graphite">{description}</p>}
        {meta && <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.9375rem] text-slate">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}

export function Panel({ children, className, as: Tag = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' } & Record<string, unknown>) {
  return (
    <Tag className={cn('rounded-[20px] border border-line/80 bg-white shadow-[0_1px_2px_rgb(22_24_27/0.04)]', className)} {...rest}>
      {children}
    </Tag>
  )
}

export function PanelHeader({ title, description, actions, id }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/80 px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-medium text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[0.9375rem] text-slate">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({ label, value, detail, className }: { label: string; value: ReactNode; detail?: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-5 sm:px-6', className)}>
      <dt className="text-[0.9375rem] text-slate">{label}</dt>
      <dd className="mt-2 text-[2.25rem] leading-none font-light tracking-[-0.04em] text-ink tabular">{value}</dd>
      {detail && <dd className="mt-2 text-[0.9375rem] text-slate">{detail}</dd>}
    </div>
  )
}

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[0.8125rem] tracking-[0.12em] text-slate uppercase', className)}>{children}</span>
}

/** A native checkbox styled to the brand, with a large hit area. */
export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'size-5 shrink-0 cursor-pointer appearance-none rounded-[6px] border-[1.5px] border-slate bg-white transition-colors duration-150',
        "checked:border-ink checked:bg-ink checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fafaf9' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 12.5 4.5 4.5L19 7.5'/%3E%3C/svg%3E\")] checked:bg-[length:80%] checked:bg-center checked:bg-no-repeat",
        'disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      {...props}
    />
  )
}
