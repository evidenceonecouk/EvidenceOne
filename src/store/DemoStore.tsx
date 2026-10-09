import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { createSeed } from '@/data/seed'
import { PRIMARY_ACSP_ID, PRIMARY_PARTNER_ID } from '@/data/organisations'
import { appendAudit, type AuditInput } from '@/lib/audit'
import type {
  AcspFirm,
  DemoData,
  LanguageCode,
  PersonaId,
  ReferralPartner,
} from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Single demo store. Seeded from src/data, saved to localStorage so a presenter
  can refresh without losing their place, and reset from the top bar.
*/

const STORAGE_KEY = 'evidenceone.demo'
const SCHEMA = 6
/** A saved demo older than this is reseeded so SLA timers look live again. */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000

export interface DemoState {
  schema: number
  seededAt: number
  persona: PersonaId
  /** Which Referral Partner organisation the Referral Partner persona is acting as. */
  partnerId: string
  /** Which ACSP the ACSP persona is acting as. A firm that is both a Partner and an ACSP holds two memberships, one at a time. */
  acspId: string
  /** Super Administrator seat: 1 proposes, 2 is the second approver. Nobody approves their own change. */
  superAdminSeat: 1 | 2
  /** Language for guidance on individual-facing screens. English is the version of record. */
  language: LanguageCode
  /** Guided demo mode: short captions that step through the story. */
  guided: { on: boolean; step: number }
  data: DemoData
}

type Action =
  | { type: 'reset' }
  | { type: 'hydrate'; state: DemoState }
  | { type: 'setPersona'; persona: PersonaId }
  | { type: 'setPartner'; partnerId: string }
  | { type: 'setAcsp'; acspId: string }
  | { type: 'setSeat'; seat: 1 | 2 }
  | { type: 'setLanguage'; language: LanguageCode }
  | { type: 'setGuided'; guided: { on: boolean; step: number } }
  | {
      type: 'update'
      recipe: (data: DemoData) => DemoData
      audit?: AuditInput[]
    }
  | { type: 'apply'; action: (data: DemoData) => ActionResult }

function freshState(persona: PersonaId = 'partner'): DemoState {
  const now = Date.now()
  return {
    schema: SCHEMA,
    seededAt: now,
    persona,
    partnerId: PRIMARY_PARTNER_ID,
    acspId: PRIMARY_ACSP_ID,
    superAdminSeat: 1,
    language: 'en',
    guided: { on: false, step: 0 },
    data: createSeed(now),
  }
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState()
    const saved = JSON.parse(raw) as DemoState
    if (saved.schema !== SCHEMA || Date.now() - saved.seededAt > STALE_AFTER_MS)
      return freshState()
    return saved
  } catch {
    return freshState()
  }
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'reset':
      return freshState(state.persona)
    case 'hydrate':
      return action.state
    case 'setPersona':
      return { ...state, persona: action.persona }
    case 'setPartner':
      return { ...state, partnerId: action.partnerId }
    case 'setAcsp':
      return { ...state, acspId: action.acspId }
    case 'setSeat':
      return { ...state, superAdminSeat: action.seat }
    case 'setLanguage':
      return { ...state, language: action.language }
    case 'setGuided':
      return { ...state, guided: action.guided }
    case 'update': {
      let data = action.recipe(state.data)
      if (action.audit?.length) {
        data = {
          ...data,
          audit: action.audit.reduce(
            (chain, e) => appendAudit(chain, e, data.cases),
            data.audit,
          ),
        }
      }
      return { ...state, data }
    }
    case 'apply': {
      const result = action.action(state.data)
      const audit = result.audit.reduce(
        (chain, e) => appendAudit(chain, e, result.data.cases),
        result.data.audit,
      )
      return { ...state, data: { ...result.data, audit } }
    }
  }
}

