import { ArrowLeft, ArrowRight, BadgeCheck, CircleCheck, CirclePause, CircleX, FileCheck2, FileText, Lock, MessageSquareMore, Send, ShieldCheck, Sparkles, UserRoundCog, Waypoints } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { SlaPill } from '@/components/app/SlaPill'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { CaseStatusChip, OutcomeChip, RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { PRIMARY_REVIEWER_ID } from '@/data/organisations'
import { DECLINE_MESSAGE } from '@/data/reasonCodes'
import { highlightCite } from '@/lib/cite'
import { formatDate, formatDateTime, formatMoney, fullName, shortHash, timeAgo } from '@/lib/format'
import { currentRuleSet, evaluateCase, outstandingFor, ruleSetFor, type Outstanding } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { decideCase, escalateCase, reviewerName } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { auditForCase, getAgent, getCase, getCompany, getEntry, getPerson, isSubmitted, roleLabel } from '@/store/selectors'
import type { DecisionOutcome, VerificationCase } from '@/types/domain'
import { CopilotPanel } from '@/features/copilot/CopilotPanel'
import { DocumentSection, EvidenceSection, IdvtSection, Option2Section, PersonalSection, RegisterSection, ScreeningSection, type SectionProps } from './CaseSections'
import { DecisionDialog } from './DecisionDialog'

const REVIEWER = PRIMARY_REVIEWER_ID

export function CaseReview() {
  const { caseId = '' } = useParams()
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null)
  const [pending, setPending] = useState<{ outcome: DecisionOutcome; reason: string; note: string } | null>(null)
  const [copilot, setCopilot] = useState(false)
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const company = vc && getCompany(data, vc.companyNumber)
  const entry = vc && getEntry(data, vc)
  const results = useMemo(() => (vc ? evaluateCase(data, vc) : []), [data, vc])

  if (!vc || !person || !company || !entry) {
    return (
      <Page>
        <p className="text-lg text-ink">Case not found.</p>
      </Page>
    )
  }

  const name = fullName(person)
  const agent = vc.agentId ? getAgent(data, vc.agentId) : undefined
  const decidable = vc.status === 'in_review' || vc.status === 'info_requested'
  const outstanding = outstandingFor(results)
  const reviewer = data.acsps.flatMap((a) => a.reviewers).find((r) => r.id === (vc.reviewerId ?? REVIEWER))
  const props: SectionProps = { vc, person, entry, results, reviewerId: REVIEWER, decidable }
  const requestNote = outstanding
    .filter((o) => o.reason === 'request')
    .map((o) => o.title)
    .join(' ')

  const commit = (o: DecisionOutcome, reason: string, note: string, stepUpRef?: string) => {
    apply((d) => decideCase(d, vc.id, o, reason, note, REVIEWER, stepUpRef))
    toast({
      title: o === 'approve' ? 'Verification approved' : o === 'decline' ? 'Verification declined' : 'Information requested',
      description: o === 'approve' ? 'Next, prepare the Companies House submission.' : 'Recorded in the audit trail.',
    })
    if (o === 'approve') navigate(`/acsp/cases/${vc.id}/submit`)
  }

  const confirm = (reason: string, note: string) => {
    if (!outcome) return
    if (outcome === 'request_info') commit(outcome, reason, note)
    else setPending({ outcome, reason, note })
    setOutcome(null)
  }

  return (
    <div className={cn('transition-[padding] duration-300 ease-out', copilot && 'xl:pr-[27rem]')}>
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
                <span>{vc.origin === 'b2c' ? 'Direct client, allocated by rota' : `Referred by ${agent?.name}`}</span>
                <span>·</span>
                <span>Route A rule set {ruleSetFor(data, vc).version}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {vc.status === 'in_review' && vc.slaDueAt && (
              <div>
                <MonoLabel>Review target</MonoLabel>
                <div className="mt-1.5">
                  <SlaPill due={vc.slaDueAt} className="text-base" />
                </div>
              </div>
            )}
            <Button variant={copilot ? 'default' : 'outline'} onClick={() => setCopilot((o) => !o)} aria-expanded={copilot} aria-controls="copilot-panel">
              <Sparkles aria-hidden="true" />
              Ask the Copilot
            </Button>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[1fr_24rem]">
          <div className="min-w-0 space-y-6">
            <RegisterSection {...props} />
            <Option2Section {...props} reviewer={reviewer} />
            <DocumentSection {...props} />
            {vc.option === 1 && <IdvtSection {...props} />}
            <ScreeningSection {...props} />
            <EvidenceSection {...props} />
            <PersonalSection {...props} />
            <TimelinePanel caseId={vc.id} />
          </div>

          <div className="space-y-6 xl:sticky xl:top-24">
            <DecisionPanel vc={vc} outstanding={outstanding} decidable={decidable} onDecide={setOutcome} />
            {vc.payment && (
              <Panel className="p-5 sm:p-6">
                <MonoLabel>Payment</MonoLabel>
                <p className="mt-3 text-base text-ink">
                  {formatMoney(vc.payment.amount)} · {vc.payment.method === 'agent_payment_code' ? `Paid by ${vc.payment.payerName ?? 'the Agent'}` : 'Paid by card'}
                </p>
                <p className="font-mono text-[0.875rem] text-slate">{vc.payment.code ? `Single-use code ${vc.payment.code}` : vc.payment.reference}</p>
              </Panel>
            )}
          </div>
        </div>

        <DecisionDialog outcome={outcome} personName={name} defaultNote={requestNote} onClose={() => setOutcome(null)} onConfirm={confirm} />
        <StepUpDialog
          open={!!pending}
          action={pending?.outcome === 'approve' ? 'approve this verification' : 'decline this verification'}
          onClose={() => setPending(null)}
          onConfirmed={(ref) => {
            if (pending) commit(pending.outcome, pending.reason, pending.note, ref)
            setPending(null)
          }}
        />
      </Page>
      <CopilotPanel open={copilot} onClose={() => setCopilot(false)} scope={{ kind: 'case', caseId: vc.id }} />
    </div>
  )
}

