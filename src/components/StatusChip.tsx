import {
  CircleAlert,
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
import type { CaseStatus, PersonStatus } from '@/types/domain'

type Tone = 'neutral' | 'progress' | 'complete' | 'attention' | 'negative'

interface ChipSpec {
  label: string
  icon: LucideIcon
  tone: Tone
}

/* Never colour alone: every status has a label and an icon. */
const personSpecs: Record<PersonStatus, ChipSpec> = {
  verified: { label: 'Verified', icon: CircleCheck, tone: 'complete' },
  in_progress: { label: 'In progress', icon: CircleDot, tone: 'progress' },
  not_started: { label: 'Not started', icon: CircleDashed, tone: 'neutral' },
  expired: { label: 'Expired', icon: CircleX, tone: 'negative' },
  reverification_due: { label: 'Reverification due', icon: RefreshCw, tone: 'attention' },
}

const caseSpecs: Record<CaseStatus, ChipSpec> = {
  invited: { label: 'Invited', icon: Send, tone: 'neutral' },
  in_progress: { label: 'In progress', icon: CircleDot, tone: 'progress' },
  in_review: { label: 'Awaiting review', icon: Clock3, tone: 'progress' },
  info_requested: { label: 'Information requested', icon: CircleAlert, tone: 'attention' },
  halted_register_mismatch: { label: 'Paused: register mismatch', icon: CirclePause, tone: 'attention' },
  approved: { label: 'Approved', icon: CircleCheck, tone: 'complete' },
  submitted: { label: 'Submitted to Companies House', icon: CircleCheck, tone: 'complete' },
  declined: { label: 'Declined', icon: CircleX, tone: 'negative' },
  abandoned: { label: 'Abandoned', icon: CircleX, tone: 'neutral' },
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-mist text-graphite border-line',
  progress: 'bg-progress-wash text-progress border-progress/20',
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
