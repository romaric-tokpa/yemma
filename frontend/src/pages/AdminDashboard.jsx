import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { candidateApi, authApiService, companyApi, paymentApiService, documentApi } from '@/services/api'
import { buildPhotoUrl } from '@/utils/photoUtils'
import { 
  Users, FileCheck, Clock, CheckCircle, XCircle, Archive, 
  AlertCircle, Loader2, Eye, User, LogOut, Menu, X,
  Shield, TrendingUp, Search, Filter, RefreshCw, Calendar,
  Building, UserCheck, CreditCard, ChevronDown, ChevronRight
} from 'lucide-react'

// Générer un avatar par défaut basé sur les initiales
const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  VALIDATED: 'bg-[#D1E9E7] text-[#1a5a55] border-[#B8DDD9]',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200',
}

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  IN_REVIEW: 'En cours de validation',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
}

const STATUS_ICONS = {
  DRAFT: FileCheck,
  SUBMITTED: Clock,
  IN_REVIEW: AlertCircle,
  VALIDATED: CheckCircle,
  REJECTED: XCircle,
  ARCHIVED: Archive,
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Navigation principale
  const [activeSection, setActiveSection] = useState('candidates') // 'candidates' ou 'companies'
  const [companiesSubmenuOpen, setCompaniesSubmenuOpen] = useState(false)
  const [activeSubsection, setActiveSubsection] = useState(null) // 'list', 'recruiters', 'subscriptions'
  
  // État pour la validation candidat
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('SUBMITTED')
  const [searchQuery, setSearchQuery] = useState('')
  const [profilePhotos, setProfilePhotos] = useState({}) // Cache pour les URLs de photos par profile ID
  const [stats, setStats] = useState({
    DRAFT: 0,
    SUBMITTED: 0,
    IN_REVIEW: 0,
    VALIDATED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  })
  
  // État pour la gestion des entreprises
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [companyRecruiters, setCompanyRecruiters] = useState([])
  const [companySubscriptions, setCompanySubscriptions] = useState({})
  const [companiesLoading, setCompaniesLoading] = useState(false)

  // Fonction pour charger les statistiques
  const loadStats = async () => {
    try {
      // Essayer d'utiliser l'endpoint stats en premier
      try {
        const statsData = await candidateApi.getProfileStats()
        if (statsData && typeof statsData === 'object') {
          // S'assurer que tous les statuts sont présents avec des valeurs par défaut
          const completeStats = {
            DRAFT: parseInt(statsData.DRAFT) || 0,
            SUBMITTED: parseInt(statsData.SUBMITTED) || 0,
            IN_REVIEW: parseInt(statsData.IN_REVIEW) || 0,
            VALIDATED: parseInt(statsData.VALIDATED) || 0,
            REJECTED: parseInt(statsData.REJECTED) || 0,
            ARCHIVED: parseInt(statsData.ARCHIVED) || 0,
          }
          setStats(completeStats)
          console.log('✅ Statistiques chargées depuis l\'endpoint /api/v1/profiles/stats:', completeStats)
          return
        }
      } catch (statsError) {
        console.warn('⚠️ Endpoint /api/v1/profiles/stats non disponible, utilisation du fallback:', statsError?.response?.data || statsError?.message)
      }

      // Fallback: calculer côté client en comptant tous les profils pour chaque statut
      // Note: listProfiles retourne un tableau, pas une réponse paginée avec total
      // Donc on doit charger tous les profils (avec une taille élevée) pour compter
      const statuses = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'VALIDATED', 'REJECTED', 'ARCHIVED']
      const statsPromises = statuses.map(async (status) => {
        try {
          // Charger tous les profils pour ce statut (avec une taille élevée pour être sûr de tout récupérer)
          const response = await candidateApi.listProfiles(status, 1, 10000)
          
          if (Array.isArray(response)) {
            // Réponse directe: tableau de profils
            const count = response.length
            console.log(`📊 ${status}: ${count} profil(s)`)
            return { status, count }
          } else if (response && typeof response === 'object') {
            // Réponse paginée ou objet
            if (response.items && Array.isArray(response.items)) {
              // Si on a un total, l'utiliser
              if (typeof response.total === 'number') {
                return { status, count: response.total }
              }
              // Sinon, compter les items retournés (attention: peut être incomplet si pagination)
              console.warn(`⚠️ ${status}: Pas de total disponible, utilisation du nombre d'items retournés (${response.items.length})`)
              return { status, count: response.items.length }
            }
            // Si c'est un objet mais pas de items, essayer de trouver un total
            if (typeof response.total === 'number') {
              return { status, count: response.total }
            }
          }
          console.warn(`⚠️ ${status}: Format de réponse inattendu:`, response)
          return { status, count: 0 }
        } catch (err) {
          console.error(`❌ Erreur lors du chargement des stats pour ${status}:`, err?.response?.data || err?.message)
          return { status, count: 0 }
        }
      })
      
      const statsResults = await Promise.all(statsPromises)
      const newStats = {}
      statsResults.forEach(({ status, count }) => {
        newStats[status] = count
      })
      setStats(newStats)
      console.log('✅ Statistiques calculées côté client (fallback):', newStats)
    } catch (err) {
      console.error('❌ Erreur lors du chargement des statistiques:', err)
      // En cas d'erreur, ne pas mettre à jour les stats pour garder les anciennes valeurs
    }
  }

  // Fonction pour charger les photos de profil depuis les documents
  const loadProfilePhotos = async (profilesData) => {
    const photosMap = {}
    
    // Pour chaque profil sans photo_url, chercher dans les documents
    const profilesWithoutPhoto = profilesData.filter(p => !p.photo_url)
    
    if (profilesWithoutPhoto.length === 0) {
      return
    }
    
    console.log(`AdminDashboard: Loading photos for ${profilesWithoutPhoto.length} profiles without photo_url`)
    
    // Charger les photos en parallèle (avec limite pour éviter trop de requêtes)
    const photoPromises = profilesWithoutPhoto.slice(0, 20).map(async (profile) => {
      try {
        const docs = await documentApi.getCandidateDocuments(profile.id)
        const photoDoc = docs
          .filter(doc => 
            (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER') &&
            !doc.deleted_at
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        
        if (photoDoc) {
          const serveUrl = documentApi.getDocumentServeUrl(photoDoc.id)
          photosMap[profile.id] = serveUrl
          console.log(`AdminDashboard: Found photo for profile ${profile.id}:`, serveUrl)
        }
      } catch (error) {
        console.warn(`AdminDashboard: Error loading photo for profile ${profile.id}:`, error)
      }
    })
    
    await Promise.all(photoPromises)
    
    // Mettre à jour le cache des photos
    setProfilePhotos(prev => ({ ...prev, ...photosMap }))
  }

  // Fonction pour charger les profils
  const loadProfiles = async (status = 'SUBMITTED') => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await candidateApi.listProfiles(status, 1, 100)
      console.log('AdminDashboard: Profiles response:', response)
      
      let profilesData = []
      if (Array.isArray(response)) {
        profilesData = response
      } else if (response && response.items && Array.isArray(response.items)) {
        profilesData = response.items
      } else if (response && response.data && Array.isArray(response.data)) {
        profilesData = response.data
      }
      
      console.log('AdminDashboard: Loaded profiles:', profilesData.length, 'profiles with status', status)
      profilesData.forEach(profile => {
        console.log(`AdminDashboard: Profile ${profile.id} - photo_url:`, profile.photo_url)
      })
      
      profilesData.sort((a, b) => {
        const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
        const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
        return dateB - dateA
      })
      
      setProfiles(profilesData)
      
      // Charger les photos depuis les documents pour les profils qui n'ont pas de photo_url
      // Ne pas attendre pour ne pas bloquer l'affichage, les photos se chargeront en arrière-plan
      loadProfilePhotos(profilesData).catch(err => {
        console.error('Error loading profile photos:', err)
      })
      
    } catch (err) {
      console.error('Erreur lors du chargement des profils:', err)
      if (err.response?.status === 404 || err.response?.status === 501) {
        setError('L\'endpoint pour lister les profils n\'est pas encore disponible.')
        setProfiles([])
      } else {
        setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des profils')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (activeSection === 'candidates') {
      loadProfiles(selectedStatus)
    } else if (activeSection === 'companies') {
      loadCompanies()
    }
  }, [selectedStatus, activeSection])

  // Charger les entreprises
  const loadCompanies = async () => {
    try {
      setCompaniesLoading(true)
      const companiesData = await companyApi.listCompanies()
      setCompanies(companiesData || [])
      
      // Charger les abonnements pour toutes les entreprises
      const subscriptionPromises = (companiesData || []).map(async (company) => {
        try {
          const subscription = await paymentApiService.getSubscription(company.id)
          return { companyId: company.id, subscription }
        } catch (err) {
          console.warn(`Erreur lors du chargement de l'abonnement pour l'entreprise ${company.id}:`, err)
          return { companyId: company.id, subscription: null }
        }
      })
      const subscriptionsData = await Promise.all(subscriptionPromises)
      const subscriptionsMap = {}
      subscriptionsData.forEach(({ companyId, subscription }) => {
        subscriptionsMap[companyId] = subscription
      })
      setCompanySubscriptions(subscriptionsMap)
    } catch (err) {
      console.error('Erreur lors du chargement des entreprises:', err)
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement des entreprises')
    } finally {
      setCompaniesLoading(false)
    }
  }

  // Charger les recruteurs d'une entreprise
  const loadCompanyRecruiters = async (companyId) => {
    try {
      const recruiters = await companyApi.getTeamMembers(companyId)
      setCompanyRecruiters(recruiters || [])
    } catch (err) {
      console.error('Erreur lors du chargement des recruteurs:', err)
      setCompanyRecruiters([])
    }
  }

  // Gérer le clic sur une section
  const handleSectionClick = (section) => {
    if (section === 'companies') {
      setCompaniesSubmenuOpen(!companiesSubmenuOpen)
      if (!companiesSubmenuOpen) {
        setActiveSection('companies')
        setActiveSubsection('list')
      }
    } else {
      setActiveSection(section)
      setCompaniesSubmenuOpen(false)
      setActiveSubsection(null)
    }
  }

  // Gérer le clic sur un sous-menu
  const handleSubsectionClick = (subsection) => {
    setActiveSubsection(subsection)
    setActiveSection('companies')
    if (subsection === 'recruiters' && selectedCompany) {
      loadCompanyRecruiters(selectedCompany.id)
    }
  }

  // Gérer la sélection d'une entreprise
  const handleSelectCompany = async (company) => {
    setSelectedCompany(company)
    if (activeSubsection === 'recruiters') {
      await loadCompanyRecruiters(company.id)
    }
  }

  const handleViewProfile = (profileId) => {
    navigate(`/admin/review/${profileId}`)
  }

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      authApiService.logout()
      navigate('/login')
    }
  }

  // Filtrer les profils selon la recherche
  const filteredProfiles = profiles.filter(profile => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase()
    const email = (profile.email || '').toLowerCase()
    const title = (profile.profile_title || '').toLowerCase()
    return fullName.includes(query) || email.includes(query) || title.includes(query)
  })

  // Calculer les totaux pour les 3 statuts principaux
  const totalProfiles = (stats.SUBMITTED || 0) + (stats.VALIDATED || 0) + (stats.REJECTED || 0)

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden max-h-screen">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-56 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-16'}
        flex flex-col
      `}>
        {/* Header Sidebar */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-3">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm">Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden h-8 w-8"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Section Validation Candidat */}
          <div>
            <Button
              variant={activeSection === 'candidates' ? 'default' : 'ghost'}
              className="w-full justify-start h-9 text-sm px-2 mb-1"
              onClick={() => handleSectionClick('candidates')}
            >
              <User className="w-3.5 h-3.5 mr-2" />
              {sidebarOpen && <span>Validation Candidat</span>}
            </Button>
            {activeSection === 'candidates' && sidebarOpen && (
              <div className="ml-6 space-y-0.5 mt-1">
                <Button
                  variant={selectedStatus === 'SUBMITTED' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-8 text-xs px-2"
                  onClick={() => setSelectedStatus('SUBMITTED')}
                >
                  <Clock className="w-3 h-3 mr-2" />
                  Soumis
                </Button>
                <Button
                  variant={selectedStatus === 'VALIDATED' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-8 text-xs px-2"
                  onClick={() => setSelectedStatus('VALIDATED')}
                >
                  <CheckCircle className="w-3 h-3 mr-2" />
                  Validés
                </Button>
                <Button
                  variant={selectedStatus === 'REJECTED' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-8 text-xs px-2"
                  onClick={() => setSelectedStatus('REJECTED')}
                >
                  <XCircle className="w-3 h-3 mr-2" />
                  Rejetés
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Section Gestion des Entreprises */}
          <div>
            <Button
              variant={activeSection === 'companies' ? 'default' : 'ghost'}
              className="w-full justify-between h-9 text-sm px-2"
              onClick={() => handleSectionClick('companies')}
            >
              <div className="flex items-center">
                <Building className="w-3.5 h-3.5 mr-2" />
                {sidebarOpen && <span>Gestion Entreprises</span>}
              </div>
              {sidebarOpen && (companiesSubmenuOpen ? 
                <ChevronDown className="w-3.5 h-3.5" /> : 
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </Button>
            {activeSection === 'companies' && companiesSubmenuOpen && sidebarOpen && (
              <div className="ml-6 space-y-0.5 mt-1">
                <Button
                  variant={activeSubsection === 'list' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-8 text-xs px-2"
                  onClick={() => handleSubsectionClick('list')}
                >
                  <Building className="w-3 h-3 mr-2" />
                  Liste des entreprises
                </Button>
                <Button
                  variant={activeSubsection === 'recruiters' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-8 text-xs px-2"
                  onClick={() => handleSubsectionClick('recruiters')}
                >
                  <UserCheck className="w-3 h-3 mr-2" />
                  Recruteurs
                </Button>
                <Button
                  variant={activeSubsection === 'subscriptions' ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-8 text-xs px-2"
                  onClick={() => handleSubsectionClick('subscriptions')}
                >
                  <CreditCard className="w-3 h-3 mr-2" />
                  Abonnements
                </Button>
              </div>
            )}
          </div>
        </nav>

        {/* Footer Sidebar */}
        <div className="border-t border-gray-200 p-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-9 text-sm px-2"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            {sidebarOpen && <span>Déconnexion</span>}
          </Button>
        </div>
      </aside>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
          {/* Header - Responsive */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  {activeSection === 'candidates' ? 'Validation Candidat' : 'Gestion des Entreprises'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeSection === 'candidates' 
                    ? 'Gérez la validation des profils candidats'
                    : activeSubsection === 'list' 
                      ? 'Consultez et gérez les entreprises inscrites'
                      : activeSubsection === 'recruiters'
                        ? 'Gérez les recruteurs des entreprises'
                        : 'Gérez les abonnements des entreprises'}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (activeSection === 'candidates') {
                    loadStats()
                    loadProfiles(selectedStatus)
                  } else {
                    loadCompanies()
                  }
                }}
                className="lg:hidden h-8 w-8 flex-shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* Statistiques - Conditionnelles selon la section */}
            {activeSection === 'candidates' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
                  <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium text-yellow-900">
                          Soumis
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-xl font-bold text-yellow-900">{stats.SUBMITTED || 0}</div>
                      <p className="text-xs text-yellow-700 mt-0.5">À valider</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#E8F4F3] to-[#D1E9E7] border-[#B8DDD9]">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium text-[#1a5a55]">
                          Validés
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-[#226D68]" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-xl font-bold text-[#1a5a55]">{stats.VALIDATED || 0}</div>
                      <p className="text-xs text-[#1a5a55] mt-0.5">Profils approuvés</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="pb-2 pt-3 px-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium text-red-900">
                          Rejetés
                        </CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-xl font-bold text-red-900">{stats.REJECTED || 0}</div>
                      <p className="text-xs text-red-700 mt-0.5">Profils refusés</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Barre de recherche et filtres - Responsive */}
                <Card className="mb-3">
                  <CardContent className="pt-3 pb-3 px-3">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1 relative min-w-0">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                        <Input
                          placeholder="Rechercher par nom, email ou titre..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-9 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {['SUBMITTED', 'VALIDATED', 'REJECTED'].map((status) => (
                          <Button
                            key={status}
                            variant={selectedStatus === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedStatus(status)}
                            className="flex items-center gap-1.5 h-8 text-xs px-2"
                          >
                            {selectedStatus === status && (
                              <Filter className="w-3 h-3" />
                            )}
                            {STATUS_LABELS[status]}
                            {stats[status] > 0 && (
                              <Badge variant="secondary" className="ml-0.5 text-xs px-1 py-0 h-4">
                                {stats[status]}
                              </Badge>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === 'companies' && activeSubsection === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-blue-900">
                        Total Entreprises
                      </CardTitle>
                      <Building className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold text-blue-900">{companies.length}</div>
                    <p className="text-xs text-blue-700 mt-0.5">Entreprises inscrites</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Contenu conditionnel selon la section */}
          {activeSection === 'candidates' && (
            <Card>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b py-2 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-1.5 text-sm">
                    <Users className="w-4 h-4" />
                    Profils {STATUS_LABELS[selectedStatus]}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {loading ? 'Chargement...' : `${filteredProfiles.length} profil(s) trouvé(s)`}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loadStats()
                    loadProfiles(selectedStatus)
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-sm font-semibold mb-1">Erreur</p>
                  <p className="text-xs text-muted-foreground mb-3">{error}</p>
                  <Button onClick={() => loadProfiles(selectedStatus)} size="sm" className="h-8">
                    Réessayer
                  </Button>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <User className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold mb-1">Aucun profil trouvé</p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery
                      ? `Aucun profil ne correspond à "${searchQuery}"`
                      : `Aucun profil avec le statut "${STATUS_LABELS[selectedStatus]}" n'est disponible.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => {
                    const defaultAvatar = generateAvatarUrl(profile.first_name, profile.last_name)
                    
                    // Construire l'URL complète de la photo
                    // D'abord essayer depuis photo_url du profil
                    let photoUrl = buildPhotoUrl(profile.photo_url, documentApi)
                    
                    // Si pas de photo_url, essayer depuis le cache des photos chargées depuis les documents
                    if (!photoUrl && profilePhotos[profile.id]) {
                      photoUrl = profilePhotos[profile.id]
                    }
                    
                    const displayPhoto = photoUrl || defaultAvatar
                    
                    return (
                      <Card key={profile.id} className="hover:shadow-md transition-all duration-200 border-l-2 border-l-primary/50">
                        <CardContent className="pt-3 pb-3 px-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {/* Photo de profil */}
                            <div className="flex-shrink-0 self-center sm:self-start">
                              <img
                                src={displayPhoto}
                                alt={`${profile.first_name} ${profile.last_name}`}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-primary/20 shadow-sm"
                                onError={(e) => {
                                  // Si l'image échoue, utiliser l'avatar par défaut
                                  if (e.target.src !== defaultAvatar) {
                                    console.warn('AdminDashboard: Photo failed to load for profile', profile.id, 'URL was:', e.target.src)
                                    e.target.src = defaultAvatar
                                  }
                                }}
                                onLoad={() => {
                                  // Photo chargée avec succès
                                  if (photoUrl && !displayPhoto.includes('ui-avatars.com')) {
                                    console.log('AdminDashboard: Photo loaded successfully for profile', profile.id, 'URL:', displayPhoto)
                                  }
                                }}
                                key={`photo-${profile.id}-${photoUrl || 'default'}`}
                              />
                            </div>
                            
                            {/* Informations du profil */}
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-xs sm:text-sm font-semibold truncate">
                                  {profile.first_name} {profile.last_name}
                                </h3>
                                <Badge className={`${STATUS_COLORS[profile.status]} text-xs px-1.5 py-0 h-5 flex-shrink-0`}>
                                  {STATUS_LABELS[profile.status]}
                                </Badge>
                                {profile.is_verified && (
                                  <Badge variant="outline" className="bg-[#E8F4F3] text-[#1a5a55] border-[#B8DDD9] text-xs px-1.5 py-0 h-5 flex-shrink-0">
                                    Vérifié
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1 truncate">
                                {profile.email}
                              </p>
                              {profile.profile_title && (
                                <p className="text-xs font-medium mb-1 truncate">{profile.profile_title}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <TrendingUp className="w-3 h-3 flex-shrink-0" />
                                  {profile.completion_percentage?.toFixed(0) || 0}%
                                </span>
                                {profile.submitted_at && (
                                  <span className="flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    {new Date(profile.submitted_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                )}
                                {profile.admin_score && (
                                  <span className="flex items-center gap-0.5 font-semibold text-primary">
                                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                    {profile.admin_score}/5
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1.5 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleViewProfile(profile.id)}
                                className="flex items-center gap-1.5 h-8 px-2 text-xs w-full sm:w-auto"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Voir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Section Gestion des Entreprises */}
          {activeSection === 'companies' && (
            <>
              {activeSubsection === 'list' && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b py-2 px-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-1.5 text-sm">
                          <Building className="w-4 h-4" />
                          Liste des Entreprises
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {companiesLoading ? 'Chargement...' : `${companies.length} entreprise(s) trouvée(s)`}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadCompanies}
                        className="h-7 px-2 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Actualiser
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {companiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Building className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-semibold mb-1">Aucune entreprise trouvée</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {companies.map((company) => {
                          const subscription = companySubscriptions[company.id]
                          return (
                            <Card 
                              key={company.id} 
                              className={`hover:shadow-md transition-all duration-200 border-l-2 cursor-pointer ${
                                selectedCompany?.id === company.id ? 'border-l-primary bg-primary/5' : 'border-l-gray-200'
                              }`}
                              onClick={() => handleSelectCompany(company)}
                            >
                              <CardContent className="pt-3 pb-3 px-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {company.logo_url && (
                                      <img
                                        src={company.logo_url}
                                        alt={company.name}
                                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-semibold truncate">{company.name}</h3>
                                      <p className="text-xs text-muted-foreground truncate">{company.legal_id}</p>
                                      {subscription?.plan && (
                                        <Badge variant="outline" className="mt-1 text-xs">
                                          {subscription.plan.plan_type || 'N/A'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeSubsection === 'recruiters' && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b py-2 px-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-1.5 text-sm">
                          <UserCheck className="w-4 h-4" />
                          Recruteurs des Entreprises
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {selectedCompany 
                            ? `Recruteurs de ${selectedCompany.name}`
                            : 'Sélectionnez une entreprise dans la liste pour voir ses recruteurs'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {!selectedCompany ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <UserCheck className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-semibold mb-1">Sélectionnez une entreprise</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Allez dans "Liste des entreprises" et cliquez sur une entreprise
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setActiveSubsection('list')
                            setCompaniesSubmenuOpen(true)
                          }}
                        >
                          Voir la liste
                        </Button>
                      </div>
                    ) : companyRecruiters.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-semibold mb-1">Aucun recruteur trouvé</p>
                        <p className="text-xs text-muted-foreground">
                          Cette entreprise n'a pas encore de recruteurs
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs font-semibold text-blue-900 mb-1">{selectedCompany.name}</p>
                          <p className="text-xs text-blue-700">{companyRecruiters.length} recruteur(s)</p>
                        </div>
                        {companyRecruiters.map((recruiter) => (
                          <Card key={recruiter.id || recruiter.user_id} className="hover:shadow-md transition-all">
                            <CardContent className="pt-3 pb-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                  {recruiter.first_name?.[0] || recruiter.email?.[0] || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold">
                                    {recruiter.first_name && recruiter.last_name
                                      ? `${recruiter.first_name} ${recruiter.last_name}`
                                      : recruiter.email}
                                  </h3>
                                  <p className="text-xs text-muted-foreground truncate">{recruiter.email}</p>
                                  {recruiter.role_in_company && (
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                      {recruiter.role_in_company}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeSubsection === 'subscriptions' && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b py-2 px-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-1.5 text-sm">
                          <CreditCard className="w-4 h-4" />
                          Abonnements des Entreprises
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Gérez les abonnements et plans des entreprises
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadCompanies}
                        className="h-7 px-2 text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Actualiser
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {companiesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CreditCard className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-semibold mb-1">Aucune entreprise trouvée</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {companies.map((company) => {
                          const subscription = companySubscriptions[company.id]
                          return (
                            <Card key={company.id} className="hover:shadow-md transition-all">
                              <CardContent className="pt-3 pb-3 px-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {company.logo_url && (
                                      <img
                                        src={company.logo_url}
                                        alt={company.name}
                                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-semibold truncate">{company.name}</h3>
                                      {subscription?.plan ? (
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <Badge 
                                            variant="outline" 
                                            className={`text-xs ${
                                              subscription.plan.plan_type === 'ENTERPRISE' 
                                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                                : subscription.plan.plan_type === 'PRO'
                                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 bg-gray-50 text-gray-700'
                                            }`}
                                          >
                                            {subscription.plan.plan_type || 'FREEMIUM'}
                                          </Badge>
                                          {subscription.status && (
                                            <Badge 
                                              variant="secondary"
                                              className={`text-xs ${
                                                subscription.status === 'active' 
                                                  ? 'bg-[#E8F4F3] text-[#1a5a55] border-[#B8DDD9]'
                                                  : 'bg-gray-50 text-gray-700'
                                              }`}
                                            >
                                              {subscription.status}
                                            </Badge>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground mt-1">Aucun abonnement</p>
                                      )}
                                    </div>
                                  </div>
                                  {subscription?.quota_limit && (
                                    <div className="text-right text-xs text-muted-foreground">
                                      <div>Quota: {subscription.quota_used || 0}/{subscription.quota_limit}</div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
