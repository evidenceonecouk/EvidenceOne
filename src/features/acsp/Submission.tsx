import { ArrowLeft, ExternalLink, FileCheck2, Loader2, LogIn, MailCheck, PenLine, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { MonoLabel, Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { Stepper } from '@/components/app/Stepper'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { OutcomeChip, RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Avatar } from '@/components/visual/Avatar'
import { PRIMARY_REVIEWER_ID } from '@/data/organisations'
import { formatDateTime, fullName } from '@/lib/format'
import { confirmSubmission, exampleVerificationReference, handOffSubmission, startSubmission, toggleSubmissionField } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { getAcsp, getCase, getPerson, isApprovedOrLater, isSubmitted } from '@/store/selectors'
import type { CaseStatus } from '@/types/domain'
import { CopyRow } from './CopyRow'
import { HandoffInterstitial, openHandoff, SUBMIT_SERVICE } from './Handoff'
import { submissionPack } from './submissionPack'

const STEPS = ['Approved', 'Submission started', 'Submitted', 'Confirmed']
const stepFor: Record<string, number> = { approved: 0, submission_started: 1, submitted: 2, confirmed: 4 }

/**
  The submission workspace. There is no public API for ACSP submissions, so the
  platform prepares every field ready to copy, hands off to GOV.UK One Login and
  records Companies House's verification reference. Companies House emails the
  personal code directly to the individual; Evidence One never receives it.
*/
export function Submission() {
  const { caseId = '' } = useParams()
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const acsp = vc && getAcsp(data, vc.acspId)
  const [stepUp, setStepUp] = useState(false)
  const [inline, setInline] = useState(false)
  const [reference, setReference] = useState('')
  const [reading, setReading] = useState(false)

  useEffect(() => {
    if (vc?.status === 'submitted' && !reference) setReference(exampleVerificationReference(vc.id))
  }, [vc?.status, vc?.id, reference])

  if (!vc || !person || !acsp) return <Page>Case not found.</Page>
  if (!isApprovedOrLater(vc.status)) {
    return (
      <Page width="narrow">
        <PageHeader title="Not ready to submit" description="The submission workspace opens only after the ACSP has approved the case." />
        <Button asChild variant="outline">
          <Link to={`/acsp/cases/${vc.id}`}>Back to the case</Link>
        </Button>
      </Page>
    )
  }

  const name = fullName(person)
  const pack = submissionPack(vc, person, acsp)
  const started = vc.status !== 'approved'
  const submitted = isSubmitted(vc.status)
  const doneKeys = submitted ? pack.map((f) => f.key) : (vc.submission?.fieldsDone ?? [])
  const groups = [...new Set(pack.map((f) => f.group))]
  const complete = pack.every((f) => f.value && f.value !== 'Not decided')

  const handoff = () => {
    apply((d) => handOffSubmission(d, vc.id, PRIMARY_REVIEWER_ID))
    if (!openHandoff(vc.id, 'submission')) setInline(true)
  }

  const record = (source: 'entered' | 'forwarded_email', ref = reference.trim().toUpperCase()) => {
    apply((d) => confirmSubmission(d, vc.id, ref, source, PRIMARY_REVIEWER_ID))
    toast({ title: 'Verification reference recorded', description: `Companies House will email the personal code directly to ${name}.` })
  }

  const forwarded = () => {
    setReading(true)
    window.setTimeout(() => {
      const ref = exampleVerificationReference(vc.id)
      setReference(ref)
      setReading(false)
      record('forwarded_email', ref)
    }, 1800)
  }

  return (
    <Page width="narrow">
      <Link to={`/acsp/cases/${vc.id}`} className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {name}
      </Link>
      <PageHeader
        kicker={`Submission workspace · ${vc.id}`}
        title={
          <span className="flex items-center gap-4">
            <Avatar seed={vc.personId} name={name} size={56} />
            Submit to Companies House
          </span>
        }
        description="Every field in the order the Companies House service asks for it. Copy each one, tick it when it is entered, then record the verification reference Companies House gives you."
      />
      <div className="mb-8">
        <Stepper steps={STEPS} current={stepFor[vc.status as CaseStatus] ?? 0} />
      </div>

      <div className="space-y-6">
        <Panel className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
          <RuleIdTag id="SUB-01" />
          <OutcomeChip outcome={complete ? 'pass' : 'block'} />
          <p className="min-w-0 flex-1 text-[0.9375rem] text-graphite">{complete ? 'The pack holds every item of the verification statement under Regulations 10 and 11.' : 'An item of the verification statement is missing. Submission is blocked.'}</p>
          {submitted && (
            <>
              <RuleIdTag id="SUB-02" />
              <OutcomeChip outcome="block" />
              <p className="w-full text-[0.9375rem] text-graphite sm:w-auto sm:flex-1">Already submitted. A second submission is blocked; corrections go through SUB-03.</p>
            </>
          )}
        </Panel>

        {groups.map((g) => (
          <Panel key={g} className="overflow-hidden">
            <PanelHeader title={g} />
            <dl className="divide-y divide-line/70">
              {pack
                .filter((f) => f.group === g)
                .map((f) => (
                  <CopyRow key={f.key} label={f.label} value={f.value} done={doneKeys.includes(f.key)} disabled={!started || submitted} onToggle={() => apply((d) => toggleSubmissionField(d, vc.id, f.key))} />
                ))}
            </dl>
          </Panel>
        ))}

        {vc.status === 'approved' && (
          <Panel className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mist text-ink">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-lg font-medium text-ink">Start the submission</p>
              <p className="mt-1 text-base text-graphite">Starting needs a step-up. The case moves to SUBMISSION_STARTED and the pack fields can be ticked off.</p>
            </div>
            <Button size="lg" onClick={() => setStepUp(true)}>
              Start submission
            </Button>
          </Panel>
        )}

        {vc.status === 'submission_started' && (
          <Panel className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mist text-ink">
                <LogIn className="size-6" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <p className="text-lg font-medium text-ink">{vc.submission?.handedOffAt ? 'Waiting for you to come back' : 'Ready for Companies House'}</p>
                <p className="mt-1 text-base text-graphite">
                  {doneKeys.length} of {pack.length} fields done. You sign in to ‘{SUBMIT_SERVICE}’ with your own GOV.UK One Login.
                </p>
              </div>
              <Button size="lg" onClick={handoff}>
                Continue to GOV.UK One Login
                <ExternalLink aria-hidden="true" />
              </Button>
            </div>
            {vc.submission?.handedOffAt && (
              <p className="mt-4 border-t border-line/70 pt-4 text-[0.9375rem] text-slate">
                A new window opened {formatDateTime(vc.submission.handedOffAt)}. Use “Simulate return to Evidence One” there.{' '}
                <button type="button" className="cursor-pointer text-ink underline underline-offset-4" onClick={() => setInline(true)}>
                  Show it here instead
                </button>
              </p>
            )}
          </Panel>
        )}

        {vc.status === 'submitted' && (
          <Panel className="p-5 sm:p-7">
            <MonoLabel>Back from Companies House</MonoLabel>
            <h2 className="mt-2 text-xl font-medium text-ink">Record the verification reference</h2>
            <p className="mt-2 text-base text-graphite">Enter the verification reference from Companies House’s confirmation, or forward the confirmation email to this case and it is read for you.</p>
            <label htmlFor="vref" className="mt-5 block text-[0.9375rem] font-medium text-ink">
              Verification reference
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              <input id="vref" value={reference} onChange={(e) => setReference(e.target.value.toUpperCase())} className="h-12 w-72 max-w-full rounded-xl border border-line bg-white px-4 font-mono text-lg tracking-[0.08em] text-ink uppercase outline-none focus:border-ink focus:ring-4 focus:ring-ink/10" />
              <Button size="lg" disabled={reference.trim().length < 8 || reading} onClick={() => record('entered')}>
                Record reference
              </Button>
            </div>
            <Button variant="outline" className="mt-4 disabled:opacity-100" disabled={reading} onClick={forwarded}>
              {reading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <MailCheck aria-hidden="true" />}
              {reading ? 'Reading the forwarded email' : 'I’ve forwarded the confirmation email to this case'}
            </Button>
          </Panel>
        )}

        {vc.status === 'confirmed' && (
          <Panel className="overflow-hidden">
            <div className="flex flex-col gap-5 bg-ink p-6 text-paper sm:flex-row sm:items-center sm:p-8">
              <CompletionTick className="size-12" label="Confirmed" />
              <div className="flex-1">
                <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/60 uppercase">Companies House verification reference</p>
                <p className="mt-1 font-mono text-2xl tracking-[0.08em]">{vc.submission?.verificationReference}</p>
                <p className="mt-2 text-base text-paper/80">Companies House will email the personal code directly to {name}. Evidence One does not receive or keep it.</p>
                <p className="mt-1 text-[0.875rem] text-paper/60">Recorded {vc.submission?.confirmedAt && formatDateTime(vc.submission.confirmedAt)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 p-5 sm:p-6">
              <Button asChild>
                <Link to={`/records/${vc.id}`}>
                  <FileCheck2 aria-hidden="true" />
                  Open the verification record
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/acsp/cases/${vc.id}/correct`}>
                  <PenLine aria-hidden="true" />
                  Correct submitted details
                </Link>
              </Button>
            </div>
          </Panel>
        )}
      </div>

      <StepUpDialog
        open={stepUp}
        action="start the submission"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          apply((d) => startSubmission(d, vc.id, PRIMARY_REVIEWER_ID, ref))
        }}
      />
      <Dialog open={inline} onOpenChange={setInline}>
        <DialogContent className="rounded-[24px] p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Continuing outside Evidence One</DialogTitle>
          <HandoffInterstitial caseId={vc.id} kind="submission" onDone={() => setInline(false)} />
        </DialogContent>
      </Dialog>
    </Page>
  )
}
