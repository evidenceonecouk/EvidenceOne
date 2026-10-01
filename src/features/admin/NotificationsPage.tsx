import { useState } from 'react'
import { Mail, MessageSquareText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { messageTemplates, type PlatformMessage } from '@/data/adminPages'
import { formatDateTime, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Meter } from './charts'
import { useMessages } from './NotificationsPreview'
import { AdminHeader, Figure, messageStateIcon, messageStateLabel, messageStateTone, StateBadge } from './kit'

type AudienceFilter = 'all' | PlatformMessage['audience']
const audiences: AudienceFilter[] = ['all', 'Individual', 'Agent', 'ACSP reviewer', 'Administrator']

export function NotificationsPage() {
  const messages = useMessages()
  const [audience, setAudience] = useState<AudienceFilter>('all')
  const shown = messages.filter((m) => audience === 'all' || m.audience === audience)
  const delivered = messages.filter((m) => m.state !== 'bounced').length
  const maxSent = Math.max(...messageTemplates.map((t) => t.sent))

  return (
    <Page>
      <AdminHeader title="Notifications" description="Every email and text message the platform has sent, and what happened to it." />

      <Panel aria-label="Message summary" className="mb-6 overflow-hidden">
        <dl className="grid divide-line/70 sm:grid-cols-2 sm:divide-x xl:grid-cols-4">
          <Figure label="Sent this month" value="908" detail="Email and SMS" />
          <Figure label="Delivered" value={`${((delivered / messages.length) * 100).toFixed(1)}%`} detail="Across the last 48 hours" />
          <Figure label="Opened" value="71%" detail="Emails opened within a day" />
          <Figure label="Bounced" value={messages.filter((m) => m.state === 'bounced').length} detail="Agent told to check the address" />
        </dl>
      </Panel>

      <div className="grid items-start gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Panel aria-labelledby="log-title" className="overflow-hidden">
          <PanelHeader id="log-title" title="Message log" description={`${shown.length} messages, newest first`} />
          <div className="flex flex-wrap gap-2 border-b border-line/70 px-5 py-4 sm:px-6" role="radiogroup" aria-label="Audience">
            {audiences.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={audience === a}
                onClick={() => setAudience(a)}
                className={cn(
                  'min-h-10 cursor-pointer rounded-full border px-4 text-[0.9375rem] transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none',
                  audience === a ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-graphite hover:border-silver',
                )}
              >
                {a === 'all' ? 'Everyone' : a}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-line/70">
            {shown.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-4 px-5 py-4 sm:flex-nowrap sm:px-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-mist text-ink">
                  {m.channel === 'sms' ? <MessageSquareText className="size-5" aria-label="Text message" /> : <Mail className="size-5" aria-label="Email" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base text-ink">{m.subject}</p>
                  <p className="mt-0.5 truncate text-[0.875rem] text-slate">
                    {m.recipient} · {m.audience}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.8125rem] text-slate">
                    <span className="rounded bg-mist px-1.5 py-0.5 text-graphite">{m.template}</span>
                    {m.caseId && (
                      <Link to={`/records/${m.caseId}`} className="underline-offset-2 hover:text-ink hover:underline">
                        {m.caseId}
                      </Link>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StateBadge tone={messageStateTone[m.state]} icon={messageStateIcon[m.state]}>
                    {messageStateLabel[m.state]}
                  </StateBadge>
                  <time dateTime={m.at} title={formatDateTime(m.at)} className="text-[0.8125rem] text-slate">
                    {timeAgo(m.at)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 border-t border-line/70 bg-mist/40 px-5 py-3.5 text-[0.9375rem] text-graphite sm:px-6">
            <ShieldCheck className="size-4 shrink-0 text-slate" aria-hidden="true" />
            Messages carry status and links only. Never identity evidence, a document image or the personal code.
          </p>
        </Panel>

        <Panel aria-labelledby="tpl-title" className="overflow-hidden xl:sticky xl:top-20">
          <PanelHeader id="tpl-title" title="Templates" description="Sent this month" actions={<MonoLabel>{messageTemplates.length} active</MonoLabel>} />
          <ul className="space-y-4 p-5 sm:p-6">
            {messageTemplates.map((t, i) => (
              <li key={t.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] text-ink">{t.label}</span>
                    <span className="block text-[0.8125rem] text-slate">{t.audience}</span>
                  </span>
                  <span className="text-[0.9375rem] font-medium text-ink tabular">{t.sent}</span>
                </div>
                <Meter value={t.sent} max={maxSent} delay={i * 60} className="h-2" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Page>
  )
}
