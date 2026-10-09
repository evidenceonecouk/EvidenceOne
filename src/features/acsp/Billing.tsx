import { FileText, Landmark, Receipt, ShieldCheck, Wallet } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  HeroBanner,
  Page,
  Panel,
  PanelHeader,
  StatTile,
} from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  clientInvoices,
  gbp,
  monthKey,
  SOURCE_LABEL,
  statementRows,
  totals,
  uninvoicedPlatformCases,
  type InvoiceView,
} from '@/lib/billing'
import { formatDate, formatShortDate } from '@/lib/format'
import { setInvoiceMode } from '@/store/acspActions'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'
import type { AcspFirm, AcspPlan } from '@/types/domain'
import { Note, Table, Td, Th } from './BillingParts'
import { BillingPlan } from './BillingPlan'
import { BillingStatement } from './BillingStatement'

const tabClass =
  'h-11 flex-none rounded-lg px-4 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm'

/**
  ACSP billing. Invoices to clients are issued in the ACSP's name by Evidence
  One on its behalf. Evidence One's own invoices to the ACSP only document the
  platform fee already deducted from referred and B2C payments.
*/
export function AcspBilling() {
  const { acsp } = useActingAcsp()
  const { data } = useDemoStore()
  const rows = useMemo(() => statementRows(data, acsp.id), [data, acsp.id])
  const invoices = useMemo(() => clientInvoices(data, acsp.id), [data, acsp.id])
  const latest = rows.length ? monthKey(rows[0].paidAt) : undefined
  const month = totals(rows.filter((r) => monthKey(r.paidAt) === latest))

  return (
    <Page>
      <HeroBanner
        kicker="ACSP billing"
        title="Billing"
        description={`${acsp.name} is the service provider and the merchant of record. Evidence One is your technology provider: it collects each payment as your disclosed agent, issues the client's invoice in your name and pays out to your own payment account.`}
      />
      <dl className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Received, latest month"
          value={gbp(month.gross)}
          icon={Wallet}
          detail="Your professional fees, gross"
        />
        <StatTile
          label="Platform fee deducted"
          value={gbp(month.platformFeeGross)}
          icon={Landmark}
          detail="Referred and B2C cases only, with VAT"
        />
        <StatTile
          label="Net paid out"
          value={gbp(month.net)}
          icon={ShieldCheck}
          detail="To your connected payment account"
        />
        <StatTile
          label="Client invoices"
          value={invoices.length}
          icon={Receipt}
          detail="Issued in your firm's name"
        />
      </dl>

      <Tabs defaultValue="client">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-mist p-1 sm:w-fit">
          <TabsTrigger value="client" className={tabClass}>
            Client invoices
          </TabsTrigger>
          <TabsTrigger value="platform" className={tabClass}>
            Evidence One invoices
          </TabsTrigger>
          <TabsTrigger value="statement" className={tabClass}>
            Monthly statement
          </TabsTrigger>
          <TabsTrigger value="plan" className={tabClass}>
            Plan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="client" className="mt-6">
          <ClientInvoices acsp={acsp} invoices={invoices} />
        </TabsContent>
        <TabsContent value="platform" className="mt-6">
          <PlatformInvoices acsp={acsp} />
        </TabsContent>
        <TabsContent value="statement" className="mt-6">
          <BillingStatement acsp={acsp} />
        </TabsContent>
        <TabsContent value="plan" className="mt-6">
          <BillingPlan acsp={acsp} />
        </TabsContent>
      </Tabs>
    </Page>
  )
}

/* Client invoices */

