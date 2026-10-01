import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Camera,
  FileCheck2,
  Fingerprint,
  Landmark,
  Link2,
  Lock,
  Nfc,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'
import { AttributionNote } from '@/components/AttributionNote'
import { CompletionTick, PendingMarker } from '@/components/brand/CompletionTick'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { formatMoney, VERIFICATION_FEE } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'

export function LandingPage() {
  return (
    <>
      <Hero />
      <OneDocument />
      <EntryPoints />
      <Principles />
      <Footer />
    </>
  )
}

function Hero() {
  const { setPersona } = useDemoStore()
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_10%,rgb(255_255_255/0.9),transparent_60%),radial-gradient(40rem_28rem_at_10%_90%,rgb(168_174_180/0.35),transparent_65%)]"
      />
      <div className="relative mx-auto grid max-w-[88rem] items-center gap-14 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-paper/70 px-3.5 py-1.5 text-[0.9375rem] font-medium text-graphite">
            <Landmark className="size-4" aria-hidden="true" />
            Companies House identity verification
          </p>
          <h1 id="hero-title" className="text-[2.75rem] leading-[1.04] font-normal tracking-[-0.04em] text-ink sm:text-6xl lg:text-[4.5rem]">
            One identity.
            <br />
            One record.
            <br />
            <span className="text-slate">Proof that lasts.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-graphite sm:text-xl">
            Evidence One prepares, evidences and records identity verification for company directors and people with
            significant control. The decision is always made by an Authorised Corporate Service Provider.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/verify" onClick={() => setPersona('b2c')}>
                Verify my identity
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#professionals">For professionals</a>
            </Button>
          </div>
          <p className="mt-6 text-base text-slate">
            Flat fee of {formatMoney(VERIFICATION_FEE)}, or free to you with an Agent Payment Code.
          </p>
        </div>
        <HeroVisual />
      </div>
    </section>
  )
}

const heroSteps = [
  { label: 'Details confirmed against the register', done: true },
  { label: 'Passport chip read in the app', done: true },
  { label: 'Liveness and face match', done: true },
  { label: 'Review by Harcourt Lane Solicitors LLP', done: false },
  { label: 'Submitted to Companies House', done: false },
]

function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-lg select-none sm:mb-16 lg:mr-0">
      {/* Back layer: register association */}
      <div className="glass absolute -top-2 -left-10 hidden w-[78%] rotate-[-3deg] rounded-3xl p-5 pb-12 shadow-[0_20px_50px_-30px_rgb(22_24_27/0.35)] sm:block">
        <p className="text-sm font-medium tracking-wide text-slate uppercase">Companies House register</p>
        <p className="mt-2 text-lg font-medium text-ink">LUMENFIELD TECHNOLOGIES LTD</p>
        <p className="text-base text-slate">99520316 · Director and PSC</p>
      </div>

      {/* Front layer: the verification tracker */}
      <div className="relative rounded-3xl border border-line bg-paper p-6 sm:mt-28 shadow-[0_40px_80px_-40px_rgb(22_24_27/0.45)] sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-slate uppercase">Your verification</p>
            <p className="mt-1 text-xl font-medium text-ink">Priya Raman</p>
          </div>
          <span className="rounded-full border border-line bg-mist px-3 py-1 text-sm font-medium text-graphite tabular">EO-2026-000131</span>
        </div>
        <ol className="mt-6 space-y-3.5">
          {heroSteps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-3">
              {s.done ? <CompletionTick /> : <PendingMarker step={i + 1} />}
              <span className={s.done ? 'text-base text-ink' : 'text-base text-slate'}>{s.label}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-2xl bg-mist p-4 text-[0.9375rem] leading-relaxed text-graphite">
          Your identity verification is being conducted by Harcourt Lane Solicitors LLP using the Evidence One platform.
        </div>
      </div>

      {/* Floating layer: advisory AI observation */}
      <div className="glass absolute -right-8 -bottom-20 hidden w-64 rounded-2xl p-4 shadow-[0_24px_50px_-28px_rgb(22_24_27/0.45)] sm:block">
        <p className="flex items-center gap-1.5 text-sm font-medium text-graphite">
          <Sparkles className="size-4" />
          AI observation · Advisory only
        </p>
        <p className="mt-1.5 text-[0.9375rem] leading-snug text-ink">Name and date of birth match the register.</p>
      </div>
    </div>
  )
}

const oneDocSteps: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Nfc, title: 'Scan your passport chip', body: 'Hold your passport to your phone. The app reads the chip, the strongest evidence the standard asks for.' },
  { icon: Camera, title: 'Take a short selfie video', body: 'A liveness check and a face match against the photo held on the chip.' },
  { icon: BadgeCheck, title: 'An ACSP reviews and submits', body: 'A qualified person reviews the evidence, makes the decision and submits it to Companies House.' },
]

