import { ChevronRight, CreditCard, FileUp, Loader2, Lock, Sparkles, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AttributionNote } from '@/components/AttributionNote'
import { CompletionTick, PendingMarker } from '@/components/brand/CompletionTick'
import { Checkbox } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { DECLINE_MESSAGE } from '@/data/reasonCodes'
import { useNow } from '@/hooks/useNow'
import { formatAddress, formatDateTime, formatMoney, timeRemaining, VERIFICATION_FEE } from '@/lib/format'
import { cn } from '@/lib/utils'
import { submitForReview, updateJourney } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { reviewerOrgName } from '@/store/selectors'
import type { Payment } from '@/types/domain'
import { Lead, Screen, ScreenTitle } from '../JourneyShell'
import type { StepProps } from './types'

const evidenceChecks = ['Dated within the last 3 months', 'Your name matches', 'Your current address matches']

export function EvidenceStep({ vc, person, next }: StepProps) {
  const { apply } = useDemoStore()
  const uploaded = !!vc.journey?.evidenceUploaded
  const [phase, setPhase] = useState<'idle' | 'checking' | 'done'>(uploaded ? 'done' : 'idle')
  const [resolved, setResolved] = useState(uploaded ? evidenceChecks.length : 0)
  const current = person.addressHistory.find((a) => !a.to)

  useEffect(() => {
    if (phase !== 'checking') return
    if (resolved >= evidenceChecks.length) {
      setPhase('done')
      apply((d) => updateJourney(d, vc.id, { evidenceUploaded: true }, { action: 'ai.evidence_checked', detail: 'Bank statement checked at upload: dated within 3 months, name and current address match. Advisory only.', actorType: 'ai' }))
      return
    }
    const id = window.setTimeout(() => setResolved((r) => r + 1), 650)
    return () => window.clearTimeout(id)
  }, [phase, resolved, apply, vc.id])

  return (
    <Screen
      footer={
        phase === 'done' ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button className="w-full disabled:opacity-100" size="lg" disabled={phase === 'checking'} onClick={() => setPhase('checking')}>
            {phase === 'checking' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <FileUp aria-hidden="true" />}
            {phase === 'checking' ? 'Checking your document' : 'Upload a bank statement'}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Supporting evidence">One more document, for your address</ScreenTitle>
      <Lead>You moved in the last 12 months, so your identity document cannot confirm your address history. This is supporting evidence, not a second ID.</Lead>
      <div className="mt-5 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-slate">Current address</p>
        <p className="mt-0.5 text-base text-ink">{current && formatAddress(current.address)}</p>
      </div>
      <p className="mt-4 text-[0.9375rem] text-graphite">A bank or credit card statement, a utility or council tax bill, or an insurance document, dated within the last 3 months.</p>

      {phase !== 'idle' && (
        <div className="mt-5 rounded-2xl border border-line bg-white p-4" aria-live="polite">
          <p className="flex items-center gap-2 font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Checked at upload · advisory
          </p>
          <p className="mt-2 text-base font-medium text-ink">bank-statement-september.pdf</p>
          <ul className="mt-3 space-y-2">
            {evidenceChecks.map((c, i) => (
              <li key={c} className="flex items-center gap-2.5 text-[0.9375rem]">
                {i < resolved ? <CompletionTick className="size-5" label="Passed" /> : <Loader2 className="size-5 animate-spin text-slate" aria-label="Checking" />}
                <span className={i < resolved ? 'text-ink' : 'text-slate'}>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Screen>
  )
}

export function PaymentStep({ vc, next }: StepProps) {
  const { data, apply } = useDemoStore()
  const invite = data.invites.find((i) => i.caseId === vc.id)
  const prepaid = invite?.paymentCode
  const payer = prepaid ? data.agents.find((a) => a.paymentCode === prepaid) : undefined
  const [method, setMethod] = useState<'card' | 'code'>('card')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'choose' | 'processing' | 'paid'>(vc.journey?.paid ? 'paid' : 'choose')
  const codeOwner = data.agents.find((a) => a.paymentCode && a.paymentCode === code.trim().toUpperCase())

  const pay = () => {
    setStage('processing')
    window.setTimeout(() => setStage('paid'), 1400)
  }

  useEffect(() => {
    if (stage === 'paid' && !vc.journey?.paid) apply((d) => updateJourney(d, vc.id, { paid: true }))
  }, [stage, apply, vc.id, vc.journey?.paid])

  if (prepaid) {
    return (
      <Screen
        footer={
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        }
      >
        <ScreenTitle kicker="Payment">Nothing to pay</ScreenTitle>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
          <CompletionTick label="Paid" />
          <div>
            <p className="text-base font-medium text-ink">Paid by {payer?.name}</p>
            <p className="mt-0.5 text-[0.9375rem] text-slate">
              Agent Payment Code <span className="font-mono text-ink">{prepaid}</span> · {formatMoney(VERIFICATION_FEE)}
            </p>
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      footer={
        stage === 'paid' ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button className={cn('w-full', stage === 'processing' && 'disabled:opacity-100')} size="lg" disabled={stage === 'processing' || (method === 'code' && !codeOwner)} onClick={pay}>
            {stage === 'processing' ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Processing
              </>
            ) : method === 'card' ? (
              <>
                <Lock aria-hidden="true" />
                Pay {formatMoney(VERIFICATION_FEE)}
              </>
            ) : (
              'Apply code'
            )}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Payment">{stage === 'paid' ? 'Payment complete' : `${formatMoney(VERIFICATION_FEE)} verification fee`}</ScreenTitle>
      {stage === 'paid' ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
          <CompletionTick label="Paid" />
          <div>
            <p className="text-base font-medium text-ink">{method === 'card' ? `${formatMoney(VERIFICATION_FEE)} paid by card` : `Paid by ${codeOwner?.name}`}</p>
            <p className="mt-0.5 text-[0.9375rem] text-slate">{method === 'card' ? 'Card ending 4242 · simulated payment' : `Agent Payment Code ${code.toUpperCase()}`}</p>
          </div>
        </div>
      ) : (
        <>
          <Lead>One flat fee. Card details are entered on the payment provider’s page and never reach Evidence One.</Lead>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {(
              [
                ['card', 'Pay myself', CreditCard],
                ['code', 'Payment code', Ticket],
              ] as const
            ).map(([m, label, Icon]) => (
              <button
                key={m}
                type="button"
                aria-pressed={method === m}
                onClick={() => setMethod(m)}
                className={cn('flex cursor-pointer flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left text-base transition-[border-color,box-shadow] duration-150', method === m ? 'border-ink text-ink shadow-[0_0_0_1px_var(--ink)]' : 'border-line text-graphite')}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          {method === 'card' ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-line bg-white p-4 text-[0.9375rem]">
              <p className="text-slate">Card number</p>
              <p className="font-mono text-ink tabular">4242 4242 4242 4242</p>
              <p className="text-sm text-slate">Simulated checkout for this demonstration.</p>
            </div>
          ) : (
            <div className="mt-4">
              <label htmlFor="apc" className="text-[0.9375rem] font-medium text-ink">
                Agent Payment Code
              </label>
              <input
                id="apc"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="APC-XX-XXXX"
                autoCapitalize="characters"
                className="mt-2 h-12 w-full rounded-xl border border-line bg-white px-3.5 font-mono text-base text-ink uppercase outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
              />
              <p className="mt-2 text-sm text-slate" aria-live="polite">
                {codeOwner ? `Code accepted. Paid by ${codeOwner.name}.` : 'Try APC-BF-3M8T from Belgrave Family Office.'}
              </p>
            </div>
          )}
        </>
      )}
    </Screen>
  )
}

export function ReviewStep({ vc, person, company, next }: StepProps) {
  const { data, apply } = useDemoStore()
  const [declared, setDeclared] = useState(false)
  const invite = data.invites.find((i) => i.caseId === vc.id)
  const acsp = reviewerOrgName(data, vc.acspId)
  const docType = vc.journey?.documentType ?? 'passport'
  const rows: [string, string][] = [
    ['Person', `${person.givenNames} ${person.familyName}`],
    ['Company', company.name],
    ['Identity document', docType === 'passport' ? 'Passport, chip read' : 'Photo ID, scanned'],
    ['Checks', 'Authenticity, liveness, face match, PEP and sanctions'],
    ['Supporting evidence', vc.journey?.evidenceUploaded ? 'Bank statement' : 'Not needed'],
    ['Payment', invite?.paymentCode ? `Agent Payment Code ${invite.paymentCode}` : `${formatMoney(VERIFICATION_FEE)} by card`],
  ]

  const submit = () => {
    const payment: Payment = invite?.paymentCode
      ? { method: 'agent_payment_code', amount: VERIFICATION_FEE, code: invite.paymentCode, paidAt: new Date().toISOString(), reference: `PAY-2026-00${vc.id.slice(-4)}` }
      : { method: 'pay_myself', amount: VERIFICATION_FEE, paidAt: new Date().toISOString(), reference: `PAY-2026-00${vc.id.slice(-4)}` }
    apply((d) => submitForReview(d, { caseId: vc.id, documentType: docType, payment, evidenceUploaded: !!vc.journey?.evidenceUploaded }))
    next()
  }

  return (
    <Screen
      footer={
        <Button className="w-full" size="lg" disabled={!declared} onClick={submit}>
          Submit for review
        </Button>
      }
    >
      <ScreenTitle kicker="Check and submit">Ready to send to {acsp}</ScreenTitle>
      <dl className="mt-5 divide-y divide-line/70 rounded-2xl border border-line bg-white">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="text-[0.9375rem] text-slate">{k}</dt>
            <dd className="text-right text-[0.9375rem] text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed text-ink">
        <Checkbox className="mt-0.5" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
        I confirm the information I have given is true, and that the identity document is mine.
      </label>
      <AttributionNote acspName={acsp} className="mt-5 text-[0.9375rem]" />
    </Screen>
  )
}

export function StatusStep({ vc }: StepProps) {
  const { data } = useDemoStore()
  const now = useNow(30000)
  const acsp = reviewerOrgName(data, vc.acspId)
  const s = vc.status
  const decided = ['approved', 'submitted', 'declined'].includes(s)
  const reviewing = s === 'in_review' || s === 'halted_register_mismatch' || s === 'info_requested'
  const steps = [
    { label: 'Details confirmed', done: true },
    { label: vc.option === 2 ? 'Human check requested' : 'Identity checks complete', done: true },
    { label: 'Submitted for review', done: reviewing || decided },
    { label: `Review by ${acsp}`, done: decided && s !== 'declined', current: reviewing },
    { label: 'Submitted to Companies House', done: s === 'submitted' },
    { label: 'Personal code issued', done: !!vc.submission?.personalCode },
  ]
  const t = vc.slaDueAt ? timeRemaining(vc.slaDueAt, now) : undefined

  return (
    <Screen>
      <ScreenTitle kicker={`Case ${vc.id}`}>
        {s === 'submitted' ? 'Your identity verification is complete' : s === 'declined' ? 'Your verification was not approved' : vc.option === 2 ? 'Your ACSP will be in touch' : 'Your verification has been sent for review'}
      </ScreenTitle>
      {s === 'declined' ? (
        <p className="mt-3 rounded-2xl bg-decline-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-decline">{DECLINE_MESSAGE}</p>
      ) : s === 'info_requested' ? (
        <p className="mt-3 rounded-2xl bg-info-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-info">{vc.decision?.note ?? 'Your ACSP has asked for more information.'}</p>
      ) : s === 'halted_register_mismatch' ? (
        <p className="mt-3 rounded-2xl bg-info-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-info">Your details do not match the Companies House register yet. The register is being corrected, then your verification carries on.</p>
      ) : (
        <Lead>{reviewing && t && !t.overdue ? `A decision is due within ${t.hours} hours.` : 'We will let you know as soon as anything changes.'}</Lead>
      )}
      <ol className="mt-6 space-y-3.5">
        {steps.map((st, i) => (
          <li key={st.label} className="flex items-center gap-3">
            {st.done ? <CompletionTick label="Completed" /> : <PendingMarker step={i + 1} className={st.current ? 'border-ink text-ink' : undefined} />}
            <span className={cn('text-base', st.done ? 'text-ink' : st.current ? 'font-medium text-ink' : 'text-slate')}>{st.label}</span>
          </li>
        ))}
      </ol>
      {vc.submission?.personalCode && (
        <div className="mt-6 rounded-2xl bg-ink p-5 text-paper">
          <p className="font-mono text-[0.75rem] tracking-[0.14em] text-paper/60 uppercase">Companies House personal code</p>
          <p className="mt-2 font-mono text-2xl tracking-[0.12em]">{vc.submission.personalCode}</p>
          {vc.submission.submittedAt && <p className="mt-2 text-sm text-paper/70">Recorded {formatDateTime(vc.submission.submittedAt)}</p>}
        </div>
      )}
      <AttributionNote acspName={acsp} className="mt-auto pt-8 text-[0.9375rem]" />
    </Screen>
  )
}
