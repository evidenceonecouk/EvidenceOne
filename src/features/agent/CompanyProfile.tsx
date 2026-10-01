import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Send,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  MonoLabel,
  Page,
  Panel,
  PanelHeader,
  StatTile,
} from '@/components/app/Page'
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
import {
  demoProfile,
  liveProfile,
  type CompanyProfile as Profile,
  type FilingDeadline,
  type RegisterPerson,
} from '@/lib/companiesHouse'
import { formatDate, formatShortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { connectCompany } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { getAgent, personStatus } from '@/store/selectors'

const DAY = 24 * 60 * 60 * 1000
const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / DAY)

function yearsSince(iso: string) {
  const years = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (365.25 * DAY),
  )
  return years < 1
    ? 'under a year'
    : `${years} ${years === 1 ? 'year' : 'years'}`
}

export function CompanyProfile() {
  const { number = '' } = useParams()
  const { data, state, apply } = useDemoStore()
  const toast = useToast()
  const navigate = useNavigate()
  const demo = demoProfile(data, number)
  const [live, setLive] = useState<Profile | null | 'loading'>(
    demo ? null : 'loading',
  )
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
        <h1 className="text-[2rem] font-medium tracking-[-0.025em] text-ink">
          Company not available
        </h1>
        <p className="mt-2 mb-6 text-[1.0625rem] text-slate">
          We could not load this company from the register. The live register
          may be unavailable, or the number may be wrong.
        </p>
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
    apply((d) =>
      connectCompany(
        d,
        number,
        agent.id,
        `${agent.contactName}, ${agent.name}`,
      ),
    )
    toast({
      title: 'Company connected',
      description: `${profile.name} is now on your dashboard. Logged in the audit trail.`,
    })
  }

  const invitable = profile.people.filter(
    (p) =>
      p.personId &&
      ['not_started', 'expired', 'reverification_due'].includes(
        personStatus(data, p.personId),
      ),
  )
  const officers = profile.people.filter((p) => p.role !== 'psc')
  const directors = officers.filter(
    (p) => p.role === 'director' || p.role === 'director_psc',
  )
  const pscs = profile.people.filter(
    (p) => p.role === 'psc' || p.role === 'director_psc',
  )
  const needVerifying = profile.people.filter(
    (p) => p.role !== 'secretary' && p.role !== 'other',
  )
  const idvKnown = needVerifying.filter((p) => p.identityVerified !== undefined)
  const idvDone = idvKnown.filter((p) => p.identityVerified)
  const nextDeadline = [
    { label: 'Confirmation statement', d: profile.confirmationStatement },
    { label: 'Accounts', d: profile.accounts },
  ]
    .filter((x) => x.d?.nextDue)
    .sort((a, b) => a.d!.nextDue!.localeCompare(b.d!.nextDue!))[0]
  const csDays = profile.confirmationStatement?.nextDue
    ? daysUntil(profile.confirmationStatement.nextDue)
    : undefined
  const unverifiedDirectors = directors.filter(
    (p) => p.identityVerified === false,
  )

  return (
    <Page>
      <Link
        to="/agent/lookup"
        className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Search the register
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-6 border-b border-line/80 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-5">
          <CompanyMark
            name={profile.name}
            size={64}
            className="mt-1 rounded-xl"
          />
          <div className="min-w-0">
            <div className="mb-2 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
              {profile.source === 'live'
                ? 'Companies House register · live public data'
                : 'Companies House register · fictional demo company'}
            </div>
            <h1 className="text-[2rem] leading-[1.1] font-medium tracking-[-0.025em] text-ink sm:text-[2.25rem]">
              {profile.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusPill status={profile.status} />
              <Pill>
                <span className="font-mono tabular">{profile.number}</span>
              </Pill>
              {profile.type && <Pill>{profile.type}</Pill>}
              {profile.incorporatedOn && (
                <Pill>Incorporated {formatDate(profile.incorporatedOn)}</Pill>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {profile.source === 'live' && (
            <Button asChild variant="outline">
              <a
                href={`https://find-and-update.company-information.service.gov.uk/company/${profile.number}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink aria-hidden="true" />
                Open the public register
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          )}
          {connectedHere ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-base text-graphite">
                <Check className="size-4" aria-hidden="true" />
                Connected{' '}
                {company?.connectedAt && formatShortDate(company.connectedAt)}
              </span>
              <Button
                disabled={!invitable.length}
                onClick={() =>
                  navigate(
                    `/agent/companies/${number}/invite?people=${invitable.map((p) => p.personId).join(',')}`,
                  )
                }
              >
                <Send aria-hidden="true" />
                Invite people
              </Button>
            </>
          ) : lodgedElsewhere ? (
            <span className="text-base text-slate">
              Lodged by another Agent
            </span>
          ) : (
            <Button onClick={connect}>
              <Link2 aria-hidden="true" />
              Connect company to portal
            </Button>
          )}
        </div>
      </header>

      {/* Notices drawn from the register */}
      <div className="mt-6 space-y-3">
        {profile.confirmationStatement?.overdue && (
          <Notice
            tone="negative"
            icon={CircleAlert}
            title="Confirmation statement overdue"
          >
            The register shows the confirmation statement was due on{' '}
            {formatDate(profile.confirmationStatement.nextDue!)}.
          </Notice>
        )}
        {!profile.confirmationStatement?.overdue &&
          csDays !== undefined &&
          csDays <= 45 &&
          unverifiedDirectors.length > 0 && (
            <Notice
              tone="attention"
              icon={Clock3}
              title={`Confirmation statement due in ${csDays} ${csDays === 1 ? 'day' : 'days'}`}
            >
              {unverifiedDirectors.length}{' '}
              {unverifiedDirectors.length === 1
                ? 'director is'
                : 'directors are'}{' '}
              not yet shown as verified on the register. Existing directors are
              expected to verify their identity by the time the next
              confirmation statement is filed.
            </Notice>
          )}
        {profile.accounts?.overdue && (
          <Notice tone="negative" icon={CircleAlert} title="Accounts overdue">
            The register shows accounts were due on{' '}
            {formatDate(profile.accounts.nextDue!)}.
          </Notice>
        )}
        {profile.hasInsolvencyHistory && (
          <Notice
            tone="negative"
            icon={CircleAlert}
            title="Insolvency history on the register"
          >
            Review the company's filing history before connecting it.
          </Notice>
        )}
      </div>

      {/* Key figures */}
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Directors"
          value={directors.length}
          icon={Users}
          detail={
            officers.length > directors.length
              ? `${officers.length - directors.length} other officer${officers.length - directors.length === 1 ? '' : 's'}`
              : 'Current appointments'
          }
        />
        <StatTile
          label="Persons with significant control"
          value={pscs.length}
          icon={Users}
          detail={pscs.length ? 'Notified to the register' : 'None notified'}
        />
        <StatTile
          label="Identity verified on the register"
          value={
            idvKnown.length
              ? `${idvDone.length} of ${needVerifying.length}`
              : 'Not shown'
          }
          icon={ShieldCheck}
          detail={
            idvKnown.length
              ? `${needVerifying.length - idvDone.length} still to verify`
              : 'The register does not say for this company'
          }
        />
        <StatTile
          label="Next filing due"
          value={
            nextDeadline ? formatShortDate(nextDeadline.d!.nextDue!) : 'None'
          }
          icon={CalendarClock}
          detail={
            nextDeadline && (
              <>
                {nextDeadline.label},{' '}
                <Remaining
                  due={nextDeadline.d!.nextDue!}
                  overdue={nextDeadline.d!.overdue}
                  plain
                />
              </>
            )
          }
        />
      </dl>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0 space-y-6">
          {/* Officers */}
          <Panel aria-labelledby="officers-title" className="overflow-hidden">
            <PanelHeader
              id="officers-title"
              title={`Directors and officers (${officers.length})`}
              description="Current appointments, exactly as named on the Companies House register"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[50rem] text-left">
                <thead className="bg-mist/50 text-[0.875rem] text-slate">
                  <tr>
                    <Th first>Name on the register</Th>
                    <Th>Role</Th>
                    <Th>Appointed</Th>
                    <Th>Born</Th>
                    <Th>Identity on register</Th>
                    {connectedHere && <Th>Evidence One</Th>}
                  </tr>
                </thead>
                <tbody>
                  {officers.map((p, i) => (
                    <tr
                      key={`${p.name}-${i}`}
                      className="border-t border-line/70 align-top"
                    >
                      <td className="py-4 pr-4 pl-5 sm:pl-6">
                        <PersonName p={p} />
                      </td>
                      <Td>
                        <span className="text-ink">{p.roleLabel}</span>
                        {p.occupation && (
                          <span className="mt-0.5 block text-[0.875rem] text-slate">
                            {p.occupation}
                          </span>
                        )}
                      </Td>
                      <Td nowrap>
                        {p.appointedOn
                          ? formatShortDate(p.appointedOn)
                          : 'Not shown'}
                      </Td>
                      <Td nowrap>
                        <span className="text-ink">
                          {p.dobMonthYear ?? 'Not shown'}
                        </span>
                        {p.nationality && (
                          <span className="mt-0.5 block text-[0.875rem] text-slate">
                            {p.nationality}
                          </span>
                        )}
                      </Td>
                      <td className="py-4 pr-4">
                        <IdvChip p={p} />
                      </td>
                      {connectedHere && (
                        <td className="py-4 pr-6">
                          {p.personId && (
                            <PersonStatusChip
                              status={personStatus(data, p.personId)}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {officers.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-6 text-base text-slate"
                      >
                        No current officers are listed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {profile.resigned.length > 0 && (
              <details className="group border-t border-line/80">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-base text-graphite hover:bg-mist/50 focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-ink sm:px-6 [&::-webkit-details-marker]:hidden">
                  <ChevronDown
                    className="size-4 transition-transform duration-150 group-open:rotate-180"
                    aria-hidden="true"
                  />
                  Show {profile.resigned.length} resigned{' '}
                  {profile.resigned.length === 1 ? 'officer' : 'officers'}
                </summary>
                <ul className="divide-y divide-line/70 border-t border-line/70">
                  {profile.resigned.map((p, i) => (
                    <li
                      key={`${p.name}-${i}`}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-3 sm:px-6"
                    >
                      <span className="font-mono text-[0.9375rem] text-graphite">
                        {p.name}
                      </span>
                      <span className="text-[0.9375rem] text-slate">
                        {p.roleLabel}
                        {p.appointedOn &&
                          ` · appointed ${formatShortDate(p.appointedOn)}`}
                        {p.resignedOn &&
                          ` · resigned ${formatShortDate(p.resignedOn)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Panel>

          {/* PSCs */}
          <Panel aria-labelledby="pscs-title" className="overflow-hidden">
            <PanelHeader
              id="pscs-title"
              title={`Persons with significant control (${pscs.length})`}
              description="People and legal entities who own or control the company"
            />
            {pscs.length === 0 ? (
              <p className="px-5 py-6 text-base text-slate sm:px-6">
                No persons with significant control are notified on the
                register.
              </p>
            ) : (
              <ul
                className={cn(
                  '-mb-px grid',
                  pscs.length > 1 && 'md:grid-cols-2',
                )}
              >
                {pscs.map((p, i) => (
                  <li
                    key={`${p.name}-${i}`}
                    className="border-b border-line/70 px-5 py-5 sm:px-6 md:odd:border-r md:last:odd:border-r-0"
                  >
                    <PersonName p={p} hideControl />
                    <dl
                      className={cn(
                        'mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[0.9375rem]',
                        pscs.length === 1 && 'sm:grid-cols-4',
                      )}
                    >
                      <Field label="Notified">
                        {p.appointedOn
                          ? formatShortDate(p.appointedOn)
                          : 'Not shown'}
                      </Field>
                      <Field label="Born">
                        {p.dobMonthYear ?? 'Not shown'}
                      </Field>
                      <Field label="Nationality">
                        {p.nationality ?? 'Not shown'}
                      </Field>
                      <Field label="Lives in">
                        {p.countryOfResidence ?? 'Not shown'}
                      </Field>
                    </dl>
                    {p.natureOfControl && (
                      <div className="mt-4">
                        <p className="text-[0.875rem] text-slate">
                          Nature of control
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {p.natureOfControl.split('; ').map((n) => (
                            <li
                              key={n}
                              className="rounded-lg border border-line bg-mist/60 px-2.5 py-1 text-[0.9375rem] text-ink first-letter:uppercase"
                            >
                              {n}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Filing history */}
          <Panel aria-labelledby="filings-title" className="overflow-hidden">
            <PanelHeader
              id="filings-title"
              title="Recent filing history"
              description="The latest documents filed at Companies House"
            />
            {profile.filings.length === 0 ? (
              <p className="px-5 py-6 text-base text-slate sm:px-6">
                No filings are shown for this company.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[44rem] text-left">
                  <thead className="bg-mist/50 text-[0.875rem] text-slate">
                    <tr>
                      <Th first>Date</Th>
                      <Th>Form</Th>
                      <Th>Description</Th>
                      <Th>Category</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.filings.map((f, i) => (
                      <tr
                        key={`${f.date}-${i}`}
                        className="border-t border-line/70 align-top"
                      >
                        <td className="py-3.5 pr-4 pl-5 text-[0.9375rem] whitespace-nowrap text-graphite tabular sm:pl-6">
                          {formatShortDate(f.date)}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span className="rounded-md border border-line bg-mist px-1.5 py-0.5 font-mono text-[0.8125rem] text-ink">
                            {f.type || 'Other'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-[0.9375rem] text-ink">
                          {f.description}
                        </td>
                        <td className="py-3.5 pr-6 text-[0.9375rem] whitespace-nowrap text-slate">
                          {f.category}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Panel aria-labelledby="deadlines-title" className="overflow-hidden">
            <PanelHeader id="deadlines-title" title="Filing deadlines" />
            <div className="divide-y divide-line/70">
              <Deadline
                title="Confirmation statement"
                d={profile.confirmationStatement}
                lastLabel="Last made up to"
              />
              <Deadline
                title="Annual accounts"
                d={profile.accounts}
                lastLabel="Last made up to"
                extra={
                  <>
                    {profile.accounts?.lastType && (
                      <Field label="Last type">
                        {profile.accounts.lastType}
                      </Field>
                    )}
                    {profile.accounts?.reference && (
                      <Field label="Reference date">
                        {profile.accounts.reference}
                      </Field>
                    )}
                  </>
                }
              />
            </div>
          </Panel>

          <Panel aria-labelledby="details-title" className="overflow-hidden">
            <PanelHeader id="details-title" title="Company details" />
            <dl className="space-y-4 px-5 py-5 text-base sm:px-6">
              <Field label="Registered office address" large>
                {profile.address ?? 'Not shown'}
              </Field>
              <Field label="Company type" large>
                {profile.type ?? 'Not shown'}
              </Field>
              {profile.jurisdiction && (
                <Field label="Jurisdiction" large>
                  {profile.jurisdiction}
                </Field>
              )}
              {profile.incorporatedOn && (
                <Field label="Incorporated" large>
                  {formatDate(profile.incorporatedOn)}{' '}
                  <span className="text-slate">
                    ({yearsSince(profile.incorporatedOn)})
                  </span>
                </Field>
              )}
              <Field label="Nature of business (SIC)" large>
                {profile.sic.length === 0 ? (
                  'Not shown'
                ) : (
                  <ul className="space-y-1.5">
                    {profile.sic.map((s) => (
                      <li key={s.code} className="flex gap-2">
                        <span className="font-mono text-[0.9375rem] text-ink tabular">
                          {s.code}
                        </span>
                        {s.description && <span>{s.description}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </Field>
              {profile.previousNames.length > 0 && (
                <Field label="Previous company names" large>
                  <ul className="space-y-1.5">
                    {profile.previousNames.map((n) => (
                      <li key={n.name}>
                        {n.name}
                        <span className="block text-[0.9375rem] text-slate">
                          {formatShortDate(n.from)} to {formatShortDate(n.to)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Field>
              )}
            </dl>
          </Panel>

          <Panel aria-labelledby="flags-title" className="overflow-hidden">
            <PanelHeader id="flags-title" title="Register indicators" />
            <ul className="divide-y divide-line/70">
              <Indicator
                label="Charges registered"
                on={profile.hasCharges}
                neutral
              />
              <Indicator
                label="Insolvency history"
                on={profile.hasInsolvencyHistory}
              />
              <Indicator
                label="Registered office in dispute"
                on={profile.officeInDispute}
              />
              <Indicator
                label="Undeliverable office address"
                on={profile.undeliverableAddress}
              />
            </ul>
          </Panel>

          {!connectedHere && (
            <Panel className="p-5 sm:p-6">
              <MonoLabel>What connecting does</MonoLabel>
              <ul className="mt-4 space-y-3 text-base leading-relaxed text-graphite">
                {[
                  'Adds the company and its officers and PSCs to your dashboard.',
                  'Lets you invite them, with every invite pre-filled from the register.',
                  'Records the connection in the audit trail.',
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Check
                      className="mt-1 size-4 shrink-0 text-ink"
                      aria-hidden="true"
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      <p className="mt-8 flex items-center gap-2 text-[0.9375rem] text-slate">
        <FileText className="size-4" aria-hidden="true" />
        {profile.source === 'live'
          ? 'Public register data from Companies House. Evidence One shows it as held and does not change it.'
          : 'A fictional company created for this demonstration. It does not exist on the Companies House register.'}
      </p>

      <AlertDialog open={liveNotice} onOpenChange={setLiveNotice}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Live companies stay read-only in this demo
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate">
              In the platform, connecting {profile.name} would import its
              officers and PSCs from the register so you can invite them. This
              demonstration only uses fictional people, so connecting is
              available for the fictional companies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="h-11 text-base">
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  )
}

function Th({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'py-3 pr-4 font-normal whitespace-nowrap',
        first && 'pl-5 sm:pl-6',
      )}
    >
      {children}
    </th>
  )
}

function Td({ children, nowrap }: { children: ReactNode; nowrap?: boolean }) {
  return (
    <td
      className={cn(
        'py-4 pr-4 text-[0.9375rem] text-graphite',
        nowrap && 'whitespace-nowrap',
      )}
    >
      {children}
    </td>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-white px-3 py-1 text-[0.9375rem] text-graphite">
      {children}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const active = status === 'active'
  const Icon = active ? CircleCheck : CircleAlert
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.9375rem] font-medium capitalize',
        active
          ? 'border-approve/25 bg-approve-wash text-approve'
          : 'border-decline/25 bg-decline-wash text-decline',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {status}
    </span>
  )
}

function PersonName({
  p,
  hideControl,
}: {
  p: RegisterPerson
  hideControl?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <Avatar
        seed={p.personId ?? p.name}
        name={p.name.split(',').reverse().join(' ')}
        size={36}
      />
      <div className="min-w-0">
        <p className="font-mono text-[0.9375rem] whitespace-nowrap text-ink">
          {p.name}
        </p>
        {!hideControl && p.role === 'director_psc' && (
          <p className="mt-1 text-[0.875rem] text-slate">Also a PSC</p>
        )}
        {hideControl && (
          <p className="mt-0.5 text-[0.875rem] text-slate">
            {p.role === 'director_psc' ? 'Director and PSC' : p.roleLabel}
          </p>
        )}
        {!hideControl && p.countryOfResidence && (
          <p className="mt-0.5 text-[0.875rem] text-slate">
            Lives in {p.countryOfResidence}
          </p>
        )}
      </div>
    </div>
  )
}

function IdvChip({ p }: { p: RegisterPerson }) {
  if (p.role === 'secretary' || p.role === 'other')
    return <span className="text-[0.9375rem] text-slate">Not required</span>
  if (p.identityVerified === undefined)
    return <span className="text-[0.9375rem] text-slate">Not shown</span>
  const Icon = p.identityVerified ? CircleCheck : CircleDashed
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium whitespace-nowrap',
        p.identityVerified
          ? 'border-approve/25 bg-approve-wash text-approve'
          : 'border-line bg-mist text-graphite',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {p.identityVerified ? 'Verified' : 'Not yet verified'}
    </span>
  )
}

function Field({
  label,
  children,
  large,
}: {
  label: string
  children: ReactNode
  large?: boolean
}) {
  return (
    <div>
      <dt
        className={cn(
          'text-slate',
          large ? 'text-[0.9375rem]' : 'text-[0.875rem]',
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 text-ink',
          large ? 'text-base' : 'text-[0.9375rem]',
        )}
      >
        {children}
      </dd>
    </div>
  )
}

function Remaining({
  due,
  overdue,
  plain,
}: {
  due: string
  overdue?: boolean
  plain?: boolean
}) {
  const days = daysUntil(due)
  const late = overdue || days < 0
  const soon = !late && days <= 30
  const label = late
    ? `overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'}`
    : days === 0
      ? 'due today'
      : `${days} ${days === 1 ? 'day' : 'days'} left`
  if (plain) return <>{label}</>
  const Icon = late ? CircleAlert : soon ? Clock3 : CalendarClock
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium whitespace-nowrap',
        late
          ? 'border-decline/25 bg-decline-wash text-decline'
          : soon
            ? 'border-info/25 bg-info-wash text-info'
            : 'border-line bg-mist text-graphite',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="first-letter:uppercase">{label}</span>
    </span>
  )
}

function Deadline({
  title,
  d,
  lastLabel,
  extra,
}: {
  title: string
  d?: FilingDeadline
  lastLabel: string
  extra?: ReactNode
}) {
  return (
    <section className="px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-medium text-ink">{title}</h3>
        {d?.nextDue && <Remaining due={d.nextDue} overdue={d.overdue} />}
      </div>
      {d?.nextDue ? (
        <>
          <p className="mt-3 text-[1.5rem] leading-none font-medium tracking-[-0.02em] text-ink tabular">
            {formatDate(d.nextDue)}
          </p>
          <p className="mt-1.5 text-[0.875rem] text-slate">
            Next due
            {d.nextMadeUpTo &&
              `, made up to ${formatShortDate(d.nextMadeUpTo)}`}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={lastLabel}>
              {d.lastMadeUpTo
                ? formatShortDate(d.lastMadeUpTo)
                : 'None filed yet'}
            </Field>
            {extra}
          </dl>
        </>
      ) : (
        <p className="mt-2 text-[0.9375rem] text-slate">
          Not shown on the register.
        </p>
      )}
    </section>
  )
}

function Indicator({
  label,
  on,
  neutral,
}: {
  label: string
  on?: boolean
  neutral?: boolean
}) {
  const Icon = on ? (neutral ? CircleDashed : CircleAlert) : Check
  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
      <span className="text-[0.9375rem] text-graphite">{label}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-[0.9375rem] font-medium',
          on && !neutral ? 'text-decline' : 'text-ink',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
        {on ? 'Yes' : 'No'}
      </span>
    </li>
  )
}

function Notice({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: 'attention' | 'negative'
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex gap-3 rounded-2xl border px-5 py-4',
        tone === 'negative'
          ? 'border-decline/25 bg-decline-wash'
          : 'border-info/25 bg-info-wash',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 size-5 shrink-0',
          tone === 'negative' ? 'text-decline' : 'text-info',
        )}
        aria-hidden="true"
      />
      <div>
        <p
          className={cn(
            'text-base font-medium',
            tone === 'negative' ? 'text-decline' : 'text-info',
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink">
          {children}
        </p>
      </div>
    </div>
  )
}
