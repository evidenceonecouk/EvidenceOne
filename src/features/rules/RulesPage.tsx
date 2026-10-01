import { ArrowRight, Clock3, FileDiff, GitBranch, History, Lock, Pencil, Search, Send, ShieldCheck, Sparkles, Trash2, Undo2, UserCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { HeroBanner, Page, Panel, PanelHeader } from '@/components/app/Page'
import { SidePanel } from '@/components/app/SidePanel'
import { useToast } from '@/components/app/Toaster'
import { OutcomeChip, RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { paramDefs, ruleById, ruleGroups, rules, RULE_SET_NAME, SECOND_APPROVER, settingDefs, sourceNames, SUPER_ADMIN, type RuleDef, type RuleGroupId } from '@/data/rules'
import { CopilotPanel } from '@/features/copilot/CopilotPanel'
import { formatDate, formatDateTime, fullName } from '@/lib/format'
import { casesAffectedBy, currentRuleSet, draftRuleSet, outcomeUnder } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { versionChanges } from '@/lib/versionDiff'
import { discardDraft, proposeRuleChange, publishDraft, returnDraft, submitDraft } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import type { ParamKey, RuleOutcome, RuleSetStatus, RuleSettings, RuleSetVersion, SettingKey } from '@/types/domain'

const OUTCOMES: RuleOutcome[] = ['pass', 'flag', 'mandatory', 'request', 'halt', 'block']
const statusLabel: Record<RuleSetStatus, string> = { current: 'Current', draft: 'Draft', pending_approval: 'Waiting for second approver', superseded: 'Superseded' }

/**
  The Route A rule set. Reviewers read it; an administrator proposes changes,
  which always create a new draft version; a second approver publishes it.
*/
export function RulesPage() {
  const { data, state } = useDemoStore()
  const [copilot, setCopilot] = useState(false)
  const [openRule, setOpenRule] = useState<RuleDef | null>(null)
  const persona = state.persona
  const canPropose = persona === 'admin'
  const current = currentRuleSet(data)
  const draft = draftRuleSet(data)

  return (
    <div className={cn('transition-[padding] duration-300 ease-out', copilot && 'xl:pr-[27rem]')}>
      <Page>
        <HeroBanner
          kicker="Evidence One Compliance · Rules"
          title="Route A rule set"
          description={`${RULE_SET_NAME}. Every rule is data: an ID, a condition, one outcome and its source. No rule declines a case; only the ACSP reviewer approves or declines.`}
          meta={
            <>
              <span data-cite={`version:${current.version}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 font-mono text-[0.875rem] text-ink">
                <GitBranch className="size-4" aria-hidden="true" />
                Version {current.version}
              </span>
              <StatusPill status="current" />
              {current.effectiveFrom && <span className="rounded-full border border-line bg-white px-3 py-1 text-[0.875rem] text-graphite">Effective {formatDate(current.effectiveFrom)}</span>}
              <span className="rounded-full border border-line bg-white px-3 py-1 text-[0.875rem] text-graphite">
                {rules.length} rules · {paramDefs.length} parameters
              </span>
            </>
          }
          actions={
            <Button variant={copilot ? 'default' : 'outline'} onClick={() => setCopilot((o) => !o)} aria-expanded={copilot} aria-controls="copilot-panel">
              <Sparkles aria-hidden="true" />
              Ask the Copilot
            </Button>
          }
        />

        <RoleNotice persona={persona} />
        {draft && <DraftPanel draft={draft} current={current} />}

        <nav aria-label="On this page" className="mb-6 flex flex-wrap gap-2">
          {[
            ['#rules-list', 'Rules'],
            ['#rules-params', 'Parameters'],
            ['#rules-settings', 'Decision settings'],
            ['#rules-history', 'Version history'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-line bg-white px-4 py-2 text-[0.9375rem] text-ink hover:border-silver">
              {label}
            </a>
          ))}
        </nav>

        <div className="space-y-6">
          <RulesList onOpen={setOpenRule} />
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <ParamsPanel canEdit={canPropose && draft?.status !== 'pending_approval'} />
            <SettingsPanel canEdit={canPropose && draft?.status !== 'pending_approval'} />
          </div>
          <HistoryPanel />
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-center text-[0.9375rem] text-graphite">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Rules are evaluated the same way every time. No rule is ever evaluated by AI.
        </p>

        <RuleDetail rule={openRule} onClose={() => setOpenRule(null)} />
      </Page>
      <CopilotPanel open={copilot} onClose={() => setCopilot(false)} scope={{ kind: 'rules' }} />
    </div>
  )
}

function StatusPill({ status }: { status: RuleSetStatus }) {
  const tone = status === 'current' ? 'border-approve/25 bg-approve-wash text-approve' : status === 'superseded' ? 'border-line bg-mist text-graphite' : 'border-info/25 bg-info-wash text-info'
  return <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[0.875rem] font-medium whitespace-nowrap', tone)}>{statusLabel[status]}</span>
}

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-highlight-wash px-2 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap text-ink">
      <Clock3 className="size-3.5" aria-hidden="true" />
      Pending your decision
    </span>
  )
}

function RoleNotice({ persona }: { persona: string }) {
  const text =
    persona === 'admin'
      ? 'You can propose changes to parameters and decision settings. A change never edits the current version: it creates a draft, which a second approver must publish.'
      : persona === 'admin2'
        ? 'You are the second approver. Review the proposed version and publish it with an effective date, or return it. You cannot publish a change you proposed.'
        : 'Read only. Changes are proposed by an administrator and published by a second approver. Decided cases keep the version applied at their decision.'
  const Icon = persona === 'admin' ? Pencil : persona === 'admin2' ? UserCheck : Lock
  return (
    <p className="mb-6 flex items-start gap-3 rounded-2xl border border-line bg-white px-5 py-4 text-[0.9375rem] leading-relaxed text-graphite">
      <Icon className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden="true" />
      {text}
    </p>
  )
}

function DraftPanel({ draft, current }: { draft: RuleSetVersion; current: RuleSetVersion }) {
  const { state, apply, setPersona } = useDemoStore()
  const toast = useToast()
  const [effective, setEffective] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const changes = versionChanges(current, draft)
  const persona = state.persona
  const pending = draft.status === 'pending_approval'

  return (
    <Panel aria-labelledby="draft-title" className="mb-6 overflow-hidden border-info/30">
      <PanelHeader
        id="draft-title"
        title={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            <FileDiff className="size-5" aria-hidden="true" />
            Draft version <span className="font-mono">{draft.version}</span>
            <StatusPill status={draft.status} />
          </span>
        }
        description={`Created by ${draft.createdBy} ${formatDateTime(draft.createdAt)} from version ${current.version}, which stays unchanged.`}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left">
          <caption className="sr-only">What changes in draft {draft.version}</caption>
          <thead className="bg-mist/50 text-[0.875rem] text-slate">
            <tr>
              <th scope="col" className="py-2.5 pr-4 pl-5 font-normal sm:pl-6">
                What changes
              </th>
              <th scope="col" className="py-2.5 pr-4 font-normal">
                Version {current.version}
              </th>
              <th scope="col" className="py-2.5 pr-6 font-normal">
                Draft {draft.version}
              </th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c) => (
              <tr key={c.key} className="border-t border-line/70">
                <td className="py-3.5 pr-4 pl-5 text-[0.9375rem] text-ink sm:pl-6">
                  {c.label}
                  <span className="block font-mono text-[0.8125rem] text-slate">{c.key}</span>
                </td>
                <td className="py-3.5 pr-4">
                  <span className="rounded-md bg-decline-wash px-2 py-1 font-mono text-[0.875rem] text-decline line-through decoration-decline/50">{c.from}</span>
                </td>
                <td className="py-3.5 pr-6">
                  <span className="rounded-md bg-approve-wash px-2 py-1 font-mono text-[0.875rem] text-approve">{c.to}</span>
                </td>
              </tr>
            ))}
            {changes.length === 0 && (
              <tr className="border-t border-line/70">
                <td colSpan={3} className="px-6 py-4 text-[0.9375rem] text-slate">
                  No differences yet. Change a parameter or decision setting below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line/80 bg-mist/30 px-5 py-4 sm:px-6">
        {persona === 'admin' && !pending && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              disabled={!changes.length}
              onClick={() => {
                apply((d) => submitDraft(d, SUPER_ADMIN))
                toast({ title: `Draft ${draft.version} submitted`, description: 'A second approver must review and publish it.' })
              }}
            >
              <Send aria-hidden="true" />
              Submit for approval
            </Button>
            <Button variant="ghost" onClick={() => apply((d) => discardDraft(d, SUPER_ADMIN))}>
              <Trash2 aria-hidden="true" />
              Discard draft
            </Button>
          </div>
        )}
        {persona === 'admin' && pending && (
          <div className="flex flex-wrap items-center gap-4">
            <p className="flex-1 text-[0.9375rem] text-graphite">Submitted {draft.submittedAt && formatDateTime(draft.submittedAt)}. You cannot publish your own change. A second approver must review it.</p>
            <Button onClick={() => setPersona('admin2')}>
              <UserCheck aria-hidden="true" />
              Switch to Admin (second approver)
            </Button>
          </div>
        )}
        {persona === 'admin2' && pending && (
          <div className="space-y-4">
            <p className="text-[0.9375rem] text-graphite">
              Proposed by {draft.submittedBy}. Reviewing as {SECOND_APPROVER}.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="effective" className="block text-[0.9375rem] font-medium text-ink">
                  Effective date
                </label>
                <input id="effective" type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className="mt-1.5 h-11 rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10" />
              </div>
              <Button
                disabled={!effective || draft.submittedBy === SECOND_APPROVER}
                onClick={() => {
                  const at = new Date(`${effective}T${new Date().toISOString().slice(11)}`).toISOString()
                  apply((d) => publishDraft(d, at, SECOND_APPROVER))
                  toast({ title: `Version ${draft.version} published`, description: `Version ${current.version} is now superseded. New cases use ${draft.version}.` })
                }}
              >
                <ShieldCheck aria-hidden="true" />
                Approve and publish
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-3 border-t border-line/70 pt-4">
              <div className="min-w-[16rem] flex-1">
                <label htmlFor="return-note" className="block text-[0.9375rem] font-medium text-ink">
                  Or return it with a note
                </label>
                <input id="return-note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10" />
              </div>
              <Button variant="outline" disabled={!note.trim()} onClick={() => apply((d) => returnDraft(d, SECOND_APPROVER, note.trim()))}>
                <Undo2 aria-hidden="true" />
                Return to draft
              </Button>
            </div>
          </div>
        )}
        {persona === 'admin2' && !pending && <p className="text-[0.9375rem] text-graphite">The administrator has not submitted this draft yet.</p>}
        {persona !== 'admin' && persona !== 'admin2' && <p className="text-[0.9375rem] text-graphite">{pending ? 'Waiting for the second approver.' : 'Being prepared by an administrator.'} Cases keep using version {current.version} until a new version is published.</p>}
      </div>
    </Panel>
  )
}

function RulesList({ onOpen }: { onOpen: (r: RuleDef) => void }) {
  const { data } = useDemoStore()
  const rs = currentRuleSet(data)
  const [group, setGroup] = useState<RuleGroupId | 'all'>('all')
  const [outcomes, setOutcomes] = useState<RuleOutcome[]>([])
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = rules.filter((r) => (group === 'all' || r.group === group) && (!outcomes.length || outcomes.includes(outcomeUnder(r.id, rs))) && (!q || r.id.toLowerCase().includes(q) || r.condition.toLowerCase().includes(q) || r.source.toLowerCase().includes(q)))

  return (
    <Panel id="rules-list" aria-labelledby="rules-title" className="scroll-mt-40 overflow-hidden">
      <PanelHeader id="rules-title" title="Rules" description={`${shown.length} of ${rules.length} shown. Open a rule for its full detail and the cases it has affected.`} />
      <div className="flex flex-col gap-3 border-b border-line/80 px-5 py-4 sm:px-6 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate" aria-hidden="true" />
          <label htmlFor="rule-search" className="sr-only">
            Search by ID or text
          </label>
          <input id="rule-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by ID or text" className="h-11 w-full rounded-xl border border-line bg-white pr-3 pl-10 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10" />
        </div>
        <label htmlFor="rule-group" className="sr-only">
          Group
        </label>
        <select id="rule-group" value={group} onChange={(e) => setGroup(e.target.value as RuleGroupId | 'all')} className="h-11 rounded-xl border border-line bg-white px-3 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10">
          <option value="all">All groups</option>
          {ruleGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <div role="group" aria-label="Filter by outcome" className="flex flex-wrap gap-1.5">
          {OUTCOMES.map((o) => {
            const on = outcomes.includes(o)
            return (
              <button key={o} type="button" aria-pressed={on} onClick={() => setOutcomes((xs) => (on ? xs.filter((x) => x !== o) : [...xs, o]))} className={cn('cursor-pointer rounded-full border p-0.5 transition-colors duration-150', on ? 'border-ink bg-ink/5' : 'border-transparent hover:border-line')}>
                <OutcomeChip outcome={o} />
              </button>
            )
          })}
        </div>
      </div>
      {ruleGroups
        .filter((g) => shown.some((r) => r.group === g.id))
        .map((g) => (
          <section key={g.id} aria-labelledby={`grp-${g.id}`}>
            <h3 id={`grp-${g.id}`} className="border-b border-line/70 bg-[#f8f8f7] px-5 py-2.5 text-[0.875rem] font-medium tracking-[0.04em] text-slate uppercase sm:px-6">
              {g.label}
            </h3>
            <ul className="divide-y divide-line/70">
              {shown
                .filter((r) => r.group === g.id)
                .map((r) => (
                  <li key={r.id} data-cite={`rule:${r.id}`}>
                    <button type="button" onClick={() => onOpen(r)} className="group grid w-full cursor-pointer grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1.5 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-mist/40 sm:px-6 lg:grid-cols-[6.5rem_minmax(0,1fr)_11rem_14rem_1.25rem]">
                      <RuleIdTag id={r.id} className="w-fit" />
                      <span className="text-[0.9375rem] leading-snug text-ink">
                        {r.condition}
                        {r.param && <span className="mt-0.5 block font-mono text-[0.8125rem] text-slate">Reads {r.param} = {rs.params[r.param]}</span>}
                        {r.setting && <span className="mt-0.5 block text-[0.8125rem] text-slate">Set by: {settingDefs.find((s) => s.key === r.setting)?.label}</span>}
                      </span>
                      <span className="col-start-2 lg:col-start-auto">
                        <OutcomeChip outcome={outcomeUnder(r.id, rs)} />
                      </span>
                      <span className="col-start-2 text-[0.875rem] text-slate lg:col-start-auto">{r.source}</span>
                      <ArrowRight className="hidden size-4 text-slate transition-transform duration-150 group-hover:translate-x-0.5 lg:block" aria-hidden="true" />
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      {shown.length === 0 && <p className="px-6 py-8 text-center text-base text-slate">No rules match these filters.</p>}
    </Panel>
  )
}

function RuleDetail({ rule, onClose }: { rule: RuleDef | null; onClose: () => void }) {
  const { data, state } = useDemoStore()
  const rs = currentRuleSet(data)
  const affected = useMemo(() => (rule ? casesAffectedBy(data, rule.id) : []), [data, rule])
  const def = rule ? ruleById(rule.id) : undefined
  const nonPass = affected.filter((a) => a.result.outcome !== 'pass')
  return (
    <SidePanel open={!!rule} onClose={onClose} title={def ? <span className="flex items-center gap-2.5"><RuleIdTag id={def.id} className="text-[0.9375rem]" />{ruleGroups.find((g) => g.id === def.group)?.label}</span> : ''} description={def ? `Version ${rs.version}` : undefined}>
      {def && (
        <div className="space-y-6 p-6">
          <div>
            <p className="text-[0.875rem] text-slate">Condition</p>
            <p className="mt-1 text-lg leading-relaxed text-ink">{def.condition}</p>
          </div>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-[0.875rem] text-slate">Outcome</dt>
              <dd className="mt-1">
                <OutcomeChip outcome={outcomeUnder(def.id, rs)} />
                {def.outcomeNote && <span className="mt-1 block text-[0.9375rem] text-graphite">{def.outcomeNote}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[0.875rem] text-slate">Source</dt>
              <dd className="mt-1 text-[0.9375rem] text-ink">
                {def.source}
                <span className="block text-slate">{def.sources.map((s) => `${s}: ${sourceNames[s]}`).join('; ')}</span>
              </dd>
            </div>
            {def.param && (
              <div>
                <dt className="text-[0.875rem] text-slate">Parameter</dt>
                <dd className="mt-1 font-mono text-[0.9375rem] text-ink">
                  {def.param} = {rs.params[def.param]}
                </dd>
              </div>
            )}
            {def.setting && (
              <div>
                <dt className="text-[0.875rem] text-slate">Decision setting</dt>
                <dd className="mt-1 text-[0.9375rem] text-ink">
                  {settingDefs.find((s) => s.key === def.setting)?.label}: {settingDefs.find((s) => s.key === def.setting)?.options.find((o) => o.value === rs.settings[def.setting!])?.label}
                  <span className="mt-1 block">
                    <PendingBadge />
                  </span>
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-[0.875rem] text-slate">Inputs</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {def.inputs.map((i) => (
                  <span key={i} className="rounded-md border border-line bg-white px-1.5 py-0.5 font-mono text-[0.8125rem] text-graphite">
                    {i}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
          <p className="rounded-xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">Evaluated the same way every time. Never evaluated by AI. Where an input comes from AI extraction, the rule records which extraction it used and the reviewer sees both.</p>
          <div>
            <p className="text-[0.9375rem] font-medium text-ink">Cases in this demo it has affected</p>
            {nonPass.length ? (
              <ul className="mt-2 divide-y divide-line/70 rounded-2xl border border-line bg-white">
                {nonPass.map(({ vc, result }) => {
                  const p = data.people.find((x) => x.id === vc.personId)!
                  const row = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[0.9375rem] font-medium text-ink">{fullName(p)}</span>
                        <span className="block text-[0.875rem] leading-snug text-slate">{result.title}</span>
                        <span className="block font-mono text-[0.8125rem] text-slate">{vc.id}</span>
                      </span>
                      <OutcomeChip outcome={result.outcome} />
                    </>
                  )
                  return (
                    <li key={vc.id}>
                      {state.persona === 'reviewer' ? (
                        <Link to={`/acsp/cases/${vc.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-mist/50">
                          {row}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3">{row}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-1 text-[0.9375rem] text-slate">{affected.length ? `Passed on ${affected.length} case${affected.length === 1 ? '' : 's'}. No other outcome in the demo.` : 'Not evaluated on any case in the demo yet.'}</p>
            )}
          </div>
        </div>
      )}
    </SidePanel>
  )
}

function ParamsPanel({ canEdit }: { canEdit: boolean }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const current = currentRuleSet(data)
  const draft = draftRuleSet(data)
  const [editing, setEditing] = useState<ParamKey | null>(null)
  const [value, setValue] = useState('')
  return (
    <Panel id="rules-params" aria-labelledby="params-title" className="scroll-mt-40 overflow-hidden">
      <PanelHeader id="params-title" title="Parameters" description="Held in the version. Changing one publishes a new version, never a software release." />
      <ul className="divide-y divide-line/70">
        {paramDefs.map((p) => {
          const cur = current.params[p.key]
          const drafted = draft && draft.params[p.key] !== cur ? draft.params[p.key] : undefined
          return (
            <li key={p.key} data-cite={`param:${p.key}`} className="px-5 py-3.5 sm:px-6">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] text-ink">{p.label}</p>
                  <p className="font-mono text-[0.8125rem] text-slate">
                    {p.key} · {p.basis}
                  </p>
                </div>
                {editing === p.key ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const n = Number(value)
                      if (!Number.isFinite(n) || n < p.min || n > p.max) return
                      apply((d) => proposeRuleChange(d, { kind: 'param', key: p.key, value: n }, SUPER_ADMIN))
                      toast({ title: 'Saved to the draft', description: `Version ${current.version} is unchanged.` })
                      setEditing(null)
                    }}
                  >
                    <label htmlFor={`p-${p.key}`} className="sr-only">
                      {p.label}
                    </label>
                    <input id={`p-${p.key}`} type="number" min={p.min} max={p.max} value={value} onChange={(e) => setValue(e.target.value)} className="h-10 w-24 rounded-lg border border-line bg-white px-3 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10" autoFocus />
                    <Button size="sm" type="submit">
                      Save to draft
                    </Button>
                    <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-base text-ink tabular">
                      {cur} {p.unit}
                    </span>
                    {drafted !== undefined && (
                      <span className="rounded-md bg-info-wash px-2 py-0.5 font-mono text-[0.8125rem] text-info">
                        Draft {draft!.version}: {drafted}
                      </span>
                    )}
                    {canEdit && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setEditing(p.key)
                          setValue(String(draft?.params[p.key] ?? cur))
                        }}
                      >
                        <Pencil aria-hidden="true" />
                        Change
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function SettingsPanel({ canEdit }: { canEdit: boolean }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const current = currentRuleSet(data)
  const draft = draftRuleSet(data)
  return (
    <Panel id="rules-settings" aria-labelledby="settings-title" className="scroll-mt-40 overflow-hidden">
      <PanelHeader id="settings-title" title="Decision settings" description="Points from the rule set that are for the client’s decision. Each one is read by the demo flows." />
      <ul className="divide-y divide-line/70">
        {settingDefs.map((s) => {
          const cur = current.settings[s.key]
          const shown = (draft ? draft.settings[s.key] : cur) as RuleSettings[SettingKey]
          return (
            <li key={s.key} data-cite={`setting:${s.key}`} className="px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-medium text-ink">{s.label}</p>
                <PendingBadge />
                <span className="font-mono text-[0.8125rem] text-slate">
                  {s.rules.join(', ')} · {s.decisionPoint}
                </span>
              </div>
              <p className="mt-1 text-[0.9375rem] text-graphite">{s.question}</p>
              <div role="radiogroup" aria-label={s.label} className="mt-3 inline-flex rounded-xl border border-line bg-mist p-1">
                {s.options.map((o) => {
                  const on = shown === o.value
                  return (
                    <button
                      key={String(o.value)}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!canEdit}
                      onClick={() => {
                        if (on) return
                        apply((d) => proposeRuleChange(d, { kind: 'setting', key: s.key, value: o.value }, SUPER_ADMIN))
                        toast({ title: 'Saved to the draft', description: `Version ${current.version} is unchanged.` })
                      }}
                      className={cn('h-9 rounded-lg px-3.5 text-[0.9375rem] transition-colors duration-150 disabled:cursor-default', on ? 'bg-white font-medium text-ink shadow-sm' : 'text-graphite enabled:cursor-pointer enabled:hover:text-ink')}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
              {draft && draft.settings[s.key] !== cur && <p className="mt-2 text-[0.875rem] text-info">Draft {draft.version} changes this. Version {current.version} still uses: {s.options.find((o) => o.value === cur)?.label}.</p>}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function HistoryPanel() {
  const { data } = useDemoStore()
  const versions = [...data.ruleSets].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <Panel id="rules-history" aria-labelledby="history-title" className="scroll-mt-40 overflow-hidden">
      <PanelHeader id="history-title" title={<span className="inline-flex items-center gap-2"><History className="size-5" aria-hidden="true" />Version history</span>} description="A published version never changes. Each case records the version applied at its decision." />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-left">
          <thead className="bg-mist/50 text-[0.875rem] text-slate">
            <tr>
              {['Version', 'Status', 'Effective', 'Proposed by', 'Approved and published by'].map((h, i) => (
                <th key={h} scope="col" className={cn('py-2.5 pr-4 font-normal', i === 0 && 'pl-5 sm:pl-6')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.version} data-cite={`version:${v.version}`} className="border-t border-line/70 align-top">
                <td className="py-3.5 pr-4 pl-5 font-mono text-[0.9375rem] text-ink sm:pl-6">{v.version}</td>
                <td className="py-3.5 pr-4">
                  <StatusPill status={v.status} />
                </td>
                <td className="py-3.5 pr-4 text-[0.9375rem] text-graphite">
                  {v.effectiveFrom ? formatDate(v.effectiveFrom) : 'Not published'}
                  {v.supersededAt && <span className="block text-[0.875rem] text-slate">Superseded {formatDate(v.supersededAt)}</span>}
                </td>
                <td className="py-3.5 pr-4 text-[0.9375rem] text-graphite">{v.submittedBy ?? v.createdBy}</td>
                <td className="py-3.5 pr-6 text-[0.9375rem] text-graphite">
                  {v.approvedBy ?? 'Waiting'}
                  {v.publishedAt && <span className="block text-[0.875rem] text-slate">{formatDateTime(v.publishedAt)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
