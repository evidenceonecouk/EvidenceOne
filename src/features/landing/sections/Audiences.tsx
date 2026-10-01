import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router'
import { CompletionTick, PendingMarker } from '@/components/brand/CompletionTick'
import { PersonStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNow } from '@/hooks/useNow'
import { fullName, timeRemaining } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import { getCompany, getPerson, personStatus } from '@/store/selectors'
import type { PersonaId } from '@/types/domain'
import { SectionTitle, container } from '../parts'

const audiences: { id: string; tab: string; title: string; body: string; cta: string; to: string; persona: PersonaId }[] = [
  {
    id: 'individuals',
    tab: 'Directors and PSCs',
    title: 'Five minutes on your phone',
    body: 'Open your invite, check the details we already hold from the register, scan your passport and take a short selfie video. You can follow every step until Companies House issues your personal code.',
    cta: 'Try the app journey',
    to: '/app/EO-2026-000135/invite',
    persona: 'individual',
  },
  {
    id: 'agents',
    tab: 'Agents',
    title: 'Every client company in one view',
    body: 'Connect companies from the register, see who still needs to verify, and invite several directors at once with a pre-authorised Agent Payment Code. Agents without ACSP status refer each case to an ACSP on the platform.',
    cta: 'Open the Agent portal',
    to: '/agent',
    persona: 'agent',
  },
  {
    id: 'acsps',
    tab: 'ACSPs',
    title: 'Decide with the evidence in front of you',
    body: 'A review queue with a 36-hour SLA on every case, the identity checks, the register comparison and AI observations side by side, then a submission pack ready for GOV.UK One Login.',
    cta: 'Open the review queue',
    to: '/acsp/queue',
    persona: 'reviewer',
  },
]

export function Audiences() {
  const { setPersona } = useDemoStore()
  return (
    <section aria-labelledby="audiences-title" className="bg-white py-24 lg:py-32">
      <div className={container}>
        <SectionTitle id="audiences-title" className="mx-auto max-w-3xl text-center text-ink">
          Made for everyone in the chain
        </SectionTitle>

        <Tabs defaultValue="individuals" className="mt-14 rounded-[32px] bg-[#f3f4f5] p-4 sm:p-8">
          <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            {audiences.map((a) => (
              <TabsTrigger
                key={a.id}
                value={a.id}
                className="h-12 flex-none cursor-pointer rounded-full border border-line bg-white px-6 text-lg font-normal text-ink shadow-none transition-colors duration-150 data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-none"
              >
                {a.tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {audiences.map((a) => (
            <TabsContent key={a.id} value={a.id} className="mt-8 grid items-stretch gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex flex-col justify-end px-1 pb-2 lg:px-2">
                <h3 className="text-[2rem] leading-tight font-normal tracking-[-0.03em] text-ink sm:text-[2.5rem]">{a.title}</h3>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-graphite">{a.body}</p>
                <div className="mt-8">
                  <Button asChild size="lg" variant="outline">
                    <Link to={a.to} onClick={() => setPersona(a.persona)}>
                      {a.cta}
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex min-h-[25rem] items-center justify-center rounded-[24px] bg-[linear-gradient(140deg,#e4e7ea_0%,#c9ced3_55%,#b4bac0_100%)] p-5 sm:p-10">
                {a.id === 'individuals' && <TrackerVisual />}
                {a.id === 'agents' && <AgentVisual />}
                {a.id === 'acsps' && <QueueVisual />}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}

function VisualCard({ children }: { children: React.ReactNode }) {
  return <div className="glass w-full max-w-md rounded-[20px] p-5 shadow-[0_30px_60px_-30px_rgb(22_24_27/0.45)]">{children}</div>
}

function TrackerVisual() {
  const steps = [
    ['Details confirmed against the register', true],
    ['Passport chip read', true],
    ['Liveness and face match', true],
    ['Review by Harcourt Lane Solicitors LLP', false],
    ['Personal code issued by Companies House', false],
  ] as const
  return (
    <VisualCard>
      <p className="font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">Your verification · EO-2026-000131</p>
      <ol className="mt-4 space-y-3.5">
        {steps.map(([label, done], i) => (
          <li key={label} className="flex items-center gap-3 text-base">
            {done ? <CompletionTick /> : <PendingMarker step={i + 1} />}
            <span className={done ? 'text-ink' : 'text-slate'}>{label}</span>
          </li>
        ))}
      </ol>
    </VisualCard>
  )
}

function AgentVisual() {
  const { data } = useDemoStore()
  const company = getCompany(data, '99520316')
  const entries = data.register.filter((r) => r.companyNumber === '99520316')
  return (
    <VisualCard>
      <p className="text-base font-medium text-ink">{company?.name}</p>
      <p className="text-[0.9375rem] text-slate">{company?.number} · Lodged by Fenwick & Shaw</p>
      <ul className="mt-4 divide-y divide-line/80">
        {entries.map((e) => {
          const p = getPerson(data, e.personId)
          return (
            p && (
              <li key={e.personId} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-base text-ink">{fullName(p)}</span>
                <PersonStatusChip status={personStatus(data, e.personId)} />
              </li>
            )
          )
        })}
      </ul>
    </VisualCard>
  )
}

function QueueVisual() {
  const { data } = useDemoStore()
  const now = useNow()
  const queue = data.cases.filter((c) => c.status === 'in_review' && c.slaDueAt)
  return (
    <VisualCard>
      <p className="font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">Review queue · Harcourt Lane</p>
      <ul className="mt-3 space-y-2">
        {queue.map((c) => {
          const p = getPerson(data, c.personId)
          const t = timeRemaining(c.slaDueAt!, now)
          return (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-base font-medium text-ink">{p && fullName(p)}</span>
                <span className="block font-mono text-[0.8125rem] text-slate">
                  {c.id} · {c.origin === 'b2c' ? 'Direct client' : 'Referred by Agent'}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[0.9375rem] text-ink tabular">
                <Clock3 className="size-4" aria-hidden="true" />
                {t.label}
              </span>
            </li>
          )
        })}
      </ul>
    </VisualCard>
  )
}
