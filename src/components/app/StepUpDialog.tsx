import { Fingerprint, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { newStepUpRef } from '@/store/actions'

/**
  Step-up authentication before approve, decline, export and starting a
  submission. Passkey or authenticator app only; there is no SMS option.
  Both are simulated in the demo.
*/
export function StepUpDialog({ open, action, onClose, onConfirmed }: { open: boolean; action: string; onClose: () => void; onConfirmed: (ref: string, method: 'passkey' | 'authenticator') => void }) {
  const [phase, setPhase] = useState<'idle' | 'passkey'>('idle')
  const [code, setCode] = useState('')

  const finish = (method: 'passkey' | 'authenticator') => {
    const ref = newStepUpRef(action)
    setPhase('idle')
    setCode('')
    onConfirmed(ref, method)
  }

  const passkey = () => {
    setPhase('passkey')
    window.setTimeout(() => finish('passkey'), 1100)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setPhase('idle')
          setCode('')
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md rounded-[24px] p-0">
        <DialogHeader className="border-b border-line/80 px-6 pt-6 pb-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-xl font-medium">
            <ShieldCheck className="size-5" aria-hidden="true" />
            Confirm it’s you
          </DialogTitle>
          <DialogDescription className="text-base text-slate">To {action}, confirm with your passkey or your authenticator app. The step-up reference is written to the audit trail.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          <Button size="lg" className="w-full disabled:opacity-100" onClick={passkey} disabled={phase === 'passkey'}>
            {phase === 'passkey' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Fingerprint aria-hidden="true" />}
            {phase === 'passkey' ? 'Waiting for your passkey' : 'Use my passkey'}
          </Button>
          <div className="flex items-center gap-3 text-sm text-slate">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <div>
            <label htmlFor="stepup-code" className="flex items-center gap-2 text-[0.9375rem] font-medium text-ink">
              <KeyRound className="size-4" aria-hidden="true" />
              Code from your authenticator app
            </label>
            <div className="mt-2 flex gap-3">
              <input
                id="stepup-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="h-12 w-40 rounded-xl border border-line bg-white px-3.5 text-center font-mono text-lg tracking-[0.3em] text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
              />
              <Button variant="outline" size="lg" disabled={code.length !== 6 || phase === 'passkey'} onClick={() => finish('authenticator')}>
                Confirm
              </Button>
            </div>
            <p className="mt-1.5 text-sm text-slate">Any six digits work in this demonstration.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
