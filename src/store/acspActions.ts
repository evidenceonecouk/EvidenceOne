import { addTwelveMonths } from '@/lib/reconfirm'
import type { AcspPlan, DemoData } from '@/types/domain'
import { reviewerName, type ActionResult } from './actions'
import { refuseOtherAcsp } from './guards'

/*
  ACSP-side actions: reconfirmation, the platform-fee invoice mode, statement
  export and the Route B handoff to the ACSP's own WebFiling account. Every
  action returns the next data and the audit events to chain.
*/

const patchAcsp = (
  data: DemoData,
  acspId: string,
  patch: (a: DemoData['acsps'][number]) => DemoData['acsps'][number],
): DemoData => ({
  ...data,
  acsps: data.acsps.map((a) => (a.id === acspId ? patch(a) : a)),
})

/** The ACSP confirms its regulatory information is current. The next reconfirmation falls due 12 months later. */
export function reconfirmAcsp(
  data: DemoData,
  acspId: string,
  input: { reviewerId: string; changes?: string },
): ActionResult {
  const acsp = data.acsps.find((a) => a.id === acspId)
  if (!acsp) return { data, audit: [] }
  const now = new Date().toISOString()
  const next = addTwelveMonths(now)
  const changes = input.changes?.trim()
  return {
    data: patchAcsp(data, acspId, (a) => ({
      ...a,
      monitoring: {
        ...a.monitoring,
        lastReconfirmedAt: now,
        nextReconfirmationDue: next,
      },
    })),
    audit: [
      {
        at: now,
        actor: reviewerName(data, input.reviewerId),
        actorType: 'person',
        action: 'acsp.reconfirmed',
        detail: `${acsp.name} reconfirmed its regulatory information: ACSP reference ${acsp.acspNumber}, ${acsp.supervisor} ${acsp.supervisorNumber}. ${changes ? `Changes notified: ${changes}.` : 'No changes.'} Declarations made. Next reconfirmation due ${next.slice(0, 10)}.${new Date(acsp.monitoring.nextReconfirmationDue).getTime() < Date.now() ? ' The overdue reconfirmation (ACSP-11) is cleared.' : ''}`,
      },
    ],
  }
}

/** Switches between a platform-fee invoice for each case and one consolidated monthly invoice. The fee is deducted either way. */
export function setInvoiceMode(
  data: DemoData,
  acspId: string,
  mode: AcspPlan['invoiceMode'],
  reviewerId: string,
): ActionResult {
  const acsp = data.acsps.find((a) => a.id === acspId)
  if (!acsp || acsp.plan.invoiceMode === mode) return { data, audit: [] }
  const label = (m: AcspPlan['invoiceMode']) =>
    m === 'per_case'
      ? 'one invoice for each case'
      : 'one consolidated invoice each month'
  return {
    data: patchAcsp(data, acspId, (a) => ({
      ...a,
      plan: { ...a.plan, invoiceMode: mode },
    })),
    audit: [
      {
        at: new Date().toISOString(),
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'billing.invoice_mode_changed',
        detail: `${acsp.name} changed how Evidence One documents the platform fee: from ${label(acsp.plan.invoiceMode)} to ${label(mode)}. The fee is deducted automatically from each referred payment either way.`,
      },
    ],
  }
}

/** The monthly statement was exported as a PDF, behind step-up. */
export function recordStatementExport(
  data: DemoData,
  acspId: string,
  period: string,
  stepUpRef: string,
  reviewerId: string,
): ActionResult {
  const acsp = data.acsps.find((a) => a.id === acspId)
  return {
    data,
    audit: [
      {
        at: new Date().toISOString(),
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'billing.statement_exported',
        detail: `Monthly statement for ${period} exported as a PDF for ${acsp?.name ?? acspId}. Step-up ${stepUpRef}.`,
      },
    ],
  }
}

/**
  Route B: the ACSP continued to its own WebFiling account through the Evidence
  One interstitial. Evidence One never sees the login or the company
  authentication code.
*/
export function handOffFiling(
  data: DemoData,
  taskId: string,
  reviewerId: string,
): ActionResult {
  const task = data.corrections.find((t) => t.id === taskId)
  if (!task) return { data, audit: [] }
  const refused = refuseOtherAcsp(data, task.caseId, reviewerId, 'the filing')
  if (refused) return refused
  const now = new Date().toISOString()
  return {
    data: {
      ...data,
      corrections: data.corrections.map((t) =>
        t.id === taskId ? { ...t, handedOffAt: now } : t,
      ),
    },
    audit: [
      {
        at: now,
        actor: reviewerName(data, reviewerId),
        actorType: 'person',
        action: 'route_b.filing.handoff',
        caseId: task.caseId,
        detail: `Filing ${task.id} prepared and checked, then continued to the ACSP's own Companies House WebFiling account. Evidence One does not see the login or the company authentication code.`,
      },
    ],
  }
}
