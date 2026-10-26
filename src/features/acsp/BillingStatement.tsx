import { Download } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Panel, PanelHeader } from '@/components/app/Page'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import {
  gbp,
  monthKey,
  monthLabel,
  planUsage,
  SOURCE_LABEL,
  statementRows,
  totals,
  type StatementRow,
} from '@/lib/billing'
import { formatShortDate } from '@/lib/format'
import { buildPdf } from '@/lib/simplePdf'
import { recordStatementExport } from '@/store/acspActions'
import { useDemoStore } from '@/store/DemoStore'
import type { AcspFirm } from '@/types/domain'
import { Note, Table, Td, Th } from './BillingParts'

const INCLUDED = 'No platform fee: own client'

function pdfLines(
  acsp: AcspFirm,
  label: string,
  rows: StatementRow[],
  plan: PlanCharge | undefined,
) {
  const t = totals(rows)
  const pad = (s: string, n: number) => s.slice(0, n).padEnd(n)
  const num = (s: string, n: number) => s.padStart(n)
  const lines = [
    `Monthly statement, ${label}`,
    `${acsp.name}, ACSP reference ${acsp.acspNumber}`,
    `Prepared by Evidence One as ${acsp.name}'s technology provider. Payments are collected as its disclosed agent.`,
    '',
    `${pad('Case', 16)}${pad('Client', 22)}${pad('Source', 12)}${num('Gross', 10)}${num('Provider fee', 14)}${num('Platform fee', 14)}${num('Net paid out', 14)}  Payout`,
  ]
  for (const r of rows)
    lines.push(
      `${pad(r.caseId, 16)}${pad(r.clientName, 22)}${pad(SOURCE_LABEL[r.source], 12)}${num(gbp(r.gross), 10)}${num(gbp(r.providerFee), 14)}${num(r.source === 'own_client' ? 'None' : gbp(r.platformFeeGross), 14)}${num(gbp(r.net), 14)}  ${r.payoutAt ? formatShortDate(r.payoutAt) : 'Pending'}`,
    )
  lines.push(
    '',
    `${pad('Totals', 50)}${num(gbp(t.gross), 10)}${num(gbp(t.providerFee), 14)}${num(gbp(t.platformFeeGross), 14)}${num(gbp(t.net), 14)}`,
    '',
    'Platform fee: GBP 69 plus VAT per referred or B2C case, deducted automatically. Own clients carry no platform fee.',
    ...(plan
      ? [
          '',
          `Plan charge, separate from the payments above: ${plan.name} package ${gbp(plan.monthly)} a month${plan.extraCases ? `, plus ${plan.extraCases} additional own-client cases at ${gbp(plan.extraFee)} (${gbp(plan.extraCharge)})` : ''}. Provisional.`,
        ]
      : []),
    'Refunds and complaints: who decides, and what happens to the platform fee on a refunded case, is not yet decided.',
  )
  return lines
}

/** The month's subscription charge. A plan line, not one of the four fee types. */
interface PlanCharge {
  name: string
  monthly: number
  extraCases: number
  extraFee: number
  extraCharge: number
}

