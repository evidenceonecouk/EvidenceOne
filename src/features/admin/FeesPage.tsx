import { Coins, Percent, ReceiptText, Repeat } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Panel, PanelHeader, Page } from '@/components/app/Page'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { PendingDecision } from '@/components/PendingDecision'
import { AcspStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { AdminHeader, StateBadge } from '@/features/admin/kit'
import {
  ApprovalCard,
  SeatNotice,
  SuperOnlyNotice,
  useSuperSeat,
} from '@/features/super/ApprovalFlow'
import { PROVIDER_FEE_FIXED, PROVIDER_FEE_RATE, splitPayment } from '@/lib/fees'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { newStepUpRef } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import {
  feeText,
  pendingOfKind,
  proposeChange,
  subscriptionText,
} from '@/store/superActions'
import type { BillingSettings } from '@/types/domain'

const inputCls =
  'h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10 disabled:bg-mist disabled:text-slate'

const money2 = (n: number) => `£${n.toFixed(2)}`

/** Fees and plans. Super Administrator proposes, a different Super Administrator approves. Everyone else reads. */
export function FeesPage() {
  const { data } = useDemoStore()
  const { isSuper } = useSuperSeat()
  const settings = data.billing.settings
  const pending = data.approvals.filter(
    (a) =>
      (a.kind === 'platform_fee' || a.kind === 'subscription_plan') &&
      a.status === 'pending',
  )
  const history = data.approvals.filter(
    (a) =>
      (a.kind === 'platform_fee' || a.kind === 'subscription_plan') &&
      a.status !== 'pending',
  )

  return (
    <Page>
      <AdminHeader
        kicker="Super Administrator"
        title="Fees and plans"
        description="What Evidence One charges an ACSP, and what the ACSP charges its client. Four kinds of fee, each kept separate. Every change is proposed by one Super Administrator and approved by a different one."
      />
      {isSuper ? (
        <SeatNotice />
      ) : (
        <SuperOnlyNotice what="the fees, the plans and each ACSP's plan" />
      )}

      {pending.length > 0 && (
        <section
          className="mb-8 space-y-4"
          aria-label="Changes waiting for a second approver"
        >
          <h2 className="text-lg font-medium text-ink">
            Waiting for a second approver
          </h2>
          {pending.map((a) => (
            <ApprovalCard key={a.id} approval={a} readOnly={!isSuper} />
          ))}
        </section>
      )}

      <FeeTypes />

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <PlatformFeePanel settings={settings} canEdit={isSuper} />
        <SubscriptionPanel settings={settings} canEdit={isSuper} />
      </div>

      <AcspPlansTable />

      <ProviderFeesPanel />

      {history.length > 0 && (
        <section className="mt-8 space-y-4" aria-label="Decided changes">
          <h2 className="text-lg font-medium text-ink">Decided changes</h2>
          {history.map((a) => (
            <ApprovalCard key={a.id} approval={a} readOnly />
          ))}
        </section>
      )}
    </Page>
  )
}

/* The four fee types, never merged. */

const feeTypes = [
  {
    name: 'ACSP Professional Fee',
    who: 'Set by each ACSP',
    body: 'What the client pays the named ACSP for the verification. Each ACSP sets its own fee. The ACSP is the merchant of record and issues the invoice in its own name.',
    icon: ReceiptText,
  },
  {
    name: 'Referral Commission',
    who: 'Off at launch',
    body: 'What a Referral Partner may receive for introducing a client, only where commissions are switched on and the client has seen the disclosure. It never changes the price the client pays.',
    icon: Percent,
  },
  {
    name: 'Platform Fee',
    who: 'Set here',
    body: 'What Evidence One charges the ACSP for a referred or B2C case, deducted automatically from the payment. Never charged on an ACSP’s own client.',
    icon: Coins,
  },
  {
    name: 'Marketplace Commission',
    who: 'Not in use',
    body: 'A separate fee type kept in the data model. It is not charged and no amount is set. It is never combined with the other three.',
    icon: Repeat,
  },
]

function FeeTypes() {
  return (
    <section aria-labelledby="fee-types">
      <h2 id="fee-types" className="text-lg font-medium text-ink">
        Four fee types, kept separate
      </h2>
      <p className="mt-1 max-w-3xl text-base text-slate">
        Each has its own record, its own invoice and its own setting. None is
        ever added to, taken from or shown as another.
      </p>
      <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {feeTypes.map((f) => (
          <li
            key={f.name}
            className="rounded-2xl border border-line/80 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-mist text-ink">
                <f.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-medium text-ink">{f.name}</h3>
                <p className="text-[0.875rem] text-slate">{f.who}</p>
              </div>
            </div>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">
              {f.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* Platform fee */

function PlatformFeePanel({
  settings,
  canEdit,
}: {
  settings: BillingSettings
  canEdit: boolean
}) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const { actor } = useSuperSeat()
  const id = useId()
  const [value, setValue] = useState('')
  const [stepUp, setStepUp] = useState(false)

  const next = Number(value)
  const valid =
    value !== '' && next > 0 && next <= 500 && next !== settings.platformFee
  const waiting = !!pendingOfKind(data, 'platform_fee')
  const withVat =
    Math.round(settings.platformFee * (1 + settings.vatRate) * 100) / 100

  // A worked example, so the presenter can show who bears what.
  const exampleGross = 150
  const referred = splitPayment(exampleGross, 'referred', settings)
  const own = splitPayment(exampleGross, 'own_client', settings)

  return (
    <Panel aria-labelledby={`${id}-title`}>
      <PanelHeader
        id={`${id}-title`}
        title="Platform fee"
        description="Per referred or B2C case, charged to the ACSP"
        actions={<PendingDecision code="P10" />}
      />
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
          <p className="text-[2.5rem] leading-none font-medium tracking-[-0.03em] text-ink tabular">
            {money2(settings.platformFee)}
            <span className="ml-2 text-lg font-normal text-slate">
              plus VAT
            </span>
          </p>
          <p className="text-base text-slate">
            {money2(withVat)} with VAT at {Math.round(settings.vatRate * 100)}%
          </p>
        </div>
        <ul className="list-disc space-y-1.5 pl-5 text-base text-graphite">
          <li>
            Applies to referred cases and B2C cases only. It is never charged on
            an ACSP’s own client, who is covered by the subscription.
          </li>
          <li>
            Deducted automatically from each payment, by default, for every
            ACSP.
          </li>
          <li>
            Evidence One’s per-case or consolidated monthly invoice documents
            the fee already deducted. It is not a request for payment.
          </li>
          <li>
            What happens to the fee on a refunded case is open (refunds and
            complaints).
          </li>
        </ul>

        <div>
          <h3 className="text-base font-medium text-ink">
            Worked example: a {formatMoney(exampleGross)} ACSP fee
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[0.9375rem]">
              <caption className="sr-only">
                What each party receives from a {formatMoney(exampleGross)}{' '}
                payment, for a referred case and for an ACSP’s own client
              </caption>
              <thead>
                <tr className="border-b border-line text-slate">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Line
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    Referred or B2C
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Own client
                  </th>
                </tr>
              </thead>
              <tbody className="tabular">
                {[
                  ['Client pays the ACSP', referred.gross, own.gross],
                  [
                    'Payment provider fee (borne by the ACSP)',
                    -referred.providerFee,
                    -own.providerFee,
                  ],
                  [
                    'Platform fee with VAT (deducted)',
                    -referred.platformFeeGross,
                    -own.platformFeeGross,
                  ],
                ].map(([label, a, b]) => (
                  <tr key={String(label)} className="border-b border-line/60">
                    <th
                      scope="row"
                      className="py-2 pr-4 font-normal text-graphite"
                    >
                      {label}
                    </th>
                    <td className="py-2 pr-4 text-right">
                      {Number(a) < 0
                        ? `-${money2(-Number(a))}`
                        : money2(Number(a))}
                    </td>
                    <td className="py-2 text-right">
                      {Number(b) === 0
                        ? 'None'
                        : Number(b) < 0
                          ? `-${money2(-Number(b))}`
                          : money2(Number(b))}
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-2 pr-4 font-medium text-ink">
                    Paid out to the ACSP’s own account
                  </th>
                  <td className="py-2 pr-4 text-right font-medium text-ink">
                    {money2(referred.net)}
                  </td>
                  <td className="py-2 text-right font-medium text-ink">
                    {money2(own.net)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[0.875rem] text-slate">
            An ACSP’s own client carries no platform fee. The case shows
            “Included in your subscription”.
          </p>
        </div>

        {canEdit ? (
          <form
            className="border-t border-line/80 pt-5"
            onSubmit={(e) => {
              e.preventDefault()
              if (valid && !waiting) setStepUp(true)
            }}
          >
            <label
              htmlFor={`${id}-fee`}
              className="text-base font-medium text-ink"
            >
              Propose a new platform fee, plus VAT
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              <div className="relative w-44">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-base text-slate"
                >
                  £
                </span>
                <input
                  id={`${id}-fee`}
                  inputMode="decimal"
                  type="number"
                  min={1}
                  max={500}
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={String(settings.platformFee)}
                  className={cn(inputCls, 'pl-8')}
                  aria-describedby={`${id}-fee-help`}
                />
              </div>
              <Button size="lg" type="submit" disabled={!valid || waiting}>
                Propose change
              </Button>
            </div>
            <p
              id={`${id}-fee-help`}
              className="mt-2 text-[0.9375rem] text-slate"
            >
              {waiting
                ? 'A platform fee change is already waiting for a second approver.'
                : 'You confirm with step-up. A different Super Administrator then approves it. The new fee applies to payments made after approval.'}
            </p>
          </form>
        ) : null}
      </div>
      <StepUpDialog
        open={stepUp}
        action="propose a change to the platform fee"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          apply((d) =>
            proposeChange(
              d,
              {
                kind: 'platform_fee',
                payload: { kind: 'platform_fee', platformFee: next },
                summary: `Change the platform fee from ${feeText(settings.platformFee)} to ${feeText(next)} per referred case`,
                from: feeText(settings.platformFee),
                to: feeText(next),
              },
              actor,
              ref,
            ),
          )
          setValue('')
          toast({
            title: 'Platform fee change proposed',
            description: `Waiting for a second approver. Step-up ${ref} recorded.`,
          })
        }}
      />
    </Panel>
  )
}

/* Subscription plans */

const structures: {
  value: BillingSettings['subscription']['structure']
  title: string
  body: string
}[] = [
  {
    value: 'monthly_only',
    title: 'Monthly fee alone',
    body: 'One monthly fee covers all of the ACSP’s own clients.',
  },
  {
    value: 'monthly_with_cases',
    title: 'Monthly fee with cases included',
    body: 'One monthly fee covers a number of the ACSP’s own cases each month.',
  },
]

function SubscriptionPanel({
  settings,
  canEdit,
}: {
  settings: BillingSettings
  canEdit: boolean
}) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const { actor } = useSuperSeat()
  const id = useId()
  const sub = settings.subscription
  const [structure, setStructure] = useState(sub.structure)
  const [cases, setCases] = useState(String(sub.casesIncluded ?? ''))
  const [price, setPrice] = useState(
    sub.price === null ? '' : String(sub.price),
  )
  const [stepUp, setStepUp] = useState(false)

  const casesNum = cases === '' ? null : Number(cases)
  const priceNum = price === '' ? null : Number(price)
  const proposed = {
    structure,
    casesIncluded: structure === 'monthly_with_cases' ? casesNum : null,
    price: priceNum,
  }
  const valid =
    (structure === 'monthly_only' ||
      (casesNum !== null && Number.isInteger(casesNum) && casesNum > 0)) &&
    (priceNum === null || priceNum >= 0) &&
    (proposed.structure !== sub.structure ||
      proposed.casesIncluded !== sub.casesIncluded ||
      proposed.price !== sub.price)
  const waiting = !!pendingOfKind(data, 'subscription_plan')
  const current = subscriptionText(sub.structure, sub.casesIncluded, sub.price)

  return (
    <Panel aria-labelledby={`${id}-title`}>
      <PanelHeader
        id={`${id}-title`}
        title="Subscription plans"
        description="For an ACSP’s own clients, instead of the platform fee"
        actions={<PendingDecision />}
      />
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <p className="text-base text-graphite">
          Two plan shapes are supported. Neither has a price yet.{' '}
          <span className="font-medium text-ink">
            Terms to be set by the client by {formatDate(sub.termsDueBy)}.
          </span>
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {structures.map((s) => (
            <li
              key={s.value}
              className={cn(
                'rounded-xl border px-4 py-4',
                sub.structure === s.value
                  ? 'border-ink bg-white'
                  : 'border-line bg-mist/50',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-medium text-ink">{s.title}</h3>
                {sub.structure === s.value && (
                  <StateBadge tone="ok">Selected</StateBadge>
                )}
              </div>
              <p className="mt-1.5 text-[0.9375rem] text-graphite">{s.body}</p>
              <p className="mt-3 text-lg font-medium text-ink">
                {sub.structure === s.value && sub.price !== null
                  ? `${money2(sub.price)} a month`
                  : 'Price not set'}
              </p>
              {s.value === 'monthly_with_cases' && (
                <p className="text-[0.875rem] text-slate">
                  Cases included:{' '}
                  {sub.structure === s.value && sub.casesIncluded
                    ? sub.casesIncluded
                    : 'not set'}
                </p>
              )}
            </li>
          ))}
        </ul>
        <p className="text-[0.9375rem] text-slate">
          Current plan: <span className="text-ink">{current}</span>. The price
          is configurable here and is shown as “Price not set” until the client
          sets it.
        </p>

        {canEdit && (
          <form
            className="border-t border-line/80 pt-5"
            onSubmit={(e) => {
              e.preventDefault()
              if (valid && !waiting) setStepUp(true)
            }}
          >
            <fieldset>
              <legend className="text-base font-medium text-ink">
                Propose a plan change
              </legend>
              <div className="mt-3 grid gap-2">
                {structures.map((s) => (
                  <label
                    key={s.value}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 text-base text-ink has-[:checked]:border-ink has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ink/10"
                  >
                    <input
                      type="radio"
                      name={`${id}-structure`}
                      className="size-4 accent-ink"
                      checked={structure === s.value}
                      onChange={() => setStructure(s.value)}
                    />
                    {s.title}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${id}-cases`}
                  className="text-base font-medium text-ink"
                >
                  Cases included each month
                </label>
                <input
                  id={`${id}-cases`}
                  type="number"
                  min={1}
                  step={1}
                  disabled={structure !== 'monthly_with_cases'}
                  value={structure === 'monthly_with_cases' ? cases : ''}
                  onChange={(e) => setCases(e.target.value)}
                  className={cn(inputCls, 'mt-2')}
                />
              </div>
              <div>
                <label
                  htmlFor={`${id}-price`}
                  className="text-base font-medium text-ink"
                >
                  Monthly price (optional)
                </label>
                <input
                  id={`${id}-price`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price not set"
                  className={cn(inputCls, 'mt-2')}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="lg" type="submit" disabled={!valid || waiting}>
                Propose change
              </Button>
              <p className="text-[0.9375rem] text-slate">
                {waiting
                  ? 'A plan change is already waiting for a second approver.'
                  : 'Leave the price empty to keep “Price not set”.'}
              </p>
            </div>
          </form>
        )}
      </div>
      <StepUpDialog
        open={stepUp}
        action="propose a change to the subscription plan"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          apply((d) =>
            proposeChange(
              d,
              {
                kind: 'subscription_plan',
                payload: { kind: 'subscription_plan', ...proposed },
                summary: 'Change the subscription plan for ACSPs’ own clients',
                from: current,
                to: subscriptionText(
                  proposed.structure,
                  proposed.casesIncluded,
                  proposed.price,
                ),
              },
              actor,
              ref,
            ),
          )
          toast({
            title: 'Plan change proposed',
            description: `Waiting for a second approver. Step-up ${ref} recorded.`,
          })
        }}
      />
    </Panel>
  )
}

/* Each ACSP's plan */

const invoiceModeLabel = {
  per_case: 'Per case',
  monthly: 'Consolidated monthly',
} as const

function AcspPlansTable() {
  const { data } = useDemoStore()
  const sub = data.billing.settings.subscription
  const rows = useMemo(
    () =>
      data.acsps.map((a) => {
        const own = data.cases.filter(
          (c) => c.acspId === a.id && c.source === 'own_client',
        ).length
        const referred = data.cases.filter(
          (c) => c.acspId === a.id && c.source !== 'own_client' && c.payment,
        )
        const deducted = referred.reduce(
          (sum, c) =>
            sum +
            (c.payment?.platformFee ?? 0) +
            (c.payment?.platformFeeVat ?? 0),
          0,
        )
        return { a, own, referred: referred.length, deducted }
      }),
    [data.acsps, data.cases],
  )
  return (
    <Panel className="mt-8" aria-labelledby="acsp-plans">
      <PanelHeader
        id="acsp-plans"
        title="Each ACSP’s plan"
        description="Platform fee invoicing for referred and B2C cases, and the subscription for the ACSP’s own clients"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-4xl text-left text-[0.9375rem]">
          <caption className="sr-only">
            Plan and invoice mode for each ACSP
          </caption>
          <thead>
            <tr className="border-b border-line text-slate">
              {[
                'ACSP',
                'Status',
                'Platform fee invoice',
                'Own-client plan',
                'Referred and B2C cases',
                'Fee deducted, with VAT',
                'Own-client cases',
              ].map((h, i) => (
                <th
                  key={h}
                  scope="col"
                  className={cn(
                    'px-5 py-3 font-medium first:sm:pl-6',
                    i >= 4 && 'text-right',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ a, own, referred, deducted }) => (
              <tr key={a.id} className="border-b border-line/60 last:border-0">
                <th
                  scope="row"
                  className="px-5 py-3.5 text-left font-medium text-ink sm:pl-6"
                >
                  {a.name}
                </th>
                <td className="px-5 py-3.5">
                  <AcspStatusChip status={a.status} />
                </td>
                <td className="px-5 py-3.5 text-graphite">
                  {invoiceModeLabel[a.plan.invoiceMode]}
                </td>
                <td className="px-5 py-3.5 text-graphite">
                  {a.plan.subscription === 'monthly_with_cases'
                    ? `Monthly fee with ${a.plan.casesIncluded ?? 'a number of'} cases included`
                    : 'Monthly fee alone'}
                  <span className="block text-[0.875rem] text-slate">
                    {sub.price === null ? 'Price not set' : money2(sub.price)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right tabular">{referred}</td>
                <td className="px-5 py-3.5 text-right tabular">
                  {money2(deducted)}
                </td>
                <td className="px-5 py-3.5 text-right tabular">{own}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function ProviderFeesPanel() {
  return (
    <Panel className="mt-8" aria-labelledby="provider-fees">
      <PanelHeader
        id="provider-fees"
        title="Payment provider fees"
        description="Borne by the ACSP, never by the client or by Evidence One"
      />
      <div className="space-y-2 px-5 py-5 text-base text-graphite sm:px-6">
        <p>
          The secure payment provider charges a fee on each payment. It comes
          out of the ACSP’s share, is shown on the ACSP’s monthly statement case
          by case, and is a separate line from the platform fee.
        </p>
        <p className="text-[0.9375rem] text-slate">
          Indicative rate used in this demonstration:{' '}
          {(PROVIDER_FEE_RATE * 100).toFixed(1)}% plus{' '}
          {Math.round(PROVIDER_FEE_FIXED * 100)}p a payment.
        </p>
      </div>
    </Panel>
  )
}
