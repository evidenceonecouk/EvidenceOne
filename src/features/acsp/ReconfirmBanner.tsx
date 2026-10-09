import { ArrowRight, CalendarClock, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { reconfirmStatus } from '@/lib/reconfirm'
import { useActingAcsp } from '@/store/DemoStore'

/**
  Shown at the top of the review queue when the acting ACSP's reconfirmation is
  due within 30 days or overdue. Each ACSP reconfirms its regulatory
  information every 12 months (proposed). An overdue reconfirmation pauses new
  allocation (ACSP-11).
*/
export function ReconfirmBanner() {
  const { acsp } = useActingAcsp()
  const s = reconfirmStatus(acsp.monitoring)
  if (!s.needsAction) return null
  const due = formatDate(acsp.monitoring.nextReconfirmationDue)
  const Icon = s.overdue ? TriangleAlert : CalendarClock
  return (
    <section
      aria-label="Reconfirm your details"
      className="mb-6 flex flex-col gap-4 rounded-2xl border border-info/30 bg-info-wash px-5 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6"
    >
      <Icon className="size-6 shrink-0 text-info" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-medium text-ink">
          {s.overdue
            ? 'Reconfirmation is overdue'
            : `Reconfirmation is due in ${s.days} day${s.days === 1 ? '' : 's'}`}
        </p>
        <p className="mt-0.5 text-base leading-relaxed text-graphite">
          {s.overdue
            ? `It was due on ${due}. New cases are not allocated to ${acsp.name} until you reconfirm (ACSP-11). Cases already open are not affected.`
            : `Please confirm your ACSP reference and AML supervisor are still current by ${due}. Every ACSP reconfirms its regulatory information each year (12 months, proposed).`}
        </p>
      </div>
      <Button asChild className="shrink-0">
        <Link to="/acsp/reconfirm">
          Reconfirm your details
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </section>
  )
}
