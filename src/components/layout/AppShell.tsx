import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { isSharedPath, personaForPath } from '@/store/personas'
import { useDemoStore } from '@/store/DemoStore'
import { PresenterBar } from './PresenterBar'
import { PortalShell } from './PortalShell'
import { ProductHeader } from './ProductHeader'

export function AppShell() {
  const { pathname } = useLocation()
  const { state, setPersona } = useDemoStore()
  const isLanding = pathname === '/'
  const isApp = pathname.startsWith('/app/')
  const professional = (
    p?: string,
  ): p is 'agent' | 'reviewer' | 'admin' | 'admin2' =>
    p === 'agent' || p === 'reviewer' || p === 'admin' || p === 'admin2'
  // Shared screens such as Rules keep whichever professional persona is viewing them.
  const portalPersona = isSharedPath(pathname)
    ? professional(state.persona) && state.persona !== 'agent'
      ? state.persona
      : 'reviewer'
    : personaForPath(pathname)
  const isPortal = professional(portalPersona)

  // Deep links and the back button keep the persona switcher in step with the screen.
  const pathPersona = isSharedPath(pathname)
    ? portalPersona
    : personaForPath(pathname)
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
      {isPortal ? (
        <PortalShell persona={portalPersona!}>
          <main id="main">
            <Suspense
              fallback={<div className="min-h-[60vh]" aria-busy="true" />}
            >
              <Outlet />
            </Suspense>
          </main>
        </PortalShell>
      ) : (
        <>
          <ProductHeader
            persona={pathPersona ?? state.persona}
            publicNav={isLanding}
            className={isApp ? 'hidden' : undefined}
          />
          <main id="main" className="flex-1">
            <Suspense
              fallback={<div className="min-h-[60vh]" aria-busy="true" />}
            >
              <Outlet />
            </Suspense>
          </main>
        </>
      )}
    </div>
  )
}
