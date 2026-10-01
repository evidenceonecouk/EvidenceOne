import { CircleCheck, CircleX, KeyRound, MessageSquareMore } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { reasonCodes } from '@/data/reasonCodes'
import { cn } from '@/lib/utils'
import type { DecisionOutcome } from '@/types/domain'

const spec: Record<DecisionOutcome, { title: string; verb: string; icon: typeof CircleCheck; button: string; ring: string }> = {
  approve: { title: 'Approve this verification', verb: 'Confirm approval', icon: CircleCheck, button: 'bg-approve hover:bg-approve/90 text-white', ring: 'border-approve shadow-[0_0_0_1px_var(--approve)]' },
  request_info: { title: 'Request more information', verb: 'Send request', icon: MessageSquareMore, button: 'bg-info hover:bg-info/90 text-white', ring: 'border-info shadow-[0_0_0_1px_var(--info)]' },
  decline: { title: 'Decline this verification', verb: 'Confirm decline', icon: CircleX, button: 'bg-decline hover:bg-decline/90 text-white', ring: 'border-decline shadow-[0_0_0_1px_var(--decline)]' },
}

/** The only place a verification decision is made: a person, a reason code and a fresh second factor. */
export function DecisionDialog({
  outcome,
  personName,
  onClose,
  onConfirm,
}: {
  outcome: DecisionOutcome | null
  personName: string
  onClose: () => void
  onConfirm: (reasonCode: string, note: string) => void
}) {
  const codes = reasonCodes.filter((r) => r.outcome === outcome)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [code, setCode] = useState('')
  const s = outcome ? spec[outcome] : null
  const needsNote = outcome !== 'approve'
  const ready = !!reason && code.replace(/\D/g, '').length === 6 && (!needsNote || note.trim().length > 0)

  return (
    <Dialog
      open={!!outcome}
      onOpenChange={(o) => {
        if (!o) {
          setReason('')
          setNote('')
          setCode('')
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-lg rounded-[24px] p-0">
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
                  {needsNote ? 'Message to the individual' : 'Note for the file (optional)'}
                </label>
                <textarea
                  id="decision-note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                />
              </div>
              <div>
                <label htmlFor="stepup" className="flex items-center gap-2 text-[0.9375rem] font-medium text-ink">
                  <KeyRound className="size-4" aria-hidden="true" />
                  Code from your authenticator app
                </label>
                <input
                  id="stepup"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="mt-2 h-12 w-40 rounded-xl border border-line bg-white px-3.5 text-center font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                />
                <p className="mt-1.5 text-sm text-slate">Any six digits work in this demonstration.</p>
              </div>
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
