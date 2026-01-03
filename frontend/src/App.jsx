import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import OnboardingStepper from './components/OnboardingStepper'
import OnboardingComplete from './pages/OnboardingComplete'
import CandidateDashboard from './pages/CandidateDashboard'
import AdminReview from './pages/AdminReview'
import { SearchPage } from './pages/SearchPage'
import { ProSearchPage } from './pages/ProSearchPage'
import { CandidateDetailPage } from './pages/CandidateDetailPage'
import { CompanyManagement } from './pages/CompanyManagement'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Yemma Solutions - Plateforme de Recrutement</h1>
            <p>Frontend React - En développement</p>
            
            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Section Candidat */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Candidat</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <a href="/candidate/dashboard" style={{ color: '#2563eb', textDecoration: 'none' }}>
                      Mon Dashboard
                    </a>
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <a href="/onboarding" style={{ color: '#2563eb', textDecoration: 'none' }}>
                      Créer/Modifier mon profil
                    </a>
                  </li>
                </ul>
              </div>

              {/* Section Recruteur */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Recruteur</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <a href="/search" style={{ color: '#2563eb', textDecoration: 'none' }}>
                      Rechercher des candidats
                    </a>
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <a href="/search/pro" style={{ color: '#2563eb', textDecoration: 'none' }}>
                      Recherche avancée
                    </a>
                  </li>
                </ul>
              </div>

              {/* Section Admin */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
                <h2 style={{ marginBottom: '1rem' }}>Administrateur</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <a href="/admin/review/1" style={{ color: '#2563eb', textDecoration: 'none' }}>
                      Valider un profil
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h2>Services API disponibles :</h2>
              <ul>
                <li>
                  <a href="http://localhost:8001/docs" target="_blank" rel="noopener noreferrer">
                    Auth Service API
                  </a>
                </li>
                <li>
                  <a href="http://localhost:8002/docs" target="_blank" rel="noopener noreferrer">
                    Candidate Service API
                  </a>
                </li>
              </ul>
            </div>
          </div>
        } />
        <Route path="/onboarding" element={<OnboardingStepper />} />
        <Route path="/onboarding/complete" element={<OnboardingComplete />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/admin/review/:candidateId" element={<AdminReview />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search/pro" element={<ProSearchPage />} />
        <Route path="/candidates/:candidateId" element={<CandidateDetailPage />} />
        <Route path="/company/management" element={<CompanyManagement />} />
      </Routes>
    </Router>
  )
}

export default App
