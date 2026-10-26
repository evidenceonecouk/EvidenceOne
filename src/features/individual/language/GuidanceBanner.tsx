import { Languages } from 'lucide-react'
import { useState } from 'react'
import { HeldOptionBadge } from '@/components/HeldOption'
import { ModelTag } from '@/components/visual/AiObservationCard'
import { fill, getStrings, languageByCode } from '@/data/i18n'
import type { GuidanceStepId } from '@/data/i18n'
import type { StepId } from '@/features/individual/journey'
import { currentRuleSet } from '@/lib/rules'
import { useDemoStore, useShowHeldOptions } from '@/store/DemoStore'

export const AI_TRANSLATION_LABEL =
  'AI translation. Advisory only. The English text is the version of record.'

/**
  The step's guidance in the chosen language, with the AI translation notice and
  a "Show English" toggle. Shows nothing when English is selected.
*/
export function GuidanceBanner({ step }: { step: StepId }) {
  const { state, data } = useDemoStore()
  const [english, setEnglish] = useState(false)
  const held = useShowHeldOptions()
  // Language help is option O1, held until after go-live.
  if (state.language === 'en' || !held) return null
  const s = getStrings(state.language)
  const en = getStrings('en')
  const text = s.guidance[step as GuidanceStepId]
  if (!text) return null
  const n = currentRuleSet(data).params.supporting_evidence_months
  const lang = languageByCode(state.language)
  return (
    <section
      aria-label={s.notice.inYourLanguage}
      className="mt-3 rounded-2xl border border-line bg-white p-4"
    >
      <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-graphite">
        <Languages className="size-4" aria-hidden="true" />
        {s.notice.inYourLanguage}
      </p>
      <p
        lang={lang.code}
        dir={lang.dir}
        className="mt-2 text-[1.0625rem] leading-relaxed text-ink"
      >
        {fill(text, { n })}
      </p>
      {english && (
        <p
          lang="en"
          dir="ltr"
          className="mt-3 border-t border-line pt-3 text-base text-graphite"
        >
          {fill(en.guidance[step as GuidanceStepId], { n })}
        </p>
      )}
      <div className="mt-3 space-y-1.5 text-[0.8125rem] text-slate">
        <p>{AI_TRANSLATION_LABEL}</p>
        <p lang={lang.code} dir={lang.dir}>
          {s.notice.aiLocal}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <ModelTag />
          <HeldOptionBadge code="O1" />
        </div>
      </div>
      <button
        type="button"
        aria-pressed={english}
        onClick={() => setEnglish((e) => !e)}
        className="mt-3 min-h-10 cursor-pointer rounded-lg border border-line px-3 text-[0.9375rem] text-ink hover:bg-mist focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:outline-none"
      >
        <span lang={lang.code}>
          {english ? s.notice.hideEnglish : s.notice.showEnglish}
        </span>
      </button>
    </section>
  )
}