const outstandingLabel: Record<Outstanding['reason'], string> = {
  block: 'Blocks approval',
  halt: 'Case halted',
  request: 'Waiting on a request',
  mandatory_open: 'Record your decision',
  not_satisfied: 'You recorded not satisfied',
}

function DecisionPanel({ vc, outstanding, decidable, onDecide }: { vc: VerificationCase; outstanding: Outstanding[]; decidable: boolean; onDecide: (o: DecisionOutcome) => void }) {
  const { data } = useDemoStore()
  const [escalating, setEscalating] = useState(false)
  const task = vc.correctionTaskId ? data.corrections.find((t) => t.id === vc.correctionTaskId) : undefined
  const escalate = currentRuleSet(data).settings.escalate_enabled

  let body: ReactNode
  if (vc.status === 'halted_register_mismatch') {
    body = (
      <div className="space-y-4 p-5 sm:p-6">
        <p className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-graphite">
          <CirclePause className="mt-0.5 size-5 shrink-0 text-info" aria-hidden="true" />
          Route A is halted under REG-11 until the register matches the identity document. The correction runs in Route B as form ACSP04, never a resubmission. The case resumes automatically once the register is updated.
        </p>
        {task && (
          <div className="rounded-2xl border border-line bg-mist/50 p-4">
            <p className="font-mono text-[0.8125rem] text-slate">
              {task.id} · {task.form} · {task.status === 'open' ? 'Open' : 'Filed, waiting for the register'}
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
  } else if (vc.status === 'approved' || vc.status === 'submission_started') {
    body = (
      <div className="space-y-4 p-5 sm:p-6">
        <p className="flex gap-2.5 text-[0.9375rem] text-graphite">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-approve" aria-hidden="true" />
          Approved {vc.decision && formatDateTime(vc.decision.decidedAt)}. {vc.status === 'submission_started' ? 'Submission in progress.' : 'Next, submit to Companies House.'}
        </p>
        <Button asChild className="w-full">
          <Link to={`/acsp/cases/${vc.id}/submit`}>
            <Send aria-hidden="true" />
            {vc.status === 'submission_started' ? 'Continue the submission' : 'Open the submission workspace'}
          </Link>
        </Button>
      </div>
    )
  } else if (isSubmitted(vc.status)) {
    body = (
      <div className="space-y-4 p-5 sm:p-6">
        <p className="flex gap-2.5 text-[0.9375rem] text-graphite">
          <CompletionTick className="size-5" label="Completed" />
          <span>
            Submitted to Companies House.{' '}
            {vc.submission?.verificationReference ? (
              <>
                Verification reference <span className="font-mono text-ink">{vc.submission.verificationReference}</span>.
              </>
            ) : (
              'Verification reference not yet recorded.'
            )}
          </span>
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link to={`/acsp/cases/${vc.id}/submit`}>
              <Send aria-hidden="true" />
              {vc.status === 'submitted' ? 'Record the verification reference' : 'Submission workspace'}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to={`/records/${vc.id}`}>
              <FileCheck2 aria-hidden="true" />
              Open the verification record
            </Link>
          </Button>
        </div>
      </div>
    )
  } else if (vc.status === 'declined') {
    body = (
      <div className="space-y-3 p-5 sm:p-6">
        <p className="text-[0.9375rem] text-graphite">Declined {vc.decision && formatDateTime(vc.decision.decidedAt)}. The individual was shown:</p>
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
    const blocked = outstanding.length > 0
    body = (
      <div className="space-y-2.5 p-5 sm:p-6">
        {vc.status === 'info_requested' && vc.decision?.note && <p className="mb-2 rounded-xl bg-info-wash px-3.5 py-3 text-[0.9375rem] leading-relaxed text-info">Requested: {vc.decision.note}</p>}
        {vc.escalatedTo && (
          <p className="mb-2 flex gap-2 rounded-xl bg-mist px-3.5 py-3 text-[0.9375rem] leading-relaxed text-graphite">
            <UserRoundCog className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Escalated to {reviewerName(data, vc.escalatedTo.reviewerId)} {timeAgo(vc.escalatedTo.at)}. Not decided.
          </p>
        )}
        {blocked ? (
          <div className="mb-3 rounded-2xl border border-line bg-mist/40 p-3.5">
            <p className="text-[0.9375rem] font-medium text-ink">Before you can approve ({outstanding.length})</p>
            <ul className="mt-2 space-y-1.5">
              {outstanding.map((o) => (
                <li key={o.ruleId + o.title}>
                  <button type="button" onClick={() => highlightCite(`rule:${o.ruleId}`)} className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-white">
                    <RuleIdTag id={o.ruleId} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.875rem] font-medium text-ink">{outstandingLabel[o.reason]}</span>
                      <span className="line-clamp-2 block text-[0.8125rem] leading-snug text-slate">{o.title}</span>
                    </span>
                    <OutcomeChip outcome={o.outcome} className="hidden 2xl:inline-flex" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          decidable && (
            <p className="mb-2 flex items-center gap-2 rounded-xl bg-approve-wash px-3.5 py-2.5 text-[0.9375rem] text-approve">
              <CircleCheck className="size-4" aria-hidden="true" />
              No Block, Halt or open Mandatory decision
            </p>
          )
        )}
        {blocked ? (
          <div className="flex items-center justify-between rounded-lg border border-line bg-mist px-4 py-2.5 text-[0.9375rem] text-slate" aria-disabled="true">
            <span className="inline-flex items-center gap-2">
              <CircleCheck className="size-4" aria-hidden="true" />
              Approve
            </span>
            <Lock className="size-4" aria-label="Locked until the items above are cleared" />
          </div>
        ) : (
          <Button className="w-full bg-approve text-white hover:bg-approve/90" disabled={!decidable} onClick={() => onDecide('approve')}>
            <CircleCheck aria-hidden="true" />
            Approve
          </Button>
        )}
        <Button variant="outline" className="w-full border-info/40 text-info hover:bg-info-wash" disabled={!decidable} onClick={() => onDecide('request_info')}>
          <MessageSquareMore aria-hidden="true" />
          Request information
        </Button>
        <Button variant="outline" className="w-full border-decline/35 text-decline hover:bg-decline-wash" disabled={!decidable} onClick={() => onDecide('decline')}>
          <CircleX aria-hidden="true" />
          Decline
        </Button>
        {escalate && (
          <Button variant="outline" className="w-full" disabled={!decidable || !!vc.escalatedTo} onClick={() => setEscalating(true)}>
            <UserRoundCog aria-hidden="true" />
            Escalate
          </Button>
        )}
        <p className="pt-1 text-[0.875rem] leading-snug text-slate">Only you can decide, with a step-up authentication. No rule and no AI ever approves or declines.</p>
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
      <EscalateDialog open={escalating} vc={vc} onClose={() => setEscalating(false)} />
    </Panel>
  )
}

function EscalateDialog({ open, vc, onClose }: { open: boolean; vc: VerificationCase; onClose: () => void }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const [note, setNote] = useState('')
  const seniors = data.acsps.flatMap((a) => a.reviewers).filter((r) => r.senior)
  const [to, setTo] = useState(seniors[0]?.id ?? '')
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-[24px]">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl font-medium">Escalate to a senior reviewer</DialogTitle>
          <DialogDescription className="text-base text-slate">The case moves to a named senior reviewer. Escalating does not decide it.</DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2">
          <legend className="text-[0.9375rem] font-medium text-ink">Senior reviewer</legend>
          {seniors.map((r) => (
            <label key={r.id} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3', to === r.id ? 'border-ink' : 'border-line')}>
              <input type="radio" name="senior" checked={to === r.id} onChange={() => setTo(r.id)} className="sr-only" />
              <Avatar seed={r.id} name={r.name} size={32} />
              <span>
                <span className="block text-base text-ink">{r.name}</span>
                <span className="block text-sm text-slate">{r.role}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <label htmlFor="esc-note" className="text-[0.9375rem] font-medium text-ink">
          Why are you escalating?
        </label>
        <textarea id="esc-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!note.trim() || !to}
            onClick={() => {
              apply((d) => escalateCase(d, vc.id, to, note.trim(), REVIEWER))
              toast({ title: 'Case escalated', description: 'Recorded in the audit trail. No decision was made.' })
              setNote('')
              onClose()
            }}
          >
            Escalate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
            <span className={cn('relative z-10 mt-1 size-3 shrink-0 translate-x-[0.3rem] rounded-full ring-4 ring-white', e.actorType === 'ai' ? 'bg-silver' : e.actorType === 'system' ? 'bg-slate' : 'bg-ink')} aria-hidden="true" />
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
