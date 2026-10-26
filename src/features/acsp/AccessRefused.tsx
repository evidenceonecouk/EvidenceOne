import {
  Archive,
  FileLock2,
  FilePen,
  FolderLock,
  Lock,
  Send,
  Waypoints,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { StateScreen } from '@/components/app/StateScreen'
import { Button } from '@/components/ui/button'
import { formatDateTime, shortHash } from '@/lib/format'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'
import { recordAccessRefused } from '@/store/guards'

/* What was refused, so each refusal reads as its own screen. */
const variants: Record<
  string,
  {
    icon: LucideIcon
    kicker: string
    title: string
    lead: string
    back: { to: string; label: string }
  }
> = {
  'the case review': {
    icon: FolderLock,
    kicker: 'Case review',
    title: 'This case is held by another ACSP',
    lead: 'Only the ACSP that holds a case can review it, message the person or decide.',
    back: { to: '/acsp/queue', label: 'Back to your review queue' },
  },
  'the verification record': {
    icon: Archive,
    kicker: 'Verification record',
    title: 'This record belongs to another ACSP',
    lead: 'Each ACSP controls its own verification records for seven years. Records are never shared between ACSPs, and neither are their exports.',
    back: { to: '/records', label: 'Back to your records' },
  },
  'the submission workspace': {
    icon: Send,
    kicker: 'Submission workspace',
    title: 'You cannot submit for another ACSP’s case',
    lead: 'Only the ACSP that approved a verification makes the statement to Companies House.',
    back: { to: '/acsp/queue', label: 'Back to your review queue' },
  },
  'the Companies House handoff': {
    icon: Send,
    kicker: 'Companies House handoff',
    title: 'You cannot submit for another ACSP’s case',
    lead: 'Only the ACSP that approved a verification makes the statement to Companies House.',
    back: { to: '/acsp/queue', label: 'Back to your review queue' },
  },
  'the correction workspace': {
    icon: FilePen,
    kicker: 'Correct submitted details',
    title: 'You cannot correct another ACSP’s verification',
    lead: 'Only the ACSP that submitted a verification can correct it.',
    back: { to: '/acsp/queue', label: 'Back to your review queue' },
  },
  'the filing handoff': {
    icon: Waypoints,
    kicker: 'Route B · Filings',
    title: 'This filing belongs to another ACSP',
    lead: 'Only the instructing ACSP files a register correction from its own WebFiling account.',
    back: { to: '/acsp/filings', label: 'Back to your filings' },
  },
}

const fallback = {
  icon: FileLock2,
  kicker: 'Access refused',
  title: 'This case is held by another ACSP',
  lead: '',
  back: { to: '/acsp/queue', label: 'Back to your review queue' },
}

/*
  Record separation (Gate 2 acceptance scenario 5). Opening another ACSP's case
  by link shows no case data, no names and no documents, and offers no action.
  The refusal is written to the requesting ACSP's own audit chain. The event
  holds a case reference only.
*/
export function AccessRefused({
  caseId,
  area,
}: {
  caseId: string
  /** What was asked for, for the audit entry, for example "the case review". */
  area: string
}) {
  const { data, apply } = useDemoStore()
  const { acsp } = useActingAcsp()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    apply((d) => recordAccessRefused(d, acsp.id, caseId, area))
  }, [apply, acsp.id, caseId, area])

  // The event just written to this ACSP's own chain, shown as evidence of the refusal.
  const event = [...data.audit]
    .reverse()
    .find(
      (e) =>
        e.acspId === acsp.id &&
        e.action === 'access.refused' &&
        e.detail.includes(caseId),
    )

  const v = variants[area] ?? fallback
  return (
    <StateScreen
      icon={v.icon}
      kicker={`${v.kicker} · Access refused`}
      title={v.title}
      description={
        <>
          {v.lead} You can only open what {acsp.name} holds. Nothing from it is
          shown and no action is available.
        </>
      }
      detailsTitle="Recorded in your audit trail"
      details={[
        { label: 'Case reference', value: caseId, mono: true },
        { label: 'Held by', value: 'Another ACSP, not named' },
        {
          label: 'Audit event',
          value: event
            ? `#${event.seq} · access.refused · ${shortHash(event.hash)}`
            : 'Recording…',
          mono: true,
        },
        {
          label: 'Recorded',
          value: event ? formatDateTime(event.at) : 'Now',
        },
      ]}
      note={
        <>
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            The event holds the case reference only. The holder&rsquo;s chain is
            not touched.
          </span>
        </>
      }
      actions={
        <Button asChild>
          <Link to={v.back.to}>{v.back.label}</Link>
        </Button>
      }
    />
  )
}
