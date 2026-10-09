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
import { PartnerStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { partnerStatusForCase } from '@/store/partnerSelectors'
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
    .filter((i) => i.partnerId === state.partnerId)
    .sort(
      (a, b) => b.sentAt.localeCompare(a.sentAt) || b.id.localeCompare(a.id),
    )

  return (
    <Page>
      <PageHeader
        kicker="Referral Partner portal"
        title="Invites"
        description="Every invite you have sent, with its single-use payment code, the instructing ACSP and its entry in the audit trail. You see status only, never documents or evidence."
        actions={
          <Button asChild variant="outline">
            <Link to="/partner">Back to companies</Link>
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
                  'Who pays',
                  'Instructing ACSP',
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
                const partnerStatus = partnerStatusForCase(vc)
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
                          Referral Partner pays
                          <br />
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
                        'The client pays the ACSP'
                      )}
                    </td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-graphite">
                      {inv.instructingAcspId === 'platform_suggest'
                        ? 'Suggested by Evidence One'
                        : vc && reviewerOrgName(data, vc.acspId)}
                      <span className="block text-slate">
                        {inv.instructingAcspId === 'platform_suggest'
                          ? 'The person chooses from the ranked list'
                          : 'Named by you, the person instructs them'}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      {partnerStatus && (
                        <PartnerStatusChip status={partnerStatus} />
                      )}
                      <span
                        className={cn(
                          'mt-1.5 flex w-fit items-center gap-1.5 text-[0.875rem] text-slate',
                        )}
                      >
                        <s.icon className="size-4" aria-hidden="true" />
                        Invite {s.label.toLowerCase()}
                      </span>
                      {vc && ['sent', 'opened'].includes(inv.status) && (
                        <Link
                          to={`/journey/${vc.id}/invite`}
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
