import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Clock3,
  FileText,
  Landmark,
  Lock,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { Wordmark } from '@/components/brand/Wordmark'
import { HeldOptionBadge } from '@/components/HeldOption'
import { Button } from '@/components/ui/button'
import { connectCopy as copy } from '@/data/copy'
import { useDemoStore } from '@/store/DemoStore'
import type { PersonaId } from '@/types/domain'
import { container } from '../parts'

const steps: {
  n: string
  icon: LucideIcon
  label: string
  title: string
  body: string
  to: string
  persona: PersonaId
  /** A held option (O2), badged "Option. Available after go-live." */
  held?: boolean
}[] = [
  {
    n: '01',
    icon: UserRound,
    ...copy.steps.cards.verify,
    to: '/journey/EO-2026-000135/invite',
    persona: 'individual',
  },
  {
    n: '02',
    icon: FileText,
    ...copy.steps.cards.submit,
    to: '/acsp/queue',
    persona: 'reviewer',
  },
  {
    n: '03',
    icon: Building2,
    ...copy.steps.cards.file,
    to: '/acsp/filings',
    persona: 'reviewer',
    held: true,
  },
]

/** Verify, submit, file: the client's three-card band. Identity verification is Route A; filings are Route B. */
export function Steps() {
  const { setPersona } = useDemoStore()
  return (
    <section
      aria-labelledby="steps-title"
      className="scroll-mt-20 bg-[#f4f4f3] pb-20"
    >
      <div className={container}>
        <div className="flex flex-col gap-3 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
          <h2
            id="steps-title"
            className="flex items-center gap-4 text-[1.0625rem] tracking-[0.24em] text-ink uppercase"
          >
            <span>
              <span className="font-semibold">{copy.steps.titleStrong}</span>{' '}
              {copy.steps.titleRest}
            </span>
            <span
              aria-hidden="true"
              className="hidden h-px w-12 bg-silver sm:block"
            />
          </h2>
          <p className="text-[0.8125rem] font-medium tracking-[0.24em] text-graphite uppercase">
            {copy.steps.subtitle}
          </p>
        </div>
        <ol className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {steps.map((s, i) => (
            <li key={s.n} className="contents">
              <Link
                to={s.to}
                onClick={() => setPersona(s.persona)}
                className="group relative flex min-h-[15rem] overflow-hidden rounded-[20px] border border-line bg-white/70 p-7 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-silver hover:shadow-[0_24px_48px_-32px_rgb(22_24_27/0.35)]"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-2 left-5 text-[7rem] leading-none font-semibold tracking-[-0.06em] text-ink/[0.06]"
                >
                  {s.n}
                </span>
                <div className="relative ml-auto flex w-[68%] flex-col">
                  <s.icon
                    className="size-9 text-ink"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  <p className="mt-5 text-[0.8125rem] font-semibold tracking-[0.24em] text-ink uppercase">
                    {s.label}
                  </p>
                  <span
                    aria-hidden="true"
                    className="mt-2 h-[3px] w-16 rounded-full bg-highlight"
                  />
                  <p className="mt-4 text-[1.375rem] leading-tight tracking-[-0.02em] text-ink">
                    {s.title}
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-graphite">
                    {s.body}
                  </p>
                  {s.held && (
                    <HeldOptionBadge code="O2" className="mt-3 w-fit" />
                  )}
                  <span className="mt-5 flex size-11 items-center justify-center self-end rounded-full border border-line text-ink transition-colors duration-150 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden items-center lg:flex"
                >
                  <ArrowRight className="size-5 text-slate" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3.5">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-3 text-base text-ink">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-white">
            <Check className="size-4" aria-hidden="true" />
          </span>
          {t}
        </li>
      ))}
    </ul>
  )
}

