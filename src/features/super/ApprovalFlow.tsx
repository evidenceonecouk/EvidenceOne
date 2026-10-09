import {
  ArrowRight,
  CircleCheck,
  Lock,
  Undo2,
  UserCheck,
  UserRoundCog,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { useToast } from '@/components/app/Toaster'
import { Button } from '@/components/ui/button'
import { StateBadge } from '@/features/admin/kit'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SUPER_ADMINS, useDemoStore } from '@/store/DemoStore'
import {
  canDecide,
  decideApproval,
  isSamePerson,
  KIND_LABELS,
  superActorName,
  withdrawApproval,
} from '@/store/superActions'
import type { ApprovalRequest } from '@/types/domain'

/*
  Shared pieces of the two-person flow used by Fees and plans, Referral
  commissions and the Super Administrator home. Nobody approves their own
  change: the approver must be the other seat.
*/

/** Who is signed in, who the other seat is, and whether this persona may change anything. */
export function useSuperSeat() {
  const { state, setSeat } = useDemoStore()
  const seat =
    SUPER_ADMINS.find((x) => x.seat === state.superAdminSeat) ?? SUPER_ADMINS[0]
  const other =
    SUPER_ADMINS.find((x) => x.seat !== seat.seat) ?? SUPER_ADMINS[1]
  return {
    isSuper: state.persona === 'superAdmin',
    seat,
    other,
    actor: superActorName(seat.name),
    setSeat,
  }
}

export const otherSeatLabel = (seat: 1 | 2, name: string) =>
  `Switch to ${name}, ${seat === 2 ? 'second approver' : 'approver'}`

/** Shown to everyone who is not a Super Administrator. */
export function SuperOnlyNotice({ what }: { what: string }) {
  return (
    <div
      role="note"
      className="mb-8 flex items-start gap-3 rounded-2xl border border-line bg-mist px-5 py-4"
    >
      <Lock
        className="mt-0.5 size-5 shrink-0 text-graphite"
        aria-hidden="true"
      />
      <div>
        <p className="text-base font-medium text-ink">
          Super Administrator only, with a second approver
        </p>
        <p className="mt-1 text-[0.9375rem] text-slate">
          You can read {what}. Changes are proposed by one Super Administrator
          and approved by a different one, each confirming with a passkey or
          authenticator code.
        </p>
      </div>
    </div>
  )
}

