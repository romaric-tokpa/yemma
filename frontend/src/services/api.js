import axios from 'axios'

// Configuration des URLs des services backend
// Les variables d'environnement utilisent le préfixe VITE_ (requis par Vite)
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8001'
const CANDIDATE_API_URL = import.meta.env.VITE_CANDIDATE_API_URL || 'http://localhost:8002'
const DOCUMENT_API_URL = import.meta.env.VITE_DOCUMENT_API_URL || 'http://localhost:8003'
const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL || 'http://localhost:8004'
const COMPANY_API_URL = import.meta.env.VITE_COMPANY_API_URL || 'http://localhost:8005'
const PAYMENT_API_URL = import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:8006'
const NOTIFICATION_API_URL = import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:8007'
const AUDIT_API_URL = import.meta.env.VITE_AUDIT_API_URL || 'http://localhost:8008'
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8009'

// Helper pour créer un client axios avec authentification
const createApiClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Intercepteur pour ajouter le token JWT si disponible
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Intercepteur pour gérer les erreurs
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Gérer les erreurs 401 (non autorisé) - rediriger vers login
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        // Optionnel: rediriger vers la page de login
        // window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  return client
}

// Client pour le service Candidate (API par défaut)
const api = createApiClient(CANDIDATE_API_URL)

// Client pour le service Auth
const authApi = createApiClient(AUTH_API_URL)

// Client pour le service Document
const documentApiClient = createApiClient(DOCUMENT_API_URL)

// Clients pour les autres services
const searchApi = createApiClient(SEARCH_API_URL)
const companyApiClient = createApiClient(COMPANY_API_URL)
const paymentApiClient = createApiClient(PAYMENT_API_URL)
const auditApi = createApiClient(AUDIT_API_URL)
const adminApiClient = createApiClient(ADMIN_API_URL)

// ============================================
// SERVICE AUTH
// ============================================
export const authApiService = {
  // Inscription
  register: async (data) => {
    const response = await authApi.post('/api/v1/auth/register', data)
    return response.data
  },

  // Connexion
  login: async (email, password) => {
    const response = await authApi.post('/api/v1/auth/login', {
      email,
      password,
    })
    // Stocker le token dans localStorage
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token)
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token)
      }
    }
    return response.data
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },

  // Rafraîchir le token
  refreshToken: async (refreshToken) => {
    const response = await authApi.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    })
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token)
    }
    return response.data
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: async () => {
    const response = await authApi.get('/api/v1/users/me')
    return response.data
  },

  // Réinitialisation de mot de passe
  requestPasswordReset: async (email) => {
    const response = await authApi.post('/api/v1/auth/password-reset', { email })
    return response.data
  },

  // Changer le mot de passe
  changePassword: async (oldPassword, newPassword) => {
    const response = await authApi.post('/api/v1/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    })
    return response.data
  },
}

// ============================================
// SERVICE CANDIDATE
// ============================================
export const candidateApi = {
  // Créer un profil candidat
  createProfile: async (data) => {
    const response = await api.post('/api/v1/profiles', data)
    return response.data
  },

  // Récupérer le profil candidat
  getProfile: async (profileId) => {
    const response = await api.get(`/api/v1/profiles/${profileId}`)
    return response.data
  },

  // Récupérer mon profil
  getMyProfile: async () => {
    const response = await api.get('/api/v1/profiles/me')
    return response.data
  },

  // Mettre à jour le profil candidat
  updateProfile: async (profileId, data) => {
    const response = await api.put(`/api/v1/profiles/${profileId}`, data)
    return response.data
  },

  // Soumettre le profil pour validation
  submitProfile: async (profileId) => {
    const response = await api.post(`/api/v1/profiles/${profileId}/submit`)
    return response.data
  },

  // ===== EXPÉRIENCES =====
  createExperience: async (profileId, data) => {
    const response = await api.post(`/api/v1/profiles/${profileId}/experiences`, data)
    return response.data
  },

  getExperiences: async (profileId) => {
    const response = await api.get(`/api/v1/profiles/${profileId}/experiences`)
    return response.data
  },

  deleteExperience: async (profileId, experienceId) => {
    const response = await api.delete(`/api/v1/profiles/${profileId}/experiences/${experienceId}`)
    return response.data
  },

  // ===== FORMATIONS =====
  createEducation: async (profileId, data) => {
    const response = await api.post(`/api/v1/profiles/${profileId}/educations`, data)
    return response.data
  },

  getEducations: async (profileId) => {
    const response = await api.get(`/api/v1/profiles/${profileId}/educations`)
    return response.data
  },

  deleteEducation: async (profileId, educationId) => {
    const response = await api.delete(`/api/v1/profiles/${profileId}/educations/${educationId}`)
    return response.data
  },

  // ===== CERTIFICATIONS =====
  createCertification: async (profileId, data) => {
    const response = await api.post(`/api/v1/profiles/${profileId}/certifications`, data)
    return response.data
  },

  getCertifications: async (profileId) => {
    const response = await api.get(`/api/v1/profiles/${profileId}/certifications`)
    return response.data
  },

  deleteCertification: async (profileId, certificationId) => {
    const response = await api.delete(`/api/v1/profiles/${profileId}/certifications/${certificationId}`)
    return response.data
  },

  // ===== COMPÉTENCES =====
  createSkill: async (profileId, data) => {
    const response = await api.post(`/api/v1/profiles/${profileId}/skills`, data)
    return response.data
  },

  getSkills: async (profileId) => {
    const response = await api.get(`/api/v1/profiles/${profileId}/skills`)
    return response.data
  },

  deleteSkill: async (profileId, skillId) => {
    const response = await api.delete(`/api/v1/profiles/${profileId}/skills/${skillId}`)
    return response.data
  },

  // ===== PRÉFÉRENCES =====
  updateJobPreferences: async (profileId, data) => {
    const response = await api.put(`/api/v1/profiles/${profileId}/job-preferences`, data)
    return response.data
  },

  getJobPreferences: async (profileId) => {
    const response = await api.get(`/api/v1/profiles/${profileId}/job-preferences`)
    return response.data
  },

  // Méthode de compatibilité (ancienne API)
  saveProfile: async (data) => {
    // Pour compatibilité avec l'ancien code
    const response = await api.post('/api/v1/profiles', data)
    return response.data
  },
}

