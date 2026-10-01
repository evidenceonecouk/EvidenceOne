import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { createSeed } from '@/data/seed'
import { PRIMARY_AGENT_ID } from '@/data/organisations'
import { appendAudit, type AuditInput } from '@/lib/audit'
import type { DemoData, PersonaId } from '@/types/domain'
import type { ActionResult } from './actions'

/*
  Single demo store. Seeded from src/data, saved to localStorage so a presenter
  can refresh without losing their place, and reset from the top bar.
*/

const STORAGE_KEY = 'evidenceone.demo'
const SCHEMA = 2
/** A saved demo older than this is reseeded so SLA timers look live again. */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000

export interface DemoState {
  schema: number
  seededAt: number
  persona: PersonaId
  /** Which Agent organisation the Agent persona is viewing as. */
  agentId: string
  data: DemoData
}

type Action =
  | { type: 'reset' }
  | { type: 'setPersona'; persona: PersonaId }
  | { type: 'setAgent'; agentId: string }
  | { type: 'update'; recipe: (data: DemoData) => DemoData; audit?: AuditInput[] }
  | { type: 'apply'; action: (data: DemoData) => ActionResult }

function freshState(persona: PersonaId = 'agent'): DemoState {
  const now = Date.now()
  return { schema: SCHEMA, seededAt: now, persona, agentId: PRIMARY_AGENT_ID, data: createSeed(now) }
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState()
    const saved = JSON.parse(raw) as DemoState
    if (saved.schema !== SCHEMA || Date.now() - saved.seededAt > STALE_AFTER_MS) return freshState()
    return saved
  } catch {
    return freshState()
  }
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'reset':
      return freshState(state.persona)
    case 'setPersona':
      return { ...state, persona: action.persona }
    case 'setAgent':
      return { ...state, agentId: action.agentId }
    case 'update': {
      let data = action.recipe(state.data)
      if (action.audit?.length) {
        data = { ...data, audit: action.audit.reduce((chain, e) => appendAudit(chain, e), data.audit) }
      }
      return { ...state, data }
    }
    case 'apply': {
      const result = action.action(state.data)
      const audit = result.audit.reduce((chain, e) => appendAudit(chain, e), result.data.audit)
      return { ...state, data: { ...result.data, audit } }
    }
  }
}

interface DemoStoreValue {
  state: DemoState
  data: DemoData
  setPersona: (persona: PersonaId) => void
  setAgent: (agentId: string) => void
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

  const setPersona = useCallback((persona: PersonaId) => dispatch({ type: 'setPersona', persona }), [])
  const setAgent = useCallback((agentId: string) => dispatch({ type: 'setAgent', agentId }), [])
  const update = useCallback(
    (recipe: (data: DemoData) => DemoData, audit?: AuditInput[]) => dispatch({ type: 'update', recipe, audit }),
    [],
  )
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])
  const apply = useCallback((action: (data: DemoData) => ActionResult) => dispatch({ type: 'apply', action }), [])

  const value = useMemo(
    () => ({ state, data: state.data, setPersona, setAgent, update, apply, reset }),
    [state, setPersona, setAgent, update, apply, reset],
  )

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
}

export function useDemoStore(): DemoStoreValue {
  const ctx = useContext(DemoStoreContext)
  if (!ctx) throw new Error('useDemoStore must be used inside DemoStoreProvider')
  return ctx
}
