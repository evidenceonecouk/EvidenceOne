import {
  ArrowUpRight,
  CircleCheck,
  CircleX,
  Eye,
  FilePen,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { Page, PageHeader, Panel } from '@/components/app/Page'
import { Button } from '@/components/ui/button'
import { formatDateTime, shortHash } from '@/lib/format'
import { Avatar } from '@/components/visual/Avatar'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import { getCompany, getPerson, reviewerOrgName } from '@/store/selectors'
import type { Invite } from '@/types/domain'

const inviteStatus: Record<
  Invite['status'],
  { label: string; icon: LucideIcon; tone: string }
> = {
  sent: {
    label: 'Sent',
    icon: Send,
    tone: 'bg-mist text-graphite border-line',
  },
  opened: {
    label: 'Opened',
    icon: Eye,
    tone: 'bg-paper text-ink border-silver',
  },
  accepted: {
    label: 'Accepted',
    icon: CircleCheck,
    tone: 'bg-approve-wash text-approve border-approve/25',
  },
  amendment_requested: {
    label: 'Amendment requested',
    icon: FilePen,
    tone: 'bg-info-wash text-info border-info/25',
  },
  expired: {
    label: 'Expired',
    icon: CircleX,
    tone: 'bg-decline-wash text-decline border-decline/25',
  },
}

export function InviteLog() {
  const { data, state, setPersona } = useDemoStore()
  const [params] = useSearchParams()
  const fresh = Number(params.get('new') ?? 0)
  const invites = data.invites
    .filter((i) => i.agentId === state.agentId)
    .sort(
      (a, b) => b.sentAt.localeCompare(a.sentAt) || b.id.localeCompare(a.id),
    )

  return (
    <Page>
      <PageHeader
        kicker="Agent portal"
        title="Invites"
        description="Every invite you have sent, with its single-use payment code, who reviews it and its entry in the audit trail. You see status only, never documents or evidence."
        actions={
          <Button asChild variant="outline">
            <Link to="/agent">Back to companies</Link>
          </Button>
        }
      />
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left">
            <caption className="sr-only">Invites sent</caption>
            <thead className="text-[0.9375rem] text-slate">
              <tr>
                {[
                  'Invite',
                  'Person and company',
                  'Sent',
                  'Payment',
                  'Decision by',
                  'Status',
                  'Audit',
                ].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn(
                      'py-3.5 pr-4 font-normal',
                      i === 0 && 'pl-5 sm:pl-6',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invites.map((inv, idx) => {
                const person = getPerson(data, inv.personId)
                const company = getCompany(data, inv.companyNumber)
                const vc = data.cases.find((c) => c.id === inv.caseId)
                const event = data.audit.find(
                  (e) => e.caseId === inv.caseId && e.action === 'invite.sent',
                )
                const s = inviteStatus[inv.status]
                const isNew = idx < fresh
                return (
                  <tr
                    key={inv.id}
                    className={cn(
                      'border-t border-line/70 align-top',
                      isNew && 'bg-mist',
                    )}
                  >
                    <td className="py-4 pr-4 pl-5 sm:pl-6">
                      <p className="font-mono text-[0.9375rem] text-ink tabular">
                        {inv.id}
                      </p>
                      {isNew && (
                        <p className="mt-1 text-sm font-medium text-ink">
                          Just sent
                        </p>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          seed={inv.personId}
                          name={
                            person
                              ? `${person.givenNames} ${person.familyName}`
                              : ''
                          }
                          size={36}
                        />
                        <div>
                          <p className="text-base font-medium text-ink">
                            {person &&
                              `${person.givenNames} ${person.familyName}`}
                          </p>
                          <p className="text-[0.9375rem] text-slate">
                            {company?.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-graphite tabular">
                      {formatDateTime(inv.sentAt)}
                    </td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-graphite">
                      {inv.paymentCode ? (
                        <>
                          Agent Payment Code
                          <span className="block font-mono text-slate">
                            {inv.paymentCode}
                          </span>
                          <span className="block text-[0.875rem] text-slate">
                            Single use, this invite only ·{' '}
                            {inv.paymentCodeUsedAt ? 'Used' : 'Not used yet'}
                          </span>
                        </>
                      ) : (
                        'Individual pays by card'
                      )}
                    </td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-graphite">
                      {vc && reviewerOrgName(data, vc.acspId)}
                      <span className="block text-slate">
                        {inv.review === 'in_house'
                          ? 'In-house review'
                          : 'Referred'}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium whitespace-nowrap',
                          s.tone,
                        )}
                      >
                        <s.icon className="size-4" aria-hidden="true" />
                        {s.label}
                      </span>
                      {vc && ['sent', 'opened'].includes(inv.status) && (
                        <Link
                          to={`/app/${vc.id}/invite`}
                          onClick={() => setPersona('individual')}
                          className="mt-2 flex items-center gap-1 text-[0.9375rem] text-ink underline-offset-4 hover:underline"
                        >
                          Open as the individual
                          <ArrowUpRight className="size-4" aria-hidden="true" />
                        </Link>
                      )}
                    </td>
                    <td className="py-4 pr-6 font-mono text-[0.875rem] text-slate">
                      {event ? (
                        <>
                          #{event.seq}
                          <span className="block text-ink">
                            {shortHash(event.hash)}
                          </span>
                        </>
                      ) : (
                        'Not recorded'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </Page>
  )
}
