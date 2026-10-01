import { ArrowLeft, ExternalLink, PenLine } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  Checkbox,
  Page,
  PageHeader,
  Panel,
  PanelHeader,
} from '@/components/app/Page'
import { StepUpDialog } from '@/components/app/StepUpDialog'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { OutcomeChip, RuleIdTag } from '@/components/StatusChip'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PRIMARY_REVIEWER_ID } from '@/data/organisations'
import { formatDateTime, fullName } from '@/lib/format'
import { handOffCorrection, startCorrection } from '@/store/actions'
import { useDemoStore } from '@/store/DemoStore'
import { getAcsp, getCase, getPerson } from '@/store/selectors'
import { CopyRow } from './CopyRow'
import { CORRECT_SERVICE, HandoffInterstitial, openHandoff } from './Handoff'
import { submissionPack } from './submissionPack'

/** Correct submitted details: a correction pack against the original case and verification reference. Never a second submission. */
export function Correction() {
  const { caseId = '' } = useParams()
  const { data, apply } = useDemoStore()
  const vc = getCase(data, caseId)
  const person = vc && getPerson(data, vc.personId)
  const acsp = vc && getAcsp(data, vc.acspId)
  const [picked, setPicked] = useState<Record<string, string>>({})
  const [stepUp, setStepUp] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const [inline, setInline] = useState(false)

  if (!vc || !person || !acsp) return <Page>Case not found.</Page>
  const reference = vc.submission?.verificationReference
  const back = (
    <Link
      to={`/acsp/cases/${vc.id}/submit`}
      className="mb-6 inline-flex items-center gap-1.5 text-base text-slate underline-offset-4 hover:text-ink hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Submission workspace
    </Link>
  )
  if (vc.status !== 'confirmed' || !reference) {
    return (
      <Page width="narrow">
        {back}
        <PageHeader
          title="Correction not available"
          description="A correction can only be prepared against a submitted case with a recorded verification reference."
        />
        <Panel className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
          <RuleIdTag id="SUB-03" />
          <OutcomeChip outcome="block" />
          <p className="text-[0.9375rem] text-graphite">
            No verification reference is recorded on this case yet.
          </p>
        </Panel>
      </Page>
    )
  }

  const pack = submissionPack(vc, person, acsp).filter(
    (f) =>
      ['name', 'former', 'dob', 'email'].includes(f.key) ||
      f.key.startsWith('doc-'),
  )
  const corrections = vc.submission?.corrections ?? []
  const active =
    corrections.find((c) => c.id === activeId) ??
    corrections.find((c) => !c.recordedAt)
  const chosen = Object.entries(picked).filter(([, v]) => v.trim())

  const build = (ref: string) => {
    const fields = chosen.map(([key, to]) => {
      const f = pack.find((x) => x.key === key)!
      return { label: f.label, from: f.value, to: to.trim() }
    })
    let id = ''
    apply((d) => {
      const r = startCorrection(d, vc.id, fields, PRIMARY_REVIEWER_ID, ref)
      id = r.correctionId
      return r
    })
    setActiveId(id || `${vc.id}-C${corrections.length + 1}`)
    setPicked({})
    setDone([])
  }

  const handoff = () => {
    if (!active) return
    apply((d) => handOffCorrection(d, vc.id, active.id, PRIMARY_REVIEWER_ID))
    if (!openHandoff(vc.id, 'correction', active.id)) setInline(true)
  }

  return (
    <Page width="narrow">
      {back}
      <PageHeader
        kicker={`Correct submitted details · ${vc.id}`}
        title={`Correct ${fullName(person)}’s submitted details`}
        description={`Against verification reference ${reference}. The outcome is recorded against the original case. This is a correction, never a second submission.`}
      />

      <div className="space-y-6">
        {active && !active.recordedAt ? (
          <>
            <Panel className="overflow-hidden">
              <PanelHeader
                title={`Correction pack ${active.id}`}
                description={`Original case ${vc.id} · verification reference ${reference}`}
              />
              <dl className="divide-y divide-line/70">
                <CopyRow
                  label="Verification reference"
                  value={reference}
                  done={done.includes('ref')}
                  onToggle={() =>
                    setDone((d) =>
                      d.includes('ref')
                        ? d.filter((x) => x !== 'ref')
                        : [...d, 'ref'],
                    )
                  }
                />
                {active.fields.map((f) => (
                  <CopyRow
                    key={f.label}
                    label={`${f.label} (corrected)`}
                    value={f.to}
                    done={done.includes(f.label)}
                    onToggle={() =>
                      setDone((d) =>
                        d.includes(f.label)
                          ? d.filter((x) => x !== f.label)
                          : [...d, f.label],
                      )
                    }
                  />
                ))}
              </dl>
              <p className="border-t border-line/70 px-5 py-3 text-[0.875rem] text-slate sm:px-6">
                Previously submitted:{' '}
                {active.fields
                  .map((f) => `${f.label.toLowerCase()} ${f.from}`)
                  .join('; ')}
                .
              </p>
            </Panel>
            <Panel className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
              <div className="flex-1">
                <p className="text-lg font-medium text-ink">
                  Make the correction
                </p>
                <p className="mt-1 text-base text-graphite">
                  You sign in to ‘{CORRECT_SERVICE}’ with your own GOV.UK One
                  Login.
                </p>
              </div>
              <Button size="lg" onClick={handoff}>
                Continue to GOV.UK One Login
                <ExternalLink aria-hidden="true" />
              </Button>
            </Panel>
          </>
        ) : (
          <Panel className="overflow-hidden">
            <PanelHeader
              title="What needs correcting?"
              description="Tick each detail that was submitted wrongly and enter the correct value."
            />
            <ul className="divide-y divide-line/70">
              {pack.map((f) => {
                const on = f.key in picked
                return (
                  <li key={f.key} className="px-5 py-4 sm:px-6">
                    <label className="flex cursor-pointer items-start gap-3">
                      <Checkbox
                        className="mt-0.5"
                        checked={on}
                        onChange={() =>
                          setPicked((p) => {
                            const next = { ...p }
                            if (on) delete next[f.key]
                            else next[f.key] = ''
                            return next
                          })
                        }
                      />
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] text-slate">
                          {f.group === 'The individual'
                            ? f.label
                            : `${f.group}: ${f.label.toLowerCase()}`}
                        </span>
                        <span className="block text-base break-words text-ink">
                          {f.value}
                        </span>
                      </span>
                    </label>
                    {on && (
                      <div className="mt-3 pl-9">
                        <label
                          htmlFor={`fix-${f.key}`}
                          className="text-[0.9375rem] font-medium text-ink"
                        >
                          Correct value
                        </label>
                        <input
                          id={`fix-${f.key}`}
                          value={picked[f.key]}
                          onChange={(e) =>
                            setPicked((p) => ({
                              ...p,
                              [f.key]: e.target.value,
                            }))
                          }
                          className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3.5 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/80 px-5 py-4 sm:px-6">
              <span className="text-[0.9375rem] text-slate">
                {chosen.length
                  ? `${chosen.length} detail${chosen.length === 1 ? '' : 's'} to correct`
                  : 'Nothing selected yet'}
              </span>
              <Button disabled={!chosen.length} onClick={() => setStepUp(true)}>
                <PenLine aria-hidden="true" />
                Build the correction pack
              </Button>
            </div>
          </Panel>
        )}

        {corrections.some((c) => c.recordedAt) && (
          <Panel className="overflow-hidden">
            <PanelHeader title="Corrections recorded on this case" />
            <ul className="divide-y divide-line/70">
              {corrections
                .filter((c) => c.recordedAt)
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-3 px-5 py-4 sm:px-6"
                  >
                    <CompletionTick
                      className="mt-0.5 size-5"
                      label="Recorded"
                    />
                    <div>
                      <p className="text-base text-ink">
                        <span className="font-mono">{c.id}</span> ·{' '}
                        {c.fields
                          .map((f) => `${f.label.toLowerCase()} to ${f.to}`)
                          .join('; ')}
                      </p>
                      <p className="text-[0.875rem] text-slate">
                        Recorded {formatDateTime(c.recordedAt!)} against{' '}
                        {reference}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          </Panel>
        )}
      </div>

      <StepUpDialog
        open={stepUp}
        action="prepare a correction to submitted details"
        onClose={() => setStepUp(false)}
        onConfirmed={(ref) => {
          setStepUp(false)
          build(ref)
        }}
      />
      <Dialog open={inline} onOpenChange={setInline}>
        <DialogContent className="rounded-[24px] p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">
            Continuing outside Evidence One
          </DialogTitle>
          {active && (
            <HandoffInterstitial
              caseId={vc.id}
              kind="correction"
              correctionId={active.id}
              onDone={() => setInline(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Page>
  )
}