function OneDocument() {
  return (
    <section id="how-it-works" aria-labelledby="one-doc-title" className="scroll-mt-20 border-y border-line bg-paper">
      <div className="mx-auto max-w-[88rem] px-4 py-20 sm:px-6 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="text-[0.9375rem] font-medium tracking-wide text-slate uppercase">How it works</p>
            <h2 id="one-doc-title" className="mt-3 text-4xl leading-tight font-normal tracking-[-0.03em] text-ink sm:text-5xl">
              Verify with just one identity document.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-graphite">
              With a chipped passport or another qualifying photo ID, one document is enough. We only ask for proof of
              address if it is needed, and then only as supporting evidence.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {oneDocSteps.map((s, i) => (
              <li key={s.title} className="flex flex-col rounded-3xl border border-line bg-canvas/60 p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-ink text-paper">
                    <s.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-slate tabular">Step {i + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-medium text-ink">{s.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-graphite">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function EntryPoints() {
  const { setPersona } = useDemoStore()
  return (
    <section id="professionals" aria-labelledby="entry-title" className="scroll-mt-20">
      <div className="mx-auto max-w-[88rem] px-4 py-20 sm:px-6 lg:py-24">
        <h2 id="entry-title" className="max-w-2xl text-4xl leading-tight font-normal tracking-[-0.03em] text-ink sm:text-5xl">
          Two ways in. One standard of evidence.
        </h2>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="flex flex-col rounded-3xl border border-line bg-paper p-7 sm:p-9">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-mist text-ink">
              <ScanFace className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-2xl font-medium text-ink">Verify my identity</h3>
            <p className="mt-3 text-lg leading-relaxed text-graphite">
              For directors and PSCs who come to us directly. We allocate your verification to one of our ACSPs, who
              reviews it and submits it to Companies House for you.
            </p>
            <ul className="mt-6 space-y-2.5 text-base text-graphite">
              <Bullet icon={Fingerprint}>One identity document with a chip read in the app</Bullet>
              <Bullet icon={Lock}>Flat fee of {formatMoney(VERIFICATION_FEE)}, paid securely by card</Bullet>
              <Bullet icon={FileCheck2}>A clear tracker until your personal code is issued</Bullet>
            </ul>
            <div className="mt-auto pt-8">
              <Button asChild size="lg">
                <Link to="/verify" onClick={() => setPersona('b2c')}>
                  Start my verification
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </article>

          <article className="flex flex-col rounded-3xl bg-ink p-7 text-paper sm:p-9 on-dark">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 text-paper">
              <Briefcase className="size-6" aria-hidden="true" />
            </span>
            <h3 className="mt-6 text-2xl font-medium">For professionals</h3>
            <p className="mt-3 text-lg leading-relaxed text-paper/80">
              For Agents who bring client companies, and for ACSPs who review and decide. Agents with ACSP status can
              decide themselves or refer. Agents without ACSP status refer to an ACSP on the platform.
            </p>
            <ul className="mt-6 space-y-2.5 text-base text-paper/85">
              <Bullet icon={Link2}>Connect companies straight from the Companies House register</Bullet>
              <Bullet icon={Users}>Bulk invites pre-filled from the register, with Agent Payment Codes</Bullet>
              <Bullet icon={Building2}>Review queue with SLA timers, AI observations and a submission pack</Bullet>
            </ul>
            <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
              <Button asChild size="lg" variant="inverse">
                <Link to="/agent" onClick={() => setPersona('agent')}>
                  Agent portal
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-paper hover:bg-white/10">
                <Link to="/acsp/queue" onClick={() => setPersona('reviewer')}>
                  ACSP review queue
                </Link>
              </Button>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function Bullet({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

const family = [
  { name: 'Verify', body: 'Identity verification in the app, with a passport chip read, liveness and face match.' },
  { name: 'Compliance', body: 'Rules, review queues, register comparison and Companies House correction tasks.' },
  { name: 'Intelligence', body: 'Advisory AI that checks documents and flags differences. It never approves or declines.' },
  { name: 'File', body: 'An audit-ready verification record, kept for seven years with a hash-chained trail.' },
]

const principles: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Users, title: 'The decision is human', body: 'Only an ACSP reviewer can approve, request information or decline.' },
  { icon: Sparkles, title: 'AI is advisory only', body: 'Observations are labelled as such and always cite their source.' },
  { icon: ShieldCheck, title: 'Exact register match', body: 'Any difference pauses the verification and opens a correction, never a resubmission.' },
  { icon: Lock, title: 'Records that last', body: 'Kept for seven years from the decision, including failed and abandoned attempts.' },
]

function Principles() {
  return (
    <section aria-labelledby="principles-title" className="on-dark relative overflow-hidden bg-ink text-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_30rem_at_90%_0%,rgb(168_174_180/0.18),transparent_60%),radial-gradient(40rem_24rem_at_0%_100%,rgb(255_255_255/0.06),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-[88rem] px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 id="principles-title" className="text-4xl leading-tight font-normal tracking-[-0.03em] sm:text-5xl">
              Clarity creates confidence.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-paper/75">
              Every screen is built to show what was checked, by whom, and on what evidence. Evidence One prepares,
              evidences and records. It does not make verification decisions.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {family.map((f) => (
              <div key={f.name} className="glass-dark rounded-2xl p-6">
                <p className="text-xl font-medium">
                  <span className="text-paper/60">Evidence One </span>
                  {f.name}
                </p>
                <p className="mt-2 text-base leading-relaxed text-paper/75">{f.body}</p>
              </div>
            ))}
          </div>
        </div>

        <ul className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p) => (
            <li key={p.title} className="bg-ink p-6">
              <p.icon className="size-6 text-paper/80" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium">{p.title}</h3>
              <p className="mt-1.5 text-base leading-relaxed text-paper/70">{p.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-2xl border border-white/12 p-6">
          <AttributionNote tone="dark" />
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 text-base text-slate">One identity. One record. Proof that lasts.</p>
        </div>
        <div className="max-w-xl text-[0.9375rem] leading-relaxed text-slate md:text-right">
          <p>Demonstration prototype. Every person, company and document shown is fictional.</p>
          <p className="mt-1">Evidence One is not affiliated with Companies House or GOV.UK.</p>
        </div>
      </div>
    </footer>
  )
}
