import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { ArrowLeft, Check, Link2, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MonoLabel, Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { PersonStatusChip } from '@/components/StatusChip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { demoProfile, liveProfile, type CompanyProfile as Profile } from '@/lib/companiesHouse'
import { formatDate, formatShortDate } from '@/lib/format'
import { connectCompany } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { getAgent, personStatus } from '@/store/selectors'

export function CompanyProfile() {
  const { number = '' } = useParams()
  const { data, state, apply } = useDemoStore()
  const toast = useToast()
  const navigate = useNavigate()
  const demo = demoProfile(data, number)
  const [live, setLive] = useState<Profile | null | 'loading'>(demo ? null : 'loading')
  const [liveNotice, setLiveNotice] = useState(false)

  useEffect(() => {
    if (demo) return
    let cancelled = false
    liveProfile(number).then((p) => !cancelled && setLive(p))
    return () => {
      cancelled = true
    }
  }, [number, demo])

  const profile = demo ?? (live === 'loading' ? null : live)
  const company = data.companies.find((c) => c.number === number)
  const agent = getAgent(data, state.agentId)!
  const connectedHere = company?.lodgedByAgentId === agent.id
  const lodgedElsewhere = company?.lodgedByAgentId && !connectedHere

  if (live === 'loading') {
    return (
      <Page>
        <p className="flex items-center gap-2 text-lg text-slate" role="status">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          Loading the company from the Companies House register
        </p>
      </Page>
    )
  }

  if (!profile) {
    return (
      <Page>
        <PageHeader title="Company not available" description="We could not load this company from the register. The live register may be unavailable, or the number may be wrong." />
        <Button asChild variant="outline">
          <Link to="/agent/lookup">
            <ArrowLeft aria-hidden="true" />
            Back to search
          </Link>
        </Button>
      </Page>
    )
  }

  const connect = () => {
    if (profile.source === 'live') {
      setLiveNotice(true)
      return
    }
    apply((d) => connectCompany(d, number, agent.id, `${agent.contactName}, ${agent.name}`))
    toast({ title: 'Company connected', description: `${profile.name} is now on your dashboard. Logged in the audit trail.` })
  }

  const invitable = profile.people.filter((p) => p.personId && ['not_started', 'expired', 'reverification_due'].includes(personStatus(data, p.personId)))

  return (
    <Page>
      <Link to="/agent/lookup" className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Search the register
      </Link>
      <PageHeader
        kicker={profile.source === 'live' ? 'Live from Companies House' : 'Companies House register · fictional demo company'}
        title={
          <span className="flex items-center gap-4">
            <CompanyMark name={profile.name} size={56} />
            {profile.name}
          </span>
        }
        meta={
          <>
            <span className="font-mono text-ink tabular">{profile.number}</span>
            <span className="capitalize">{profile.status}</span>
            {profile.incorporatedOn && <span>Incorporated {formatDate(profile.incorporatedOn)}</span>}
          </>
        }
        actions={
          connectedHere ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-base text-graphite">
                <Check className="size-4" aria-hidden="true" />
                Connected {company?.connectedAt && formatShortDate(company.connectedAt)}
              </span>
              <Button
                disabled={!invitable.length}
                onClick={() => navigate(`/agent/companies/${number}/invite?people=${invitable.map((p) => p.personId).join(',')}`)}
              >
                <Send aria-hidden="true" />
                Invite people
              </Button>
            </>
          ) : lodgedElsewhere ? (
            <span className="text-base text-slate">Lodged by another Agent</span>
          ) : (
            <Button onClick={connect}>
              <Link2 aria-hidden="true" />
              Connect company to portal
            </Button>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel aria-labelledby="people-title" className="overflow-hidden">
          <PanelHeader id="people-title" title="Officers and persons with significant control" description="As held on the Companies House register" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left">
              <thead className="text-[0.9375rem] text-slate">
                <tr>
                  <th scope="col" className="py-3 pr-4 pl-5 font-normal sm:pl-6">Name on the register</th>
                  <th scope="col" className="py-3 pr-4 font-normal">Role</th>
                  <th scope="col" className="py-3 pr-4 font-normal">Appointed</th>
                  <th scope="col" className="py-3 pr-4 font-normal">Born</th>
                  {connectedHere && <th scope="col" className="py-3 pr-6 font-normal">Verification</th>}
                </tr>
              </thead>
              <tbody>
                {profile.people.map((p, i) => (
                  <tr key={`${p.name}-${i}`} className="border-t border-line/70">
                    <td className="py-4 pr-4 pl-5 sm:pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar seed={p.personId ?? p.name} name={p.name.split(',').reverse().join(' ')} size={36} />
                        <div>
                          <p className="font-mono text-[0.9375rem] text-ink">{p.name}</p>
                          {p.natureOfControl && <p className="mt-1 text-[0.9375rem] text-slate first-letter:uppercase">{p.natureOfControl}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-graphite">{p.roleLabel}</td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-graphite">{p.appointedOn ? formatShortDate(p.appointedOn) : 'Not shown'}</td>
                    <td className="py-4 pr-4 text-[0.9375rem] text-graphite">{p.dobMonthYear ?? 'Not shown'}</td>
                    {connectedHere && <td className="py-4 pr-6">{p.personId && <PersonStatusChip status={personStatus(data, p.personId)} />}</td>}
                  </tr>
                ))}
                {profile.people.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-base text-slate">
                      No current officers or PSCs are listed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5 sm:p-6">
            <MonoLabel>Company details</MonoLabel>
            <dl className="mt-4 space-y-4 text-base">
              <div>
                <dt className="text-[0.9375rem] text-slate">Registered office</dt>
                <dd className="mt-0.5 text-ink">{profile.address ?? 'Not shown'}</dd>
              </div>
              <div>
                <dt className="text-[0.9375rem] text-slate">Nature of business</dt>
                <dd className="mt-0.5 text-ink">{profile.sicDescription || 'Not shown'}</dd>
              </div>
              {profile.type && (
                <div>
                  <dt className="text-[0.9375rem] text-slate">Company type</dt>
                  <dd className="mt-0.5 text-ink">{profile.type}</dd>
                </div>
              )}
            </dl>
          </Panel>
          {!connectedHere && (
            <Panel className="p-5 sm:p-6">
              <MonoLabel>What connecting does</MonoLabel>
              <ul className="mt-4 space-y-3 text-base leading-relaxed text-graphite">
                <li>Adds the company and its officers and PSCs to your dashboard.</li>
                <li>Lets you invite them, with every invite pre-filled from the register.</li>
                <li>Records the connection in the audit trail.</li>
              </ul>
            </Panel>
          )}
        </div>
      </div>

      <AlertDialog open={liveNotice} onOpenChange={setLiveNotice}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Live companies stay read-only in this demo</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate">
              In the platform, connecting {profile.name} would import its officers and PSCs from the register so you can invite them. This demonstration only uses fictional people, so connecting is available for the fictional companies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="h-11 text-base">Understood</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}
