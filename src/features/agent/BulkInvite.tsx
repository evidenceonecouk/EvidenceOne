import { ArrowLeft, ArrowRight, Building2, CreditCard, Mail, Send, ShieldCheck, Ticket, Waypoints } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Checkbox, MonoLabel, Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { Stepper } from '@/components/app/Stepper'
import { useToast } from '@/components/app/Toaster'
import { LogoMark } from '@/components/brand/Logo'
import { PersonStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { PRIMARY_ACSP_ID } from '@/data/organisations'
import { attributionText } from '@/lib/attribution'
import { formatMoney, formatShortDate, VERIFICATION_FEE } from '@/lib/format'
import { Avatar } from '@/components/visual/Avatar'
import { cn } from '@/lib/utils'
import { sendInvites } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { getAcsp, getAgent, getCompany, peopleForCompany, roleLabel } from '@/store/selectors'
import type { PaymentMethod } from '@/types/domain'

const STEPS = ['Choose people', 'Payment and review', 'Preview and send']

export function BulkInvite() {
  const { number = '' } = useParams()
  const [params] = useSearchParams()
  const { data, state, apply } = useDemoStore()
  const toast = useToast()
  const navigate = useNavigate()
  const company = getCompany(data, number)
  const agent = getAgent(data, state.agentId)!
  const acsp = getAcsp(data, PRIMARY_ACSP_ID)!
  const rows = company ? peopleForCompany(data, number) : []
  const eligible = rows.filter((r) => r.invitable)
  const preselected = (params.get('people') ?? '').split(',').filter((id) => eligible.some((r) => r.personId === id))

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>(preselected.length ? preselected : eligible.map((r) => r.personId))
  const [payment, setPayment] = useState<PaymentMethod>(agent.paymentCode ? 'agent_payment_code' : 'pay_myself')
  const [review, setReview] = useState<'referred' | 'in_house'>('referred')

  if (!company || company.lodgedByAgentId !== agent.id) {
    return (
      <Page>
        <PageHeader title="Connect this company first" description="Invites can only be sent for companies connected to your portal." />
        <Button asChild variant="outline">
          <Link to={`/agent/companies/${number}`}>Back to the company</Link>
        </Button>
      </Page>
    )
  }

  const chosen = eligible.filter((r) => selected.includes(r.personId))
  const total = chosen.length * VERIFICATION_FEE
  const reviewer = review === 'in_house' ? agent.name : acsp.name

  const send = () => {
    apply((d) => sendInvites(d, { companyNumber: number, personIds: chosen.map((r) => r.personId), agentId: agent.id, actor: `${agent.contactName}, ${agent.name}`, payment, review }))
    toast({
      title: `${chosen.length} invite${chosen.length === 1 ? '' : 's'} sent`,
      description: `Each one is pre-filled from the register and written to the audit trail.`,
    })
    navigate(`/agent/invites?new=${chosen.length}`)
  }

  return (
    <Page width="narrow">
      <Link to={`/agent/companies/${number}`} className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {company.name}
      </Link>
      <PageHeader kicker="Bulk invite" title="Invite directors and PSCs to verify" />
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
              const entry = data.register.find((e) => e.personId === r.personId && e.companyNumber === number)!
              const person = data.people.find((p) => p.id === r.personId)!
              const id = `pick-${r.personId}`
              return (
                <li key={r.personId} className={cn('flex gap-4 px-5 py-5 sm:px-6', !r.invitable && 'opacity-70')}>
                  <Checkbox
                    id={id}
                    className="mt-1"
                    disabled={!r.invitable}
                    checked={selected.includes(r.personId)}
                    onChange={() => setSelected((s) => (s.includes(r.personId) ? s.filter((x) => x !== r.personId) : [...s, r.personId]))}
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={id} className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
                      <Avatar seed={r.personId} name={r.name} size={36} />
                      <span className="text-base font-medium text-ink">{r.name}</span>
                      <PersonStatusChip status={r.status} />
                    </label>
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-[0.9375rem] sm:grid-cols-3">
                      <Field label="On the register" value={<span className="font-mono">{entry.registerName}</span>} />
                      <Field label="Role" value={`${roleLabel[entry.role]}, since ${formatShortDate(entry.appointedOn)}`} />
                      <Field label="Email on file" value={person.email} />
                    </dl>
                    {!r.invitable && <p className="mt-2 text-[0.9375rem] text-slate">{r.detail}. No invite needed.</p>}
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
          <Panel aria-labelledby="payment-step">
            <PanelHeader id="payment-step" title="Who pays?" description={`A flat ${formatMoney(VERIFICATION_FEE)} per verification.`} />
            <fieldset className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <legend className="sr-only">Payment</legend>
              <RadioCard
                name="payment"
                checked={payment === 'agent_payment_code'}
                disabled={!agent.paymentCode}
                onChange={() => setPayment('agent_payment_code')}
                icon={<Ticket className="size-5" aria-hidden="true" />}
                title="Agent Payment Code"
                body={agent.paymentCode ? `${agent.name} pays. Code ${agent.paymentCode} is attached to each invite, so nobody pays separately.` : 'No payment code on this account.'}
              />
              <RadioCard
                name="payment"
                checked={payment === 'pay_myself'}
                onChange={() => setPayment('pay_myself')}
                icon={<CreditCard className="size-5" aria-hidden="true" />}
                title="Pay myself"
                body={`Each person pays ${formatMoney(VERIFICATION_FEE)} by card at the end of their journey.`}
              />
            </fieldset>
          </Panel>

          <Panel aria-labelledby="review-step">
            <PanelHeader id="review-step" title="Who makes the decision?" description="Only an ACSP can approve or decline a verification." />
            {agent.hasAcspStatus ? (
              <fieldset className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                <legend className="sr-only">Review</legend>
                <RadioCard
                  name="review"
                  checked={review === 'referred'}
                  onChange={() => setReview('referred')}
                  icon={<Waypoints className="size-5" aria-hidden="true" />}
                  title="Refer to an ACSP on Evidence One"
                  body={`${acsp.name} reviews each case and makes the decision.`}
                />
                <RadioCard
                  name="review"
                  checked={review === 'in_house'}
                  onChange={() => setReview('in_house')}
                  icon={<ShieldCheck className="size-5" aria-hidden="true" />}
                  title="Review in-house"
                  body={`${agent.name} has ACSP status, so your own reviewers can approve or decline.`}
                />
              </fieldset>
            ) : (
              <p className="flex gap-3 p-5 text-base leading-relaxed text-graphite sm:p-6">
                <Waypoints className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                Referred to {acsp.name}. {agent.name} does not have ACSP status, so an ACSP on Evidence One makes the decision.
              </p>
            )}
          </Panel>

          <Panel className="p-5 sm:p-6">
            <dl className="grid gap-4 text-base sm:grid-cols-3">
              <Field label="Invites" value={<span className="text-lg text-ink tabular">{chosen.length}</span>} />
              <Field label="Fee" value={<span className="text-lg text-ink tabular">{payment === 'agent_payment_code' ? `${formatMoney(total)} to ${agent.name}` : `${formatMoney(VERIFICATION_FEE)} each, paid by card`}</span>} />
              <Field label="Decision by" value={<span className="text-lg text-ink">{reviewer}</span>} />
            </dl>
          </Panel>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            <Button onClick={() => setStep(2)}>
              Preview invite
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && chosen[0] && (
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
                    <span className="text-ink">From:</span> Evidence One on behalf of {agent.name}
                  </p>
                  <p>
                    <span className="text-ink">Subject:</span> Verify your identity for {company.name}
                  </p>
                </div>
                <div className="px-6 py-7">
                  <LogoMark className="size-7 p-1.5" />
                  <p className="mt-6 text-lg text-ink">Dear {chosen[0].name.split(' ')[0]},</p>
                  <p className="mt-3 text-base leading-relaxed text-graphite">
                    Companies House now asks every director and person with significant control to verify their identity. {agent.name} has invited you to do this for {company.name}.
                  </p>
                  <div className="mt-5 flex items-center gap-3 rounded-xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">
                    <Building2 className="size-4 shrink-0" aria-hidden="true" />
                    {company.name} · {company.number} · {roleLabel[chosen[0].role]}
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-graphite">
                    {payment === 'agent_payment_code'
                      ? `There is nothing to pay. ${agent.name} has covered the fee.`
                      : `The fee is ${formatMoney(VERIFICATION_FEE)}, paid by card at the end.`}{' '}
                    It takes about five minutes with your passport and phone.
                  </p>
                  <span className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-5 text-base font-medium text-paper">
                    <Mail className="size-4" aria-hidden="true" />
                    Open my invite
                  </span>
                  <p className="mt-7 border-t border-line pt-4 text-[0.9375rem] leading-relaxed text-slate">{attributionText(reviewer)}</p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <MonoLabel>Sending to</MonoLabel>
            <ul className="mt-3 flex flex-wrap gap-2">
              {chosen.map((r) => (
                <li key={r.personId} className="rounded-full border border-line px-3.5 py-1.5 text-[0.9375rem] text-ink">
                  {r.name}
                </li>
              ))}
            </ul>
          </Panel>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
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

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-slate">{label}</dt>
      <dd className="mt-0.5 break-words text-ink">{value}</dd>
    </div>
  )
}

function StepFooter({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 border-t border-line/80 px-5 py-4 sm:px-6">{children}</div>
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
        checked ? 'border-ink bg-white shadow-[0_0_0_1px_var(--ink)]' : 'border-line bg-white hover:border-silver',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
      <span className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-mist text-ink">{icon}</span>
        <span aria-hidden="true" className={cn('flex size-5 items-center justify-center rounded-full border-[1.5px]', checked ? 'border-ink' : 'border-silver')}>
          {checked && <span className="size-2.5 rounded-full bg-ink" />}
        </span>
      </span>
      <span className="mt-4 text-base font-medium text-ink">{title}</span>
      <span className="mt-1 text-[0.9375rem] leading-relaxed text-graphite">{body}</span>
    </label>
  )
}
