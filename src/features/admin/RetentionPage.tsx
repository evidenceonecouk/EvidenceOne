import { useState } from 'react'
import {
  Archive,
  Fingerprint,
  Gavel,
  Hourglass,
  Lock,
  Trash2,
  Unlock,
} from 'lucide-react'
import { Link } from 'react-router'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDate, fullName, retentionExpiry } from '@/lib/format'
import { currentRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { liftHold, placeHold } from '@/store/adminActions'
import { useDemoStore } from '@/store/DemoStore'
import { getPerson } from '@/store/selectors'
import type { VerificationCase } from '@/types/domain'
import { AdminHeader, Figure, StateBadge } from './kit'

const DAY = 86_400_000
const ACTOR = 'Helen Carver, Super Administrator'
const holdReasons = [
  'Regulatory information request',
  'Litigation hold',
  'Complaint under investigation',
  'Companies House query',
]

/** When retention starts for a case: the decision, or the closing date for an abandoned case. */
function retentionStart(c: VerificationCase) {
  if (c.decision && c.decision.outcome !== 'request_info')
    return c.decision.decidedAt
  if (c.status === 'abandoned' && c.closedAt) return c.closedAt
  return undefined
}

export function RetentionPage() {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const [holdFor, setHoldFor] = useState<string | null>(null)
  const [reason, setReason] = useState(holdReasons[0])
  const [liftFor, setLiftFor] = useState<string | null>(null)
  const now = Date.now()
  const rs = currentRuleSet(data)
  const holds = data.retentionHolds ?? {}

  const rows = [...data.cases]
    .map((c) => {
      const start = retentionStart(c)
      const until = start ? retentionExpiry(start) : undefined
      const bioDue = start
        ? new Date(start).getTime() + rs.params.biometric_deletion_days * DAY
        : undefined
      return {
        c,
        person: getPerson(data, c.personId),
        start,
        until,
        bioDue,
        hold: holds[c.id],
      }
    })
    .sort((a, b) => (b.start ?? '9').localeCompare(a.start ?? '9'))

  const retained = rows.filter((r) => r.start)
  const bioPending = retained.filter((r) => r.bioDue && r.bioDue > now)
  const earliest = retained.map((r) => r.until!).sort()[0]

  return (
    <Page>
      <AdminHeader
        title="Retention"
        description={`Every verification record is kept for ${rs.params.retention_years} years from the reviewer decision, approvals, declines and abandoned cases alike. Nothing is ever deleted automatically.`}
      />

      <Panel aria-label="Retention summary" className="mb-6 overflow-hidden">
        <dl className="grid divide-line/70 sm:grid-cols-2 sm:divide-x xl:grid-cols-4">
          <Figure
            label="Records retained"
            value={retained.length}
            detail="Decided or closed cases"
          />
          <Figure
            label="On hold"
            value={Object.keys(holds).length}
            detail="Destruction suspended"
          />
          <Figure
            label="Biometric deletions due"
            value={bioPending.length}
            detail={`Within ${rs.params.biometric_deletion_days} days of completion`}
          />
          <Figure
            label="Earliest destruction review"
            value={earliest ? new Date(earliest).getFullYear() : 'None'}
            detail={earliest ? formatDate(earliest) : undefined}
          />
        </dl>
      </Panel>

      <Lifecycle
        years={rs.params.retention_years}
        days={rs.params.biometric_deletion_days}
      />

      <Panel aria-labelledby="records-title" className="overflow-hidden">
        <PanelHeader
          id="records-title"
          title="Records"
          description="Newest decision first"
          actions={<MonoLabel>Rule set {rs.version}</MonoLabel>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] text-left">
            <thead className="bg-mist/50 text-[0.875rem] text-slate">
              <tr>
                <th
                  scope="col"
                  className="py-2.5 pr-4 pl-5 font-normal sm:pl-6"
                >
                  Case
                </th>
                <th scope="col" className="py-2.5 pr-4 font-normal">
                  Person
                </th>
                <th scope="col" className="py-2.5 pr-4 font-normal">
                  Retention from
                </th>
                <th scope="col" className="py-2.5 pr-4 font-normal">
                  Kept until
                </th>
                <th scope="col" className="py-2.5 pr-4 font-normal">
                  Biometric samples
                </th>
                <th scope="col" className="py-2.5 pr-4 font-normal">
                  State
                </th>
                <th scope="col" className="py-2.5 pr-6 text-right font-normal">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, person, start, until, bioDue, hold }) => {
                const bioLeft = bioDue
                  ? Math.ceil((bioDue - now) / DAY)
                  : undefined
                const past = until ? new Date(until).getTime() < now : false
                return (
                  <tr key={c.id} className="border-t border-line/70 align-top">
                    <td className="py-4 pr-4 pl-5 sm:pl-6">
                      <Link
                        to={`/records/${c.id}`}
                        className="font-mono text-[0.875rem] whitespace-nowrap text-ink underline-offset-2 hover:underline"
                      >
                        {c.id}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-[0.9375rem] font-medium text-ink">
                      {person ? fullName(person) : 'Unknown'}
                    </td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-graphite">
                      {start ? (
                        formatDate(start)
                      ) : (
                        <span className="text-slate">Not decided</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-ink tabular">
                      {until ? (
                        formatDate(until)
                      ) : (
                        <span className="text-slate">Starts at decision</span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      {bioLeft === undefined ? (
                        <span className="text-[0.9375rem] text-slate">
                          Held while open
                        </span>
                      ) : bioLeft > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-[0.9375rem] text-graphite">
                          <Fingerprint
                            className="size-4 text-slate"
                            aria-hidden="true"
                          />
                          Deleted in {bioLeft} {bioLeft === 1 ? 'day' : 'days'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[0.9375rem] text-graphite">
                          <Fingerprint
                            className="size-4 text-approve"
                            aria-hidden="true"
                          />
                          Deleted
                        </span>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      {hold ? (
                        <>
                          <StateBadge tone="locked" icon={Lock}>
                            On hold
                          </StateBadge>
                          <p className="mt-1.5 max-w-[14rem] text-[0.8125rem] text-slate">
                            {hold.reason}, {formatDate(hold.placedAt)}
                          </p>
                        </>
                      ) : !start ? (
                        <StateBadge tone="neutral">Open case</StateBadge>
                      ) : past ? (
                        <StateBadge tone="attention">
                          Ready for review
                        </StateBadge>
                      ) : (
                        <StateBadge tone="ok" icon={Archive}>
                          Retained
                        </StateBadge>
                      )}
                    </td>
                    <td className="py-3 pr-6">
                      <div className="flex justify-end gap-2">
                        {hold ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLiftFor(c.id)}
                          >
                            <Unlock className="size-4" aria-hidden="true" />
                            Lift hold
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHoldFor(c.id)}
                          >
                            <Gavel className="size-4" aria-hidden="true" />
                            Place hold
                          </Button>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              tabIndex={0}
                              className="rounded-lg focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                aria-label={`Destroy record ${c.id}`}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-[0.875rem]">
                            {hold
                              ? 'Refused while a hold is in place.'
                              : until
                                ? `Available after ${formatDate(until)}, as a deliberate and audited action.`
                                : 'Not available while the case is open.'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
          A record past its retention date is never deleted automatically.
          Destruction is a deliberate action by an authorised person, refused
          while a hold is in place, and written to the audit trail.
        </p>
      </Panel>

      <Dialog open={!!holdFor} onOpenChange={(o) => !o && setHoldFor(null)}>
        <DialogContent className="max-w-md rounded-[24px] p-0">
          <DialogHeader className="border-b border-line/80 px-6 pt-6 pb-4 text-left">
            <DialogTitle className="text-xl font-medium">
              Place a retention hold
            </DialogTitle>
            <DialogDescription className="text-[0.9375rem] text-slate">
              {holdFor} cannot be destroyed while the hold is in place, even
              after its retention date.
            </DialogDescription>
          </DialogHeader>
          <fieldset className="space-y-2 px-6 py-5">
            <legend className="mb-2 text-[0.9375rem] font-medium text-ink">
              Reason
            </legend>
            {holdReasons.map((r) => (
              <label
                key={r}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[0.9375rem] transition-colors',
                  reason === r
                    ? 'border-ink bg-mist/60'
                    : 'border-line hover:border-silver',
                )}
              >
                <input
                  type="radio"
                  name="hold-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="size-4 accent-[var(--ink)]"
                />
                {r}
              </label>
            ))}
          </fieldset>
          <div className="flex justify-end gap-3 border-t border-line/80 px-6 py-4">
            <Button variant="outline" onClick={() => setHoldFor(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const id = holdFor!
                apply((d) => placeHold(d, id, reason, ACTOR))
                setHoldFor(null)
                toast({
                  title: `Hold placed on ${id}`,
                  description: 'Written to the audit trail.',
                })
              }}
            >
              <Lock className="size-4" aria-hidden="true" />
              Place hold
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StepUpDialog
        open={!!liftFor}
        action="lift this retention hold"
        onClose={() => setLiftFor(null)}
        onConfirmed={(ref) => {
          const id = liftFor!
          apply((d) => liftHold(d, id, ACTOR, ref))
          setLiftFor(null)
          toast({
            title: `Hold lifted on ${id}`,
            description: `Step-up ${ref} recorded in the audit trail.`,
          })
        }}
      />
    </Page>
  )
}

function Lifecycle({ years, days }: { years: number; days: number }) {
  const steps = [
    {
      icon: Gavel,
      title: 'Reviewer decision',
      body: 'Retention starts at the decision timestamp',
    },
    {
      icon: Fingerprint,
      title: `Biometrics deleted`,
      body: `Raw samples removed within ${days} days`,
    },
    {
      icon: Archive,
      title: `Kept ${years} years`,
      body: 'Documents, checks and the full audit trail',
    },
    {
      icon: Hourglass,
      title: 'Destruction review',
      body: 'A person decides; holds suspend it',
    },
  ]
  return (
    <ol
      className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Record lifecycle"
    >
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="relative flex items-start gap-3 rounded-2xl border border-line/80 bg-white p-5"
        >
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              i === 2 ? 'bg-ink text-paper' : 'bg-mist text-ink',
            )}
          >
            <s.icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">
              Step {i + 1}
            </p>
            <p className="mt-0.5 text-base font-medium text-ink">{s.title}</p>
            <p className="mt-0.5 text-[0.875rem] text-slate">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
