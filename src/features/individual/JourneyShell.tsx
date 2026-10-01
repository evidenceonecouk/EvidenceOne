import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { LogoMark } from '@/components/brand/Logo'
import { PhoneFrame } from '@/components/phone/PhoneFrame'
import { shortHash, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { stageLabels, type StepSpec } from './journey'

/* Desktop layout: presenter caption, the phone, and the live audit feed for this case. */
export function JourneyShell({ step, caseId, children }: { step: StepSpec; caseId: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[88rem] items-start gap-10 px-0 sm:px-6 sm:py-10 lg:grid-cols-[1fr_auto_1fr]">
      <aside className="hidden lg:sticky lg:top-28 lg:block lg:pt-16">
        <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">{step.caption.kicker}</p>
        <h2 className="mt-3 max-w-sm text-[2rem] leading-[1.1] font-normal tracking-[-0.03em] text-ink">{step.caption.title}</h2>
        <p className="mt-4 max-w-sm text-lg leading-relaxed text-graphite">{step.caption.body}</p>
      </aside>
      <PhoneFrame>{children}</PhoneFrame>
      <LiveFeed caseId={caseId} />
    </div>
  )
}

function LiveFeed({ caseId }: { caseId: string }) {
  const { data } = useDemoStore()
  const events = data.audit.filter((e) => e.caseId === caseId).slice(-4).reverse()
  return (
    <aside className="hidden lg:sticky lg:top-28 lg:block lg:pt-16" aria-label="Audit trail for this case">
      <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">Live on the platform</p>
      <p className="mt-3 max-w-xs text-base text-graphite">
        Every step is written to the audit trail for case <span className="font-mono text-ink">{caseId}</span>.
      </p>
      <ol className="mt-6 max-w-xs space-y-3">
        {events.map((e) => (
          <li key={e.seq} className="animate-rise rounded-2xl border border-line/80 bg-white px-4 py-3 [animation-duration:400ms]">
            <p className="text-[0.9375rem] leading-snug text-ink">{e.detail}</p>
            <p className="mt-1.5 flex justify-between font-mono text-[0.8125rem] text-slate">
              <span>{timeAgo(e.at)}</span>
              <span>{shortHash(e.hash)}</span>
            </p>
          </li>
        ))}
        {events.length === 0 && <li className="text-base text-slate">Nothing recorded yet.</li>}
      </ol>
    </aside>
  )
}

/* Phone chrome: back, progress across the four stages, then the screen. */
export function AppBar({ stage, onBack, hideProgress }: { stage: number; onBack?: () => void; hideProgress?: boolean }) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 px-3">
      {onBack ? (
        <button type="button" onClick={onBack} className="-ml-1 flex size-10 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-mist" aria-label="Back">
          <ChevronLeft className="size-6" />
        </button>
      ) : (
        <span className="ml-1 flex items-center gap-2">
          <LogoMark className="size-7 p-1.5" />
          {hideProgress && <span className="text-base font-semibold text-ink">Evidence One</span>}
        </span>
      )}
      {!hideProgress && (
        <div className="ml-auto flex items-center gap-1.5 pr-2" role="progressbar" aria-label="Progress" aria-valuemin={1} aria-valuemax={4} aria-valuenow={stage + 1} aria-valuetext={stageLabels[stage]}>
          {stageLabels.map((l, i) => (
            <span key={l} className={cn('h-1.5 w-7 rounded-full transition-colors duration-300', i <= stage ? 'bg-ink' : 'bg-line')} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Screen({ children, footer, className }: { children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <>
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pt-2 pb-6', className)}>{children}</div>
      {footer && <div className="shrink-0 space-y-2.5 border-t border-line/70 bg-paper px-5 pt-4 pb-5">{footer}</div>}
    </>
  )
}

export function ScreenTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="mt-3">
      {kicker && <p className="font-mono text-[0.75rem] tracking-[0.14em] text-slate uppercase">{kicker}</p>}
      <h1 className="mt-1.5 text-[1.625rem] leading-[1.15] font-normal tracking-[-0.03em] text-ink">{children}</h1>
    </div>
  )
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-base leading-relaxed text-graphite">{children}</p>
}
