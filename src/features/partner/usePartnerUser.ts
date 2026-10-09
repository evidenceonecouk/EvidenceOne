import { useCallback, useSyncExternalStore } from 'react'
import { useActingPartner, useDemoStore } from '@/store/DemoStore'
import { partnerRoleCan } from '@/store/partnerSelectors'
import type { PartnerUser } from '@/types/domain'

/*
  Which user of the Referral Partner organisation is signed in, so the roles
  (Partner Administrator, Referrer, Portfolio Viewer) can be shown. It is a
  presenter convenience kept in this browser only, and cleared by Reset demo
  because the choice is keyed on the seed time.
*/

const KEY = 'evidenceone.partner.user'
const listeners = new Set<() => void>()

function read(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<
      string,
      string
    >
  } catch {
    return {}
  }
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

const snapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? '{}'
  } catch {
    return '{}'
  }
}

export function useActingPartnerUser(): {
  user: PartnerUser
  users: PartnerUser[]
  setUser: (id: string) => void
  can: (typeof partnerRoleCan)[PartnerUser['role']]
} {
  const partner = useActingPartner()
  const { state } = useDemoStore()
  useSyncExternalStore(subscribe, snapshot)
  const key = `${state.seededAt}:${partner.id}`
  const chosen = read()[key]
  const user =
    partner.users.find((u) => u.id === chosen) ??
    partner.users.find((u) => u.role === 'partner_admin') ??
    partner.users[0]
  const setUser = useCallback(
    (id: string) => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...read(), [key]: id }))
      } catch {
        // Storage can be unavailable. The role then stays on the default user.
      }
      listeners.forEach((fn) => fn())
    },
    [key],
  )
  return {
    user,
    users: partner.users,
    setUser,
    can: partnerRoleCan[user.role],
  }
}
