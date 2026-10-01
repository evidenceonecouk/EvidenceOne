import {
  ArrowRight,
  CircleCheck,
  CirclePause,
  CircleX,
  FileWarning,
  Lock,
  MessageSquareMore,
  Sparkles,
} from 'lucide-react'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { Wordmark } from '@/components/brand/Wordmark'

/*
  A static, high-fidelity rendering of the ACSP case review screen for the
  register mismatch story. Decorative: the real screen lives under /acsp.
*/

const checks = [
  ['Passport chip read', 'Signature valid'],
  ['Document authenticity', 'Genuine'],
  ['Liveness', 'Live person'],
  ['Face match', '97.1%'],
  ['PEP and sanctions', 'No match'],
] as const

const rows = [
  {
    field: 'Full name',
    applicant: 'Aidan Patrick Corrigan',
    chip: 'AIDAN PATRICK CORRIGAN',
    register: 'CORRIGAN, Aiden Patrick',
    mismatch: true,
  },
  {
    field: 'Date of birth',
    applicant: '14 March 1979',
    chip: '14 March 1979',
    register: 'March 1979',
    mismatch: false,
  },
  {
    field: 'Appointment',
    applicant: 'Director',
    chip: 'Not shown',
    register: 'Director, 2008',
    mismatch: false,
  },
]

const nav = [
  ['Review queue', '4'],
  ['Filings', '1'],
  ['Records', ''],
  ['Audit trail', ''],
] as const

