import type { LanguageCode } from '@/types/domain'

/** English plus the six first languages. Arabic is right to left. English is the version of record. */
export const languages: {
  code: LanguageCode
  label: string
  native: string
  dir: 'ltr' | 'rtl'
}[] = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'ru', label: 'Russian', native: 'Русский', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'es', label: 'Spanish', native: 'Español', dir: 'ltr' },
  { code: 'fr', label: 'French', native: 'Français', dir: 'ltr' },
  { code: 'it', label: 'Italian', native: 'Italiano', dir: 'ltr' },
  { code: 'zh', label: 'Chinese (Simplified)', native: '简体中文', dir: 'ltr' },
]

export const languageByCode = (code: LanguageCode) =>
  languages.find((l) => l.code === code) ?? languages[0]

import { ar } from './ar'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { ru } from './ru'
import type { LanguageStrings } from './types'
import { zh } from './zh'

export type { GuidanceStepId, HelperAnswerId, LanguageStrings } from './types'

const byCode: Record<LanguageCode, LanguageStrings> = {
  en,
  ru,
  ar,
  es,
  fr,
  it,
  zh,
}

/** Pre-written strings for a language. English is the version of record. */
export const getStrings = (code: LanguageCode): LanguageStrings =>
  byCode[code] ?? en

/** Fills {n} (months) and {acsp} placeholders. */
export const fill = (
  text: string,
  values: { n?: number; acsp?: string },
): string =>
  text
    .replace(/\{n\}/g, String(values.n ?? ''))
    .replace(/\{acsp\}/g, values.acsp ?? 'your ACSP')
