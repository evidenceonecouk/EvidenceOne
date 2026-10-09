import { CircleCheck, FileWarning, Flag, Waypoints } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
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
import { formatDateTime } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'
import {
  raiseRegisterCorrection,
  recordDiscrepancyChoice,
} from '@/store/reviewActions'
import type { DiscrepancyReport, VerificationCase } from '@/types/domain'

const choiceLabel: Record<NonNullable<DiscrepancyReport['choice']>, string> = {
  will_report: 'I will report it',
  not_reporting: 'I will not report it',
}

/**
  G2-10: a register difference is flagged, never halted. The reviewer is
  prompted to report it to Companies House and records the choice, with a note.
  Evidence One logs the choice only; it files nothing through an API.
*/
export function DiscrepancyPrompt({
  vc,
  differences,
  fields,
  reviewerId,
  decidable,
}: {
  vc: VerificationCase
  /** One line per differing field. */
  differences: string[]
  /** The names of the differing fields, for the Route B correction. */
  fields: string[]
  reviewerId: string
  decidable: boolean
}) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const report = vc.discrepancyReport
  const [editing, setEditing] = useState(!report?.choice)
  const [note, setNote] = useState(report?.choiceNote ?? '')
  const [correcting, setCorrecting] = useState(false)
  const [field, setField] = useState(fields[0] ?? '')
  const summary = report?.summary ?? differences.join('. ')
  const task = vc.correctionTaskId
    ? data.corrections.find((t) => t.id === vc.correctionTaskId)
    : undefined

  const choose = (choice: NonNullable<DiscrepancyReport['choice']>) => {
    apply((d) =>
      recordDiscrepancyChoice(d, vc.id, summary, choice, note, reviewerId),
    )
    setEditing(false)
    toast({
      title: 'Your choice is recorded',
      description: `${choiceLabel[choice]}. Logged on the case and in the audit trail.`,
    })
  }

  return (
    <div
      data-cite="declared:discrepancy"
      className="border-b border-line/70 bg-info-wash/40 px-5 py-5 sm:px-6"
    >
      <div className="flex items-start gap-3">
        <FileWarning
          className="mt-0.5 size-6 shrink-0 text-info"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-medium text-ink">
            Report this difference to Companies House
            <span className="inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-white px-2.5 py-0.5 text-[0.8125rem] font-medium text-info">
              <Flag className="size-3.5" aria-hidden="true" />
              Flag, not a halt
            </span>
          </h3>
          <ul className="mt-2 space-y-1">
            {differences.map((d) => (
              <li key={d} className="text-base text-ink">
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-graphite">
            The case carries on. Record your choice here, then record your
            Mandatory decision on the rule below. Evidence One logs your choice
            on the case. It does not file the report for you.
          </p>

          {report?.choice && !editing ? (
            <div className="mt-4 rounded-xl border border-line bg-white px-4 py-3">
              <p className="flex items-center gap-2 text-base font-medium text-ink">
                <CircleCheck
                  className="size-5 text-approve"
                  aria-hidden="true"
                />
                {choiceLabel[report.choice]}
              </p>
              {report.choiceNote && (
                <p className="mt-1 text-[0.9375rem] text-graphite">
                  Note: {report.choiceNote}
                </p>
              )}
              <p className="mt-1 text-[0.8125rem] text-slate">
                Recorded by {report.choiceBy}
                {report.choiceAt && `, ${formatDateTime(report.choiceAt)}`}
              </p>
              {decidable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => {
                    setNote(report.choiceNote ?? '')
                    setEditing(true)
                  }}
                >
                  Change my choice
                </Button>
              )}
            </div>
          ) : decidable ? (
            <div className="mt-4">
              <label
                htmlFor="discrepancy-note"
                className="text-[0.9375rem] font-medium text-ink"
              >
                Note for the file
              </label>
              <textarea
                id="discrepancy-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1.5 w-full max-w-2xl rounded-xl border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <Button onClick={() => choose('will_report')}>
                  I will report it
                </Button>
                <Button
                  variant="outline"
                  onClick={() => choose('not_reporting')}
                >
                  I will not report it
                </Button>
                {report?.choice && (
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[0.9375rem] text-slate">
              No choice was recorded before the decision.
            </p>
          )}

          <div className="mt-5 border-t border-line/70 pt-4">
            <p className="text-[0.9375rem] text-graphite">
              If the register itself is wrong, a correction can also be raised
              in Route B. This is separate, and the case is not halted.
            </p>
            {task ? (
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link to="/acsp/filings">
                  <Waypoints aria-hidden="true" />
                  Route B task {task.id}
                </Link>
              </Button>
            ) : (
              decidable &&
              fields.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setCorrecting(true)}
                >
                  <Waypoints aria-hidden="true" />
                  Raise a register correction in Route B
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      <Dialog open={correcting} onOpenChange={setCorrecting}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-medium">
              Raise a register correction
            </DialogTitle>
            <DialogDescription className="text-base text-slate">
              Use this only when the register is wrong, not the identity
              document. The Route B task is prepared for you to file from your
              own account. This case is not halted.
            </DialogDescription>
          </DialogHeader>
          <fieldset className="space-y-2">
            <legend className="text-[0.9375rem] font-medium text-ink">
              Field to correct
            </legend>
            {fields.map((f) => (
              <label
                key={f}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 has-[:checked]:border-ink has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink"
              >
                <input
                  type="radio"
                  name="correct-field"
                  checked={field === f}
                  onChange={() => setField(f)}
                  className="sr-only"
                />
                <span className="text-base text-ink">{f}</span>
              </label>
            ))}
          </fieldset>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrecting(false)}>
              Cancel
            </Button>
            <Button
              disabled={!field}
              onClick={() => {
                apply((d) => raiseRegisterCorrection(d, vc.id, field, reviewerId))
                setCorrecting(false)
                toast({
                  title: 'Route B task raised',
                  description: 'Recorded in the audit trail. The case carries on.',
                })
              }}
            >
              Raise the task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
