import { paymentTotal } from '@/lib/fees'
import { CorrectionRequest } from '../CorrectionRequest'
import { ChevronRight, CreditCard, Info, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { AttributionNote } from '@/components/AttributionNote'
import { Checkbox } from '@/components/app/Page'
import {
  PendingMarker,
  CompletionTick,
} from '@/components/brand/CompletionTick'
import { Button } from '@/components/ui/button'
import { ALREADY_VERIFIED_MESSAGE, DECLINE_MESSAGE } from '@/data/reasonCodes'
import { fill, getStrings } from '@/data/i18n'
import { formatAddress, formatMoney } from '@/lib/format'
import { currentRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import {
  stopAlreadyVerified,
  submitForReview,
  updateJourney,
} from '@/store/actions'
import { PAYMENT_STATUS_LABEL } from '@/lib/paymentStatus'
import { useDemoStore } from '@/store/DemoStore'
import {
  answerCodeReceipt,
  answerReallocation,
  attachSupportingEvidence,
  provideRequestedDocument,
  showNextDay,
} from '@/store/finishActions'
import { reviewerOrgName } from '@/store/selectors'
import { CaseMessages } from '../CaseMessages'
import { journeyTriggers } from '../journey'
import { Lead, Screen, ScreenTitle } from '../JourneyShell'
import {
  DocumentHelper,
  SupportingUpload,
  uploadRecorded,
} from '../SupportingUpload'
import type { StepProps } from './types'

const currentAddress = (person: StepProps['person']) =>
  person.addressHistory.find((a) => !a.to)

const ContinueButton = ({
  disabled,
  onClick,
}: {
  disabled?: boolean
  onClick: () => void
}) => (
  <Button className="w-full" size="lg" disabled={disabled} onClick={onClick}>
    Continue
    <ChevronRight aria-hidden="true" />
  </Button>
)

/** Proof of current address from every individual, dated within the supporting evidence period (ADDL-02, P3 decided 19 October). */
export function AddressStep({ vc, person, next }: StepProps) {
  const { data } = useDemoStore()
  const months = currentRuleSet(data).params.supporting_evidence_months
  const current = currentAddress(person)
  const done = uploadRecorded(data, vc.id, 'address')
  return (
    <Screen footer={<ContinueButton disabled={!done} onClick={next} />}>
      <ScreenTitle kicker="Proof of address">
        One proof of your current address
      </ScreenTitle>
      <Lead>
        Please provide a document confirming your current residential address,
        dated within the last {months} months.
      </Lead>
      <p className="mt-2 text-base text-graphite">
        We ask everyone, even if your identity document shows an address. This
        is not a second identity document.
      </p>
      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-slate">Current address</p>
        <p className="mt-0.5 text-base text-ink">
          {current && formatAddress(current.address)}
        </p>
      </div>
      <SupportingUpload
        caseId={vc.id}
        purpose="address"
        holder={`${person.givenNames} ${person.familyName}`}
        address={current ? formatAddress(current.address) : ''}
        done={done}
      />
      <DocumentHelper caseId={vc.id} />
    </Screen>
  )
}

/** One supporting document, only on ADDL-01 or ADDL-03. A Request, never a Halt. */
export function EvidenceStep({ vc, person, next }: StepProps) {
  const { data } = useDemoStore()
  const months = currentRuleSet(data).params.supporting_evidence_months
  const triggers = journeyTriggers(data, vc).filter(
    (t) => t.ruleId === 'ADDL-01' || t.ruleId === 'ADDL-03',
  )
  const expired =
    person.document &&
    new Date(person.document.expiresOn).getTime() < Date.now()
  if (expired && !triggers.some((t) => t.ruleId === 'ADDL-01'))
    triggers.unshift({
      ruleId: 'ADDL-01',
      reason:
        'Your identity document has expired beyond the period we can accept.',
    })
  const current = currentAddress(person)
  const done = uploadRecorded(data, vc.id, 'evidence')
  return (
    <Screen footer={<ContinueButton disabled={!done} onClick={next} />}>
      <ScreenTitle kicker="Supporting evidence">
        We need one supporting document
      </ScreenTitle>
      <Lead>
        This is not a second identity document. It must be dated within the last{' '}
        {months} months. Nothing is stopped. Your ACSP reviews it.
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
      <SupportingUpload
        caseId={vc.id}
        purpose="evidence"
        holder={`${person.givenNames} ${person.familyName}`}
        address={current ? formatAddress(current.address) : ''}
        done={done}
      />
      <DocumentHelper caseId={vc.id} />
    </Screen>
  )
}

const docNames = {
  passport: 'Passport',
  driving_licence: 'UK photocard driving licence',
  national_identity_card: 'National identity card',
  biometric_residence_permit: 'Biometric residence permit',
} as const

/** Check, declare and submit. Legal text stays in English with the translation beneath. */
export function ReviewStep({ vc, person, company, next }: StepProps) {
  const { state, data, apply } = useDemoStore()
  const [truth, setTruth] = useState(false)
  const [consent, setConsent] = useState(false)
  const acsp = reviewerOrgName(data, vc.acspId) ?? 'your ACSP'
  const docType = vc.journey?.documentType ?? 'passport'
  const payment = vc.payment ?? vc.journey?.payment
  const items = vc.journey?.supportingItems ?? []
  const lang = state.language
  const tr = getStrings(lang).declarations
  const english = getStrings('en').declarations
  const rows: [string, string][] = [
    ['Person', `${person.givenNames} ${person.familyName}`],
    ['Company', company.name],
    ['Your ACSP', acsp],
    ['Identity document', docNames[docType]],
    ['Checks', 'Authenticity, liveness, face match, PEP and sanctions'],
    [
      'Proof of address',
      vc.journey?.addressProofDone ? 'One document uploaded' : 'Not yet added',
    ],
  ]
  if (vc.journey?.evidenceUploaded)
    rows.push(['Supporting document', 'One document uploaded'])
  if (items.some((i) => i.redaction))
    rows.push(['Bank statement', 'Redacted copy only, confirmed by you'])
  rows.push([
    'Payment',
    payment?.method === 'agent_payment_code'
      ? `Paid by ${payment.payerName} on your behalf, taken on approval`
      : payment
        ? `${formatMoney(payment.amount)} to ${acsp}. Authorised, not yet taken`
        : 'Recorded',
  ])

  const submit = () => {
    apply((d) =>
      submitForReview(d, {
        caseId: vc.id,
        documentType: docType,
        evidenceUploaded: !!(
          vc.journey?.evidenceUploaded || vc.journey?.addressProofDone
        ),
      }),
    )
    apply((d) => attachSupportingEvidence(d, vc.id))
    next()
  }

  const Declaration = ({
    id,
    checked,
    onChange,
    en,
    local,
  }: {
    id: string
    checked: boolean
    onChange: (v: boolean) => void
    en: string
    local: string
  }) => (
    <div className="mt-4">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-relaxed text-ink"
      >
        <Checkbox
          id={id}
          className="mt-0.5"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span lang="en" dir="ltr">
          {fill(en, { acsp })}
        </span>
      </label>
      {lang !== 'en' && (
        <p
          lang={lang}
          className="mt-1.5 ps-9 text-[0.9375rem] leading-relaxed text-graphite"
        >
          {fill(local, { acsp })}
        </p>
      )}
    </div>
  )

  return (
    <Screen
      footer={
        <Button
          className="w-full"
          size="lg"
          disabled={!truth || !consent}
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
            <dd className="text-end text-[0.9375rem] text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {lang !== 'en' && (
        <p className="mt-4 text-sm text-slate">
          {getStrings(lang).notice.legalNote}
        </p>
      )}
      <Declaration
        id="decl-truth"
        checked={truth}
        onChange={setTruth}
        en={english.truth}
        local={tr.truth}
      />
      <Declaration
        id="decl-consent"
        checked={consent}
        onChange={setConsent}
        en={english.consent}
        local={tr.consent}
      />
      <AttributionNote acspName={acsp} className="mt-5 text-[0.9375rem]" />
    </Screen>
  )
}

const RANK: Record<string, number> = {
  invited: 0,
  in_progress: 0,
  in_review: 2,
  info_requested: 2,
  approved: 3,
  submission_started: 4,
  submitted: 5,
  confirmed: 6,
}

/** The status tracker, with correct attribution, messages and the follow-up questions. */
export function StatusStep({ vc, person, entry, go }: StepProps) {
  const { data, apply } = useDemoStore()
  const acsp = reviewerOrgName(data, vc.acspId) ?? 'your ACSP'
  const s = vc.status
  const fullName = `${person.givenNames} ${person.familyName}`
  const rank = RANK[s] ?? 0
  const declined = s === 'declined'
  const open = s === 'invited' || s === 'in_progress'
  const receipt = vc.personalCodeReceipt
  const realloc = vc.reallocation
  const confirmedAt = vc.submission?.confirmedAt
  const dayAfter =
    s === 'confirmed' &&
    !!confirmedAt &&
    Date.now() - new Date(confirmedAt).getTime() > 86_400_000
  const askCode = s === 'confirmed' && (!!receipt || dayAfter)

  if (s === 'abandoned') {
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

  if (
    open &&
    entry.identityVerified &&
    !vc.journey?.alreadyVerifiedAcknowledged
  ) {
    return (
      <Screen
        footer={
          <>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                apply((d) =>
                  updateJourney(
                    d,
                    vc.id,
                    { alreadyVerifiedAcknowledged: true },
                    {
                      action: 'case.already_verified.continued',
                      detail:
                        'REG-04 notice shown. The individual chose to continue.',
                    },
                  ),
                )
                go('payment')
              }}
            >
              Continue anyway
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => apply((d) => stopAlreadyVerified(d, vc.id))}
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
          You can continue or stop. If you stop, nothing is paid. If you
          continue, nothing changes on the register until {acsp} submits your
          verification.
        </Lead>
      </Screen>
    )
  }

  const stages = [
    { label: 'Details and payment authorised', at: 0 },
    {
      label:
        vc.option === 2
          ? 'Option 2 review requested'
          : 'Identity checks complete',
      at: 0,
    },
    { label: `Review by ${acsp}`, at: 3 },
    { label: `Approved by ${acsp}, payment taken`, at: 3 },
    { label: 'Your ACSP has started the submission to Companies House', at: 4 },
    { label: 'Submitted to Companies House', at: 5 },
    { label: 'Companies House has confirmed your verification', at: 6 },
    {
      label: 'You confirm the personal code has arrived',
      at: 7,
    },
  ]
  const reached = (i: number) => {
    if (i === 0) return !open || !!vc.journey?.paid
    if (i === 1) return !open || !!vc.journey?.checksDone
    if (i === 7) return receipt?.answer === 'yes'
    return rank >= stages[i].at
  }
  const visible = declined ? stages.slice(0, 3) : stages
  const trackedPayment = vc.payment ?? vc.journey?.payment
  const currentIdx = visible.findIndex((_, i) => !reached(i))

  return (
    <Screen>
      <ScreenTitle kicker={`Case ${vc.id}`}>
        {s === 'confirmed'
          ? 'Companies House has confirmed your verification'
          : s === 'submitted'
            ? 'Submitted to Companies House'
            : s === 'approved' || s === 'submission_started'
              ? `${acsp} has approved your verification`
              : declined
                ? 'Your verification was not approved'
                : vc.option === 2
                  ? 'Your ACSP will be in touch'
                  : s === 'info_requested'
                    ? 'Your ACSP needs more information'
                    : 'Your verification has been sent for review'}
      </ScreenTitle>
      <p className="mt-3 text-base leading-relaxed text-graphite">
        Your identity verification is being conducted by {acsp} using the
        Evidence One platform. Evidence One is {acsp}&rsquo;s technology
        provider.
      </p>

      {trackedPayment && (
        <p className="mt-3 flex gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
          <CreditCard className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium">
              Payment: {PAYMENT_STATUS_LABEL[trackedPayment.status]}.
            </span>{' '}
            {trackedPayment.status === 'authorised'
              ? `You are only charged when ${acsp} approves your verification.`
              : trackedPayment.status === 'taken'
                ? `${formatMoney(paymentTotal(trackedPayment))} was taken when ${acsp} approved${trackedPayment.addOn ? `, the verification fee and the register correction` : ''}. Your invoice is issued in ${acsp}’s name.`
                : 'The authorisation was released.'}
          </span>
        </p>
      )}
      <CorrectionRequest vc={vc} acsp={acsp} />
      {declined && (
        <p className="mt-3 rounded-2xl bg-decline-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-decline">
          {DECLINE_MESSAGE}
        </p>
      )}
      {s === 'info_requested' && (
        <div className="mt-3 rounded-2xl bg-info-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-info">
          {vc.decision?.note ?? 'Your ACSP has asked for more information.'}
        </div>
      )}
      {s !== 'invited' &&
        s !== 'in_progress' &&
        !declined &&
        s !== 'info_requested' && (
          <p className="mt-3 text-[0.9375rem] text-graphite">
            We will email you as soon as anything changes.
          </p>
        )}
      {(rank >= 3 || s === 'confirmed') && !declined && (
        <p className="mt-3 flex gap-2.5 rounded-2xl border border-line bg-white px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          Companies House will email the personal code directly to {fullName}.
          Evidence One does not receive it from Companies House and never asks
          for it.
        </p>
      )}

      {realloc?.individualResponse === 'pending' && (
        <div
          className="mt-4 rounded-2xl border border-ink bg-white p-4"
          role="group"
          aria-label="Change of ACSP"
        >
          <p className="text-base font-medium text-ink">
            Your ACSP can no longer take your case.{' '}
            {reviewerOrgName(data, realloc.offeredAcspId)} can continue it. Do
            you agree?
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button
              onClick={() =>
                apply((d) => answerReallocation(d, vc.id, 'agreed'))
              }
            >
              Yes, I agree
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                apply((d) => answerReallocation(d, vc.id, 'declined'))
              }
            >
              No, I do not agree
            </Button>
          </div>
        </div>
      )}
      {realloc && realloc.individualResponse !== 'pending' && (
        <p className="mt-3 text-[0.9375rem] text-graphite">
          You{' '}
          {realloc.individualResponse === 'agreed' ? 'agreed' : 'did not agree'}{' '}
          to move your case to {reviewerOrgName(data, realloc.offeredAcspId)}.
        </p>
      )}

      <ol className="mt-5 space-y-3.5">
        {visible.map((st, i) => {
          const done = reached(i)
          return (
            <li key={st.label} className="flex items-center gap-3">
              {done ? (
                <CompletionTick label="Completed" />
              ) : (
                <PendingMarker
                  step={i + 1}
                  className={
                    i === currentIdx ? 'border-ink text-ink' : undefined
                  }
                />
              )}
              <span
                className={cn(
                  'text-base',
                  done
                    ? 'text-ink'
                    : i === currentIdx
                      ? 'font-medium text-ink'
                      : 'text-slate',
                )}
              >
                {st.label}
              </span>
            </li>
          )
        })}
      </ol>

      {s === 'info_requested' && (
        <div className="mt-5">
          <p className="text-base font-medium text-ink">
            Send one more recent document
          </p>
          <SupportingUpload
            caseId={vc.id}
            purpose="evidence"
            holder={fullName}
            address={
              currentAddress(person)
                ? formatAddress(currentAddress(person)!.address)
                : ''
            }
            done={false}
            onUploaded={(input) =>
              apply((d) => provideRequestedDocument(d, vc.id, input))
            }
          />
        </div>
      )}

      {s === 'confirmed' && !askCode && (
        <div className="mt-5 rounded-2xl border border-dashed border-silver p-3">
          <p className="text-sm text-slate">Presenter control</p>
          <Button
            className="mt-2"
            variant="outline"
            size="sm"
            onClick={() => apply((d) => showNextDay(d, vc.id))}
          >
            Show next day
          </Button>
        </div>
      )}
      {askCode && (
        <div className="mt-5 rounded-2xl border border-line bg-white p-4">
          <p className="text-base font-medium text-ink">
            Please confirm that the code has arrived from Companies House
          </p>
          {receipt?.answer ? (
            <p className="mt-2 text-[0.9375rem] text-graphite" role="status">
              {receipt.answer === 'yes'
                ? 'Thank you. You confirmed that the code has arrived.'
                : 'Thank you. If it has not arrived, check your email and spam folder, or tell your ACSP in a message below.'}
            </p>
          ) : (
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => apply((d) => answerCodeReceipt(d, vc.id, 'yes'))}
              >
                Yes
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  apply((d) => answerCodeReceipt(d, vc.id, 'not_yet'))
                }
              >
                Not yet
              </Button>
            </div>
          )}
          <p className="mt-2 text-sm text-slate">
            We never ask for the code. Please do not send it in the messages. If{' '}
            {acsp} needs a code for a later filing, agree with them how to pass
            it on outside Evidence One.
          </p>
        </div>
      )}

      {!open && !declined && <CaseMessages caseId={vc.id} className="mt-5" />}
      {declined && <CaseMessages caseId={vc.id} className="mt-5" />}

      <AttributionNote
        acspName={acsp}
        className="mt-auto pt-8 text-[0.9375rem]"
      />
    </Screen>
  )
}
