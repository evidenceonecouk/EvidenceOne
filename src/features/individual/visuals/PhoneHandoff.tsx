import { Loader2, MessageSquareText, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProviderLabel } from './ProviderLabel'
import { SyntheticQr } from './SyntheticQr'

/** "07700 900452" becomes "07700 900 ••• 452", keeping only the last three digits. */
const maskMobile = (mobile: string) => {
  const digits = mobile.replace(/\D/g, '')
  return `${digits.slice(0, 5)} ••• ${digits.slice(-3)}`
}

/*
  A simulated handoff from a computer to the same case on the person's phone,
  in the phone's browser. There is nothing to install. The person scans the QR
  code or opens a texted link, captures there, and returns to this case.
*/
export function PhoneHandoff({
  purpose,
  caseId,
  mobile,
  receiving,
  onReturn,
  onChoose,
}: {
  purpose: 'document' | 'liveness'
  caseId: string
  mobile: string
  /** The simulated return is in progress. */
  receiving: boolean
  onReturn: () => void
  /** Go back to the other choice, for example upload from this computer. */
  onChoose: () => void
}) {
  const [linkSent, setLinkSent] = useState(false)
  const what = purpose === 'document' ? 'your document' : 'your selfie video'
  return (
    <div className="mt-5 rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-col items-center">
        <SyntheticQr
          seed={`${caseId}-${purpose}`}
          className="size-44 rounded-xl border border-line"
        />
        <p className="mt-2 text-center text-[0.875rem] text-slate">
          Demo QR code. It cannot be scanned.
        </p>
      </div>
      <ol className="mt-4 space-y-2 text-base text-graphite">
        <li className="flex gap-3">
          <span className="font-mono text-slate" aria-hidden="true">
            1
          </span>
          Point your phone’s camera at the code, or use the link below.
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-slate" aria-hidden="true">
            2
          </span>
          A secure page opens in your phone’s browser. Capture {what} there.
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-slate" aria-hidden="true">
            3
          </span>
          You come straight back to this case. Nothing is installed.
        </li>
      </ol>
      <div className="mt-4 border-t border-line pt-4">
        {linkSent ? (
          <p
            className="flex items-start gap-2 text-base text-ink"
            role="status"
          >
            <MessageSquareText
              className="mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            We have sent a link by text message to {maskMobile(mobile)}.
          </p>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLinkSent(true)}
          >
            <MessageSquareText aria-hidden="true" />
            Or send me a link
          </Button>
        )}
      </div>
      <div className="mt-4 rounded-xl bg-mist p-3">
        <p className="flex items-center justify-between gap-2 text-[0.875rem] font-medium text-slate">
          <span>Demo control</span>
          <ProviderLabel className="bg-transparent" />
        </p>
        <Button
          className="mt-2.5 w-full disabled:opacity-100"
          onClick={onReturn}
          disabled={receiving}
        >
          {receiving ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Smartphone aria-hidden="true" />
          )}
          {receiving
            ? 'Receiving from your phone'
            : 'Simulate return to this case'}
        </Button>
      </div>
      <Button variant="link" className="mt-2 px-0" onClick={onChoose}>
        Choose another way
      </Button>
    </div>
  )
}
