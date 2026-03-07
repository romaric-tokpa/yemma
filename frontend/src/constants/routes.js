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
  COMPANY_ONBOARDING_ETAPE: (step) => `/company/onboarding/etape/${step}`,
  COMPANY_DASHBOARD: '/company/dashboard',
  COMPANY_MANAGEMENT: '/company/management',
  COMPANY_SEARCH: '/company/search',
  
  // Offres d'emploi (publiques)
  JOB_OFFERS: '/offres',
  JOB_OFFER_DETAIL: (id) => `/offres/${id}`,
  // Offres intégrées au dashboard candidat (liste + détail)
  CANDIDATE_JOBS: '/candidate/dashboard/offres',
  CANDIDATE_JOB_DETAIL: (id) => `/candidate/dashboard/offres/${id}`,

  // Yemma (ex-admin) - Offres
  ADMIN_JOBS: '/yemma/jobs',
  ADMIN_JOB_NEW: '/yemma/jobs/new',
  ADMIN_JOB_EDIT: (id) => `/yemma/jobs/${id}/edit`,
  ADMIN_JOB_CANDIDATURES: (id) => `/yemma/jobs/${id}/candidatures`,

  // Routes recherche
  SEARCH: '/search',
  SEARCH_PRO: '/search/pro',
  CANDIDATE_DETAIL: (candidateId) => `/candidates/${candidateId}`,
  
  // Routes Yemma (ex-admin)
  ADMIN_DASHBOARD: '/yemma/dashboard',
  ADMIN_COMPANIES: '/yemma/companies',
  ADMIN_COMPANIES_LISTE: '/yemma/companies/liste',
  ADMIN_COMPANIES_RECRUTEURS: '/yemma/companies/recruteurs',
  ADMIN_COMPANIES_ABONNEMENTS: '/yemma/companies/abonnements',
  ADMIN_STATISTICS: '/yemma/statistics',
  ADMIN_STATISTICS_SECTEURS: '/yemma/statistics/secteurs',
  ADMIN_STATISTICS_PERIODE: '/yemma/statistics/periode',
  ADMIN_STATISTICS_OFFRES: '/yemma/statistics/offres',
  ADMIN_REVIEW: (candidateId) => `/yemma/review/${candidateId}`,
  ADMIN_REVIEW_PROFILE: (candidateId) => `/yemma/review/${candidateId}/profile`,
  ADMIN_REVIEW_DOCUMENTS: (candidateId) => `/yemma/review/${candidateId}/documents`,
  ADMIN_REVIEW_EVALUATION: (candidateId) => `/yemma/review/${candidateId}/evaluation`,
  ADMIN_CREATE_ACCOUNT: '/yemma/create-account',
  ADMIN_CVTHEQUE: '/yemma/cvtheque',
  ADMIN_VALIDATION: '/yemma/validation',
  ADMIN_INVITATIONS: '/yemma/invitations',
  ADMIN_DELETED_PROFILES: '/yemma/deleted-profiles',

  // Routes entreprise - onglets avec routes
  COMPANY_DASHBOARD_OVERVIEW: '/company/dashboard',
  COMPANY_DASHBOARD_SEARCH: '/company/dashboard/search',
  COMPANY_DASHBOARD_MANAGEMENT: '/company/dashboard/management',
  COMPANY_DASHBOARD_MANAGEMENT_TEAM: '/company/dashboard/management/team',
  COMPANY_DASHBOARD_MANAGEMENT_SUBSCRIPTION: '/company/dashboard/management/subscription',
  COMPANY_DASHBOARD_MANAGEMENT_HISTORY: '/company/dashboard/management/history',
  COMPANY_DASHBOARD_SETTINGS: '/company/dashboard/settings',

  // Routes candidat - sous-onglets offres
  CANDIDATE_OFFRES_LISTE: '/candidate/dashboard/offres',
  CANDIDATE_OFFRES_CANDIDATURES: '/candidate/dashboard/offres/candidatures',
  
  // Routes par défaut selon le rôle
  DEFAULT_ROUTES: {
    ROLE_CANDIDAT: '/candidate/dashboard',
    ROLE_COMPANY_ADMIN: '/company/dashboard',
    ROLE_RECRUITER: '/company/dashboard',
    ROLE_ADMIN: '/yemma/dashboard',
    ROLE_SUPER_ADMIN: '/yemma/dashboard',
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
