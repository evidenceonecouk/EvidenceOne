import { useMemo, useState } from 'react'
import { Check, CircleX, FlaskConical, Lock } from 'lucide-react'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { AcspStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { formatMoney, fullName } from '@/lib/format'
import {
  EXAMPLE_CRITERIA,
  matchAcsps,
  suggestAcsps,
  type MatchCriteria,
} from '@/lib/matching'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import {
  allocationState,
  casesAwaitingAllocation,
  confirmAllocation,
  criteriaForCase,
} from '@/store/platformActions'
import type { IdDocumentType, RegisterRole } from '@/types/domain'
import { AdminHeader, StateBadge } from './kit'

const LANGUAGES = [
  'English',
  'Russian',
  'Ukrainian',
  'Arabic',
  'Spanish',
  'French',
  'Italian',
  'Chinese (Simplified)',
]
const DOC_TYPES: { id: IdDocumentType; label: string }[] = [
  { id: 'passport', label: 'Passport' },
  { id: 'driving_licence', label: 'Driving licence' },
  { id: 'national_identity_card', label: 'National identity card' },
  { id: 'biometric_residence_permit', label: 'Biometric residence permit' },
]
const ROLES: { id: RegisterRole; label: string }[] = [
  { id: 'director', label: 'Director' },
  { id: 'psc', label: 'Person with significant control' },
  { id: 'director_psc', label: 'Director and PSC' },
]

const BLANK: MatchCriteria = {
  residenceCountry: 'United Kingdom',
  documentType: 'passport',
  issuingCountry: 'United Kingdom',
  role: 'director',
  languages: ['English'],
  higherRisk: false,
  needsCapacityToday: true,
}

const field =
  'mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-base text-ink focus-visible:border-ink focus-visible:ring-[3px] focus-visible:ring-ink/20 focus-visible:outline-none'

export function MatchingPage() {
  const { data, state, apply } = useDemoStore()
  const toast = useToast()
  const canAct = state.persona === 'platformAdmin'
  const [criteria, setCriteria] = useState<MatchCriteria>(BLANK)
  const results = useMemo(() => matchAcsps(data, criteria), [data, criteria])
  const waiting = casesAwaitingAllocation(data)
  const set = <K extends keyof MatchCriteria>(k: K, v: MatchCriteria[K]) =>
    setCriteria((c) => ({ ...c, [k]: v }))

  return (
    <Page>
      <AdminHeader
        kicker="Platform Administrator"
        title="Matching and allocation"
        description="Every ACSP is checked against clear criteria, and the rule ID shows why each one is eligible or not. A B2C client is suggested ACSPs, and an administrator confirms the allocation at launch."
        meta={
          <StateBadge tone="neutral">
            Matching is evaluated by rules, never by AI. Automatic allocation is
            a later phase.
          </StateBadge>
        }
      />

      {!canAct && (
        <p className="mb-6 flex items-center gap-2 rounded-2xl border border-line bg-mist/50 px-5 py-3.5 text-[0.9375rem] text-graphite">
          <Lock className="size-4 shrink-0 text-slate" aria-hidden="true" />
          Allocating is for the Platform Administrator. You can read this page.
        </p>
      )}

      <Panel aria-labelledby="wait-title" className="mb-6 overflow-hidden">
        <PanelHeader
          id="wait-title"
          title="B2C clients waiting for allocation"
          description="Ranked by clear criteria. Not AI."
          actions={<MonoLabel>{waiting.length} waiting</MonoLabel>}
        />
        {waiting.length === 0 ? (
          <p className="px-5 py-6 text-[0.9375rem] text-slate sm:px-6">
            Nothing is waiting. A direct client appears here after personal
            information, with the ACSPs suggested to them.
          </p>
        ) : (
          <ul className="divide-y divide-line/70">
            {waiting.map((c) => {
              const person = data.people.find((p) => p.id === c.personId)
              const ids = c.allocation?.suggestedAcspIds?.length
                ? c.allocation.suggestedAcspIds
                : suggestAcsps(data, criteriaForCase(data, c)).map(
                    (s) => s.acsp.id,
                  )
              const ranked = ids
                .map((id) => data.acsps.find((a) => a.id === id))
                .filter((a) => !!a)
              return (
                <li key={c.id} className="px-5 py-5 sm:px-6">
                  <p className="text-base font-medium text-ink">
                    {person ? fullName(person) : c.personId}{' '}
                    <span className="ml-2 font-mono text-[0.875rem] font-normal text-slate">
                      {c.id}
                    </span>
                  </p>
                  {c.allocation?.differentRequestedAt && (
                    <p className="text-[0.875rem] text-slate">
                      The client asked once for a different ACSP.
                    </p>
                  )}
                  {ranked.length === 0 && (
                    <p className="mt-2 text-[0.9375rem] text-slate">
                      No eligible ACSP is suggested.
                    </p>
                  )}
                  <ol className="mt-3 grid gap-3 lg:grid-cols-3">
                    {ranked.map((a, i) => {
                      const st = allocationState(a)
                      return (
                        <li
                          key={a.id}
                          className="flex flex-col rounded-xl border border-line/80 p-4"
                        >
                          <span className="font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">
                            Suggestion {i + 1}
                          </span>
                          <span className="mt-1 text-base font-medium text-ink">
                            {a.name}
                          </span>
                          <span className="mt-1 text-[0.9375rem] text-graphite">
                            Fee {formatMoney(a.profile.fee.standard)} ·
                            turnaround {a.profile.targetTurnaroundHours} hours
                          </span>
                          <span className="mt-1 text-[0.875rem] text-slate">
                            {st.reason}
                          </span>
                          <Button
                            className="mt-3 self-start"
                            size="sm"
                            disabled={!canAct || !st.open}
                            onClick={() => {
                              apply((d) => confirmAllocation(d, c.id, a.id))
                              toast({
                                title: `Allocation confirmed for ${c.id}`,
                                description: `${a.name}. Recorded on the audit trail.`,
                              })
                            }}
                          >
                            <Check className="size-4" aria-hidden="true" />
                            Confirm allocation
                          </Button>
                        </li>
                      )
                    })}
                  </ol>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <div className="grid items-start gap-6 xl:grid-cols-[22rem_1fr]">
        <Panel aria-labelledby="crit-title" className="overflow-hidden">
          <PanelHeader
            id="crit-title"
            title="Criteria"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCriteria(EXAMPLE_CRITERIA)}
              >
                <FlaskConical className="size-4" aria-hidden="true" />
                Load example
              </Button>
            }
          />
          <form
            className="space-y-4 p-5 sm:p-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <p className="text-[0.875rem] text-slate">
              Example: Ukrainian passport, resident in the UAE, English or
              Russian, capacity today, turnaround 24 hours or less.
            </p>
            <label className="block text-[0.9375rem] font-medium text-ink">
              Residence country
              <input
                className={field}
                value={criteria.residenceCountry}
                onChange={(e) => set('residenceCountry', e.target.value)}
              />
            </label>
            <label className="block text-[0.9375rem] font-medium text-ink">
              Document type
              <select
                className={field}
                value={criteria.documentType}
                onChange={(e) =>
                  set('documentType', e.target.value as IdDocumentType)
                }
              >
                {DOC_TYPES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[0.9375rem] font-medium text-ink">
              Issuing country
              <input
                className={field}
                value={criteria.issuingCountry}
                onChange={(e) => set('issuingCountry', e.target.value)}
              />
            </label>
            <label className="block text-[0.9375rem] font-medium text-ink">
              Role
              <select
                className={field}
                value={criteria.role}
                onChange={(e) => set('role', e.target.value as RegisterRole)}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="text-[0.9375rem] font-medium text-ink">
                Languages (any one)
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {LANGUAGES.map((l) => (
                  <label
                    key={l}
                    className="flex items-center gap-2 text-[0.9375rem] text-ink"
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--ink)]"
                      checked={criteria.languages.includes(l)}
                      onChange={(e) =>
                        set(
                          'languages',
                          e.target.checked
                            ? [...criteria.languages, l]
                            : criteria.languages.filter((x) => x !== l),
                        )
                      }
                    />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-[0.9375rem] text-ink">
              <input
                type="checkbox"
                className="size-4 accent-[var(--ink)]"
                checked={criteria.higherRisk}
                onChange={(e) => set('higherRisk', e.target.checked)}
              />
              Higher-risk case
            </label>
            <label className="flex items-center gap-2 text-[0.9375rem] text-ink">
              <input
                type="checkbox"
                className="size-4 accent-[var(--ink)]"
                checked={criteria.needsCapacityToday}
                onChange={(e) => set('needsCapacityToday', e.target.checked)}
              />
              Capacity left today
            </label>
            <label className="block text-[0.9375rem] font-medium text-ink">
              Maximum turnaround (hours)
              <input
                type="number"
                min={1}
                className={field}
                value={criteria.maxTurnaroundHours ?? ''}
                onChange={(e) =>
                  set(
                    'maxTurnaroundHours',
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              />
            </label>
          </form>
        </Panel>

        <Panel aria-labelledby="res-title" className="overflow-hidden">
          <PanelHeader
            id="res-title"
            title="Every ACSP, criterion by criterion"
            description={`${results.filter((r) => r.eligible).length} of ${results.length} eligible`}
          />
          <ul className="divide-y divide-line/70">
            {results.map((m) => (
              <li key={m.acsp.id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-base font-medium text-ink">
                    {m.acsp.name}
                  </span>
                  <AcspStatusChip status={m.acsp.status} />
                  <StateBadge
                    tone={m.eligible ? 'ok' : 'action'}
                    icon={m.eligible ? Check : CircleX}
                  >
                    {m.eligible ? 'Eligible' : 'Not eligible'}
                  </StateBadge>
                </div>
                {m.results.length === 0 ? (
                  <p className="mt-2 text-[0.875rem] text-slate">
                    {allocationState(m.acsp).reason}
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-line/60 rounded-xl border border-line/70">
                    {m.results.map((r) => (
                      <li
                        key={r.ruleId}
                        className="grid items-start gap-2 px-4 py-2.5 sm:grid-cols-[6rem_9rem_1fr]"
                      >
                        <span className="font-mono text-[0.8125rem] text-ink">
                          {r.ruleId}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 text-[0.9375rem] font-medium',
                            r.pass ? 'text-approve' : 'text-decline',
                          )}
                        >
                          {r.pass ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : (
                            <CircleX className="size-4" aria-hidden="true" />
                          )}
                          {r.pass ? 'Pass' : 'Fail'}
                          <span className="sr-only">, {r.label}</span>
                        </span>
                        <span className="text-[0.9375rem] text-graphite">
                          <span className="text-ink">{r.label}.</span>{' '}
                          {r.reason}
                          {r.caveat ? ` ${r.caveat}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
            Matching is evaluated by rules, never by AI. Automatic allocation is
            a later phase.
          </p>
        </Panel>
      </div>
    </Page>
  )
}