interface DemoStoreValue {
  state: DemoState
  data: DemoData
  setPersona: (persona: PersonaId) => void
  setPartner: (partnerId: string) => void
  setAcsp: (acspId: string) => void
  setSeat: (seat: 1 | 2) => void
  setLanguage: (language: LanguageCode) => void
  setGuided: (guided: { on: boolean; step: number }) => void
  /** Apply an immutable change to the data and append any audit events to the chain. */
  update: (recipe: (data: DemoData) => DemoData, audit?: AuditInput[]) => void
  /** Run a store action from src/store/actions.ts; its audit events are chained automatically. */
  apply: (action: (data: DemoData) => ActionResult) => void
  reset: () => void
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null)

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage can be unavailable (private mode). The demo still works in memory.
    }
  }, [state])

  // Another window (the GOV.UK One Login handoff) can change the demo; pick its changes up here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const next = JSON.parse(e.newValue) as DemoState
        if (next.schema === SCHEMA) dispatch({ type: 'hydrate', state: next })
      } catch {
        // Ignore a malformed write from another window.
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setPersona = useCallback(
    (persona: PersonaId) => dispatch({ type: 'setPersona', persona }),
    [],
  )
  const setPartner = useCallback(
    (partnerId: string) => dispatch({ type: 'setPartner', partnerId }),
    [],
  )
  const setAcsp = useCallback(
    (acspId: string) => dispatch({ type: 'setAcsp', acspId }),
    [],
  )
  const setSeat = useCallback(
    (seat: 1 | 2) => dispatch({ type: 'setSeat', seat }),
    [],
  )
  const setLanguage = useCallback(
    (language: LanguageCode) => dispatch({ type: 'setLanguage', language }),
    [],
  )
  const setGuided = useCallback(
    (guided: { on: boolean; step: number }) =>
      dispatch({ type: 'setGuided', guided }),
    [],
  )
  const update = useCallback(
    (recipe: (data: DemoData) => DemoData, audit?: AuditInput[]) =>
      dispatch({ type: 'update', recipe, audit }),
    [],
  )
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])
  const apply = useCallback(
    (action: (data: DemoData) => ActionResult) =>
      dispatch({ type: 'apply', action }),
    [],
  )

  const value = useMemo(
    () => ({
      state,
      data: state.data,
      setPersona,
      setPartner,
      setAcsp,
      setSeat,
      setLanguage,
      setGuided,
      update,
      apply,
      reset,
    }),
    [
      state,
      setPersona,
      setPartner,
      setAcsp,
      setSeat,
      setLanguage,
      setGuided,
      update,
      apply,
      reset,
    ],
  )

  return (
    <DemoStoreContext.Provider value={value}>
      {children}
    </DemoStoreContext.Provider>
  )
}

export function useDemoStore(): DemoStoreValue {
  const ctx = useContext(DemoStoreContext)
  if (!ctx)
    throw new Error('useDemoStore must be used inside DemoStoreProvider')
  return ctx
}

/** The Referral Partner organisation the Partner persona is acting as. */
export function useActingPartner(): ReferralPartner {
  const { data, state } = useDemoStore()
  return data.partners.find((p) => p.id === state.partnerId) ?? data.partners[0]
}

/** The ACSP the ACSP persona is acting as, and the reviewer who is signed in. */
export function useActingAcsp(): {
  acsp: AcspFirm
  reviewer: AcspFirm['reviewers'][number]
} {
  const { data, state } = useDemoStore()
  const acsp = data.acsps.find((a) => a.id === state.acspId) ?? data.acsps[0]
  return { acsp, reviewer: acsp.reviewers[0] }
}

/** Super Administrator seats. Seat 2 is the second approver. */
export const SUPER_ADMINS = [
  { seat: 1 as const, name: 'Helen Carver', role: 'Super Administrator' },
  {
    seat: 2 as const,
    name: 'Daniel Achebe',
    role: 'Super Administrator, second approver',
  },
]
