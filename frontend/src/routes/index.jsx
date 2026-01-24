import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from '@/components/AuthGuard'

// Lazy loading pour optimiser les performances
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const Login = lazy(() => import('@/pages/Login'))
const RegisterChoice = lazy(() => import('@/pages/RegisterChoice'))
const RegisterCandidat = lazy(() => import('@/pages/RegisterCandidat'))
const RegisterCompany = lazy(() => import('@/pages/RegisterCompany'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const AcceptInvitation = lazy(() => import('@/pages/AcceptInvitation'))

// Pages légales
const MentionsLegales = lazy(() => import('@/pages/legal/MentionsLegales'))
const PrivacyPolicy = lazy(() => import('@/pages/legal/PrivacyPolicy'))
const CGU = lazy(() => import('@/pages/legal/CGU'))

// Routes Candidat
const OnboardingStepper = lazy(() => import('@/components/OnboardingStepper'))
const OnboardingComplete = lazy(() => import('@/pages/OnboardingComplete'))
const CandidateDashboard = lazy(() => import('@/pages/CandidateDashboard'))
const EditProfile = lazy(() => import('@/pages/profile/EditProfile'))

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
const AdminReview = lazy(() => import('@/pages/AdminReview'))

// Page 404
const NotFound = lazy(() => import('@/pages/NotFound'))

// Page Contact
const Contact = lazy(() => import('@/pages/Contact'))

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
      <Route path="/register/choice" element={<RegisterChoice />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/legal/mentions" element={<MentionsLegales />} />
      <Route path="/legal/privacy" element={<PrivacyPolicy />} />
      <Route path="/legal/terms" element={<CGU />} />

      {/* Routes Démo (accessibles sans authentification) */}
      <Route path="/demo/cvtheque" element={<DemoCvtheque />} />
      <Route path="/demo/candidates/:candidateId" element={<DemoCandidateDetail />} />

      {/* Routes d'authentification (publiques mais avec logique spéciale) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register/candidat" element={<RegisterCandidat />} />
      <Route path="/register/company" element={<RegisterCompany />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invitation/accept" element={<AcceptInvitation />} />

      {/* Routes protégées - Candidat */}
      {/* Onboarding */}
      <Route 
        path="/onboarding" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <Navigate to="/onboarding/step0" replace />
          </AuthGuard>
        } 
      />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(step => (
        <Route
          key={step}
          path={`/onboarding/step${step}`}
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          }
        />
      ))}
      <Route 
        path="/onboarding/complete" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <OnboardingComplete />
          </AuthGuard>
        } 
      />
      
      {/* Dashboard et profil */}
      <Route 
        path="/candidate/dashboard" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <CandidateDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/candidate/profile/edit" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <EditProfile />
          </AuthGuard>
        } 
      />
      {/* Alias pour compatibilité */}
      <Route 
        path="/profile/edit" 
        element={
          <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
            <Navigate to="/candidate/profile/edit" replace />
          </AuthGuard>
        } 
      />

      {/* Routes protégées - Entreprise / Recruteur */}
      {/* Onboarding entreprise */}
      <Route 
        path="/company/onboarding" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
            <CompanyOnboarding />
          </AuthGuard>
        } 
      />
      
      {/* Dashboard entreprise */}
      <Route 
        path="/company/dashboard" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <CompanyDashboard />
          </AuthGuard>
        } 
      />
      
      {/* Gestion entreprise (admin uniquement) */}
      <Route 
        path="/company/management" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
            <CompanyManagement />
          </AuthGuard>
        } 
      />
      
      {/* Recherche de candidats */}
      <Route 
        path="/company/search" 
        element={
          <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
            <Navigate to="/company/dashboard?tab=search" replace />
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
      
      {/* Détail candidat */}
      <Route 
        path="/candidates/:candidateId" 
        element={
          <AuthGuard allowedRoles={['ROLE_RECRUITER', 'ROLE_COMPANY_ADMIN']}>
            <CandidateDetailPage />
          </AuthGuard>
        } 
      />

      {/* Routes protégées - Admin */}
      <Route 
        path="/admin/dashboard" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminDashboard />
          </AuthGuard>
        } 
      />
      <Route 
        path="/admin/review/:candidateId" 
        element={
          <AuthGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminReview />
          </AuthGuard>
        } 
      />
      
      {/* Route 404 - Doit être en dernier */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
