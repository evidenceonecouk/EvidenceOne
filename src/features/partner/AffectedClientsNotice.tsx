import { TriangleAlert, Users } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/app/Page'
import { PartnerStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { useDemoStore } from '@/store/DemoStore'
import { affectedClientsForPartner } from '@/store/partnerSelectors'
import { getCompany } from '@/store/selectors'

const lapsedLabel = {
  suspended: 'Suspended',
  ceased: 'Ceased',
  withdrawn: 'Withdrawn',
} as const

const offerLabel = {
  pending: 'waiting for the individual to agree',
  agreed: 'the individual agreed',
  declined: 'the individual declined',
} as const

/**
  M3, decided 19 October. When an ACSP lapses, the Referral Partner is notified
  of its own clients who are affected and sees only those: name, status, which
  ACSP lapsed and any offer to move to another ACSP. Never documents. The full
  list of cases the lapsed ACSP verified (ACSP-12) is for an administrator and
  that ACSP only.
*/
export function AffectedClientsNotice({ partnerId }: { partnerId: string }) {
  const { data } = useDemoStore()
  const rows = affectedClientsForPartner(data, partnerId)
  if (!rows.length) return null
  const acspNames = [...new Set(rows.map((r) => r.lapsedAcspName))]

  return (
    <Panel aria-labelledby="affected-title" className="mb-8 overflow-hidden">
      <PanelHeader
        id="affected-title"
        title={
          <span className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-ink" aria-hidden="true" />
            {rows.length} of your clients {rows.length === 1 ? 'is' : 'are'}{' '}
            affected by a lapsed ACSP
          </span>
        }
        description={`${acspNames.join(' and ')} no longer appears as an active ACSP on the Companies House published list. You see only your own clients here, with their status. You never see their documents.`}
      />
      <ul className="divide-y divide-line/70">
        {rows.map((r) => (
          <li
            key={r.caseId}
            className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 px-5 py-4 sm:px-6"
          >
            <div className="min-w-0">
              <p className="text-base font-medium text-ink">{r.name}</p>
              <p className="text-[0.9375rem] text-slate">
                {getCompany(data, r.companyNumber)?.name ?? r.companyNumber} ·{' '}
                <span className="font-mono text-[0.875rem]">{r.caseId}</span>
              </p>
              <p className="mt-1 text-[0.9375rem] text-graphite">
                {r.lapsedAcspName}: {lapsedLabel[r.lapsedStatus]}.{' '}
                {r.kind === 'verified'
                  ? 'Verified by this ACSP. They may need to verify again.'
                  : r.offer
                    ? `Offered to ${r.offer.acspName}, ${offerLabel[r.offer.response]}. The case moves only with their agreement.`
                    : 'Open case. It will be offered to another ACSP, with their agreement.'}
              </p>
            </div>
            {r.status && <PartnerStatusChip status={r.status} />}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/70 bg-mist/40 px-5 py-3.5 sm:px-6">
        <Button variant="outline" size="sm" disabled>
          <Users className="size-4" aria-hidden="true" />
          Contact individuals
        </Button>
        <p className="text-[0.875rem] text-slate">
          Individuals are contacted only on the client&rsquo;s instruction.
        </p>
      </div>
    </Panel>
  )
}
