/*
 * Illustrative platform figures for the Admin operations dashboard.
 * Synthetic numbers for the demo story; live demo activity is added on top in the screen.
 */

export type OpsPeriod = 'weeks' | 'months'

export const volume: Record<OpsPeriod, { labels: string[]; started: number[]; decided: number[] }> = {
  weeks: {
    labels: ['13 Jul', '20 Jul', '27 Jul', '3 Aug', '10 Aug', '17 Aug', '24 Aug', '31 Aug', '7 Sep', '14 Sep', '21 Sep', '28 Sep'],
    started: [22, 27, 25, 31, 29, 36, 34, 41, 39, 45, 48, 52],
    decided: [18, 23, 22, 27, 26, 31, 30, 36, 35, 40, 43, 47],
  },
  months: {
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    started: [38, 44, 41, 57, 63, 72, 84, 97, 109, 126, 141, 168],
    decided: [31, 39, 37, 50, 56, 65, 76, 88, 99, 115, 130, 154],
  },
}

/** Headline review figures for each period. Hours are from submission for review to the reviewer decision. */
export const headline: Record<OpsPeriod, { decided: number; previous: number; medianHours: number; withinTarget: number; firstPass: number; caption: string }> = {
  weeks: { decided: 47, previous: 43, medianHours: 9.6, withinTarget: 98.8, firstPass: 84, caption: 'Week to 28 September' },
  months: { decided: 154, previous: 130, medianHours: 10.2, withinTarget: 98.1, firstPass: 82, caption: 'September 2026' },
}

/** One tile per metric, with twelve weeks of history for the sparkline. `goodWhen` says which direction is an improvement. */
export const kpis: { id: string; label: string; value: string; delta: string; trend: number[]; goodWhen: 'up' | 'down'; detail: string }[] = [
  { id: 'invites', label: 'Invites sent', value: '212', delta: '+18%', trend: [11, 14, 12, 16, 15, 19, 18, 22, 21, 24, 26, 29], goodWhen: 'up', detail: 'From 31 Agents this month' },
  { id: 'journey', label: 'Median app journey', value: '7m 40s', delta: '-1m 10s', trend: [11.2, 10.8, 10.1, 9.9, 9.4, 9.1, 8.8, 8.6, 8.3, 8.1, 7.9, 7.7], goodWhen: 'down', detail: 'Invite opened to submitted' },
  { id: 'chip', label: 'Passport chip reads', value: '97.8%', delta: '+0.6 pts', trend: [96.1, 96.4, 96.2, 96.9, 97.0, 96.8, 97.3, 97.2, 97.5, 97.4, 97.7, 97.8], goodWhen: 'up', detail: 'Read on the first attempt' },
  { id: 'codes', label: 'Agent Payment Codes used', value: '104', delta: '+17%', trend: [4, 6, 5, 7, 7, 8, 8, 9, 9, 10, 11, 12], goodWhen: 'up', detail: '62% of paid journeys' },
  { id: 'companies', label: 'Companies connected', value: '312', delta: '+16', trend: [228, 236, 241, 249, 255, 262, 270, 279, 287, 296, 304, 312], goodWhen: 'up', detail: 'Lodged by Agents from the register' },
  { id: 'mismatch', label: 'Register corrections raised', value: '14', delta: '-3', trend: [6, 5, 5, 6, 4, 5, 4, 4, 3, 4, 3, 3], goodWhen: 'down', detail: 'Route B, form ACSP04' },
  { id: 'evidence', label: 'Supporting documents requested', value: '9%', delta: '-2 pts', trend: [14, 13, 13, 12, 12, 11, 11, 11, 10, 10, 9, 9], goodWhen: 'down', detail: 'Rules ADDL-01 to ADDL-03' },
  { id: 'filed', label: 'Submitted to Companies House', value: '136', delta: '+21%', trend: [17, 21, 20, 25, 24, 28, 27, 33, 32, 36, 39, 43], goodWhen: 'up', detail: 'Verification reference recorded' },
]

/** The individual's journey this month, in journey order. */
export const funnel: { step: string; count: number }[] = [
  { step: 'Invite opened', count: 194 },
  { step: 'Email and mobile confirmed', count: 186 },
  { step: 'Register details confirmed', count: 179 },
  { step: 'Payment made', count: 171 },
  { step: 'Identity checks complete', count: 163 },
  { step: 'With the ACSP', count: 158 },
  { step: 'Approved by the ACSP', count: 141 },
  { step: 'Submitted to Companies House', count: 136 },
]
export const invitesSent = 212

export const decisions = { approve: 141, request_info: 22, decline: 4 }

/** Hours from submission for review to the reviewer decision. The last bucket is past the 36 hour review target. */
export const decisionTimes: { label: string; count: number; overTarget?: boolean }[] = [
  { label: '<4', count: 38 },
  { label: '8', count: 29 },
  { label: '12', count: 24 },
  { label: '18', count: 21 },
  { label: '24', count: 17 },
  { label: '30', count: 9 },
  { label: '36', count: 5 },
  { label: '36+', count: 2, overTarget: true },
]

/** First-attempt results from the certified identity provider. */
export const identityChecks: { label: string; rate: number; referred: number }[] = [
  { label: 'Document authenticity', rate: 99.1, referred: 2 },
  { label: 'Liveness', rate: 98.4, referred: 3 },
  { label: 'Passport chip read', rate: 97.8, referred: 4 },
  { label: 'Face match', rate: 97.2, referred: 5 },
  { label: 'PEP and sanctions screening', rate: 98.8, referred: 2 },
]

/** Rules that fired most often this month. Counts are cases, not decisions. */
export const rulesFired: { id: string; count: number }[] = [
  { id: 'ADDL-02', count: 15 },
  { id: 'REG-11', count: 14 },
  { id: 'ADDL-11', count: 7 },
  { id: 'DOC-03', count: 5 },
  { id: 'IDVT-04', count: 4 },
  { id: 'REG-04', count: 3 },
]

/** Fees by payment route, last six months. */
export const fees: { month: string; agentCode: number; payMyself: number }[] = [
  { month: 'Apr', agentCode: 52, payMyself: 32 },
  { month: 'May', agentCode: 61, payMyself: 36 },
  { month: 'Jun', agentCode: 70, payMyself: 39 },
  { month: 'Jul', agentCode: 80, payMyself: 46 },
  { month: 'Aug', agentCode: 89, payMyself: 52 },
  { month: 'Sep', agentCode: 104, payMyself: 64 },
]

export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const hourSlots = ['06', '08', '10', '12', '14', '16', '18', '20', '22']

/** Journeys started by weekday and two-hour slot. Deterministic so it renders the same every time. */
export const activity: number[][] = weekdays.map((_, d) =>
  hourSlots.map((_, h) => {
    const weekday = d < 5
    const office = h >= 1 && h <= 5 ? 1 : 0.35
    const evening = h >= 6 && h <= 7 ? (weekday ? 0.9 : 0.7) : 0
    const base = weekday ? 9 * office + 7 * evening : 4 * office + 6 * evening + 1
    const wobble = ((d * 7 + h * 13) % 5) - 2
    return Math.max(0, Math.round(base + wobble + (d === 1 || d === 2 ? 2 : 0)))
  }),
)
