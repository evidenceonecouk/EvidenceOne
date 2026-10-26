import { Download } from 'lucide-react'
import { useState } from 'react'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { Button } from '@/components/ui/button'
import { auditForCase } from '@/store/selectors'
import { eventsInChain, verifyChain } from '@/lib/audit'
import { shortHash } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import { recordAuditExport } from '@/store/exportActions'

/*
  Gate 2 acceptance scenario 7: generate and export the verification audit
  trail. The ACSP exports its own hash-chained trail behind step-up, for one
  case or for its whole chain. The file holds the sequence, time, event type,
  actor and short hashes, plus the event text the audit already holds. It holds
  no document content and no codes. Each export is itself audited.
*/

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

export function AuditExport({
  acspId,
  caseId,
  actor,
  reviewerId,
  label,
}: {
  acspId: string
  /** One case's events, or the whole chain of the ACSP when omitted. */
  caseId?: string
  actor: string
  reviewerId: string
  label?: string
}) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)

  const download = (ref: string) => {
    const chain = eventsInChain(data.audit, acspId)
    const events = caseId ? auditForCase(data, caseId) : chain
    const intact = verifyChain(chain)
    const rows = [
      [
        'Sequence',
        'Timestamp',
        'Event type',
        'Actor',
        'Previous hash',
        'Hash',
        'Event',
      ],
      ...events.map((e) => [
        e.seq,
        e.at,
        e.action,
        e.actor,
        shortHash(e.prevHash),
        shortHash(e.hash),
        e.detail,
      ]),
    ]
    const header = [
      `Evidence One audit trail export. ${caseId ? `Case ${caseId}` : 'Whole chain'}.`,
      `Hash chain ${intact ? 'verified' : 'broken'}. Step-up ${ref}. Hashes are shortened.`,
      'Holds no document content and no Companies House codes.',
    ]
    const text = [
      ...header.map((l) => csvCell(l)),
      ...rows.map((r) => r.map(csvCell).join(',')),
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `evidence-one-audit-${caseId ?? 'chain'}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Download aria-hidden="true" />
        {label ?? 'Export audit trail'}
      </Button>
      <StepUpDialog
        open={open}
        action="export the audit trail"
        onClose={() => setOpen(false)}
        onConfirmed={(ref) => {
          setOpen(false)
          download(ref)
          apply((d) =>
            recordAuditExport(d, caseId, acspId, ref, actor, reviewerId),
          )
          toast({
            title: 'Audit trail exported',
            description: `Step-up ${ref} is written to your audit trail.`,
          })
        }}
      />
    </>
  )
}
