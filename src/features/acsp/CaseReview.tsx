import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  CirclePause,
  CircleX,
  FileCheck2,
  FileText,
  FileWarning,
  Home,
  Lock,
  MessageSquareMore,
  Send,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { SlaPill } from '@/components/app/SlaPill'
import { useToast } from '@/components/app/Toaster'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { CaseStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { AiTag } from '@/components/visual/AiTag'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { DECLINE_MESSAGE } from '@/data/reasonCodes'
import { formatAddress, formatDate, formatDateTime, formatMoney, formatShortDate, fullName, shortHash, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { decideCase, haltForMismatch } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { auditForCase, getAgent, getCase, getCompany, getPerson, roleLabel } from '@/store/selectors'
import type { CheckResult, DecisionOutcome, EvidenceItem, VerificationCase } from '@/types/domain'
import { DecisionDialog } from './DecisionDialog'

const REVIEWER = 'rev-marsh'

export function CaseReview() {
  const { caseId = '' } = useParams()
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null)
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const company = vc && getCompany(data, vc.companyNumber)
  const entry = vc && data.register.find((r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber)

  if (!vc || !person || !company || !entry) {
    return (
      <Page>
        <p className="text-lg text-ink">Case not found.</p>
      </Page>
    )
  }

  const name = fullName(person)
  const agent = vc.agentId ? getAgent(data, vc.agentId) : undefined
  const mismatch = vc.comparison.some((r) => r.result === 'mismatch')
  const decidable = vc.status === 'in_review' || vc.status === 'info_requested'

  const confirm = (reason: string, note: string) => {
    if (!outcome) return
    apply((d) => decideCase(d, vc.id, outcome, reason, note, REVIEWER))
    toast({
      title: outcome === 'approve' ? 'Verification approved' : outcome === 'decline' ? 'Verification declined' : 'Information requested',
      description: outcome === 'approve' ? 'Next, prepare the Companies House submission.' : 'Recorded in the audit trail.',
    })
    setOutcome(null)
    if (outcome === 'approve') navigate(`/acsp/cases/${vc.id}/submit`)
  }

  return (
    <Page>
      <Link to="/acsp/queue" className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Review queue
      </Link>

      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <Avatar seed={vc.personId} name={name} size={72} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[2.25rem] leading-tight font-normal tracking-[-0.035em] text-ink">{name}</h1>
              <CaseStatusChip status={vc.status} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.9375rem] text-slate">
              <span>{roleLabel[entry.role]}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <CompanyMark name={company.name} size={20} className="rounded-[6px]" />
                {company.name}
              </span>
              <span>·</span>
              <span className="font-mono">{vc.id}</span>
              <span>·</span>
              <span>{vc.origin === 'b2c' ? 'Direct client' : `Referred by ${agent?.name}`}</span>
            </p>
          </div>
        </div>
        {vc.status === 'in_review' && vc.slaDueAt && (
          <div className="text-right">
            <MonoLabel>Review SLA</MonoLabel>
            <div className="mt-2">
              <SlaPill due={vc.slaDueAt} className="text-base" />
            </div>
          </div>
        )}
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_25rem]">
        <div className="min-w-0 space-y-6">
          <ComparisonPanel vc={vc} />
          <ObservationsPanel vc={vc} />
          <EvidencePanel vc={vc} name={name} />
          <Panel aria-labelledby="addr-title" className="overflow-hidden">
            <PanelHeader id="addr-title" title="Address history" description="Last 12 months, as given by the individual" />
            <ul className="divide-y divide-line/70">
              {person.addressHistory.slice(0, 3).map((a, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-4 sm:px-6">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-wash text-teal">
                    <Home className="size-[1.125rem]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-base text-ink">{formatAddress(a.address)}</p>
                    <p className="text-[0.9375rem] text-slate">
                      {a.to ? 'Previous' : 'Current'} · from {formatShortDate(a.from)}
                      {a.to && ` to ${formatShortDate(a.to)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <TimelinePanel caseId={vc.id} />
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          <DecisionPanel vc={vc} mismatch={mismatch} decidable={decidable} onDecide={setOutcome} />
          <ChecksPanel vc={vc} />
          {vc.payment && (
            <Panel className="p-5 sm:p-6">
              <MonoLabel>Payment</MonoLabel>
              <p className="mt-3 text-base text-ink">
                {formatMoney(vc.payment.amount)} · {vc.payment.method === 'agent_payment_code' ? `Agent Payment Code ${vc.payment.code}` : 'Paid by card'}
              </p>
              <p className="font-mono text-[0.875rem] text-slate">{vc.payment.reference}</p>
            </Panel>
          )}
        </div>
      </div>

      <DecisionDialog outcome={outcome} personName={name} onClose={() => setOutcome(null)} onConfirm={confirm} />
    </Page>
  )
}

function ComparisonPanel({ vc }: { vc: VerificationCase }) {
  return (
    <Panel aria-labelledby="cmp-title" className="overflow-hidden">
      <PanelHeader
        id="cmp-title"
        title="Register comparison"
        description="What the person told us, what the document holds and what Companies House holds. They must match exactly."
        actions={<AiTag label="Compared by AI · advisory" />}
      />
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
            {vc.comparison.map((r) => (
              <tr key={r.field} className={cn('border-t border-line/70 align-top', r.result === 'mismatch' && 'bg-info-wash/60')}>
                <td className="py-4 pr-4 pl-5 text-[0.9375rem] font-medium text-ink sm:pl-6">{r.field}</td>
                <td className="py-4 pr-4 text-[0.9375rem] text-ink">{r.stated}</td>
                <td className="py-4 pr-4 font-mono text-[0.875rem] text-ink">{r.document}</td>
                <td className="py-4 pr-4 font-mono text-[0.875rem] text-ink">
                  {r.register}
                  {r.note && <span className="mt-1 block font-sans text-[0.875rem] text-slate">{r.note}</span>}
                </td>
                <td className="py-4 pr-6">
                  {r.result === 'mismatch' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-info px-2.5 py-1 text-sm font-medium text-white">
                      <FileWarning className="size-4" aria-hidden="true" />
                      Mismatch
                    </span>
                  ) : r.result === 'match' ? (
                    <span className="inline-flex items-center gap-1.5 text-[0.9375rem] font-medium text-approve">
                      <CircleCheck className="size-4" aria-hidden="true" />
                      Match
                    </span>
                  ) : (
                    <span className="text-[0.9375rem] text-slate">Not compared</span>
                  )}
                </td>
              </tr>
            ))}
            {vc.comparison.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-5 text-base text-slate">
                  No comparison recorded for this case.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

const severityStyle = {
  info: 'border-line bg-white',
  attention: 'border-info/30 bg-info-wash/40',
  mismatch: 'border-info/40 bg-info-wash/70',
}

function ObservationsPanel({ vc }: { vc: VerificationCase }) {
  return (
    <Panel aria-labelledby="obs-title" className="overflow-hidden">
      <PanelHeader
        id="obs-title"
        title="AI observations"
        description="Evidence One Intelligence checks documents and compares details. It never approves or declines."
        actions={<AiTag />}
      />
      <ul className="space-y-3 p-5 sm:p-6">
        {vc.observations.map((o) => (
          <li key={o.id} className={cn('rounded-2xl border p-4', severityStyle[o.severity])}>
            <p className="text-base font-medium text-ink">{o.title}</p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">{o.detail}</p>
            <p className="mt-2 text-[0.875rem] text-slate">Source: {o.source}</p>
          </li>
        ))}
        {vc.observations.length === 0 && <li className="text-base text-slate">No observations.</li>}
      </ul>
    </Panel>
  )
}

function EvidenceThumb({ item, name }: { item: EvidenceItem; name: string }) {
  if (item.kind === 'identity_document')
    return (
      <div className="flex h-28 items-center justify-center rounded-xl bg-ink">
        <div className="flex h-20 w-14 flex-col justify-between rounded-md border border-white/15 bg-white/[0.06] p-1.5">
          <span className="h-0.5 w-5 rounded bg-white/30" />
          <span className="mx-auto grid size-5 grid-cols-2 gap-px rounded-[3px] border border-highlight/70 p-[2px]">
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
          </span>
          <span className="h-0.5 w-8 rounded bg-white/25" />
        </div>
      </div>
    )
  if (item.kind === 'selfie')
    return (
      <div className="flex h-28 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#dcd3fb,#cfe0fd)]">
        <Avatar seed={name} name={name} size={64} />
      </div>
    )
  return (
    <div className="flex h-28 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#cdeee8,#e9f0fd)]">
      <div className="h-20 w-16 space-y-1.5 rounded-md bg-white p-2 shadow-sm">
        <span className="block h-1.5 w-8 rounded bg-teal/60" />
        <span className="block h-1 w-full rounded bg-line" />
        <span className="block h-1 w-10 rounded bg-line" />
        <span className="block h-1 w-full rounded bg-line" />
        <span className="block h-1 w-9 rounded bg-line" />
      </div>
    </div>
  )
}

function EvidencePanel({ vc, name }: { vc: VerificationCase; name: string }) {
  return (
    <Panel aria-labelledby="ev-title" className="overflow-hidden">
      <PanelHeader id="ev-title" title="Evidence" description="Synthetic placeholders. Full images are held in separate encrypted storage." />
      <ul className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
        {vc.evidence.map((e) => (
          <li key={e.id} className="rounded-2xl border border-line bg-white p-3">
            <EvidenceThumb item={e} name={name} />
            <p className="mt-3 text-[0.9375rem] font-medium text-ink">{e.label}</p>
            <p className="text-[0.875rem] text-slate">
              Uploaded {formatShortDate(e.uploadedAt)}
              {e.documentDate && ` · dated ${formatShortDate(e.documentDate)}`}
            </p>
            {e.aiNote && (
              <p className={cn('mt-2 rounded-lg px-2.5 py-1.5 text-[0.8125rem] leading-snug', e.aiCheck === 'flagged' ? 'bg-info-wash text-info' : 'bg-ai-wash text-ai')}>
                {e.aiCheck === 'flagged' ? 'Flagged: ' : 'AI check: '}
                {e.aiNote}
              </p>
            )}
          </li>
        ))}
        {vc.evidence.length === 0 && <li className="text-base text-slate">No evidence uploaded yet.</li>}
      </ul>
    </Panel>
  )
}

const checkLabel: Record<CheckResult, string> = { pass: 'Passed', fail: 'Failed', refer: 'Refer', pending: 'Pending', not_applicable: 'Not applicable' }

function ChecksPanel({ vc }: { vc: VerificationCase }) {
  const i = vc.idvt
  const rows: [string, CheckResult, string?][] = [
    ['Passport chip read', i.nfcChipRead, i.nfcChipRead === 'pass' ? 'Signature valid' : undefined],
    ['Document authenticity', i.documentAuthenticity],
    ['Liveness', i.liveness],
    ['Face match', i.faceMatch, i.faceMatchScore ? `${i.faceMatchScore}%` : undefined],
    ['PEP and sanctions', i.pepSanctions],
  ]
  return (
    <Panel aria-labelledby="idvt-title" className="overflow-hidden">
      <PanelHeader id="idvt-title" title="Identity checks" description={`Certified identity provider · Option ${vc.option}`} />
      <ul className="space-y-3 px-5 py-4 sm:px-6">
        {rows.map(([label, result, extra]) => (
          <li key={label} className="flex items-center gap-3">
            {result === 'pass' ? (
              <CompletionTick className="size-5" label="Passed" />
            ) : result === 'fail' ? (
              <CircleX className="size-5 text-decline" aria-label="Failed" />
            ) : (
              <span className="size-5 rounded-full border-[1.5px] border-line" aria-hidden="true" />
            )}
            <span className="flex-1 text-[0.9375rem] text-ink">{label}</span>
            <span className="text-[0.9375rem] text-slate">{extra ?? checkLabel[result]}</span>
          </li>
        ))}
      </ul>
      {i.pepSanctionsDetail && <p className="border-t border-line/70 px-5 py-3.5 text-[0.875rem] leading-snug text-slate sm:px-6">{i.pepSanctionsDetail}</p>}
      {i.providerReference && <p className="border-t border-line/70 px-5 py-3 font-mono text-[0.8125rem] text-slate sm:px-6">Ref {i.providerReference}</p>}
    </Panel>
  )
}

function DecisionPanel({ vc, mismatch, decidable, onDecide }: { vc: VerificationCase; mismatch: boolean; decidable: boolean; onDecide: (o: DecisionOutcome) => void }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const task = vc.correctionTaskId ? data.corrections.find((t) => t.id === vc.correctionTaskId) : undefined

  let body: ReactNode
  if (vc.status === 'halted_register_mismatch') {
    body = (
      <div className="space-y-4 p-5 sm:p-6">
        <p className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-graphite">
          <CirclePause className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
          Route A is paused until the register matches the identity document. This is a correction, never a resubmission.
        </p>
        {task && (
          <div className="rounded-2xl border border-line bg-mist/50 p-4">
            <p className="font-mono text-[0.8125rem] text-slate">
              {task.id} · {task.form}
            </p>
            <p className="mt-1 text-base text-ink">
              {task.field}: <span className="font-mono">{task.registerValue}</span> to <span className="font-mono">{task.correctValue}</span>
            </p>
          </div>
        )}
        <Button asChild className="w-full">
          <Link to="/acsp/filings">
            <Waypoints aria-hidden="true" />
            Open the Route B task
          </Link>
        </Button>
      </div>
    )
  } else if (vc.status === 'approved') {
    body = (
      <div className="space-y-4 p-5 sm:p-6">
        <p className="flex gap-2.5 text-[0.9375rem] text-graphite">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-approve" aria-hidden="true" />
          Approved {vc.decision && formatDateTime(vc.decision.decidedAt)}. Next, submit to Companies House.
        </p>
        <Button asChild className="w-full">
          <Link to={`/acsp/cases/${vc.id}/submit`}>
            <Send aria-hidden="true" />
            Prepare the submission
          </Link>
        </Button>
      </div>
    )
  } else if (vc.status === 'submitted') {
    body = (
      <div className="space-y-4 p-5 sm:p-6">
        <p className="flex gap-2.5 text-[0.9375rem] text-graphite">
          <CompletionTick className="size-5" label="Completed" />
          Submitted to Companies House. Personal code <span className="font-mono text-ink">{vc.submission?.personalCode}</span>.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to={`/records/${vc.id}`}>
            <FileCheck2 aria-hidden="true" />
            Open the verification record
          </Link>
        </Button>
      </div>
    )
  } else if (vc.status === 'declined') {
    body = (
      <div className="space-y-3 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">Declined {vc.decision && formatDateTime(vc.decision.decidedAt)}. The individual was told:</p>
        <p className="rounded-xl bg-decline-wash px-3.5 py-3 text-[0.9375rem] leading-relaxed text-decline">{DECLINE_MESSAGE}</p>
        <Button asChild variant="outline" className="w-full">
          <Link to={`/records/${vc.id}`}>
            <FileText aria-hidden="true" />
            Open the record
          </Link>
        </Button>
      </div>
    )
  } else {
    body = (
      <div className="space-y-2.5 p-5 sm:p-6">
        {vc.status === 'info_requested' && vc.decision?.note && (
          <p className="mb-2 rounded-xl bg-info-wash px-3.5 py-3 text-[0.9375rem] leading-relaxed text-info">Requested: {vc.decision.note}</p>
        )}
        {mismatch ? (
          <>
            <Button
              className="w-full bg-info text-white hover:bg-info/90"
              disabled={!decidable}
              onClick={() => {
                apply((d) => haltForMismatch(d, vc.id, REVIEWER))
                toast({ title: 'Verification paused', description: 'A Route B ACSP04 correction task was created.' })
              }}
            >
              <CirclePause aria-hidden="true" />
              Pause and open a register correction
            </Button>
            <div className="flex items-center justify-between rounded-lg border border-line bg-mist px-4 py-2.5 text-[0.9375rem] text-slate">
              <span className="inline-flex items-center gap-2">
                <CircleCheck className="size-4" aria-hidden="true" />
                Approve
              </span>
              <Lock className="size-4" aria-label="Locked until the register matches" />
            </div>
          </>
        ) : (
          <Button className="w-full bg-approve text-white hover:bg-approve/90" disabled={!decidable} onClick={() => onDecide('approve')}>
            <CircleCheck aria-hidden="true" />
            Approve
          </Button>
        )}
        <Button variant="outline" className="w-full border-info/40 text-info hover:bg-info-wash" disabled={!decidable} onClick={() => onDecide('request_info')}>
          <MessageSquareMore aria-hidden="true" />
          Request info
        </Button>
        <Button variant="outline" className="w-full border-decline/35 text-decline hover:bg-decline-wash" disabled={!decidable} onClick={() => onDecide('decline')}>
          <CircleX aria-hidden="true" />
          Decline
        </Button>
        <p className="pt-1 text-[0.875rem] leading-snug text-slate">Only an authorised reviewer can decide, with a fresh second factor. AI cannot.</p>
      </div>
    )
  }

  return (
    <Panel aria-labelledby="decision-title" className="overflow-hidden">
      <PanelHeader
        id="decision-title"
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-5" aria-hidden="true" />
            ACSP decision
          </span>
        }
        description="Human decision only"
      />
      {body}
    </Panel>
  )
}

function TimelinePanel({ caseId }: { caseId: string }) {
  const { data } = useDemoStore()
  const events = auditForCase(data, caseId).slice().reverse()
  return (
    <Panel aria-labelledby="tl-title" className="overflow-hidden">
      <PanelHeader
        id="tl-title"
        title="Case timeline"
        description="Append-only and hash-chained"
        actions={
          <Link to={`/records/${caseId}`} className="inline-flex items-center gap-1 text-[0.9375rem] text-ink underline-offset-4 hover:underline">
            Full record
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <ol className="relative px-5 py-5 sm:px-6">
        <span aria-hidden="true" className="absolute top-7 bottom-7 left-[2.05rem] w-px bg-line sm:left-[2.3rem]" />
        {events.map((e) => (
          <li key={e.seq} className="relative flex gap-4 pb-5 last:pb-0">
            <span
              className={cn(
                'relative z-10 mt-1 size-3 shrink-0 translate-x-[0.3rem] rounded-full ring-4 ring-white',
                e.actorType === 'ai' ? 'bg-ai' : e.actorType === 'system' ? 'bg-teal' : 'bg-ink',
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] leading-snug text-ink">{e.detail}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-[0.8125rem] text-slate">
                <span>{e.actor}</span>
                <span>{timeAgo(e.at)}</span>
                <span className="font-mono">
                  #{e.seq} {shortHash(e.hash)}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-line/70 px-5 py-3 text-[0.8125rem] text-slate sm:px-6">Opened {formatDate(data.cases.find((c) => c.id === caseId)!.createdAt)}</p>
    </Panel>
  )
}
