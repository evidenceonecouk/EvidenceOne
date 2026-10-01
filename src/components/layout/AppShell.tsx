import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { personaForPath } from '@/store/personas'
import { useDemoStore } from '@/store/DemoStore'
import { PresenterBar } from './PresenterBar'
import { ProductHeader } from './ProductHeader'

export function AppShell() {
  const { pathname } = useLocation()
  const { state, setPersona } = useDemoStore()
  const isLanding = pathname === '/'
  const isApp = pathname.startsWith('/app/')

  // Deep links and the back button keep the persona switcher in step with the screen.
  const pathPersona = personaForPath(pathname)
  useEffect(() => {
    if (pathPersona && pathPersona !== state.persona) setPersona(pathPersona)
  }, [pathPersona, state.persona, setPersona])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-paper px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>
      <PresenterBar />
      <ProductHeader persona={pathPersona ?? state.persona} publicNav={isLanding} className={isApp ? 'hidden sm:block' : undefined} />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
