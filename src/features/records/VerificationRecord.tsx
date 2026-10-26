import { auditEventKey } from '@/lib/audit'
import { ArrowLeft, ArrowRight, ShieldCheck, ShieldX } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { CaseNotFound } from '@/components/app/StateScreen'
import { CaseStatusChip } from '@/components/StatusChip'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { Wordmark } from '@/components/brand/Wordmark'
import { reasonCodes } from '@/data/reasonCodes'
import { recordAttribution, sourceDetail } from '@/lib/attribution'
import { chipResultFor, chipResultLabel, securityFeaturesFor } from '@/lib/chip'
import { formatDate, formatDateTime, fullName, shortHash } from '@/lib/format'
import { documentName, ruleSetFor } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { reviewerName } from '@/store/actions'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'
import { chainIntact } from './chain'
import { AccessRefused } from '@/features/acsp/AccessRefused'
import { AuditExport } from './AuditExport'
import { ExportControl } from './ExportControl'
import { CasePayment } from '@/features/acsp/CasePayment'
import {
  auditForCase,
  getCase,
  getCompany,
  getPerson,
  isSubmitted,
  reviewerOrgName,
  roleLabel,
} from '@/store/selectors'

/** Evidence One File: the audit-ready record of one verification. */
export function VerificationRecord() {
  const { caseId = '' } = useParams()
  const { data } = useDemoStore()
  const { acsp: actingAcsp, reviewer: actingReviewer } = useActingAcsp()
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const company = vc && getCompany(data, vc.companyNumber)
  const entry =
    vc &&
    data.register.find(
      (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
    )
  if (!vc || !person || !company || !entry)
    return <CaseNotFound kind="record" />
  if (vc.acspId !== actingAcsp.id)
    return <AccessRefused caseId={vc.id} area="the verification record" />

  const acspName = reviewerOrgName(data, vc.acspId)
  const reviewer = data.acsps
    .flatMap((a) => a.reviewers)
    .find((r) => r.id === vc.reviewerId)
  const decidedAt =
    vc.decision && vc.decision.outcome !== 'request_info'
      ? vc.decision.decidedAt
      : vc.closedAt
  const rs = ruleSetFor(data, vc)
  const retention = decidedAt
    ? new Date(
        new Date(decidedAt).setFullYear(
          new Date(decidedAt).getFullYear() + rs.params.retention_years,
        ),
      ).toISOString()
    : undefined
  const events = auditForCase(data, vc.id)
  const chainOk = chainIntact(data.audit, vc.acspId)
  const partner = vc.partnerId
    ? data.partners.find((p) => p.id === vc.partnerId)
    : undefined
  const pep = data.acsps.find((a) => a.id === vc.acspId)?.profile.pepScreening
  const reason = reasonCodes.find((r) => r.code === vc.decision?.reasonCode)
  const name = fullName(person)

  const outcome = isSubmitted(vc.status)
    ? `was approved by ${reviewer?.name ?? 'an authorised reviewer'} on ${decidedAt && formatDate(decidedAt)} and submitted to Companies House by the ACSP.`
    : vc.status === 'approved' || vc.status === 'submission_started'
      ? `was approved by ${reviewer?.name ?? 'an authorised reviewer'} on ${decidedAt && formatDate(decidedAt)} and is being submitted to Companies House.`
      : vc.status === 'declined'
        ? `was declined by ${reviewer?.name ?? 'an authorised reviewer'} on ${decidedAt && formatDate(decidedAt)}.`
        : vc.status === 'abandoned'
          ? `was not completed and was closed on ${decidedAt && formatDate(decidedAt)}.`
          : 'is still open.'

  const fields: [string, string][] = [
    ['Person', name],
    ['Company', `${company.name} (${company.number})`],
    ['Role', roleLabel[entry.role]],
    [
      'Identity document',
      vc.option === 2 && vc.option2?.documents
        ? vc.option2.documents.map((d) => d.label).join(' and ')
        : person.document
          ? `${documentName(person.document)}, ends ${person.document.numberLastTwo}`
          : 'Not provided',
    ],
    [
      'Checks',
      vc.option === 2
        ? `Option 2: identity provider’s manual document review with the ACSP’s additional checks, register comparison${pep ? ', PEP and sanctions screening' : ''}`
        : `Option 1, certified identity provider: document authenticity, liveness, face match${vc.idvt.faceMatchScore ? ` ${vc.idvt.faceMatchScore}%` : ''}, register comparison${pep ? ', PEP and sanctions screening' : ''}`,
    ],
    ...(vc.option === 1
      ? ([
          [
            'Chip',
            chipResultLabel[
              chipResultFor(vc, person.document) ?? 'not_applicable'
            ],
          ],
          [
            'Security features validated',
            securityFeaturesFor(vc, person.document).join('; ') ||
              'Not yet recorded',
          ],
        ] as [string, string][])
      : []),
    [
      'Decision',
      vc.decision
        ? `${vc.decision.reasonCode} · ${reason?.label ?? ''}`
        : 'No decision',
    ],
    [
      'Decision timestamp',
      decidedAt ? formatDateTime(decidedAt) : 'Not decided',
    ],
    [
      'Decided by',
      vc.decision ? reviewerName(data, vc.decision.reviewerId) : 'Not decided',
    ],
    ...(vc.decision?.stepUpRef
      ? ([['Step-up reference', vc.decision.stepUpRef]] as [string, string][])
      : []),
    ['Case source', sourceDetail(vc, partner?.name)],
    ...(vc.discrepancyReport?.choice
      ? ([
          [
            'Register difference',
            `${vc.discrepancyReport.summary}. Choice logged: ${vc.discrepancyReport.choice === 'will_report' ? 'will report to Companies House' : 'will not report'}`,
          ],
        ] as [string, string][])
      : []),
    ['Secure messages', `${(vc.messages ?? []).length} kept with the record`],
    ['Rule set applied', `Route A rule set ${rs.version}`],
    [
      'Companies House verification reference',
      vc.submission?.verificationReference ??
        (isSubmitted(vc.status) ? 'Not yet recorded' : 'Not submitted'),
    ],
    [
      'Retention',
      retention
        ? `Kept until ${formatDate(retention)}`
        : `Kept for ${rs.params.retention_years} years from the decision`,
    ],
    [
      'Liveness media',
      `Kept with the record for ${rs.params.liveness_media_retention_years} years. The certified identity provider deletes its own copy after 7 days`,
    ],
  ]

  return (
    <Page width="narrow">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/records"
          className="inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All records
        </Link>
        <AuditExport
          acspId={vc.acspId}
          caseId={vc.id}
          actor={reviewerName(data, actingReviewer.id)}
          reviewerId={actingReviewer.id}
        />
        <ExportControl
          vc={vc}
          actor={reviewerName(data, actingReviewer.id)}
          reviewerId={actingReviewer.id}
        />
      </div>

      {/* The statement, laid out like a document */}
      <article className="relative overflow-hidden rounded-[24px] border border-line bg-white shadow-[0_30px_60px_-40px_rgb(22_24_27/0.35)] print:rounded-none print:border-0 print:shadow-none">
        <div className="mesh h-2 print:hidden" aria-hidden="true" />
        <div className="p-7 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Wordmark />
              <p className="mt-3 text-[0.875rem] text-slate">
                Evidence One File · Verification record
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[0.9375rem] text-ink">{vc.id}</p>
              <CaseStatusChip status={vc.status} className="mt-2" />
            </div>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <Avatar seed={vc.personId} name={name} size={56} />
            <div>
              <h1 className="text-[2rem] leading-tight font-normal tracking-[-0.03em] text-ink">
                Verification statement
              </h1>
              <p className="flex items-center gap-1.5 text-[0.9375rem] text-slate">
                <CompanyMark
                  name={company.name}
                  size={18}
                  className="rounded-[5px]"
                />
                {company.name}
              </p>
            </div>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-graphite">
            {recordAttribution(name, acspName ?? 'the ACSP')} It {outcome}{' '}
            Evidence One prepared, evidenced and recorded the verification. The
            decision was made by a person at the ACSP.
          </p>

          <dl className="mt-8 grid gap-x-8 gap-y-5 border-t border-line pt-8 sm:grid-cols-2">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.875rem] text-slate">{k}</dt>
                <dd
                  className={cn(
                    'mt-0.5 text-base text-ink first-letter:uppercase',
                    k === 'Companies House verification reference' &&
                      'font-mono tracking-[0.06em]',
                  )}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          {retention && (
            <p className="mt-8 rounded-2xl bg-mist px-5 py-4 text-[0.9375rem] leading-relaxed text-graphite">
              Records of the documents checked, the checks completed and any
              failed attempts are kept for {rs.params.retention_years} years
              from the decision timestamp, until {formatDate(retention)}.
              Liveness media are kept with the record for the same{' '}
              {rs.params.liveness_media_retention_years} years. Destruction
              after the retention date is a deliberate, audited action, and a
              regulatory or litigation hold suspends it. Companies House emails
              the personal code to the individual; Evidence One does not receive
              it from Companies House, and no code is part of this record.
            </p>
          )}
        </div>
      </article>

      <CasePayment
        vc={vc}
        acspName={acspName ?? 'the ACSP'}
        className="mt-6 p-5 sm:p-6"
      />

      <Panel
        aria-labelledby="audit-title"
        className="mt-6 overflow-hidden print:mt-8 print:break-before-page print:border-0 print:shadow-none"
      >
        <PanelHeader
          id="audit-title"
          title="Audit trail"
          description={`Append-only, one chain per ACSP: the chain of ${acspName}. Each entry's hash includes the previous one, so any change breaks the chain.`}
          actions={
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.875rem] font-medium',
                chainOk
                  ? 'bg-approve-wash text-approve'
                  : 'bg-decline-wash text-decline',
              )}
            >
              {chainOk ? (
                <ShieldCheck className="size-4" aria-hidden="true" />
              ) : (
                <ShieldX className="size-4" aria-hidden="true" />
              )}
              {chainOk ? 'Chain verified' : 'Chain broken'}
            </span>
          }
        />
        <ol className="relative px-5 py-5 sm:px-6">
          <span
            aria-hidden="true"
            className="absolute top-7 bottom-7 left-[2.05rem] w-px bg-line sm:left-[2.3rem]"
          />
          {events.map((e) => (
            <li
              key={auditEventKey(e)}
              className="relative flex gap-4 pb-5 last:pb-0"
            >
              <span
                className={cn(
                  'relative z-10 mt-1.5 size-3 shrink-0 translate-x-[0.3rem] rounded-full ring-4 ring-white',
                  e.actorType === 'ai'
                    ? 'bg-silver'
                    : e.actorType === 'system'
                      ? 'bg-slate'
                      : 'bg-ink',
                )}
                aria-hidden="true"
              />
              <div className="grid min-w-0 flex-1 gap-x-5 gap-y-1 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="text-[0.9375rem] text-ink">{e.detail}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-slate">
                    {formatDateTime(e.at)} · {e.actor} ·{' '}
                    <span className="font-mono">{e.action}</span>
                  </p>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[0.8125rem] text-slate">
                  #{String(e.seq).padStart(4, '0')} {shortHash(e.prevHash)}
                  <ArrowRight className="size-3" aria-label="then" />
                  <span className="text-ink">{shortHash(e.hash)}</span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
      <p className="mt-4 text-center text-[0.875rem] text-slate print:block">
        Synthetic demonstration record. Every person and company shown is
        fictional.
      </p>
      <MonoLabel className="sr-only">End of record</MonoLabel>
    </Page>
  )
}
