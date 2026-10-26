import { FileUp, HelpCircle, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CompletionTick } from '@/components/brand/CompletionTick'
import { HeldOptionBadge } from '@/components/HeldOption'
import { Button } from '@/components/ui/button'
import { ModelTag, AI_LABEL } from '@/components/visual/AiObservationCard'
import { Checkbox } from '@/components/app/Page'
import { getStrings } from '@/data/i18n'
import { answerHelper, helperChips, type HelperReply } from '@/lib/languageHelp'
import { currentRuleSet } from '@/lib/rules'
import { cn } from '@/lib/utils'
import { useDemoStore, useShowHeldOptions } from '@/store/DemoStore'
import {
  logHelperExchange,
  recordSupportingUpload,
  type SupportingUploadInput,
} from '@/store/finishActions'
import type { SupportingEvidenceType } from '@/types/domain'
import { RedactionPreview } from './RedactionPreview'

export const ACCEPTED_DOCUMENTS: {
  type: SupportingEvidenceType
  label: string
  file: string
}[] = [
  {
    type: 'bank_statement',
    label: 'Bank or credit card statement with recent transactions',
    file: 'bank-statement-september.pdf',
  },
  {
    type: 'utility_bill',
    label: 'Utility or council tax bill',
    file: 'council-tax-bill.pdf',
  },
  {
    type: 'insurance',
    label: 'Insurance policy document showing your home address',
    file: 'home-insurance-policy.pdf',
  },
  {
    type: 'passport_use',
    label: 'Evidence of recent passport use',
    file: 'passport-use-evidence.pdf',
  },
]

