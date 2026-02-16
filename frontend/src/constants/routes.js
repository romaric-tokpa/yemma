/**
 * Constantes pour les routes de l'application
 * Centralise toutes les URLs pour faciliter la maintenance
 */

export const ROUTES = {
  // Routes publiques
  HOME: '/',
  CANDIDAT: '/candidat',
  REGISTER_CHOICE: '/register/choice',
  CONTACT: '/contact',
  
  // Routes d'authentification
  LOGIN: '/login',
  REGISTER_CANDIDAT: '/register/candidat',
  REGISTER_COMPANY: '/register/company',
  RESET_PASSWORD: '/reset-password',
  ACCEPT_INVITATION: '/invitation/accept',
  
  // Routes légales
  LEGAL_MENTIONS: '/legal/mentions',
  LEGAL_PRIVACY: '/legal/privacy',
  LEGAL_TERMS: '/legal/terms',
  
  // Routes candidat
  ONBOARDING: '/onboarding',
  ONBOARDING_STEP: (step) => `/onboarding/step${step}`,
  ONBOARDING_COMPLETE: '/onboarding/complete',
  CANDIDATE_DASHBOARD: '/candidate/dashboard',
  CANDIDATE_DASHBOARD_TAB: (tab) => `/candidate/dashboard/${tab}`,
  CANDIDATE_PROFILE_EDIT: '/candidate/dashboard/profile?edit=1', // Intégré au dashboard
  PROFILE_EDIT: '/profile/edit', // Alias → redirige vers dashboard
  
  // Routes entreprise
  COMPANY_ONBOARDING: '/company/onboarding',
  COMPANY_DASHBOARD: '/company/dashboard',
  COMPANY_MANAGEMENT: '/company/management',
  COMPANY_SEARCH: '/company/search',
  
  // Offres d'emploi (publiques)
  JOB_OFFERS: '/offres',
  JOB_OFFER_DETAIL: (id) => `/offres/${id}`,

  // Admin - Offres
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_JOB_NEW: '/admin/jobs/new',
  ADMIN_JOB_EDIT: (id) => `/admin/jobs/${id}/edit`,

  // Routes recherche
  SEARCH: '/search',
  SEARCH_PRO: '/search/pro',
  CANDIDATE_DETAIL: (candidateId) => `/candidates/${candidateId}`,
  
  // Routes admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_COMPANIES: '/admin/companies',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_REVIEW: (candidateId) => `/admin/review/${candidateId}`,
  
  // Routes par défaut selon le rôle
  DEFAULT_ROUTES: {
    ROLE_CANDIDAT: '/candidate/dashboard',
    ROLE_COMPANY_ADMIN: '/company/dashboard',
    ROLE_RECRUITER: '/company/dashboard',
    ROLE_ADMIN: '/admin/dashboard',
    ROLE_SUPER_ADMIN: '/admin/dashboard',
  },
}

/**
 * Retourne la route par défaut selon le rôle de l'utilisateur
 */
export const getDefaultRouteForRole = (roles) => {
  if (!roles || roles.length === 0) return ROUTES.HOME
  
  if (roles.includes('ROLE_CANDIDAT')) {
    return ROUTES.DEFAULT_ROUTES.ROLE_CANDIDAT
  } else if (roles.includes('ROLE_COMPANY_ADMIN')) {
    return ROUTES.DEFAULT_ROUTES.ROLE_COMPANY_ADMIN
  } else if (roles.includes('ROLE_RECRUITER')) {
    return ROUTES.DEFAULT_ROUTES.ROLE_RECRUITER
  } else if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN')) {
    return ROUTES.DEFAULT_ROUTES.ROLE_ADMIN
  }
  
  return ROUTES.HOME
}
