import { CheckCircle2 } from 'lucide-react'
import { Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { PendingDecision } from '@/components/PendingDecision'
import { ProviderConfirmation } from '@/components/ProviderConfirmation'
import { changedPoints, decidedPoints, openPoints } from '@/data/decisions'
import {
  identityPresenterNotes,
  platformPresenterNotes,
} from '@/data/presenterNotes'

/*
  Presenter only. Not linked from any persona navigation: it opens from the
  Guided demo menu in the presenter bar. Decided points show the date; open
  points carry "Pending your decision" and nothing here chooses.
*/

function Code({ code }: { code?: string }) {
  return (
    <span className="font-mono text-[0.9375rem] text-slate">{code ?? ''}</span>
  )
}

export function DecisionsPage() {
  return (
    <Page width="narrow">
      <PageHeader
        kicker="Presenter only"
        title="Decisions and open points"
        description="What the client has decided, with the date, and what is still open. Open points are built as settings and marked Pending your decision."
      />
      <div className="space-y-6">
        <Panel aria-labelledby="g-open">
          <PanelHeader
            id="g-open"
            title="Still open"
            description="Each is built as a setting. Nothing is chosen on the client’s behalf."
          />
          <ul className="divide-y divide-line/80">
            {openPoints.map((p) => (
              <li
                key={p.title}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:gap-5 sm:px-6"
              >
                <Code code={p.code} />
                <div className="min-w-0">
                  <h3 className="text-[1.0625rem] font-medium text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-slate">
                    {p.summary}
                  </p>
                </div>
                {p.providerConfirmation ? (
                  <ProviderConfirmation className="w-fit" />
                ) : (
                  <PendingDecision code={p.code} className="w-fit" />
                )}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel aria-labelledby="g-notes">
          <PanelHeader
            id="g-notes"
            title="Presenter notes: identity provider journey"
            description="Not shown on any client-facing screen."
          />
          <ul className="divide-y divide-line/80">
            {identityPresenterNotes.map((n) => (
              <li key={n.title} className="px-5 py-4 sm:px-6">
                <h3 className="text-[1.0625rem] font-medium text-ink">
                  {n.title}
                </h3>
                <p className="mt-1 text-base leading-relaxed text-slate">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel aria-labelledby="g-notes2">
          <PanelHeader
            id="g-notes2"
            title="Presenter notes: payments, messages and corrections"
            description="Not shown on any client-facing screen."
          />
          <ul className="divide-y divide-line/80">
            {platformPresenterNotes.map((n) => (
              <li key={n.title} className="px-5 py-4 sm:px-6">
                <h3 className="text-[1.0625rem] font-medium text-ink">
                  {n.title}
                </h3>
                <p className="mt-1 text-base leading-relaxed text-slate">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel aria-labelledby="g-changed">
          <PanelHeader
            id="g-changed"
            title="Changed after being decided"
            description="The client reversed or changed these after deciding them."
          />
          <ul className="divide-y divide-line/80">
            {changedPoints.map((p) => (
              <li
                key={p.title}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[4.5rem_1fr] sm:gap-5 sm:px-6"
              >
                <Code code={p.code} />
                <div className="min-w-0">
                  <h3 className="text-[1.0625rem] font-medium text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-slate">
                    {p.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel aria-labelledby="g-decided">
          <PanelHeader id="g-decided" title="Decided" />
          <ul className="divide-y divide-line/80">
            {decidedPoints.map((p) => (
              <li
                key={p.title}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:gap-5 sm:px-6"
              >
                <Code code={p.code} />
                <div className="min-w-0">
                  <h3 className="text-[1.0625rem] font-medium text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-base leading-relaxed text-slate">
                    {p.summary}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap text-graphite">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Decided {p.decided}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Page>
  )
}