/** The hub: businesses and partners on one side, ACSPs on the other, Evidence One in the middle. */
export function Hub() {
  const { setPersona } = useDemoStore()
  const nodes: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: Users, ...copy.hub.nodes.acsps },
    { icon: UserRound, ...copy.hub.nodes.clients },
    { icon: Landmark, ...copy.hub.nodes.companiesHouse },
  ]
  return (
    <section
      id="for-acsps"
      aria-labelledby="hub-title"
      className="scroll-mt-20 bg-[#f4f4f3] pb-20"
    >
      <h2 id="hub-title" className="sr-only">
        {copy.hub.srTitle}
      </h2>
      <div className={container}>
        <div className="grid gap-10 rounded-[28px] border border-line bg-white/60 p-7 sm:p-10 lg:grid-cols-[1fr_1.35fr_1fr] lg:gap-8">
          <div>
            <p className="text-[0.875rem] font-semibold tracking-[0.24em] text-ink uppercase">
              {copy.hub.acsps.kicker}
            </p>
            <p className="mt-2 text-[1.375rem] tracking-[-0.02em] text-graphite">
              {copy.hub.acsps.title}
            </p>
            <span
              aria-hidden="true"
              className="mt-4 block h-px w-full bg-line"
            />
            <CheckList items={copy.hub.acsps.items} />
            <Button asChild size="lg" className="mt-8 h-13 rounded-full px-7">
              <Link to="/join/acsp" onClick={() => setPersona('reviewer')}>
                {copy.hub.acsps.cta}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-3.5 shadow-sm">
              <Building2
                className="size-7 text-ink"
                strokeWidth={1.25}
                aria-hidden="true"
              />
              <div>
                <p className="text-[0.8125rem] font-semibold tracking-[0.2em] text-ink uppercase">
                  {copy.hub.source.title}
                </p>
                <p className="text-[0.9375rem] text-graphite">
                  {copy.hub.source.body}
                </p>
              </div>
            </div>
            <ArrowDown className="my-3 size-5 text-slate" aria-hidden="true" />
            <div className="rounded-full bg-ink px-10 py-5 text-center shadow-[0_20px_40px_-20px_rgb(22_24_27/0.6)]">
              <Wordmark inverted tagline={false} className="items-center" />
              <p className="mt-1.5 text-[0.625rem] font-medium tracking-[0.32em] text-paper/70 uppercase">
                {copy.hub.motto}
              </p>
            </div>
            <div aria-hidden="true" className="mt-3 grid w-full grid-cols-3">
              {nodes.map((n) => (
                <span key={n.title} className="flex justify-center">
                  <ArrowDown className="size-5 text-slate" />
                </span>
              ))}
            </div>
            <ul className="mt-3 grid w-full grid-cols-3 gap-3">
              {nodes.map((n) => (
                <li
                  key={n.title}
                  className="flex aspect-square flex-col items-center justify-center rounded-full border border-line bg-[radial-gradient(circle_at_50%_30%,#ffffff,#eeefef)] p-3 text-center"
                >
                  <n.icon
                    className="size-7 text-ink"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-[0.75rem] font-semibold tracking-[0.14em] text-ink uppercase">
                    {n.title}
                  </p>
                  <p className="mt-1 hidden text-[0.8125rem] leading-snug text-graphite sm:block">
                    {n.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div id="for-partners" className="scroll-mt-20">
            <p className="text-[0.875rem] font-semibold tracking-[0.24em] text-ink uppercase">
              {copy.hub.partners.kicker}
            </p>
            <p className="mt-2 text-[1.375rem] tracking-[-0.02em] text-graphite">
              {copy.hub.partners.title}
            </p>
            <span
              aria-hidden="true"
              className="mt-4 block h-px w-full bg-line"
            />
            <CheckList items={copy.hub.partners.items} />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-13 rounded-full border-ink/25 px-7"
              >
                <Link to="/join/partner" onClick={() => setPersona('partner')}>
                  {copy.hub.partners.cta}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Link
                to="/partner"
                onClick={() => setPersona('partner')}
                className="text-base font-medium text-ink underline underline-offset-4"
              >
                {copy.hub.partners.portalLink}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const trust: { icon: LucideIcon; label: string }[] = [
  { icon: Lock, label: copy.trust.items.secure },
  { icon: Clock3, label: copy.trust.items.time },
  { icon: ShieldCheck, label: copy.trust.items.regulatory },
  { icon: Users, label: copy.trust.items.professionals },
  { icon: BarChart3, label: copy.trust.items.growth },
]

export function TrustStrip() {
  return (
    <section aria-label={copy.trust.label} className="bg-[#e9eaea]">
      <ul
        className={`${container} grid grid-cols-2 gap-6 py-9 sm:grid-cols-3 lg:grid-cols-5`}
      >
        {trust.map((t) => (
          <li key={t.label} className="flex items-center gap-4">
            <t.icon
              className="size-9 shrink-0 text-ink"
              strokeWidth={1.25}
              aria-hidden="true"
            />
            <span className="max-w-[9rem] text-[0.75rem] leading-snug font-medium tracking-[0.1em] text-ink uppercase sm:text-[0.8125rem] sm:tracking-[0.2em]">
              {t.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
