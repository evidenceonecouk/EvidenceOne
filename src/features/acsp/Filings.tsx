import { ArrowRight, Building2, FileOutput, RefreshCw, Waypoints } from 'lucide-react'
import { Link } from 'react-router'
import { HeroBanner, MonoLabel, Page, Panel } from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { Stepper } from '@/components/app/Stepper'
import { Button } from '@/components/ui/button'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { formatDateTime, fullName } from '@/lib/format'
import { fileCorrection, registerUpdated } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { getCompany, getPerson } from '@/store/selectors'
import type { CorrectionTask } from '@/types/domain'

const STEPS = ['Task opened', 'ACSP04 filed', 'Register updated', 'Verification resumes']
const stepIndex: Record<CorrectionTask['status'], number> = { open: 1, filed: 2, register_updated: 4 }

/** Route B: Companies House filings, including the register corrections that unblock Route A. */
export function Filings() {
  const { data } = useDemoStore()
  const tasks = [...data.corrections].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <Page>
      <HeroBanner
        kicker="Route B · Filings"
        title="Register corrections"
        description="When identity details do not match the register, the verification pauses and an ACSP04 correction is filed here. Once Companies House updates the register, the verification carries on."
        illustration={
          <div className="flex size-44 items-center justify-center rounded-[32px] bg-white/70 shadow-[0_20px_40px_-24px_rgb(22_24_27/0.35)]">
            <Waypoints className="size-20 text-ink" strokeWidth={1.25} aria-hidden="true" />
          </div>
        }
      />
      <div className="space-y-6">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
        {tasks.length === 0 && (
          <Panel className="p-10 text-center text-base text-slate">No filings yet. Corrections appear here when a reviewer pauses a case for a register mismatch.</Panel>
        )}
      </div>
    </Page>
  )
}

function TaskCard({ task }: { task: CorrectionTask }) {
  const { data, apply } = useDemoStore()
  const toast = useToast()
  const person = getPerson(data, task.personId)!
  const company = getCompany(data, task.companyNumber)!
  const name = fullName(person)

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 border-b border-line/80 px-5 py-5 sm:px-6">
        <span className="rounded-lg bg-ink px-2.5 py-1 font-mono text-[0.8125rem] tracking-[0.1em] text-paper uppercase">Route B</span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-medium text-ink">
            {task.id} · Form {task.form} correction
          </p>
          <p className="text-[0.9375rem] text-slate">Opened {formatDateTime(task.createdAt)} for case {task.caseId}</p>
        </div>
        <Stepper steps={STEPS} current={stepIndex[task.status]} />
      </div>
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1fr_auto]">
        <div className="flex items-center gap-3">
          <Avatar seed={task.personId} name={name} size={44} />
          <div>
            <p className="text-base font-medium text-ink">{name}</p>
            <p className="flex items-center gap-1.5 text-[0.9375rem] text-slate">
              <CompanyMark name={company.name} size={18} className="rounded-[5px]" />
              {company.name}
            </p>
          </div>
        </div>
        <div>
          <MonoLabel>{task.field}</MonoLabel>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-decline-wash px-3 py-1.5 font-mono text-[0.9375rem] text-decline line-through decoration-decline/60">{task.registerValue}</span>
            <ArrowRight className="size-4 text-slate" aria-hidden="true" />
            <span className="rounded-lg bg-approve-wash px-3 py-1.5 font-mono text-[0.9375rem] text-approve">{task.correctValue}</span>
          </div>
          <p className="mt-2 text-[0.875rem] text-slate">Correct value taken from the passport chip.</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 lg:w-64">
          {task.status === 'open' && (
            <Button
              onClick={() => {
                apply((d) => fileCorrection(d, task.id, 'rev-marsh'))
                toast({ title: 'ACSP04 filed', description: 'Waiting for Companies House to update the register.' })
              }}
            >
              <FileOutput aria-hidden="true" />
              File ACSP04 correction
            </Button>
          )}
          {task.status === 'filed' && (
            <>
              <p className="text-[0.9375rem] text-graphite">Filed {task.filedAt && formatDateTime(task.filedAt)}.</p>
              <Button
                onClick={() => {
                  apply((d) => registerUpdated(d, task.id))
                  toast({ title: 'Register updated', description: 'The verification is back in the review queue.' })
                }}
              >
                <RefreshCw aria-hidden="true" />
                Simulate register update
              </Button>
            </>
          )}
          {task.status === 'register_updated' && (
            <Button asChild variant="outline">
              <Link to={`/acsp/cases/${task.caseId}`}>
                <Building2 aria-hidden="true" />
                Back to the case
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Panel>
  )
}
