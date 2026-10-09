import {
  CircleCheck,
  CircleX,
  FileWarning,
  GraduationCap,
  Home,
  Waypoints,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Panel, PanelHeader } from '@/components/app/Page'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { PendingDecision } from '@/components/PendingDecision'
import { RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { AiObservationCard } from '@/components/visual/AiObservationCard'
import {
  formatAddress,
  formatDate,
  formatShortDate,
  fullName,
} from '@/lib/format'
import { NORMALISATION_NOTE } from '@/lib/register'
import {
  comparisonRows,
  documentName,
  ruleSetFor,
  type RuleResult,
} from '@/lib/rules'
import { cn } from '@/lib/utils'
import { recordOption2Check } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import type {
  CaseStep,
  CheckResult,
  Person,
  RegisterEntry,
  Reviewer,
  SupportingEvidenceType,
  VerificationCase,
} from '@/types/domain'
import { DiscrepancyPrompt } from './DiscrepancyPrompt'
import { EvidenceThumb } from './EvidenceThumb'
import { RuleList } from './RuleList'

export interface SectionProps {
  vc: VerificationCase
  person: Person
  entry: RegisterEntry
  results: RuleResult[]
  reviewerId: string
  decidable: boolean
  /** PEP and sanctions screening is switched on for this ACSP (profile.pepScreening). */
  pepScreening: boolean
}

function StepPanel({
  id,
  kicker,
  title,
  description,
  actions,
  children,
  step,
  p,
}: {
  id: string
  kicker: string
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  step: CaseStep
  p: SectionProps
}) {
  const results = p.results.filter((r) => r.step === step)
  const observations = p.vc.observations.filter((o) => o.step === step)
  return (
    <Panel aria-labelledby={id} className="overflow-hidden">
      <PanelHeader
        id={id}
        title={
          <span className="flex flex-col">
            <span className="font-mono text-[0.75rem] font-normal tracking-[0.14em] text-slate uppercase">
              {kicker}
            </span>
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
      <RuleList
        results={results}
        caseId={p.vc.id}
        reviewerId={p.reviewerId}
        decidable={p.decidable}
      />
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
    <StepPanel
      id="sec-info"
      kicker="Step 1"
      title="Personal information"
      description="As given by the individual"
      step="info"
      p={p}
    >
      <dl
        data-cite="declared:personal"
        className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2 sm:px-6"
      >
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[0.875rem] text-slate">{k}</dt>
            <dd className="mt-0.5 text-base break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <ul
        data-cite="declared:address"
        className="divide-y divide-line/70 border-t border-line/70"
      >
        {person.addressHistory.slice(0, 3).map((a, i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
            <Home
              className="mt-0.5 size-[1.125rem] shrink-0 text-slate"
              aria-hidden="true"
            />
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
  const mismatches = rows.filter((r) => r.result === 'mismatch')
  const differences = mismatches.map((r) =>
    r.field === 'Full name' && r.note
      ? `${r.field}: ${r.note.replace(/\.$/, '')}`
      : `${r.field}: ${r.document} on the document, ${r.register} on the register`,
  )
  const task = vc.correctionTaskId
    ? data.corrections.find((t) => t.id === vc.correctionTaskId)
    : undefined
  return (
    <StepPanel
      id="sec-register"
      kicker="Register"
      title="Register comparison"
      description="What the person told us, what the document holds and what Companies House holds. Compared by rule, the same way every time. A difference is flagged for your decision. It never halts the case."
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
      {mismatches.length > 0 && (
        <DiscrepancyPrompt
          vc={vc}
          differences={differences}
          fields={mismatches.map((r) => r.field)}
          reviewerId={p.reviewerId}
          decidable={p.decidable}
        />
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left">
          <thead className="bg-mist/50 text-[0.875rem] text-slate">
            <tr>
              {[
                'Field',
                'Stated by the person',
                'Identity document',
                'Companies House',
                'Result',
              ].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={cn(
                    'py-2.5 pr-4 font-normal',
                    i === 0 && 'pl-5 sm:pl-6',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.field}
                className={cn(
                  'border-t border-line/70 align-top',
                  r.result === 'mismatch' && 'bg-info-wash/60',
                )}
              >
                <td className="py-4 pr-4 pl-5 text-[0.9375rem] font-medium text-ink sm:pl-6">
                  {r.field}
                  <RuleIdTag id={r.ruleId} className="mt-1 block w-fit" />
                </td>
                <td
                  className="py-4 pr-4 text-[0.9375rem] text-ink"
                  data-cite={`declared:${r.field}`}
                >
                  {r.stated}
                </td>
                <td className="py-4 pr-4 font-mono text-[0.875rem] text-ink">
                  {r.document}
                </td>
                <td
                  className="py-4 pr-4 font-mono text-[0.875rem] text-ink"
                  data-cite={`register:${r.field}`}
                >
                  {r.register}
                  {r.note && (
                    <span className="mt-1 block font-sans text-[0.875rem] text-slate">
                      {r.note}
                    </span>
                  )}
                </td>
                <td className="py-4 pr-6">
                  {r.result === 'mismatch' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-info px-2.5 py-1 text-sm font-medium whitespace-nowrap text-white">
                      <FileWarning className="size-4" aria-hidden="true" />
                      Flagged, differs
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
            <tr
              className="border-t border-line/70 align-top"
              data-cite="register:Role"
            >
              <td className="py-4 pr-4 pl-5 text-[0.9375rem] font-medium text-ink sm:pl-6">
                Role
                <RuleIdTag id="REG-02" className="mt-1 block w-fit" />
              </td>
              <td className="py-4 pr-4 text-[0.9375rem] text-ink" colSpan={2}>
                Shown at entry when the person was added
              </td>
              <td className="py-4 pr-4 text-[0.9375rem] text-ink">
                {entry.role === 'director_psc'
                  ? 'Director and PSC'
                  : entry.role === 'director'
                    ? 'Director'
                    : 'PSC'}{' '}
                since {formatShortDate(entry.appointedOn)}
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
      <p className="border-t border-line/70 bg-mist/40 px-5 py-3 text-[0.9375rem] text-graphite sm:px-6">
        {NORMALISATION_NOTE}
      </p>
    </StepPanel>
  )
}

const captureLabel = {
  upload: 'Uploaded from a computer, in the browser',
  phone: 'Captured in the phone’s browser, then returned to the case',
  camera: 'Direct camera capture in the mobile browser',
} as const

export function DocumentSection(p: SectionProps) {
  const { data } = useDemoStore()
  const { vc, person } = p
  const doc = person.document
  const items = vc.evidence.filter(
    (e) => e.kind === 'identity_document' || e.kind === 'selfie',
  )
  const setting = ruleSetFor(data, vc).settings.chip_not_read_fallback
  const isPassport =
    (vc.journey?.documentType ?? doc?.type) === 'passport' && vc.option === 1
  return (
    <StepPanel
      id="sec-document"
      kicker="Steps 2 and 3"
      title="Identity document"
      description="One photographic identity document, captured in the browser and passed to the identity checks"
      step="document"
      p={p}
    >
      {doc && vc.option === 1 && (
        <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
          {(
            [
              ['Document', documentName(doc)],
              ['Number', `Held securely, ends ${doc.numberLastTwo}`],
              ['Expires', formatDate(doc.expiresOn)],
              ['Country of issue', doc.issuingCountry],
              ['Captured', captureLabel[vc.journey?.captureRoute ?? 'upload']],
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
      {isPassport && (
        <p className="flex flex-wrap items-center gap-2 border-t border-line/70 px-5 py-3 text-[0.9375rem] text-slate sm:px-6">
          {setting === 'accept_web_result'
            ? 'Chip not read by Evidence One. Browser route result accepted under the current setting.'
            : 'Chip not read by Evidence One. The current setting asks for another Option 1 document, then Option 2.'}
          <PendingDecision code="P1" />
        </p>
      )}
      {items.length > 0 && (
        <ul className="grid gap-4 border-t border-line/70 p-5 sm:grid-cols-2 sm:p-6">
          {items.map((e) => (
            <li
              key={e.id}
              data-cite={`evidence:${e.kind === 'identity_document' ? 'identity_document' : e.id}`}
              className="rounded-2xl border border-line bg-white p-3"
            >
              <EvidenceThumb
                item={e}
                name={fullName(person)}
                person={person}
                docType={vc.journey?.documentType}
              />
              <p className="mt-3 text-[0.9375rem] font-medium text-ink">
                {e.label}
              </p>
              <p className="text-[0.875rem] text-slate">
                Uploaded {formatShortDate(e.uploadedAt)}
              </p>
              {e.note && (
                <p className="mt-2 rounded-lg bg-mist px-2.5 py-1.5 text-[0.8125rem] leading-snug text-graphite">
                  Certified identity provider result: {e.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="border-t border-line/70 px-5 py-3 text-[0.875rem] text-slate sm:px-6">
        Synthetic placeholders. AI is never applied to the identity document
        itself.
      </p>
    </StepPanel>
  )
}

const checkLabel: Record<CheckResult, string> = {
  pass: 'Passed',
  fail: 'Not passed',
  refer: 'For review',
  pending: 'Pending',
  not_applicable: 'Not applicable',
}

export function IdvtSection(p: SectionProps) {
  const i = p.vc.idvt
  const mismatch = comparisonRows(p.person, p.person.document, p.entry).some(
    (r) => r.result === 'mismatch',
  )
  const rows: [string, string, CheckResult, string?][] = [
    ['authenticity', 'Document authenticity', i.documentAuthenticity],
    ['liveness', 'Liveness', i.liveness],
    [
      'face',
      'Face match against the document photo',
      i.faceMatch,
      i.faceMatchScore ? `${i.faceMatchScore}%` : undefined,
    ],
  ]
  if (p.pepScreening)
    rows.push([
      'screening',
      'PEP and sanctions screening',
      i.pepSanctions,
      i.pepPossibleMatch || i.sanctionsPossibleMatch
        ? 'Possible match'
        : undefined,
    ])
  rows.push([
    'register',
    'Register comparison',
    mismatch ? 'refer' : 'pass',
    mismatch ? 'Flagged, see below' : 'Matches',
  ])
  return (
    <StepPanel
      id="sec-idvt"
      kicker="Steps 3 and 4"
      title="Identity checks"
      description={`Certified identity provider${i.attempts && i.attempts > 1 ? ` · ${i.attempts} attempts` : ''}`}
      step="idvt"
      p={p}
    >
      <ul className="divide-y divide-line/70">
        {rows.map(([ref, label, result, extra]) => (
          <li
            key={ref}
            data-cite={`check:${ref}`}
            className="flex items-center gap-3 px-5 py-3.5 sm:px-6"
          >
            {result === 'pass' ? (
              <CompletionTick className="size-5" label="Passed" />
            ) : result === 'fail' ? (
              <CircleX
                className="size-5 text-decline"
                aria-label="Not passed"
              />
            ) : result === 'refer' ? (
              <FileWarning className="size-5 text-info" aria-label="Flagged" />
            ) : (
              <span
                className="size-5 rounded-full border-[1.5px] border-line"
                aria-hidden="true"
              />
            )}
            <span className="flex-1 text-[0.9375rem] text-ink">{label}</span>
            <span className="text-[0.9375rem] text-slate">
              {extra ?? checkLabel[result]}
            </span>
          </li>
        ))}
      </ul>
      {!p.pepScreening && (
        <p className="border-t border-line/70 px-5 py-3 text-[0.875rem] text-slate sm:px-6">
          PEP and sanctions screening is switched off for your firm.
        </p>
      )}
      {i.providerReference && (
        <p className="border-t border-line/70 px-5 py-3 font-mono text-[0.8125rem] text-slate sm:px-6">
          Provider reference {i.providerReference}
        </p>
      )}
    </StepPanel>
  )
}

export function ScreeningSection(p: SectionProps) {
  const i = p.vc.idvt
  if (!p.pepScreening) return null
  return (
    <StepPanel
      id="sec-aml"
      kicker="Screening"
      title="PEP and sanctions"
      description="Supporting evidence for your decision. Screening never decides a case."
      step="aml"
      p={p}
    >
      <div
        data-cite="check:screening"
        className="flex items-start gap-3 px-5 py-4 sm:px-6"
      >
        {i.pepPossibleMatch || i.sanctionsPossibleMatch ? (
          <FileWarning
            className="mt-0.5 size-5 shrink-0 text-info"
            aria-hidden="true"
          />
        ) : (
          <CompletionTick className="mt-0.5 size-5" label="No match" />
        )}
        <div>
          <p className="text-base text-ink">
            {i.pepPossibleMatch
              ? 'Possible PEP match returned'
              : i.sanctionsPossibleMatch
                ? 'Possible sanctions match returned'
                : i.pepSanctions === 'pending'
                  ? 'Screening not yet run'
                  : 'No PEP, sanctions or adverse media match'}
          </p>
          {i.pepSanctionsDetail && (
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">
              {i.pepSanctionsDetail}
            </p>
          )}
        </div>
      </div>
    </StepPanel>
  )
}

const supportingLabel: Record<SupportingEvidenceType, string> = {
  bank_statement: 'Bank or credit card statement',
  utility_bill: 'Utility or council tax bill',
  insurance: 'Insurance policy document',
  passport_use: 'Evidence of recent passport use',
}

export function EvidenceSection(p: SectionProps) {
  const { data } = useDemoStore()
  const months = ruleSetFor(data, p.vc).params.supporting_evidence_months
  const items = p.vc.evidence.filter((e) => e.kind === 'address_evidence')
  const hasResults =
    p.results.some((r) => r.step === 'evidence') ||
    p.vc.observations.some((o) => o.step === 'evidence')
  if (!hasResults && items.length === 0) return null
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  return (
    <StepPanel
      id="sec-evidence"
      kicker="Proof of address from everyone"
      title="Proof of address and supporting evidence"
      description={`Proof of current address dated within ${months} months (ADDL-02). One supporting document only when the document is expired (ADDL-01) or a name change is declared (ADDL-03), never a second identity document.`}
      step="evidence"
      p={p}
      actions={<PendingDecision code="P3" />}
    >
      {items.length > 0 && (
        <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          {items.map((e) => {
            const within = e.documentDate
              ? new Date(e.documentDate) >= since
              : undefined
            return (
              <li
                key={e.id}
                data-cite={`evidence:${e.id}`}
                className="rounded-2xl border border-line bg-white p-3"
              >
                <EvidenceThumb item={e} name="" />
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[0.9375rem] font-medium text-ink">
                  {e.label}
                  {e.redaction && (
                    <span className="rounded-full border border-line bg-mist px-2 py-0.5 text-[0.75rem] font-medium text-graphite">
                      Option O3
                    </span>
                  )}
                </p>
                <p className="text-[0.875rem] text-slate">
                  {e.supportingType &&
                    `${supportingLabel[e.supportingType]} · `}
                  Uploaded {formatShortDate(e.uploadedAt)}
                  {e.documentDate &&
                    ` · dated ${formatShortDate(e.documentDate)}`}
                </p>
                {within !== undefined && (
                  <p
                    className={cn(
                      'mt-1.5 inline-flex items-center gap-1.5 text-[0.875rem] font-medium',
                      within ? 'text-approve' : 'text-info',
                    )}
                  >
                    {within ? (
                      <CircleCheck className="size-4" aria-hidden="true" />
                    ) : (
                      <FileWarning className="size-4" aria-hidden="true" />
                    )}
                    {within
                      ? `Dated within ${months} months`
                      : `Older than ${months} months`}
                  </p>
                )}
                {e.redaction && (
                  <div className="mt-2 rounded-lg bg-mist px-2.5 py-2 text-[0.8125rem] leading-snug text-graphite">
                    <p>
                      Redacted copy only. Amounts and payees were masked by the
                      individual, who confirmed the redaction on{' '}
                      {formatShortDate(e.redaction.confirmedAt)}. You never see
                      the original.
                    </p>
                    <p className="mt-1">
                      Masked: {e.redaction.masked.join(', ')}. AI observation.
                      Advisory only.
                    </p>
                  </div>
                )}
              </li>
            )
          })}
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
  const met = p.results.some(
    (r) => r.ruleId === 'OPT-04' && r.outcome === 'pass',
  )
  return (
    <StepPanel
      id="sec-option"
      kicker="Fallback only"
      title="Option 2 person check"
      description="Offered because Option 1 could not support this person’s document"
      step="option"
      p={p}
    >
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <div
          className="rounded-2xl border border-line bg-white p-4"
          data-cite="declared:option2"
        >
          <p className="text-[0.875rem] text-slate">Requirement</p>
          <p className="mt-1 text-base text-ink">
            Two documents: two from Group A, or one from Group A and one from
            Group B. Checked in person by a trained reviewer.
          </p>
          {o.documents?.length ? (
            <ul className="mt-3 space-y-1.5">
              {o.documents.map((d, k) => (
                <li
                  key={k}
                  data-cite={`evidence:option2-${k}`}
                  className="flex items-center gap-2 text-[0.9375rem] text-ink"
                >
                  <CompletionTick className="size-4" label="Seen" />
                  {d.label}{' '}
                  <span className="text-slate">· Group {d.group}</span>
                </li>
              ))}
            </ul>
          ) : (
            p.decidable && (
              <Button
                size="sm"
                className="mt-3"
                onClick={() =>
                  apply((d) => recordOption2Check(d, p.vc.id, p.reviewerId))
                }
              >
                Record the person check
              </Button>
            )
          )}
          {met && o.checkedAt && (
            <p className="mt-2 text-[0.875rem] text-slate">
              Checked {formatShortDate(o.checkedAt)}
            </p>
          )}
        </div>
        <div
          className="rounded-2xl border border-line bg-white p-4"
          data-cite="declared:attestation"
        >
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
            <p className="mt-1 text-base text-decline">
              No current attestation. Approval is blocked under OPT-03.
            </p>
          )}
        </div>
      </div>
    </StepPanel>
  )
}
