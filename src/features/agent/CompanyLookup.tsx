import { ChevronRight, Loader2, Search } from 'lucide-react'
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

  return (
    <Page width="narrow">
      <PageHeader
        kicker="Companies House"
        title="Find a company"
        description="Search the public register by company name or number. Open a company to see its directors and PSCs, then connect it to your portal."
      />

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
          placeholder="Company name or number"
          className="h-16 w-full rounded-2xl border border-line bg-white pr-5 pl-14 text-lg text-ink shadow-[0_1px_2px_rgb(22_24_27/0.04)] transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-slate focus:border-ink focus:ring-4 focus:ring-ink/10"
        />
      </form>

      {term.length < 2 ? (
        <div className="mt-10">
          <MonoLabel>Try a fictional company</MonoLabel>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((c) => (
              <button
                key={c.number}
                type="button"
                onClick={() => setQuery(c.name.split(' ')[0])}
                className="cursor-pointer rounded-full border border-line bg-white px-4 py-2 text-base text-ink transition-colors duration-150 hover:border-silver hover:bg-mist"
              >
                {c.name}
              </button>
            ))}

          </div>
          <p className="mt-6 text-base text-slate">Real company names and numbers also work, using live public data from the register.</p>
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