/** Case by case: gross received, payment provider fee, platform fee (referred and B2C only), net paid out. */
export function BillingStatement({ acsp }: { acsp: AcspFirm }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const selectId = useId()
  const all = useMemo(() => statementRows(data, acsp.id), [data, acsp.id])
  const months = useMemo(
    () => [...new Set(all.map((r) => monthKey(r.paidAt)))].sort().reverse(),
    [all],
  )
  const [picked, setPicked] = useState<string>()
  const month = picked && months.includes(picked) ? picked : months[0]
  const rows = all.filter((r) => monthKey(r.paidAt) === month)
  const t = totals(rows)
  const [stepUp, setStepUp] = useState(false)
  const usage = planUsage(data, acsp)
  const thisMonth = month === monthKey(new Date().toISOString())
  const plan: PlanCharge | undefined = usage.pkg && {
    name: usage.pkg.name,
    monthly: usage.pkg.monthlyPrice,
    extraCases: thisMonth ? usage.extraCases : 0,
    extraFee: usage.pkg.extraCaseFee,
    extraCharge: thisMonth ? usage.extraCasesCharge : 0,
  }

  const download = (ref: string) => {
    const label = monthLabel(month)
    const blob = buildPdf(pdfLines(acsp, label, rows, plan))
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `statement-${month}-${acsp.id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    apply((d) =>
      recordStatementExport(d, acsp.id, label, ref, acsp.reviewers[0].id),
    )
    toast({
      title: 'Statement downloaded',
      description: `Step-up ${ref} is written to the audit trail.`,
    })
  }

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Monthly statement"
          description="Every payment reconciled case by case: gross received, payment provider fee, platform fee and net paid out."
          actions={
            <Button
              variant="outline"
              disabled={rows.length === 0}
              onClick={() => setStepUp(true)}
            >
              <Download aria-hidden="true" />
              Download as PDF
            </Button>
          }
        />
        {months.length === 0 ? (
          <p className="px-6 py-10 text-center text-base text-slate">
            No payments yet. A statement appears once a client has paid.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 border-b border-line/80 px-5 py-3 sm:px-6">
              <label
                htmlFor={selectId}
                className="text-base font-medium text-ink"
              >
                Month
              </label>
              <select
                id={selectId}
                value={month}
                onChange={(e) => setPicked(e.target.value)}
                className="h-11 rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
              <span className="text-base text-slate">
                {rows.length} payment{rows.length === 1 ? '' : 's'}
              </span>
            </div>
            <Table caption={`Statement for ${monthLabel(month)}`} min="64rem">
              <thead>
                <tr>
                  <Th>Case</Th>
                  <Th>Client</Th>
                  <Th>Source</Th>
                  <Th right>Gross received</Th>
                  <Th right>Payment provider fee</Th>
                  <Th right>Platform fee</Th>
                  <Th right>Net paid out</Th>
                  <Th>Payout date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {rows.map((r) => (
                  <tr key={r.caseId}>
                    <Td>
                      <span className="font-mono text-[0.9375rem]">
                        {r.caseId}
                      </span>
                    </Td>
                    <Td>{r.clientName}</Td>
                    <Td muted>{SOURCE_LABEL[r.source]}</Td>
                    <Td right>{gbp(r.gross)}</Td>
                    <Td right muted>
                      {gbp(r.providerFee)}
                    </Td>
                    <Td right muted={r.source !== 'own_client'}>
                      {r.source === 'own_client' ? (
                        <span className="text-slate">{INCLUDED}</span>
                      ) : (
                        <>
                          {gbp(r.platformFeeGross)}
                          <span className="block text-[0.875rem] text-slate">
                            {gbp(r.platformFee)} plus {gbp(r.platformFeeVat)}{' '}
                            VAT
                          </span>
                        </>
                      )}
                    </Td>
                    <Td right strong>
                      {gbp(r.net)}
                    </Td>
                    <Td muted>
                      {r.payoutAt ? formatShortDate(r.payoutAt) : 'Pending'}
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-mist/40">
                  <Td strong colSpan={3}>
                    Totals
                  </Td>
                  <Td right strong>
                    {gbp(t.gross)}
                  </Td>
                  <Td right strong>
                    {gbp(t.providerFee)}
                  </Td>
                  <Td right strong>
                    {gbp(t.platformFeeGross)}
                  </Td>
                  <Td right strong>
                    {gbp(t.net)}
                  </Td>
                  <Td />
                </tr>
              </tfoot>
            </Table>
          </>
        )}
      </Panel>

      {plan && month && (
        <Panel className="p-5 sm:p-6" aria-labelledby={`${selectId}-plan`}>
          <h3 id={`${selectId}-plan`} className="text-lg font-medium text-ink">
            Plan charge for {monthLabel(month)}
          </h3>
          <p className="mt-1 text-base text-slate">
            Your subscription for your own clients. A separate plan line, not
            one of the four fee types, and never deducted from a client’s
            payment. Provisional.
          </p>
          <dl className="mt-4 divide-y divide-line/70 border-y border-line/70 text-base">
            <div className="flex flex-wrap justify-between gap-2 py-3">
              <dt className="text-graphite">
                {plan.name} package, monthly subscription
              </dt>
              <dd className="text-ink tabular">{gbp(plan.monthly)}</dd>
            </div>
            {plan.extraCases > 0 && (
              <div className="flex flex-wrap justify-between gap-2 py-3">
                <dt className="text-graphite">
                  {plan.extraCases} additional own-client case
                  {plan.extraCases === 1 ? '' : 's'} at {gbp(plan.extraFee)}
                </dt>
                <dd className="text-ink tabular">{gbp(plan.extraCharge)}</dd>
              </div>
            )}
            <div className="flex flex-wrap justify-between gap-2 py-3">
              <dt className="font-medium text-ink">Plan charge</dt>
              <dd className="font-medium text-ink tabular">
                {gbp(plan.monthly + plan.extraCharge)}
              </dd>
            </div>
          </dl>
        </Panel>
      )}

      <Note title="Where the money goes">
        The client’s card is authorised when they instruct you and the payment
        is taken only when you approve. Nothing is taken on a decline or if your
        ACSP status lapses. Each payment is split when it is taken. The payment
        provider fee and, on referred and B2C cases only, the platform fee are
        deducted, and the rest is paid out to your connected payment account (
        {acsp.profile.connectedAccount}). The payment is taken by the secure
        payment provider.
      </Note>
      <Note title="Refunds and complaints" badge={<PendingDecision />}>
        Complaints and refunds are handled by a Platform Administrator. What
        happens to the platform fee on a refunded case is not yet decided.
      </Note>

      <StepUpDialog
        open={stepUp}
        action="download your monthly statement"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          download(ref)
        }}
      />
    </div>
  )
}
