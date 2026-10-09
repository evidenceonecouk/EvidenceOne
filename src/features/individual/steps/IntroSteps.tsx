import {
  Building2,
  Check,
  ChevronRight,
  CreditCard,
  Fingerprint,
  Home,
  Info,
  Loader2,
  Lock,
  Mail,
  PenLine,
  Smartphone,
  Ticket,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AttributionNote } from '@/components/AttributionNote'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { ReferralDisclosureCard } from '@/components/ReferralDisclosureCard'
import { Button } from '@/components/ui/button'
import { ALREADY_VERIFIED_MESSAGE } from '@/data/reasonCodes'
import {
  formatAddress,
  formatDate,
  formatMoney,
  formatShortDate,
} from '@/lib/format'
import {
  consentRequiredBy,
  DEMO_REFERRAL_COMMISSION,
  partnerReceivesCommission,
} from '@/lib/invoicing'
import {
  criteriaFrom,
  defaultAnswers,
  DOCUMENT_TYPE_LABEL,
  SUGGESTION_LANGUAGES,
  type SuggestionAnswers,
} from '@/lib/matchCriteria'
import { suggestAcsps, type AcspSuggestion } from '@/lib/matching'
import { currentRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import {
  recordPayment,
  requestAmendment,
  stopAlreadyVerified,
  updateJourney,
} from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import {
  instructAcsp,
  noteAlreadyVerified,
  recordSuggestions,
  requestDifferentAcsp,
} from '@/store/journeyActions'
import { getAcsp, getPartner, roleLabel } from '@/store/selectors'
import type { AcspFirm, IdDocumentType, Payment } from '@/types/domain'
import { needsSuggestion } from '../journey'
import { Lead, Screen, ScreenTitle } from '../JourneyShell'
import type { StepProps } from './types'

const money2 = (n: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(n)

const turnaroundText = (hours: number) =>
  hours % 24 === 0 && hours >= 48
    ? `about ${hours / 24} working days (${hours} hours)`
    : `within ${hours} hours`

const inputClass =
  'mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10'

/** A selectable card, a real radio underneath. */
function Choice({
  selected,
  onSelect,
  name,
  disabled,
  children,
}: {
  selected: boolean
  onSelect: () => void
  name: string
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-base has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
        selected ? 'border-ink shadow-[0_0_0_1px_var(--ink)]' : 'border-line',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="radio"
        name={name}
        className="sr-only"
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
          selected ? 'border-ink' : 'border-silver',
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-ink" />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}

/** REG-04: calm notice before payment, with Continue or Stop. The person who sent the invite is told too. */
function AlreadyVerifiedNotice({
  partnerName,
  onContinue,
  onStop,
}: {
  partnerName?: string
  onContinue: () => void
  onStop: () => void
}) {
  return (
    <>
      <p className="mt-6 flex gap-3 rounded-2xl border border-line bg-white p-4 text-base leading-relaxed text-ink">
        <Info className="mt-1 size-5 shrink-0" aria-hidden="true" />
        <span>
          {ALREADY_VERIFIED_MESSAGE} If you continue, nothing changes on the
          register until your ACSP submits the verification. If you stop,
          nothing is paid.
          {partnerName && (
            <span className="mt-2 block text-graphite">
              {partnerName} has been told by email. They see the status only.
            </span>
          )}
        </span>
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        <Button className="w-full" size="lg" onClick={onContinue}>
          Continue
          <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
        </Button>
        <Button className="w-full" variant="outline" onClick={onStop}>
          Stop here
        </Button>
      </div>
    </>
  )
}

export function InviteStep({
  vc,
  person,
  company,
  entry,
  next,
  go,
}: StepProps) {
  const { data, apply } = useDemoStore()
  const invite = data.invites.find((i) => i.caseId === vc.id)
  const partner = getPartner(data, invite?.partnerId ?? vc.partnerId ?? '')
  const chosenAcsp =
    invite?.instructingAcspId && invite.instructingAcspId !== 'platform_suggest'
      ? getAcsp(data, invite.instructingAcspId)
      : getAcsp(data, vc.acspId)
  const suggested = needsSuggestion(data, vc)
  const alreadyVerified =
    entry.identityVerified && !vc.journey?.alreadyVerifiedAcknowledged

  useEffect(() => {
    if (alreadyVerified) apply((d) => noteAlreadyVerified(d, vc.id))
  }, [alreadyVerified, apply, vc.id])

  const stop = () => {
    apply((d) => stopAlreadyVerified(d, vc.id))
    go('status')
  }
  const carryOn = () =>
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

  return (
    <Screen
      footer={
        alreadyVerified ? undefined : (
          <Button className="w-full" size="lg" onClick={next}>
            Get started
            <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
          </Button>
        )
      }
    >
      <ScreenTitle>
        Hello {person.givenNames.split(' ')[0]}, you have been invited to verify
        your identity
      </ScreenTitle>
      <Lead>
        Companies House asks every director and PSC to verify their identity.{' '}
        {partner?.name} has started this for you. It takes about five minutes,
        in this browser.
      </Lead>
      <div className="mt-6 rounded-2xl border border-line bg-white p-4">
        <p className="flex items-center gap-2 text-sm text-slate">
          <Building2 className="size-4" aria-hidden="true" />
          From the Companies House register
        </p>
        <p className="mt-2 text-base font-medium text-ink">{company.name}</p>
        <p className="text-[0.9375rem] text-slate">
          {company.number} · {roleLabel[entry.role]}
        </p>
        <p className="mt-2 font-mono text-[0.8125rem] text-slate">
          Register: {entry.registerName}
        </p>
      </div>
      <dl className="mt-3 divide-y divide-line/70 rounded-2xl border border-line bg-white">
        <div className="px-4 py-3">
          <dt className="text-sm text-slate">Invited by</dt>
          <dd className="mt-0.5 text-base text-ink">
            {partner?.name ?? 'Evidence One'}
            {partner && <span className="text-slate"> · Referral Partner</span>}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-sm text-slate">Who will verify you</dt>
          <dd className="mt-0.5 text-base text-ink">
            {suggested
              ? 'We will suggest ACSPs after your personal information'
              : (chosenAcsp?.name ?? 'To be confirmed')}
          </dd>
        </div>
      </dl>
      {invite?.paymentCode && !alreadyVerified && (
        <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">
          <Ticket className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Nothing to pay. {partner?.name} will pay on your behalf with a
          single-use Agent Payment Code for this invite.
        </p>
      )}
      {alreadyVerified && (
        <AlreadyVerifiedNotice
          partnerName={partner?.name}
          onContinue={carryOn}
          onStop={stop}
        />
      )}
      <AttributionNote
        acspName={suggested ? undefined : chosenAcsp?.name}
        className="mt-6 text-[0.9375rem]"
      />
    </Screen>
  )
}

export function DetailsStep({ vc, person, company, entry, next }: StepProps) {
  const { data, apply } = useDemoStore()
  const [amending, setAmending] = useState(false)
  const [field, setField] = useState('Name')
  const [note, setNote] = useState('')
  const amendment = vc.journey?.amendment
  const partner = getPartner(data, vc.partnerId ?? '')

  const confirm = () => {
    apply((d) =>
      updateJourney(
        d,
        vc.id,
        { detailsConfirmed: true },
        {
          action: 'details.confirmed',
          detail:
            'Pre-filled details confirmed against the Companies House register.',
        },
      ),
    )
    next()
  }

  if (amending) {
    return (
      <Screen
        footer={
          <>
            <Button
              className="w-full"
              size="lg"
              disabled={!note.trim()}
              onClick={() => {
                apply((d) => requestAmendment(d, vc.id, field, note.trim()))
                setAmending(false)
              }}
            >
              Send amendment request
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => setAmending(false)}
            >
              Cancel
            </Button>
          </>
        }
      >
        <ScreenTitle kicker="Ask for an amendment">
          What needs to change?
        </ScreenTitle>
        <Lead>
          {partner
            ? `Your request goes to ${partner.name}, who invited you.`
            : 'Your request goes to the Evidence One support team.'}{' '}
          If the register itself is wrong, a correction is started before your
          identity checks. You can carry on in the meantime.
        </Lead>
        <fieldset className="mt-5">
          <legend className="text-[0.9375rem] font-medium text-ink">
            Detail
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {['Name', 'Date of birth', 'Role', 'Contact details'].map((f) => (
              <label
                key={f}
                className={`cursor-pointer rounded-xl border px-3 py-3 text-[0.9375rem] transition-colors duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink ${field === f ? 'border-ink bg-white text-ink' : 'border-line text-graphite'}`}
              >
                <input
                  type="radio"
                  name="field"
                  className="sr-only"
                  checked={field === f}
                  onChange={() => setField(f)}
                />
                {f}
              </label>
            ))}
          </div>
        </fieldset>
        <label
          htmlFor="amend-note"
          className="mt-5 block text-[0.9375rem] font-medium text-ink"
        >
          What is wrong, and what should it be?
        </label>
        <textarea
          id="amend-note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
        />
      </Screen>
    )
  }

  const rows: [string, string][] = [
    ['Full name', `${person.givenNames} ${person.familyName}`],
    ['Date of birth', formatDate(person.dateOfBirth)],
    ['Nationality', person.nationality],
    ['Email', person.email],
    ['Mobile', person.mobile],
  ]

  return (
    <Screen
      footer={
        <>
          <Button className="w-full" size="lg" onClick={confirm}>
            <Check aria-hidden="true" />
            These details are correct
          </Button>
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => setAmending(true)}
          >
            <PenLine aria-hidden="true" />
            Ask for an amendment
          </Button>
        </>
      }
    >
      <ScreenTitle kicker="Your details">Check the details we hold</ScreenTitle>
      <Lead>
        Your details are compared with the Companies House register. If
        something differs, your ACSP sees it and decides. It does not stop you
        here.
      </Lead>
      {amendment && (
        <p className="mt-4 flex gap-2.5 rounded-2xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">
          <CompletionTick className="size-5" label="Sent" />
          Amendment request sent on {formatShortDate(amendment.at)}. You can
          carry on while it is reviewed.
        </p>
      )}
      <dl className="mt-5 divide-y divide-line/70 rounded-2xl border border-line bg-white">
        {rows.map(([k, v]) => (
          <div key={k} className="px-4 py-3">
            <dt className="text-sm text-slate">{k}</dt>
            <dd className="mt-0.5 text-base break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-2xl border border-line bg-white p-4">
        <p className="text-sm text-slate">Associated with</p>
        <p className="mt-1 text-base font-medium text-ink">{company.name}</p>
        <p className="text-[0.9375rem] text-slate">
          {roleLabel[entry.role]} since {formatShortDate(entry.appointedOn)}
        </p>
        <p className="mt-2 font-mono text-[0.8125rem] text-slate">
          Register: {entry.registerName}
        </p>
      </div>
    </Screen>
  )
}

/** Step 1: personal information. Former names must be answered; a blank is not an answer (INFO-02). */
export function PersonalStep({ vc, person, next }: StepProps) {
  const { data, apply } = useDemoStore()
  const months = currentRuleSet(data).params.address_history_months
  const [former, setFormer] = useState<'none' | 'yes' | null>(
    vc.journey?.personalConfirmed
      ? (vc.journey.formerNames ?? []).length
        ? 'yes'
        : 'none'
      : null,
  )
  const [formerText, setFormerText] = useState(
    (vc.journey?.formerNames ?? []).join(', '),
  )
  const since = new Date()
  since.setMonth(since.getMonth() - months)
  const relevant = person.addressHistory.filter(
    (a) => !a.to || new Date(a.to) >= since,
  )
  const ready =
    former === 'none' || (former === 'yes' && formerText.trim().length > 1)

  const confirm = () => {
    const formerNames =
      former === 'yes'
        ? formerText
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
        : []
    apply((d) =>
      updateJourney(
        d,
        vc.id,
        { personalConfirmed: true, formerNames },
        {
          action: 'personal.provided',
          detail: `Step 1 personal information given. Former names: ${formerNames.length ? formerNames.join(', ') : 'none'}. ${months}-month address history: ${relevant.length} address${relevant.length === 1 ? '' : 'es'}.`,
        },
      ),
    )
    next()
  }

  return (
    <Screen
      footer={
        <Button
          className="w-full"
          size="lg"
          disabled={!ready}
          onClick={confirm}
        >
          Confirm my information
        </Button>
      }
    >
      <ScreenTitle kicker="Step 1 · Personal information">
        Tell us about yourself
      </ScreenTitle>
      <dl className="mt-5 divide-y divide-line/70 rounded-2xl border border-line bg-white">
        {(
          [
            ['Given names', person.givenNames],
            ['Family name', person.familyName],
            ['Date of birth', formatDate(person.dateOfBirth)],
            ['Email', `${person.email}, confirmed`],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="px-4 py-3">
            <dt className="text-sm text-slate">{k}</dt>
            <dd className="mt-0.5 text-base break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <fieldset className="mt-5">
        <legend className="text-base font-medium text-ink">
          Have you been known by any other name?
        </legend>
        <p className="text-[0.9375rem] text-slate">
          For example a name before marriage. You must answer, even if the
          answer is no.
        </p>
        <div className="mt-3 space-y-2">
          {(
            [
              ['none', 'No, never'],
              ['yes', 'Yes'],
            ] as const
          ).map(([v, label]) => (
            <Choice
              key={v}
              name="former"
              selected={former === v}
              onSelect={() => setFormer(v)}
            >
              {label}
            </Choice>
          ))}
        </div>
        {former === 'yes' && (
          <div className="mt-3">
            <label
              htmlFor="former-names"
              className="text-[0.9375rem] font-medium text-ink"
            >
              Former names
            </label>
            <input
              id="former-names"
              value={formerText}
              onChange={(e) => setFormerText(e.target.value)}
              placeholder="Separate names with a comma"
              className={inputClass}
            />
            <p className="mt-1.5 text-sm text-slate">
              We need one supporting document showing the change of name.
            </p>
          </div>
        )}
      </fieldset>

      <p className="mt-6 text-base font-medium text-ink">
        Where you have lived in the last {months} months
      </p>
      <p className="text-[0.9375rem] text-slate">
        This is your address history. Later you will be asked for one proof of
        your current address.
      </p>
      <ol className="mt-3 space-y-3">
        {relevant.map((a, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-2xl border border-line bg-white p-4"
          >
            <Home
              className="mt-0.5 size-5 shrink-0 text-ink"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm text-slate">
                {a.to ? 'Previous address' : 'Current address'}
              </p>
              <p className="mt-0.5 text-base text-ink">
                {formatAddress(a.address)}
              </p>
              <p className="mt-1 text-[0.9375rem] text-slate">
                {new Date(a.from).toLocaleDateString('en-GB', {
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                to{' '}
                {a.to
                  ? new Date(a.to).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'present'}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-center gap-2.5 text-[0.9375rem] text-graphite">
        <CompletionTick className="size-5" label="Covered" />
        The last {months} months are covered with no gap
      </p>
    </Screen>
  )
}

/** Registration: email by one-time code and mobile by SMS code. SMS is fine here; it is never used for step-up. */
export function ContactStep({ vc, person, next }: StepProps) {
  const { apply } = useDemoStore()
  const j = vc.journey
  const [emailCode, setEmailCode] = useState('482913')
  const [smsCode, setSmsCode] = useState('736205')
  const both = !!j?.emailConfirmed && !!j?.mobileConfirmed

  const confirm = (which: 'email' | 'mobile') =>
    apply((d) =>
      updateJourney(
        d,
        vc.id,
        which === 'email'
          ? { emailConfirmed: true }
          : { mobileConfirmed: true },
        {
          action:
            which === 'email'
              ? 'contact.email_confirmed'
              : 'contact.mobile_confirmed',
          detail:
            which === 'email'
              ? `Email ${person.email} confirmed by one-time code (INFO-04).`
              : `Mobile ${person.mobile} confirmed by SMS code. Not registered to another individual or the inviting Referral Partner (INFO-07).`,
        },
      ),
    )

  return (
    <Screen
      footer={
        <Button className="w-full" size="lg" disabled={!both} onClick={next}>
          Continue
          <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
        </Button>
      }
    >
      <ScreenTitle kicker="Create your account">
        Confirm your email and mobile
      </ScreenTitle>
      <Lead>
        We have sent a code to each. This is how you will sign in to Evidence
        One.
      </Lead>

      {(
        [
          [
            'email',
            Mail,
            'Email',
            person.email,
            'One-time code by email',
            emailCode,
            setEmailCode,
            !!j?.emailConfirmed,
          ],
          [
            'mobile',
            Smartphone,
            'Mobile',
            person.mobile,
            'Code by SMS',
            smsCode,
            setSmsCode,
            !!j?.mobileConfirmed,
          ],
        ] as const
      ).map(([key, Icon, label, value, codeLabel, code, setCode, done]) => (
        <div
          key={key}
          className="mt-4 rounded-2xl border border-line bg-white p-4"
        >
          <p className="flex items-center gap-2 text-sm text-slate">
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </p>
          <p className="mt-0.5 text-base break-words text-ink">{value}</p>
          {done ? (
            <p className="mt-3 flex items-center gap-2 text-[0.9375rem] text-ink">
              <CompletionTick className="size-5" label="Confirmed" />
              Confirmed
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="w-44 shrink-0">
                <label
                  htmlFor={`code-${key}`}
                  className="text-[0.9375rem] text-slate"
                >
                  {codeLabel}
                </label>
                <input
                  id={`code-${key}`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  dir="ltr"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="mt-1 h-12 w-full rounded-xl border border-line bg-white px-3 text-center font-mono text-lg tracking-[0.2em] text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                />
              </div>
              <Button
                size="lg"
                variant="outline"
                disabled={code.length !== 6}
                onClick={() => confirm(key)}
              >
                Confirm
              </Button>
            </div>
          )}
        </div>
      ))}

      {both && (
        <div className="mt-5 rounded-2xl bg-mist p-4" data-follow>
          <p className="text-[0.9375rem] text-graphite">
            Next time, sign in with a one-time code sent to your email, or with
            a passkey on this device.
          </p>
          {j?.passkeySet ? (
            <p className="mt-3 flex items-center gap-2 text-[0.9375rem] text-ink">
              <CompletionTick className="size-5" label="Set up" />
              Passkey set up on this device
            </p>
          ) : (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() =>
                apply((d) =>
                  updateJourney(
                    d,
                    vc.id,
                    { passkeySet: true },
                    {
                      action: 'auth.passkey_registered',
                      detail:
                        'Passkey registered on this device for future sign-in.',
                    },
                  ),
                )
              }
            >
              <Fingerprint aria-hidden="true" />
              Set up a passkey
            </Button>
          )}
        </div>
      )}
      <p className="mt-4 text-sm text-slate">
        Codes are filled in for this demonstration.
      </p>
    </Screen>
  )
}

/* Suggested ACSPs (B2C and platform-suggested invites) */

const RESIDENCE_COUNTRIES = [
  'United Kingdom',
  'United Arab Emirates',
  'Ireland',
  'Germany',
  'Cyprus',
  'France',
  'Spain',
  'Italy',
  'Ukraine',
]

function reasonsFor(s: AcspSuggestion, a: SuggestionAnswers): string[] {
  if (s.reasons.length) return s.reasons
  const p = s.acsp.profile
  const spoken = a.languages.filter((l) => p.languages.includes(l))
  const left = Math.max(0, p.capacity.perDay - p.usedToday)
  return [
    `Price: its own fee of ${formatMoney(p.fee.standard)}`,
    spoken.length
      ? `Languages: ${spoken.join(', ')}`
      : `Languages: ${p.languages.join(', ')}`,
    `Countries: accepts clients living in ${a.residenceCountry}`,
    `Capacity: ${left} case${left === 1 ? '' : 's'} left today`,
  ]
}

export function SuggestStep({ vc, person, entry, next }: StepProps) {
  const { data, apply } = useDemoStore()
  const stored = vc.journey?.suggestionAnswers
  const locked = !!vc.allocation?.differentRequestedAt
  const [answers, setAnswers] = useState<SuggestionAnswers>(() => {
    const d = defaultAnswers(person)
    return stored
      ? {
          ...d,
          residenceCountry: stored.residenceCountry,
          issuingCountry: stored.issuingCountry,
          languages: stored.languages,
          documentType: vc.journey?.documentType ?? d.documentType,
        }
      : d
  })
  const ranked = useMemo(() => {
    if (locked && vc.allocation?.suggestedAcspIds) {
      const all = suggestAcsps(data, criteriaFrom(answers, entry.role))
      return vc.allocation.suggestedAcspIds
        .map((id) => all.find((s) => s.acsp.id === id))
        .filter((s): s is AcspSuggestion => !!s)
        .map((s, i) => ({ ...s, rank: i + 1 }))
    }
    return suggestAcsps(data, criteriaFrom(answers, entry.role))
  }, [data, answers, entry.role, locked, vc.allocation?.suggestedAcspIds])
  const shown = ranked.slice(0, 3)
  const allocated =
    shown.find((s) => s.acsp.id === vc.acspId)?.acsp.id ?? shown[0]?.acsp.id
  const ids = ranked.map((s) => s.acsp.id)
  const confirmed = !!vc.allocation?.confirmedAt

  const persist = (chosen: string) =>
    apply((d) =>
      recordSuggestions(
        d,
        vc.id,
        ids,
        chosen,
        {
          residenceCountry: answers.residenceCountry,
          issuingCountry: answers.issuingCountry,
          languages: answers.languages,
        },
        answers.documentType,
      ),
    )

  const different = () => {
    if (!allocated) return
    if (!vc.allocation?.suggestedAcspIds?.length || !stored) persist(allocated)
    apply((d) => requestDifferentAcsp(d, vc.id))
  }

  const toggleLanguage = (l: string) =>
    setAnswers((a) => ({
      ...a,
      languages: a.languages.includes(l)
        ? a.languages.filter((x) => x !== l)
        : [...a.languages, l],
    }))

  return (
    <Screen
      footer={
        <Button
          className="w-full"
          size="lg"
          disabled={!allocated}
          onClick={() => {
            if (allocated) persist(allocated)
            next()
          }}
        >
          Continue
          <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
        </Button>
      }
    >
      <ScreenTitle kicker="Suggested ACSPs">Who could verify you</ScreenTitle>
      <Lead>
        These ACSPs match what you have told us. You choose to instruct one on
        the next screen.
      </Lead>

      <fieldset
        className="mt-5 rounded-2xl border border-line bg-white p-4"
        disabled={locked}
      >
        <legend className="px-1 text-[0.9375rem] font-medium text-ink">
          What you tell us
        </legend>
        <label htmlFor="s-res" className="block text-[0.9375rem] text-slate">
          Country you live in
        </label>
        <select
          id="s-res"
          value={answers.residenceCountry}
          onChange={(e) =>
            setAnswers({ ...answers, residenceCountry: e.target.value })
          }
          className={inputClass}
        >
          {Array.from(
            new Set([answers.residenceCountry, ...RESIDENCE_COUNTRIES]),
          ).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label
          htmlFor="s-doc"
          className="mt-3 block text-[0.9375rem] text-slate"
        >
          Identity document you will use
        </label>
        <select
          id="s-doc"
          value={answers.documentType}
          onChange={(e) =>
            setAnswers({
              ...answers,
              documentType: e.target.value as IdDocumentType,
            })
          }
          className={inputClass}
        >
          {(Object.keys(DOCUMENT_TYPE_LABEL) as IdDocumentType[]).map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <label
          htmlFor="s-iss"
          className="mt-3 block text-[0.9375rem] text-slate"
        >
          Country that issued it
        </label>
        <input
          id="s-iss"
          value={answers.issuingCountry}
          onChange={(e) =>
            setAnswers({ ...answers, issuingCountry: e.target.value })
          }
          className={inputClass}
        />
        <p className="mt-3 text-[0.9375rem] text-slate">
          Languages you are comfortable using
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {SUGGESTION_LANGUAGES.map((l) => (
            <label
              key={l}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[0.9375rem] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
                answers.languages.includes(l)
                  ? 'border-ink bg-white text-ink'
                  : 'border-line text-graphite',
              )}
            >
              <input
                type="checkbox"
                className="size-4 accent-ink"
                checked={answers.languages.includes(l)}
                onChange={() => toggleLanguage(l)}
              />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-6 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
        Ranked by clear criteria. Not AI.
      </p>
      {shown.length === 0 && (
        <p className="mt-3 rounded-2xl border border-line bg-white p-4 text-base text-graphite">
          No ACSP matches these answers yet. Please change an answer, or
          Evidence One will contact you.
        </p>
      )}
      <ol className="mt-3 space-y-3">
        {shown.map((s) => (
          <li
            key={s.acsp.id}
            className={cn(
              'rounded-2xl border bg-white p-4',
              s.acsp.id === allocated
                ? 'border-ink shadow-[0_0_0_1px_var(--ink)]'
                : 'border-line',
            )}
          >
            <p className="flex items-center justify-between gap-2 text-sm text-slate">
              <span>{s.rank === 1 ? 'Best match' : `Match ${s.rank}`}</span>
              {s.acsp.id === allocated && (
                <span className="font-medium text-ink">Allocated to you</span>
              )}
            </p>
            <p className="mt-1 text-lg font-medium text-ink">{s.acsp.name}</p>
            <p className="text-[0.9375rem] text-slate">
              {s.acsp.kind} · supervised by {s.acsp.supervisor}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-sm text-slate">Its own fee</dt>
                <dd className="text-base font-medium text-ink">
                  {formatMoney(s.fee)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate">Turnaround</dt>
                <dd className="text-base text-ink">
                  {turnaroundText(s.turnaroundHours)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-sm font-medium text-ink">Why it matches</p>
            <ul className="mt-1 list-disc ps-5 text-[0.9375rem] text-graphite">
              {reasonsFor(s, answers).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {shown.length > 1 &&
        (locked ? (
          <p className="mt-4 text-[0.9375rem] text-slate">
            You have already asked for a different ACSP. This is the one
            allocated to you.
          </p>
        ) : (
          <Button
            className="mt-4 self-start"
            variant="outline"
            onClick={different}
          >
            Show me a different ACSP
          </Button>
        ))}
      <p className="mt-5 flex gap-2.5 rounded-2xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          An administrator confirms the allocation at launch.{' '}
          <span className="font-medium text-ink">
            {confirmed
              ? `Confirmed on ${formatShortDate(vc.allocation!.confirmedAt!)}`
              : 'Awaiting confirmation'}
          </span>
          . You can carry on in the meantime.
        </span>
      </p>
    </Screen>
  )
}

/* Who will verify you */

function AcspCard({ acsp }: { acsp: AcspFirm }) {
  return (
    <div className="mt-5 rounded-2xl border border-line bg-white p-4">
      <p className="text-lg font-medium text-ink">{acsp.name}</p>
      <p className="text-[0.9375rem] text-slate">{acsp.kind}</p>
      <dl className="mt-3 divide-y divide-line/70 text-base">
        {(
          [
            ['ACSP reference', acsp.acspNumber],
            [
              'Anti-money-laundering supervisor',
              `${acsp.supervisor}, ${acsp.supervisorNumber}`,
            ],
            [
              'Its own fee for this verification',
              formatMoney(acsp.profile.fee.standard),
            ],
            [
              'Expected turnaround',
              turnaroundText(acsp.profile.targetTurnaroundHours),
            ],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="py-2.5">
            <dt className="text-sm text-slate">{k}</dt>
            <dd className="mt-0.5 break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function InstructStep({ vc, next }: StepProps) {
  const { data, apply } = useDemoStore()
  const acsp = getAcsp(data, vc.acspId)
  const instructed = vc.journey?.instructedAt
  if (!acsp)
    return (
      <Screen>
        <ScreenTitle>No ACSP is allocated yet</ScreenTitle>
        <Lead>An administrator will allocate one shortly.</Lead>
      </Screen>
    )
  return (
    <Screen
      footer={
        instructed ? (
          <Button className="w-full" size="lg" onClick={next}>
            Continue to payment
            <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              apply((d) => instructAcsp(d, vc.id, acsp.id))
              next()
            }}
          >
            I instruct {acsp.name}
          </Button>
        )
      }
    >
      <ScreenTitle kicker="Who will verify you">
        Instruct {acsp.name}
      </ScreenTitle>
      <p className="mt-4 text-lg leading-relaxed text-ink">
        Your identity verification is being conducted by {acsp.name} using the
        Evidence One platform.
      </p>
      <p className="mt-2 text-base leading-relaxed text-graphite">
        Evidence One is {acsp.name}’s technology provider. {acsp.name} takes
        your payment, reviews your evidence, makes the decision and submits it
        to Companies House.
      </p>
      <AcspCard acsp={acsp} />
      {vc.source !== 'own_client' && (
        <p className="mt-3 text-[0.9375rem] text-slate">
          The fee is {acsp.name}’s own. Evidence One adds no charge for you.
        </p>
      )}
      {instructed ? (
        <p
          className="mt-4 flex items-center gap-2 text-base text-ink"
          data-follow
        >
          <CompletionTick className="size-5" label="Instructed" />
          You instructed {acsp.name} on {formatShortDate(instructed)}.
        </p>
      ) : (
        <p className="mt-4 text-[0.9375rem] text-slate">
          Payment comes next, and only after you have instructed this ACSP.
        </p>
      )}
    </Screen>
  )
}

/* Payment to the named ACSP */

export function PaymentStep({ vc, person, entry, next, go }: StepProps) {
  const { data, apply } = useDemoStore()
  const invite = data.invites.find((i) => i.caseId === vc.id)
  const acsp = getAcsp(data, vc.acspId)
  const partner = getPartner(data, invite?.partnerId ?? vc.partnerId ?? '')
  const prepaid = invite?.paymentCode
  const [method, setMethod] = useState<'card' | 'code'>('card')
  const [code, setCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [disclosed, setDisclosed] = useState(false)
  const paid = !!vc.journey?.paid
  const typed = code.trim().toUpperCase()
  const codeOwner = data.partners.find(
    (a) =>
      a.paymentCode &&
      typed.startsWith(`${a.paymentCode}-`) &&
      /^APC-[A-Z]{2}-[A-Z0-9]{4}$/.test(typed) &&
      !data.invites.some((i) => i.paymentCode === typed && i.caseId !== vc.id),
  )
  const ref = `PAY-2026-00${vc.id.slice(-4)}`
  const commissionsOn = currentRuleSet(data).settings.referral_commissions
  const disclosure = commissionsOn && partnerReceivesCommission(partner)
  const consentRequired = consentRequiredBy(partner?.referralPayment.regulator)

  if (!acsp) return null

  if (
    entry.identityVerified &&
    !vc.journey?.alreadyVerifiedAcknowledged &&
    !paid
  )
    return (
      <Screen>
        <ScreenTitle kicker="Before you pay">
          You may not need to do this
        </ScreenTitle>
        <AlreadyVerifiedNotice
          partnerName={partner?.name}
          onContinue={() =>
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
          onStop={() => {
            apply((d) => stopAlreadyVerified(d, vc.id))
            go('status')
          }}
        />
      </Screen>
    )

  // ACSP-01 and ACSP-02: no payment until the named ACSP is instructed.
  if (!vc.journey?.instructedAt && !paid)
    return (
      <Screen
        footer={
          <Button className="w-full" size="lg" onClick={() => go('instruct')}>
            Go to who will verify you
          </Button>
        }
      >
        <ScreenTitle kicker="Payment">Instruct your ACSP first</ScreenTitle>
        <Lead>
          You pay the ACSP that verifies you, so we need you to instruct it
          before payment.
        </Lead>
      </Screen>
    )

  const fee = acsp.profile.fee.standard
  const doPay = (payment: Payment) => {
    setProcessing(true)
    window.setTimeout(() => {
      const now = new Date().toISOString()
      apply((d) =>
        recordPayment(d, vc.id, payment, {
          disclosure: disclosure
            ? {
                acknowledgedAt: now,
                consentAt: consentRequired ? now : undefined,
              }
            : undefined,
        }),
      )
      setProcessing(false)
    }, 1200)
  }
  const payment = (m: 'card' | 'code'): Payment =>
    m === 'card'
      ? {
          method: 'pay_myself',
          amount: fee,
          payeeAcspId: acsp.id,
          paidAt: new Date().toISOString(),
          reference: ref,
        }
      : {
          method: 'agent_payment_code',
          amount: fee,
          payeeAcspId: acsp.id,
          code: prepaid ?? typed,
          payerName: prepaid ? partner?.name : codeOwner?.name,
          paidAt: new Date().toISOString(),
          reference: ref,
        }

  const done = paid ? vc.journey?.payment : undefined
  if (done) {
    const invoice = data.billing.clientInvoices.find(
      (i) => i.id === done.clientInvoiceId,
    )
    return (
      <Screen
        footer={
          <Button className="w-full" size="lg" onClick={next}>
            Continue
            <ChevronRight aria-hidden="true" className="rtl:rotate-180" />
          </Button>
        }
      >
        <ScreenTitle kicker="Payment">Payment complete</ScreenTitle>
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
          <CompletionTick label="Paid" />
          <div>
            <p className="text-base font-medium text-ink">
              {done.method === 'pay_myself'
                ? `${money2(done.amount)} paid to ${acsp.name}`
                : `Paid by ${done.payerName} on your behalf`}
            </p>
            <p className="mt-0.5 text-[0.9375rem] text-slate">
              {done.method === 'pay_myself'
                ? 'Secure payment provider · simulated payment'
                : `Single-use Agent Payment Code ${done.code}`}
            </p>
          </div>
        </div>
        {invoice && (
          <article
            aria-label={`Invoice ${invoice.id}`}
            className="mt-4 rounded-2xl border border-line bg-white p-4 text-[0.9375rem]"
          >
            <p className="font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
              Invoice
            </p>
            <p className="mt-1 font-mono text-base text-ink">{invoice.id}</p>
            <p className="text-slate">{formatDate(invoice.issuedAt)}</p>
            <p className="mt-3 font-medium text-ink">{acsp.name}</p>
            <p className="text-graphite">{acsp.profile.address}</p>
            <p className="text-graphite">
              {acsp.profile.vatNumber
                ? `VAT number ${acsp.profile.vatNumber}`
                : 'Not VAT registered'}
            </p>
            <p className="mt-3 text-slate">Billed to</p>
            <p className="text-ink">
              {person.givenNames} {person.familyName}
            </p>
            <p className="mt-3 text-graphite">{invoice.description}</p>
            <dl className="mt-3 divide-y divide-line/70">
              <div className="flex justify-between py-1.5">
                <dt className="text-slate">Net</dt>
                <dd className="tabular text-ink">{money2(invoice.net)}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-slate">VAT</dt>
                <dd className="tabular text-ink">{money2(invoice.vat)}</dd>
              </div>
              <div className="flex justify-between py-1.5 font-medium">
                <dt className="text-ink">Total</dt>
                <dd className="tabular text-ink">{money2(invoice.gross)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-slate">
              Issued by Evidence One on behalf of {acsp.name}. Evidence One is{' '}
              {acsp.name}’s technology provider.
            </p>
          </article>
        )}
      </Screen>
    )
  }

  const blocked =
    processing ||
    (disclosure && !disclosed) ||
    (!prepaid && method === 'code' && !codeOwner)
  const viaCode = !!prepaid || method === 'code'

  return (
    <Screen
      footer={
        <Button
          className={cn('w-full', processing && 'disabled:opacity-100')}
          size="lg"
          disabled={blocked}
          onClick={() => doPay(payment(viaCode ? 'code' : 'card'))}
        >
          {processing ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Processing
            </>
          ) : prepaid ? (
            `Confirm payment by ${partner?.name}`
          ) : method === 'card' ? (
            <>
              <Lock aria-hidden="true" />
              Pay {formatMoney(fee)} to {acsp.name}
            </>
          ) : (
            'Apply code'
          )}
        </Button>
      }
    >
      <ScreenTitle kicker="Payment">
        {prepaid ? 'Nothing to pay' : `${formatMoney(fee)} to ${acsp.name}`}
      </ScreenTitle>
      <p className="mt-4 text-base leading-relaxed text-ink">
        You are paying {acsp.name}. Evidence One collects this payment on{' '}
        {acsp.name}’s behalf as its agent.
      </p>
      {prepaid ? (
        <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-mist px-4 py-3 text-base text-graphite">
          <Ticket className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Paid by {partner?.name} on your behalf, with a single-use Agent
          Payment Code tied to this invite.
        </p>
      ) : (
        <Lead>
          The fee is {acsp.name}’s own: {formatMoney(fee)}. Card details are
          entered with the secure payment provider and never reach Evidence One.
          You will receive an invoice in {acsp.name}’s name.
        </Lead>
      )}

      {disclosure && partner && (
        <div className="mt-5">
          <ReferralDisclosureCard
            partnerName={partner.name}
            amount={DEMO_REFERRAL_COMMISSION.amount}
            consentRequired={consentRequired}
            onAcknowledge={setDisclosed}
          />
        </div>
      )}

      {!prepaid && (
        <>
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
                  'flex min-h-14 cursor-pointer flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-start text-base transition-[border-color,box-shadow] duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ink',
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
              <p className="font-mono text-ink tabular" dir="ltr">
                4242 4242 4242 4242
              </p>
              <p className="text-sm text-slate">
                Simulated checkout with the secure payment provider.
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
                dir="ltr"
                onChange={(e) => setCode(e.target.value)}
                placeholder="APC-XX-XXXX"
                autoCapitalize="characters"
                className={cn(inputClass, 'font-mono uppercase')}
              />
              <p className="mt-2 text-sm text-slate" aria-live="polite">
                {codeOwner
                  ? `Code accepted. Paid by ${codeOwner.name}. Single use.`
                  : 'A single-use code from a Referral Partner or introducer, tied to one invite.'}
              </p>
            </div>
          )}
        </>
      )}
    </Screen>
  )
}
