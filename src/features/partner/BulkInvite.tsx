import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Mail,
  Send,
  Ticket,
  X,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import {
  Checkbox,
  MonoLabel,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
} from '@/components/app/Page'
import { Stepper } from '@/components/app/Stepper'
import { useToast } from '@/components/app/Toaster'
import { Wordmark } from '@/components/brand/Wordmark'
import { AcspStatusChip, PartnerStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/visual/Avatar'
import { attributionText } from '@/lib/attribution'
import { formatMoney, formatShortDate } from '@/lib/format'
import { capacityLeftToday, matchAcsps, type AcspMatch } from '@/lib/matching'
import { cn } from '@/lib/utils'
import { sendInvites } from '@/store/actions'
import { useActingPartner, useDemoStore } from '@/store/DemoStore'
import { criteriaForPerson } from '@/store/partnerSelectors'
import { getCompany, peopleForCompany, roleLabel } from '@/store/selectors'
import type { AcspFirm } from '@/types/domain'
import { useActingPartnerUser } from './usePartnerUser'

const STEPS = [
  'Choose people',
  'Instructing ACSP',
  'Who pays',
  'Preview and send',
]
const LANGUAGES = ['English', 'Russian', 'Ukrainian', 'Arabic']
const TURNAROUND: { label: string; hours?: number }[] = [
  { label: 'Any' },
  { label: 'Within 24 hours', hours: 24 },
  { label: 'Within 48 hours', hours: 48 },
]

interface CardMatch {
  acsp: AcspFirm
  eligible: boolean
  failing: { label: string; reason: string; ruleId: string; who?: string }[]
  passing: { label: string; reason: string; ruleId: string }[]
  caveat?: string
}

export function BulkInvite() {
  const { number = '' } = useParams()
  const [params] = useSearchParams()
  const { data, apply } = useDemoStore()
  const partner = useActingPartner()
  const { can } = useActingPartnerUser()
  const toast = useToast()
  const navigate = useNavigate()
  const company = getCompany(data, number)
  const rows = company ? peopleForCompany(data, number, partner) : []
  const eligible = rows.filter((r) => r.invitable)
  const preselected = (params.get('people') ?? '')
    .split(',')
    .filter((id) => eligible.some((r) => r.personId === id))

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>(
    preselected.length ? preselected : eligible.map((r) => r.personId),
  )
  const [payer, setPayer] = useState<'client' | 'partner'>('client')
  const [acspChoice, setAcspChoice] = useState('')
  const [languages, setLanguages] = useState<string[]>(['English'])
  const [turnaround, setTurnaround] = useState(0)
  const [capacityToday, setCapacityToday] = useState(true)

  const chosen = eligible.filter((r) => selected.includes(r.personId))
  const maxTurnaroundHours = TURNAROUND[turnaround].hours
  const chosenKey = chosen.map((r) => r.personId).join(',')

  // Criteria come from each person's register entry and details. An ACSP must suit everyone in the batch.
  const matches: CardMatch[] = useMemo(() => {
    const perPerson = chosenKey
      ? chosenKey.split(',').map((personId) => {
          const person = data.people.find((p) => p.id === personId)
          return {
            name: person ? `${person.givenNames} ${person.familyName}` : '',
            matches: matchAcsps(
              data,
              criteriaForPerson(data, personId, number, {
                languages,
                maxTurnaroundHours,
                needsCapacityToday: capacityToday,
              }),
            ),
          }
        })
      : []
    return data.acsps.map((acsp) => {
      const mine = perPerson.map((p) => ({
        name: p.name,
        match: p.matches.find((m) => m.acsp.id === acsp.id) as
          AcspMatch | undefined,
      }))
      const failing = mine.flatMap((m) =>
        (m.match?.results ?? [])
          .filter((r) => !r.pass)
          .map((r) => ({
            ...r,
            who: mine.length > 1 ? m.name : undefined,
          })),
      )
      const passing = mine[0]?.match?.results.filter((r) => r.pass) ?? []
      return {
        acsp,
        eligible: mine.length > 0 && mine.every((m) => m.match?.eligible),
        failing,
        passing,
        caveat: passing.find((r) => r.caveat)?.caveat,
      }
    })
  }, [data, number, chosenKey, languages, maxTurnaroundHours, capacityToday])

  const eligibleAcsps = matches.filter((m) => m.eligible)
  const choice =
    acspChoice &&
    (acspChoice === 'platform_suggest' ||
      eligibleAcsps.some((m) => m.acsp.id === acspChoice))
      ? acspChoice
      : (eligibleAcsps[0]?.acsp.id ?? 'platform_suggest')
  const suggest = choice === 'platform_suggest'
  const instructing = suggest
    ? undefined
    : data.acsps.find((a) => a.id === choice)
  const partnerPays = payer === 'partner' && !suggest

  if (!company || company.lodgedByPartnerId !== partner.id) {
    return (
      <Page>
        <PageHeader
          title="Connect this company first"
          description="Invites can only be sent for companies connected to your portal."
        />
        <Button asChild variant="outline">
          <Link to={`/partner/companies/${number}`}>Back to the company</Link>
        </Button>
      </Page>
    )
  }

  if (!can.invite) {
    return (
      <Page>
        <PageHeader
          title="Your role cannot send invites"
          description="A Portfolio Viewer sees status but cannot send invites. Ask a Partner Administrator or a Referrer."
        />
        <Button asChild variant="outline">
          <Link to="/partner">Back to the portfolio</Link>
        </Button>
      </Page>
    )
  }

  const send = () => {
    apply((d) =>
      sendInvites(d, {
        companyNumber: number,
        personIds: chosen.map((r) => r.personId),
        partnerId: partner.id,
        actor: `${partner.contactName}, ${partner.name}`,
        instructingAcspId: choice,
        payer: partnerPays ? 'partner' : 'client',
        languages,
        maxTurnaroundHours,
      }),
    )
    const verified = chosen.filter((r) => r.registerVerified)
    toast({
      title: `${chosen.length} invite${chosen.length === 1 ? '' : 's'} sent`,
      description: verified.length
        ? `${verified.map((r) => r.name).join(', ')}: the register already shows an identity as verified (REG-04). They are told before payment and may continue or stop.`
        : 'Each one is pre-filled from the register and written to the audit trail.',
    })
    navigate(`/partner/invites?new=${chosen.length}`)
  }

  const acspName = instructing?.name ?? 'the ACSP the platform suggests'
  const fee = instructing?.profile.fee.standard

  return (
    <Page width="narrow">
      <Link
        to={`/partner/companies/${number}`}
        className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {company.name}
      </Link>
      <PageHeader
        kicker="Bulk invite"
        title="Invite directors and PSCs to verify"
        description="You introduce the people. The ACSP they instruct makes the verification and the decision."
      />
      <div className="mb-8">
        <Stepper steps={STEPS} current={step} />
      </div>

      {step === 0 && (
        <Panel aria-labelledby="people-step">
          <PanelHeader
            id="people-step"
            title="Who should verify?"
            description="Details are pre-filled from the Companies House register. Each person confirms them or asks for an amendment."
          />
          <ul className="divide-y divide-line/70">
            {rows.map((r) => {
              const entry = data.register.find(
                (e) => e.personId === r.personId && e.companyNumber === number,
              )!
              const person = data.people.find((p) => p.id === r.personId)!
              const id = `pick-${r.personId}`
              return (
                <li
                  key={r.personId}
                  className={cn(
                    'flex gap-4 px-5 py-5 sm:px-6',
                    !r.invitable && 'opacity-70',
                  )}
                >
                  <Checkbox
                    id={id}
                    className="mt-1"
                    disabled={!r.invitable}
                    checked={selected.includes(r.personId)}
                    onChange={() =>
                      setSelected((s) =>
                        s.includes(r.personId)
                          ? s.filter((x) => x !== r.personId)
                          : [...s, r.personId],
                      )
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={id}
                      className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1"
                    >
                      <Avatar seed={r.personId} name={r.name} size={36} />
                      <span className="text-base font-medium text-ink">
                        {r.name}
                      </span>
                      {r.partnerStatus && (
                        <PartnerStatusChip status={r.partnerStatus} />
                      )}
                    </label>
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-[0.9375rem] sm:grid-cols-3">
                      <Field
                        label="On the register"
                        value={
                          <span className="font-mono">
                            {entry.registerName}
                          </span>
                        }
                      />
                      <Field
                        label="Role"
                        value={`${roleLabel[entry.role]}, since ${formatShortDate(entry.appointedOn)}`}
                      />
                      <Field label="Email on file" value={person.email} />
                    </dl>
                    {!r.invitable && (
                      <p className="mt-2 text-[0.9375rem] text-slate">
                        {r.detail}. No invite needed.
                      </p>
                    )}
                    {r.invitable && r.registerVerified && (
                      <p className="mt-2 rounded-xl bg-mist px-3.5 py-2.5 text-[0.9375rem] text-graphite">
                        <span className="font-mono text-[0.8125rem] text-slate">
                          REG-04
                        </span>{' '}
                        Companies House already shows this person’s identity as
                        verified. They are told before payment and may continue
                        or stop. You are told too.
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <StepFooter>
            <span className="text-base text-slate">
              {chosen.length} of {eligible.length} selected
            </span>
            <Button disabled={!chosen.length} onClick={() => setStep(1)}>
              Continue
              <ArrowRight aria-hidden="true" />
            </Button>
          </StepFooter>
        </Panel>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <Panel aria-labelledby="criteria-step">
            <PanelHeader
              id="criteria-step"
              title="Instructing ACSP"
              description="The person instructs this ACSP, who verifies them and takes the payment. Evidence One is the ACSP's technology provider."
            />
            <div className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
              <fieldset>
                <legend className="mb-2 text-[0.9375rem] text-slate">
                  Languages the people can use
                </legend>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => {
                    const on = languages.includes(l)
                    return (
                      <label
                        key={l}
                        className={cn(
                          'inline-flex h-10 cursor-pointer items-center rounded-full border px-3.5 text-[0.9375rem] has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
                          on
                            ? 'border-ink bg-ink text-paper'
                            : 'border-line bg-white text-ink',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={on}
                          onChange={() =>
                            setLanguages((ls) =>
                              on ? ls.filter((x) => x !== l) : [...ls, l],
                            )
                          }
                        />
                        {l}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <div>
                <label
                  htmlFor="turnaround"
                  className="mb-2 block text-[0.9375rem] text-slate"
                >
                  Turnaround
                </label>
                <select
                  id="turnaround"
                  value={turnaround}
                  onChange={(e) => setTurnaround(Number(e.target.value))}
                  className="h-11 w-full rounded-lg border border-line bg-white px-3 text-base text-ink focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
                >
                  {TURNAROUND.map((t, i) => (
                    <option key={t.label} value={i}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-3 self-end text-base text-ink">
                <Checkbox
                  checked={capacityToday}
                  onChange={() => setCapacityToday((v) => !v)}
                />
                Capacity left today
              </label>
            </div>
            <p className="border-t border-line/70 px-5 py-3.5 text-[0.875rem] text-slate sm:px-6">
              Residence country, document type, issuing country and role come
              from each person’s register entry and details. Matching is
              evaluated by rules, never by AI.
            </p>
          </Panel>

          <fieldset className="space-y-3">
            <legend className="sr-only">Choose the instructing ACSP</legend>
            {matches.map((m) => (
              <AcspCard
                key={m.acsp.id}
                m={m}
                checked={choice === m.acsp.id}
                onChange={() => setAcspChoice(m.acsp.id)}
              />
            ))}
            <label
              className={cn(
                'flex cursor-pointer items-start gap-4 rounded-2xl border bg-white p-5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2',
                suggest
                  ? 'border-ink shadow-[0_0_0_1px_var(--ink)]'
                  : 'border-line hover:border-silver',
              )}
            >
              <input
                type="radio"
                name="acsp"
                className="mt-1.5 size-4 accent-[var(--ink)]"
                checked={suggest}
                onChange={() => setAcspChoice('platform_suggest')}
              />
              <span>
                <span className="block text-base font-medium text-ink">
                  Let Evidence One suggest an ACSP
                </span>
                <span className="mt-1 block text-[0.9375rem] text-graphite">
                  The platform ranks matching ACSPs on clear criteria, not AI.
                  Each person sees every suggestion with its own fee and
                  turnaround before they instruct one.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            <Button onClick={() => setStep(2)}>
              Continue
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Panel aria-labelledby="payment-step">
            <PanelHeader
              id="payment-step"
              title="Who pays?"
              description={
                fee !== undefined
                  ? `${acspName} charges ${formatMoney(fee)} for each verification. That is the ACSP's own fee.`
                  : 'Each ACSP sets its own fee. The person sees it before they pay.'
              }
            />
            <fieldset className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <legend className="sr-only">Who pays</legend>
              <RadioCard
                name="payer"
                checked={!partnerPays}
                onChange={() => setPayer('client')}
                icon={<CreditCard className="size-5" aria-hidden="true" />}
                title="The client pays"
                body={`Each person pays ${acspName} by card after they instruct the ACSP.`}
              />
              <RadioCard
                name="payer"
                checked={partnerPays}
                disabled={!partner.paymentCode || suggest}
                onChange={() => setPayer('partner')}
                icon={<Ticket className="size-5" aria-hidden="true" />}
                title="Referral Partner pays, with an Agent Payment Code"
                body={
                  !partner.paymentCode
                    ? 'No payment code on this account.'
                    : suggest
                      ? 'Name an ACSP in the previous step so the fee is known before you pay.'
                      : `${partner.name} pays. A single-use Agent Payment Code is generated for each invite and works for that invite only.`
                }
              />
            </fieldset>
            <p className="border-t border-line/70 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
              Evidence One collects the payment as the ACSP’s disclosed agent
              and pays it to the ACSP’s own payment account. The platform fee of{' '}
              {formatMoney(data.billing.settings.platformFee)} plus VAT applies
              to referred cases and is deducted from that payment. It is never
              added on top, so neither you nor the client pays more than the
              ACSP’s fee.
            </p>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <dl className="grid gap-4 text-base sm:grid-cols-3">
              <Field
                label="Invites"
                value={
                  <span className="text-lg text-ink tabular">
                    {chosen.length}
                  </span>
                }
              />
              <Field
                label="Fee"
                value={
                  <span className="text-lg text-ink tabular">
                    {fee !== undefined
                      ? partnerPays
                        ? `${formatMoney(fee * chosen.length)} to ${acspName}, paid by you`
                        : `${formatMoney(fee)} each, paid by the client`
                      : 'Shown once an ACSP is suggested'}
                  </span>
                }
              />
              <Field
                label="Instructing ACSP"
                value={<span className="text-lg text-ink">{acspName}</span>}
              />
            </dl>
          </Panel>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Preview invite
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && chosen[0] && (
        <div className="space-y-6">
          <Panel aria-labelledby="preview-step" className="overflow-hidden">
            <PanelHeader
              id="preview-step"
              title="Email preview"
              description={`Showing the invite for ${chosen[0].name}. Each person gets their own, pre-filled from the register.`}
            />
            <div className="bg-mist/60 p-4 sm:p-8">
              <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-line bg-white">
                <div className="border-b border-line px-6 py-4 text-[0.9375rem] text-slate">
                  <p>
                    <span className="text-ink">From:</span> Evidence One on
                    behalf of {partner.name}
                  </p>
                  <p>
                    <span className="text-ink">Subject:</span> Verify your
                    identity for {company.name}
                  </p>
                </div>
                <div className="px-6 py-7">
                  <Wordmark />
                  <p className="mt-6 text-lg text-ink">
                    Dear {chosen[0].name.split(' ')[0]},
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-graphite">
                    Companies House asks every director and person with
                    significant control to verify their identity. {partner.name}{' '}
                    has invited you to do this for {company.name}, in your
                    browser.
                  </p>
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">
                    <Building2 className="size-4 shrink-0" aria-hidden="true" />
                    {company.name} · {company.number} ·{' '}
                    {roleLabel[chosen[0].role]}
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-graphite">
                    {instructing
                      ? `Your identity verification is being conducted by ${instructing.name} using the Evidence One platform. `
                      : 'You will see ACSPs that suit you, each with its own fee, and choose one. '}
                    {partnerPays
                      ? `There is nothing to pay. ${partner.name} has covered the ACSP's fee.`
                      : instructing
                        ? `The ACSP's fee is ${formatMoney(instructing.profile.fee.standard)}, paid to ${instructing.name}.`
                        : 'You pay the ACSP you choose.'}
                  </p>
                  <span className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-base font-medium text-paper">
                    <Mail className="size-4" aria-hidden="true" />
                    Open my invite
                  </span>
                  <p className="mt-7 border-t border-line pt-4 text-[0.9375rem] leading-relaxed text-slate">
                    {instructing
                      ? attributionText(instructing.name)
                      : 'Evidence One is the technology provider of the ACSP you instruct.'}
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <MonoLabel>Sending to</MonoLabel>
            <ul className="mt-3 flex flex-wrap gap-2">
              {chosen.map((r) => (
                <li
                  key={r.personId}
                  className="rounded-full border border-line px-3.5 py-1.5 text-[0.9375rem] text-ink"
                >
                  {r.name}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.875rem] text-slate">
              Recorded in the audit trail as “Instructing ACSP:{' '}
              {instructing?.name ?? 'to be suggested by the platform'}”.
            </p>
          </Panel>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            <Button size="lg" onClick={send}>
              <Send aria-hidden="true" />
              Send {chosen.length} invite{chosen.length === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}
    </Page>
  )
}

function AcspCard({
  m,
  checked,
  onChange,
}: {
  m: CardMatch
  checked: boolean
  onChange: () => void
}) {
  const { acsp } = m
  const p = acsp.profile
  return (
    <label
      className={cn(
        'flex items-start gap-4 rounded-2xl border bg-white p-5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2',
        m.eligible ? 'cursor-pointer' : 'cursor-not-allowed opacity-80',
        checked
          ? 'border-ink shadow-[0_0_0_1px_var(--ink)]'
          : 'border-line hover:border-silver',
      )}
    >
      <input
        type="radio"
        name="acsp"
        className="mt-1.5 size-4 accent-[var(--ink)]"
        checked={checked}
        disabled={!m.eligible}
        onChange={onChange}
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-base font-medium text-ink">{acsp.name}</span>
          <AcspStatusChip status={acsp.status} />
          <span className="inline-flex items-center gap-1 text-[0.875rem] text-graphite">
            {m.eligible ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <X className="size-4" aria-hidden="true" />
            )}
            {m.eligible ? 'Matches' : 'Does not match'}
          </span>
        </span>
        <span className="mt-1 block text-[0.9375rem] text-graphite">
          Fee {formatMoney(p.fee.standard)} · Turnaround{' '}
          {p.targetTurnaroundHours} hours · {capacityLeftToday(acsp)} places
          left today · {p.languages.join(', ')}
        </span>
        {m.eligible && m.caveat && (
          <span className="mt-1 block text-[0.875rem] text-slate">
            {m.caveat}
          </span>
        )}
        {!m.eligible && (
          <ul className="mt-2 space-y-0.5 text-[0.875rem] text-slate">
            {m.failing.length === 0 && (
              <li>{acsp.statusNote ?? 'Not available for this invite.'}</li>
            )}
            {m.failing.map((f, i) => (
              <li key={i}>
                <span className="font-mono">{f.ruleId}</span> {f.reason}
                {f.who ? ` (${f.who})` : ''}
              </li>
            ))}
          </ul>
        )}
        {m.eligible && m.passing.length > 0 && (
          <details className="mt-2 text-[0.875rem] text-slate">
            <summary className="cursor-pointer underline-offset-4 hover:underline">
              Why this ACSP matches
            </summary>
            <ul className="mt-1 space-y-0.5">
              {m.passing.map((r) => (
                <li key={r.ruleId}>
                  <span className="font-mono">{r.ruleId}</span> {r.reason}
                </li>
              ))}
            </ul>
          </details>
        )}
      </span>
    </label>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate">{label}</dt>
      <dd className="mt-0.5 break-words text-ink">{value}</dd>
    </div>
  )
}

function StepFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line/80 px-5 py-4 sm:px-6">
      {children}
    </div>
  )
}

function RadioCard({
  name,
  checked,
  disabled,
  onChange,
  icon,
  title,
  body,
}: {
  name: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer flex-col rounded-2xl border p-5 transition-[border-color,background-color,box-shadow] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2',
        checked
          ? 'border-ink bg-white shadow-[0_0_0_1px_var(--ink)]'
          : 'border-line bg-white hover:border-silver',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />
      <span className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-mist text-ink">
          {icon}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'flex size-5 items-center justify-center rounded-full border-[1.5px]',
            checked ? 'border-ink' : 'border-silver',
          )}
        >
          {checked && <span className="size-2.5 rounded-full bg-ink" />}
        </span>
      </span>
      <span className="mt-4 text-base font-medium text-ink">{title}</span>
      <span className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">
        {body}
      </span>
    </label>
  )
}
