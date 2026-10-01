import { Analytics } from '@vercel/analytics/react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/app/Toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LandingPage } from '@/features/landing/LandingPage'
import { NotFound } from '@/features/placeholders/NotFound'
import { DemoStoreProvider } from '@/store/DemoStore'

// Screens load on demand so the landing page stays light.
const AgentDashboard = lazy(() =>
  import('@/features/agent/AgentDashboard').then((m) => ({
    default: m.AgentDashboard,
  })),
)
const BulkInvite = lazy(() =>
  import('@/features/agent/BulkInvite').then((m) => ({
    default: m.BulkInvite,
  })),
)
const CompanyLookup = lazy(() =>
  import('@/features/agent/CompanyLookup').then((m) => ({
    default: m.CompanyLookup,
  })),
)
const CompanyProfile = lazy(() =>
  import('@/features/agent/CompanyProfile').then((m) => ({
    default: m.CompanyProfile,
  })),
)
const IndividualJourney = lazy(() =>
  import('@/features/individual/IndividualJourney').then((m) => ({
    default: m.IndividualJourney,
  })),
)
const VerifyStart = lazy(() =>
  import('@/features/b2c/VerifyStart').then((m) => ({
    default: m.VerifyStart,
  })),
)
const ReviewQueue = lazy(() =>
  import('@/features/acsp/ReviewQueue').then((m) => ({
    default: m.ReviewQueue,
  })),
)
const CaseReview = lazy(() =>
  import('@/features/acsp/CaseReview').then((m) => ({ default: m.CaseReview })),
)
const Filings = lazy(() =>
  import('@/features/acsp/Filings').then((m) => ({ default: m.Filings })),
)
const Correction = lazy(() =>
  import('@/features/acsp/Correction').then((m) => ({ default: m.Correction })),
)
const HandoffPage = lazy(() =>
  import('@/features/acsp/Handoff').then((m) => ({ default: m.HandoffPage })),
)
const RulesPage = lazy(() =>
  import('@/features/rules/RulesPage').then((m) => ({ default: m.RulesPage })),
)
const SignIn = lazy(() =>
  import('@/features/signin/SignIn').then((m) => ({ default: m.SignIn })),
)
const Submission = lazy(() =>
  import('@/features/acsp/Submission').then((m) => ({ default: m.Submission })),
)
const RecordsIndex = lazy(() =>
  import('@/features/records/RecordsIndex').then((m) => ({
    default: m.RecordsIndex,
  })),
)
const VerificationRecord = lazy(() =>
  import('@/features/records/VerificationRecord').then((m) => ({
    default: m.VerificationRecord,
  })),
)
const AdminConsole = lazy(() =>
  import('@/features/admin/AdminConsole').then((m) => ({
    default: m.AdminConsole,
  })),
)
const CompliancePage = lazy(() =>
  import('@/features/admin/CompliancePage').then((m) => ({
    default: m.CompliancePage,
  })),
)
const AuditTrailPage = lazy(() =>
  import('@/features/admin/AuditTrailPage').then((m) => ({
    default: m.AuditTrailPage,
  })),
)
const RetentionPage = lazy(() =>
  import('@/features/admin/RetentionPage').then((m) => ({
    default: m.RetentionPage,
  })),
)
const NotificationsPage = lazy(() =>
  import('@/features/admin/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const UsersRolesPage = lazy(() =>
  import('@/features/admin/UsersRolesPage').then((m) => ({
    default: m.UsersRolesPage,
  })),
)
const WhiteLabelPage = lazy(() =>
  import('@/features/admin/WhiteLabelPage').then((m) => ({
    default: m.WhiteLabelPage,
  })),
)
const InviteLog = lazy(() =>
  import('@/features/agent/InviteLog').then((m) => ({ default: m.InviteLog })),
)

export default function App() {
  return (
    <DemoStoreProvider>
      <ToastProvider>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <Routes>
              {/* Opens in its own window: the Evidence One interstitial before GOV.UK One Login */}
              <Route
                path="handoff/:caseId"
                element={
                  <Suspense fallback={null}>
                    <HandoffPage />
                  </Suspense>
                }
              />
              <Route element={<AppShell />}>
                <Route index element={<LandingPage />} />

                {/* B2C client */}
                <Route path="verify" element={<VerifyStart />} />
                <Route path="signin" element={<SignIn />} />

                {/* Agent */}
                <Route path="agent">
                  <Route index element={<AgentDashboard />} />
                  <Route path="lookup" element={<CompanyLookup />} />
                  <Route
                    path="companies/:number"
                    element={<CompanyProfile />}
                  />
                  <Route
                    path="companies/:number/invite"
                    element={<BulkInvite />}
                  />
                  <Route path="invites" element={<InviteLog />} />
                </Route>

                {/* Individual, shown in the phone frame */}
                <Route path="app/:caseId" element={<IndividualJourney />} />
                <Route
                  path="app/:caseId/:step"
                  element={<IndividualJourney />}
                />

                {/* ACSP reviewer */}
                <Route path="acsp">
                  <Route path="queue" element={<ReviewQueue />} />
                  <Route path="cases/:caseId" element={<CaseReview />} />
                  <Route path="cases/:caseId/submit" element={<Submission />} />
                  <Route
                    path="cases/:caseId/correct"
                    element={<Correction />}
                  />
                  <Route path="filings" element={<Filings />} />
                </Route>
                <Route path="records" element={<RecordsIndex />} />
                <Route
                  path="records/:caseId"
                  element={<VerificationRecord />}
                />

                {/* Admin */}
                <Route path="admin" element={<AdminConsole />} />
                <Route path="admin/compliance" element={<CompliancePage />} />
                <Route path="admin/audit" element={<AuditTrailPage />} />
                <Route path="admin/retention" element={<RetentionPage />} />
                <Route
                  path="admin/notifications"
                  element={<NotificationsPage />}
                />
                <Route path="admin/users" element={<UsersRolesPage />} />
                <Route path="admin/white-label" element={<WhiteLabelPage />} />
                <Route path="rules" element={<RulesPage />} />

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
