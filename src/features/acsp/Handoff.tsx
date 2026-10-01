import { ExternalLink, Undo2 } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/button'
import { PRIMARY_REVIEWER_ID } from '@/data/organisations'
import { recordCorrection, returnFromSubmission } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'

export const SUBMIT_SERVICE = 'Tell Companies House you’ve verified someone’s identity'
export const CORRECT_SERVICE = 'Correct someone’s identity verification details'

/** Opens the handoff in a new window, as the live platform will. Returns false if the browser blocked it. */
export function openHandoff(caseId: string, kind: 'submission' | 'correction', correctionId?: string): boolean {
  const url = `/handoff/${caseId}?kind=${kind}${correctionId ? `&c=${encodeURIComponent(correctionId)}` : ''}`
  const w = window.open(url, 'evidenceone-handoff', 'width=620,height=720')
  return !!w
}

/**
  A plain, clearly Evidence One-branded interstitial. It explains what happens
  in the live platform and simulates the return. It never shows or imitates a
  GOV.UK or Companies House screen.
*/
export function HandoffInterstitial({ caseId, kind, correctionId, onDone }: { caseId: string; kind: 'submission' | 'correction'; correctionId?: string; onDone?: () => void }) {
  const { data, apply } = useDemoStore()
  const vc = data.cases.find((c) => c.id === caseId)
  const service = kind === 'submission' ? SUBMIT_SERVICE : CORRECT_SERVICE
  const back = () => {
    apply((d) => (kind === 'submission' ? returnFromSubmission(d, caseId, PRIMARY_REVIEWER_ID) : recordCorrection(d, caseId, correctionId ?? '', PRIMARY_REVIEWER_ID)))
    if (onDone) onDone()
    else window.setTimeout(() => window.close(), 150)
  }
  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Wordmark />
      <p className="mt-8 font-mono text-[0.8125rem] tracking-[0.14em] text-slate uppercase">Evidence One · Leaving the platform</p>
      <h1 className="mt-2 text-[1.75rem] leading-tight font-medium tracking-[-0.02em] text-ink">You are continuing outside Evidence One</h1>
      <p className="mt-4 text-lg leading-relaxed text-graphite">
        In the live platform this opens the Companies House service <span className="text-ink">‘{service}’</span>. You sign in with your own GOV.UK One Login.
      </p>
      <p className="mt-3 text-base leading-relaxed text-graphite">Copy each field from the {kind === 'submission' ? 'submission pack' : 'correction pack'} into the service, then come back to record the outcome against case {vc?.id ?? caseId}.</p>
      <div className="mt-6 rounded-2xl border border-line bg-mist/60 px-5 py-4 text-[0.9375rem] leading-relaxed text-graphite">
        <p className="flex items-center gap-2 font-medium text-ink">
          <ExternalLink className="size-4" aria-hidden="true" />
          This is a demonstration
        </p>
        <p className="mt-1">It does not show, imitate or connect to any GOV.UK or Companies House service.</p>
      </div>
      <Button size="lg" className="mt-8 w-full" onClick={back}>
        <Undo2 aria-hidden="true" />
        Simulate return to Evidence One
      </Button>
    </div>
  )
}

/** Route rendered in the new window, outside the portal chrome. */
export function HandoffPage() {
  const { caseId = '' } = useParams()
  const [params] = useSearchParams()
  const kind = params.get('kind') === 'correction' ? 'correction' : 'submission'
  return (
    <main id="main" className="min-h-dvh bg-paper">
      <HandoffInterstitial caseId={caseId} kind={kind} correctionId={params.get('c') ?? undefined} />
    </main>
  )
}
