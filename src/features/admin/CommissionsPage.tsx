import {
  CircleCheck,
  Eye,
  GitBranch,
  Send,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Undo2,
  UserCheck,
} from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Page, Panel, PanelHeader } from '@/components/app/Page'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { PendingDecision } from '@/components/PendingDecision'
import { ReferralDisclosureCard } from '@/components/ReferralDisclosureCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminHeader, StateBadge } from '@/features/admin/kit'
import {
  ApprovalCard,
  otherSeatLabel,
  SeatNotice,
  SuperOnlyNotice,
  useSuperSeat,
} from '@/features/super/ApprovalFlow'
import { formatDate, formatDateTime } from '@/lib/format'
import { currentRuleSet, draftRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import {
  discardDraft,
  proposeRuleChange,
  publishDraft,
  returnDraft,
  submitDraft,
} from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import {
  currentDisclosureVersion,
  isSamePerson,
  nextDisclosureVersion,
  pendingOfKind,
  proposeChange,
  recordStepUp,
} from '@/store/superActions'
import type { ReferralRecord } from '@/types/domain'

const EXAMPLE_AMOUNT = 15
const REGULATORS = ['SRA', 'ICAEW', 'ACCA', 'Other']

/** Referral commissions: the regulatory switch, the disclosure and the consent records. */
export function CommissionsPage() {
  const { data } = useDemoStore()
  const { isSuper } = useSuperSeat()
  const on = currentRuleSet(data).settings.referral_commissions === true
  const waiting = data.approvals.filter(
    (a) =>
      (a.kind === 'referral_commissions' || a.kind === 'disclosure_text') &&
      a.status === 'pending',
  )

  return (
    <Page>
      <AdminHeader
        kicker="Super Administrator"
        title="Referral commissions"
        description="Referral Commission is its own fee type. It is Off at launch. This page shows the regulatory switch, the disclosure a client sees and the records kept, so the arrangement can be demonstrated end to end."
        meta={
          <StateBadge
            tone={on ? 'attention' : 'neutral'}
            icon={on ? ToggleRight : ToggleLeft}
          >
            Referral commissions: {on ? 'On' : 'Off'}
          </StateBadge>
        }
      />
      {isSuper ? (
        <SeatNotice />
      ) : (
        <SuperOnlyNotice what="the commissions setting, the disclosure and the referral records" />
      )}

      {waiting.length > 0 && (
        <section
          className="mb-8 space-y-4"
          aria-label="Waiting for a second approver"
        >
          <h2 className="text-lg font-medium text-ink">
            Waiting for a second approver
          </h2>
          {waiting.map((a) => (
            <ApprovalCard key={a.id} approval={a} readOnly={!isSuper} />
          ))}
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.15fr_1fr]">
        <SwitchPanel on={on} canEdit={isSuper} />
        <DisclosurePanel canEdit={isSuper} />
      </div>

      <PartnersPanel on={on} />
      <RecordsPanel on={on} />
    </Page>
  )
}

/* The switch: a draft rule version with a second approver. */

function SwitchPanel({ on, canEdit }: { on: boolean; canEdit: boolean }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const { actor, seat, other, setSeat } = useSuperSeat()
  const id = useId()
  const draft = draftRuleSet(data)
  const current = currentRuleSet(data)
  const target = !on
  const draftHasTarget =
    !!draft && (draft.settings.referral_commissions === true) === target
  const pending = draft?.status === 'pending_approval'
  const mineToPublish =
    pending && draft && isSamePerson(draft.submittedBy ?? '', actor)
  const today = new Date().toISOString().slice(0, 10)
  const [effective, setEffective] = useState(today)
  const [note, setNote] = useState('')
  const [step, setStep] = useState<
    'propose' | 'submit' | 'publish' | 'return' | null
  >(null)

  const verb = target ? 'On' : 'Off'
  const stage = !draft || !draftHasTarget ? 1 : pending ? 3 : 2

  const steps = [
    {
      n: 1,
      label: 'Propose in a draft rule set',
      detail: 'One Super Administrator',
    },
    {
      n: 2,
      label: 'Submit for approval',
      detail: 'The same Super Administrator',
    },
    {
      n: 3,
      label: 'Publish with an effective date',
      detail: 'A different Super Administrator',
    },
  ]

  const confirmed = (ref: string) => {
    const which = step
    setStep(null)
    if (which === 'propose') {
      apply((d) =>
        proposeRuleChange(
          d,
          { kind: 'setting', key: 'referral_commissions', value: target },
          actor,
        ),
      )
      apply((d) =>
        recordStepUp(
          d,
          actor,
          'ruleset.commissions.proposed',
          `Referral commissions ${verb} proposed in a draft rule set. Current version ${current.version} is unchanged.`,
          ref,
        ),
      )
      toast({
        title: `Draft proposes commissions ${verb}`,
        description: `Step-up ${ref} recorded in the audit trail.`,
      })
    } else if (which === 'submit') {
      apply((d) => submitDraft(d, actor))
      apply((d) =>
        recordStepUp(
          d,
          actor,
          'ruleset.commissions.submitted',
          `Draft ${draft?.version} submitted for a second approver.`,
          ref,
        ),
      )
      toast({
        title: 'Submitted for a second approver',
        description: `Switch seat to ${other.name} to publish.`,
      })
    } else if (which === 'publish') {
      const iso = new Date(`${effective}T00:00:00`).toISOString()
      apply((d) => publishDraft(d, iso, actor))
      apply((d) =>
        recordStepUp(
          d,
          actor,
          'ruleset.commissions.published',
          `Referral commissions ${verb} published in rule set ${draft?.version}, effective ${effective}.`,
          ref,
        ),
      )
      toast({
        title: `Referral commissions are now ${verb}`,
        description: `Published with step-up ${ref}.`,
      })
    } else if (which === 'return') {
      apply((d) => returnDraft(d, actor, note || 'Returned for changes.'))
      apply((d) =>
        recordStepUp(
          d,
          actor,
          'ruleset.commissions.returned',
          `Draft ${draft?.version} returned to draft by the second approver.`,
          ref,
        ),
      )
      toast({ title: 'Returned to draft' })
    }
  }

  const stepAction: Record<NonNullable<typeof step>, string> = {
    propose: `propose switching referral commissions ${verb}`,
    submit: 'submit the draft rule set for a second approver',
    publish: `publish referral commissions ${verb}`,
    return: 'return the draft rule set',
  }

  return (
    <Panel aria-labelledby={`${id}-title`}>
      <PanelHeader
        id={`${id}-title`}
        title="The regulatory switch"
        description="Setting key referral_commissions, held in the rule set"
        actions={
          <Link
            to="/rules"
            className="text-[0.9375rem] font-medium text-ink underline underline-offset-4 decoration-silver hover:decoration-ink"
          >
            Open the Rules page
          </Link>
        }
      />
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <p className="text-base text-graphite">
          Commissions are{' '}
          <span className="font-medium text-ink">{on ? 'On' : 'Off'}</span> in
          rule set {current.version}.{' '}
          {on
            ? 'A client introduced by a partner that wishes to receive payment sees the disclosure before payment, and a referral record is kept.'
            : 'Nothing is shown to clients and no commission is ever credited (REF-01).'}
        </p>

        <ol
          className="grid gap-3 sm:grid-cols-3"
          aria-label="Steps to change the switch"
        >
          {steps.map((s) => (
            <li
              key={s.n}
              aria-current={s.n === stage ? 'step' : undefined}
              className={cn(
                'rounded-xl border px-4 py-3',
                s.n === stage
                  ? 'border-ink bg-white'
                  : s.n < stage
                    ? 'border-line bg-mist'
                    : 'border-dashed border-line bg-white',
              )}
            >
              <p className="flex items-center gap-2 font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">
                {s.n < stage ? (
                  <CircleCheck
                    className="size-4 text-approve"
                    aria-hidden="true"
                  />
                ) : (
                  <span aria-hidden="true">{s.n}</span>
                )}
                Step {s.n}
              </p>
              <p className="mt-1 text-base font-medium text-ink">{s.label}</p>
              <p className="text-[0.875rem] text-slate">{s.detail}</p>
            </li>
          ))}
        </ol>

        {draft && (
          <p className="flex items-start gap-2 text-[0.9375rem] text-slate">
            <GitBranch className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              Draft rule set {draft.version}, created by{' '}
              {draft.createdBy.split(',')[0]}, is{' '}
              {pending ? 'waiting for a second approver' : 'still a draft'}.
              Version {current.version} stays in force until it is published.
              Any other change in this draft is reviewed on the Rules page.
            </span>
          </p>
        )}

        {canEdit && stage === 1 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => setStep('propose')}>
              <GitBranch aria-hidden="true" />
              Propose commissions {verb} in a draft
            </Button>
            <p className="text-[0.9375rem] text-slate">
              Creates or updates a draft rule set. Nothing changes until it is
              published.
            </p>
          </div>
        )}

        {canEdit && stage === 2 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => setStep('submit')}>
              <Send aria-hidden="true" />
              Submit for a second approver
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                apply((d) => discardDraft(d, actor))
                toast({
                  title: 'Draft discarded',
                  description: 'Nothing was published.',
                })
              }}
            >
              <Trash2 aria-hidden="true" />
              Discard draft
            </Button>
          </div>
        )}

        {canEdit && stage === 3 && mineToPublish && (
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.9375rem] text-graphite">
              <span className="font-medium text-ink">
                You submitted this draft, so you cannot publish it.
              </span>{' '}
              Switch seat in the sidebar to {other.name}, the second approver.
            </p>
            <Button className="shrink-0" onClick={() => setSeat(other.seat)}>
              <UserCheck aria-hidden="true" />
              {otherSeatLabel(other.seat, other.name)}
            </Button>
          </div>
        )}

        {canEdit && stage === 3 && !mineToPublish && (
          <div className="space-y-3 rounded-xl border border-ink/20 bg-white px-4 py-4">
            <p className="text-[0.9375rem] text-graphite">
              <span className="font-medium text-ink">
                You are the second approver ({seat.name}).
              </span>{' '}
              Publishing makes this rule set current and supersedes{' '}
              {current.version}. Decided cases keep the version applied at their
              decision.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor={`${id}-eff`}
                  className="text-base font-medium text-ink"
                >
                  Effective date
                </label>
                <input
                  id={`${id}-eff`}
                  type="date"
                  value={effective}
                  min={today}
                  onChange={(e) => setEffective(e.target.value)}
                  className="mt-2 block h-12 rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                />
              </div>
              <Button
                size="lg"
                disabled={!effective}
                onClick={() => setStep('publish')}
              >
                <CircleCheck aria-hidden="true" />
                Publish, commissions {verb}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep('return')}
              >
                <Undo2 aria-hidden="true" />
                Return to draft
              </Button>
            </div>
            <div>
              <label
                htmlFor={`${id}-note`}
                className="text-[0.9375rem] text-slate"
              >
                Note if returning to draft (optional)
              </label>
              <input
                id={`${id}-note`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 block h-11 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
              />
            </div>
          </div>
        )}

        {!canEdit && (
          <p className="text-[0.9375rem] text-slate">
            Super Administrator only, with a second approver.
          </p>
        )}
      </div>
      <StepUpDialog
        open={step !== null}
        action={step ? stepAction[step] : 'confirm'}
        onClose={() => setStep(null)}
        onConfirmed={confirmed}
      />
    </Panel>
  )
}

