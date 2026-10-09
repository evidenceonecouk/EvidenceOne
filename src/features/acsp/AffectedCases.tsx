import { Lock, UsersRound } from 'lucide-react'
import { useId, useState } from 'react'
import { Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { AcspStatusChip, RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { formatShortDate, fullName } from '@/lib/format'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'
import { Note, Table, Td, Th } from './BillingParts'

const LAPSED = ['suspended', 'ceased', 'withdrawn']

const RESPONSE = {
  pending: 'Waiting for the individual',
  agreed: 'Individual agreed',
  declined: 'Individual declined',
} as const

/**
  ACSP-12: the cases a lapsed ACSP verified, and ACSP-13: its open cases offered
  to another ACSP with the individual's agreement. Shown to that ACSP and to a
  Platform Administrator only. Never to a Referral Partner (M3, pending).
*/
export function AffectedCases() {
  const { data, state } = useDemoStore()
  const { acsp: acting } = useActingAcsp()
  const selectId = useId()
  const admin = state.persona === 'platformAdmin'
  const lapsedAcsps = data.acsps.filter((a) => LAPSED.includes(a.status))
  const [picked, setPicked] = useState<string>()

  if (!admin && state.persona !== 'reviewer')
    return (
      <Page width="narrow">
        <PageHeader title="Cases verified by a lapsed ACSP" />
        <Note title="Not available for this role">
          This list is shown to the ACSP concerned and to a Platform
          Administrator only.
        </Note>
      </Page>
    )

  const acsp = admin
    ? (lapsedAcsps.find((a) => a.id === picked) ?? lapsedAcsps[0])
    : acting
  const lapsed = !!acsp && LAPSED.includes(acsp.status)
  const verified = acsp
    ? data.cases.filter((c) => c.acspId === acsp.id && c.status === 'confirmed')
    : []
  const offered = acsp
    ? data.cases.filter((c) => c.reallocation?.fromAcspId === acsp.id)
    : []
  const name = (id: string) => data.acsps.find((a) => a.id === id)?.name ?? id

  return (
    <Page>
      <PageHeader
        kicker="ACSP-12 follow-up"
        title="Cases verified by this ACSP"
        description="When an ACSP is suspended, ceased or withdrawn, the directors and people with significant control it verified may need to verify again."
        actions={
          admin && lapsedAcsps.length > 1 ? (
            <div className="flex items-center gap-3">
              <label htmlFor={selectId} className="text-base text-ink">
                ACSP
              </label>
              <select
                id={selectId}
                value={acsp?.id}
                onChange={(e) => setPicked(e.target.value)}
                className="h-11 rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
              >
                {lapsedAcsps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          ) : undefined
        }
      />

      {!acsp || !lapsed ? (
        <Panel className="p-8 text-center">
          <UsersRound
            className="mx-auto size-8 text-slate"
            aria-hidden="true"
          />
          <p className="mt-3 text-lg font-medium text-ink">
            Nothing to follow up
          </p>
          <p className="mt-1 text-base text-slate">
            {acsp?.name ?? 'No ACSP'} is not suspended, ceased or withdrawn, so
            there are no affected cases.
          </p>
        </Panel>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-base text-graphite">
            <span className="font-medium text-ink">{acsp.name}</span>
            <AcspStatusChip status={acsp.status} />
            <RuleIdTag id="ACSP-12" />
            {acsp.statusNote && (
              <span className="text-slate">{acsp.statusNote}</span>
            )}
          </div>

          <Panel className="overflow-hidden">
            <PanelHeader
              title={`Verified by ${acsp.name}`}
              description="Directors verified by this ACSP may need to verify again."
              actions={
                <Button
                  variant="outline"
                  disabled
                  aria-describedby="contact-note"
                >
                  <Lock aria-hidden="true" />
                  Contact individuals
                </Button>
              }
            />
            <p
              id="contact-note"
              className="border-b border-line/80 px-5 py-3 text-base text-slate sm:px-6"
            >
              Individuals are contacted only on the client&rsquo;s instruction.
            </p>
            {verified.length === 0 ? (
              <p className="px-6 py-8 text-center text-base text-slate">
                No confirmed cases.
              </p>
            ) : (
              <Table caption="Cases verified by the lapsed ACSP" min="44rem">
                <thead>
                  <tr>
                    <Th>Case</Th>
                    <Th>Person</Th>
                    <Th>Company</Th>
                    <Th>Verification reference</Th>
                    <Th>Confirmed</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {verified.map((c) => {
                    const p = data.people.find((x) => x.id === c.personId)
                    const co = data.companies.find(
                      (x) => x.number === c.companyNumber,
                    )
                    return (
                      <tr key={c.id}>
                        <Td>
                          <span className="font-mono text-[0.9375rem]">
                            {c.id}
                          </span>
                        </Td>
                        <Td strong>{p ? fullName(p) : c.personId}</Td>
                        <Td muted>{co?.name ?? c.companyNumber}</Td>
                        <Td muted>
                          <span className="font-mono text-[0.9375rem]">
                            {c.submission?.verificationReference ??
                              'Not recorded'}
                          </span>
                        </Td>
                        <Td muted>
                          {c.submission?.confirmedAt
                            ? formatShortDate(c.submission.confirmedAt)
                            : ''}
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Open cases offered to another ACSP"
              description="Only with the individual's agreement."
              actions={<RuleIdTag id="ACSP-13" />}
            />
            {offered.length === 0 ? (
              <p className="px-6 py-8 text-center text-base text-slate">
                No open cases have been offered to another ACSP.
              </p>
            ) : (
              <Table caption="Open cases offered to another ACSP" min="44rem">
                <thead>
                  <tr>
                    <Th>Case</Th>
                    <Th>Person</Th>
                    <Th>Offered to</Th>
                    <Th>Offered</Th>
                    <Th>Individual&rsquo;s response</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {offered.map((c) => {
                    const p = data.people.find((x) => x.id === c.personId)
                    const r = c.reallocation!
                    return (
                      <tr key={c.id}>
                        <Td>
                          <span className="font-mono text-[0.9375rem]">
                            {c.id}
                          </span>
                        </Td>
                        <Td strong>{p ? fullName(p) : c.personId}</Td>
                        <Td>{name(r.offeredAcspId)}</Td>
                        <Td muted>{formatShortDate(r.offeredAt)}</Td>
                        <Td>{RESPONSE[r.individualResponse]}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Panel>

          <Note title="Who sees this list">
            This list is shown to {acsp.name} and to a Platform Administrator
            only. Referral Partners do not see it.
          </Note>
        </div>
      )}
    </Page>
  )
}
