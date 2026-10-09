import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { IdleNotice } from '@/components/app/IdleNotice'
import { useDemoStore } from '@/store/DemoStore'
import { guidedSteps } from './steps'

/*
  Floating caption card for the guided demo. Mounted once in the presenter bar,
  so it is present on every screen while `state.guided.on` is true. It sits in
  the bottom corner, can be minimised, and never takes focus on its own.
*/
export function GuidedDemo() {
  const { state, setGuided, setPersona } = useDemoStore()
  const navigate = useNavigate()
  const { on, step } = state.guided
  const last = guidedSteps.length - 1
  const index = Math.min(Math.max(step, 0), last)
  const current = guidedSteps[index]
  const [minimised, setMinimised] = useState(false)
  const [idleOpen, setIdleOpen] = useState(false)

  // Apply a step only when it changes, not on first render, so a reload does not move the presenter.
  const applied = useRef(`${on}:${index}`)
  useEffect(() => {
    const key = `${on}:${index}`
    if (applied.current === key) return
    applied.current = key
    if (!on) {
      setIdleOpen(false)
      return
    }
    setPersona(current.persona)
    navigate(current.route)
    setIdleOpen(Boolean(current.idle))
  }, [on, index, current, navigate, setPersona])

  if (!on) return null

  const go = (n: number) => setGuided({ on: true, step: n })

  return (
    <>
      <section
        aria-label="Guided demo"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setGuided({ on: false, step: index })
        }}
        className="fixed right-3 bottom-3 left-3 z-[60] rounded-2xl border border-ink/20 bg-white text-ink shadow-[0_24px_60px_-20px_rgb(22_24_27/0.55)] sm:left-auto sm:w-[24rem] print:hidden"
      >
        <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <p className="flex-1 font-mono text-[0.875rem] tracking-[0.08em] text-graphite uppercase">
            Guided demo · Step {index + 1} of {guidedSteps.length}
          </p>
          <button
            type="button"
            onClick={() => setMinimised((m) => !m)}
            aria-expanded={!minimised}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-mist"
          >
            {minimised ? (
              <ChevronUp className="size-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-5" aria-hidden="true" />
            )}
            <span className="sr-only">
              {minimised ? 'Show caption' : 'Minimise caption'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setGuided({ on: false, step: index })}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-mist"
          >
            <X className="size-5" aria-hidden="true" />
            <span className="sr-only">Close guided demo</span>
          </button>
        </header>

        {!minimised && (
          <div className="px-4 pt-3" aria-live="polite">
            <h2 className="text-[1.125rem] leading-snug font-medium">
              {current.title}
            </h2>
            <p className="mt-1.5 text-base leading-relaxed text-graphite">
              {current.caption}
            </p>
          </div>
        )}

        <footer className="flex items-center justify-between gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-lg border border-line px-3 text-base font-medium hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back
          </button>
          <button
            type="button"
            onClick={() =>
              index === last ? setGuided({ on: false, step: 0 }) : go(index + 1)
            }
            className="inline-flex h-10 cursor-pointer items-center gap-1 rounded-lg bg-ink px-4 text-base font-medium text-paper hover:bg-graphite"
          >
            {index === last ? 'Finish' : 'Next'}
            {index !== last && (
              <ChevronRight className="size-4" aria-hidden="true" />
            )}
          </button>
        </footer>
      </section>

      {current.idle && (
        <IdleNotice
          kind={current.idle}
          open={idleOpen}
          onStay={() => setIdleOpen(false)}
          onSignOut={() => setIdleOpen(false)}
        />
      )}
    </>
  )
}
