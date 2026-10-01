import {
  Building2,
  Check,
  ChevronRight,
  Fingerprint,
  Home,
  Mail,
  PenLine,
  Smartphone,
  Ticket,
} from 'lucide-react'
import { useState } from 'react'
import { AttributionNote } from '@/components/AttributionNote'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { Button } from '@/components/ui/button'
import { formatAddress, formatDate, formatShortDate } from '@/lib/format'
import { currentRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { requestAmendment, updateJourney } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { reviewerOrgName, roleLabel } from '@/store/selectors'
import { Lead, Screen, ScreenTitle } from '../JourneyShell'
import type { StepProps } from './types'

export function InviteStep({ vc, person, company, entry, next }: StepProps) {
  const { data } = useDemoStore()
  const invite = data.invites.find((i) => i.caseId === vc.id)
  const agent = data.agents.find((a) => a.id === vc.agentId)
  return (
    <Screen
      footer={
        <Button className="w-full" size="lg" onClick={next}>
          Get started
          <ChevronRight aria-hidden="true" />
        </Button>
      }
    >
      <ScreenTitle>
        Hello {person.givenNames.split(' ')[0]}, you have been invited to verify
        your identity
      </ScreenTitle>
      <Lead>
        Companies House asks every director and PSC to verify their identity.{' '}
        {agent?.name} has started this for you. It takes about five minutes.
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
      </div>
      {invite?.paymentCode && (
        <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">
          <Ticket className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Nothing to pay. {agent?.name} has covered the fee with a single-use
          Agent Payment Code for this invite.
        </p>
      )}
      <AttributionNote
        acspName={reviewerOrgName(data, vc.acspId)}
        className="mt-6 text-[0.9375rem]"
      />
    </Screen>
  )
}

export function DetailsStep({ vc, person, company, entry, next }: StepProps) {
  const { apply } = useDemoStore()
  const [amending, setAmending] = useState(false)
  const [field, setField] = useState('Name')
  const [note, setNote] = useState('')
  const amendment = vc.journey?.amendment

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
          Your request goes to the Agent who invited you. If the register itself
          is wrong, it is corrected before your verification is completed.
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
        Your identity details must match the Companies House register exactly.
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
            <label
              key={v}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 text-base has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
                former === v
                  ? 'border-ink shadow-[0_0_0_1px_var(--ink)]'
                  : 'border-line',
              )}
            >
              <input
                type="radio"
                name="former"
                className="sr-only"
                checked={former === v}
                onChange={() => setFormer(v)}
              />
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border-[1.5px]',
                  former === v ? 'border-ink' : 'border-silver',
                )}
              >
                {former === v && (
                  <span className="size-2.5 rounded-full bg-ink" />
                )}
              </span>
              {label}
            </label>
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
              className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
            />
            <p className="mt-1.5 text-sm text-slate">
              You will be asked for one document showing the change of name.
            </p>
          </div>
        )}
      </fieldset>

      <p className="mt-6 text-base font-medium text-ink">
        Where you have lived in the last {months} months
      </p>
      <p className="text-[0.9375rem] text-slate">
        Information only. You will not be asked for proof unless a rule calls
        for it.
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

/** Registration: email by one-time code and mobile by SMS code, before anything else. Codes are prefilled in the demo. */
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
              : `Mobile ${person.mobile} confirmed by SMS code. Not registered to another individual or the inviting Agent (INFO-07).`,
        },
      ),
    )

  return (
    <Screen
      footer={
        <Button className="w-full" size="lg" disabled={!both} onClick={next}>
          Continue
          <ChevronRight aria-hidden="true" />
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
            'One-time code',
            emailCode,
            setEmailCode,
            !!j?.emailConfirmed,
          ],
          [
            'mobile',
            Smartphone,
            'Mobile',
            person.mobile,
            'SMS code',
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
              <div className="w-40 shrink-0">
                <label
                  htmlFor={`code-${key}`}
                  className="text-[0.875rem] text-slate"
                >
                  {codeLabel}
                </label>
                <input
                  id={`code-${key}`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
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
            Next time you open the app, sign in with a one-time code sent to
            your email, or with a passkey on this phone.
          </p>
          {j?.passkeySet ? (
            <p className="mt-3 flex items-center gap-2 text-[0.9375rem] text-ink">
              <CompletionTick className="size-5" label="Set up" />
              Passkey set up on this phone
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
                        'Passkey registered on this phone for future sign-in.',
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
