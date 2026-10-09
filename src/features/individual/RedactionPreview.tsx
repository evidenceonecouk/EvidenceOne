import { Sparkles } from 'lucide-react'
import { ModelTag } from '@/components/visual/AiObservationCard'

export const REDACTION_LABEL =
  'AI observation. Advisory only. You confirm the redaction.'

const rows = [
  ['02 Sep', '£54.20'],
  ['05 Sep', '£12.99'],
  ['09 Sep', '£310.00'],
  ['14 Sep', '£27.45'],
]

const Mask = ({ w }: { w: string }) => (
  <span
    className={`inline-block h-4 rounded-sm bg-ink align-middle ${w}`}
    role="img"
    aria-label="Hidden"
  />
)

/**
  Option O3 preview of a synthetic bank statement. Transaction amounts and
  payees are masked. The issue date, name, address and transaction dates stay
  visible. Only this redacted copy is passed to the ACSP and kept.
*/
export function RedactionPreview({
  holder,
  address,
  issuedOn,
}: {
  holder: string
  address: string
  issuedOn: string
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] font-medium text-graphite">
        <Sparkles className="size-3.5" aria-hidden="true" />
        {REDACTION_LABEL}
        <ModelTag />
      </p>
      <div className="mt-3 rounded-xl border border-line bg-mist p-3 text-[0.9375rem] text-ink">
        <p className="font-medium">Sample statement, redacted preview</p>
        <p className="mt-1">Issue date: {issuedOn}</p>
        <p>Account holder: {holder}</p>
        <p>Address: {address}</p>
        <table className="mt-3 w-full text-start text-[0.9375rem]">
          <thead>
            <tr className="text-slate">
              <th className="py-1 text-start font-normal">Date</th>
              <th className="py-1 text-start font-normal">Payee</th>
              <th className="py-1 text-end font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([d]) => (
              <tr key={d} className="border-t border-line">
                <td className="py-1.5">{d}</td>
                <td className="py-1.5">
                  <Mask w="w-24" />
                </td>
                <td className="py-1.5 text-end">
                  <Mask w="w-12" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-slate">
        Hidden: transaction amounts and payees. Still visible: issue date, your
        name, your address and the transaction dates. The original is not
        stored.
      </p>
    </div>
  )
}
