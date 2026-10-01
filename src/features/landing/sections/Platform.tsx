import { ArrowRight, CirclePause, Lock, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { formatDate, retentionExpiry, shortHash } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { getCase } from '@/store/selectors'
import { Kicker, container } from '../parts'

const products = [
  { id: 'verify', name: 'Verify', line: 'Identity verification in the app. One document, a chip read, a liveness check and a face match.' },
  { id: 'compliance', name: 'Compliance', line: 'Review queues, exact register comparison and Route B correction tasks that unblock paused cases.' },
  { id: 'intelligence', name: 'Intelligence', line: 'Advisory AI that checks documents and flags differences. It cannot approve or decline.' },
  { id: 'file', name: 'File', line: 'An audit-ready record for seven years, with a hash-chained trail that shows any tampering.' },
] as const

type ProductId = (typeof products)[number]['id']

export function Platform() {
  const [active, setActive] = useState<ProductId>('verify')
  const refs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id.replace('product-', '') as ProductId)
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.25, 0.5] },
    )
    Object.values(refs.current).forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section aria-labelledby="platform-title" className="on-dark grain relative bg-ink text-paper">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_35%_at_85%_8%,rgb(214_219_224/0.16),transparent_70%),radial-gradient(40%_30%_at_10%_95%,rgb(255_255_255/0.06),transparent_70%)]"
      />
      <div className={`${container} relative grid gap-12 py-24 lg:grid-cols-[17rem_1fr] lg:gap-0 lg:py-32`}>
        <div className="lg:border-r lg:border-white/10 lg:pr-10">
          {/* Pinned at its resting offset: the bars above are 8.5rem tall and the section pads 8rem, so it sticks as the section reaches the header */}
          <div className="lg:sticky lg:top-[16.5rem]">
            <h2 id="platform-title" className="text-[2.25rem] leading-[1.1] font-normal tracking-[-0.03em] text-paper">
              One platform, four parts
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-paper/70">Each part does one job, and every job leaves evidence.</p>
            <nav aria-label="Platform parts" className="mt-10 hidden lg:block">
              <ol className="space-y-3">
                {products.map((p, i) => (
                  <li key={p.id}>
                    <a
                      href={`#product-${p.id}`}
                      className={cn(
                        'flex items-center gap-3 font-mono text-[0.9375rem] tracking-[0.12em] uppercase transition-colors duration-200',
                        active === p.id ? 'text-paper' : 'text-paper/60 hover:text-paper/85',
                      )}
                    >
                      <span aria-hidden="true" className={cn('size-1.5 rounded-full bg-paper transition-opacity duration-200', active === p.id ? 'opacity-100' : 'opacity-0')} />
                      0{i + 1} {p.name}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        <div className="space-y-24 lg:space-y-36 lg:pl-16">
          {products.map((p, i) => (
            <article
              key={p.id}
              id={`product-${p.id}`}
              ref={(el) => {
                refs.current[p.id] = el
              }}
              className="scroll-mt-44"
            >
              <Kicker tone="dark">0{i + 1}</Kicker>
              <h3 className="mt-3 text-[2.75rem] leading-[1.02] font-normal tracking-[-0.04em] sm:text-[4rem]">
                <span className="text-paper/45">Evidence One </span>
                <span className="text-metal">{p.name}</span>
              </h3>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-paper/75 sm:text-xl">{p.line}</p>
              <div className="mt-10">{panels[p.id]}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Glass({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('glass-dark rounded-[24px] p-5 sm:p-7', className)}>{children}</div>
}

const checkTiles = [
  ['Chip read', 'Signature valid'],
  ['Authenticity', 'Genuine document'],
  ['Liveness', 'Live person'],
  ['Face match', '98.6%'],
  ['PEP and sanctions', 'No match'],
] as const

function VerifyPanel() {
  return (
    <Glass>
      <div className="grid gap-3 sm:grid-cols-5">
        {checkTiles.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/[0.05] p-4">
            <CompletionTick />
            <p className="mt-6 text-base font-medium text-paper">{label}</p>
            <p className="mt-0.5 font-mono text-[0.8125rem] text-paper/60">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-white/10 px-5 py-4 text-base text-paper/80 sm:flex-row sm:items-center sm:justify-between">
        <span>UK passport · chip read in the app · one document was enough</span>
        <span className="font-mono text-[0.8125rem] text-paper/55">Certified identity provider · Option 1</span>
      </div>
    </Glass>
  )
}

const flow = [
  { label: 'Identity checks complete', state: 'done' },
  { label: 'Register mismatch found', state: 'flag' },
  { label: 'ACSP04 correction filed', state: 'current' },
  { label: 'Verification resumes', state: 'next' },
] as const

function CompliancePanel() {
  return (
    <Glass>
      <div className="rounded-2xl bg-paper p-5 text-ink">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-medium">Aidan Corrigan · CORRIGAN MARINE SERVICES LTD</p>
            <p className="text-[0.9375rem] text-slate">Passport chip: AIDAN · Register: AIDEN</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info-wash px-3 py-1 text-sm font-medium text-info">
            <CirclePause className="size-4" aria-hidden="true" />
            Route A paused
          </span>
        </div>
        <ol className="mt-6 grid gap-4 sm:grid-cols-4">
          {flow.map((f, i) => (
            <li key={f.label} className="relative">
              <div className="flex items-center gap-2">
                {f.state === 'done' ? (
                  <CompletionTick />
                ) : (
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                      f.state === 'flag' && 'bg-info text-white',
                      f.state === 'current' && 'bg-ink text-paper',
                      f.state === 'next' && 'border-[1.5px] border-silver text-slate',
                    )}
                  >
                    {i + 1}
                  </span>
                )}
                {i < flow.length - 1 && <span aria-hidden="true" className="hidden h-px flex-1 bg-line sm:block" />}
              </div>
              <p className="mt-3 text-[0.9375rem] leading-snug">{f.label}</p>
              <p className="mt-0.5 font-mono text-[0.75rem] tracking-[0.08em] text-slate uppercase">{i < 2 ? 'Route A' : i === 2 ? 'Route B' : 'Route A'}</p>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 text-base text-paper/70">A mismatch is never a resubmission. The register is corrected, then the verification carries on.</p>
    </Glass>
  )
}

function IntelligencePanel() {
  const observations = [
    { title: 'Council tax bill appears older than 3 months', detail: 'The issue date read from the bill is about five months before upload. Rule ADDL-11 asks for a more recent supporting document.', source: 'Council tax bill, issue date (AI extraction) · explains ADDL-11' },
    { title: 'First name spelt differently on the register', detail: 'The passport chip reads AIDAN and the register holds AIDEN. Normalisation does not remove a spelling difference, so REG-11 halts the case.', source: 'Register comparison result · explains REG-11' },
  ]
  return (
    <Glass>
      <div className="grid gap-3 lg:grid-cols-2">
        {observations.map((o) => (
          <div key={o.title} className="rounded-2xl bg-paper p-5 text-ink">
            <p className="flex items-center gap-1.5 font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">
              <Sparkles className="size-3.5" aria-hidden="true" />
              AI observation. Advisory only.
            </p>
            <p className="mt-3 text-lg font-medium">{o.title}</p>
            <p className="mt-1.5 text-base leading-relaxed text-graphite">{o.detail}</p>
            <p className="mt-3 text-[0.9375rem] text-slate">Source: {o.source}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-base text-paper/75">
        <Lock className="size-4" aria-hidden="true" />
        AI cannot approve or decline. Only an ACSP reviewer can.
      </p>
    </Glass>
  )
}

function FilePanel() {
  const { data } = useDemoStore()
  const record = getCase(data, 'EO-2026-000118')
  const events = data.audit.filter((e) => e.caseId === 'EO-2026-000118').slice(-4)
  return (
    <Glass>
      <div className="grid gap-3 lg:grid-cols-[1fr_1.35fr]">
        <div className="rounded-2xl bg-paper p-5 text-ink">
          <p className="font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">Verification statement</p>
          <p className="mt-3 text-lg font-medium">Margaret Ashby</p>
          <p className="text-[0.9375rem] text-slate">ASHBY & DAUGHTERS BAKERY LTD · Director and PSC</p>
          <p className="mt-4 text-base leading-relaxed text-graphite">
            Identity verification conducted by Harcourt Lane Solicitors LLP using the Evidence One platform.
          </p>
          {record?.decision && (
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-[0.9375rem]">
              <div>
                <dt className="text-slate">Decided</dt>
                <dd className="font-medium">{formatDate(record.decision.decidedAt)}</dd>
              </div>
              <div>
                <dt className="text-slate">Retained until</dt>
                <dd className="font-medium">{formatDate(retentionExpiry(record.decision.decidedAt))}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 p-5">
          <p className="font-mono text-[0.75rem] tracking-[0.12em] text-paper/55 uppercase">Audit trail · append only</p>
          <ol className="mt-4 space-y-4">
            {events.map((e) => (
              <li key={e.seq} className="grid grid-cols-[auto_1fr] gap-x-3">
                <span className="font-mono text-[0.8125rem] text-paper/60 tabular">#{String(e.seq).padStart(4, '0')}</span>
                <div className="min-w-0">
                  <p className="truncate text-base text-paper">{e.detail}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.8125rem] text-paper/55">
                    {shortHash(e.prevHash)}
                    <ArrowRight className="size-3" aria-label="then" />
                    <span className="text-paper/85">{shortHash(e.hash)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Glass>
  )
}

const panels: Record<ProductId, ReactNode> = {
  verify: <VerifyPanel />,
  compliance: <CompliancePanel />,
  intelligence: <IntelligencePanel />,
  file: <FilePanel />,
}
