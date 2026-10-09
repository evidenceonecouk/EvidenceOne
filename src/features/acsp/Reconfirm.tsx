import { CalendarCheck, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import {
  Checkbox,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
} from '@/components/app/Page'
import { useToast } from '@/components/app/Toaster'
import { AcspStatusChip, RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { reconfirmStatus } from '@/lib/reconfirm'
import { reconfirmAcsp } from '@/store/acspActions'
import { useActingAcsp, useDemoStore } from '@/store/DemoStore'

const DECLARATIONS = [
  'The information above is accurate and complete.',
  'I will tell Evidence One promptly if my ACSP registration, my AML supervision or my professional indemnity cover changes.',
  'I understand that an ACSP that has not reconfirmed on time has new allocation paused until it does.',
]

/** Yearly reconfirmation of regulatory information (12 months, proposed). */
export function Reconfirm() {
  const { acsp, reviewer } = useActingAcsp()
  const { apply } = useDemoStore()
  const toast = useToast()
  const s = reconfirmStatus(acsp.monitoring)
  const [refOk, setRefOk] = useState(false)
  const [amlOk, setAmlOk] = useState(false)
  const [changes, setChanges] = useState('')
  const [declared, setDeclared] = useState<boolean[]>(
    DECLARATIONS.map(() => false),
  )
  const [doneAt, setDoneAt] = useState<string>()

  const ready = refOk && amlOk && declared.every(Boolean)

  const submit = () => {
    apply((d) =>
      reconfirmAcsp(d, acsp.id, { reviewerId: reviewer.id, changes }),
    )
    setDoneAt(new Date().toISOString())
    toast({
      title: 'Reconfirmed',
      description: 'Your next reconfirmation is due in 12 months.',
    })
  }

  return (
    <Page width="narrow">
      <PageHeader
        kicker="ACSP reconfirmation"
        title="Reconfirm your details"
        description="Every ACSP confirms each year that its regulatory information is still current. This takes a minute. The reconfirmation is written to your audit trail."
      />

      <div className="space-y-6">
        <Panel className="p-5 sm:p-6">
          <dl className="grid gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-base text-slate">Last reconfirmed</dt>
              <dd className="mt-1 text-lg font-medium text-ink">
                {formatDate(acsp.monitoring.lastReconfirmedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-base text-slate">Next due</dt>
              <dd className="mt-1 text-lg font-medium text-ink">
                {formatDate(acsp.monitoring.nextReconfirmationDue)}
              </dd>
              <dd className="text-base text-slate">
                {s.overdue
                  ? `${Math.abs(s.days)} days overdue`
                  : `In ${s.days} days`}
              </dd>
            </div>
            <div>
              <dt className="text-base text-slate">New allocation</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2 text-lg font-medium text-ink">
                {s.overdue ? 'Paused' : 'Open'}
                <RuleIdTag id={s.overdue ? 'ACSP-11' : 'ACSP-10'} />
              </dd>
              <dd className="mt-1">
                <AcspStatusChip status={acsp.status} />
              </dd>
            </div>
          </dl>
          {s.overdue && (
            <p className="mt-5 rounded-xl bg-info-wash px-4 py-3 text-base leading-relaxed text-graphite">
              Reconfirmation is overdue, so new cases are not allocated to{' '}
              {acsp.name} until you reconfirm (ACSP-11). Cases that are already
              open are not affected.
            </p>
          )}
        </Panel>

        {doneAt ? (
          <Panel className="p-6 sm:p-8" role="status">
            <div className="flex items-start gap-4">
              <CalendarCheck
                className="mt-1 size-7 shrink-0 text-approve"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-xl font-medium text-ink">
                  Thank you, {acsp.name} has reconfirmed
                </h2>
                <p className="mt-2 text-base leading-relaxed text-graphite">
                  Recorded on {formatDate(doneAt)}. Your next reconfirmation is
                  due on {formatDate(acsp.monitoring.nextReconfirmationDue)}.
                  {s.overdue && ' New allocation is open again.'}
                </p>
                <Button asChild className="mt-5">
                  <Link to="/acsp/queue">Back to the review queue</Link>
                </Button>
              </div>
            </div>
          </Panel>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (ready) submit()
            }}
            className="space-y-6"
          >
            <Panel className="overflow-hidden">
              <PanelHeader
                title="Confirm your regulatory details"
                description="Tick each one if it is still current."
              />
              <div className="divide-y divide-line/70">
                <label className="flex cursor-pointer items-start gap-4 px-5 py-4 sm:px-6">
                  <Checkbox
                    className="mt-1"
                    checked={refOk}
                    onChange={(e) => setRefOk(e.target.checked)}
                  />
                  <span>
                    <span className="block text-base text-slate">
                      ACSP reference
                    </span>
                    <span className="block font-mono text-lg text-ink">
                      {acsp.acspNumber}
                    </span>
                    <span className="block text-base text-graphite">
                      This is current.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-4 px-5 py-4 sm:px-6">
                  <Checkbox
                    className="mt-1"
                    checked={amlOk}
                    onChange={(e) => setAmlOk(e.target.checked)}
                  />
                  <span>
                    <span className="block text-base text-slate">
                      AML supervisor and number
                    </span>
                    <span className="block text-lg text-ink">
                      {acsp.supervisor}{' '}
                      <span className="font-mono">{acsp.supervisorNumber}</span>
                    </span>
                    <span className="block text-base text-graphite">
                      This is current.
                    </span>
                  </span>
                </label>
              </div>
              <div className="border-t border-line/80 px-5 py-4 sm:px-6">
                <label
                  htmlFor="reconfirm-changes"
                  className="text-base font-medium text-ink"
                >
                  Anything that has changed (optional)
                </label>
                <textarea
                  id="reconfirm-changes"
                  rows={3}
                  value={changes}
                  onChange={(e) => setChanges(e.target.value)}
                  placeholder="For example, a new AML supervisor number or a change of firm address."
                  className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                />
                <p className="mt-1.5 text-base text-slate">
                  An administrator reviews any change before it takes effect.
                </p>
              </div>
            </Panel>

            <Panel className="overflow-hidden">
              <PanelHeader title="Declarations" />
              <ul className="divide-y divide-line/70">
                {DECLARATIONS.map((text, i) => (
                  <li key={text}>
                    <label className="flex cursor-pointer items-start gap-4 px-5 py-4 sm:px-6">
                      <Checkbox
                        className="mt-0.5"
                        checked={declared[i]}
                        onChange={(e) =>
                          setDeclared((d) =>
                            d.map((v, j) => (j === i ? e.target.checked : v)),
                          )
                        }
                      />
                      <span className="text-base leading-relaxed text-ink">
                        {text}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </Panel>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" disabled={!ready}>
                <ShieldCheck aria-hidden="true" />
                Reconfirm my details
              </Button>
              {!ready && (
                <span className="text-base text-slate">
                  Tick both details and all three declarations to continue.
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </Page>
  )
}
