import { Bell } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { buildMessages } from '@/data/adminPages'
import { timeAgo } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'

/** The message log, fixed to when the demo was seeded so it reads the same through a session. */
export function useMessages() {
  const { state } = useDemoStore()
  return useMemo(
    () => buildMessages(new Date(state.seededAt).getTime() + 2 * 3_600_000),
    [state.seededAt],
  )
}

/** Sidebar preview: one compact row linking to the full log, with the latest subject when there is room. */
export function NotificationsPreview({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const messages = useMessages()
  const latest = messages[0]
  const bounced = messages.filter((m) => m.state === 'bounced').length
  return (
    <Link
      to="/admin/notifications"
      onClick={onNavigate}
      aria-label={`Notifications${bounced ? `, ${bounced} bounced` : ''}. View all notifications`}
      className="group block rounded-2xl border border-line bg-white px-3 py-2.5 transition-colors duration-150 hover:border-silver focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Bell
          className="size-[1.125rem] shrink-0 text-slate group-hover:text-ink"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-ink">
          Notifications
        </span>
        {bounced > 0 && (
          <span className="shrink-0 rounded-full bg-decline-wash px-2 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap text-decline">
            {bounced} bounced
          </span>
        )}
      </span>
      {latest && (
        <span className="mt-1 block truncate pl-[1.75rem] text-[0.8125rem] text-slate short:hidden">
          {latest.subject} · {timeAgo(latest.at)}
        </span>
      )}
    </Link>
  )
}