/* The disclosure and its version. */

function DisclosurePanel({ canEdit }: { canEdit: boolean }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const { actor } = useSuperSeat()
  const id = useId()
  const [preview, setPreview] = useState(false)
  const [consent, setConsent] = useState(false)
  const [stepUp, setStepUp] = useState(false)
  const version = currentDisclosureVersion(data)
  const waiting = !!pendingOfKind(data, 'disclosure_text')
  const partner =
    data.partners.find((p) => p.referralPayment.wishes) ?? data.partners[0]

  return (
    <Panel aria-labelledby={`${id}-title`}>
      <PanelHeader
        id={`${id}-title`}
        title="Disclosure and consent"
        description={`Disclosure text ${version} is in force`}
      />
      <div className="space-y-4 px-5 py-5 sm:px-6">
        <blockquote className="rounded-xl border-l-4 border-ink bg-mist px-4 py-3 text-lg leading-relaxed text-ink">
          Referral arrangement disclosure. [Partner] introduced you to Evidence
          One and may receive £[amount] if you purchase this service. This
          commercial arrangement does not increase the price you pay.
        </blockquote>
        <p className="text-base text-graphite">
          It is followed by an acknowledgement or a consent, as the partner’s
          regulator requires: {REGULATORS.join(', ')}. The client sees it before
          payment, never after. Which regulator needs consent rather than an
          acknowledgement is for the client to confirm.
        </p>
        <PendingDecision />
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="lg" onClick={() => setPreview(true)}>
            <Eye aria-hidden="true" />
            Preview as a client
          </Button>
          {canEdit && (
            <Button
              variant="outline"
              size="lg"
              disabled={waiting}
              onClick={() => setStepUp(true)}
            >
              <Send aria-hidden="true" />
              Propose disclosure {nextDisclosureVersion(data)}
            </Button>
          )}
        </div>
        {canEdit && (
          <p className="text-[0.9375rem] text-slate">
            {waiting
              ? 'A disclosure text version is already waiting for a second approver.'
              : 'Publishing new disclosure text needs a second approver, like the switch.'}
          </p>
        )}
      </div>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-xl rounded-[24px]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-medium">
              What the client sees before payment
            </DialogTitle>
            <DialogDescription className="text-base text-slate">
              Shown only when commissions are On and{' '}
              {partner?.name ?? 'the partner'} has said it wishes to receive
              payment for referrals. An example amount of £{EXAMPLE_AMOUNT} is
              used here.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2" role="group" aria-label="Form shown">
            {[
              { v: false, label: 'Acknowledgement' },
              { v: true, label: 'Consent' },
            ].map((o) => (
              <Button
                key={o.label}
                variant={consent === o.v ? 'default' : 'outline'}
                aria-pressed={consent === o.v}
                onClick={() => setConsent(o.v)}
              >
                {o.label}
              </Button>
            ))}
          </div>
          <ReferralDisclosureCard
            key={String(consent)}
            partnerName={partner?.name ?? 'Your partner'}
            amount={EXAMPLE_AMOUNT}
            consentRequired={consent}
            onAcknowledge={() => undefined}
          />
          <p className="text-[0.9375rem] text-slate">
            This is a preview. Nothing is recorded and no client is affected.
          </p>
        </DialogContent>
      </Dialog>

      <StepUpDialog
        open={stepUp}
        action="propose new disclosure text"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          const next = nextDisclosureVersion(data)
          apply((d) =>
            proposeChange(
              d,
              {
                kind: 'disclosure_text',
                payload: { kind: 'disclosure_text', version: next },
                summary: `Publish referral disclosure text ${next}`,
                from: version,
                to: next,
              },
              actor,
              ref,
            ),
          )
          toast({
            title: `Disclosure ${next} proposed`,
            description: `Waiting for a second approver. Step-up ${ref} recorded.`,
          })
        }}
      />
    </Panel>
  )
}

