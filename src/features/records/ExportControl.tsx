import { Download, Hourglass, Send } from 'lucide-react'
import { useState } from 'react'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { recordExport } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import {
  directExportOpen,
  exportRequestFor,
  recordExportDownload,
  requestExport,
} from '@/store/exportActions'
import type { VerificationCase } from '@/types/domain'

const reasons = [
  'Supervisor file review',
  'Client asked for a copy of its verification record',
  'Regulatory information request',
  'Internal compliance audit',
]

/**
  Export of the verification file. Straight after the decision the ACSP
  downloads it directly; later it asks a Platform Administrator, who releases
  the download without opening the evidence. Every download needs step-up.
*/
export function ExportControl({
  vc,
  actor,
}: {
  vc: VerificationCase
  actor: string
}) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const [stepUp, setStepUp] = useState(false)
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState(reasons[0])
  const direct = directExportOpen(vc)
  const request = exportRequestFor(data, vc.id)
  const released = request?.status === 'released'

  if (!vc.decision || vc.decision.outcome === 'request_info')
    return (
      <p className="text-[0.9375rem] text-slate">
        The file can be exported once the case is decided.
      </p>
    )

  return (
    <>
      {direct || released ? (
        <Button variant="outline" onClick={() => setStepUp(true)}>
          <Download aria-hidden="true" />
          {direct ? 'Export as PDF' : 'Download the released file'}
        </Button>
      ) : request?.status === 'requested' ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-progress-wash px-3 py-1.5 text-[0.9375rem] font-medium text-progress">
          <Hourglass className="size-4" aria-hidden="true" />
          Export requested, waiting for release ({request.id})
        </span>
      ) : (
        <Button variant="outline" onClick={() => setAsking(true)}>
          <Send aria-hidden="true" />
          Request an export
        </Button>
      )}

      <Dialog open={asking} onOpenChange={setAsking}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-medium">
              Request an export
            </DialogTitle>
            <DialogDescription className="text-base text-slate">
              You can export straight after your decision. Later, within the
              seven years, a Platform Administrator releases the download. The
              administrator never opens the evidence.
            </DialogDescription>
          </DialogHeader>
          <fieldset className="space-y-2">
            <legend className="text-[0.9375rem] font-medium text-ink">
              Reason
            </legend>
            {reasons.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 text-base text-ink has-[:checked]:border-ink has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink"
              >
                <input
                  type="radio"
                  name="export-reason"
                  className="size-4 accent-ink"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                {r}
              </label>
            ))}
          </fieldset>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                apply((d) => requestExport(d, vc.id, actor, reason))
                setAsking(false)
                toast({
                  title: 'Export requested',
                  description:
                    'A Platform Administrator will release it. Recorded in the audit trail.',
                })
              }}
            >
              Send the request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StepUpDialog
        open={stepUp}
        action="export this record"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          apply((d) =>
            released && !direct
              ? recordExportDownload(d, request!.id, actor, ref)
              : recordExport(d, vc.id, ref, actor),
          )
          window.setTimeout(() => window.print(), 300)
        }}
      />
    </>
  )
}
