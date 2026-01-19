import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import OnboardingStepper from './components/OnboardingStepper'
import OnboardingComplete from './pages/OnboardingComplete'
import CandidateDashboard from './pages/CandidateDashboard'
import AdminReview from './pages/AdminReview'
import AdminDashboard from './pages/AdminDashboard'
import { SearchPage } from './pages/SearchPage'
import { ProSearchPage } from './pages/ProSearchPage'
import { CandidateDetailPage } from './pages/CandidateDetailPage'
import { CompanyManagement } from './pages/CompanyManagement'
import CompanyDashboard from './pages/CompanyDashboard'
import CompanyOnboarding from './pages/CompanyOnboarding'
import Home from './pages/Home'
import Login from './pages/Login'
import RegisterCandidat from './pages/RegisterCandidat'
import RegisterCompany from './pages/RegisterCompany'
import AcceptInvitation from './pages/AcceptInvitation'
import AuthGuard from './components/AuthGuard'
import './index.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
      <Routes>
        {/* Page d'accueil publique */}
        <Route path="/" element={<Home />} />
        
        {/* Routes d'authentification (publiques) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register/candidat" element={<RegisterCandidat />} />
        <Route path="/register/company" element={<RegisterCompany />} />
        <Route path="/invitation/accept" element={<AcceptInvitation />} />
        
        {/* Routes protégées - Candidat */}
        {/* Routes pour chaque étape de l'onboarding */}
        <Route 
          path="/onboarding" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <Navigate to="/onboarding/step0" replace />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step0" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step1" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step2" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step3" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step4" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step5" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step6" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step7" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/step8" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingStepper />
            </AuthGuard>
          } 
        />
        <Route 
          path="/onboarding/complete" 
          element={
            <AuthGuard allowedRoles={['ROLE_CANDIDAT']}>
              <OnboardingComplete />
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
        
        {/* Routes protégées - Recruteur / Entreprise */}
        <Route 
          path="/company/onboarding" 
          element={
            <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
              <CompanyOnboarding />
            </AuthGuard>
          } 
        />
        <Route 
          path="/company/dashboard" 
          element={
            <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
              <CompanyDashboard />
            </AuthGuard>
          } 
        />
        <Route 
          path="/company/search" 
          element={
            <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN', 'ROLE_RECRUITER']}>
              <ProSearchPage />
            </AuthGuard>
          } 
        />
        <Route 
          path="/company/management" 
          element={
            <AuthGuard allowedRoles={['ROLE_COMPANY_ADMIN']}>
              <CompanyDashboard />
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
        
        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ThemeProvider>
  )
}

export default App
