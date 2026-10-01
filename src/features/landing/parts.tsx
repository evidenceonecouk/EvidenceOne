import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Monospaced uppercase label used to index sections. */
export function Kicker({ children, className, tone = 'light' }: { children: ReactNode; className?: string; tone?: 'light' | 'dark' }) {
  return (
    <p className={cn('font-mono text-[0.875rem] tracking-[0.14em] uppercase', tone === 'light' ? 'text-slate' : 'text-paper/55', className)}>
      {children}
    </p>
  )
}

export function SectionTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn('text-[2.5rem] leading-[1.05] font-normal tracking-[-0.035em] sm:text-[3.25rem] lg:text-[3.75rem]', className)}>
      {children}
    </h2>
  )
}

export const container = 'mx-auto max-w-[88rem] px-4 sm:px-6'
