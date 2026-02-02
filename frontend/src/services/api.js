import axios from 'axios'

// Configuration des URLs des services backend
// Les variables d'environnement utilisent le préfixe VITE_ (requis par Vite)
// Production : chemins relatifs '' → /api/* routé par nginx/Traefik
// Développement local (port 3000 + localhost) : URLs directes
const getBaseUrl = (envVar, defaultPort) => {
  const envValue = import.meta.env[envVar]

  if (envValue !== undefined && envValue !== null && envValue !== '') {
    return envValue
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const port = window.location.port

    // Production : domaine yemma-solutions.com ou port 80/443/vide → chemins relatifs
    if (
      hostname.includes('yemma-solutions.com') ||
      port === '' ||
      port === '80' ||
      port === '443'
    ) {
      return ''
    }

    // Développement local uniquement (localhost:3000 avec Vite)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const protocol = window.location.protocol || 'http:'
      return `${protocol}//${hostname}:${defaultPort}`
    }

    // Par défaut : chemins relatifs (production via reverse proxy)
    return ''
  }

  return ''
}

const AUTH_API_URL = getBaseUrl('VITE_AUTH_API_URL', 8001)
const CANDIDATE_API_URL = getBaseUrl('VITE_CANDIDATE_API_URL', 8002)
const DOCUMENT_API_URL = getBaseUrl('VITE_DOCUMENT_API_URL', 8003)
const SEARCH_API_URL = getBaseUrl('VITE_SEARCH_API_URL', 8004)
const COMPANY_API_URL = getBaseUrl('VITE_COMPANY_API_URL', 8005)
const PAYMENT_API_URL = getBaseUrl('VITE_PAYMENT_API_URL', 8006)
const NOTIFICATION_API_URL = getBaseUrl('VITE_NOTIFICATION_API_URL', 8007)
const AUDIT_API_URL = getBaseUrl('VITE_AUDIT_API_URL', 8008)
const ADMIN_API_URL = getBaseUrl('VITE_ADMIN_API_URL', 8009)

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
    
    // Routes publiques qui ne nécessitent pas de token
    const publicRoutes = ['/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/password-reset']
    const isPublicRoute = publicRoutes.some(route => config.url?.includes(route))
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else if (!isPublicRoute) {
      // Ne pas afficher le warning pour les routes publiques
      console.warn('No auth token found in localStorage for request:', config.url)
    }
    return config
  })

  // Intercepteur pour gérer les erreurs
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Gérer les erreurs 401 (non autorisé) - rediriger vers login
      if (error.response?.status === 401) {
        console.warn('401 Unauthorized - Token may be invalid or expired:', error.config?.url)
        const token = localStorage.getItem('auth_token')
        if (token) {
          console.log('Token exists but is invalid. Removing from localStorage.')
        } else {
          console.log('No token found in localStorage.')
        }
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
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

// Client pour le service Document (avec support multipart/form-data)
const documentApiClient = axios.create({
  baseURL: DOCUMENT_API_URL,
  headers: {
    // Ne pas définir Content-Type ici, laisser axios le gérer pour FormData
  },
})

// Intercepteur pour ajouter le token JWT si disponible
documentApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Ne pas définir Content-Type pour FormData, axios le fera automatiquement
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Intercepteur pour gérer les erreurs
documentApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

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
    // Stocker le token dans localStorage après l'inscription
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token)
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token)
      }
    }
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

  // Confirmer la réinitialisation de mot de passe (avec token)
  confirmPasswordReset: async (token, newPassword) => {
    const response = await authApi.post('/api/v1/auth/password-reset/confirm', {
      token,
      new_password: newPassword,
    })
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

  // Mettre à jour le profil candidat (utilise PATCH /me avec PartialProfileUpdateSchema)
  updateProfile: async (profileId, data) => {
    // Construire le format attendu par le backend (PartialProfileUpdateSchema)
    const formattedData = {}
    
    // Si les champs accept_cgu, accept_rgpd, accept_verification sont présents, les mettre dans step0
    // Le schéma Step0ConsentSchema exige que tous les champs booléens soient présents
    if (data.accept_cgu !== undefined || data.accept_rgpd !== undefined || data.accept_verification !== undefined) {
      formattedData.step0 = {
        // Toujours envoyer les trois champs avec leurs valeurs ou false par défaut
        accept_cgu: Boolean(data.accept_cgu ?? false),
        accept_rgpd: Boolean(data.accept_rgpd ?? false),
        accept_verification: Boolean(data.accept_verification ?? false),
      }
    }
    
    // Si last_step_completed est présent, l'ajouter
    if (data.last_step_completed !== undefined && data.last_step_completed !== null) {
      formattedData.last_step_completed = data.last_step_completed
    }
    
    // Si d'autres champs de step1 sont présents, les mettre dans step1
    const step1Fields = ['first_name', 'last_name', 'date_of_birth', 'nationality', 'phone', 
                          'address', 'city', 'country', 'profile_title', 'professional_summary', 
                          'sector', 'main_job', 'total_experience', 'photo_url']
    const hasStep1Fields = step1Fields.some(field => data[field] !== undefined && data[field] !== null)
    
    if (hasStep1Fields) {
      formattedData.step1 = {}
      step1Fields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
          formattedData.step1[field] = data[field]
        }
      })
      // Ne pas envoyer step1 s'il est vide après filtrage
      if (Object.keys(formattedData.step1).length === 0) {
        delete formattedData.step1
      }
    }
    
    const response = await api.patch('/api/v1/profiles/me', formattedData)
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

  // ===== LISTE PROFILS (ADMIN) =====
  listProfiles: async (status = null, page = 1, size = 10) => {
    // Paramètres: status (optionnel), page, size
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    params.append('page', page)
    params.append('size', size)
    
    const response = await api.get(`/api/v1/profiles?${params.toString()}`)
    return response.data
  },

  // ===== STATISTIQUES PROFILS (ADMIN) =====
  getProfileStats: async () => {
    // Essayer d'utiliser l'endpoint stats si disponible
    try {
      const response = await api.get('/api/v1/profiles/stats')
      console.log('✅ Réponse de getProfileStats:', response.data)
      if (response.data && typeof response.data === 'object') {
        return response.data
      }
      console.warn('⚠️ Format de réponse inattendu pour getProfileStats:', response.data)
      return null
    } catch (err) {
      const status = err?.response?.status
      const url = err?.config?.url
      if (status === 422 || status === 404) {
        console.warn('⚠️ Endpoint /api/v1/profiles/stats non disponible (', status, '), fallback côté client')
      } else {
        console.warn('⚠️ Endpoint /api/v1/profiles/stats erreur:', status, url, err?.message)
      }
      return null
    }
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
    // Vérifier que file est bien une instance de File ou Blob
    if (!file || !(file instanceof File) && !(file instanceof Blob)) {
      // Si ce n'est pas un fichier, vérifier si c'est un ID de document déjà sauvegardé
      if (typeof file === 'number' || (typeof file === 'object' && file?.id)) {
        // C'est un document déjà sauvegardé, retourner l'objet tel quel
        return typeof file === 'number' ? { id: file } : file
      }
      throw new Error('Input not instance of File: Le fichier doit être une instance de File ou Blob')
    }

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

  // Upload un logo d'entreprise
  uploadCompanyLogo: async (file, companyId) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('company_id', companyId)

    const response = await documentApiClient.post('/api/v1/documents/upload/company-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Upload une photo de profil candidat (endpoint dédié)
  uploadProfilePhoto: async (file, candidateId) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('candidate_id', candidateId)

    const response = await documentApiClient.post('/api/v1/documents/upload/profile-photo', formData, {
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

  // Servir un document directement via le service (proxy)
  getDocumentServeUrl: (documentId) => {
    // Utiliser l'endpoint serve qui proxy vers MinIO
    // Construire l'URL en utilisant DOCUMENT_API_URL
    const baseUrl = DOCUMENT_API_URL || ''
    if (baseUrl) {
      // Si DOCUMENT_API_URL est défini, l'utiliser directement
      return `${baseUrl}/api/v1/documents/serve/${documentId}`
    }
    // Sinon, utiliser une URL relative (passera par nginx si configuré)
    return `/api/v1/documents/serve/${documentId}`
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
    const requestData = {
      query: filters.query,
      job_title: filters.job_title,
      min_experience: filters.min_experience,
      max_experience: filters.max_experience,
      skills: filters.skills,
      location: filters.location,
      availability: filters.availability,
      education_levels: filters.education_levels,
      min_admin_score: filters.min_admin_score,
      contract_types: filters.contract_types,
      sector: filters.sector,
      page: filters.page || 1,
      size: filters.size || 20,
    }
    // Nettoyer les valeurs undefined
    Object.keys(requestData).forEach(key => {
      if (requestData[key] === undefined || requestData[key] === null ||
          requestData[key] === '' ||
          (Array.isArray(requestData[key]) && requestData[key].length === 0)) {
        delete requestData[key]
      }
    })
    const response = await searchApi.post('/api/v1/search/search', requestData)
    return response.data
  },

  // Récupérer le profil complet d'un candidat (pour les recruteurs)
  getCandidateProfile: async (candidateId) => {
    const response = await searchApi.get(`/api/v1/candidates/${candidateId}`)
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
  // Créer une entreprise
  createCompany: async (data) => {
    const response = await companyApiClient.post('/api/v1/companies', data)
    return response.data
  },

  // Lister toutes les entreprises (admin seulement)
  listCompanies: async () => {
    const response = await companyApiClient.get('/api/v1/companies')
    return response.data
  },

  // Récupérer l'entreprise de l'utilisateur actuel
  getMyCompany: async () => {
    const response = await companyApiClient.get('/api/v1/companies/me/company')
    return response.data
  },

  // Récupérer une entreprise par ID
  getCompany: async (companyId) => {
    const response = await companyApiClient.get(`/api/v1/companies/${companyId}`)
    return response.data
  },
  
  // Mettre à jour l'entreprise
  updateCompany: async (companyId, data) => {
    const response = await companyApiClient.put(`/api/v1/companies/${companyId}`, data)
    return response.data
  },

  // Récupérer les membres de l'équipe
  getTeamMembers: async (companyId) => {
    const response = await companyApiClient.get(`/api/v1/companies/${companyId}/team-members`)
    return response.data
  },

  // Créer un compte recruteur (nouveau système)
  inviteMember: async (companyId, memberData) => {
    const response = await companyApiClient.post(`/api/v1/invitations/invite`, {
      email: memberData.email,
      first_name: memberData.first_name,
      last_name: memberData.last_name,
      password: memberData.password,
    })
    return response.data
  },

  // Valider un token d'invitation (récupérer les infos)
  validateInvitation: async (token) => {
    const response = await companyApiClient.get(`/api/v1/invitations/validate/${token}`)
    return response.data
  },

  // Accepter une invitation et créer le compte
  acceptInvitation: async (data) => {
    const response = await companyApiClient.post(`/api/v1/invitations/accept-invite`, data)
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
