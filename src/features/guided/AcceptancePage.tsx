import { CheckCircle2, Hourglass, Play, Shapes } from 'lucide-react'
import { Link } from 'react-router'
import { Page, PageHeader, Panel, PanelHeader } from '@/components/app/Page'
import { ProviderConfirmation } from '@/components/ProviderConfirmation'
import {
  ACCEPTANCE_STATEMENT,
  acceptanceScenarios,
  SCENARIO_STATUS_LABEL,
  type ScenarioStatus,
} from '@/data/acceptanceScenarios'
import { Button } from '@/components/ui/button'
import { personas } from '@/store/personas'
import { useDemoStore } from '@/store/DemoStore'
import { acceptanceSteps } from './steps'

/*
  Presenter only. Not linked from any persona navigation: it opens from the
  Guided demo menu in the presenter bar. The client wants Gate 2 accepted as a
  working, testable end-to-end verification workflow. Each deep link switches
  persona and ACSP so the scenario can be walked through screen by screen.
*/

const personaLabel = (id: string) =>
  personas.find((p) => p.id === id)?.label ?? id

function StatusBadge({ status }: { status: ScenarioStatus }) {
  if (status === 'depends')
    return <ProviderConfirmation label={SCENARIO_STATUS_LABEL[status]} />
  const Icon = status === 'shown' ? CheckCircle2 : Shapes
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-0.5 text-[0.8125rem] font-medium whitespace-nowrap text-graphite">
      <Icon className="size-3.5" aria-hidden="true" />
      {SCENARIO_STATUS_LABEL[status]}
    </span>
  )
}

export function AcceptancePage() {
  const { setPersona, setAcsp, setGuided } = useDemoStore()
  return (
    <Page width="narrow">
      <PageHeader
        kicker="Presenter only"
        title="Gate 2 acceptance scenarios"
        description={`${ACCEPTANCE_STATEMENT} The client asked for a working end-to-end verification workflow, not isolated features. Each scenario below opens its screens.`}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setGuided({ on: true, step: 0, track: 'acceptance' })}
        >
          <Play aria-hidden="true" />
          Start the Gate 2 acceptance walkthrough, {acceptanceSteps.length}{' '}
          steps
        </Button>
      </div>
      <ol className="space-y-6">
        {acceptanceScenarios.map((s) => (
          <li key={s.number}>
            <Panel aria-labelledby={`scn-${s.number}`}>
              <PanelHeader
                id={`scn-${s.number}`}
                title={`${s.number}. ${s.title}`}
                actions={<StatusBadge status={s.status} />}
              />
              <div className="space-y-4 px-5 py-4 sm:px-6">
                <p className="text-[0.9375rem] text-slate">
                  Persona: {personaLabel(s.persona)}
                </p>
                <div>
                  <h3 className="text-[0.9375rem] font-medium text-ink">
                    Screens to open
                  </h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {s.screens.map((screen) => (
                      <li
                        key={
                          screen.route + screen.label + (screen.acspId ?? '')
                        }
                      >
                        <Link
                          to={screen.route}
                          onClick={() => {
                            setPersona(screen.persona)
                            if (screen.acspId) setAcsp(screen.acspId)
                          }}
                          className="inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-3 py-1.5 text-base text-ink hover:border-silver focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none"
                        >
                          {screen.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <dl className="grid gap-3 text-[0.9375rem] sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-ink">What is simulated</dt>
                    <dd className="mt-1 text-graphite">{s.simulated}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 font-medium text-ink">
                      <Hourglass className="size-3.5" aria-hidden="true" />
                      What depends on a provider
                    </dt>
                    <dd className="mt-1 text-graphite">
                      {s.dependsOnProvider}
                    </dd>
                  </div>
                </dl>
              </div>
            </Panel>
          </li>
        ))}
      </ol>
    </Page>
  )
}