/**
  Simulated upload of one supporting document with an AI date check, and for a
  bank statement the optional redaction (O3). Nothing is read from the file; the
  demo shows what the platform would do. The original is never stored.
*/
export function SupportingUpload({
  caseId,
  purpose,
  holder,
  address,
  done,
  onUploaded,
}: {
  caseId: string
  purpose: SupportingUploadInput['purpose']
  holder: string
  address: string
  done: boolean
  /** Overrides the default recording action (used to answer an information request). */
  onUploaded?: (input: Omit<SupportingUploadInput, 'purpose'>) => void
}) {
  const { data, apply } = useDemoStore()
  // Bank statement redaction is option O3, held until after go-live.
  const held = useShowHeldOptions()
  const months = currentRuleSet(data).params.supporting_evidence_months
  const saved = data.cases
    .find((c) => c.id === caseId)
    ?.journey?.supportingItems?.find(
      (i) => i.id === `ev-${caseId}-${purpose === 'address' ? 'addr' : 'sup'}`,
    )
  const [type, setType] = useState<SupportingEvidenceType>(
    saved?.supportingType ?? 'bank_statement',
  )
  const [phase, setPhase] = useState<'idle' | 'checking' | 'checked'>(
    done ? 'checked' : 'idle',
  )
  const [resolved, setResolved] = useState(done ? 3 : 0)
  const [previewing, setPreviewing] = useState(false)
  const [confirmed, setConfirmed] = useState(!!saved?.redaction)
  const [fileName, setFileName] = useState(saved?.label ?? '')
  const [redactionChoice, setRedactionChoice] = useState<'none' | 'redacted'>(
    saved?.redaction ? 'redacted' : 'none',
  )
  const input = useRef<HTMLInputElement>(null)
  const checks = [
    `Issue date is within the last ${months} months`,
    'Your name appears on it',
    'Your current address appears on it',
  ]
  const doc = ACCEPTED_DOCUMENTS.find((d) => d.type === type)!
  const ageDays = 18

  const record = (redacted: boolean) => {
    const payload = {
      supportingType: type,
      fileLabel: doc.label.split(' with ')[0].split(' showing')[0],
      ageDays,
      redacted,
    }
    if (onUploaded) onUploaded(payload)
    else
      apply((d) => recordSupportingUpload(d, caseId, { ...payload, purpose }))
  }

  useEffect(() => {
    if (phase !== 'checking') return
    if (resolved >= checks.length) {
      setPhase('checked')
      if (type !== 'bank_statement' || !held) record(false)
      return
    }
    const id = window.setTimeout(() => setResolved((r) => r + 1), 600)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, resolved])

  const start = (name: string) => {
    setFileName(name)
    setResolved(0)
    setConfirmed(false)
    setPreviewing(false)
    setRedactionChoice('none')
    setPhase('checking')
  }

  return (
    <div>
      <fieldset className="mt-4">
        <legend className="text-[0.9375rem] font-medium text-ink">
          What are you uploading? Any one of these, dated within the last{' '}
          {months} months.
        </legend>
        <div className="mt-2 space-y-2">
          {ACCEPTED_DOCUMENTS.map((d) => (
            <label
              key={d.type}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-white px-3 py-2 text-[0.9375rem] text-ink has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ink',
                type === d.type ? 'border-ink' : 'border-line',
              )}
            >
              <input
                type="radio"
                name={`type-${purpose}`}
                checked={type === d.type}
                disabled={phase === 'checking'}
                onChange={() => {
                  setType(d.type)
                  if (phase === 'checked') setPhase('idle')
                }}
                className="size-4 accent-ink"
              />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>

      {phase === 'idle' && (
        <div className="mt-4 flex flex-col gap-2">
          <Button size="lg" onClick={() => start(doc.file)}>
            <FileUp aria-hidden="true" />
            Upload a sample document
          </Button>
          <input
            ref={input}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) start(f.name)
            }}
          />
          <Button variant="outline" onClick={() => input.current?.click()}>
            Choose a file from this device
          </Button>
          <p className="text-sm text-slate">
            Demonstration only. The file is not read or stored.
          </p>
        </div>
      )}

      {phase !== 'idle' && (
        <div
          className="mt-4 rounded-2xl border border-line bg-white p-4"
          aria-live="polite"
        >
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] font-medium text-graphite">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {AI_LABEL}
            <ModelTag />
          </p>
          <p className="mt-2 text-base font-medium break-all text-ink">
            {fileName}
          </p>
          <ul className="mt-3 space-y-2">
            {checks.map((c, i) => (
              <li
                key={c}
                className="flex items-center gap-2.5 text-[0.9375rem]"
              >
                {i < resolved ? (
                  <CompletionTick className="size-5" label="Looks right" />
                ) : (
                  <Loader2
                    className="size-5 animate-spin text-slate"
                    aria-label="Checking"
                  />
                )}
                <span className={i < resolved ? 'text-ink' : 'text-slate'}>
                  {c}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate">
            Your ACSP reviews this. The AI only points things out. It never
            approves or declines.
          </p>
        </div>
      )}

      {phase === 'checked' && type === 'bank_statement' && held && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-4">
          <p className="flex flex-wrap items-center gap-2">
            <HeldOptionBadge code="O3" />
            <span className="text-base font-medium text-ink">
              Hide amounts and payees
            </span>
          </p>
          <p className="mt-1 text-[0.9375rem] text-graphite">
            Optional. Your ACSP then only sees a copy with transaction amounts
            and payees masked.
          </p>
          {redactionChoice === 'none' && (
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" onClick={() => setPreviewing(true)}>
                Preview the redacted copy
              </Button>
              {!saved && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    record(false)
                    setPreviewing(false)
                    setRedactionChoice('none')
                    setConfirmed(false)
                  }}
                >
                  No thanks, send it as it is
                </Button>
              )}
              {saved && !saved.redaction && (
                <p className="text-sm text-slate" role="status">
                  Saved as it is.
                </p>
              )}
            </div>
          )}
          {previewing && redactionChoice === 'none' && (
            <div className="mt-3 space-y-3">
              <RedactionPreview
                holder={holder}
                address={address}
                issuedOn="12 September 2026"
              />
              <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-ink">
                <Checkbox
                  className="mt-0.5"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I have previewed it and I confirm this copy is what my ACSP
                should receive.
              </label>
              <Button
                disabled={!confirmed}
                onClick={() => {
                  record(true)
                  setRedactionChoice('redacted')
                  setPreviewing(false)
                }}
              >
                Confirm the redaction
              </Button>
            </div>
          )}
          {redactionChoice === 'redacted' && (
            <p
              className="mt-3 flex items-center gap-2 text-[0.9375rem] text-ink"
              role="status"
            >
              <CompletionTick className="size-5" label="Confirmed" />
              Redaction confirmed by you. Only the redacted copy is passed to
              your ACSP and kept.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** True once the upload is recorded: any non-bank type after the check, or a bank statement after a choice. */
export function uploadRecorded(
  data: ReturnType<typeof useDemoStore>['data'],
  caseId: string,
  purpose: 'address' | 'evidence',
) {
  return !!data.cases
    .find((c) => c.id === caseId)
    ?.journey?.supportingItems?.some(
      (i) => i.id === `ev-${caseId}-${purpose === 'address' ? 'addr' : 'sup'}`,
    )
}

/** "Which document can I use?" Deterministic, answers only from the approved list. */
export function DocumentHelper({ caseId }: { caseId: string }) {
  const { state, data, apply } = useDemoStore()
  const held = useShowHeldOptions()
  const lang = state.language
  const s = getStrings(lang).helper
  const months = currentRuleSet(data).params.supporting_evidence_months
  const [q, setQ] = useState('')
  const [reply, setReply] = useState<HelperReply | null>(null)
  const [english, setEnglish] = useState(false)
  const ask = (question: string, chip?: Parameters<typeof answerHelper>[3]) => {
    const r = answerHelper(question, lang, months, chip)
    setReply(r)
    apply((d) => logHelperExchange(d, caseId, question, r.id, lang))
  }
  // Part of language help, option O1, held until after go-live.
  if (!held) return null
  return (
    <section
      aria-labelledby="helper-h"
      className="mt-5 rounded-2xl border border-line bg-white p-4"
    >
      <h2
        id="helper-h"
        className="flex items-center gap-2 text-base font-medium text-ink"
      >
        <HelpCircle className="size-4" aria-hidden="true" />
        Which document can I use?
      </h2>
      <HeldOptionBadge code="O1" className="mt-1.5" />
      {lang !== 'en' && (
        <p lang={lang} className="mt-0.5 text-[0.9375rem] text-graphite">
          {s.title}
        </p>
      )}
      <p className="mt-1 text-sm text-slate">{s.intro}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {helperChips(lang).map((c) => (
          <button
            key={c.id}
            type="button"
            lang={lang}
            onClick={() => ask(c.text, c.id)}
            className="min-h-10 cursor-pointer rounded-full border border-line px-3 text-[0.9375rem] text-ink hover:bg-mist focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none"
          >
            {c.text}
          </button>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim()) ask(q)
        }}
      >
        <label htmlFor="helper-q" className="sr-only">
          {s.placeholder}
        </label>
        <input
          id="helper-q"
          value={q}
          lang={lang}
          onChange={(e) => setQ(e.target.value)}
          placeholder={s.placeholder}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-base text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
        />
        <Button type="submit" variant="secondary">
          {s.ask}
        </Button>
      </form>
      {reply && (
        <div className="mt-3 rounded-xl bg-mist p-3" aria-live="polite">
          <p className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] font-medium text-graphite">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {reply.label}
            <ModelTag />
          </p>
          <p lang={lang} className="mt-2 text-base leading-relaxed text-ink">
            {reply.text}
          </p>
          {lang !== 'en' && (
            <>
              <button
                type="button"
                aria-pressed={english}
                onClick={() => setEnglish((e) => !e)}
                className="mt-2 min-h-10 cursor-pointer text-[0.9375rem] text-ink underline underline-offset-4"
              >
                {english
                  ? getStrings(lang).notice.hideEnglish
                  : getStrings(lang).notice.showEnglish}
              </button>
              {english && (
                <p lang="en" className="mt-1 text-[0.9375rem] text-graphite">
                  {reply.english}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
