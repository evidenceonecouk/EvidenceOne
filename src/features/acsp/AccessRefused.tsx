import { Lock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'
import { recordAccessRefused } from '@/store/guards'

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
  const { apply } = useDemoStore()
  const { acsp } = useActingAcsp()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    done.current = true
    apply((d) => recordAccessRefused(d, acsp.id, caseId, area))
  }, [apply, acsp.id, caseId, area])
  return (
    <Page width="narrow">
      <h1 className="flex items-center gap-3 text-2xl font-medium text-ink">
        <Lock className="size-6 shrink-0" aria-hidden="true" />
        This case is held by another ACSP
      </h1>
      <p className="mt-3 text-base text-graphite">
        Each ACSP&rsquo;s verification records are kept separate. You can only
        open cases held by {acsp.name}. Nothing from this case is shown, and
        this attempt is recorded in your audit trail.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/acsp/queue">Back to your review queue</Link>
      </Button>
    </Page>
  )
}