// ============================================
// SERVICE ADMIN
// ============================================
export const adminApi = {
  // Récupérer la liste des profils à valider
  getPendingProfiles: async (page = 1, size = 20) => {
    const response = await adminApiClient.get('/api/v1/admin/pending-profiles', {
      params: { page, size },
    })
    return response.data
  },

  // Récupérer un profil pour validation
  getProfileForReview: async (candidateId) => {
    const response = await adminApiClient.get(`/api/v1/admin/profiles/${candidateId}`)
    return response.data
  },

  // Valider un profil
  validateProfile: async (candidateId, reportData) => {
    // Mapper les données frontend vers le format backend
    const payload = {
      overallScore: reportData.overallScore,
      softSkills: reportData.softSkills || null,
      summary: reportData.summary,
      // Champs optionnels avec valeurs par défaut
      technicalSkills: reportData.technicalSkills || null,
      communication: reportData.communication || null,
      motivation: reportData.motivation || null,
      softSkillsTags: reportData.softSkillsTags || [],
      interview_notes: reportData.interview_notes || '',
      recommendations: reportData.recommendations || '',
    }
    
    const response = await adminApiClient.post(`/api/v1/admin/validate/${candidateId}`, payload)
    return response.data
  },

  // Rejeter un profil
  rejectProfile: async (candidateId, reportData) => {
    const payload = {
      rejectionReason: reportData.rejectionReason || reportData.summary || 'Non spécifié',
      overallScore: reportData.overallScore || null,
      interview_notes: reportData.interview_notes || '',
    }
    
    const response = await adminApiClient.post(`/api/v1/admin/reject/${candidateId}`, payload)
    return response.data
  },

  // Archiver un profil
  archiveProfile: async (candidateId) => {
    const response = await adminApiClient.post(`/api/v1/admin/archive/${candidateId}`)
    return response.data
  },

  // Récupérer le rapport d'évaluation d'un candidat
  getCandidateEvaluation: async (candidateId) => {
    const response = await adminApiClient.get(`/api/v1/admin/evaluation/${candidateId}`)
    return response.data
  },
}

