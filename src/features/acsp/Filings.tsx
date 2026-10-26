import { LATER_FILING_CODE_LINE } from '@/lib/codeWarning'
import {
  ArrowRight,
  Building2,
  CircleCheck,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import {
  HeroBanner,
  MonoLabel,
  Page,
  Panel,
  PanelHeader,
} from '@/components/app/Page'
import { Stepper } from '@/components/app/Stepper'
import { useToast } from '@/components/app/Toaster'
import { HeldOptionBadge } from '@/components/HeldOption'
import { PendingDecision } from '@/components/PendingDecision'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Avatar, CompanyMark } from '@/components/visual/Avatar'
import { formatDateTime, fullName } from '@/lib/format'
import { handOffFiling } from '@/store/acspActions'
import { registerUpdated } from '@/store/actions'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'
import { getCompany, getPerson } from '@/store/selectors'
import type { CorrectionTask } from '@/types/domain'
import { CopyRow } from './CopyRow'
import { filingPack } from './filingPack'
import { RouteBGate } from './RouteBGate'
import { openFilingHandoff, WebFilingInterstitial } from './WebFilingHandoff'

const STEPS = ['Prepared and checked', 'Filed by the ACSP', 'Register updated']
const stepIndex: Record<CorrectionTask['status'], number> = {
  open: 0,
  filed: 2,
  register_updated: 3,
}

/** Route B: Companies House filings, prepared and checked here, filed by the ACSP from its own WebFiling account. */
export function Filings() {
  return (
    <RouteBGate>
      <FilingsList />
    </RouteBGate>
  )
}

