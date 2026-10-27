import { useCallback, useEffect, useState } from 'react'
import { sampleDecision } from '@/data/providerSample'
import { fromProviderDecision, type ProviderReport } from '@/lib/providerReport'

export type ProviderFeed =
  | { state: 'loading' }
  | {
      state: 'ready'
      live: boolean
      /**
        Why the sample is shown: no live sessions configured ('off'), live sessions
        waiting for the password ('locked'), or the password was refused ('wrong').
      */
      access: 'open' | 'off' | 'locked' | 'wrong'
      reports: ProviderReport[]
      /** Sessions the provider would not return, by ID and HTTP status. */
      failed: { id: string; status: number }[]
    }

const sample = (): ProviderReport[] => {
  const r = fromProviderDecision(sampleDecision, 'sample')
  return r ? [{ ...r, samplePersonId: 'p-dmytro' }] : []
}

// The password lives only for this browser tab, so closing the tab locks the page again.
const KEY = 'eo-provider-password'
const readPassword = () => {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}
const writePassword = (value: string) => {
  try {
    if (value) sessionStorage.setItem(KEY, value)
    else sessionStorage.removeItem(KEY)
  } catch {
    // Storage blocked: the password then lasts until the page reloads.
  }
}

/*
  Reads the configured sessions through the server proxy. Nothing is kept in the
  demo store or localStorage: the reports hold personal data and media links that
  expire, so they are fetched fresh each time and refreshed on demand.
*/
export function useProviderReports() {
  const [feed, setFeed] = useState<ProviderFeed>({ state: 'loading' })
  const [password, setPassword] = useState(readPassword)

  const load = useCallback(async () => {
    const fallback = (access: 'off' | 'locked' | 'wrong') =>
      setFeed({
        state: 'ready',
        live: false,
        access,
        reports: sample(),
        failed: [],
      })
    try {
      const res = await fetch('/api/provider/sessions', {
        cache: 'no-store',
        headers: password ? { 'x-demo-password': password } : {},
      })
      if (res.status === 401) {
        if (password) writePassword('')
        return fallback(password ? 'wrong' : 'locked')
      }
      if (!res.ok) throw new Error(String(res.status))
      const body = (await res.json()) as {
        configured: boolean
        sessions: Record<string, unknown>[]
      }
      if (!body.configured) return fallback('off')
      const reports: ProviderReport[] = []
      const failed: { id: string; status: number }[] = []
      for (const s of body.sessions) {
        if ('error' in s)
          failed.push({ id: String(s.id), status: Number(s.error) })
        else {
          const r = fromProviderDecision(s, 'live')
          if (r) reports.push(r)
        }
      }
      setFeed({ state: 'ready', live: true, access: 'open', reports, failed })
    } catch {
      fallback('off')
    }
  }, [password])

  useEffect(() => {
    void load()
  }, [load])

  const unlock = (value: string) => {
    writePassword(value)
    setPassword(value)
  }
  const lock = () => {
    writePassword('')
    setPassword('')
  }

  return { feed, reload: load, unlock, lock }
}