// ============================================
// SERVICE DOCUMENT
// ============================================
export const documentApi = {
  // Upload un document
  uploadDocument: async (file, candidateId, documentType) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('candidate_id', candidateId)
    formData.append('document_type', documentType)

    const response = await documentApiClient.post('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Récupérer les documents d'un candidat
  getCandidateDocuments: async (candidateId) => {
    const response = await documentApiClient.get(`/api/v1/documents/candidate/${candidateId}`)
    return response.data
  },

  // Récupérer un document
  getDocument: async (documentId) => {
    const response = await documentApiClient.get(`/api/v1/documents/${documentId}`)
    return response.data
  },

  // Générer un lien de visualisation (présigné)
  getDocumentViewUrl: async (documentId) => {
    const response = await documentApiClient.get(`/api/v1/documents/view/${documentId}`)
    return response.data
  },

  // Supprimer un document
  deleteDocument: async (documentId) => {
    const response = await documentApiClient.delete(`/api/v1/documents/${documentId}`)
    return response.data
  },
}

export const searchApiService = {
  // Rechercher des candidats (GET)
  searchCandidates: async (filters) => {
    const params = new URLSearchParams()
    if (filters.query) params.append('query', filters.query)
    if (filters.sectors?.length) params.append('sectors', filters.sectors.join(','))
    if (filters.main_jobs?.length) params.append('main_jobs', filters.main_jobs.join(','))
    if (filters.min_experience !== undefined) params.append('min_experience', filters.min_experience)
    if (filters.max_experience !== undefined) params.append('max_experience', filters.max_experience)
    if (filters.min_admin_score !== undefined) params.append('min_admin_score', filters.min_admin_score)
    if (filters.skills?.length) params.append('skills', filters.skills.join(','))
    if (filters.contract_types?.length) params.append('contract_types', filters.contract_types.join(','))
    if (filters.locations?.length) params.append('locations', filters.locations.join(','))
    params.append('page', filters.page || 1)
    params.append('size', filters.size || 20)
    
    const response = await searchApi.get(`/api/v1/search?${params.toString()}`)
    return response.data
  },

  // Recherche POST avec highlight
  postSearch: async (filters) => {
    const response = await searchApi.post('/api/v1/search/search', {
      query: filters.query,
      min_experience: filters.min_experience,
      skills: filters.skills,
      location: filters.location,
      page: filters.page || 1,
      size: filters.size || 20,
    })
    return response.data
  },
}

export const paymentApiService = {
  // Vérifier le quota
  checkQuota: async (companyId) => {
    const response = await paymentApiClient.post('/api/v1/quotas/check', {
      company_id: companyId,
      quota_type: 'profile_views'
    })
    return response.data
  },

  // Utiliser un quota
  useQuota: async (companyId) => {
    const response = await paymentApiClient.post('/api/v1/quotas/use', {
      company_id: companyId,
      quota_type: 'profile_views',
      amount: 1
    })
    return response.data
  },

  // Récupérer l'abonnement d'une entreprise
  getSubscription: async (companyId) => {
    const response = await paymentApiClient.get(`/api/v1/subscriptions/company/${companyId}`)
    return response.data
  },
}

export const paymentApi = {
  ...paymentApiService,
  
  // Récupérer l'abonnement d'une entreprise
  getCompanySubscription: async (companyId) => {
    const response = await paymentApiClient.get(`/api/v1/subscriptions/company/${companyId}`)
    return response.data
  },

  // Récupérer les plans disponibles
  getPlans: async () => {
    const response = await paymentApiClient.get('/api/v1/plans')
    return response.data
  },

  // Créer une session de checkout
  createCheckoutSession: async (data) => {
    const response = await paymentApiClient.post('/api/v1/payments/create-checkout-session', data)
    return response.data
  },

  // Récupérer les factures d'une entreprise
  getInvoices: async (companyId) => {
    const response = await paymentApiClient.get(`/api/v1/invoices/company/${companyId}`)
    return response.data
  },
  
  // Récupérer une facture par ID
  getInvoice: async (invoiceId) => {
    const response = await paymentApiClient.get(`/api/v1/invoices/${invoiceId}`)
    return response.data
  },
}

export const companyApi = {
  // Récupérer l'entreprise de l'utilisateur actuel
  getMyCompany: async () => {
    const response = await companyApiClient.get('/api/v1/companies/me')
    return response.data
  },

  // Récupérer les membres de l'équipe
  getTeamMembers: async (companyId) => {
    const response = await companyApiClient.get(`/api/v1/companies/${companyId}/team-members`)
    return response.data
  },

  // Inviter un membre
  inviteMember: async (companyId, email) => {
    const response = await companyApiClient.post(`/api/v1/invitations/invite`, {
      email,
    })
    return response.data
  },

  // Supprimer un membre de l'équipe
  removeTeamMember: async (companyId, memberId) => {
    const response = await companyApiClient.delete(`/api/v1/companies/${companyId}/team-members/${memberId}`)
    return response.data
  },
}

export const auditApiService = {
  // Enregistrer un accès
  logAccess: async (accessData) => {
    const response = await auditApi.post('/api/v1/audit', accessData)
    return response.data
  },
}

// ============================================
// EXPORTS
// ============================================
export default api

// Export de tous les services pour faciliter les imports
export {
  authApi,
  api as candidateApiClient,
  documentApiClient,
  searchApi,
  companyApiClient,
  paymentApiClient,
  auditApi,
  adminApiClient,
}
