import type { LanguageCode } from '@/types/domain'

/**
  Steps that carry a short guidance paragraph. Kept as plain strings so this
  module does not depend on the journey definition.
*/
export const GUIDANCE_STEPS = [
  'invite',
  'contact',
  'details',
  'personal',
  'suggest',
  'instruct',
  'payment',
  'document',
  'scan',
  'selfie',
  'checks',
  'address',
  'evidence',
  'review',
  'status',
  'option-2',
] as const
export type GuidanceStepId = (typeof GUIDANCE_STEPS)[number]

/** Answers the supporting-document helper can give. Anything else is refused. */
export const HELPER_ANSWERS = [
  'list',
  'bank',
  'utility',
  'insurance',
  'passport_use',
  'months',
  'identity',
] as const
export type HelperAnswerId = (typeof HELPER_ANSWERS)[number]

/** Pre-written, synthetic strings for one language. Placeholders: {n} months, {acsp} the named ACSP. */
export interface LanguageStrings {
  code: LanguageCode
  notice: {
    inYourLanguage: string
    /** Local-language rendering of the English label, shown beneath it. */
    aiLocal: string
    showEnglish: string
    hideEnglish: string
    legalNote: string
    translationLabel: string
  }
  guidance: Record<GuidanceStepId, string>
  helper: {
    title: string
    intro: string
    placeholder: string
    ask: string
    chips: Record<'list' | 'bank' | 'utility' | 'months' | 'identity', string>
    answers: Record<HelperAnswerId, string>
    outside: string
  }
  declarations: {
    truth: string
    consent: string
  }
}
