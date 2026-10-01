import { ArrowLeft, Check, Copy, ExternalLink, FileCheck2, Loader2, LogIn, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { MonoLabel, Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { Stepper } from '@/components/app/Stepper'
import { useToast } from '@/components/app/Toaster'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar } from '@/components/visual/Avatar'
import { formatDate, formatDateTime, fullName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { examplePersonalCode, handOffSubmission, recordSubmission } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { getAcsp, getCase, getCompany, getPerson, roleLabel } from '@/store/selectors'

const REVIEWER = 'rev-marsh'
const STEPS = ['Approved', 'Pack ready', 'GOV.UK One Login', 'Outcome recorded']
const docLabel = { passport: 'Passport', driving_licence: 'Photocard driving licence', national_identity_card: 'National identity card', biometric_residence_permit: 'Biometric residence permit' } as const

/*
  There is no public API for ACSP submissions, so the platform prepares every
  field ready to copy, hands off to GOV.UK One Login and records the outcome.
*/
export function Submission() {
  const { caseId = '' } = useParams()
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const company = vc && getCompany(data, vc.companyNumber)
  const entry = vc && data.register.find((r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber)
  const acsp = vc && getAcsp(data, vc.acspId)
  const [handoff, setHandoff] = useState<'closed' | 'leaving' | 'away'>('closed')
  const [code, setCode] = useState('')

  if (!vc || !person || !company || !entry || !acsp) return <Page>Case not found.</Page>
  if (!['approved', 'submitted'].includes(vc.status)) {
    return (
      <Page>
        <PageHeader title="Not ready to submit" description="A case can only be submitted to Companies House after the ACSP has approved it." />
        <Button asChild variant="outline">
          <Link to={`/acsp/cases/${vc.id}`}>Back to the case</Link>
        </Button>
      </Page>
    )
  }

  const reviewer = acsp.reviewers.find((r) => r.id === (vc.reviewerId ?? REVIEWER)) ?? acsp.reviewers[0]
  const doc = person.document
  const done = vc.status === 'submitted'
  const handedOff = !!vc.submission?.handedOffAt
  const step = done ? 4 : handedOff ? 3 : 2

  const sections: { title: string; rows: [string, string][] }[] = [
    {
      title: 'The person',
      rows: [
        ['Full name', fullName(person)],
        ['Former names', person.formerNames?.join(', ') || 'None'],
        ['Date of birth', formatDate(person.dateOfBirth)],
        ['Email address', person.email],
      ],
    },
    {
      title: 'Their company',
      rows: [
        ['Company name', company.name],
        ['Company number', company.number],
        ['Role', roleLabel[entry.role]],
      ],
    },
    {
      title: 'Documents used',
      rows: doc
        ? [
            ['Document type', docLabel[doc.type]],
            ['Issuing country', doc.issuingCountry],
            ['Document number', `Held securely, ends ${doc.numberLastTwo}`],
            ['Name on document', doc.nameOnDocument],
            ['Expiry date', formatDate(doc.expiresOn)],
          ]
        : [['Document', 'Not recorded']],
    },
    {
      title: 'Checks and confirmation',
      rows: [
        ['Verification option', `Option ${vc.option}: certified identity provider`],
        ['Checks completed', 'Chip read, authenticity, liveness, face match, PEP and sanctions'],
        ['Decision', `Approved ${vc.decision ? formatDateTime(vc.decision.decidedAt) : ''}`],
        ['Confirmation', 'Checks completed to verify identity to the required standard'],
        ['ACSP', `${acsp.name} · ${acsp.acspNumber}`],
      ],
    },
  ]

  const startHandoff = () => {
    setHandoff('leaving')
    apply((d) => handOffSubmission(d, vc.id, reviewer.id))
    window.setTimeout(() => setHandoff('away'), 1200)
  }

  const record = () => {
    apply((d) => recordSubmission(d, vc.id, code.trim().toUpperCase(), reviewer.id))
    toast({ title: 'Personal code recorded', description: 'The verification record is complete.' })
  }

  return (
    <Page width="narrow">
      <Link to={`/acsp/cases/${vc.id}`} className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {fullName(person)}
      </Link>
      <PageHeader
        kicker={`Submit to Companies House · ${vc.id}`}
        title={
          <span className="flex items-center gap-4">
            <Avatar seed={vc.personId} name={fullName(person)} size={56} />
            Submission pack
          </span>
        }
        description="Every field Companies House asks for, ready to copy into GOV.UK One Login. There is no public API for this step today, so the platform prepares the pack and records the outcome."
      />
      <div className="mb-8">
        <Stepper steps={STEPS} current={step} />
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <Panel key={s.title} className="overflow-hidden">
            <PanelHeader title={s.title} />
            <dl className="divide-y divide-line/70">
              {s.rows.map(([k, v]) => (
                <CopyRow key={k} label={k} value={v} />
              ))}
            </dl>
          </Panel>
        ))}

        {done ? (
          <Panel className="overflow-hidden">
            <div className="flex flex-col gap-5 bg-ink p-6 text-paper sm:flex-row sm:items-center sm:p-8">
              <CompletionTick className="size-12" label="Recorded" />
              <div className="flex-1">
                <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-paper/60 uppercase">Companies House personal code</p>
                <p className="mt-1 font-mono text-3xl tracking-[0.14em]">{vc.submission?.personalCode}</p>
                <p className="mt-1 text-[0.9375rem] text-paper/70">Recorded {vc.submission?.submittedAt && formatDateTime(vc.submission.submittedAt)}</p>
              </div>
              <Button asChild variant="inverse" size="lg">
                <Link to={`/records/${vc.id}`}>
                  <FileCheck2 aria-hidden="true" />
                  Open the record
                </Link>
              </Button>
            </div>
          </Panel>
        ) : handedOff ? (
          <Panel className="p-5 sm:p-7">
            <MonoLabel>Back from GOV.UK One Login</MonoLabel>
            <h2 className="mt-2 text-xl font-medium text-ink">Record the outcome</h2>
            <p className="mt-2 text-base text-graphite">Enter the personal code Companies House issued for {person.givenNames.split(' ')[0]}.</p>
            <label htmlFor="pcode" className="mt-5 block text-[0.9375rem] font-medium text-ink">
              Personal code
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              <input
                id="pcode"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={11}
                className="h-12 w-64 rounded-xl border border-line bg-white px-4 font-mono text-lg tracking-[0.12em] text-ink uppercase outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
              />
              <Button variant="outline" onClick={() => setCode(examplePersonalCode(vc.id))}>
                Fill an example code
              </Button>
            </div>
            <Button size="lg" className="mt-5" disabled={code.trim().length !== 11} onClick={record}>
              <Check aria-hidden="true" />
              Record personal code
            </Button>
          </Panel>
        ) : (
          <Panel className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-progress-wash text-progress">
              <LogIn className="size-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-lg font-medium text-ink">Ready to submit</p>
              <p className="mt-1 text-base text-graphite">You will sign in to GOV.UK One Login as {reviewer.name} and enter these details. Then come back here to record the outcome.</p>
            </div>
            <Button size="lg" onClick={startHandoff}>
              Continue to GOV.UK One Login
              <ExternalLink aria-hidden="true" />
            </Button>
          </Panel>
        )}
      </div>

      <Dialog open={handoff !== 'closed'} onOpenChange={(o) => !o && setHandoff('closed')}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-medium">{handoff === 'leaving' ? 'Leaving Evidence One' : 'You are on GOV.UK One Login'}</DialogTitle>
            <DialogDescription className="text-base text-slate">
              {handoff === 'leaving'
                ? 'Opening GOV.UK One Login in a new window.'
                : 'In the real platform this happens on the GOV.UK website. This demonstration does not show or imitate that service.'}
            </DialogDescription>
          </DialogHeader>
          {handoff === 'leaving' ? (
            <p className="flex items-center gap-2 text-base text-graphite" role="status">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              Handing off
            </p>
          ) : (
            <Button size="lg" onClick={() => setHandoff('closed')}>
              <Undo2 aria-hidden="true" />
              Simulate return to Evidence One
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </Page>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard can be blocked; the visual confirmation still helps the presenter.
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
      <dt className="w-44 shrink-0 text-[0.9375rem] text-slate">{label}</dt>
      <dd className="min-w-0 flex-1 text-base break-words text-ink">{value}</dd>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label}`}
        className={cn(
          'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[0.875rem] transition-colors duration-150',
          copied ? 'border-approve/30 bg-approve-wash text-approve' : 'border-line bg-white text-ink hover:bg-mist',
        )}
      >
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
