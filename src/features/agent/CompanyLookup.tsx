import { CompanyMark } from '@/components/visual/Avatar'
import { Check, ChevronRight, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { MonoLabel, Page, PageHeader, Panel } from '@/components/app/Page'
import { demoSearch, liveSearch, type CompanySummary } from '@/lib/companiesHouse'
import { formatShortDate } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'

export function CompanyLookup() {
  const { data, state } = useDemoStore()
  const [query, setQuery] = useState('')
  const [live, setLive] = useState<CompanySummary[] | null | 'loading'>(null)
  const term = query.trim()

  const demo = useMemo(() => demoSearch(data, term), [data, term])

  useEffect(() => {
    if (term.length < 2) {
      setLive(null)
      return
    }
    const ctrl = new AbortController()
    setLive('loading')
    const id = window.setTimeout(async () => {
      const results = await liveSearch(term, ctrl.signal)
      if (!ctrl.signal.aborted) setLive(results)
    }, 300)
    return () => {
      ctrl.abort()
      window.clearTimeout(id)
    }
  }, [term])

  const suggestions = ['99804613', '99520316', '99630741'].map((n) => data.companies.find((c) => c.number === n)!).filter(Boolean)
  const connected = data.companies.filter((c) => c.lodgedByAgentId === state.agentId)
  const peopleAt = (number: string) => data.register.filter((r) => r.companyNumber === number).length

  return (
    <Page>
      <PageHeader
        kicker="Companies House"
        title="Companies House lookup"
        description="Search the public register by company name or number. Open a company to see its profile, directors, PSCs and filing deadlines, then connect it to your portal."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
            <label htmlFor="company-search" className="sr-only">
              Company name or number
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-slate" aria-hidden="true" />
            <input
              id="company-search"
              type="search"
              autoComplete="off"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Company name or number, for example 00445790"
              className="h-16 w-full rounded-2xl border border-line bg-white pr-5 pl-14 text-lg text-ink shadow-[0_1px_2px_rgb(22_24_27/0.04)] transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-slate focus:border-ink focus:ring-4 focus:ring-ink/10"
            />
          </form>

          {term.length < 2 ? (
            <div className="mt-8">
              <MonoLabel>Fictional demo companies</MonoLabel>
              <ul className="mt-3 grid gap-4 md:grid-cols-3">
                {suggestions.map((c) => {
                  const lodged = c.lodgedByAgentId
                  return (
                    <li key={c.number}>
                      <Link
                        to={`/agent/companies/${c.number}`}
                        className="group flex h-full flex-col rounded-2xl border border-line/80 bg-white p-5 shadow-[0_1px_2px_rgb(22_24_27/0.04)] transition-[border-color,box-shadow] duration-150 hover:border-silver hover:shadow-[0_4px_16px_rgb(22_24_27/0.06)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <CompanyMark name={c.name} size={44} />
                          <ChevronRight className="size-5 text-slate transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                        </div>
                        <p className="mt-4 text-base font-medium text-ink">{c.name}</p>
                        <p className="mt-1 text-[0.9375rem] text-slate">
                          <span className="font-mono tabular">{c.number}</span> · {c.registeredOffice.town}
                        </p>
                        <p className="mt-3 text-[0.9375rem] text-graphite">{c.sicDescription}</p>
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-sm">
                          <span className="rounded-full bg-mist px-2.5 py-1 text-graphite">
                            {peopleAt(c.number)} {peopleAt(c.number) === 1 ? 'person' : 'people'} on the register
                          </span>
                          {lodged && <span className="rounded-full bg-mist px-2.5 py-1 text-graphite">{lodged === state.agentId ? 'Connected' : 'Lodged by another Agent'}</span>}
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-8">
                <MonoLabel>Or search a real company</MonoLabel>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Tesco', 'Marks and Spencer', 'Rolls-Royce', 'Greggs'].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuery(q)}
                      className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-base text-ink transition-colors duration-150 hover:border-silver hover:bg-mist"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[0.9375rem] text-slate">Real companies use live public data from the register and stay read-only in this demo.</p>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {demo.length > 0 && <ResultGroup title="Fictional demo companies" results={demo} agentId={state.agentId} />}
              {live === 'loading' && (
                <p className="flex items-center gap-2 text-base text-slate" role="status">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Searching the Companies House register
                </p>
              )}
              {Array.isArray(live) && live.length > 0 && <ResultGroup title="Live from Companies House" results={live} agentId={state.agentId} />}
              {live === null && (
                <p className="rounded-2xl border border-line/80 bg-white/60 px-5 py-4 text-base text-graphite">
                  The live register search is not available right now, so only the fictional demo companies are shown.
                </p>
              )}
              {Array.isArray(live) && live.length === 0 && demo.length === 0 && <p className="text-base text-graphite">No companies match “{term}”.</p>}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Panel className="overflow-hidden">
            <div className="border-b border-line/80 px-5 py-4">
              <h2 className="text-[1.0625rem] font-medium text-ink">Your connected companies</h2>
              <p className="mt-0.5 text-[0.9375rem] text-slate">{connected.length} on your dashboard</p>
            </div>
            <ul className="divide-y divide-line/70">
              {connected.map((c) => (
                <li key={c.number}>
                  <Link to={`/agent/companies/${c.number}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-mist/60">
                    <CompanyMark name={c.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-medium text-ink">{c.name}</p>
                      <p className="font-mono text-[0.875rem] text-slate tabular">{c.number}</p>
                    </div>
                    <ChevronRight className="size-4 text-slate" aria-hidden="true" />
                  </Link>
                </li>
              ))}
              {connected.length === 0 && <li className="px-5 py-4 text-[0.9375rem] text-slate">No companies connected yet.</li>}
            </ul>
          </Panel>
          <Panel className="p-5">
            <MonoLabel>What you will see</MonoLabel>
            <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-graphite">
              {[
                'Company profile, registered office and nature of business',
                'Directors and PSCs, with identity verification shown on the register',
                'Confirmation statement and accounts deadlines',
                'Recent filing history and register indicators',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check className="mt-1 size-4 shrink-0 text-ink" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </Page>
  )
}

function ResultGroup({ title, results, agentId }: { title: string; results: CompanySummary[]; agentId: string }) {
  const { data } = useDemoStore()
  return (
    <section aria-label={title}>
      <MonoLabel>{title}</MonoLabel>
      <Panel as="div" className="mt-3 overflow-hidden">
        <ul className="divide-y divide-line/70">
          {results.map((r) => {
            const lodged = data.companies.find((c) => c.number === r.number)?.lodgedByAgentId
            return (
              <li key={`${r.source}-${r.number}`}>
                <Link
                  to={`/agent/companies/${r.number}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-mist/60 sm:px-6"
                >
                  <CompanyMark name={r.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-ink">{r.name}</p>
                    <p className="mt-0.5 text-[0.9375rem] text-slate">
                      <span className="font-mono tabular">{r.number}</span>
                      <span className="capitalize"> · {r.status}</span>
                      {r.incorporatedOn && <> · Incorporated {formatShortDate(r.incorporatedOn)}</>}
                    </p>
                    {r.address && <p className="mt-0.5 truncate text-[0.9375rem] text-slate">{r.address}</p>}
                  </div>
                  {lodged && (
                    <span className="hidden rounded-full bg-mist px-3 py-1 text-sm font-medium text-graphite sm:inline">
                      {lodged === agentId ? 'Connected' : 'Lodged by another Agent'}
                    </span>
                  )}
                  <ChevronRight className="size-5 text-slate transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      </Panel>
    </section>
  )
}