/** Tells the signed-in seat what it can do here. */
export function SeatNotice({ className }: { className?: string }) {
  const { seat, other, setSeat } = useSuperSeat()
  return (
    <div
      role="note"
      className={cn(
        'mb-8 flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <UserRoundCog
          className="mt-0.5 size-5 shrink-0 text-graphite"
          aria-hidden="true"
        />
        <div>
          <p className="text-base font-medium text-ink">
            You are acting as {seat.name}
            {seat.seat === 1 ? ' (proposes)' : ' (second approver)'}
          </p>
          <p className="mt-0.5 text-[0.9375rem] text-slate">
            {seat.seat === 1
              ? `You can propose changes. ${other.name} approves them, never you.`
              : `You can approve or reject changes proposed by ${other.name}. You never approve your own.`}
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={() => setSeat(other.seat)}>
        {otherSeatLabel(other.seat, other.name)}
      </Button>
    </div>
  )
}

const statusTone = {
  pending: 'info',
  approved: 'ok',
  rejected: 'action',
} as const
const statusLabel = {
  pending: 'Waiting for second approver',
  approved: 'Approved and applied',
  rejected: 'Rejected',
} as const

/** Proposed, second approver, applied. */
function Steps({ approval }: { approval: ApprovalRequest }) {
  const done = approval.status !== 'pending'
  const rejected = approval.status === 'rejected'
  const items = [
    {
      label: 'Proposed',
      who: approval.proposedBy.split(',')[0],
      when: formatDateTime(approval.proposedAt),
      state: 'done' as const,
    },
    {
      label: 'Second approver',
      who:
        approval.decidedBy?.split(',')[0] ?? 'A different Super Administrator',
      when: approval.decidedAt ? formatDateTime(approval.decidedAt) : 'Not yet',
      state: done ? ('done' as const) : ('current' as const),
    },
    {
      label: rejected ? 'Not applied' : 'Applied',
      who: rejected
        ? 'Nothing changed'
        : done
          ? 'In force now'
          : 'After approval',
      when: '',
      state: done ? ('done' as const) : ('todo' as const),
    },
  ]
  return (
    <ol className="grid gap-3 sm:grid-cols-3" aria-label="Approval steps">
      {items.map((s, i) => (
        <li
          key={s.label}
          className={cn(
            'rounded-xl border px-4 py-3',
            s.state === 'current'
              ? 'border-ink bg-white'
              : s.state === 'done'
                ? 'border-line bg-mist'
                : 'border-dashed border-line bg-white',
          )}
          aria-current={s.state === 'current' ? 'step' : undefined}
        >
          <p className="flex items-center gap-2 font-mono text-[0.75rem] tracking-[0.12em] text-slate uppercase">
            {s.state === 'done' ? (
              <CircleCheck className="size-4 text-approve" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{i + 1}</span>
            )}
            {s.label}
          </p>
          <p className="mt-1 text-base font-medium text-ink">{s.who}</p>
          {s.when && <p className="text-[0.875rem] text-slate">{s.when}</p>}
        </li>
      ))}
    </ol>
  )
}

/**
  One approval request: what is proposed, the three steps, and the action the
  signed-in seat can take. The proposer is told to switch seat; the other seat
  approves or rejects with step-up.
*/
export function ApprovalCard({
  approval,
  readOnly,
  children,
}: {
  approval: ApprovalRequest
  /** Anyone who is not a Super Administrator reads only. */
  readOnly?: boolean
  children?: ReactNode
}) {
  const { apply } = useDemoStore()
  const toast = useToast()
  const { actor, seat, other, setSeat } = useSuperSeat()
  const [confirm, setConfirm] = useState<'approved' | 'rejected' | null>(null)
  const pending = approval.status === 'pending'
  const mine = isSamePerson(approval.proposedBy, actor)
  const mayDecide = !readOnly && canDecide(approval, actor)

  return (
    <article
      className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6"
      aria-label={`${KIND_LABELS[approval.kind]} request ${approval.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[0.8125rem] tracking-[0.12em] text-slate uppercase">
          {KIND_LABELS[approval.kind]} · {approval.id}
        </p>
        <StateBadge tone={statusTone[approval.status]}>
          {statusLabel[approval.status]}
        </StateBadge>
      </div>
      <h3 className="mt-2 text-lg font-medium text-ink">{approval.summary}</h3>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-base text-graphite">
        <span>{approval.from}</span>
        <ArrowRight className="size-4 text-slate" aria-hidden="true" />
        <span className="font-medium text-ink">{approval.to}</span>
      </p>
      <div className="mt-4">
        <Steps approval={approval} />
      </div>
      {children}

      {pending && !readOnly && mine && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-mist px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] text-graphite">
            <span className="font-medium text-ink">
              You proposed this, so you cannot approve it.
            </span>{' '}
            Switch seat in the sidebar to {other.name}, the second approver, who
            will confirm with step-up.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button onClick={() => setSeat(other.seat)}>
              <UserCheck aria-hidden="true" />
              {otherSeatLabel(other.seat, other.name)}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                apply((d) => withdrawApproval(d, approval.id, actor))
                toast({
                  title: 'Request withdrawn',
                  description:
                    'Nothing was changed. Written to the audit trail.',
                })
              }}
            >
              <Undo2 aria-hidden="true" />
              Withdraw
            </Button>
          </div>
        </div>
      )}

      {pending && mayDecide && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-ink/20 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9375rem] text-graphite">
            <span className="font-medium text-ink">
              You are the second approver ({seat.name}).
            </span>{' '}
            Approving applies the change at once and confirms it with step-up.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button onClick={() => setConfirm('approved')}>
              <CircleCheck aria-hidden="true" />
              Approve
            </Button>
            <Button variant="outline" onClick={() => setConfirm('rejected')}>
              Reject
            </Button>
          </div>
        </div>
      )}

      {pending && readOnly && (
        <p className="mt-4 text-[0.9375rem] text-slate">
          Super Administrator only, with a second approver.
        </p>
      )}

      {!pending && approval.decidedBy && (
        <p className="mt-4 text-[0.9375rem] text-slate">
          {approval.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
          {approval.decidedBy.split(',')[0]}
          {approval.stepUpRef && (
            <>
              {' '}
              with step-up{' '}
              <span className="font-mono text-ink">{approval.stepUpRef}</span>
            </>
          )}
          .
        </p>
      )}

      <StepUpDialog
        open={confirm !== null}
        action={`${confirm === 'rejected' ? 'reject' : 'approve'} this ${KIND_LABELS[approval.kind].toLowerCase()} change`}
        onClose={() => setConfirm(null)}
        onConfirmed={(ref) => {
          const outcome = confirm ?? 'approved'
          apply((d) => decideApproval(d, approval.id, outcome, actor, ref))
          setConfirm(null)
          toast({
            title:
              outcome === 'approved'
                ? `${KIND_LABELS[approval.kind]} change approved`
                : `${KIND_LABELS[approval.kind]} change rejected`,
            description: `Step-up ${ref} recorded in the audit trail.`,
          })
        }}
      />
    </article>
  )
}
