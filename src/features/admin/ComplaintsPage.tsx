import { useState } from 'react'
import { CircleSlash, MessageSquareWarning, Undo2 } from 'lucide-react'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDateTime, formatMoney } from '@/lib/format'
import { paymentStateLine } from '@/lib/paymentStatus'
import {
  closeComplaint,
  refundableAmount,
  refundComplaint,
} from '@/store/complaintActions'
import { SUPER_ADMINS, useDemoStore } from '@/store/DemoStore'
import { PLATFORM_ADMIN } from '@/store/platformActions'
import type { Complaint } from '@/types/domain'
import { AdminHeader, Figure, StateBadge, type Tone } from './kit'

const STATUS: Record<Complaint['status'], { label: string; tone: Tone }> = {
  open: { label: 'Open', tone: 'attention' },
  refunded: { label: 'Refunded', tone: 'ok' },
  closed: { label: 'Closed, no refund', tone: 'neutral' },
}

/**
  Complaints and refunds (P10, decided 19 and 20 October): handled by a
  Platform Administrator. The administrator sees the case reference, the client,
  the ACSP and where the payment stands, never identity evidence. A refund is
  possible only on a payment taken on approval, and needs a step-up.
*/
export function ComplaintsPage() {
  const { data, state, apply } = useDemoStore()
  const toast = useToast()
  const actor =
    state.persona === 'superAdmin'
      ? `${SUPER_ADMINS.find((x) => x.seat === state.superAdminSeat)!.name}, Super Administrator`
      : PLATFORM_ADMIN
  const complaints = [...(data.complaints ?? [])].sort((a, b) =>
    b.raisedAt.localeCompare(a.raisedAt),
  )
  const [refundFor, setRefundFor] = useState<Complaint | null>(null)
  const [closeFor, setCloseFor] = useState<Complaint | null>(null)
  const [text, setText] = useState('')
  const [stepUp, setStepUp] = useState(false)

  const count = (s: Complaint['status']) =>
    complaints.filter((c) => c.status === s).length

  return (
    <Page>
      <AdminHeader
        title="Complaints and refunds"
        description="Complaints from clients are handled by a Platform Administrator. A refund is possible only where a payment was taken, which happens when the ACSP approves. Nothing is taken on a declined case. You see the case reference and where the payment stands, never identity evidence."
      />

      <Panel aria-label="Complaints summary" className="mb-6 overflow-hidden">
        <dl className="grid divide-line/70 sm:grid-cols-3 sm:divide-x">
          <Figure label="Open" value={count('open')} />
          <Figure label="Refunded" value={count('refunded')} />
          <Figure label="Closed without a refund" value={count('closed')} />
        </dl>
      </Panel>

      <Panel className="mb-6 p-5 sm:p-6" aria-label="Platform fee on a refund">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-medium text-ink">
            The platform fee on a refunded case
          </p>
          <PendingDecision />
        </div>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite">
          What happens to the {formatMoney(data.billing.settings.platformFee)}{' '}
          plus VAT deducted on a referred or B2C case that is later refunded is
          not yet decided. A refund here returns the ACSP Professional Fee to
          the payer and leaves the platform fee and its invoice unchanged until
          the client decides.
        </p>
      </Panel>

      <Panel aria-labelledby="complaints-title" className="overflow-hidden">
        <PanelHeader
          id="complaints-title"
          title="Complaints"
          description="Newest first. Every action is written to the audit trail."
        />
        <ul className="divide-y divide-line/70">
          {complaints.map((c) => {
            const vc = data.cases.find((x) => x.id === c.caseId)
            const acsp = data.acsps.find((a) => a.id === vc?.acspId)
            const refundable = refundableAmount(data, c)
            const s = STATUS[c.status]
            return (
              <li key={c.id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <MonoLabel>{c.id}</MonoLabel>
                  <StateBadge tone={s.tone}>{s.label}</StateBadge>
                  <span className="text-[0.875rem] text-slate">
                    Raised {formatDateTime(c.raisedAt)}
                  </span>
                </div>
                <p className="mt-2 text-base font-medium text-ink">
                  {c.raisedBy}
                </p>
                <p className="text-[0.9375rem] text-graphite">
                  Case <span className="font-mono">{c.caseId}</span>
                  {acsp && <>, verified by {acsp.name}</>}
                </p>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink">
                  “{c.summary}”
                </p>
                {vc?.payment && (
                  <p className="mt-2 text-[0.9375rem] text-graphite">
                    Payment of {formatMoney(vc.payment.amount)}:{' '}
                    {paymentStateLine(vc.payment)}
                  </p>
                )}
                {c.refund && (
                  <p className="mt-3 rounded-xl bg-approve-wash px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
                    Refunded {formatMoney(c.refund.amount)} on{' '}
                    {formatDateTime(c.refund.at)} by {c.refund.by}.{' '}
                    {c.refund.reason} Step-up {c.refund.stepUpRef}.
                  </p>
                )}
                {c.status === 'closed' && c.closedNote && (
                  <p className="mt-3 rounded-xl bg-mist px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
                    {c.closedNote}
                    {c.closedBy && ` Closed by ${c.closedBy}.`}
                  </p>
                )}
                {c.status === 'open' && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      disabled={refundable === undefined}
                      onClick={() => {
                        setText('')
                        setRefundFor(c)
                      }}
                    >
                      <Undo2 aria-hidden="true" />
                      Refund{' '}
                      {refundable !== undefined && formatMoney(refundable)}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setText(
                          refundable === undefined
                            ? 'Nothing has been taken: the payment is only authorised and is taken only if the ACSP approves. Explained to the client.'
                            : '',
                        )
                        setCloseFor(c)
                      }}
                    >
                      <CircleSlash aria-hidden="true" />
                      Close without a refund
                    </Button>
                    {refundable === undefined && (
                      <span className="text-[0.875rem] text-slate">
                        No refund possible: nothing has been taken.
                      </span>
                    )}
                  </div>
                )}
              </li>
            )
          })}
          {complaints.length === 0 && (
            <li className="flex items-center gap-3 px-5 py-8 text-base text-slate sm:px-6">
              <MessageSquareWarning className="size-5" aria-hidden="true" />
              No complaints.
            </li>
          )}
        </ul>
      </Panel>

      <ReasonDialog
        open={!!refundFor && !stepUp}
        title={`Refund ${refundFor ? formatMoney(refundableAmount(data, refundFor) ?? 0) : ''}`}
        description={`${refundFor?.id}. The ACSP Professional Fee is returned to the payer through the secure payment provider. A step-up follows.`}
        label="Reason for the refund"
        text={text}
        setText={setText}
        confirm="Continue to confirm"
        onClose={() => setRefundFor(null)}
        onConfirm={() => setStepUp(true)}
      />
      <ReasonDialog
        open={!!closeFor}
        title="Close without a refund"
        description={`${closeFor?.id}. The note is written to the audit trail.`}
        label="Note for the file"
        text={text}
        setText={setText}
        confirm="Close complaint"
        onClose={() => setCloseFor(null)}
        onConfirm={() => {
          const c = closeFor!
          apply((d) => closeComplaint(d, c.id, text.trim(), actor))
          setCloseFor(null)
          toast({
            title: `${c.id} closed`,
            description: 'Written to the audit trail.',
          })
        }}
      />
      <StepUpDialog
        open={stepUp}
        action="refund this payment"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          const c = refundFor!
          apply((d) => refundComplaint(d, c.id, text.trim(), actor, ref))
          setStepUp(false)
          setRefundFor(null)
          toast({
            title: `Refund recorded for ${c.id}`,
            description: `Step-up ${ref} recorded in the audit trail.`,
          })
        }}
      />
    </Page>
  )
}

function ReasonDialog({
  open,
  title,
  description,
  label,
  text,
  setText,
  confirm,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  label: string
  text: string
  setText: (v: string) => void
  confirm: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-[24px] p-0">
        <DialogHeader className="border-b border-line/80 px-6 pt-6 pb-4 text-left">
          <DialogTitle className="text-xl font-medium">{title}</DialogTitle>
          <DialogDescription className="text-[0.9375rem] text-slate">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5">
          <label
            htmlFor="complaint-reason"
            className="text-[0.9375rem] font-medium text-ink"
          >
            {label}
          </label>
          <textarea
            id="complaint-reason"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-line/80 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!text.trim()} onClick={onConfirm}>
            {confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
