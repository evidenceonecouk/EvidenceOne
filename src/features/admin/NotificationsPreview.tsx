import { useMemo } from 'react'
import { Link } from 'react-router'
import { buildMessages } from '@/data/adminPages'
import { timeAgo } from '@/lib/format'
import { useDemoStore } from '@/store/DemoStore'

/** The message log, fixed to when the demo was seeded so it reads the same through a session. */
export function useMessages() {
  const { state } = useDemoStore()
  return useMemo(() => buildMessages(new Date(state.seededAt).getTime() + 2 * 3_600_000), [state.seededAt])
}

/** Sidebar preview: the latest message and a link to the full log. */
export function NotificationsPreview({ onNavigate }: { onNavigate?: () => void }) {
  const messages = useMessages()
  const latest = messages.slice(0, 2)
  const bounced = messages.filter((m) => m.state === 'bounced').length
  return (
    <section aria-labelledby="sidebar-notifications" className="rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between px-3.5 pt-3 pb-1">
        <h2 id="sidebar-notifications" className="font-mono text-[0.75rem] tracking-[0.16em] text-slate uppercase">
          Notifications
        </h2>
        {bounced > 0 && <span className="rounded-full bg-decline-wash px-2 py-0.5 text-[0.8125rem] font-medium text-decline">{bounced} bounced</span>}
      </div>
      <ul className="divide-y divide-line/70">
        {latest.map((m) => (
          <li key={m.id} className="px-3.5 py-2.5">
            <p className="line-clamp-2 text-[0.875rem] leading-snug text-ink">{m.subject}</p>
            <p className="mt-0.5 text-[0.8125rem] text-slate">
              {m.audience} · {timeAgo(m.at)}
            </p>
          </li>
        ))}
      </ul>
      <Link
        to="/admin/notifications"
        onClick={onNavigate}
        className="block rounded-b-2xl border-t border-line/70 px-3.5 py-2.5 text-[0.875rem] font-medium text-ink transition-colors hover:bg-mist focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none"
      >
        View all notifications
      </Link>
    </section>
  )
}
