import { Building2, Check, ChevronRight, Home, PenLine, Ticket } from 'lucide-react'
import { useState } from 'react'
import { AttributionNote } from '@/components/AttributionNote'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { Button } from '@/components/ui/button'
import { formatAddress, formatDate, formatShortDate } from '@/lib/format'
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
      <ScreenTitle>Hello {person.givenNames.split(' ')[0]}, you have been invited to verify your identity</ScreenTitle>
      <Lead>
        Companies House asks every director and PSC to verify their identity. {agent?.name} has started this for you. It takes about five minutes.
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
          Nothing to pay. {agent?.name} has covered the fee with an Agent Payment Code.
        </p>
      )}
      <AttributionNote acspName={reviewerOrgName(data, vc.acspId)} className="mt-6 text-[0.9375rem]" />
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
    apply((d) => updateJourney(d, vc.id, { detailsConfirmed: true }, { action: 'details.confirmed', detail: 'Pre-filled details confirmed against the Companies House register.' }))
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
            <Button className="w-full" variant="ghost" onClick={() => setAmending(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <ScreenTitle kicker="Ask for an amendment">What needs to change?</ScreenTitle>
        <Lead>Your request goes to the Agent who invited you. If the register itself is wrong, it is corrected before your verification is completed.</Lead>
        <fieldset className="mt-5">
          <legend className="text-[0.9375rem] font-medium text-ink">Detail</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {['Name', 'Date of birth', 'Role', 'Contact details'].map((f) => (
              <label key={f} className={`cursor-pointer rounded-xl border px-3 py-3 text-[0.9375rem] transition-colors duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink ${field === f ? 'border-ink bg-white text-ink' : 'border-line text-graphite'}`}>
                <input type="radio" name="field" className="sr-only" checked={field === f} onChange={() => setField(f)} />
                {f}
              </label>
            ))}
          </div>
        </fieldset>
        <label htmlFor="amend-note" className="mt-5 block text-[0.9375rem] font-medium text-ink">
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
          <Button className="w-full" variant="ghost" onClick={() => setAmending(true)}>
            <PenLine aria-hidden="true" />
            Ask for an amendment
          </Button>
        </>
      }
    >
      <ScreenTitle kicker="Your details">Check the details we hold</ScreenTitle>
      <Lead>Your identity details must match the Companies House register exactly.</Lead>
      {amendment && (
        <p className="mt-4 flex gap-2.5 rounded-2xl bg-mist px-4 py-3 text-[0.9375rem] text-graphite">
          <CompletionTick className="size-5" label="Sent" />
          Amendment request sent on {formatShortDate(amendment.at)}. You can carry on while it is reviewed.
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
        <p className="mt-2 font-mono text-[0.8125rem] text-slate">Register: {entry.registerName}</p>
      </div>
    </Screen>
  )
}

export function AddressStep({ vc, person, next }: StepProps) {
  const { apply } = useDemoStore()
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  const relevant = person.addressHistory.filter((a) => !a.to || new Date(a.to) >= yearAgo)
  const confirm = () => {
    apply((d) => updateJourney(d, vc.id, { addressConfirmed: true }, { action: 'address.history_provided', detail: `12-month address history provided: ${relevant.length} address${relevant.length === 1 ? '' : 'es'}.` }))
    next()
  }
  return (
    <Screen
      footer={
        <Button className="w-full" size="lg" onClick={confirm}>
          Confirm address history
        </Button>
      }
    >
      <ScreenTitle kicker="Address history">Where have you lived in the last 12 months?</ScreenTitle>
      <Lead>We only need information here. You will not be asked for proof unless it is needed.</Lead>
      <ol className="mt-5 space-y-3">
        {relevant.map((a, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
            <Home className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm text-slate">{a.to ? 'Previous address' : 'Current address'}</p>
              <p className="mt-0.5 text-base text-ink">{formatAddress(a.address)}</p>
              <p className="mt-1 text-[0.9375rem] text-slate">
                {new Date(a.from).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} to {a.to ? new Date(a.to).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'present'}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-center gap-2.5 text-[0.9375rem] text-graphite">
        <CompletionTick className="size-5" label="Covered" />
        The last 12 months are covered
      </p>
    </Screen>
  )
}
