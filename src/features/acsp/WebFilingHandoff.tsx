import { ExternalLink, Undo2 } from 'lucide-react'
import { useParams } from 'react-router'
import { Wordmark } from '@/components/brand/Wordmark'
import { HeldOptionBadge } from '@/components/HeldOption'
import { AccessRefused } from './AccessRefused'
import { Button } from '@/components/ui/button'
import { fileCorrection } from '@/store/actions'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'

/** Opens the Route B interstitial in its own window, as the live platform will. Returns false if blocked. */
export function openFilingHandoff(taskId: string): boolean {
  const w = window.open(
    `/handoff/filing/${encodeURIComponent(taskId)}`,
    'evidenceone-filing',
    'width=620,height=720',
  )
  return !!w
}

/**
  Evidence One-branded interstitial before the ACSP's own WebFiling account. It
  imitates no Companies House or GOV.UK page and holds no login or company
  authentication code.
*/
export function WebFilingInterstitial({
  taskId,
  onDone,
}: {
  taskId: string
  onDone?: () => void
}) {
  const { data, apply } = useDemoStore()
  const { acsp, reviewer } = useActingAcsp()
  const task = data.corrections.find((t) => t.id === taskId)
  const holder = data.cases.find((c) => c.id === task?.caseId)?.acspId
  const back = () => {
    apply((d) => fileCorrection(d, taskId, reviewer.id))
    if (onDone) onDone()
    else window.setTimeout(() => window.close(), 150)
  }
  if (task && holder && holder !== acsp.id)
    return <AccessRefused caseId={task.caseId} area="the filing handoff" />
  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Wordmark />
      <p className="mt-8 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">
        Evidence One · Leaving the platform
      </p>
      <HeldOptionBadge code="O2" className="mt-3" />
      <h1 className="mt-2 text-[1.75rem] leading-tight font-medium tracking-[-0.02em] text-ink">
        You are continuing outside Evidence One
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-graphite">
        In the live platform this opens Companies House WebFiling in a new
        window. You sign in with your own GOV.UK One Login and file for the
        company with its authentication code. Evidence One never sees your login
        or the company&rsquo;s authentication code.
      </p>
      <p className="mt-3 text-base leading-relaxed text-graphite">
        Copy each field from the prepared filing, file it, then come back to
        record the outcome against filing {task?.id ?? taskId}.
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-mist/60 px-5 py-4 text-base leading-relaxed text-graphite">
        <p className="flex items-center gap-2 font-medium text-ink">
          <ExternalLink className="size-4" aria-hidden="true" />
          This is a demonstration
        </p>
        <p className="mt-1">
          It does not show, imitate or connect to any GOV.UK or Companies House
          service.
        </p>
      </div>
      <Button size="lg" className="mt-8 w-full" onClick={back}>
        <Undo2 aria-hidden="true" />
        Simulate return: filing accepted
      </Button>
    </div>
  )
}

/** Route rendered in the new window, outside the portal chrome. */
export function WebFilingHandoffPage() {
  const { taskId = '' } = useParams()
  return (
    <main id="main" className="min-h-dvh bg-paper">
      <WebFilingInterstitial taskId={taskId} />
    </main>
  )
}