function FilingsList() {
  const { data } = useDemoStore()
  const { acsp } = useActingAcsp()
  const tasks = data.corrections
    .filter((t) => {
      const vc = data.cases.find((c) => c.id === t.caseId)
      return !vc || vc.acspId === acsp.id
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return (
    <Page>
      <HeroBanner
        kicker="Route B · Filings"
        title="Register corrections"
        description="Evidence One prepares and checks the filing. You file it from your own Companies House WebFiling account. A register correction does not pause a verification: Route A carries on."
        meta={
          <>
            <HeldOptionBadge code="O2" />
            <span className="text-base text-slate">
              Available on subscription plans. The platform prepares and checks,
              the ACSP files.
            </span>
          </>
        }
      />
      <div className="space-y-6">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
        {tasks.length === 0 && (
          <Panel className="p-10 text-center text-base text-slate">
            No filings yet. A task appears here when a genuine register
            correction is needed.
          </Panel>
        )}
      </div>
    </Page>
  )
}

function TaskCard({ task }: { task: CorrectionTask }) {
  const { data, apply } = useDemoStore()
  const { reviewer } = useActingAcsp()
  const toast = useToast()
  const person = getPerson(data, task.personId)!
  const company = getCompany(data, task.companyNumber)!
  const name = fullName(person)
  const { fields, checks } = filingPack(data, task)
  const [done, setDone] = useState<string[]>([])
  const [inline, setInline] = useState(false)
  const toggle = (k: string) =>
    setDone((d) => (d.includes(k) ? d.filter((x) => x !== k) : [...d, k]))

  const handoff = () => {
    apply((d) => handOffFiling(d, task.id, reviewer.id))
    if (!openFilingHandoff(task.id)) setInline(true)
  }

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-4 border-b border-line/80 px-5 py-5 sm:px-6">
        <span className="rounded-lg bg-ink px-2.5 py-1 font-mono text-[0.8125rem] tracking-[0.1em] text-paper uppercase">
          Route B
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-medium text-ink">
            {task.id} · Register correction
          </p>
          <p className="text-base text-slate">
            Opened {formatDateTime(task.createdAt)} from case {task.caseId}
          </p>
        </div>
        <Stepper steps={STEPS} current={stepIndex[task.status]} />
      </div>
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
        <div className="flex items-center gap-3">
          <Avatar seed={task.personId} name={name} size={44} />
          <div>
            <p className="text-base font-medium text-ink">{name}</p>
            <p className="flex items-center gap-1.5 text-base text-slate">
              <CompanyMark
                name={company.name}
                size={18}
                className="rounded-[5px]"
              />
              {company.name}
            </p>
          </div>
        </div>
        <div>
          <MonoLabel>{task.field}</MonoLabel>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-decline-wash px-3 py-1.5 font-mono text-[0.9375rem] text-decline line-through decoration-decline/60">
              {task.registerValue}
            </span>
            <ArrowRight className="size-4 text-slate" aria-hidden="true" />
            <span className="rounded-lg bg-approve-wash px-3 py-1.5 font-mono text-[0.9375rem] text-approve">
              {task.correctValue}
            </span>
          </div>
        </div>
      </div>

      {task.status === 'open' && (
        <div className="space-y-6 border-t border-line/80 p-5 sm:p-6">
          <div className="overflow-hidden rounded-2xl border border-line/80">
            <PanelHeader
              title="Prepared filing"
              description="Fields in the order WebFiling asks for them. Copy each one, then tick it when entered."
            />
            <dl className="divide-y divide-line/70">
              {fields.map((f) => (
                <CopyRow
                  key={f.key}
                  label={f.label}
                  value={f.value}
                  copyable={!f.filerEntered}
                  done={done.includes(f.key)}
                  onToggle={() => toggle(f.key)}
                />
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-lg font-medium text-ink">Checks passed</h3>
            <ul className="mt-2 space-y-2">
              {checks.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-2.5 text-base text-graphite"
                >
                  <CircleCheck
                    className="mt-0.5 size-5 shrink-0 text-approve"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="sr-only">Passed: </span>
                    {c}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl bg-mist/60 p-5 sm:flex-row sm:items-center">
            <p className="flex-1 text-base leading-relaxed text-graphite">
              You sign in to WebFiling with your own GOV.UK One Login and enter
              the company authentication code yourself. Evidence One never sees
              either. {LATER_FILING_CODE_LINE} Filing form shown as {task.form}.{' '}
              <PendingDecision code="P5" className="ml-1" />
            </p>
            <Button size="lg" onClick={handoff}>
              Continue to Companies House WebFiling
              <ExternalLink aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {task.status === 'filed' && (
        <div className="flex flex-col gap-4 border-t border-line/80 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex-1 text-base text-graphite">
            <p className="flex items-center gap-2 font-medium text-ink">
              <CircleCheck className="size-5 text-approve" aria-hidden="true" />
              Filing accepted
            </p>
            <p className="mt-1">
              Filing reference{' '}
              <span className="font-mono text-ink">{task.filingReference}</span>
              , recorded {task.filedAt && formatDateTime(task.filedAt)}. Waiting
              for Companies House to update the register.
            </p>
          </div>
          <Button
            onClick={() => {
              apply((d) => registerUpdated(d, task.id))
              toast({
                title: 'Register updated',
                description:
                  'The register now matches. Route A was not paused.',
              })
            }}
          >
            <RefreshCw aria-hidden="true" />
            Simulate register update
          </Button>
        </div>
      )}

      {task.status === 'register_updated' && (
        <div className="flex flex-col gap-4 border-t border-line/80 p-5 sm:flex-row sm:items-center sm:p-6">
          <p className="flex-1 text-base text-graphite">
            Filing reference{' '}
            <span className="font-mono text-ink">{task.filingReference}</span>.
            Register updated {task.updatedAt && formatDateTime(task.updatedAt)}.
          </p>
          <Button asChild variant="outline">
            <Link to={`/acsp/cases/${task.caseId}`}>
              <Building2 aria-hidden="true" />
              Back to the case
            </Link>
          </Button>
        </div>
      )}

      <Dialog open={inline} onOpenChange={setInline}>
        <DialogContent className="rounded-[24px] p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">
            Continuing outside Evidence One
          </DialogTitle>
          <WebFilingInterstitial
            taskId={task.id}
            onDone={() => setInline(false)}
          />
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