/* Partners and their answer to "Do you wish to receive payment for referrals?" */

function PartnersPanel({ on }: { on: boolean }) {
  const { data } = useDemoStore()
  return (
    <Panel className="mt-8" aria-labelledby="partners-answer">
      <PanelHeader
        id="partners-answer"
        title="Referral Partners and their answer"
        description="From onboarding: “Do you wish to receive payment for referrals?”"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-3xl text-left text-[0.9375rem]">
          <caption className="sr-only">
            Each Referral Partner, whether it wishes to receive payment and its
            regulator
          </caption>
          <thead>
            <tr className="border-b border-line text-slate">
              {[
                'Referral Partner',
                'Wishes to receive payment',
                'Regulator',
                'What its clients see',
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-5 py-3 font-medium first:sm:pl-6"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.partners.map((p) => {
              const wishes = p.referralPayment.wishes
              return (
                <tr
                  key={p.id}
                  className="border-b border-line/60 last:border-0"
                >
                  <th
                    scope="row"
                    className="px-5 py-3.5 text-left font-medium text-ink sm:pl-6"
                  >
                    {p.name}
                  </th>
                  <td className="px-5 py-3.5 text-graphite">
                    {wishes ? 'Yes' : 'No'}
                  </td>
                  <td className="px-5 py-3.5 text-graphite">
                    {wishes
                      ? (p.referralPayment.regulator ?? 'Not given')
                      : 'Not applicable'}
                  </td>
                  <td className="px-5 py-3.5 text-graphite">
                    {!wishes
                      ? 'Nothing. No referral arrangement.'
                      : on
                        ? 'The disclosure, then an acknowledgement or consent, before payment'
                        : 'Nothing while commissions are Off'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/* The referral records: exactly nine fields. */

const FIELDS: (keyof ReferralRecord)[] = [
  'referral_partner',
  'regulator',
  'commission_type',
  'commission_amount',
  'disclosure_version',
  'disclosed_at',
  'consent_required',
  'consent_at',
  'payment_at',
]

function cell(r: ReferralRecord, f: keyof ReferralRecord) {
  const v = r[f]
  if (v === undefined || v === null) return 'Not yet'
  if (f === 'commission_amount') return `£${Number(v).toFixed(2)}`
  if (f === 'consent_required') return v ? 'Yes' : 'No'
  if (f.endsWith('_at')) return formatDateTime(String(v))
  return String(v)
}

function RecordsPanel({ on }: { on: boolean }) {
  const { data } = useDemoStore()
  const records = data.referralRecords
  return (
    <Panel className="mt-8" aria-labelledby="referral-records">
      <PanelHeader
        id="referral-records"
        title="Referral records"
        description="One record per introduced client who reaches payment. Exactly these nine fields."
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-5xl text-left text-[0.9375rem]">
          <caption className="sr-only">
            Referral records with their nine fields
          </caption>
          <thead>
            <tr className="border-b border-line text-slate">
              {FIELDS.map((f) => (
                <th
                  key={f}
                  scope="col"
                  className="px-4 py-3 font-mono text-[0.8125rem] font-medium whitespace-nowrap first:sm:pl-6"
                >
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={FIELDS.length} className="px-5 py-8 sm:px-6">
                  <p className="text-base font-medium text-ink">
                    {on
                      ? 'No referral records yet'
                      : 'No referral records while commissions are Off'}
                  </p>
                  <p className="mt-1 max-w-3xl text-base text-slate">
                    {on
                      ? 'A record is created when a client introduced by a partner that wishes to receive payment sees the disclosure and reaches payment. It holds the disclosure version, when it was shown, any consent and when the payment was made.'
                      : 'With commissions Off no disclosure is shown to a client and no commission is ever credited (REF-01). Switching them On in a draft rule set, with a second approver, starts the records.'}
                  </p>
                  {records.length === 0 && (
                    <p className="mt-2 text-[0.875rem] text-slate">
                      Referral Commission is separate from the Platform Fee,
                      which is charged to the ACSP on the Fees and plans page.
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {FIELDS.map((f) => (
                    <td
                      key={f}
                      className="px-4 py-3.5 text-graphite first:sm:pl-6"
                    >
                      {cell(r, f)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line/80 px-5 py-3 text-[0.875rem] text-slate sm:px-6">
        Records are kept for seven years from the reviewer’s decision, like the
        case they belong to. Today is {formatDate(new Date().toISOString())}.
      </p>
    </Panel>
  )
}
