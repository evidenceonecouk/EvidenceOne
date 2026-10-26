import {
  ArrowRight,
  Building2,
  Compass,
  Handshake,
  LifeBuoy,
  MonitorSmartphone,
  ReceiptText,
  ScanFace,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { EyeHero } from '@/components/visual/EyeHero'
import { heroCopy } from '@/data/copy'
import { guidedSteps } from '@/features/guided/steps'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import type { PersonaId } from '@/types/domain'
import { container } from '../parts'

/** Kicker with a trailing rule, as in the client's design. */
export function RuleKicker({
  children,
  className = '',
  tone = 'light',
}: {
  children: React.ReactNode
  className?: string
  tone?: 'light' | 'dark'
}) {
  return (
    <p
      className={`flex items-center gap-4 text-[0.8125rem] font-medium tracking-[0.28em] uppercase ${tone === 'light' ? 'text-graphite' : 'text-paper/70'} ${className}`}
    >
      {children}
      <span
        aria-hidden="true"
        className={`h-px w-12 ${tone === 'light' ? 'bg-silver' : 'bg-white/30'}`}
      />
    </p>
  )
}

const facts: { icon: LucideIcon; label: string }[] = [
  { icon: MonitorSmartphone, label: heroCopy.facts[0] },
  { icon: UserCheck, label: heroCopy.facts[1] },
  { icon: ReceiptText, label: heroCopy.facts[2] },
]

/** The four entry points. "Had trouble with the GOV.UK app?" opens the B2C start page with a query flag. */
const entries: {
  icon: LucideIcon
  title: string
  hint: string
  to: string
  persona: PersonaId
  primary?: boolean
}[] = [
  {
    icon: ScanFace,
    ...heroCopy.entries.verify,
    to: '/verify',
    persona: 'b2c',
    primary: true,
  },
  {
    icon: LifeBuoy,
    ...heroCopy.entries.govuk,
    to: '/verify?from=govuk',
    persona: 'b2c',
  },
  {
    icon: Handshake,
    ...heroCopy.entries.partners,
    to: '/join/partner',
    persona: 'partner',
  },
  {
    icon: Building2,
    ...heroCopy.entries.acsps,
    to: '/join/acsp',
    persona: 'reviewer',
  },
]

const focusEye = (on: boolean) => () =>
  window.dispatchEvent(new CustomEvent('eye:focus', { detail: on }))

export function Hero() {
  const { setPersona, setGuided } = useDemoStore()

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-[#e6dbd3]"
    >
      {/* Interactive eye, full bleed on the right */}
      <div className="relative h-[22rem] sm:h-[28rem] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%]">
        <EyeHero className="absolute inset-0" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/5 bg-gradient-to-r from-[#e6dbd3] to-transparent lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#e6dbd3] to-transparent lg:hidden"
        />
      </div>

      <div
        className={`${container} relative pt-10 pb-16 lg:min-h-[46rem] lg:pt-20 lg:pb-20`}
      >
        <div className="max-w-[40rem]">
          <RuleKicker className="animate-rise">{heroCopy.kicker}</RuleKicker>
          <h1
            id="hero-title"
            className="mt-6 text-[2.5rem] leading-[1.02] font-[450] tracking-[-0.045em] text-ink sm:text-[3.25rem] lg:text-[3.5rem]"
          >
            {heroCopy.titleLines.map((line, i) => (
              <span key={line} className="reveal-line">
                <span style={{ animationDelay: `${90 * (i + 1)}ms` }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className="animate-rise mt-6 max-w-[36rem] text-[1.1875rem] leading-[1.4] text-[#4a4e54] [animation-delay:320ms] sm:text-[1.3125rem]">
            {heroCopy.lead}
          </p>

          <ul className="animate-rise mt-8 grid gap-3 [animation-delay:380ms] sm:grid-cols-2">
            {entries.map((e) => (
              <li key={e.title}>
                <Link
                  to={e.to}
                  onClick={() => setPersona(e.persona)}
                  onMouseEnter={focusEye(true)}
                  onMouseLeave={focusEye(false)}
                  onFocus={focusEye(true)}
                  onBlur={focusEye(false)}
                  className={cn(
                    'group flex h-full items-start gap-3.5 rounded-2xl border p-4 transition-[box-shadow,transform,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgb(22_24_27/0.55)]',
                    e.primary
                      ? 'border-ink bg-ink text-paper'
                      : 'border-ink/20 bg-white/85 text-ink backdrop-blur hover:bg-white',
                  )}
                >
                  <e.icon
                    className="mt-0.5 size-6 shrink-0"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1.0625rem] leading-snug font-medium">
                      {e.title}
                    </span>
                    <span
                      className={cn(
                        'mt-1 block text-base leading-snug',
                        e.primary ? 'text-paper/80' : 'text-graphite',
                      )}
                    >
                      {e.hint}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-1 size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setGuided({ on: true, step: 0 })}
            className="animate-rise mt-5 inline-flex min-h-12 items-center gap-2.5 rounded-full border border-ink/25 bg-white/85 px-5 text-[1.0625rem] font-medium text-ink backdrop-blur [animation-delay:400ms] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Compass className="size-5" strokeWidth={1.5} aria-hidden="true" />
            Guided demo, {guidedSteps.length} steps
          </button>

          <ul className="animate-rise mt-10 grid gap-x-8 gap-y-4 border-t border-ink/15 pt-6 [animation-delay:440ms] sm:grid-cols-3">
            {facts.map((f) => (
              <li key={f.label} className="flex items-start gap-3">
                <f.icon
                  className="mt-0.5 size-5 shrink-0 text-ink"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="text-base leading-snug text-graphite">
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
