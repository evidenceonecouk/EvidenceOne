import { Building2, ChevronRight, Ticket } from 'lucide-react'
import { useParams } from 'react-router'
import { AttributionNote } from '@/components/AttributionNote'
import { LogoMark } from '@/components/brand/Logo'
import { PhoneFrame, PhoneScreen } from '@/components/phone/PhoneFrame'
import { Button } from '@/components/ui/button'
import { getAcsp, getCase, getCompany, getPerson } from '@/store/selectors'
import { useDemoStore } from '@/store/DemoStore'

const roleLabel = { director: 'Director', psc: 'Person with significant control', director_psc: 'Director and PSC' } as const

/* First screen of the app journey. The full journey arrives in a later build. */
export function IndividualPreview() {
  const { caseId = '' } = useParams()
  const { data } = useDemoStore()
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const company = vc && getCompany(data, vc.companyNumber)
  const entry = vc && data.register.find((r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber)
  const acsp = vc && getAcsp(data, vc.acspId)
  const invite = data.invites.find((i) => i.caseId === caseId)

  return (
    <div className="mx-auto max-w-[88rem] px-0 py-0 sm:px-6 sm:py-10">
      <PhoneFrame>
        <PhoneScreen
          footer={
            vc && (
              <Button className="w-full" size="lg">
                Get started
                <ChevronRight aria-hidden="true" />
              </Button>
            )
          }
        >
          <div className="flex items-center gap-2">
            <LogoMark className="size-7 p-1.5" />
            <span className="text-base font-semibold text-ink">Evidence One</span>
          </div>
          {person && company && entry ? (
            <>
              <h1 className="mt-6 text-[1.625rem] leading-tight font-normal tracking-[-0.03em] text-ink">
                Hello {person.givenNames.split(' ')[0]}, you have been invited to verify your identity
              </h1>
              <p className="mt-3 text-base leading-relaxed text-graphite">
                Companies House needs every director and PSC to verify their identity. It takes about five minutes.
              </p>
              <div className="mt-6 rounded-2xl border border-line bg-mist/70 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-slate">
                  <Building2 className="size-4" aria-hidden="true" />
                  From the Companies House register
                </p>
                <p className="mt-2 text-base font-medium text-ink">{company.name}</p>
                <p className="text-[0.9375rem] text-slate">
                  {company.number} · {roleLabel[entry.role]}
                </p>
              </div>
              {invite?.paymentCode && (
                <p className="mt-3 flex items-center gap-2 text-[0.9375rem] text-graphite">
                  <Ticket className="size-4" aria-hidden="true" />
                  Your fee has been paid with an Agent Payment Code.
                </p>
              )}
              <AttributionNote acspName={acsp?.name} className="mt-6 text-[0.9375rem]" />
            </>
          ) : (
            <p className="mt-8 text-base text-graphite">This invite link is not valid. Please ask your Agent for a new one.</p>
          )}
        </PhoneScreen>
      </PhoneFrame>
    </div>
  )
}
