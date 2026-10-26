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
import { PACKAGES_PROVISIONAL_NOTE } from '@/data/packages'
import { planUsage } from '@/lib/billing'
import { PROVIDER_FEE_FIXED, PROVIDER_FEE_RATE, splitPayment } from '@/lib/fees'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import {
  feeText,
  packageText,
  pendingOfKind,
  proposeChange,
} from '@/store/superActions'
import type {
  BillingSettings,
  PackageId,
  SubscriptionPackage,
} from '@/types/domain'

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
        <SuperOnlyNotice what="the platform fee, the subscription packages and each ACSP's plan" />
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
            an ACSP’s own client, who is covered by the ACSP’s package.
          </li>
          <li>
            Deducted automatically from each payment, for every ACSP, when the
            payment is taken on the ACSP’s approval. Nothing is deducted on a
            declined case, because nothing is taken.
          </li>
          <li>
            Evidence One’s per-case or consolidated monthly invoice documents
            the fee already deducted. It is not a request for payment.
          </li>
          <li>
            What happens to the fee on a refunded case is open.{' '}
            <PendingDecision className="align-middle" />
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
            “Included in your package”.
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

/* Subscription packages, provisional */

type PackageField =
  | 'monthlyPrice'
  | 'casesIncluded'
  | 'filesPerCase'
  | 'storageGb'
  | 'extraCaseFee'

const packageFields: {
  key: PackageField
  label: string
  money?: boolean
  unit?: string
}[] = [
  { key: 'monthlyPrice', label: 'Monthly price', money: true },
  { key: 'casesIncluded', label: 'Own-client cases a month', unit: 'cases' },
  { key: 'filesPerCase', label: 'Files per request', unit: 'files' },
  { key: 'storageGb', label: 'Storage, account total', unit: 'GB' },
  { key: 'extraCaseFee', label: 'Each additional case', money: true },
]

const fieldText = (
  p: SubscriptionPackage,
  f: (typeof packageFields)[number],
) => (f.money ? formatMoney(p[f.key]) : `${p[f.key]} ${f.unit}`)