export function CaseReviewWindow() {
  return (
    <div className="flex h-[700px] w-[1000px] flex-col overflow-hidden rounded-[18px] bg-paper text-ink shadow-[0_50px_100px_-40px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.1)]">
      {/* Window chrome */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-[#f4f5f5] px-4">
        <span className="size-3 rounded-full bg-[#dcdfe1]" />
        <span className="size-3 rounded-full bg-[#dcdfe1]" />
        <span className="size-3 rounded-full bg-[#dcdfe1]" />
        <div className="mx-auto flex h-7 w-[420px] items-center justify-center gap-1.5 rounded-md bg-paper text-[12px] text-slate ring-1 ring-line">
          <Lock className="size-3" />
          app.evidenceone.co.uk/acsp/cases/EO-2026-000127
        </div>
        <span className="w-[52px]" />
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-[176px] shrink-0 flex-col border-r border-line bg-[#f7f8f8] px-3 py-4">
          <div className="flex items-center gap-2 px-2">
            <Wordmark
              tagline={false}
              className="[&>span:first-child]:text-[17px]"
            />
          </div>
          <p className="mt-6 px-2 font-mono text-[10px] tracking-[0.12em] text-slate uppercase">
            Compliance
          </p>
          <ul className="mt-2 space-y-0.5 text-[13px]">
            {nav.map(([label, count], i) => (
              <li
                key={label}
                className={`flex items-center justify-between rounded-md px-2 py-1.5 ${i === 0 ? 'bg-ink/[0.06] font-medium' : 'text-graphite'}`}
              >
                {label}
                {count && (
                  <span className="rounded bg-paper px-1.5 text-[11px] text-slate ring-1 ring-line">
                    {count}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-center gap-2.5 rounded-lg px-2 py-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[11px] font-medium text-paper">
              EM
            </span>
            <span className="leading-tight">
              <span className="block text-[12px] font-medium">
                Eleanor Marsh
              </span>
              <span className="block text-[11px] text-slate">
                Harcourt Lane Solicitors
              </span>
            </span>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 px-7 py-5">
          <p className="text-[12px] text-slate">
            Review queue <span className="mx-1 text-silver">/</span>{' '}
            EO-2026-000127
          </p>
          <div className="mt-2 flex items-center gap-3">
            <h3 className="text-[24px] font-normal tracking-[-0.02em]">
              Aidan Corrigan
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-info/25 bg-info-wash px-2 py-0.5 text-[12px] font-medium text-info">
              <CirclePause className="size-3.5" />
              Paused: register mismatch
            </span>
          </div>
          <p className="mt-1 text-[13px] text-slate">
            Director · CORRIGAN MARINE SERVICES LTD · 99630741 · Referred by
            Belgrave Family Office
          </p>

          <div className="mt-5 grid grid-cols-[1fr_250px] gap-4">
            <div className="space-y-4">
              {/* Register comparison */}
              <section className="rounded-xl border border-line">
                <header className="flex items-center justify-between border-b border-line px-3 py-2.5">
                  <span className="text-[13px] font-medium">
                    Register comparison
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.1em] text-slate uppercase">
                    Exact match required
                  </span>
                </header>
                <table className="w-full text-left text-[12px]">
                  <thead className="text-slate">
                    <tr>
                      {[
                        'Field',
                        'Applicant',
                        'Passport chip',
                        'Register',
                        '',
                      ].map((h) => (
                        <th key={h} className="px-3 py-2 font-normal">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.field}
                        className={`border-t border-line ${r.mismatch ? 'bg-info-wash/70' : ''}`}
                      >
                        <td className="px-3 py-2.5 font-medium">{r.field}</td>
                        <td className="px-3 py-2.5">{r.applicant}</td>
                        <td className="px-3 py-2.5 font-mono text-[10.5px] leading-tight">
                          {r.chip}
                        </td>
                        <td className="px-3 py-2.5">
                          {r.mismatch ? (
                            <>
                              CORRIGAN, Ai
                              <mark className="rounded-sm bg-info/15 px-px text-info underline decoration-info decoration-2 underline-offset-2">
                                e
                              </mark>
                              n Patrick
                            </>
                          ) : (
                            r.register
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {r.mismatch ? (
                            <span className="inline-flex items-center gap-1 font-medium text-info">
                              <FileWarning className="size-3.5" />
                              Mismatch
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-approve">
                              <CircleCheck className="size-3.5" />
                              Match
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* AI observation */}
              <section className="rounded-xl border border-line bg-[#f7f8f8] p-4">
                <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-slate uppercase">
                  <Sparkles className="size-3.5" />
                  Evidence One Intelligence · Advisory only
                </p>
                <p className="mt-2 text-[14px] font-medium">
                  Name does not match the Companies House register
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-graphite">
                  The passport chip reads AIDAN. The register holds AIDEN.
                  Identity details must match the register exactly, so this
                  verification is paused until the register is corrected.
                </p>
                <p className="mt-2 text-[11px] text-slate">
                  Source: passport chip data, Companies House officer record
                </p>
              </section>

              {/* Route B */}
              <section className="flex items-center gap-4 rounded-xl border border-line px-4 py-3">
                <span className="rounded-md bg-ink px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-paper uppercase">
                  Route B
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">
                    Correction task FL-2026-000042 · Form ACSP04
                  </p>
                  <p className="text-[12px] text-slate">
                    First name: Aiden to Aidan. Route A resumes once the
                    register is updated.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium">
                  Open task
                  <ArrowRight className="size-3.5" />
                </span>
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-xl border border-line p-4">
                <p className="text-[13px] font-medium">Identity checks</p>
                <p className="text-[11px] text-slate">
                  Certified identity provider · Option 1
                </p>
                <ul className="mt-3 space-y-2.5">
                  {checks.map(([label, value]) => (
                    <li
                      key={label}
                      className="flex items-center gap-2.5 text-[12.5px]"
                    >
                      <CompletionTick className="size-[18px]" />
                      <span className="flex-1">{label}</span>
                      <span className="text-slate">{value}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium">Decision</p>
                  <span className="font-mono text-[10px] tracking-[0.1em] text-slate uppercase">
                    Human only
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-[12.5px] font-medium">
                  <div className="flex items-center justify-between rounded-lg border border-line bg-mist px-3 py-2 text-slate">
                    <span className="inline-flex items-center gap-1.5">
                      <CircleCheck className="size-4" />
                      Approve
                    </span>
                    <Lock className="size-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-info/30 px-3 py-2 text-info">
                    <MessageSquareMore className="size-4" />
                    Request info
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg border border-decline/25 px-3 py-2 text-decline">
                    <CircleX className="size-4" />
                    Decline
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] leading-snug text-slate">
                  Approve unlocks once the register matches the identity
                  document.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
