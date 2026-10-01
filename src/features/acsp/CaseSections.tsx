import { CircleCheck, CircleX, FileWarning, GraduationCap, Home, Waypoints } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Panel, PanelHeader } from '@/components/app/Page'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { AiObservationCard } from '@/components/visual/AiObservationCard'
import { Avatar } from '@/components/visual/Avatar'
import { formatAddress, formatDate, formatShortDate, fullName } from '@/lib/format'
import { NORMALISATION_NOTE } from '@/lib/register'
import { comparisonRows, documentName, type RuleResult } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { recordOption2Check } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import type { CaseStep, CheckResult, EvidenceItem, Person, RegisterEntry, Reviewer, VerificationCase } from '@/types/domain'
import { RuleList } from './RuleList'

export interface SectionProps {
  vc: VerificationCase
  person: Person
  entry: RegisterEntry
  results: RuleResult[]
  reviewerId: string
  decidable: boolean
}

function StepPanel({ id, kicker, title, description, actions, children, step, p }: { id: string; kicker: string; title: string; description?: string; actions?: ReactNode; children?: ReactNode; step: CaseStep; p: SectionProps }) {
  const results = p.results.filter((r) => r.step === step)
  const observations = p.vc.observations.filter((o) => o.step === step)
  return (
    <Panel aria-labelledby={id} className="overflow-hidden">
      <PanelHeader
        id={id}
        title={
          <span className="flex flex-col">
            <span className="font-mono text-[0.75rem] font-normal tracking-[0.14em] text-slate uppercase">{kicker}</span>
            {title}
          </span>
        }
        description={description}
        actions={actions}
      />
      {children}
      {observations.length > 0 && (
        <div className="space-y-3 border-t border-line/70 p-5 sm:p-6">
          {observations.map((o) => (
            <AiObservationCard key={o.id} o={o} />
          ))}
        </div>
      )}
      <RuleList results={results} caseId={p.vc.id} reviewerId={p.reviewerId} decidable={p.decidable} />
    </Panel>
  )
}

