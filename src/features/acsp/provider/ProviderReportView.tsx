import {
  Cpu,
  Globe,
  History,
  IdCard,
  LayoutGrid,
  ScanFace,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MonoLabel } from '@/components/app/Page'
import { PassportDataPage } from '@/components/visual/IdDocumentMockup'
import { Portrait } from '@/components/visual/Portrait'
import { portraitFor } from '@/data/portraits'
import { formatDateTime } from '@/lib/format'
import { documentFacts } from '@/lib/idDocument'
import type { ProviderReport, ProviderResult } from '@/lib/providerReport'
import { cn } from '@/lib/utils'
import { useDemoStore } from '@/store/DemoStore'
import type { Person } from '@/types/domain'
import {
  Card,
  DetailList,
  FieldGrid,
  Media,
  Metric,
  Observations,
  ResultChip,
  ResultIcon,
  ScoreBar,
  Section,
} from './ReportParts'

interface Tab {
  id: string
  label: string
  icon: LucideIcon
  result?: ProviderResult
}

/* The tab bar jumps to each section of one long report and follows the scroll. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting)
        const first = ids.find((id) => seen.get(id))
        if (first) setActive(first)
      },
      { rootMargin: '-140px 0px -55% 0px' },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [ids])
  return [active, setActive] as const
}

export function ProviderReportView({ report }: { report: ProviderReport }) {
  const { data } = useDemoStore()
  const person = report.samplePersonId
    ? data.people.find((p) => p.id === report.samplePersonId)
    : undefined

  const tabs = useMemo<Tab[]>(
    () =>
      [
        { id: 'overview', label: 'Overview', icon: LayoutGrid },
        report.document && {
          id: 'document',
          label: 'Identity document',
          icon: IdCard,
          result: report.document.result,
        },
        report.chip && {
          id: 'chip',
          label: 'Chip',
          icon: Cpu,
          result: report.chip.result,
        },
        report.liveness && {
          id: 'liveness',
          label: 'Liveness',
          icon: ScanFace,
          result: report.liveness.result,
        },
        report.faceMatch && {
          id: 'face',
          label: 'Face match',
          icon: UserRoundCheck,
          result: report.faceMatch.result,
        },
        report.device && {
          id: 'device',
          label: 'Device and IP',
          icon: Globe,
          result: report.device.result,
        },
        report.events.length > 0 && {
          id: 'events',
          label: 'Events',
          icon: History,
        },
      ].filter((t): t is Tab => !!t),
    [report],
  )
  const ids = useMemo(() => tabs.map((t) => t.id), [tabs])
  const [active, setActive] = useActiveSection(ids)

  const go = (id: string) => {
    setActive(id)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="min-w-0">
      <nav
        aria-label="Report sections"
        className="sticky top-16 z-20 -mx-1 mb-6 overflow-x-auto bg-canvas/95 px-1 py-2 backdrop-blur lg:top-0"
      >
        <ul className="flex w-max gap-1 rounded-full border border-line/80 bg-white p-1 xl:w-fit xl:flex-wrap xl:rounded-2xl">
          {tabs.map((t) => {
            const Icon = t.icon
            const on = t.id === active
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => go(t.id)}
                  aria-current={on ? 'true' : undefined}
                  className={cn(
                    'flex h-10 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[0.9375rem] font-medium whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ink',
                    on ? 'bg-ink text-paper' : 'text-graphite hover:bg-mist',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {t.label}
                  {t.result && (
                    <ResultIcon
                      result={t.result}
                      className={cn(on && 'text-paper')}
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="space-y-8">
        <Overview report={report} />
        {report.document && <DocumentSection report={report} person={person} />}
        {report.chip && <ChipSection report={report} />}
        {report.liveness && <LivenessSection report={report} person={person} />}
        {report.faceMatch && <FaceSection report={report} person={person} />}
        {report.device && <DeviceSection report={report} />}
        {report.events.length > 0 && <EventsSection report={report} />}
      </div>
    </div>
  )
}

function Overview({ report }: { report: ProviderReport }) {
  const checks: [string, ProviderResult | undefined][] = [
    ['Identity document', report.document?.result],
    [
      report.chip?.read === false ? 'Chip (not read)' : 'Chip',
      report.chip?.result,
    ],
    ['Liveness', report.liveness?.result],
    ['Face match', report.faceMatch?.result],
    ['Device and IP', report.device?.result],
  ]
  const session = [
    { label: 'Provider session', value: report.id },
    report.number !== undefined && {
      label: 'Session number',
      value: String(report.number),
    },
    report.createdAt && {
      label: 'Started',
      value: formatDateTime(report.createdAt),
    },
    report.reference && { label: 'Case reference', value: report.reference },
    report.workflow && { label: 'Journey', value: report.workflow },
    { label: 'Provider status', value: report.status },
  ].filter((r): r is { label: string; value: string } => !!r)

  return (
    <Section id="overview" icon={LayoutGrid} label="Overview">
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Checks">
          <ul className="space-y-2.5">
            {checks.map(([label, result]) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 text-[0.9375rem]"
              >
                <span className="text-graphite">{label}</span>
                {result ? (
                  <ResultChip result={result} />
                ) : (
                  <span className="text-slate">Not in this journey</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Observations">
          {report.flags.length === 0 ? (
            <p className="text-[0.9375rem] text-slate">
              The provider raised no observations.
            </p>
          ) : (
            <ul className="space-y-3">
              {report.flags.map((f, i) => (
                <li key={i}>
                  <MonoLabel className="text-[0.75rem]">{f.check}</MonoLabel>
                  <p className="mt-1 rounded-lg border border-line bg-mist/70 px-3 py-2 text-[0.9375rem] text-ink">
                    {f.title}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Session details" className="md:col-span-2">
          <DetailList rows={session} />
          {report.contact.length > 0 && (
            <div className="mt-4 border-t border-line/80 pt-4">
              <DetailList rows={report.contact} />
            </div>
          )}
        </Card>
      </div>
    </Section>
  )
}

function SamplePassport({ person }: { person: Person }) {
  return (
    <PassportDataPage
      facts={documentFacts(person, 'passport')}
      look={portraitFor(person)}
      className="h-full w-full"
    />
  )
}

function DocumentSection({
  report,
  person,
}: {
  report: ProviderReport
  person?: Person
}) {
  const doc = report.document!
  return (
    <Section
      id="document"
      icon={IdCard}
      label="Identity document"
      result={doc.result}
      extra={
        <span className="hidden text-[0.9375rem] text-slate sm:inline">
          {[doc.issuingState, doc.type].filter(Boolean).join(', ')}
        </span>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {doc.media.length > 0
          ? doc.media.map((m) => (
              <Media
                key={m.label}
                src={m.src}
                kind={m.kind}
                label={m.label}
                className="aspect-[1.42]"
              />
            ))
          : person && (
              <Media
                kind="image"
                label="Front, illustration"
                className="aspect-[1.42]"
                fallback={<SamplePassport person={person} />}
              />
            )}
      </div>

      <Card title="Data read from the document">
        <FieldGrid fields={doc.fields} />
        {doc.nonLatin.length > 0 && (
          <div className="mt-6 border-t border-line/80 pt-5">
            <h4 className="mb-4 font-medium text-ink">
              Names in the original script
            </h4>
            <FieldGrid fields={doc.nonLatin} />
          </div>
        )}
        {doc.mrz && (
          <div className="mt-6 border-t border-line/80 pt-5">
            <h4 className="mb-3 font-medium text-ink">Machine readable zone</h4>
            <pre className="overflow-x-auto rounded-lg bg-mist px-4 py-3 font-mono text-[0.875rem] leading-relaxed text-ink">
              {doc.mrz}
            </pre>
          </div>
        )}
      </Card>

      {(doc.security.length > 0 || doc.quality !== undefined) && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {doc.security.map((s) => (
            <Metric
              key={s.label}
              label={s.label}
              value={s.score}
              note={s.outcome === 'approve' ? 'Within range' : s.outcome}
            />
          ))}
          {doc.quality !== undefined && (
            <Metric label="Image quality" value={doc.quality} />
          )}
        </div>
      )}
      <Observations flags={doc.flags} />
    </Section>
  )
}

function ChipSection({ report }: { report: ProviderReport }) {
  const chip = report.chip!
  return (
    <Section id="chip" icon={Cpu} label="Chip" result={chip.result}>
      <Card>
        <p className="mb-4 text-[0.9375rem] text-graphite">
          {chip.read
            ? "Read with the identity provider's chip reader on the person's phone."
            : `The chip was not read${chip.skipReason ? `: ${chip.skipReason}` : ''}. The reviewer records why they are satisfied.`}
        </p>
        <DetailList rows={chip.fields} />
      </Card>
      <Observations flags={chip.flags} />
    </Section>
  )
}

function LivenessSection({
  report,
  person,
}: {
  report: ProviderReport
  person?: Person
}) {
  const l = report.liveness!
  return (
    <Section id="liveness" icon={ScanFace} label="Liveness" result={l.result}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <Media
          src={l.video ?? l.reference}
          kind={l.video ? 'video' : 'image'}
          label="Liveness capture"
          className="aspect-[4/5]"
          fallback={
            person && (
              <Portrait look={portraitFor(person)} className="h-full w-full" />
            )
          }
        />
        <div className="space-y-4">
          <ScoreBar label="Liveness score" value={l.score} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Face quality" value={l.faceQuality} />
            <Metric label="Face lighting" value={l.faceLuminance} />
            <Metric label="Method" value={l.method ?? 'Not given'} />
          </div>
        </div>
      </div>
      <Observations flags={l.flags} />
    </Section>
  )
}

function FaceSection({
  report,
  person,
}: {
  report: ProviderReport
  person?: Person
}) {
  const f = report.faceMatch!
  const illus = person && (
    <Portrait look={portraitFor(person)} className="h-full w-full" />
  )
  return (
    <Section
      id="face"
      icon={UserRoundCheck}
      label="Face match"
      result={f.result}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line/80 bg-white p-3">
          <Media
            src={f.source ?? report.document?.portrait}
            kind="image"
            label="Document photo"
            className="aspect-[4/5]"
            fallback={illus}
          />
          <Media
            src={f.target ?? report.liveness?.reference}
            kind="image"
            label="Live capture"
            className="aspect-[4/5]"
            fallback={illus}
          />
        </div>
        <div>
          <ScoreBar label="Similarity score" value={f.score} />
        </div>
      </div>
      <Observations flags={f.flags} />
    </Section>
  )
}

function DeviceSection({ report }: { report: ProviderReport }) {
  const d = report.device!
  const hasPoint = d.lat !== undefined && d.lng !== undefined
  const bbox = hasPoint
    ? [d.lng! - 0.35, d.lat! - 0.2, d.lng! + 0.35, d.lat! + 0.2].join(',')
    : ''
  return (
    <Section id="device" icon={Globe} label="Device and IP" result={d.result}>
      {hasPoint && (
        <div className="overflow-hidden rounded-2xl border border-line/80 bg-mist">
          <iframe
            title={`Map of the approximate IP location${d.place ? `, ${d.place}` : ''}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${d.lat},${d.lng}`}
            className="block h-[22rem] w-full grayscale-[35%]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <Card title={d.place ? `Device 1, ${d.place}` : 'Device 1'}>
        <dl className="grid gap-x-8 gap-y-4 text-[0.9375rem] sm:grid-cols-2">
          {d.fields.map((f) => (
            <div
              key={f.label}
              className={cn(
                'min-w-0',
                f.label === 'User agent' && 'sm:col-span-2',
              )}
            >
              <dt className="text-slate">{f.label}</dt>
              <dd className="mt-0.5 font-medium break-words text-ink">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
        {d.distances.length > 0 && (
          <div className="mt-5 border-t border-line/80 pt-4">
            <h4 className="mb-3 font-medium text-ink">Distance from the IP</h4>
            <DetailList rows={d.distances} />
          </div>
        )}
      </Card>
      <Observations flags={d.flags} />
    </Section>
  )
}

const toneDot = {
  ok: 'bg-approve',
  bad: 'bg-decline',
  neutral: 'bg-silver',
}

function EventsSection({ report }: { report: ProviderReport }) {
  const days = new Map<string, typeof report.events>()
  for (const e of report.events) {
    const day = new Date(e.at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    days.set(day, [...(days.get(day) ?? []), e])
  }
  return (
    <Section id="events" icon={History} label="Events">
      {[...days.entries()].map(([day, events]) => (
        <div key={day}>
          <MonoLabel>{day}</MonoLabel>
          <ol className="mt-3 overflow-hidden rounded-2xl border border-line/80 bg-white">
            {events.map((e, i) => {
              const prev = events[i - 1]
              const gap = prev ? Math.round((prev.at - e.at) / 1000) : 0
              return (
                <li
                  key={i}
                  className="grid gap-x-6 gap-y-1 border-t border-line/80 px-5 py-4 first:border-t-0 md:grid-cols-[6rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <time
                    dateTime={new Date(e.at).toISOString()}
                    className="text-[0.9375rem] text-slate tabular"
                  >
                    {new Date(e.at).toLocaleTimeString('en-GB')}
                    {gap > 0 && (
                      <span className="block text-[0.8125rem] text-silver">
                        {gap}s earlier
                      </span>
                    )}
                  </time>
                  <div className="flex min-w-0 gap-2.5">
                    <span
                      className={cn(
                        'mt-[0.45rem] size-2 shrink-0 rounded-full',
                        toneDot[e.tone],
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div
                        className={cn(
                          'font-medium',
                          e.tone === 'bad'
                            ? 'text-decline'
                            : e.tone === 'ok'
                              ? 'text-approve'
                              : 'text-ink',
                        )}
                      >
                        {e.title}
                      </div>
                      {e.detail && (
                        <div className="text-[0.9375rem] text-slate">
                          {e.detail}
                        </div>
                      )}
                      {e.media.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {e.media.slice(0, 4).map((src) => (
                            <img
                              key={src}
                              src={src}
                              alt="Captured file"
                              referrerPolicy="no-referrer"
                              className="size-14 rounded-lg border border-line object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[0.9375rem] text-graphite">
                    {e.where}
                  </div>
                  <div className="text-[0.9375rem] text-slate">
                    {e.device && (
                      <div className="text-graphite">{e.device}</div>
                    )}
                    {e.location && <div>{e.location}</div>}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </Section>
  )
}
