import { Analytics } from '@vercel/analytics/react'
import { lazy, Suspense } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/app/Toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LandingPage } from '@/features/landing/LandingPage'
import { NotFound } from '@/features/placeholders/NotFound'
import { DemoStoreProvider } from '@/store/DemoStore'

// Screens load on demand so the landing page stays light.
const PartnerDashboard = lazy(() =>
  import('@/features/partner/PartnerDashboard').then((m) => ({
    default: m.PartnerDashboard,
  })),
)
const BulkInvite = lazy(() =>
  import('@/features/partner/BulkInvite').then((m) => ({
    default: m.BulkInvite,
  })),
)
const PartnerRequests = lazy(() =>
  import('@/features/bulk/PartnerRequests').then((m) => ({
    default: m.PartnerRequests,
  })),
)
const AdminRequests = lazy(() =>
  import('@/features/bulk/AdminRequests').then((m) => ({
    default: m.AdminRequests,
  })),
)
const CompanyLookup = lazy(() =>
  import('@/features/partner/CompanyLookup').then((m) => ({
    default: m.CompanyLookup,
  })),
)
const CompanyProfile = lazy(() =>
  import('@/features/partner/CompanyProfile').then((m) => ({
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
const WebFilingHandoffPage = lazy(() =>
  import('@/features/acsp/WebFilingHandoff').then((m) => ({
    default: m.WebFilingHandoffPage,
  })),
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
  import('@/features/partner/InviteLog').then((m) => ({
    default: m.InviteLog,
  })),
)

const JoinPartner = lazy(() =>
  import('@/features/onboarding/JoinPartner').then((m) => ({
    default: m.JoinPartner,
  })),
)
const JoinAcsp = lazy(() =>
  import('@/features/onboarding/JoinAcsp').then((m) => ({
    default: m.JoinAcsp,
  })),
)
const AcspBilling = lazy(() =>
  import('@/features/acsp/Billing').then((m) => ({ default: m.AcspBilling })),
)
const Reconfirm = lazy(() =>
  import('@/features/acsp/Reconfirm').then((m) => ({ default: m.Reconfirm })),
)
const AffectedCases = lazy(() =>
  import('@/features/acsp/AffectedCases').then((m) => ({
    default: m.AffectedCases,
  })),
)
const ApprovalsPage = lazy(() =>
  import('@/features/admin/ApprovalsPage').then((m) => ({
    default: m.ApprovalsPage,
  })),
)
const MatchingPage = lazy(() =>
  import('@/features/admin/MatchingPage').then((m) => ({
    default: m.MatchingPage,
  })),
)
const MonitoringPage = lazy(() =>
  import('@/features/admin/MonitoringPage').then((m) => ({
    default: m.MonitoringPage,
  })),
)
const FeesPage = lazy(() =>
  import('@/features/admin/FeesPage').then((m) => ({ default: m.FeesPage })),
)
const CommissionsPage = lazy(() =>
  import('@/features/admin/CommissionsPage').then((m) => ({
    default: m.CommissionsPage,
  })),
)
const ComplaintsPage = lazy(() =>
  import('@/features/admin/ComplaintsPage').then((m) => ({
    default: m.ComplaintsPage,
  })),
)
const StoragePage = lazy(() =>
  import('@/features/admin/StoragePage').then((m) => ({
    default: m.StoragePage,
  })),
)
const SuperHome = lazy(() =>
  import('@/features/super/SuperHome').then((m) => ({ default: m.SuperHome })),
)
const AcceptancePage = lazy(() =>
  import('@/features/guided/AcceptancePage').then((m) => ({
    default: m.AcceptancePage,
  })),
)
const DecisionsPage = lazy(() =>
  import('@/features/guided/DecisionsPage').then((m) => ({
    default: m.DecisionsPage,
  })),
)

/** Old paths keep working: /agent became /partner and /app became /journey. */
function RedirectTo({ from, to }: { from: string; to: string }) {
  const { pathname, search } = useLocation()
  return <Navigate to={pathname.replace(from, to) + search} replace />
}

export default function App() {
  return (
    <DemoStoreProvider>
      <ToastProvider>
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <Routes>
              {/* Opens in its own window: the Evidence One interstitial before GOV.UK One Login */}
              <Route
                path="handoff/filing/:taskId"
                element={
                  <Suspense fallback={null}>
                    <WebFilingHandoffPage />
                  </Suspense>
                }
              />
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

                {/* Onboarding, ending in Pending platform approval */}
                <Route path="join/partner" element={<JoinPartner />} />
                <Route path="join/acsp" element={<JoinAcsp />} />

                {/* Presenter only */}
                <Route path="decisions" element={<DecisionsPage />} />
                <Route path="acceptance" element={<AcceptancePage />} />
                <Route
                  path="points"
                  element={<Navigate to="/decisions" replace />}
                />

                {/* Old paths */}
                <Route
                  path="agent/*"
                  element={<RedirectTo from="/agent" to="/partner" />}
                />
                <Route
                  path="app/*"
                  element={<RedirectTo from="/app" to="/journey" />}
                />

                {/* Referral Partner */}
                <Route path="partner">
                  <Route index element={<PartnerDashboard />} />
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
                  <Route path="requests" element={<PartnerRequests />} />
                  <Route
                    path="requests/:requestId"
                    element={<PartnerRequests />}
                  />
                </Route>

                {/* Individual, shown in the phone frame */}
                <Route path="journey/:caseId" element={<IndividualJourney />} />
                <Route
                  path="journey/:caseId/:step"
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
                  <Route path="billing" element={<AcspBilling />} />
                  <Route path="reconfirm" element={<Reconfirm />} />
                  <Route path="affected" element={<AffectedCases />} />
                </Route>
                <Route path="records" element={<RecordsIndex />} />
                <Route
                  path="records/:caseId"
                  element={<VerificationRecord />}
                />

                {/* Admin */}
                <Route path="admin" element={<AdminConsole />} />
                <Route path="admin/approvals" element={<ApprovalsPage />} />
                <Route path="admin/matching" element={<MatchingPage />} />
                <Route path="admin/monitoring" element={<MonitoringPage />} />
                <Route path="admin/requests" element={<AdminRequests />} />
                <Route
                  path="admin/requests/:requestId"
                  element={<AdminRequests />}
                />
                <Route path="admin/fees" element={<FeesPage />} />
                <Route path="admin/commissions" element={<CommissionsPage />} />
                <Route path="admin/storage" element={<StoragePage />} />
                <Route path="admin/complaints" element={<ComplaintsPage />} />
                <Route path="super" element={<SuperHome />} />
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
