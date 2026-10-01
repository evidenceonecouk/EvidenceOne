import { ArrowRight, Building2, ChevronRight, Loader2, Search, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AttributionNote } from '@/components/AttributionNote'
import { MonoLabel, Page, PageHeader, Panel } from '@/components/app/Page'
import { Stepper } from '@/components/app/Stepper'
import { Button } from '@/components/ui/button'
import { demoSearch, liveSearch, type CompanySummary } from '@/lib/companiesHouse'
import { formatMoney, VERIFICATION_FEE } from '@/lib/format'
import { cn } from '@/lib/utils'
import { createB2cCase, nextB2cAcsp, nextCaseId } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { personStatus, roleLabel } from '@/store/selectors'

const STEPS = ['Your company', 'You', 'Your ACSP']

/** A member of the public starts directly on the Evidence One website, then continues in the app. */
export function VerifyStart() {
  const { data, apply } = useDemoStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const [company, setCompany] = useState<CompanySummary | null>(null)
  const [personId, setPersonId] = useState<string | null>(null)
  const [live, setLive] = useState<CompanySummary[] | null | 'loading'>(null)
  const term = query.trim()
  const demo = useMemo(() => demoSearch(data, term).filter((c) => !data.companies.find((x) => x.number === c.number)?.lodgedByAgentId), [data, term])

  useEffect(() => {
    if (term.length < 2) return
    const ctrl = new AbortController()
    const id = window.setTimeout(async () => {
      setLive('loading')
      const r = await liveSearch(term, ctrl.signal)
      if (!ctrl.signal.aborted) setLive(r)
    }, 300)
    return () => {
      ctrl.abort()
      window.clearTimeout(id)
    }
  }, [term])

  const people = company?.source === 'demo' ? data.register.filter((r) => r.companyNumber === company.number) : []
  const acsp = nextB2cAcsp(data)

  const begin = () => {
    if (!company || !personId) return
    const caseId = nextCaseId(data)
    apply((d) => createB2cCase(d, personId, company.number, nextB2cAcsp(d).id, caseId))
    navigate(`/app/${caseId}/contact`)
  }

  return (
    <Page width="narrow">
      <PageHeader kicker="Evidence One Verify" title="Verify your identity for Companies House" description={`For directors and PSCs. One identity document, about five minutes, and a flat fee of ${formatMoney(VERIFICATION_FEE)}.`} />
      <div className="mb-8">
        <Stepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <Panel className="p-5 sm:p-7">
          <label htmlFor="b2c-search" className="text-lg font-medium text-ink">
            Which company are you a director or PSC of?
          </label>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate" aria-hidden="true" />
            <input
              id="b2c-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (e.target.value.trim().length < 2) setLive(null)
              }}
              placeholder="Company name or number"
              className="h-14 w-full rounded-xl border border-line bg-white pr-4 pl-12 text-lg text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
            />
          </div>
          {term.length < 2 && (
            <p className="mt-4 text-base text-slate">
              Try{' '}
              <button type="button" className="cursor-pointer text-ink underline underline-offset-4" onClick={() => setQuery('Kestrel')}>
                Kestrel Bay Catering
              </button>
              , a fictional company.
            </p>
          )}
          <ul className="mt-5 space-y-2">
            {[...demo, ...(Array.isArray(live) ? live.slice(0, 5) : [])].map((c) => (
              <li key={`${c.source}-${c.number}`}>
                <button
                  type="button"
                  onClick={() => {
                    setCompany(c)
                    setPersonId(null)
                    setStep(1)
                  }}
                  className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-line bg-white px-4 py-3.5 text-left transition-colors duration-150 hover:border-silver hover:bg-mist/50"
                >
                  <Building2 className="size-5 shrink-0 text-slate" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-ink">{c.name}</span>
                    <span className="block text-[0.9375rem] text-slate">
                      <span className="font-mono">{c.number}</span> · {c.source === 'demo' ? 'Fictional demo company' : 'Live register'}
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-slate" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {live === 'loading' && (
            <p className="mt-4 flex items-center gap-2 text-base text-slate" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Searching the register
            </p>
          )}
        </Panel>
      )}

      {step === 1 && company && (
        <Panel className="p-5 sm:p-7">
          <MonoLabel>{company.name}</MonoLabel>
          <h2 className="mt-2 text-lg font-medium text-ink">Which of these is you?</h2>
          {people.length === 0 ? (
            <p className="mt-4 text-base leading-relaxed text-graphite">
              This demonstration only uses fictional people, so live companies stop here. In the platform you would choose your name from the register.
            </p>
          ) : (
            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Your name on the register</legend>
              {people.map((r) => {
                const busy = personStatus(data, r.personId) !== 'not_started'
                return (
                  <label
                    key={r.personId}
                    className={cn(
                      'flex cursor-pointer items-center gap-4 rounded-xl border bg-white px-4 py-3.5 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
                      personId === r.personId ? 'border-ink shadow-[0_0_0_1px_var(--ink)]' : 'border-line',
                      busy && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <input type="radio" name="me" className="sr-only" disabled={busy} checked={personId === r.personId} onChange={() => setPersonId(r.personId)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-base text-ink">{r.registerName}</span>
                      <span className="block text-[0.9375rem] text-slate">
                        {roleLabel[r.role]} · born {r.registerDobMonthYear}
                        {busy && ' · verification already started'}
                      </span>
                    </span>
                  </label>
                )
              })}
            </fieldset>
          )}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button disabled={!personId} onClick={() => setStep(2)}>
              Continue
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </Panel>
      )}

      {step === 2 && company && personId && (
        <div className="space-y-6">
          <Panel className="p-5 sm:p-7">
            <MonoLabel>Allocated to</MonoLabel>
            <div className="mt-4 flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-paper">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xl font-medium text-ink">{acsp.name}</p>
                <p className="mt-0.5 text-[0.9375rem] text-slate">
                  {acsp.kind} · Supervised by {acsp.supervisor} · <span className="font-mono">{acsp.acspNumber}</span>
                </p>
              </div>
            </div>
            <p className="mt-5 text-base leading-relaxed text-graphite">
              Evidence One shares direct clients between its ACSPs by rota. {acsp.name} will review your evidence, make the decision and submit it to Companies House.
            </p>
            <AttributionNote acspName={acsp.name} className="mt-5" />
          </Panel>
          <Panel className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <Smartphone className="size-8 shrink-0 text-ink" strokeWidth={1.5} aria-hidden="true" />
            <div className="flex-1">
              <p className="text-lg font-medium text-ink">Continue in the Evidence One app</p>
              <p className="mt-1 text-base text-graphite">The app reads your passport chip, which a browser cannot do. We will send you a link.</p>
            </div>
            <Button size="lg" onClick={begin}>
              Open the app
              <ArrowRight aria-hidden="true" />
            </Button>
          </Panel>
        </div>
      )}
    </Page>
  )
}
