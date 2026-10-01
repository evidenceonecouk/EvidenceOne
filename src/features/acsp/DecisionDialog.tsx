import { CircleCheck, CircleX, MessageSquareMore } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DECLINE_MESSAGE, reasonCodes } from '@/data/reasonCodes'
import { cn } from '@/lib/utils'
import type { DecisionOutcome } from '@/types/domain'

const spec: Record<DecisionOutcome, { title: string; verb: string; icon: typeof CircleCheck; button: string; ring: string }> = {
  approve: { title: 'Approve this verification', verb: 'Continue to confirm', icon: CircleCheck, button: 'bg-approve hover:bg-approve/90 text-white', ring: 'border-approve shadow-[0_0_0_1px_var(--approve)]' },
  request_info: { title: 'Request information', verb: 'Send request', icon: MessageSquareMore, button: 'bg-info hover:bg-info/90 text-white', ring: 'border-info shadow-[0_0_0_1px_var(--info)]' },
  decline: { title: 'Decline this verification', verb: 'Continue to confirm', icon: CircleX, button: 'bg-decline hover:bg-decline/90 text-white', ring: 'border-decline shadow-[0_0_0_1px_var(--decline)]' },
}

/**
  The reviewer's decision: a reason code, the detail the rules require, and for
  approval the DEC-05 confirmation. Approve and decline then need a step-up.
*/
export function DecisionDialog({
  outcome,
  personName,
  defaultNote = '',
  onClose,
  onConfirm,
}: {
  outcome: DecisionOutcome | null
  personName: string
  defaultNote?: string
  onClose: () => void
  onConfirm: (reasonCode: string, note: string) => void
}) {
  const codes = reasonCodes.filter((r) => r.outcome === outcome)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [satisfied, setSatisfied] = useState(false)
  const s = outcome ? spec[outcome] : null

  useEffect(() => {
    if (!outcome) return
    setReason(outcome === 'approve' ? 'APR-01' : '')
    setNote(outcome === 'request_info' ? defaultNote : '')
    setSatisfied(false)
  }, [outcome, defaultNote])

  const ready = !!reason && (outcome === 'approve' ? satisfied : note.trim().length > 0)

  return (
    <Dialog open={!!outcome} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto rounded-[24px] p-0">
        {s && (
          <>
            <DialogHeader className="border-b border-line/80 px-6 pt-6 pb-4 text-left">
              <DialogTitle className="flex items-center gap-2 text-xl font-medium">
                <s.icon className="size-5" aria-hidden="true" />
                {s.title}
              </DialogTitle>
              <DialogDescription className="text-base text-slate">{personName}. Your decision, reason and identity are written to the audit trail.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-6 py-5">
              <fieldset>
                <legend className="text-[0.9375rem] font-medium text-ink">Reason code</legend>
                <div className="mt-2 space-y-2">
                  {codes.map((r) => (
                    <label
                      key={r.code}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border bg-white px-4 py-3 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
                        reason === r.code ? s.ring : 'border-line hover:border-silver',
                      )}
                    >
                      <input type="radio" name="reason" className="sr-only" checked={reason === r.code} onChange={() => setReason(r.code)} />
                      <span className="mt-0.5 font-mono text-[0.875rem] text-slate">{r.code}</span>
                      <span className="text-[0.9375rem] text-ink">{r.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="decision-note" className="text-[0.9375rem] font-medium text-ink">
                  {outcome === 'request_info' ? 'Exactly what is needed (DEC-04)' : outcome === 'decline' ? 'Detail for the file (DEC-03)' : 'Note for the file (optional)'}
                </label>
                {outcome === 'decline' && <p className="mt-0.5 text-sm text-slate">Recorded in the audit trail. Not shown to the individual.</p>}
                {outcome === 'request_info' && <p className="mt-0.5 text-sm text-slate">Shown to the individual in the app.</p>}
                <textarea
                  id="decision-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                />
              </div>
              {outcome === 'decline' && (
                <div className="rounded-xl bg-decline-wash px-4 py-3">
                  <p className="text-sm font-medium text-decline">The individual will see exactly this:</p>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-decline">{DECLINE_MESSAGE}</p>
                </div>
              )}
              {outcome === 'approve' && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white px-4 py-3 text-[0.9375rem] leading-relaxed text-ink">
                  <Checkbox className="mt-0.5" checked={satisfied} onChange={(e) => setSatisfied(e.target.checked)} />
                  <span>
                    I am satisfied that {personName} is who they claim to be, and that the checks meet the standard. <span className="font-mono text-[0.8125rem] text-slate">DEC-05</span>
                  </span>
                </label>
              )}
            </div>
            <DialogFooter className="border-t border-line/80 px-6 py-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button className={s.button} disabled={!ready} onClick={() => onConfirm(reason, note.trim())}>
                <s.icon aria-hidden="true" />
                {s.verb}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
