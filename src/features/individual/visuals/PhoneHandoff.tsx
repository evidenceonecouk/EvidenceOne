import { Loader2, MessageSquareText, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import { ProviderLabel } from './ProviderLabel'
import { SyntheticQr } from './SyntheticQr'

/** "07700 900452" becomes "07700 900 ••• 452", keeping only the last three digits. */
const maskMobile = (mobile: string) => {
  const digits = mobile.replace(/\D/g, '')
  return `${digits.slice(0, 5)} ••• ${digits.slice(-3)}`
}

/*
  A simulated handoff from a computer to the same case on the person's phone or
  tablet. The certified identity provider needs a phone or tablet camera, so
  on desktop the provider's journey continues there and the person comes back
  to this case. Evidence One has no app; where the document has a chip, the
  chip is read by the identity provider's own chip reader on the phone.
*/
export function PhoneHandoff({
  purpose,
  caseId,
  mobile,
  receiving,
  onReturn,
  onChipNotRead,
  onNoSmartphone,
  chipStep = false,
}: {
  /** 'journey' is the whole provider journey; 'chip' and 'liveness' are single steps. */
  purpose: 'journey' | 'chip' | 'liveness'
  caseId: string
  mobile: string
  /** The simulated return is in progress. */
  receiving: boolean
  onReturn: () => void
  /** Demo control: simulate a return where the chip could not be read. */
  onChipNotRead?: () => void
  /** "I do not have a smartphone or tablet": Option 2 request to the ACSP. */
  onNoSmartphone?: () => void
  /** The document has a chip, so the provider's journey includes the chip step. */
  chipStep?: boolean
}) {
  const [linkSent, setLinkSent] = useState(false)
  const onPhone =
    purpose === 'chip'
      ? ['Read your passport chip with the identity provider’s chip reader']
      : purpose === 'liveness'
        ? ['Record a short selfie video']
        : [
            'Capture your document',
            ...(chipStep
              ? [
                  'Read your passport chip with the identity provider’s chip reader',
                ]
              : []),
            'Record a short selfie video',
          ]
  return (
    <div className="mt-5 rounded-2xl border border-line bg-white p-4">
      <p className="text-base text-graphite">
        A phone camera gives a clearer result, so this step is finished on your
        phone or tablet.
      </p>
      <div className="mt-4 flex flex-col items-center">
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
          <span>
            On your phone or tablet:
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {onPhone.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-slate" aria-hidden="true">
            3
          </span>
          Come back to this screen. We show your result here.
        </li>
      </ol>
      {(chipStep || purpose === 'chip') && (
        <p className="mt-3 rounded-xl bg-mist px-3 py-2 text-base text-graphite">
          The chip reader belongs to the certified identity provider and runs on
          your phone. It is not an Evidence One app.
        </p>
      )}
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
          {receiving ? 'Receiving your result' : 'Simulate return to this case'}
        </Button>
        {onChipNotRead && (chipStep || purpose === 'chip') && !receiving && (
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={onChipNotRead}
          >
            Simulate return, chip not read
          </Button>
        )}
      </div>
      {onNoSmartphone && (
        <div className="mt-3">
          <Button variant="link" className="px-0" onClick={onNoSmartphone}>
            I do not have a smartphone or tablet
          </Button>
          <PendingDecision />
        </div>
      )}
    </div>
  )
}
