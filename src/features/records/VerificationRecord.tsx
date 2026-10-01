import {
  ArrowLeft,
  ArrowRight,
  Download,
  ShieldCheck,
  ShieldX,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { MonoLabel, Page, Panel, PanelHeader } from '@/components/app/Page'
import { CaseStatusChip } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { Wordmark } from '@/components/brand/Wordmark'
import { reasonCodes } from '@/data/reasonCodes'
import { verifyChain } from '@/lib/audit'
import { formatDate, formatDateTime, fullName, shortHash } from '@/lib/format'
import { documentName, ruleSetFor } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { recordExport, reviewerName } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
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
  const { data, apply } = useDemoStore()
  const [stepUp, setStepUp] = useState(false)
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const company = vc && getCompany(data, vc.companyNumber)
  const entry =
    vc &&
    data.register.find(
      (r) => r.personId === vc.personId && r.companyNumber === vc.companyNumber,
    )
  if (!vc || !person || !company || !entry)
    return <Page>Record not found.</Page>

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
  const chainOk = verifyChain(data.audit)
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
        ? 'Option 2: person check by a trained reviewer, PEP and sanctions'
        : `Option 1: ${vc.browserCapture ? '' : 'chip read, '}authenticity, liveness, face match${vc.idvt.faceMatchScore ? ` ${vc.idvt.faceMatchScore}%` : ''}, PEP and sanctions`,
    ],
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
      'Biometrics',
      `Raw biometric samples deleted within ${rs.params.biometric_deletion_days} days of completion`,
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
        <Button variant="outline" onClick={() => setStepUp(true)}>
          <Download aria-hidden="true" />
          Export as PDF
        </Button>
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
            The identity verification of{' '}
            <span className="text-ink">{name}</span> was conducted by{' '}
            <span className="text-ink">{acspName}</span> using the Evidence One
            platform. It {outcome} Evidence One prepared, evidenced and recorded
            the verification. The decision was made by a person at the ACSP.
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
              from the decision timestamp, until {formatDate(retention)}. Raw
              biometric samples are deleted within{' '}
              {rs.params.biometric_deletion_days} days of completion.
              Destruction after the retention date is a deliberate, audited
              action, and a regulatory or litigation hold suspends it. Companies
              House emails the personal code to the individual; Evidence One
              does not receive or keep it.
            </p>
          )}
        </div>
      </article>

      <Panel
        aria-labelledby="audit-title"
        className="mt-6 overflow-hidden print:mt-8 print:break-before-page print:border-0 print:shadow-none"
      >
        <PanelHeader
          id="audit-title"
          title="Audit trail"
          description="Append-only. Each entry's hash includes the previous one, so any change breaks the chain."
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
        <ol className="divide-y divide-line/70">
          {events.map((e) => (
            <li
              key={e.seq}
              className="grid gap-x-5 gap-y-1 px-5 py-4 sm:grid-cols-[5.5rem_1fr_auto] sm:px-6"
            >
              <span className="font-mono text-[0.875rem] text-slate tabular">
                #{String(e.seq).padStart(4, '0')}
              </span>
              <div className="min-w-0">
                <p className="text-[0.9375rem] text-ink">{e.detail}</p>
                <p className="mt-0.5 text-[0.8125rem] text-slate">
                  {formatDateTime(e.at)} · {e.actor} ·{' '}
                  <span className="font-mono">{e.action}</span>
                </p>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[0.8125rem] text-slate">
                {shortHash(e.prevHash)}
                <ArrowRight className="size-3" aria-label="then" />
                <span className="text-ink">{shortHash(e.hash)}</span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>
      <p className="mt-4 text-center text-[0.875rem] text-slate print:block">
        Synthetic demonstration record. Every person and company shown is
        fictional.
      </p>
      <MonoLabel className="sr-only">End of record</MonoLabel>
      <StepUpDialog
        open={stepUp}
        action="export this record"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          apply((d) =>
            recordExport(d, vc.id, ref, reviewerName(d, 'rev-marsh')),
          )
          window.setTimeout(() => window.print(), 300)
        }}
      />
    </Page>
  )
}
