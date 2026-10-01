import { ArrowDown, ArrowRight, BarChart3, Building2, Check, Clock3, FileText, Landmark, Lock, ShieldCheck, UserRound, Users, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/button'
import { useDemoStore } from '@/store/DemoStore'
import type { PersonaId } from '@/types/domain'
import { container } from '../parts'

const steps: { n: string; icon: LucideIcon; label: string; title: string; body: string; to: string; persona: PersonaId }[] = [
  { n: '01', icon: UserRound, label: 'Verify', title: 'Verify your client', body: 'Identity verification with one document and a complete audit trail.', to: '/app/EO-2026-000135/invite', persona: 'individual' },
  { n: '02', icon: FileText, label: 'Submit', title: 'Submit to Companies House', body: 'A ready-to-copy pack for GOV.UK One Login, then the Companies House verification reference recorded.', to: '/acsp/queue', persona: 'reviewer' },
  { n: '03', icon: Building2, label: 'File', title: 'File for your client', body: 'Register corrections and Companies House filings, in the same place.', to: '/acsp/filings', persona: 'reviewer' },
]

/** Verify, submit, file: the client's three-card band. Identity verification is Route A; filings are Route B. */
export function Steps() {
  const { setPersona } = useDemoStore()
  return (
    <section id="how-it-works" aria-labelledby="steps-title" className="scroll-mt-20 bg-[#f4f4f3] pb-20">
      <div className={container}>
        <div className="flex flex-col gap-3 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="steps-title" className="flex items-center gap-4 text-[1.0625rem] tracking-[0.24em] text-ink uppercase">
            <span>
              <span className="font-semibold">Verify. Submit. File.</span> One platform.
            </span>
            <span aria-hidden="true" className="hidden h-px w-12 bg-silver sm:block" />
          </h2>
          <p className="text-[0.8125rem] font-medium tracking-[0.24em] text-graphite uppercase">From verification to Companies House filings</p>
        </div>
        <ol className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {steps.map((s, i) => (
            <li key={s.n} className="contents">
              <Link
                to={s.to}
                onClick={() => setPersona(s.persona)}
                className="group relative flex min-h-[15rem] overflow-hidden rounded-[20px] border border-line bg-white/70 p-7 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-silver hover:shadow-[0_24px_48px_-32px_rgb(22_24_27/0.35)]"
              >
                <span aria-hidden="true" className="absolute top-2 left-5 text-[7rem] leading-none font-semibold tracking-[-0.06em] text-ink/[0.06]">
                  {s.n}
                </span>
                <div className="relative ml-auto flex w-[68%] flex-col">
                  <s.icon className="size-9 text-ink" strokeWidth={1.25} aria-hidden="true" />
                  <p className="mt-5 text-[0.8125rem] font-semibold tracking-[0.24em] text-ink uppercase">{s.label}</p>
                  <span aria-hidden="true" className="mt-2 h-[3px] w-16 rounded-full bg-highlight" />
                  <p className="mt-4 text-[1.375rem] leading-tight tracking-[-0.02em] text-ink">{s.title}</p>
                  <p className="mt-2 text-base leading-relaxed text-graphite">{s.body}</p>
                  <span className="mt-5 flex size-11 items-center justify-center self-end rounded-full border border-line text-ink transition-colors duration-150 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="hidden items-center lg:flex">
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

const forAcsps = ['Use Evidence One for your clients', 'Verify, submit and file', 'Secure audit trail and records', 'Grow your practice']
const forPartners = ['Find a verified ACSP', 'Complete your Companies House requirements', 'Track progress in one place', 'A simple and secure process']

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
    { icon: Users, title: 'ACSPs', body: 'Provide regulated services' },
    { icon: UserRound, title: 'Clients', body: 'Individuals and companies' },
    { icon: Landmark, title: 'Companies House', body: 'Verified and compliant filings' },
  ]
  return (
    <section id="for-acsps" aria-labelledby="hub-title" className="scroll-mt-20 bg-[#f4f4f3] pb-20">
      <h2 id="hub-title" className="sr-only">
        How Evidence One connects ACSPs, partners and Companies House
      </h2>
      <div className={container}>
        <div className="grid gap-10 rounded-[28px] border border-line bg-white/60 p-7 sm:p-10 lg:grid-cols-[1fr_1.35fr_1fr] lg:gap-8">
          <div>
            <p className="text-[0.875rem] font-semibold tracking-[0.24em] text-ink uppercase">For ACSPs</p>
            <p className="mt-2 text-[1.375rem] tracking-[-0.02em] text-graphite">Your clients. Your workflow.</p>
            <span aria-hidden="true" className="mt-4 block h-px w-full bg-line" />
            <CheckList items={forAcsps} />
            <Button asChild size="lg" className="mt-8 h-13 rounded-full px-7">
              <Link to="/acsp/queue" onClick={() => setPersona('reviewer')}>
                Join as an ACSP
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-3.5 shadow-sm">
              <Building2 className="size-7 text-ink" strokeWidth={1.25} aria-hidden="true" />
              <div>
                <p className="text-[0.8125rem] font-semibold tracking-[0.2em] text-ink uppercase">Businesses and partners</p>
                <p className="text-[0.9375rem] text-graphite">Need Companies House services</p>
              </div>
            </div>
            <ArrowDown className="my-3 size-5 text-slate" aria-hidden="true" />
            <div className="rounded-full bg-ink px-10 py-5 text-center shadow-[0_20px_40px_-20px_rgb(22_24_27/0.6)]">
              <Wordmark inverted tagline={false} className="items-center" />
              <p className="mt-1.5 text-[0.625rem] font-medium tracking-[0.32em] text-paper/70 uppercase">Connects. Coordinates. Complies.</p>
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
                <li key={n.title} className="flex aspect-square flex-col items-center justify-center rounded-full border border-line bg-[radial-gradient(circle_at_50%_30%,#ffffff,#eeefef)] p-3 text-center">
                  <n.icon className="size-7 text-ink" strokeWidth={1.25} aria-hidden="true" />
                  <p className="mt-2 text-[0.75rem] font-semibold tracking-[0.14em] text-ink uppercase">{n.title}</p>
                  <p className="mt-1 hidden text-[0.8125rem] leading-snug text-graphite sm:block">{n.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div id="for-partners" className="scroll-mt-20">
            <p className="text-[0.875rem] font-semibold tracking-[0.24em] text-ink uppercase">For partners</p>
            <p className="mt-2 text-[1.375rem] tracking-[-0.02em] text-graphite">Need an ACSP?</p>
            <span aria-hidden="true" className="mt-4 block h-px w-full bg-line" />
            <CheckList items={forPartners} />
            <Button asChild size="lg" variant="outline" className="mt-8 h-13 rounded-full border-ink/25 px-7">
              <Link to="/agent" onClick={() => setPersona('agent')}>
                Find an ACSP
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

const trust: { icon: LucideIcon; label: string }[] = [
  { icon: Lock, label: 'Secure by design' },
  { icon: Clock3, label: 'Save time, one platform' },
  { icon: ShieldCheck, label: 'Regulatory alignment' },
  { icon: Users, label: 'Trusted professionals' },
  { icon: BarChart3, label: 'Built for growth' },
]

export function TrustStrip() {
  return (
    <section aria-label="Why Evidence One" className="bg-[#e9eaea]">
      <ul className={`${container} grid grid-cols-2 gap-6 py-9 sm:grid-cols-3 lg:grid-cols-5`}>
        {trust.map((t) => (
          <li key={t.label} className="flex items-center gap-4">
            <t.icon className="size-9 shrink-0 text-ink" strokeWidth={1.25} aria-hidden="true" />
            <span className="max-w-[9rem] text-[0.75rem] leading-snug font-medium tracking-[0.1em] text-ink uppercase sm:text-[0.8125rem] sm:tracking-[0.2em]">{t.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
