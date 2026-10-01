import { Analytics } from '@vercel/analytics/react'
import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/app/Toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { IndividualPreview } from '@/features/individual/IndividualPreview'
import { LandingPage } from '@/features/landing/LandingPage'
import { NotFound } from '@/features/placeholders/NotFound'
import { ScreenPlaceholder } from '@/features/placeholders/ScreenPlaceholder'
import { placeholderSpecs as s } from '@/features/placeholders/specs'
import { DemoStoreProvider } from '@/store/DemoStore'

// Screens load on demand so the landing page stays light.
const AgentDashboard = lazy(() => import('@/features/agent/AgentDashboard').then((m) => ({ default: m.AgentDashboard })))
const BulkInvite = lazy(() => import('@/features/agent/BulkInvite').then((m) => ({ default: m.BulkInvite })))
const CompanyLookup = lazy(() => import('@/features/agent/CompanyLookup').then((m) => ({ default: m.CompanyLookup })))
const CompanyProfile = lazy(() => import('@/features/agent/CompanyProfile').then((m) => ({ default: m.CompanyProfile })))
const InviteLog = lazy(() => import('@/features/agent/InviteLog').then((m) => ({ default: m.InviteLog })))

export default function App() {
  return (
    <DemoStoreProvider>
      <ToastProvider>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<LandingPage />} />

                {/* B2C client */}
                <Route path="verify" element={<ScreenPlaceholder spec={s.b2c} />} />

                {/* Agent */}
                <Route path="agent">
                  <Route index element={<AgentDashboard />} />
                  <Route path="lookup" element={<CompanyLookup />} />
                  <Route path="companies/:number" element={<CompanyProfile />} />
                  <Route path="companies/:number/invite" element={<BulkInvite />} />
                  <Route path="invites" element={<InviteLog />} />
                </Route>

                {/* Individual, shown in the phone frame */}
                <Route path="app/:caseId/*" element={<IndividualPreview />} />

                {/* ACSP reviewer */}
                <Route path="acsp">
                  <Route path="queue" element={<ScreenPlaceholder spec={s.acspQueue} />} />
                  <Route path="cases/:caseId" element={<ScreenPlaceholder spec={s.acspCase} />} />
                  <Route path="cases/:caseId/submit" element={<ScreenPlaceholder spec={s.acspSubmit} />} />
                  <Route path="filings" element={<ScreenPlaceholder spec={s.acspFilings} />} />
                </Route>
                <Route path="records/:caseId" element={<ScreenPlaceholder spec={s.record} />} />

                {/* Admin */}
                <Route path="admin" element={<ScreenPlaceholder spec={s.admin} />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ToastProvider>
      <Analytics />
    </DemoStoreProvider>
  )
}
