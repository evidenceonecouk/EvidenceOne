import {
  ChevronRight,
  ClipboardList,
  ListChecks,
  Play,
  SlidersHorizontal,
  Square,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { GuidedDemo } from '@/features/guided/GuidedDemo'
import { acceptanceSteps, guidedSteps } from '@/features/guided/steps'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { PersonaSwitcher } from './PersonaSwitcher'
import { ResetDemoButton } from './ResetDemoButton'

const OPEN_KEY = 'eo-demo-panel-open'

function readOpen() {
  try {
    return localStorage.getItem(OPEN_KEY) === '1'
  } catch {
    return false
  }
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="text-[0.9375rem] font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-0.5 text-sm text-slate">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </section>
  )
}

function PageLink({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: LucideIcon
  children: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex min-h-11 w-full cursor-pointer items-center gap-3 bg-white px-3 py-2.5 text-left text-[0.9375rem] text-ink hover:bg-mist"
    >
      <Icon className="size-4 shrink-0 text-slate" aria-hidden="true" />
      <span className="flex-1">{children}</span>
      <ChevronRight className="size-4 shrink-0 text-slate" aria-hidden="true" />
    </button>
  )
}

/*
  Demo controls live in a collapsible white panel on the right-hand side,
  separate from the product's own header, so the product screens stay clean
  for an audience. Collapsed, only a slim tab on the right edge remains.
*/
export function PresenterBar() {
  const { state, setGuided } = useDemoStore()
  const [open, setOpen] = useState(readOpen)
  const tabRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const mounted = useRef(false)
  const guidedOn = state.guided.on

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, open ? '1' : '0')
    } catch {
      // Private windows may block storage; the panel still works.
    }
    // Move focus with the panel, but not on first render.
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (open) closeRef.current?.focus()
    else tabRef.current?.focus()
  }, [open])

  const start = (track: 'story' | 'acceptance') => {
    setGuided({ on: true, step: 0, track })
    setOpen(false)
  }

  return (
    <>
      <button
        ref={tabRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="demo-panel"
        aria-label={`Open demo controls. Guided demo, ${guidedSteps.length} steps, currently ${guidedOn ? 'on' : 'off'}`}
        className={cn(
          'fixed top-1/2 right-0 z-40 flex -translate-y-1/2 cursor-pointer flex-col items-center gap-2 rounded-l-xl border border-r-0 border-line bg-white px-2 py-3.5 text-ink shadow-[0_12px_32px_-12px_rgb(22_24_27/0.35)] transition-[opacity,translate] duration-200 ease-out hover:bg-mist motion-reduce:transition-none print:hidden',
          open ? 'pointer-events-none translate-x-2 opacity-0' : 'delay-200',
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        <span className="text-[0.875rem] font-medium [writing-mode:vertical-rl]">
          Demo controls
        </span>
        {guidedOn && (
          <span
            className="size-2 rounded-full bg-progress"
            aria-hidden="true"
          />
        )}
      </button>

      <aside
        id="demo-panel"
        aria-label="Demo controls"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col border-l border-line bg-white text-ink shadow-[-24px_0_60px_-24px_rgb(22_24_27/0.35)] transition-[translate,visibility] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform motion-reduce:transition-none print:hidden',
          open ? 'visible translate-x-0' : 'invisible translate-x-full',
        )}
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line-soft pr-2 pl-5">
          <h2 className="flex-1 text-base font-medium">Demo controls</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-expanded={open}
            aria-controls="demo-panel"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-graphite hover:bg-mist hover:text-ink"
          >
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">Close demo controls</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 short:space-y-4 short:py-3 [scrollbar-width:thin]">
          <Section title="Guided demo">
            <div className="space-y-2">
              {guidedOn ? (
                <button
                  type="button"
                  onClick={() =>
                    setGuided({
                      on: false,
                      step: state.guided.step,
                      track: state.guided.track,
                    })
                  }
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-highlight text-[0.9375rem] font-medium text-ink hover:brightness-95"
                >
                  <Square className="size-4" aria-hidden="true" />
                  Stop the guided demo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => start('story')}
                  className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-highlight text-[0.9375rem] font-medium text-ink hover:brightness-95"
                >
                  <Play className="size-4" aria-hidden="true" />
                  Start the guided demo, {guidedSteps.length} steps
                </button>
              )}
              <button
                type="button"
                onClick={() => start('acceptance')}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-highlight text-[0.9375rem] font-medium text-ink hover:brightness-95"
              >
                <Play className="size-4" aria-hidden="true" />
                Gate 2 walkthrough, {acceptanceSteps.length} steps
              </button>
            </div>
          </Section>

          <Section
            title="Show the demo as"
            hint="Pick who to view the platform as."
          >
            <PersonaSwitcher
              // Let the new screen render first so the slide runs on an idle main thread.
              onChoose={() => window.setTimeout(() => setOpen(false), 140)}
            />
          </Section>

          <Section title="Presenter pages">
            <nav
              aria-label="Presenter pages"
              className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line"
            >
              <PageLink to="/acceptance" icon={ListChecks}>
                Gate 2 acceptance scenarios
              </PageLink>
              <PageLink to="/decisions" icon={ClipboardList}>
                Decisions and open points
              </PageLink>
            </nav>
          </Section>
        </div>

        <footer className="shrink-0 border-t border-line-soft px-4 py-3">
          <ResetDemoButton className="h-11 w-full justify-center rounded-xl bg-ink text-paper hover:bg-graphite hover:text-paper" />
        </footer>
      </aside>
      <GuidedDemo />
    </>
  )
}
