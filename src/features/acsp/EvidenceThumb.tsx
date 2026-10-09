import { Avatar } from '@/components/visual/Avatar'
import {
  CardFront,
  PassportDataPage,
} from '@/components/visual/IdDocumentMockup'
import { Portrait } from '@/components/visual/Portrait'
import { portraitFor } from '@/data/portraits'
import { documentFacts } from '@/lib/idDocument'
import type { EvidenceItem, IdDocumentType, Person } from '@/types/domain'

/**
  A statement after the individual redacted it (option O3). Amounts and payees
  are masked; the issue date, name, address and transaction dates stay visible.
  The reviewer only ever sees this redacted copy.
*/
function RedactedStatement() {
  const rows = [3, 5, 4, 6]
  return (
    <div
      role="img"
      aria-label="Redacted bank statement: amounts and payees are masked, dates, name and address are visible"
      className="flex h-24 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#e9ebed,#f6f7f8)]"
    >
      <div className="w-[7.5rem] space-y-1 rounded-md bg-white p-2 shadow-sm">
        <span className="block h-1 w-14 rounded bg-slate/60" />
        <span className="block h-1 w-20 rounded bg-line" />
        {rows.map((w, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="h-1 w-4 rounded bg-slate/50" />
            <span
              className="h-1.5 rounded-sm bg-ink"
              style={{ width: `${w * 4}px` }}
            />
            <span className="ml-auto h-1.5 w-4 rounded-sm bg-ink" />
          </span>
        ))}
      </div>
    </div>
  )
}

/** A small preview of one piece of evidence. Synthetic placeholders only. */
export function EvidenceThumb({
  item,
  name,
  person,
  docType,
}: {
  item: EvidenceItem
  name: string
  person?: Person
  docType?: IdDocumentType
}) {
  if (item.redaction) return <RedactedStatement />
  // The same specimen document and illustrated face the person saw in their journey
  if (person && item.kind === 'identity_document') {
    const facts = documentFacts(
      person,
      docType ?? person.document?.type ?? 'passport',
    )
    const look = portraitFor(person)
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-ink">
        <div className="w-[8.25rem] overflow-hidden rounded-md shadow-[0_8px_20px_-10px_rgb(0_0_0/0.8)]">
          {facts.type === 'passport' ? (
            <PassportDataPage facts={facts} look={look} />
          ) : (
            <CardFront facts={facts} look={look} />
          )}
        </div>
      </div>
    )
  }
  if (person && item.kind === 'selfie')
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#2a2c30,#17181a)]">
        <Portrait
          look={portraitFor(person)}
          background="#3a3d42"
          className="h-20 rounded-[50%]"
        />
      </div>
    )
  if (item.kind === 'identity_document' || item.kind === 'option2_document')
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-ink">
        <div className="flex h-16 w-12 flex-col justify-between rounded-md border border-white/15 bg-white/[0.06] p-1.5">
          <span className="h-0.5 w-5 rounded bg-white/30" />
          <span className="mx-auto grid size-4 grid-cols-2 gap-px rounded-[3px] border border-highlight/70 p-[2px]">
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
            <i className="bg-highlight/80" />
          </span>
          <span className="h-0.5 w-7 rounded bg-white/25" />
        </div>
      </div>
    )
  if (item.kind === 'selfie')
    return (
      <div className="flex h-24 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#e4e6e8,#f4f5f6)]">
        <Avatar seed={name} name={name} size={56} />
      </div>
    )
  return (
    <div className="flex h-24 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#e9ebed,#f6f7f8)]">
      <div className="h-16 w-12 space-y-1.5 rounded-md bg-white p-2 shadow-sm">
        <span className="block h-1.5 w-6 rounded bg-slate/50" />
        <span className="block h-1 w-full rounded bg-line" />
        <span className="block h-1 w-8 rounded bg-line" />
        <span className="block h-1 w-full rounded bg-line" />
      </div>
    </div>
  )
}
