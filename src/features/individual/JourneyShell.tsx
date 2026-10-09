import { ChevronLeft, Laptop, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { LogoMark } from '@/components/brand/Logo'
import { Wordmark } from '@/components/brand/Wordmark'
import { DesktopBrowserChrome, PhoneFrame } from '@/components/phone/PhoneFrame'
import { languageByCode } from '@/data/i18n'
import { shortHash, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { GuidanceBanner } from './language/GuidanceBanner'
import { LanguageSwitch } from './language/LanguageSwitch'
import { stageLabels, type StepSpec } from './journey'
import {
  initialMode,
  JourneyViewContext,
  rememberMode,
  useJourneyView,
  type JourneyMode,
} from './JourneyView'

export { useJourneyView } from './JourneyView'

/*
  Layout on wide screens: presenter caption, the journey in a mobile browser
  frame or in a desktop browser window (a toggle), and the live audit feed for
  this case. On a real phone the frame falls away.
*/
export function JourneyShell({
  step,
  caseId,
  children,
}: {
  step?: StepSpec
  caseId: string
  children: ReactNode
}) {
  const { search } = useLocation()
  const { state } = useDemoStore()
  const [mode, setModeState] = useState<JourneyMode>(() => initialMode(search))
  const setMode = (m: JourneyMode) => {
    setModeState(m)
    rememberMode(m)
  }
  const lang = languageByCode(state.language)
  const value = useMemo(() => ({ mode, stepId: step?.id }), [mode, step?.id])
  const content = (
    <JourneyViewContext.Provider value={value}>
      {children}
    </JourneyViewContext.Provider>
  )

  const caption = step && (
    <>
      <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
        {step.caption.kicker}
      </p>
      <h2 className="mt-3 max-w-sm text-[2rem] leading-[1.1] font-normal tracking-[-0.03em] text-ink">
        {step.caption.title}
      </h2>
      <p className="mt-4 max-w-sm text-lg leading-relaxed text-graphite">
        {step.caption.body}
      </p>
      <p className="mt-8 max-w-sm border-t border-line pt-4 text-[0.9375rem] text-slate">
        {mode === 'mobile'
          ? 'Shown as it appears in a mobile browser.'
          : 'Shown as it appears in a desktop browser.'}
      </p>
    </>
  )

  if (mode === 'desktop')
    return (
      <div className="mx-auto grid max-w-[92rem] items-start gap-8 px-0 py-0 sm:px-8 sm:py-7 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <ViewToggle mode={mode} onChange={setMode} />
          <div className="mt-8">{caption}</div>
          <LiveFeed caseId={caseId} className="mt-10" />
        </aside>
        <div>
          <div className="mb-4 flex justify-center lg:hidden">
            <ViewToggle mode={mode} onChange={setMode} />
          </div>
          <div
            role="region"
            aria-label="Desktop browser"
            className="overflow-hidden border-line bg-paper sm:rounded-2xl sm:border sm:shadow-[0_30px_60px_-30px_rgb(22_24_27/0.35)]"
          >
            <DesktopBrowserChrome
              path={`/journey/${caseId}/${step?.id ?? ''}`}
            />
            <div
              dir={lang.dir}
              lang={lang.code}
              className="flex min-h-[40rem] flex-col"
            >
              {content}
            </div>
          </div>
        </div>
      </div>
    )

  return (
    <div className="mx-auto grid max-w-[92rem] items-center gap-12 px-0 sm:px-8 lg:grid-cols-[1fr_auto_1fr]">
      <aside className="hidden lg:block">
        <ViewToggle mode={mode} onChange={setMode} />
        <div className="mt-8">{caption}</div>
      </aside>
      <div className="relative">
        <div className="hidden justify-center pt-4 sm:flex lg:hidden">
          <ViewToggle mode={mode} onChange={setMode} />
        </div>
        <PhoneFrame dir={lang.dir} lang={lang.code}>
          {content}
        </PhoneFrame>
      </div>
      <LiveFeed caseId={caseId} className="hidden lg:block" />
    </div>
  )
}

/** "Mobile browser / Desktop browser": the same journey on a phone or a laptop. */
export function ViewToggle({
  mode,
  onChange,
}: {
  mode: JourneyMode
  onChange: (m: JourneyMode) => void
}) {
  const options = [
    ['mobile', 'Mobile browser', Smartphone],
    ['desktop', 'Desktop browser', Laptop],
  ] as const
  return (
    <div
      role="group"
      aria-label="Show the journey in"
      className="inline-flex rounded-xl border border-line bg-white p-1"
    >
      {options.map(([m, label, Icon]) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={cn(
            'flex min-h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[0.9375rem] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ink',
            mode === m ? 'bg-ink text-paper' : 'text-graphite hover:bg-mist',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  )
}

function LiveFeed({
  caseId,
  className,
}: {
  caseId: string
  className?: string
}) {
  const { data } = useDemoStore()
  const events = data.audit
    .filter((e) => e.caseId === caseId)
    .slice(-4)
    .reverse()
  return (
    <aside className={className} aria-label="Audit trail for this case">
      <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
        Live on the platform
      </p>
      <p className="mt-3 max-w-xs text-base text-graphite">
        Every step is written to the audit trail for case{' '}
        <span className="font-mono text-ink">{caseId}</span>.
      </p>
      <ol className="mt-6 max-w-xs space-y-3">
        {events.map((e) => (
          <li
            key={e.seq}
            className="animate-rise rounded-2xl border border-line/80 bg-white px-4 py-3 [animation-duration:400ms]"
          >
            <p className="text-[0.9375rem] leading-snug text-ink">{e.detail}</p>
            <p className="mt-1.5 flex justify-between font-mono text-[0.8125rem] text-slate">
              <span>{timeAgo(e.at)}</span>
              <span>{shortHash(e.hash)}</span>
            </p>
          </li>
        ))}
        {events.length === 0 && (
          <li className="text-base text-slate">Nothing recorded yet.</li>
        )}
      </ol>
    </aside>
  )
}

/*
  The top of every journey screen: back, progress across the stages, and the
  language switch, which is visible at any time on every screen. On a mobile
  browser it is a compact bar; on a desktop browser it is a page header.
*/
export function AppBar({
  stage,
  onBack,
  hideProgress,
}: {
  stage: number
  onBack?: () => void
  hideProgress?: boolean
}) {
  const { mode } = useJourneyView()
  const desktop = mode === 'desktop'
  const back = onBack && (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-full text-ink outline-none hover:bg-mist focus-visible:ring-[3px] focus-visible:ring-ink',
        desktop ? 'h-11 gap-1 px-3 text-base' : '-ms-1 size-11',
      )}
      aria-label="Back"
    >
      <ChevronLeft className="size-6 rtl:rotate-180" aria-hidden="true" />
      {desktop && 'Back'}
    </button>
  )
  const progress = !hideProgress && (
    <div
      className="ms-auto flex items-center gap-1.5 pe-1"
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={1}
      aria-valuemax={stageLabels.length}
      aria-valuenow={stage + 1}
      aria-valuetext={stageLabels[stage]}
    >
      {stageLabels.map((l, i) => (
        <span
          key={l}
          className={cn(
            'h-1.5 rounded-full transition-colors duration-300',
            desktop ? 'w-10' : 'w-5',
            i <= stage ? 'bg-ink' : 'bg-line',
          )}
        />
      ))}
      {desktop && (
        <span className="ms-3 text-[0.9375rem] text-slate">
          {stageLabels[stage]}
        </span>
      )}
    </div>
  )
  if (desktop)
    return (
      <header className="flex min-h-16 shrink-0 items-center gap-4 border-b border-line/70 px-6">
        <Wordmark
          tagline={false}
          className="[&>span:first-child]:text-[1.5rem]"
        />
        {back}
        {progress || <span className="ms-auto" />}
        <LanguageSwitch />
      </header>
    )
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 px-3">
      {back ?? (
        <span className="ms-1 flex items-center gap-2">
          {hideProgress ? (
            <Wordmark
              tagline={false}
              className="[&>span:first-child]:text-[1.375rem]"
            />
          ) : (
            <LogoMark className="size-8" />
          )}
        </span>
      )}
      {progress || <span className="ms-auto" />}
      <LanguageSwitch />
    </div>
  )
}

/*
  A journey screen. On a mobile browser: scrolling content plus a fixed action
  footer. On a desktop browser: a centred page column with the actions below.
  Whenever something changes (a check completes, a result appears), the screen
  scrolls down just enough to bring it into view. It only ever scrolls down, so
  live counters cannot make it jitter.
*/
export function Screen({
  children,
  footer,
  className,
}: {
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const { mode } = useJourneyView()
  const desktop = mode === 'desktop'
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = ref.current
    if (!box) return
    let frame = 0
    let target: Element | null = null
    const reveal = () => {
      frame = 0
      if (!target || !box.contains(target)) return
      const t = target.getBoundingClientRect()
      if (desktop) {
        const overflow = t.bottom - window.innerHeight + 24
        if (overflow > 0) window.scrollBy({ top: overflow, behavior: 'smooth' })
        return
      }
      const b = box.getBoundingClientRect()
      const overflow = t.bottom - b.bottom + 20
      if (overflow > 0) box.scrollBy({ top: overflow, behavior: 'smooth' })
    }
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        const node =
          m.type === 'characterData'
            ? m.target.parentElement
            : ((m.addedNodes[0] as Element | undefined) ??
              (m.target as Element))
        const el =
          node instanceof Element
            ? (node.closest('li, p, [data-follow]') ?? node)
            : null
        if (el) target = el
      }
      if (!frame) frame = requestAnimationFrame(reveal)
    })
    mo.observe(box, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'data-state'],
    })
    return () => {
      mo.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [desktop])

  if (desktop)
    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 pt-4 pb-12',
          className,
        )}
      >
        {children}
        {footer && (
          <div className="mt-8 flex max-w-md flex-col gap-3">{footer}</div>
        )}
      </div>
    )
  return (
    <>
      <div
        ref={ref}
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scroll-smooth px-5 pt-2 pb-6',
          className,
        )}
      >
        {children}
      </div>
      {footer && (
        <div className="shrink-0 space-y-2.5 border-t border-line/70 bg-paper px-5 pt-4 pb-5">
          {footer}
        </div>
      )}
    </>
  )
}

/** The step heading, with the pre-written guidance in the chosen language beneath it. */
export function ScreenTitle({
  children,
  kicker,
}: {
  children: ReactNode
  kicker?: string
}) {
  const { stepId } = useJourneyView()
  return (
    <div className="mt-3">
      {kicker && (
        <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
          {kicker}
        </p>
      )}
      <h1 className="mt-1.5 text-[1.625rem] leading-[1.15] font-normal tracking-[-0.03em] text-ink">
        {children}
      </h1>
      {stepId && <GuidanceBanner step={stepId} />}
    </div>
  )
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-base leading-relaxed text-graphite">{children}</p>
  )
}