function ClientInvoices({
  acsp,
  invoices,
}: {
  acsp: AcspFirm
  invoices: InvoiceView[]
}) {
  const [open, setOpen] = useState<InvoiceView | null>(null)
  return (
    <>
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Invoices issued to your clients"
          description={`Issued by Evidence One on behalf of ${acsp.name}, with your address and VAT number.`}
        />
        {invoices.length === 0 ? (
          <p className="px-6 py-10 text-center text-base text-slate">
            No client invoices yet. An invoice is issued when a client pays.
          </p>
        ) : (
          <Table caption="Client invoices issued in your name" min="56rem">
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Date</Th>
                <Th>Client</Th>
                <Th>Paid by</Th>
                <Th right>Net</Th>
                <Th right>VAT</Th>
                <Th right>Total</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {invoices.map((i) => (
                <tr key={i.id}>
                  <Td strong>
                    <span className="font-mono text-[0.9375rem]">{i.id}</span>
                    <span className="block font-mono text-[0.8125rem] font-normal text-slate">
                      {i.caseId}
                    </span>
                  </Td>
                  <Td muted>{formatShortDate(i.issuedAt)}</Td>
                  <Td>{i.clientName}</Td>
                  <Td muted>
                    {i.paidByLine.startsWith('The client')
                      ? 'Client'
                      : 'Referral Partner, Agent Payment Code'}
                  </Td>
                  <Td right>{gbp(i.net)}</Td>
                  <Td right muted>
                    {gbp(i.vat)}
                  </Td>
                  <Td right strong>
                    {gbp(i.gross)}
                  </Td>
                  <Td>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpen(i)}
                      aria-label={`View invoice ${i.id}`}
                    >
                      <FileText aria-hidden="true" />
                      View
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
      <p className="mt-4 text-base text-slate">
        The platform fee is not on these invoices. It is a separate fee between
        Evidence One and you, shown on the Evidence One invoices tab.
      </p>
      <InvoiceDialog acsp={acsp} invoice={open} onClose={() => setOpen(null)} />
    </>
  )
}

function InvoiceDialog({
  acsp,
  invoice,
  onClose,
}: {
  acsp: AcspFirm
  invoice: InvoiceView | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto rounded-[24px] p-0">
        {invoice && (
          <>
            <DialogHeader className="border-b border-line/80 px-6 pt-6 pb-4 text-left">
              <DialogTitle className="text-xl font-medium">
                Invoice {invoice.id}
              </DialogTitle>
              <DialogDescription className="text-base text-slate">
                Issued by Evidence One on behalf of {acsp.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 px-6 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[0.8125rem] tracking-[0.12em] text-slate uppercase">
                    From
                  </p>
                  <p className="mt-1 text-base font-medium text-ink">
                    {acsp.name}
                  </p>
                  <p className="text-base text-graphite">
                    {acsp.profile.address}
                  </p>
                  {acsp.profile.vatNumber && (
                    <p className="text-base text-graphite">
                      VAT number {acsp.profile.vatNumber}
                    </p>
                  )}
                  <p className="text-base text-graphite">
                    ACSP reference {acsp.acspNumber}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[0.8125rem] tracking-[0.12em] text-slate uppercase">
                    To
                  </p>
                  <p className="mt-1 text-base font-medium text-ink">
                    {invoice.clientName}
                  </p>
                  <p className="text-base text-graphite">
                    Case {invoice.caseId}
                  </p>
                  <p className="text-base text-graphite">
                    Invoice date {formatDate(invoice.issuedAt)}
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-line/80">
                <dl className="divide-y divide-line/70 text-base">
                  <div className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-graphite">{invoice.description}</dt>
                    <dd className="tabular text-ink">{gbp(invoice.net)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-slate">VAT at 20%</dt>
                    <dd className="tabular text-slate">{gbp(invoice.vat)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 bg-mist/50 px-4 py-3 font-medium">
                    <dt className="text-ink">Total paid</dt>
                    <dd className="tabular text-ink">{gbp(invoice.gross)}</dd>
                  </div>
                </dl>
              </div>
              <div className="space-y-2 text-base leading-relaxed text-graphite">
                <p>
                  <span className="font-medium text-ink">Paid by:</span>{' '}
                  {invoice.paidByLine}.
                </p>
                <p>
                  Payment was taken by the secure payment provider into{' '}
                  {acsp.name}&rsquo;s own payment account. {acsp.name} is the
                  service provider and merchant of record. Evidence One is{' '}
                  {acsp.name}&rsquo;s technology provider and collected this
                  payment as its disclosed agent.
                </p>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* Evidence One invoices */

const MODES: { value: AcspPlan['invoiceMode']; label: string; hint: string }[] =
  [
    {
      value: 'per_case',
      label: 'One invoice for each case',
      hint: 'An Evidence One invoice follows every referred or B2C payment.',
    },
    {
      value: 'monthly',
      label: 'One consolidated invoice each month',
      hint: 'All the month’s platform fees on a single invoice.',
    },
  ]

function PlatformInvoices({ acsp }: { acsp: AcspFirm }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const legend = useId()
  const invoices = data.billing.platformInvoices
    .filter((i) => i.acspId === acsp.id)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
  const waiting = uninvoicedPlatformCases(data, acsp.id)
  const fee = data.billing.settings

  const choose = (mode: AcspPlan['invoiceMode']) => {
    if (mode === acsp.plan.invoiceMode) return
    apply((d) => setInvoiceMode(d, acsp.id, mode, acsp.reviewers[0].id))
    toast({
      title: 'Invoice setting saved',
      description: `${acsp.name} will receive ${mode === 'per_case' ? 'an invoice for each case' : 'one invoice each month'}.`,
    })
  }

  return (
    <div className="space-y-6">
      <Note title="What these invoices are">
        Evidence One deducts its platform fee of {gbp(fee.platformFee)} plus VAT
        automatically from each referred or B2C payment. These invoices document
        the amount already deducted. Your own clients carry no platform fee.
      </Note>

      <Panel className="p-5 sm:p-6">
        <fieldset>
          <legend id={legend} className="text-lg font-medium text-ink">
            How Evidence One documents the platform fee
          </legend>
          <p className="mt-1 text-base text-slate">
            The fee is deducted the same way either way. This only changes how
            it is invoiced. Each change is written to your audit trail.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {MODES.map((m) => {
              const on = acsp.plan.invoiceMode === m.value
              return (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink has-[:focus-visible]:ring-offset-2 ${on ? 'border-ink bg-mist/60' : 'border-line bg-white hover:border-silver'}`}
                >
                  <input
                    type="radio"
                    name="invoice-mode"
                    value={m.value}
                    checked={on}
                    onChange={() => choose(m.value)}
                    className="mt-1 size-5 accent-[var(--ink)]"
                  />
                  <span>
                    <span className="block text-base font-medium text-ink">
                      {m.label}
                    </span>
                    <span className="block text-base text-slate">{m.hint}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Evidence One invoices to your firm"
          description="Each documents a platform fee already deducted from a payment."
        />
        {invoices.length === 0 ? (
          <p className="px-6 py-10 text-center text-base text-slate">
            No Evidence One invoices yet.
          </p>
        ) : (
          <Table caption="Evidence One platform fee invoices" min="52rem">
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Issued</Th>
                <Th>Covers</Th>
                <Th right>Platform fee</Th>
                <Th right>VAT</Th>
                <Th right>Total deducted</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {invoices.map((i) => (
                <tr key={i.id}>
                  <Td strong>
                    <span className="font-mono text-[0.9375rem]">{i.id}</span>
                  </Td>
                  <Td muted>{formatShortDate(i.issuedAt)}</Td>
                  <Td>
                    {i.mode === 'monthly'
                      ? `Consolidated, ${i.period ?? 'month'}`
                      : 'Single case'}
                    <span className="block font-mono text-[0.8125rem] text-slate">
                      {i.caseIds.length} case{i.caseIds.length === 1 ? '' : 's'}
                      {i.caseIds.length === 1 ? `, ${i.caseIds[0]}` : ''}
                    </span>
                  </Td>
                  <Td right>{gbp(i.net)}</Td>
                  <Td right muted>
                    {gbp(i.vat)}
                  </Td>
                  <Td right strong>
                    {gbp(i.gross)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {waiting.length > 0 && (
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Deducted, invoice not yet issued"
            description={
              acsp.plan.invoiceMode === 'monthly'
                ? 'These go on the next consolidated monthly invoice.'
                : 'An invoice for each of these is issued after the payment settles.'
            }
          />
          <Table
            caption="Platform fees deducted and not yet invoiced"
            min="36rem"
          >
            <thead>
              <tr>
                <Th>Case</Th>
                <Th>Client</Th>
                <Th>Source</Th>
                <Th right>Total deducted</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {waiting.map((r) => (
                <tr key={r.caseId}>
                  <Td>
                    <Link
                      to={`/acsp/cases/${r.caseId}`}
                      className="font-mono text-[0.9375rem] underline underline-offset-4"
                    >
                      {r.caseId}
                    </Link>
                  </Td>
                  <Td>{r.clientName}</Td>
                  <Td muted>{SOURCE_LABEL[r.source]}</Td>
                  <Td right strong>
                    {gbp(r.platformFeeGross)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}

      <p className="flex flex-wrap items-center gap-2 text-base text-slate">
        Referral commission and marketplace commission are separate fee types
        and do not appear here. Referral commissions are off at launch.
      </p>
    </div>
  )
}