export function PersonalSection(p: SectionProps) {
  const { person, vc } = p
  const former = vc.journey?.formerNames ?? person.formerNames ?? []
  const rows: [string, string][] = [
    ['Full name', fullName(person)],
    ['Former names', former.length ? former.join(', ') : 'None declared'],
    ['Date of birth', formatDate(person.dateOfBirth)],
    ['Nationality', person.nationality],
    ['Email', `${person.email} · confirmed by one-time code`],
    ['Mobile', `${person.mobile} · confirmed by SMS code`],
  ]
  return (
    <StepPanel id="sec-info" kicker="Step 1" title="Personal information" description="As given by the individual" step="info" p={p}>
      <dl data-cite="declared:personal" className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[0.875rem] text-slate">{k}</dt>
            <dd className="mt-0.5 text-base break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <ul data-cite="declared:address" className="divide-y divide-line/70 border-t border-line/70">
        {person.addressHistory.slice(0, 3).map((a, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
            <Home className="mt-0.5 size-[1.125rem] shrink-0 text-slate" aria-hidden="true" />
            <div>
              <p className="text-base text-ink">{formatAddress(a.address)}</p>
              <p className="text-[0.875rem] text-slate">
                {a.to ? 'Previous' : 'Current'} · from {formatShortDate(a.from)}
                {a.to && ` to ${formatShortDate(a.to)}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </StepPanel>
  )
}

export function RegisterSection(p: SectionProps) {
  const { data } = useDemoStore()
  const { vc, person, entry } = p
  const rows = comparisonRows(person, person.document, entry)
  const task = vc.correctionTaskId ? data.corrections.find((t) => t.id === vc.correctionTaskId) : undefined
  return (
    <StepPanel
      id="sec-register"
      kicker="Register"
      title="Register comparison"
      description="What the person told us, what the document holds and what Companies House holds. Compared by rule, the same way every time."
      step="register"
      p={p}
      actions={
        task && task.status !== 'register_updated' ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/acsp/filings">
              <Waypoints aria-hidden="true" />
              Route B task {task.id}
            </Link>
          </Button>
        ) : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left">
          <thead className="bg-mist/50 text-[0.875rem] text-slate">
            <tr>
              {['Field', 'Stated by the person', 'Identity document', 'Companies House', 'Result'].map((h, i) => (
                <th key={h} scope="col" className={cn('py-2.5 pr-4 font-normal', i === 0 && 'pl-5 sm:pl-6')}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.field} className={cn('border-t border-line/70 align-top', r.result === 'mismatch' && 'bg-info-wash/60')}>
                <td className="py-4 pr-4 pl-5 text-[0.9375rem] font-medium text-ink sm:pl-6">
                  {r.field}
                  <RuleIdTag id={r.ruleId} className="mt-1 block w-fit" />
                </td>
                <td className="py-4 pr-4 text-[0.9375rem] text-ink" data-cite={`declared:${r.field}`}>
                  {r.stated}
                </td>
                <td className="py-4 pr-4 font-mono text-[0.875rem] text-ink">{r.document}</td>
                <td className="py-4 pr-4 font-mono text-[0.875rem] text-ink" data-cite={`register:${r.field}`}>
                  {r.register}
                  {r.note && <span className="mt-1 block font-sans text-[0.875rem] text-slate">{r.note}</span>}
                </td>
                <td className="py-4 pr-6">
                  {r.result === 'mismatch' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-info px-2.5 py-1 text-sm font-medium whitespace-nowrap text-white">
                      <FileWarning className="size-4" aria-hidden="true" />
                      Differs
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-approve">
                      <CircleCheck className="size-4" aria-hidden="true" />
                      Matches
                    </span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="border-t border-line/70 align-top" data-cite="register:Role">
              <td className="py-4 pr-4 pl-5 text-[0.9375rem] font-medium text-ink sm:pl-6">
                Role
                <RuleIdTag id="REG-02" className="mt-1 block w-fit" />
              </td>
              <td className="py-4 pr-4 text-[0.9375rem] text-ink" colSpan={2}>
                Shown at entry when the person was added
              </td>
              <td className="py-4 pr-4 text-[0.9375rem] text-ink">
                {entry.role === 'director_psc' ? 'Director and PSC' : entry.role === 'director' ? 'Director' : 'PSC'} since {formatShortDate(entry.appointedOn)}
              </td>
              <td className="py-4 pr-6 text-[0.9375rem] text-approve">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CircleCheck className="size-4" aria-hidden="true" />
                  On the register
                </span>
              </td>
            </tr>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-5 text-base text-slate">
                  No document data to compare yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line/70 bg-mist/40 px-5 py-3 text-[0.9375rem] text-graphite sm:px-6">{NORMALISATION_NOTE} The case resumes automatically once the register matches.</p>
    </StepPanel>
  )
}

function EvidenceThumb({ item, name }: { item: EvidenceItem; name: string }) {
  if (item.kind === 'identity_document' || item.kind === 'option2_document')
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-ink">
        <div className="flex h-16 w-12 flex-col justify-between rounded-md border border-white/15 bg-white/[0.06] p-1.5">
          <span className="h-0.5 w-5 rounded bg-white/30" />
          <span className="mx-auto grid size-4 grid-cols-2 gap-px rounded-[3px] border border-highlight/70 p-[2px]">
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
          </span>
          <span className="h-0.5 w-7 rounded bg-white/25" />
        </div>
      </div>
    )
  if (item.kind === 'selfie')
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#e4e6e8,#f4f5f6)]">
        <Avatar seed={name} name={name} size={56} />
      </div>
    )
  return (
    <div className="flex h-24 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#e9ebed,#f6f7f8)]">
      <div className="h-16 w-12 space-y-1.5 rounded-md bg-white p-2 shadow-sm">
        <span className="block h-1.5 w-6 rounded bg-slate/50" />
        <span className="block h-1 w-full rounded bg-line" />
        <span className="block h-1 w-8 rounded bg-line" />
        <span className="block h-1 w-full rounded bg-line" />
      </div>
    </div>
  )
}

export function DocumentSection(p: SectionProps) {
  const { vc, person } = p
  const doc = person.document
  const items = vc.evidence.filter((e) => e.kind === 'identity_document' || e.kind === 'selfie')
  return (
    <StepPanel id="sec-document" kicker="Steps 2 and 3" title="Identity document" description="One photographic identity document, uploaded once and passed to the identity checks" step="document" p={p}>
      {doc && vc.option === 1 && (
        <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
          {(
            [
              ['Document', documentName(doc)],
              ['Number', `Held securely, ends ${doc.numberLastTwo}`],
              ['Expires', formatDate(doc.expiresOn)],
              ['Country of issue', doc.issuingCountry],
              ['Captured', vc.browserCapture ? 'In the browser, no chip read' : doc.hasChip ? 'In the app, chip read' : 'In the app'],
              ['Name on document', doc.nameOnDocument],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-[0.875rem] text-slate">{k}</dt>
              <dd className="mt-0.5 text-base break-words text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {items.length > 0 && (
        <ul className="grid gap-4 border-t border-line/70 p-5 sm:grid-cols-2 sm:p-6">
          {items.map((e) => (
            <li key={e.id} data-cite={`evidence:${e.kind === 'identity_document' ? 'identity_document' : e.id}`} className="rounded-2xl border border-line bg-white p-3">
              <EvidenceThumb item={e} name={fullName(person)} />
              <p className="mt-3 text-[0.9375rem] font-medium text-ink">{e.label}</p>
              <p className="text-[0.875rem] text-slate">Uploaded {formatShortDate(e.uploadedAt)}</p>
              {e.note && <p className="mt-2 rounded-lg bg-mist px-2.5 py-1.5 text-[0.8125rem] leading-snug text-graphite">Provider result: {e.note}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-line/70 px-5 py-3 text-[0.875rem] text-slate sm:px-6">Synthetic placeholders. AI is never applied to the identity document itself.</p>
    </StepPanel>
  )
}

const checkLabel: Record<CheckResult, string> = { pass: 'Passed', fail: 'Not passed', refer: 'For review', pending: 'Pending', not_applicable: 'Not applicable' }

export function IdvtSection(p: SectionProps) {
  const i = p.vc.idvt
  const rows: [string, string, CheckResult, string?][] = [
    ['chip', 'Passport NFC chip read', i.nfcChipRead, i.nfcChipRead === 'pass' ? 'Signature valid' : p.vc.browserCapture ? 'Not possible in a browser' : undefined],
    ['authenticity', 'Document authenticity', i.documentAuthenticity],
    ['liveness', 'Liveness', i.liveness],
    ['face', 'Face match against the document photo', i.faceMatch, i.faceMatchScore ? `${i.faceMatchScore}%` : undefined],
  ]
  return (
    <StepPanel id="sec-idvt" kicker="Steps 3 and 4" title="IDVT checks" description={`Certified identity provider${i.attempts && i.attempts > 1 ? ` · ${i.attempts} attempts` : ''}`} step="idvt" p={p}>
      <ul className="divide-y divide-line/70">
        {rows.map(([ref, label, result, extra]) => (
          <li key={ref} data-cite={`check:${ref}`} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
            {result === 'pass' ? <CompletionTick className="size-5" label="Passed" /> : result === 'fail' ? <CircleX className="size-5 text-decline" aria-label="Not passed" /> : <span className="size-5 rounded-full border-[1.5px] border-line" aria-hidden="true" />}
            <span className="flex-1 text-[0.9375rem] text-ink">{label}</span>
            <span className="text-[0.9375rem] text-slate">{extra ?? checkLabel[result]}</span>
          </li>
        ))}
      </ul>
      {i.providerReference && <p className="border-t border-line/70 px-5 py-3 font-mono text-[0.8125rem] text-slate sm:px-6">Provider reference {i.providerReference}</p>}
    </StepPanel>
  )
}

export function ScreeningSection(p: SectionProps) {
  const i = p.vc.idvt
  return (
    <StepPanel id="sec-aml" kicker="Screening" title="PEP and sanctions" description="Supporting evidence for your decision. Screening never decides a case." step="aml" p={p}>
      <div data-cite="check:screening" className="flex items-start gap-3 px-5 py-4 sm:px-6">
        {i.pepPossibleMatch || i.sanctionsPossibleMatch ? <FileWarning className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" /> : <CompletionTick className="mt-0.5 size-5" label="No match" />}
        <div>
          <p className="text-base text-ink">{i.pepPossibleMatch ? 'Possible PEP match returned' : i.sanctionsPossibleMatch ? 'Possible sanctions match returned' : i.pepSanctions === 'pending' ? 'Screening not yet run' : 'No PEP, sanctions or adverse media match'}</p>
          {i.pepSanctionsDetail && <p className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">{i.pepSanctionsDetail}</p>}
        </div>
      </div>
    </StepPanel>
  )
}

export function EvidenceSection(p: SectionProps) {
  const items = p.vc.evidence.filter((e) => e.kind === 'address_evidence')
  const hasResults = p.results.some((r) => r.step === 'evidence') || p.vc.observations.some((o) => o.step === 'evidence')
  if (!hasResults) return null
  return (
    <StepPanel id="sec-evidence" kicker="Only when a trigger applies" title="Supporting evidence" description="One supporting document, never a second identity document" step="evidence" p={p}>
      {items.length > 0 && (
        <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          {items.map((e) => (
            <li key={e.id} data-cite={`evidence:${e.id}`} className="rounded-2xl border border-line bg-white p-3">
              <EvidenceThumb item={e} name="" />
              <p className="mt-3 text-[0.9375rem] font-medium text-ink">{e.label}</p>
              <p className="text-[0.875rem] text-slate">
                Uploaded {formatShortDate(e.uploadedAt)}
                {e.documentDate && ` · dated ${formatShortDate(e.documentDate)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </StepPanel>
  )
}

export function Option2Section(p: SectionProps & { reviewer?: Reviewer }) {
  const { apply } = useDemoStore()
  const o = p.vc.option2
  if (p.vc.option !== 2 || !o) return null
  const att = p.reviewer?.attestation
  const met = p.results.some((r) => r.ruleId === 'OPT-04' && r.outcome === 'pass')
  return (
    <StepPanel id="sec-option" kicker="Fallback only" title="Option 2 person check" description="Offered because Option 1 could not support this person’s document" step="option" p={p}>
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <div className="rounded-2xl border border-line bg-white p-4" data-cite="declared:option2">
          <p className="text-[0.875rem] text-slate">Requirement</p>
          <p className="mt-1 text-base text-ink">Two documents: two from Group A, or one from Group A and one from Group B. Checked in person by a trained reviewer.</p>
          {o.documents?.length ? (
            <ul className="mt-3 space-y-1.5">
              {o.documents.map((d, k) => (
                <li key={k} data-cite={`evidence:option2-${k}`} className="flex items-center gap-2 text-[0.9375rem] text-ink">
                  <CompletionTick className="size-4" label="Seen" />
                  {d.label} <span className="text-slate">· Group {d.group}</span>
                </li>
              ))}
            </ul>
          ) : (
            p.decidable && (
              <Button size="sm" className="mt-3" onClick={() => apply((d) => recordOption2Check(d, p.vc.id, p.reviewerId))}>
                Record the person check
              </Button>
            )
          )}
          {met && o.checkedAt && <p className="mt-2 text-[0.875rem] text-slate">Checked {formatShortDate(o.checkedAt)}</p>}
        </div>
        <div className="rounded-2xl border border-line bg-white p-4" data-cite="declared:attestation">
          <p className="flex items-center gap-2 text-[0.875rem] text-slate">
            <GraduationCap className="size-4" aria-hidden="true" />
            Reviewer training attestation
          </p>
          {att ? (
            <>
              <p className="mt-1 text-base text-ink">{p.reviewer!.name}</p>
              <p className="text-[0.9375rem] text-graphite">{att.course}</p>
              <p className="mt-1 font-mono text-[0.8125rem] text-slate">
                {att.reference} · valid to {formatDate(att.expiresOn)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-base text-decline">No current attestation. Approval is blocked under OPT-03.</p>
          )}
        </div>
      </div>
    </StepPanel>
  )
}
