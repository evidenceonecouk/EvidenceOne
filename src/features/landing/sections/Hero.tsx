import {
  ArrowRight,
  Building2,
  Handshake,
  LifeBuoy,
  ScanFace,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { PortraitHero } from '@/components/visual/PortraitHero'
import { heroCopy } from '@/data/copy'
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
  const { setPersona } = useDemoStore()

  return (
    <section
      aria-labelledby="hero-title"
      className="cursor-eyes relative overflow-hidden bg-[#171a1f]"
    >
      {/* Interactive portrait, full bleed on the right. The section matches the photo background (#171a1f) so the fade is seamless */}
      <div className="relative h-[22rem] sm:h-[28rem] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%]">
        <PortraitHero className="absolute inset-0" />
      </div>

      {/* On large screens the hero fills the viewport below the sticky header (h-20 + 1px border) */}
      <div
        className={`${container} relative pt-8 pb-12 lg:flex lg:min-h-[calc(100svh-5rem-1px)] lg:flex-col lg:justify-center lg:py-10 lg:shorter:py-6`}
      >
        <div className="max-w-[40rem]">
          <RuleKicker className="animate-rise" tone="dark">
            {heroCopy.kicker}
          </RuleKicker>
          <h1
            id="hero-title"
            className="mt-5 text-[2.5rem] leading-[1.02] font-[450] tracking-[-0.045em] text-paper sm:text-[3.25rem] lg:text-[3.5rem] lg:shorter:text-[3rem]"
          >
            {heroCopy.titleLines.map((line, i) => (
              <span key={line} className="reveal-line">
                <span style={{ animationDelay: `${90 * (i + 1)}ms` }}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <p className="animate-rise mt-4 max-w-[34rem] text-[1.125rem] leading-[1.45] text-paper/75 [animation-delay:320ms]">
            {heroCopy.lead}
          </p>

          <ul className="animate-rise mt-6 grid gap-2.5 [animation-delay:380ms] sm:grid-cols-2">
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
                    'group flex h-full items-start gap-3 rounded-xl border px-3.5 py-3 transition-[box-shadow,transform,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgb(22_24_27/0.55)]',
                    e.primary
                      ? 'border-paper bg-paper text-ink'
                      : 'border-white/20 bg-white/[0.06] text-paper backdrop-blur hover:bg-white/[0.1]',
                  )}
                >
                  <e.icon
                    className="mt-0.5 size-5 shrink-0"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base leading-snug font-medium">
                      {e.title}
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block text-base leading-snug',
                        e.primary ? 'text-graphite' : 'text-paper/70',
                      )}
                    >
                      {e.hint}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-0.5 size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
