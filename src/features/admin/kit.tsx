import type { ComponentType, ReactNode } from 'react'
import { CircleAlert, CircleCheck, CircleDashed, CircleX, Clock, Lock, Mail, MailOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Shared pieces for the Admin pages. Status always pairs colour with an icon and a label. */

export function AdminHeader({ kicker = 'Platform administration', title, description, actions, meta }: { kicker?: string; title: string; description: ReactNode; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-line/80 pb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div className="mb-2.5 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">{kicker}</div>
        <h1 className="text-[2rem] leading-[1.1] font-medium tracking-[-0.025em] text-ink sm:text-[2.25rem]">{title}</h1>
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate sm:text-[1.0625rem]">{description}</p>
        {meta && <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  )
}

export type Tone = 'ok' | 'attention' | 'action' | 'neutral' | 'info' | 'locked'

const toneStyles: Record<Tone, { cls: string; icon: ComponentType<{ className?: string }> }> = {
  ok: { cls: 'bg-approve-wash text-approve', icon: CircleCheck },
  attention: { cls: 'bg-info-wash text-info', icon: CircleAlert },
  action: { cls: 'bg-decline-wash text-decline', icon: CircleX },
  neutral: { cls: 'bg-mist text-graphite', icon: CircleDashed },
  info: { cls: 'bg-progress-wash text-progress', icon: Clock },
  locked: { cls: 'bg-ink text-paper', icon: Lock },
}

export function StateBadge({ tone, children, icon, className }: { tone: Tone; children: ReactNode; icon?: ComponentType<{ className?: string }>; className?: string }) {
  const { cls, icon: DefaultIcon } = toneStyles[tone]
  const Icon = icon ?? DefaultIcon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-medium whitespace-nowrap', cls, className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}

export const messageStateTone = { delivered: 'ok', opened: 'info', bounced: 'action', queued: 'neutral' } as const
export const messageStateLabel = { delivered: 'Delivered', opened: 'Opened', bounced: 'Bounced', queued: 'Queued' } as const
export const messageStateIcon = { delivered: Mail, opened: MailOpen, bounced: CircleX, queued: CircleDashed } as const

/** A figure on a summary strip. */
export function Figure({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div className="min-w-0 px-5 py-5 sm:px-6">
      <dt className="text-[0.9375rem] text-slate">{label}</dt>
      <dd className="mt-2 text-[2rem] leading-none font-medium tracking-[-0.03em] text-ink tabular">{value}</dd>
      {detail && <dd className="mt-2 text-[0.875rem] text-slate">{detail}</dd>}
    </div>
  )
}
