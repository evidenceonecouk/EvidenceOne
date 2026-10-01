import {
  ChevronRight,
  CreditCard,
  FileUp,
  Info,
  Loader2,
  Lock,
  Sparkles,
  Ticket,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { AttributionNote } from '@/components/AttributionNote'
import {
  CompletionTick,
  PendingMarker,
} from '@/components/brand/CompletionTick'
import { Checkbox } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { AI_LABEL } from '@/components/visual/AiObservationCard'
import { ALREADY_VERIFIED_MESSAGE, DECLINE_MESSAGE } from '@/data/reasonCodes'
import { useNow } from '@/hooks/useNow'
import {
  formatAddress,
  formatMoney,
  timeRemaining,
  VERIFICATION_FEE,
} from '@/lib/format'
import { currentRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import {
  recordPayment,
  stopAlreadyVerified,
  submitForReview,
  updateJourney,
} from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { isSubmitted, reviewerOrgName } from '@/store/selectors'
import type { Payment } from '@/types/domain'
import { journeyTriggers } from '../journey'
import { Lead, Screen, ScreenTitle } from '../JourneyShell'
import type { StepProps } from './types'

const ACCEPTED = [
  'Bank or credit card statement with recent transactions',
  'Utility or council tax bill',
  'Insurance policy document showing your home address',
  'Evidence of recent passport use',
]

/** One supporting document, asked for only when a rule calls for it (ADDL-01 to ADDL-03). Never a second identity document. */
export function EvidenceStep({ vc, person, next }: StepProps) {
  const { data, apply } = useDemoStore()
  const months = currentRuleSet(data).params.supporting_evidence_months
  const triggers = journeyTriggers(data, vc)
  const uploaded = !!vc.journey?.evidenceUploaded
  const checks = [
    `Dated within the last ${months} months`,
    'Your name matches',
    'Your current address matches',
  ]
  const [phase, setPhase] = useState<'idle' | 'checking' | 'done'>(
    uploaded ? 'done' : 'idle',
  )
  const [resolved, setResolved] = useState(uploaded ? checks.length : 0)
  const current = person.addressHistory.find((a) => !a.to)

  useEffect(() => {
    if (phase !== 'checking') return
    if (resolved >= checks.length) {
      setPhase('done')
      apply((d) =>
        updateJourney(
          d,
          vc.id,
          { evidenceUploaded: true },
          {
            action: 'ai.evidence_checked',
            detail: `AI observation: bank statement checked at upload. Appears dated within ${months} months and shows the declared name and current address. Advisory only; rules ADDL-11 to ADDL-13 decide what happens next.`,
            actorType: 'ai',
          },
        ),
      )
      return
    }
    const id = window.setTimeout(() => setResolved((r) => r + 1), 650)
    return () => window.clearTimeout(id)
  }, [phase, resolved, apply, vc.id, months, checks.length])

  return (
    <Screen
      footer={
        phase === 'done' ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button
            className="w-full disabled:opacity-100"
            size="lg"
            disabled={phase === 'checking'}
            onClick={() => setPhase('checking')}
          >
            {phase === 'checking' ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <FileUp aria-hidden="true" />
            )}
            {phase === 'checking'
              ? 'Checking your document'
              : 'Upload a document'}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Supporting evidence">
        We need one supporting document
      </ScreenTitle>
      <Lead>
        This is not a second identity document. It shows your current address.
      </Lead>
      <ul className="mt-4 space-y-2">
        {triggers.map((t) => (
          <li
            key={t.ruleId}
            className="flex gap-2.5 rounded-2xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite"
          >
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {t.reason}{' '}
              <span className="font-mono text-[0.8125rem] text-slate">
                {t.ruleId}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-slate">Current address</p>
        <p className="mt-0.5 text-base text-ink">
          {current && formatAddress(current.address)}
        </p>
      </div>
      <p className="mt-4 text-[0.9375rem] font-medium text-ink">
        Any one of these, dated within the last {months} months:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem] text-graphite">
        {ACCEPTED.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>

      {phase !== 'idle' && (
        <div
          className="mt-5 rounded-2xl border border-line bg-white p-4"
          aria-live="polite"
        >
          <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-graphite">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {AI_LABEL}
          </p>
          <p className="mt-2 text-base font-medium text-ink">
            bank-statement-september.pdf
          </p>
          <ul className="mt-3 space-y-2">
            {checks.map((c, i) => (
              <li
                key={c}
                className="flex items-center gap-2.5 text-[0.9375rem]"
              >
                {i < resolved ? (
                  <CompletionTick className="size-5" label="Looks right" />
                ) : (
                  <Loader2
                    className="size-5 animate-spin text-slate"
                    aria-label="Checking"
                  />
                )}
                <span className={i < resolved ? 'text-ink' : 'text-slate'}>
                  {c}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate">
            Your ACSP reviews this. The AI only points things out; it never
            decides.
          </p>
        </div>
      )}
    </Screen>
  )
}

/** Payment comes after personal information and before the identity checks. */
export function PaymentStep({ vc, entry, next, go }: StepProps) {
  const { data, apply } = useDemoStore()
  const invite = data.invites.find((i) => i.caseId === vc.id)
  const prepaid = invite?.paymentCode
  const agent = data.agents.find((a) => a.id === invite?.agentId)
  const [method, setMethod] = useState<'card' | 'code'>('card')
  const [code, setCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const paid = !!vc.journey?.paid
  const typed = code.trim().toUpperCase()
  const codeOwner = data.agents.find(
    (a) =>
      a.paymentCode &&
      typed.startsWith(`${a.paymentCode}-`) &&
      /^APC-[A-Z]{2}-[A-Z0-9]{4}$/.test(typed) &&
      !data.invites.some((i) => i.paymentCode === typed && i.caseId !== vc.id),
  )
  const ref = `PAY-2026-00${vc.id.slice(-4)}`

  if (
    entry.identityVerified &&
    !vc.journey?.alreadyVerifiedAcknowledged &&
    !paid
  ) {
    return (
      <Screen
        footer={
          <>
            <Button
              className="w-full"
              size="lg"
              onClick={() =>
                apply((d) =>
                  updateJourney(
                    d,
                    vc.id,
                    { alreadyVerifiedAcknowledged: true },
                    {
                      action: 'case.already_verified.continued',
                      detail:
                        'REG-04 notice shown before payment. The individual chose to continue.',
                    },
                  ),
                )
              }
            >
              Continue anyway
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => {
                apply((d) => stopAlreadyVerified(d, vc.id))
                go('status')
              }}
            >
              Stop here
            </Button>
          </>
        }
      >
        <ScreenTitle kicker="Before you pay">
          You may not need to do this
        </ScreenTitle>
        <p className="mt-4 flex gap-3 rounded-2xl border border-line bg-white p-4 text-base leading-relaxed text-ink">
          <Info className="mt-1 size-5 shrink-0" aria-hidden="true" />
          {ALREADY_VERIFIED_MESSAGE}
        </p>
        <Lead>
          If you continue, nothing changes on the register until your ACSP
          submits the verification. If you stop, nothing is paid.
        </Lead>
      </Screen>
    )
  }

  const pay = (payment: Payment) => {
    setProcessing(true)
    window.setTimeout(() => {
      apply((d) => recordPayment(d, vc.id, payment))
      setProcessing(false)
    }, 1200)
  }

  const done = paid ? vc.journey?.payment : undefined

  if (prepaid) {
    return (
      <Screen
        footer={
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              if (!paid)
                apply((d) =>
                  recordPayment(d, vc.id, {
                    method: 'agent_payment_code',
                    amount: VERIFICATION_FEE,
                    code: prepaid,
                    payerName: agent?.name,
                    paidAt: new Date().toISOString(),
                    reference: ref,
                  }),
                )
              next()
            }}
          >
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        }
      >
        <ScreenTitle kicker="Payment">Nothing to pay</ScreenTitle>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
          <CompletionTick label="Paid" />
          <div>
            <p className="text-base font-medium text-ink">
              Paid by {agent?.name} with an Agent Payment Code
            </p>
            <p className="mt-0.5 text-[0.9375rem] text-slate">
              Single-use code{' '}
              <span className="font-mono text-ink">{prepaid}</span>, for this
              invite only · {formatMoney(VERIFICATION_FEE)}
            </p>
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      footer={
        done ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button
            className={cn('w-full', processing && 'disabled:opacity-100')}
            size="lg"
            disabled={processing || (method === 'code' && !codeOwner)}
            onClick={() =>
              pay(
                method === 'card'
                  ? {
                      method: 'pay_myself',
                      amount: VERIFICATION_FEE,
                      paidAt: new Date().toISOString(),
                      reference: ref,
                    }
                  : {
                      method: 'agent_payment_code',
                      amount: VERIFICATION_FEE,
                      code: typed,
                      payerName: codeOwner?.name,
                      paidAt: new Date().toISOString(),
                      reference: ref,
                    },
              )
            }
          >
            {processing ? (
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
      <ScreenTitle kicker="Payment">
        {done
          ? 'Payment complete'
          : `${formatMoney(VERIFICATION_FEE)} verification fee`}
      </ScreenTitle>
      {done ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
          <CompletionTick label="Paid" />
          <div>
            <p className="text-base font-medium text-ink">
              {done.method === 'pay_myself'
                ? `${formatMoney(VERIFICATION_FEE)} paid by card`
                : `Paid by ${done.payerName} with an Agent Payment Code`}
            </p>
            <p className="mt-0.5 text-[0.9375rem] text-slate">
              {done.method === 'pay_myself'
                ? 'Card ending 4242 · simulated payment'
                : `Single-use code ${done.code}`}
            </p>
          </div>
        </div>
      ) : (
        <>
          <Lead>
            One flat fee, paid before the identity checks. Card details are
            entered on the payment provider’s page and never reach Evidence One.
          </Lead>
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
                className={cn(
                  'flex cursor-pointer flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left text-base transition-[border-color,box-shadow] duration-150',
                  method === m
                    ? 'border-ink text-ink shadow-[0_0_0_1px_var(--ink)]'
                    : 'border-line text-graphite',
                )}
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
              <p className="text-sm text-slate">
                Simulated checkout for this demonstration.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <label
                htmlFor="apc"
                className="text-[0.9375rem] font-medium text-ink"
              >
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
                {codeOwner
                  ? `Code accepted. Paid by ${codeOwner.name}. Single use.`
                  : 'A single-use code from an Agent, family office or introducer. Try APC-BF-7K2Q from Belgrave Family Office.'}
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
  const acsp = reviewerOrgName(data, vc.acspId)
  const docType = vc.journey?.documentType ?? 'passport'
  const payment = vc.journey?.payment
  const rows: [string, string][] = [
    ['Person', `${person.givenNames} ${person.familyName}`],
    ['Company', company.name],
    [
      'Identity document',
      docType === 'passport'
        ? 'Passport, chip read in the app'
        : vc.journey?.noChipPhone
          ? 'Driving licence, in the browser'
          : 'Photo ID, scanned',
    ],
    ['Checks', 'Authenticity, liveness, face match, PEP and sanctions'],
    [
      'Supporting evidence',
      vc.journey?.evidenceUploaded
        ? 'One document, for your current address'
        : 'Not needed',
    ],
    [
      'Payment',
      payment?.method === 'agent_payment_code'
        ? `Paid by ${payment.payerName}`
        : `${formatMoney(VERIFICATION_FEE)} by card`,
    ],
  ]

  const submit = () => {
    apply((d) =>
      submitForReview(d, {
        caseId: vc.id,
        documentType: docType,
        evidenceUploaded: !!vc.journey?.evidenceUploaded,
      }),
    )
    next()
  }

  return (
    <Screen
      footer={
        <Button
          className="w-full"
          size="lg"
          disabled={!declared}
          onClick={submit}
        >
          Submit for review
        </Button>
      }
    >
      <ScreenTitle kicker="Check and submit">
        Ready to send to {acsp}
      </ScreenTitle>
      <dl className="mt-5 divide-y divide-line/70 rounded-2xl border border-line bg-white">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-start justify-between gap-4 px-4 py-3"
          >
            <dt className="text-[0.9375rem] text-slate">{k}</dt>
            <dd className="text-right text-[0.9375rem] text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed text-ink">
        <Checkbox
          className="mt-0.5"
          checked={declared}
          onChange={(e) => setDeclared(e.target.checked)}
        />
        I confirm the information I have given is true, and that the identity
        document is mine.
      </label>
      <AttributionNote acspName={acsp} className="mt-5 text-[0.9375rem]" />
    </Screen>
  )
}

export function StatusStep({ vc, person }: StepProps) {
  const { data } = useDemoStore()
  const now = useNow(30000)
  const acsp = reviewerOrgName(data, vc.acspId)
  const s = vc.status
  const stopped = s === 'abandoned'
  const approved = [
    'approved',
    'submission_started',
    'submitted',
    'confirmed',
  ].includes(s)
  const reviewing =
    s === 'in_review' ||
    s === 'halted_register_mismatch' ||
    s === 'info_requested'
  const steps = [
    { label: 'Details and payment', done: true },
    {
      label:
        vc.option === 2 ? 'Person check requested' : 'Identity checks complete',
      done: true,
    },
    { label: `Review by ${acsp}`, done: approved, current: reviewing },
    {
      label: 'Submitted to Companies House by your ACSP',
      done: isSubmitted(s),
    },
    {
      label: 'Companies House emails your personal code to you',
      done: s === 'confirmed',
    },
  ]
  const t = vc.slaDueAt ? timeRemaining(vc.slaDueAt, now) : undefined

  if (stopped) {
    return (
      <Screen>
        <ScreenTitle kicker={`Case ${vc.id}`}>
          You have stopped here
        </ScreenTitle>
        <p className="mt-4 rounded-2xl border border-line bg-white px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
          {ALREADY_VERIFIED_MESSAGE}
        </p>
        <Lead>
          Nothing has been paid. If you need to verify after all, ask the person
          who invited you for a new invite.
        </Lead>
        <AttributionNote
          acspName={acsp}
          className="mt-auto pt-8 text-[0.9375rem]"
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenTitle kicker={`Case ${vc.id}`}>
        {s === 'confirmed'
          ? 'Your identity verification has been submitted'
          : isSubmitted(s)
            ? 'Submitted to Companies House'
            : s === 'declined'
              ? 'Your verification was not approved'
              : vc.option === 2
                ? 'Your ACSP will be in touch'
                : 'Your verification has been sent for review'}
      </ScreenTitle>
      {s === 'declined' ? (
        <p className="mt-3 rounded-2xl bg-decline-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-decline">
          {DECLINE_MESSAGE}
        </p>
      ) : s === 'info_requested' ? (
        <p className="mt-3 rounded-2xl bg-info-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-info">
          {vc.decision?.note ?? 'Your ACSP has asked for more information.'}
        </p>
      ) : s === 'halted_register_mismatch' ? (
        <p className="mt-3 rounded-2xl bg-info-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-info">
          A detail on your identity document does not match the Companies House
          register. The register is being corrected, then your verification
          carries on automatically.
        </p>
      ) : isSubmitted(s) ? (
        <p className="mt-3 rounded-2xl border border-line bg-white px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
          Companies House will email your personal code directly to{' '}
          {person.email}. Evidence One does not receive or keep it.
        </p>
      ) : (
        <Lead>
          {reviewing && t && !t.overdue
            ? `Your ACSP aims to decide within ${t.hours} hours.`
            : 'We will let you know as soon as anything changes.'}
        </Lead>
      )}
      <ol className="mt-6 space-y-3.5">
        {steps.map((st, i) => (
          <li key={st.label} className="flex items-center gap-3">
            {st.done ? (
              <CompletionTick label="Completed" />
            ) : (
              <PendingMarker
                step={i + 1}
                className={st.current ? 'border-ink text-ink' : undefined}
              />
            )}
            <span
              className={cn(
                'text-base',
                st.done
                  ? 'text-ink'
                  : st.current
                    ? 'font-medium text-ink'
                    : 'text-slate',
              )}
            >
              {st.label}
            </span>
          </li>
        ))}
      </ol>
      <AttributionNote
        acspName={acsp}
        className="mt-auto pt-8 text-[0.9375rem]"
      />
    </Screen>
  )
}
