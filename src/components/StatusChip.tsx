import {
  Ban,
  CircleAlert,
  ClipboardCheck,
  Flag,
  Hourglass,
  MessageSquareMore,
  Building2,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CirclePause,
  CircleX,
  Clock3,
  RefreshCw,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CaseStatus, PersonStatus, RuleOutcome } from '@/types/domain'

type Tone = 'neutral' | 'progress' | 'complete' | 'attention' | 'negative'

interface ChipSpec {
  label: string
  icon: LucideIcon
  tone: Tone
}

/* Never colour alone: every status has a label and an icon. */
const personSpecs: Record<PersonStatus, ChipSpec> = {
  not_started: { label: 'Not started', icon: CircleDashed, tone: 'neutral' },
  in_progress: { label: 'In progress', icon: CircleDot, tone: 'progress' },
  awaiting_info: { label: 'Awaiting information', icon: Hourglass, tone: 'attention' },
  with_acsp: { label: 'With the ACSP', icon: Building2, tone: 'progress' },
  verified: { label: 'Verified', icon: CircleCheck, tone: 'complete' },
  not_completed: { label: 'Not completed', icon: CircleX, tone: 'negative' },
  reverification_due: { label: 'Reverification due', icon: RefreshCw, tone: 'attention' },
}

const caseSpecs: Record<CaseStatus, ChipSpec> = {
  invited: { label: 'Invited', icon: Send, tone: 'neutral' },
  in_progress: { label: 'In progress', icon: CircleDot, tone: 'progress' },
  in_review: { label: 'Awaiting review', icon: Clock3, tone: 'progress' },
  info_requested: { label: 'Information requested', icon: CircleAlert, tone: 'attention' },
  halted_register_mismatch: { label: 'Paused: register mismatch', icon: CirclePause, tone: 'attention' },
  approved: { label: 'Approved', icon: CircleCheck, tone: 'complete' },
  submission_started: { label: 'Submission started', icon: Send, tone: 'progress' },
  submitted: { label: 'Submitted to Companies House', icon: Send, tone: 'complete' },
  confirmed: { label: 'Confirmed by Companies House', icon: CircleCheck, tone: 'complete' },
  declined: { label: 'Declined', icon: CircleX, tone: 'negative' },
  abandoned: { label: 'Abandoned', icon: CircleX, tone: 'neutral' },
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-mist text-graphite border-line',
  progress: 'bg-white text-ink border-line',
  complete: 'bg-approve-wash text-approve border-approve/25',
  attention: 'bg-info-wash text-info border-info/25',
  negative: 'bg-decline-wash text-decline border-decline/25',
}

function Chip({ spec, className }: { spec: ChipSpec; className?: string }) {
  const Icon = spec.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium whitespace-nowrap',
        toneClasses[spec.tone],
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {spec.label}
    </span>
  )
}

export function PersonStatusChip({ status, className }: { status: PersonStatus; className?: string }) {
  return <Chip spec={personSpecs[status]} className={className} />
}

export function CaseStatusChip({ status, className }: { status: CaseStatus; className?: string }) {
  return <Chip spec={caseSpecs[status]} className={className} />
}

/* The six rule outcomes. Colour, icon and label together, never colour alone. */
const outcomeSpecs: Record<RuleOutcome, ChipSpec> = {
  pass: { label: 'Pass', icon: CircleCheck, tone: 'complete' },
  flag: { label: 'Flag', icon: Flag, tone: 'neutral' },
  mandatory: { label: 'Mandatory decision', icon: ClipboardCheck, tone: 'attention' },
  request: { label: 'Request', icon: MessageSquareMore, tone: 'attention' },
  halt: { label: 'Halt', icon: CirclePause, tone: 'attention' },
  block: { label: 'Block', icon: Ban, tone: 'negative' },
}

export const outcomeLabel = (o: RuleOutcome) => outcomeSpecs[o].label

export function OutcomeChip({ outcome, className }: { outcome: RuleOutcome; className?: string }) {
  return <Chip spec={outcomeSpecs[outcome]} className={cn('px-2 py-0.5 text-[0.8125rem] [&_svg]:size-3.5', className)} />
}

export function RuleIdTag({ id, className }: { id: string; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-md border border-line bg-mist px-1.5 py-0.5 font-mono text-[0.8125rem] whitespace-nowrap text-ink', className)}>{id}</span>
}
