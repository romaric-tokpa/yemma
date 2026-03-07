import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from '@/components/AuthGuard'

// Lazy loading pour optimiser les performances
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const Login = lazy(() => import('@/pages/Login'))
const RegisterChoice = lazy(() => import('@/pages/RegisterChoice'))
const RegisterCandidat = lazy(() => import('@/pages/RegisterCandidat'))
const RegisterCandidatOAuthCallback = lazy(() => import('@/pages/RegisterCandidatOAuthCallback'))
const RegisterCompany = lazy(() => import('@/pages/RegisterCompany'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const AcceptInvitation = lazy(() => import('@/pages/AcceptInvitation'))

// Pages légales
const MentionsLegales = lazy(() => import('@/pages/legal/MentionsLegales'))
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'))
const CGU = lazy(() => import('@/pages/legal/CGU'))

// Page Candidat
const CandidatLanding = lazy(() => import('@/pages/CandidatLanding'))
const CandidateJobsPage = lazy(() => import('@/pages/CandidateJobsPage'))
const JobOfferDetailPage = lazy(() => import('@/pages/JobOfferDetailPage'))

// Routes Candidat
const CandidateOnboarding = lazy(() => import('@/pages/CandidateOnboarding'))
const CandidateDashboard = lazy(() => import('@/pages/CandidateDashboard'))
// Routes Entreprise
const CompanyOnboarding = lazy(() => import('@/pages/CompanyOnboarding'))
const CompanyDashboard = lazy(() => import('@/pages/CompanyDashboard'))
const CompanyManagement = lazy(() => import('@/pages/CompanyManagement'))

// Routes Recherche
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const ProSearchPage = lazy(() => import('@/pages/ProSearchPage'))
const CandidateDetailPage = lazy(() => import('@/pages/CandidateDetailPage'))

// Routes Admin
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const AdminValidationPage = lazy(() => import('@/pages/AdminValidationPage'))
const AdminCvtheque = lazy(() => import('@/pages/AdminCvtheque'))
const AdminStatisticsPage = lazy(() => import('@/pages/AdminStatisticsPage'))
const AdminReview = lazy(() => import('@/pages/AdminReview'))
const AdminEvaluationPage = lazy(() => import('@/pages/AdminEvaluationPage'))
const AdminInvitationsPage = lazy(() => import('@/pages/AdminInvitationsPage'))
const AdminDeletedProfilesPage = lazy(() => import('@/pages/AdminDeletedProfilesPage'))
const AdminJobManager = lazy(() => import('@/pages/AdminJobManager'))
const AdminJobFormPage = lazy(() => import('@/pages/AdminJobFormPage'))
const AdminJobCandidateListPage = lazy(() => import('@/pages/AdminJobCandidateListPage'))
const CreateAdminAccount = lazy(() => import('@/pages/CreateAdminAccount'))

// Page 404
const NotFound = lazy(() => import('@/pages/NotFound'))

// Page Contact
const Contact = lazy(() => import('@/pages/Contact'))

// Pages Paiement (retour Stripe)
const PaymentSuccess = lazy(() => import('@/pages/PaymentSuccess'))
const PaymentCancel = lazy(() => import('@/pages/PaymentCancel'))

// Pages Démo
const DemoCvtheque = lazy(() => import('@/pages/DemoCvtheque'))
const DemoCandidateDetail = lazy(() => import('@/pages/DemoCandidateDetail'))

/**
 * Routes principales de l'application
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques (accessibles sans authentification) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<Navigate to="/register/choice" replace />} />
      <Route path="/register/choice" element={<RegisterChoice />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/legal/mentions" element={<MentionsLegales />} />
      <Route path="/legal/privacy" element={<PrivacyPolicy />} />
      <Route path="/legal/terms" element={<CGU />} />
      <Route path="/candidat" element={<CandidatLanding />} />
      <Route path="/offres/:id" element={<JobOfferDetailPage />} />
      <Route path="/offres" element={<CandidateJobsPage />} />

      {/* Routes Démo (accessibles sans authentification) */}
      <Route path="/demo/cvtheque" element={<DemoCvtheque />} />
      <Route path="/demo/candidates/:candidateId" element={<DemoCandidateDetail />} />

      {/* Routes d'authentification (publiques mais avec logique spéciale) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register/candidat" element={<RegisterCandidat />} />
      <Route path="/register/candidat/oauth-callback" element={<RegisterCandidatOAuthCallback />} />
      <Route path="/register/company" element={<RegisterCompany />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invitation/accept" element={<AcceptInvitation />} />
      
      {/* Route publique pour création de compte Yemma via token d'invitation */}
      <Route path="/yemma/create-account" element={<CreateAdminAccount />} />
      {/* Rétrocompatibilité : anciennes invitations avec /admin/create-account */}
      <Route path="/admin/create-account" element={<CreateAdminAccount />} />

      {/* Paiement - Retour Stripe (protégé entreprise) */}
      <Route
        path="/payment/success"
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
            <PaymentSuccess />
          </AuthGuard>
        }
      />
      <Route
        path="/payment/cancel"
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
            <PaymentCancel />
          </AuthGuard>
        }
      />

      {/* Routes protégées - Candidat */}
      {/* Onboarding simplifié : upload CV → profil créé via Hrflow.ai */}
      <Route
        path="/onboarding"
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <CandidateOnboarding />
          </AuthGuard>
        }
      />
      {/* Redirection des anciennes routes step vers le nouvel onboarding */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(step => (
        <Route
          key={step}
          path={`/onboarding/step${step}`}
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <Navigate to="/onboarding" replace />
            </AuthGuard>
          }
        />
      ))}
      <Route
        path="/onboarding/complete"
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <Navigate to="/candidate/dashboard" replace />
          </AuthGuard>
        }
      />
      
      {/* Dashboard candidat - offres avec sous-onglets et détail */}
      <Route 
        path="/candidate/dashboard/offres/candidatures" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <CandidateDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/candidate/dashboard/offres/:offerId" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <CandidateDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/candidate/dashboard/offres" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <CandidateDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/candidate/dashboard/:tab" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <CandidateDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/candidate/dashboard" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <CandidateDashboard />
          </AuthGuard>
        } 
      />
      {/* Profil candidat : intégré au dashboard (redirection) */}
      <Route 
        path="/candidate/profile/edit" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <Navigate to="/candidate/dashboard/profile?edit=1" replace />
          </AuthGuard>
        } 
      />
      {/* Alias pour compatibilité */}
      <Route 
        path="/profile/edit" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <Navigate to="/candidate/dashboard/profile?edit=1" replace />
          </AuthGuard>
        } 
      />

      {/* Routes protégées - Entreprise / Recruteur */}
      {/* Onboarding entreprise - routes par étape (gère trailing slash pour éviter 404) */}
      <Route 
        path="/company/onboarding" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
            <Navigate to="/company/onboarding/etape/1" replace />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/onboarding/" 
        element={<Navigate to="/company/onboarding/etape/1" replace />} 
      />
      <Route 
        path="/company/onboarding/etape/:step" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
            <CompanyOnboarding />
          </AuthGuard>
        } 
      />
      {/* Redirection anciennes URLs (etape-1, etape-2, etape-3) → etape/1, etape/2, etape/3 */}
      <Route path="/company/onboarding/etape-1" element={<Navigate to="/company/onboarding/etape/1" replace />} />
      <Route path="/company/onboarding/etape-2" element={<Navigate to="/company/onboarding/etape/2" replace />} />
      <Route path="/company/onboarding/etape-3" element={<Navigate to="/company/onboarding/etape/3" replace />} />
      
      {/* Dashboard entreprise - routes par onglet */}
      <Route 
        path="/company/dashboard/management/history" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/management/subscription" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/management/team" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/management" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/settings" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/jobs/new" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/jobs/:jobId/candidatures" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/jobs/:jobId/edit" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/jobs" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/statistics" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard/search" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/dashboard" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      
      {/* Alias - redirections vers les nouvelles routes */}
      <Route 
        path="/company/management" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
            <Navigate to="/company/dashboard/management" replace />
          </AuthGuard>
        } 
      />
      <Route 
        path="/company/search" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <Navigate to="/company/dashboard/search" replace />
          </AuthGuard>
        } 
      />
      <Route 
        path="/search" 
        element={
          <AuthGuard allowedRoles={['ROLE_RECRUITER', 'ROLE_COMPANY_ADMIN']}>
            <SearchPage />
          </AuthGuard>
        } 
      />
      <Route 
        path="/search/pro" 
        element={
          <AuthGuard allowedRoles={['ROLE_RECRUITER', 'ROLE_COMPANY_ADMIN']}>
            <ProSearchPage />
          </AuthGuard>
        } 
      />
      
      {/* Détail candidat - recruteurs, entreprises et admin */}
      <Route 
        path="/candidates/:candidateId" 
        element={
          <AuthGuard allowedRoles={['ROLE_RECRUITER', 'ROLE_COMPANY_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <CandidateDetailPage />
          </AuthGuard>
        } 
      />

      {/* CVthèque Yemma - accès identique à l'entreprise */}
      <Route 
        path="/yemma/cvtheque" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminCvtheque />
          </AuthGuard>
        } 
      />

      {/* Routes protégées - Yemma (ex-admin) */}
      <Route 
        path="/yemma/companies/abonnements" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/companies/recruteurs" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/companies/liste" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/companies" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/dashboard" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/validation" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminValidationPage />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/statistics/offres" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminStatisticsPage defaultTab="jobs" />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/statistics/periode" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminStatisticsPage defaultTab="period" />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/statistics/secteurs" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminStatisticsPage defaultTab="sectors" />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/statistics" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminStatisticsPage />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/raccourcis" 
        element={<Navigate to="/yemma/dashboard" replace />}
      />
      <Route 
        path="/yemma/review/:candidateId/evaluation" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminEvaluationPage />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/review/:candidateId/documents" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminReview defaultTab="documents" />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/review/:candidateId/profile" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminReview defaultTab="profile" />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/review/:candidateId" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminReview />
          </AuthGuard>
        } 
      />
      <Route 
        path="/yemma/deleted-profiles" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminDeletedProfilesPage />
          </AuthGuard>
        }
      />
      <Route 
        path="/yemma/invitations" 
        element={
          <AuthGuard allowedRoles={['ROLE_SUPER_ADMIN']}>
            <AdminInvitationsPage />
          </AuthGuard>
        }
      />
      <Route 
        path="/yemma/jobs/new" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminJobFormPage />
          </AuthGuard>
        }
      />
      <Route 
        path="/yemma/jobs/:id/edit" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminJobFormPage />
          </AuthGuard>
        }
      />
      <Route 
        path="/yemma/jobs/:id/candidatures" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminJobCandidateListPage />
          </AuthGuard>
        }
      />
      <Route 
        path="/yemma/jobs" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminJobManager />
          </AuthGuard>
        }
      />
      
      {/* Redirections anciennes routes /admin vers /yemma (rétrocompatibilité) */}
      <Route path="/admin/*" element={<Navigate to="/yemma/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/yemma/dashboard" replace />} />
      
      {/* Route 404 - Doit être en dernier */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