function toValues(p: SubscriptionPackage): Record<PackageField, string> {
  return {
    monthlyPrice: String(p.monthlyPrice),
    casesIncluded: String(p.casesIncluded),
    filesPerCase: String(p.filesPerCase),
    storageGb: String(p.storageGb),
    extraCaseFee: String(p.extraCaseFee),
  }
}

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
  const packages = settings.packages
  const [packageId, setPackageId] = useState<PackageId>(packages[0].id)
  const current = packages.find((p) => p.id === packageId) ?? packages[0]
  const [values, setValues] = useState<Record<PackageField, string>>(() =>
    toValues(current),
  )
  const [stepUp, setStepUp] = useState(false)

  const proposed: SubscriptionPackage = {
    ...current,
    monthlyPrice: Number(values.monthlyPrice),
    casesIncluded: Number(values.casesIncluded),
    filesPerCase: Number(values.filesPerCase),
    storageGb: Number(values.storageGb),
    extraCaseFee: Number(values.extraCaseFee),
  }
  const valid =
    packageFields.every(
      (f) => values[f.key] !== '' && Number(values[f.key]) >= 0,
    ) && packageFields.some((f) => proposed[f.key] !== current[f.key])
  const waiting = !!pendingOfKind(data, 'subscription_plan')

  return (
    <Panel aria-labelledby={`${id}-title`}>
      <PanelHeader
        id={`${id}-title`}
        title="Subscription packages"
        description="For an ACSP’s own clients. Referred cases sit outside the allowance."
        actions={<StateBadge tone="info">Provisional</StateBadge>}
      />
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <p className="text-base text-graphite">
          {PACKAGES_PROVISIONAL_NOTE} Each package includes the workflow,
          compliance infrastructure, audit trail, storage, case management and
          Companies House-related functionality.
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {packages.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-line bg-white px-4 py-4"
            >
              <h3 className="text-base font-medium text-ink">{p.name}</h3>
              <p className="mt-1 text-[1.5rem] leading-tight font-medium text-ink tabular">
                {formatMoney(p.monthlyPrice)}
                <span className="ml-1 text-base font-normal text-slate">
                  a month
                </span>
              </p>
              <dl className="mt-3 space-y-1 text-[0.9375rem] text-graphite">
                {packageFields.slice(1).map((f) => (
                  <div key={f.key} className="flex justify-between gap-3">
                    <dt className="text-slate">{f.label}</dt>
                    <dd className="text-right tabular">{fieldText(p, f)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3">
                  <dt className="text-slate">File size</dt>
                  <dd className="text-right tabular">up to {p.maxFileMb} MB</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className="text-[0.9375rem] text-slate">
          Referred and B2C cases carry the platform fee and never count towards
          a package. Storage is a fair-use guide, never a reason to delete a
          retained record: near the limit the ACSP is invited to upgrade or add
          storage. Route B filings and ongoing PEP and sanctions monitoring are
          available only on a package.
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
                Propose a change to a package
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {packages.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 text-base text-ink has-[:checked]:border-ink has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ink/10"
                  >
                    <input
                      type="radio"
                      name={`${id}-package`}
                      className="size-4 accent-ink"
                      checked={packageId === p.id}
                      onChange={() => {
                        setPackageId(p.id)
                        setValues(toValues(p))
                      }}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {packageFields.map((f) => (
                <div key={f.key}>
                  <label
                    htmlFor={`${id}-${f.key}`}
                    className="text-base font-medium text-ink"
                  >
                    {f.label}
                    {f.unit === 'GB' ? ' (GB)' : f.money ? ' (£)' : ''}
                  </label>
                  <input
                    id={`${id}-${f.key}`}
                    type="number"
                    min={0}
                    step={f.money ? '0.01' : 1}
                    value={values[f.key]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                    className={cn(inputCls, 'mt-2')}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button size="lg" type="submit" disabled={!valid || waiting}>
                Propose change
              </Button>
              <p className="text-[0.9375rem] text-slate">
                {waiting
                  ? 'A package change is already waiting for a second approver.'
                  : 'You confirm with step-up. A different Super Administrator then approves it.'}
              </p>
            </div>
          </form>
        )}
      </div>
      <StepUpDialog
        open={stepUp}
        action={`propose a change to the ${current.name} package`}
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          apply((d) =>
            proposeChange(
              d,
              {
                kind: 'subscription_plan',
                payload: { kind: 'subscription_plan', package: proposed },
                summary: `Change the ${current.name} package (provisional)`,
                from: packageText(current),
                to: packageText(proposed),
              },
              actor,
              ref,
            ),
          )
          toast({
            title: 'Package change proposed',
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
  const rows = useMemo(
    () =>
      data.acsps.map((a) => {
        const usage = planUsage(data, a)
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
        return { a, usage, deducted }
      }),
    [data],
  )
  return (
    <Panel className="mt-8" aria-labelledby="acsp-plans">
      <PanelHeader
        id="acsp-plans"
        title="Each ACSP’s plan"
        description="Platform fee invoicing for referred and B2C cases, and the package for the ACSP’s own clients, this month"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-4xl text-left text-[0.9375rem]">
          <caption className="sr-only">
            Plan, package usage and invoice mode for each ACSP
          </caption>
          <thead>
            <tr className="border-b border-line text-slate">
              {[
                'ACSP',
                'Status',
                'Platform fee invoice',
                'Package',
                'Own-client cases',
                'Referred cases, not counted',
                'Storage',
                'Fee deducted, with VAT',
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
            {rows.map(({ a, usage, deducted }) => (
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
                  {usage.pkg ? usage.pkg.name : 'No subscription'}
                  <span className="block text-[0.875rem] text-slate">
                    {usage.pkg
                      ? `${formatMoney(usage.pkg.monthlyPrice)} a month`
                      : 'Referred cases only'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right tabular">
                  {usage.pkg
                    ? `${usage.ownClientCases} of ${usage.pkg.casesIncluded}`
                    : usage.ownClientCases}
                  {usage.extraCases > 0 && (
                    <span className="block text-[0.875rem] text-slate">
                      {usage.extraCases} extra,{' '}
                      {formatMoney(usage.extraCasesCharge)}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right tabular">
                  {usage.referredCases}
                </td>
                <td className="px-5 py-3.5 text-right tabular">
                  {usage.pkg
                    ? `${usage.storageUsedGb} of ${usage.pkg.storageGb} GB`
                    : `${usage.storageUsedGb} GB, archive`}
                </td>
                <td className="px-5 py-3.5 text-right tabular">
                  {money2(deducted)}
                </td>
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
