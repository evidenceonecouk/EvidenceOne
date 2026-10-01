import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { IndividualPreview } from '@/features/individual/IndividualPreview'
import { LandingPage } from '@/features/landing/LandingPage'
import { NotFound } from '@/features/placeholders/NotFound'
import { ScreenPlaceholder } from '@/features/placeholders/ScreenPlaceholder'
import { placeholderSpecs as s } from '@/features/placeholders/specs'
import { DemoStoreProvider } from '@/store/DemoStore'

export default function App() {
  return (
    <DemoStoreProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<LandingPage />} />

              {/* B2C client */}
              <Route path="verify" element={<ScreenPlaceholder spec={s.b2c} />} />

              {/* Agent */}
              <Route path="agent">
                <Route index element={<ScreenPlaceholder spec={s.agentDashboard} />} />
                <Route path="lookup" element={<ScreenPlaceholder spec={s.agentLookup} />} />
                <Route path="companies/:number" element={<ScreenPlaceholder spec={s.agentCompany} />} />
                <Route path="companies/:number/invite" element={<ScreenPlaceholder spec={s.agentInvite} />} />
                <Route path="invites" element={<ScreenPlaceholder spec={s.agentInvites} />} />
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
      <Analytics />
    </DemoStoreProvider>
  )
}
