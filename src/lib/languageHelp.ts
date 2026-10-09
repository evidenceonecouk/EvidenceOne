import { getStrings } from '@/data/i18n'
import type { HelperAnswerId } from '@/data/i18n'
import type { LanguageCode } from '@/types/domain'

/*
  The supporting-document helper, "Which document can I use?". Deterministic in
  the demo: no AI service is called. It answers only from the approved list of
  accepted documents and the supporting-evidence period, and refuses anything
  else. Free text is matched by keyword in any of the supported languages.
*/

export const HELPER_LABEL = 'AI assistant. Advisory only.'
export const HELPER_OUTSIDE_EN =
  'I can only help with the documents Evidence One accepts. Your ACSP will advise on anything else.'

/** Things that are not on the approved list. Checked first, so they are always refused. */
const OUTSIDE = [
  'phone',
  'mobile',
  'broadband',
  'internet',
  'tenancy',
  'rent',
  'lease',
  'mortgage',
  'payslip',
  'salary',
  'wage',
  'letter',
  'hmrc',
  'p60',
  'visa',
  'driving',
  'licence',
  'license',
  'student',
  'gp ',
  'hospital',
  'tax return',
  'телефон',
  'аренд',
  'зарплат',
  'письм',
  'ипотек',
  'права',
  'هاتف',
  'إيجار',
  'راتب',
  'رسالة',
  'رخصة',
  'teléfono',
  'alquiler',
  'nómina',
  'carta',
  'hipoteca',
  'conducir',
  'téléphone',
  'loyer',
  'bail',
  'salaire',
  'courrier',
  'hypothèque',
  'permis',
  'telefono',
  'affitto',
  'stipendio',
  'lettera',
  'mutuo',
  'patente',
  '电话',
  '手机',
  '租',
  '工资',
  '信件',
  '抵押',
  '驾驶',
  '驾照',
]

const KEYWORDS: Record<HelperAnswerId, string[]> = {
  identity: [
    'second id',
    'second identity',
    'another id',
    'identity document',
    'passport photo',
    'второй документ',
    'второй',
    'ثانية',
    'ثانٍ',
    'segundo documento',
    'second document d',
    'seconda',
    'secondo documento',
    '第二',
  ],
  bank: [
    'bank',
    'credit card',
    'card statement',
    'банк',
    'выписк',
    'مصرف',
    'بنك',
    'banco',
    'extracto',
    'banc',
    'relevé',
    'estratto',
    '银行',
    '对账单',
  ],
  utility: [
    'utility',
    'utilities',
    'council',
    'electric',
    'gas',
    'water',
    'bill',
    'коммунал',
    'счёт',
    'счет',
    'налог',
    'فاتورة',
    'كهرباء',
    'ضريبة',
    'suministro',
    'factura',
    'impuesto',
    'luz',
    'agua',
    'facture',
    'taxe',
    'électricité',
    'bolletta',
    'tassa',
    'luce',
    'acqua',
    '水电',
    '燃气',
    '账单',
    '市政',
  ],
  insurance: [
    'insurance',
    'policy',
    'страх',
    'полис',
    'تأمين',
    'seguro',
    'póliza',
    'assurance',
    'contrat',
    'assicura',
    'polizza',
    '保险',
  ],
  passport_use: [
    'passport use',
    'passport',
    'travel',
    'использован',
    'паспорт',
    'جواز',
    'pasaporte',
    'passeport',
    'passaporto',
    '护照',
  ],
  months: [
    'recent',
    'old',
    'date',
    'month',
    'how long',
    'how new',
    'expire',
    'свеж',
    'стар',
    'мес',
    'дат',
    'حديث',
    'قديم',
    'شهر',
    'تاريخ',
    'reciente',
    'antig',
    'meses',
    'fecha',
    'récent',
    'ancien',
    'mois',
    'daté',
    'recente',
    'vecchi',
    'mesi',
    'data',
    '多近',
    '日期',
    '个月',
    '最近',
  ],
  list: [
    'what',
    'which',
    'accept',
    'list',
    'any',
    'can i use',
    'documents',
    'что',
    'какой',
    'какие',
    'принима',
    'ماذا',
    'ما ',
    'أي',
    'qué',
    'cuál',
    'cuáles',
    'quel',
    'quels',
    'que puis',
    'cosa',
    'quale',
    'quali',
    '什么',
    '哪些',
    '哪',
  ],
}

/** Order matters: the most specific topic wins. */
const ORDER: HelperAnswerId[] = [
  'identity',
  'bank',
  'utility',
  'insurance',
  'passport_use',
  'months',
  'list',
]

export interface HelperReply {
  id: HelperAnswerId | 'outside'
  /** In the chosen language. */
  text: string
  /** English, the version of record. */
  english: string
  label: string
}

const NUMBER_WORDS = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
]

const monthsFor = (lang: LanguageCode, n: number) =>
  lang === 'en' ? (NUMBER_WORDS[n] ?? String(n)) : String(n)

export function helperChips(lang: LanguageCode) {
  const c = getStrings(lang).helper.chips
  return (['list', 'bank', 'utility', 'months', 'identity'] as const).map(
    (id) => ({ id, text: c[id] }),
  )
}

export function matchTopic(question: string): HelperAnswerId | 'outside' {
  const q = ` ${question.toLowerCase()} `
  if (!question.trim()) return 'outside'
  if (OUTSIDE.some((k) => q.includes(k))) return 'outside'
  for (const id of ORDER) if (KEYWORDS[id].some((k) => q.includes(k))) return id
  return 'outside'
}

/** Answer a question, or a chip id, in the chosen language. */
export function answerHelper(
  question: string,
  lang: LanguageCode,
  months: number,
  chip?: HelperAnswerId,
): HelperReply {
  const id = chip ?? matchTopic(question)
  const render = (code: LanguageCode) => {
    const h = getStrings(code).helper
    const raw = id === 'outside' ? h.outside : h.answers[id]
    return raw.replace(/\{n\}/g, monthsFor(code, months))
  }
  return {
    id,
    text: render(lang),
    english: id === 'outside' ? HELPER_OUTSIDE_EN : render('en'),
    label: HELPER_LABEL,
  }
}
