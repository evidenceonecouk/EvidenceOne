import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { attributionText } from '@/lib/attribution'
import { useDemoStore } from '@/store/DemoStore'
import { Kicker, SectionTitle, container } from '../parts'

const numbers = [
  ['1', 'identity document is enough with a chipped passport'],
  ['36h', 'review SLA, counted down on every case'],
  ['7 yrs', 'records kept from the decision date'],
  ['£49', 'flat fee, or paid by your Agent'],
] as const

export function Numbers() {
  return (
    <section aria-label="Key figures" className="bg-white pb-24 lg:pb-32">
      <div className={container}>
        <dl className="grid border-y border-line sm:grid-cols-2 lg:grid-cols-4">
          {numbers.map(([n, label], i) => (
            <div key={n} className={`px-2 py-10 sm:px-8 ${i > 0 ? 'border-t border-line sm:border-t-0 sm:border-l' : ''} ${i === 2 ? 'sm:border-l-0 lg:border-l' : ''} ${i >= 2 ? 'sm:border-t lg:border-t-0' : ''}`}>
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block text-[4.5rem] leading-none font-light tracking-[-0.05em] text-ink tabular lg:text-[5.5rem]">{n}</span>
                <span className="mt-4 block max-w-[16rem] text-lg leading-snug text-graphite">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const standards = [
  ['Option 1', 'Certified IDVT', 'Digital verification is the default. A trained human check is a fallback only.'],
  ['Chip', 'Passport NFC read', 'Read in the app, where a browser cannot reach the chip.'],
  ['Screening', 'PEP and sanctions', 'Every person screened, every result shown to the reviewer.'],
  ['Register', 'Exact match', 'Name and date of birth compared with Companies House.'],
  ['Route B', 'ACSP04 corrections', 'Mismatches corrected on the register, never resubmitted.'],
  ['Submission', 'One Login handoff', 'A ready-to-copy pack, then the personal code recorded.'],
  ['Retention', 'Seven years', 'Counted from the decision. Failed attempts kept too.'],
  ['Access', 'WCAG 2.2 AA', 'Large type, strong contrast and full keyboard use.'],
] as const

export function Standards() {
  return (
    <section aria-labelledby="standards-title" className="bg-white pb-24 lg:pb-32">
      <div className={container}>
        <SectionTitle id="standards-title" className="mx-auto max-w-3xl text-center text-ink">
          Designed around the rules that matter
        </SectionTitle>
        <p className="mx-auto mt-5 max-w-xl text-center text-lg text-graphite">
          Built to the Companies House identity verification standard, with every rule visible to the reviewer.
        </p>
        <ul className="mt-14 grid overflow-hidden rounded-[28px] border border-line sm:grid-cols-2 lg:grid-cols-4">
          {standards.map(([kicker, title, body]) => (
            <li key={title} className="-mt-px -ml-px flex min-h-[15rem] flex-col border-t border-l border-line p-7">
              <Kicker>{kicker}</Kicker>
              <p className="mt-auto text-[1.625rem] leading-tight font-normal tracking-[-0.02em] text-ink">{title}</p>
              <p className="mt-2 text-base leading-relaxed text-graphite">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function ClosingCta() {
  const { setPersona } = useDemoStore()
  return (
    <section aria-labelledby="closing-title" className="bg-white pb-6">
      <div className={container}>
        <div className="on-dark grain relative overflow-hidden rounded-[32px] bg-ink px-6 py-20 text-center text-paper sm:px-12 lg:py-28">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgb(214_219_224/0.22),transparent_70%)]"
          />
          <div className="relative">
            <SectionTitle id="closing-title" className="mx-auto max-w-3xl text-paper">
              See every step, end to end
            </SectionTitle>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-paper/75">
              Switch between the Agent, the individual and the ACSP reviewer from the bar at the top of the screen.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="inverse" className="w-full sm:w-auto">
                <Link to="/agent" onClick={() => setPersona('agent')}>
                  Start with the Agent portal
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="w-full text-paper hover:bg-white/10 sm:w-auto">
                <Link to="/verify" onClick={() => setPersona('b2c')}>
                  Verify my identity
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const footerLinks: { heading: string; links: [string, string][] }[] = [
  { heading: 'Platform', links: [['Verify', '/app/EO-2026-000135/invite'], ['Compliance', '/acsp/queue'], ['File', '/records/EO-2026-000118'], ['Admin', '/admin']] },
  { heading: 'For', links: [['Directors and PSCs', '/verify'], ['Agents', '/agent'], ['ACSPs', '/acsp/queue']] },
]

export function Footer() {
  return (
    <footer className="bg-white">
      <div className={`${container} grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr]`}>
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-graphite">Clarity creates confidence.</p>
          <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-slate">{attributionText()}</p>
        </div>
        {footerLinks.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <Kicker>{col.heading}</Kicker>
            <ul className="mt-5 space-y-3">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-lg text-ink underline-offset-4 hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={`${container} flex flex-col gap-2 border-t border-line py-8 text-[0.9375rem] text-slate sm:flex-row sm:justify-between`}>
        <p>Demonstration prototype. Every person, company and document shown is fictional.</p>
        <p>Not affiliated with Companies House or GOV.UK.</p>
      </div>
    </footer>
  )
}
