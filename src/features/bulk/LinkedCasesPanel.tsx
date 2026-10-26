import { Layers } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/app/Page'
import { formatDateTime } from '@/lib/format'
import { bulkRequestForCase } from '@/store/bulkActions'
import { useDemoStore } from '@/store/DemoStore'
import { LinkedCaseList } from './BulkParts'

/**
  G2-19. Read-only structure linking a case to its Bulk Request, the other
  individual cases and a greyed corporate case. Corporate verification is a
  later module: no corporate evidence is collected or hard-coded here.
*/
export function LinkedCasesPanel({ caseId }: { caseId: string }) {
  const { data } = useDemoStore()
  const b = bulkRequestForCase(data, caseId)
  if (!b) return null
  const partner = data.partners.find((p) => p.id === b.partnerId)
  return (
    <Panel aria-labelledby="linked-cases-title" className="overflow-hidden">
      <PanelHeader
        id="linked-cases-title"
        title={
          <span className="flex items-center gap-2">
            <Layers className="size-5" aria-hidden="true" />
            Linked cases
          </span>
        }
        description={`Bulk Request ${b.id} from ${partner?.name ?? 'a Referral Partner'}, converted ${b.convertedAt ? formatDateTime(b.convertedAt) : ''} by ${b.convertedBy ?? 'a Platform Administrator'}. Read only.`}
      />
      <div className="p-5 sm:p-6">
        <LinkedCaseList
          data={data}
          b={b}
          currentCaseId={caseId}
          linkTo={(id) => `/acsp/cases/${id}`}
        />
      </div>
    </Panel>
  )
}
