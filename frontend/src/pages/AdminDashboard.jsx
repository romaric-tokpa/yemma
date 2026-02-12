import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { candidateApi, authApiService, companyApi, paymentApiService, documentApi } from '@/services/api'
import { LogoutConfirmDialog } from '@/components/common/LogoutConfirmDialog'
import { buildPhotoUrl } from '@/utils/photoUtils'
import { formatDateTime } from '@/utils/dateUtils'
import { 
  Users, FileCheck, Clock, CheckCircle, XCircle, Archive, 
  AlertCircle, Loader2, Eye, User, LogOut, Menu, X,
  Shield, TrendingUp, Search, Filter, RefreshCw, Calendar,
  Building, UserCheck, CreditCard, ChevronDown, ChevronRight,
  Mail, Phone, Briefcase, MapPin, List, LayoutGrid, BarChart3, ArrowUpDown, ArrowUp, ArrowDown, PieChart,
  UserPlus, Copy, Send, CheckCircle2
} from 'lucide-react'

// Générer un avatar par défaut basé sur les initiales
const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

const STATUS_COLORS = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  SUBMITTED: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  VALIDATED: 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30',
  REJECTED: 'bg-[#e76f51]/15 text-[#c04a2f] border-[#e76f51]/30',
  ARCHIVED: 'bg-muted text-muted-foreground border-border',
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  
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
  const [profilesPage, setProfilesPage] = useState(1)
  const [profilesListTotal, setProfilesListTotal] = useState(null) // total renvoyé par listProfiles (pagination)
  const PROFILES_PAGE_SIZE = 50
  const [profilesViewMode, setProfilesViewMode] = useState('list') // 'list' | 'kanban'
  const [profilesByStatus, setProfilesByStatus] = useState({ SUBMITTED: [], VALIDATED: [], REJECTED: [] })
  const [kanbanPages, setKanbanPages] = useState({ SUBMITTED: 1, VALIDATED: 1, REJECTED: 1 })
  const [loadingKanban, setLoadingKanban] = useState(false)
  const [loadingKanbanColumn, setLoadingKanbanColumn] = useState(null) // status en cours de chargement
  const KANBAN_PER_COLUMN = 15
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
  const [viewingCompany, setViewingCompany] = useState(null) // Pour la fiche entreprise

  // État pour l'onglet Statistiques
  const [statsBySector, setStatsBySector] = useState([])
  const [loadingStatsBySector, setLoadingStatsBySector] = useState(false)
  const [statsSortBy, setStatsSortBy] = useState('total') // 'sector' | 'total' | 'validated' | 'rate'
  const [statsSortOrder, setStatsSortOrder] = useState('desc') // 'asc' | 'desc'
  const [statsByPeriod, setStatsByPeriod] = useState([])
  const [loadingStatsByPeriod, setLoadingStatsByPeriod] = useState(false)
  const [periodFilter, setPeriodFilter] = useState(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - 12)
    return {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
      groupBy: 'month', // 'day' | 'month' | 'year'
    }
  })
  const [statsTab, setStatsTab] = useState('overview') // 'overview' | 'sectors' | 'period'
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  // Vérifier si l'utilisateur actuel est SUPER_ADMIN (pour afficher le lien Invitations Admin)
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      setIsSuperAdmin(Array.isArray(user?.roles) && user.roles.includes('ROLE_SUPER_ADMIN'))
    } catch {
      setIsSuperAdmin(false)
    }
  }, [])

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

  const loadStatsBySector = async () => {
    try {
      setLoadingStatsBySector(true)
      const data = await candidateApi.getProfileStatsBySector()
      setStatsBySector(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Erreur chargement stats par secteur:', err)
      setStatsBySector([])
    } finally {
      setLoadingStatsBySector(false)
    }
  }

  const loadStatsByPeriod = async (overrideFilter) => {
    const filter = overrideFilter || periodFilter
    try {
      setLoadingStatsByPeriod(true)
      const data = await candidateApi.getProfileStatsByPeriod(filter.from, filter.to, filter.groupBy)
      setStatsByPeriod(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Erreur chargement stats par période:', err)
      setStatsByPeriod([])
    } finally {
      setLoadingStatsByPeriod(false)
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

  // Charge les profils avec pagination (page 1-based, size = PROFILES_PAGE_SIZE)
  const loadProfiles = async (status = 'SUBMITTED', page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await candidateApi.listProfiles(status, page, PROFILES_PAGE_SIZE)
      
      let profilesData = []
      if (Array.isArray(response)) {
        profilesData = response
        setProfilesListTotal(null)
      } else if (response?.items && Array.isArray(response.items)) {
        profilesData = response.items
        setProfilesListTotal(typeof response.total === 'number' ? response.total : null)
      } else if (response?.data && Array.isArray(response.data)) {
        profilesData = response.data
        setProfilesListTotal(null)
      } else {
        setProfilesListTotal(null)
      }
      
      profilesData.sort((a, b) => {
        const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
        const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
        return dateB - dateA
      })
      
      setProfiles(profilesData)
      loadProfilePhotos(profilesData).catch(() => {})
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

  const toArray = (r) => Array.isArray(r) ? r : r?.items ?? r?.data ?? []

  const loadProfilesKanban = async () => {
    setLoadingKanban(true)
    setError(null)
    setKanbanPages({ SUBMITTED: 1, VALIDATED: 1, REJECTED: 1 })
    try {
      const [submitted, validated, rejected] = await Promise.all([
        candidateApi.listProfiles('SUBMITTED', 1, KANBAN_PER_COLUMN),
        candidateApi.listProfiles('VALIDATED', 1, KANBAN_PER_COLUMN),
        candidateApi.listProfiles('REJECTED', 1, KANBAN_PER_COLUMN),
      ])
      setProfilesByStatus({
        SUBMITTED: toArray(submitted).sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)),
        VALIDATED: toArray(validated).sort((a, b) => new Date(b.validated_at || b.updated_at || 0) - new Date(a.validated_at || a.updated_at || 0)),
        REJECTED: toArray(rejected).sort((a, b) => new Date(b.rejected_at || b.updated_at || 0) - new Date(a.rejected_at || a.updated_at || 0)),
      })
      const all = toArray(submitted).concat(toArray(validated)).concat(toArray(rejected))
      loadProfilePhotos(all).catch(() => {})
    } catch (err) {
      console.error('Erreur chargement kanban:', err)
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement.')
    } finally {
      setLoadingKanban(false)
    }
  }

  const loadKanbanColumn = async (status, page) => {
    setLoadingKanbanColumn(status)
    setError(null)
    try {
      const response = await candidateApi.listProfiles(status, page, KANBAN_PER_COLUMN)
      const list = toArray(response)
      const sorted = status === 'SUBMITTED'
        ? list.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0))
        : status === 'VALIDATED'
          ? list.sort((a, b) => new Date(b.validated_at || b.updated_at || 0) - new Date(a.validated_at || a.updated_at || 0))
          : list.sort((a, b) => new Date(b.rejected_at || b.updated_at || 0) - new Date(a.rejected_at || a.updated_at || 0))
      setProfilesByStatus((prev) => ({ ...prev, [status]: sorted }))
      setKanbanPages((prev) => ({ ...prev, [status]: page }))
      loadProfilePhotos(list).catch(() => {})
    } catch (err) {
      console.error('Erreur chargement colonne kanban:', err)
      setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement.')
    } finally {
      setLoadingKanbanColumn(null)
    }
  }

  useEffect(() => {
    if (activeSection === 'candidates') {
      setProfilesPage(1)
      if (profilesViewMode === 'list') {
        loadProfiles(selectedStatus, 1)
      } else {
        loadProfilesKanban()
      }
    } else if (activeSection === 'companies') {
      loadCompanies()
    } else if (activeSection === 'statistics') {
      loadStatsBySector()
      loadStatsByPeriod()
    }
  }, [selectedStatus, activeSection, profilesViewMode])

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

  const handleViewCompany = (company) => {
    setViewingCompany(company)
  }

  const handleCloseCompanyView = () => {
    setViewingCompany(null)
  }

  const handleLogout = () => setLogoutDialogOpen(true)

  const confirmLogout = () => {
    authApiService.logout()
    navigate('/login')
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
    <div className="h-screen bg-muted/30 flex overflow-hidden max-h-screen">
      {/* Sidebar - charte Yemma */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-border shadow-sm
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-52 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-14'}
        flex flex-col
      `}>
        <div className="h-11 border-b border-border flex items-center justify-between px-2.5 bg-[#226D68]/5">
          {sidebarOpen && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-[#226D68] rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-gray-anthracite truncate">Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden h-8 w-8 text-gray-anthracite hover:text-[#226D68]"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div>
            <Button
              variant={activeSection === 'candidates' ? 'default' : 'ghost'}
              className={`w-full justify-start h-8 text-xs px-2 mb-0.5 ${activeSection === 'candidates' ? 'bg-[#226D68] hover:bg-[#1a5a55] text-white' : 'text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]'}`}
              onClick={() => handleSectionClick('candidates')}
            >
              <User className="w-3.5 h-3.5 mr-2 shrink-0" />
              {sidebarOpen && <span className="truncate">Candidats</span>}
            </Button>
            {activeSection === 'candidates' && sidebarOpen && (
              <div className="ml-5 pl-2 border-l border-[#226D68]/20 space-y-0.5 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-7 text-xs px-2 ${selectedStatus === 'SUBMITTED' ? 'bg-[#226D68]/10 text-[#1a5a55] font-medium' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                  onClick={() => setSelectedStatus('SUBMITTED')}
                >
                  <Clock className="w-3 h-3 mr-2 shrink-0" />
                  Soumis
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-7 text-xs px-2 ${selectedStatus === 'VALIDATED' ? 'bg-[#226D68]/10 text-[#1a5a55] font-medium' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                  onClick={() => setSelectedStatus('VALIDATED')}
                >
                  <CheckCircle className="w-3 h-3 mr-2 shrink-0" />
                  Validés
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-7 text-xs px-2 ${selectedStatus === 'REJECTED' ? 'bg-[#e76f51]/10 text-[#c04a2f] font-medium' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                  onClick={() => setSelectedStatus('REJECTED')}
                >
                  <XCircle className="w-3 h-3 mr-2 shrink-0" />
                  Rejetés
                </Button>
              </div>
            )}
          </div>

          <div>
            <Button
              variant={activeSection === 'statistics' ? 'default' : 'ghost'}
              className={`w-full justify-start h-8 text-xs px-2 mb-0.5 ${activeSection === 'statistics' ? 'bg-[#226D68] hover:bg-[#1a5a55] text-white' : 'text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]'}`}
              onClick={() => handleSectionClick('statistics')}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-2 shrink-0" />
              {sidebarOpen && <span className="truncate">Statistiques</span>}
            </Button>
          </div>

          <div>
            <Link to="/admin/cvtheque">
              <Button
                variant="ghost"
                className="w-full justify-start h-8 text-xs px-2 mb-0.5 text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]"
              >
                <Search className="w-3.5 h-3.5 mr-2 shrink-0" />
                {sidebarOpen && <span className="truncate">CVthèque</span>}
              </Button>
            </Link>
          </div>

          {isSuperAdmin && (
            <>
              <Separator className="my-2" />
              <div>
                <Link to="/admin/invitations">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-8 text-xs px-2 mb-0.5 text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]"
                  >
                    <Shield className="w-3.5 h-3.5 mr-2 shrink-0" />
                    {sidebarOpen && <span className="truncate">Invitations Admin</span>}
                  </Button>
                </Link>
              </div>
            </>
          )}

          <Separator className="my-2" />

          <div>
            <Button
              variant={activeSection === 'companies' ? 'default' : 'ghost'}
              className={`w-full justify-between h-8 text-xs px-2 ${activeSection === 'companies' ? 'bg-[#226D68] hover:bg-[#1a5a55] text-white' : 'text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]'}`}
              onClick={() => handleSectionClick('companies')}
            >
              <div className="flex items-center min-w-0">
                <Building className="w-3.5 h-3.5 mr-2 shrink-0" />
                {sidebarOpen && <span className="truncate">Entreprises</span>}
              </div>
              {sidebarOpen && (companiesSubmenuOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />)}
            </Button>
            {activeSection === 'companies' && companiesSubmenuOpen && sidebarOpen && (
              <div className="ml-5 pl-2 border-l border-[#226D68]/20 space-y-0.5 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-7 text-xs px-2 ${activeSubsection === 'list' ? 'bg-[#226D68]/10 text-[#1a5a55] font-medium' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                  onClick={() => handleSubsectionClick('list')}
                >
                  <Building className="w-3 h-3 mr-2 shrink-0" />
                  Liste
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-7 text-xs px-2 ${activeSubsection === 'recruiters' ? 'bg-[#226D68]/10 text-[#1a5a55] font-medium' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                  onClick={() => handleSubsectionClick('recruiters')}
                >
                  <UserCheck className="w-3 h-3 mr-2 shrink-0" />
                  Recruteurs
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-7 text-xs px-2 ${activeSubsection === 'subscriptions' ? 'bg-[#226D68]/10 text-[#1a5a55] font-medium' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                  onClick={() => handleSubsectionClick('subscriptions')}
                >
                  <CreditCard className="w-3 h-3 mr-2 shrink-0" />
                  Abonnements
                </Button>
              </div>
            )}
          </div>
        </nav>

        <div className="border-t border-border p-2 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-[#e76f51] hover:bg-[#e76f51]/5 h-8 text-xs px-2"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5 mr-2 shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </Button>
        </div>
      </aside>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={confirmLogout}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="container mx-auto px-3 sm:px-4 py-3 max-w-6xl">
          {/* Header — charte, compact */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-gray-anthracite truncate">
                {activeSection === 'candidates' ? 'Candidats' : activeSection === 'statistics' ? 'Statistiques' : 'Entreprises'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeSection === 'candidates' 
                  ? 'Validation des profils · Soumis, validés, rejetés'
                  : activeSection === 'statistics'
                    ? 'Effectifs, secteurs et évolution dans le temps'
                    : activeSubsection === 'list' 
                        ? 'Annuaire des entreprises partenaires'
                        : activeSubsection === 'recruiters'
                          ? 'Recruteurs par entreprise'
                          : 'Plans et quotas d\'abonnement'}
                </p>
              </div>
              <Button
                variant="outline"
              size="sm"
                onClick={() => {
                if (activeSection === 'candidates') { loadStats(); loadProfiles(selectedStatus, profilesPage) }
                else if (activeSection === 'statistics') { loadStatsBySector(); loadStatsByPeriod() }
                else { loadCompanies() }
              }}
              className="h-8 px-2.5 text-xs border-border text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68] shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Actualiser
              </Button>
            </div>

          {activeSection === 'statistics' && (() => {
            const totalInscrits = statsBySector.reduce((s, r) => s + (r.total ?? 0), 0)
            const totalValidated = statsBySector.reduce((s, r) => s + (r.validated ?? 0), 0)
            const validationRate = totalInscrits > 0 ? Math.round((totalValidated / totalInscrits) * 100) : 0
            const sectorCount = statsBySector.length
            const maxTotal = Math.max(...statsBySector.map(r => r.total ?? 0), 1)
            const sortedRows = [...statsBySector].sort((a, b) => {
              let va = a.sector ?? '', vb = b.sector ?? ''
              if (statsSortBy === 'total') { va = a.total ?? 0; vb = b.total ?? 0 }
              else if (statsSortBy === 'validated') { va = a.validated ?? 0; vb = b.validated ?? 0 }
              else if (statsSortBy === 'rate') {
                va = (a.total ?? 0) > 0 ? ((a.validated ?? 0) / (a.total ?? 1)) * 100 : 0
                vb = (b.total ?? 0) > 0 ? ((b.validated ?? 0) / (b.total ?? 1)) * 100 : 0
              }
              if (typeof va === 'string') return statsSortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
              return statsSortOrder === 'asc' ? va - vb : vb - va
            })
            const topByVolume = [...statsBySector].sort((a, b) => (b.total ?? 0) - (a.total ?? 0)).slice(0, 10)
            const topByRate = [...statsBySector]
              .filter(r => (r.total ?? 0) >= 1)
              .map(r => ({ ...r, rate: (r.total ?? 0) > 0 ? Math.round(((r.validated ?? 0) / (r.total ?? 1)) * 100) : 0 }))
              .sort((a, b) => b.rate - a.rate)
              .slice(0, 5)
            const toggleSort = (key) => {
              if (statsSortBy === key) setStatsSortOrder(o => o === 'asc' ? 'desc' : 'asc')
              else { setStatsSortBy(key); setStatsSortOrder(key === 'sector' ? 'asc' : 'desc') }
            }
            const SortIcon = ({ column }) => {
              if (statsSortBy !== column) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50 inline" />
              return statsSortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 ml-1 inline" /> : <ArrowDown className="w-3.5 h-3.5 ml-1 inline" />
            }
            return (
              <div className="space-y-3">
                {/* Barre KPI compacte — charte */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="region" aria-label="Indicateurs clés">
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2.5 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-[#226D68]/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-[#226D68]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Effectif total</p>
                      <p className="text-lg font-bold text-gray-anthracite tabular-nums">{totalInscrits}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2.5 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-[#226D68]/15 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4 text-[#226D68]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Validés</p>
                      <p className="text-lg font-bold text-[#1a5a55] tabular-nums">{totalValidated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2.5 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-[#e76f51]/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4 text-[#e76f51]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Taux validation</p>
                      <p className="text-lg font-bold text-gray-anthracite tabular-nums">{validationRate}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 py-2.5 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <PieChart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Secteurs</p>
                      <p className="text-lg font-bold text-gray-anthracite tabular-nums">{sectorCount}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation par vue */}
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
                  {[
                    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                    { id: 'sectors', label: 'Par secteur', icon: PieChart },
                    { id: 'period', label: 'Par période', icon: Calendar },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStatsTab(id)}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statsTab === id ? 'bg-white text-[#226D68] shadow-sm border border-border' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {loadingStatsBySector && statsTab !== 'period' ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span className="text-sm">Chargement…</span>
                  </div>
                ) : (
                  <>
                    {statsTab === 'overview' && (
                      <div className="rounded-lg border border-border bg-white p-4">
                        <p className="text-sm text-gray-anthracite mb-2">
                          <strong>Synthèse RH</strong> — {totalValidated} candidat{totalValidated !== 1 ? 's' : ''} validé{totalValidated !== 1 ? 's' : ''} sur {totalInscrits} inscrit{totalInscrits !== 1 ? 's' : ''} (taux {validationRate}%). {sectorCount === 0 ? 'Aucun secteur renseigné.' : `${sectorCount} secteur${sectorCount !== 1 ? 's' : ''} d\u2019activité représenté${sectorCount !== 1 ? 's' : ''}.`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Par secteur</strong> : viviers et taux par secteur. <strong>Par période</strong> : inscriptions et décisions dans le temps.
                        </p>
                      </div>
                    )}

                    {statsTab === 'sectors' && (
                      statsBySector.length === 0 ? (
                        <div className="rounded-lg border border-border bg-white p-6 text-center">
                          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                            <PieChart className="h-6 w-6 text-muted-foreground" />
                      </div>
                          <p className="text-sm font-medium text-gray-anthracite">Aucune donnée par secteur</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Renseignez le secteur d&apos;activité dans les profils candidats pour voir les statistiques.</p>
                        </div>
                      ) : (
                        <div className="grid lg:grid-cols-3 gap-3 items-start">
                          <div className="lg:col-span-2 rounded-lg border border-border bg-white overflow-hidden">
                            <div className="border-b border-border bg-[#226D68]/5 px-3 py-2">
                              <h3 className="text-xs font-semibold text-gray-anthracite uppercase tracking-wider">Répartition par secteur</h3>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left py-2 px-3 font-medium text-gray-anthracite">
                                      <button type="button" onClick={() => toggleSort('sector')} className="flex items-center hover:text-[#226D68]">Secteur <SortIcon column="sector" /></button>
                                    </th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-anthracite">
                                      <button type="button" onClick={() => toggleSort('total')} className="inline-flex items-center ml-auto hover:text-[#226D68]">Inscrits <SortIcon column="total" /></button>
                                    </th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-anthracite">
                                      <button type="button" onClick={() => toggleSort('validated')} className="inline-flex items-center ml-auto hover:text-[#226D68]">Validés <SortIcon column="validated" /></button>
                                    </th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-anthracite w-24">
                                      <button type="button" onClick={() => toggleSort('rate')} className="inline-flex items-center ml-auto hover:text-[#226D68]">Taux <SortIcon column="rate" /></button>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedRows.map((row) => {
                                    const total = row.total ?? 0
                                    const validated = row.validated ?? 0
                                    const rate = total > 0 ? Math.round((validated / total) * 100) : 0
                                    return (
                                      <tr key={row.sector} className="border-b border-border/60 hover:bg-muted/20">
                                        <td className="py-2 px-3 font-medium text-gray-anthracite">{row.sector}</td>
                                        <td className="py-2 px-3 text-right tabular-nums">{total}</td>
                                        <td className="py-2 px-3 text-right tabular-nums text-[#1a5a55] font-medium">{validated}</td>
                                        <td className="py-2 px-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <span className="tabular-nums text-muted-foreground w-6">{rate}%</span>
                                            <Progress value={rate} className="h-1.5 w-14 bg-muted [&>div]:bg-[#226D68]" />
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="rounded-lg border border-border bg-white overflow-hidden">
                              <div className="border-b border-border px-3 py-2 bg-muted/20">
                                <h3 className="text-xs font-semibold text-gray-anthracite">Volume (top 8)</h3>
                              </div>
                              <div className="p-3 space-y-2">
                                {topByVolume.slice(0, 8).map((row) => {
                                  const total = row.total ?? 0
                                  const chartMax = Math.max(...topByVolume.map(r => r.total ?? 0), 1)
                                  const pct = (total / chartMax) * 100
                                  return (
                                    <div key={row.sector} className="flex items-center gap-2">
                                      <span className="text-xs text-gray-anthracite truncate flex-1 min-w-0">{row.sector}</span>
                                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{total}</span>
                                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                                        <div className="h-full rounded-full bg-[#226D68]" style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            {topByRate.length > 0 && (
                              <div className="rounded-lg border border-border bg-white overflow-hidden">
                                <div className="border-b border-border px-3 py-2 bg-[#226D68]/5">
                                  <h3 className="text-xs font-semibold text-gray-anthracite">Meilleurs taux</h3>
                                </div>
                                <ul className="p-3 space-y-1.5">
                                  {topByRate.map((row, i) => (
                                    <li key={row.sector} className="flex items-center justify-between gap-2 text-xs">
                                      <span className="text-muted-foreground w-4">{i + 1}.</span>
                                      <span className="text-gray-anthracite truncate flex-1">{row.sector}</span>
                                      <span className="font-medium text-[#1a5a55] tabular-nums">{row.rate}%</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}

                    {statsTab === 'period' && (
                      <div className="rounded-lg border border-border bg-white overflow-hidden">
                        <div className="border-b border-border bg-[#226D68]/5 px-3 py-2">
                          <h3 className="text-xs font-semibold text-gray-anthracite uppercase tracking-wider">Évolution · Inscriptions, validations, rejets</h3>
                      </div>
                        <div className="p-3 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <input type="date" value={periodFilter.from} onChange={(e) => setPeriodFilter((f) => ({ ...f, from: e.target.value || f.from }))} className="h-7 px-2 rounded border border-border text-xs bg-background w-[130px]" />
                            <span className="text-muted-foreground text-xs">→</span>
                            <input type="date" value={periodFilter.to} onChange={(e) => setPeriodFilter((f) => ({ ...f, to: e.target.value || f.to }))} className="h-7 px-2 rounded border border-border text-xs bg-background w-[130px]" />
                            <select value={periodFilter.groupBy} onChange={(e) => setPeriodFilter((f) => ({ ...f, groupBy: e.target.value }))} className="h-7 px-2 rounded border border-border text-xs bg-background">
                              <option value="day">Jour</option>
                              <option value="month">Mois</option>
                              <option value="year">Année</option>
                            </select>
                            {[
                              { label: '7j', getRange: () => { const e = new Date(); const s = new Date(e); s.setDate(s.getDate() - 7); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10), groupBy: 'day' } } },
                              { label: '30j', getRange: () => { const e = new Date(); const s = new Date(e); s.setDate(s.getDate() - 30); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10), groupBy: 'day' } } },
                              { label: '3 mois', getRange: () => { const e = new Date(); const s = new Date(e); s.setMonth(s.getMonth() - 3); return { from: s.toISOString().slice(0, 10), to: e.toISOString().slice(0, 10), groupBy: 'month' } } },
                              { label: 'Année', getRange: () => { const e = new Date(); return { from: `${e.getFullYear()}-01-01`, to: e.toISOString().slice(0, 10), groupBy: 'month' } } },
                            ].map((preset) => (
                              <button key={preset.label} type="button" onClick={() => { const { from, to, groupBy } = preset.getRange(); setPeriodFilter({ from, to, groupBy }); loadStatsByPeriod({ from, to, groupBy }) }} className="h-7 px-2 rounded border border-border text-xs text-muted-foreground hover:bg-[#226D68]/10 hover:text-[#226D68] hover:border-[#226D68]/30">
                                {preset.label}
                              </button>
                            ))}
                            <Button size="sm" className="h-7 bg-[#226D68] hover:bg-[#1a5a55] text-white text-xs" onClick={() => loadStatsByPeriod()} disabled={loadingStatsByPeriod}>
                              {loadingStatsByPeriod ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              <span className="ml-1">Appliquer</span>
                            </Button>
                </div>
                          {loadingStatsByPeriod ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground text-xs"><Loader2 className="w-4 h-4 animate-spin mr-2" />Chargement…</div>
                          ) : statsByPeriod.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-3 text-center">Aucune donnée pour cette période.</p>
                          ) : (
                            <div className="overflow-x-auto rounded border border-border">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left py-2 px-3 font-medium text-gray-anthracite">Période</th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-anthracite">Inscr.</th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-anthracite">Validés</th>
                                    <th className="text-right py-2 px-3 font-medium text-gray-anthracite">Rejetés</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {statsByPeriod.map((row) => (
                                    <tr key={row.period} className="border-b border-border/60 hover:bg-muted/20">
                                      <td className="py-2 px-3 font-medium text-gray-anthracite">{row.period}</td>
                                      <td className="py-2 px-3 text-right tabular-nums">{row.inscriptions ?? 0}</td>
                                      <td className="py-2 px-3 text-right tabular-nums text-[#1a5a55] font-medium">{row.validated ?? 0}</td>
                                      <td className="py-2 px-3 text-right tabular-nums text-[#c04a2f] font-medium">{row.rejected ?? 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}

          {activeSection === 'candidates' && (
            <>
              {/* Barre KPI candidats — charte, compact */}
              <div className="grid grid-cols-3 gap-2 mb-3" role="region" aria-label="Effectifs par statut">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Soumis</p>
                    <p className="text-lg font-bold text-amber-700 tabular-nums">{stats.SUBMITTED || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-[#226D68]/15 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-[#226D68]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Validés</p>
                    <p className="text-lg font-bold text-[#1a5a55] tabular-nums">{stats.VALIDATED || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 shadow-sm">
                  <div className="w-9 h-9 rounded-lg bg-[#e76f51]/15 flex items-center justify-center shrink-0">
                    <XCircle className="h-4 w-4 text-[#e76f51]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rejetés</p>
                    <p className="text-lg font-bold text-[#c04a2f] tabular-nums">{stats.REJECTED || 0}</p>
                  </div>
                </div>
              </div>

              <Card className="mb-3 border border-border overflow-hidden">
                <CardContent className="p-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                        placeholder="Rechercher (nom, email, titre…)"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs bg-muted/30 border-border"
                        />
                      </div>
                    <div className="flex gap-1 flex-wrap">
                        {['SUBMITTED', 'VALIDATED', 'REJECTED'].map((status) => (
                          <Button
                            key={status}
                            variant={selectedStatus === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedStatus(status)}
                          className={`h-8 text-xs px-2.5 ${selectedStatus === status ? 'bg-[#226D68] hover:bg-[#1a5a55]' : 'border-border text-gray-anthracite hover:bg-[#226D68]/10'}`}
                          >
                            {STATUS_LABELS[status]}
                            {stats[status] > 0 && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4 bg-white/80 text-gray-anthracite">
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
            <Card className="mb-3 border border-border overflow-hidden">
              <CardContent className="p-2.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#226D68]/15 flex items-center justify-center">
                  <Building className="h-4 w-4 text-[#226D68]" />
                    </div>
                <div>
                  <p className="text-xs font-medium text-gray-anthracite">Total entreprises</p>
                  <p className="text-lg font-bold text-[#1a5a55]">{companies.length}</p>
                </div>
                  </CardContent>
                </Card>
          )}

          {activeSection === 'candidates' && (() => {
            const totalForStatus = (profilesListTotal != null ? profilesListTotal : stats[selectedStatus]) ?? 0
            const startItem = totalForStatus === 0 ? 0 : (profilesPage - 1) * PROFILES_PAGE_SIZE + 1
            const endItem = totalForStatus === 0 ? 0 : Math.min(profilesPage * PROFILES_PAGE_SIZE, (profilesPage - 1) * PROFILES_PAGE_SIZE + profiles.length)
            const hasNext = endItem < totalForStatus && profiles.length === PROFILES_PAGE_SIZE
            const hasPrev = profilesPage > 1
            const isKanban = profilesViewMode === 'kanban'
            const filterProfile = (p) => {
              if (!searchQuery) return true
              const q = searchQuery.toLowerCase()
              const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
              const email = (p.email || '').toLowerCase()
              const title = (p.profile_title || '').toLowerCase()
              return fullName.includes(q) || email.includes(q) || title.includes(q)
            }
            const renderProfileCard = (profile, compact = false) => {
              const defaultAvatar = generateAvatarUrl(profile.first_name, profile.last_name)
              let photoUrl = buildPhotoUrl(profile.photo_url, documentApi)
              if (!photoUrl && profilePhotos[profile.id]) photoUrl = profilePhotos[profile.id]
              const displayPhoto = photoUrl || defaultAvatar
              if (compact) {
                return (
                  <Card key={profile.id} className="border border-border hover:border-[#226D68]/40 transition-colors bg-white group">
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2">
                        <img src={displayPhoto} alt="" className="w-8 h-8 rounded-full object-cover border border-border shrink-0" onError={(e) => { e.target.src = defaultAvatar }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-anthracite truncate">{profile.first_name} {profile.last_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{profile.profile_title || profile.email}</p>
                </div>
                        <Button size="sm" onClick={() => handleViewProfile(profile.id)} className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#226D68] hover:bg-[#1a5a55]">
                          <Eye className="h-3 w-3" />
                </Button>
              </div>
                    </CardContent>
                  </Card>
                )
              }
              return (
                <Card key={profile.id} className="border border-border hover:border-[#226D68]/40 transition-colors bg-white">
                  <CardContent className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        <img src={displayPhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-border" onError={(e) => { e.target.src = defaultAvatar }} />
                </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-medium text-gray-anthracite truncate">{profile.first_name} {profile.last_name}</h3>
                          <Badge className={`${STATUS_COLORS[profile.status]} text-[10px] px-1.5 py-0 h-4 shrink-0`}>{STATUS_LABELS[profile.status]}</Badge>
                </div>
                        <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        <div className="flex flex-col gap-0.5 mt-0.5 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{profile.completion_percentage?.toFixed(0) ?? 0}%</span>
                            {profile.admin_score != null && <span className="font-medium text-[#226D68]">{profile.admin_score}/5</span>}
                </div>
                          {profile.created_at && <span title="Date d'inscription">Inscrit le {formatDateTime(profile.created_at)}</span>}
                          {profile.updated_at && profile.updated_at !== profile.created_at && (
                            <span title="Dernière modification">MAJ {formatDateTime(profile.updated_at)}</span>
                          )}
                          {profile.status === 'VALIDATED' && profile.validated_at && (
                            <span className="text-[#1a5a55]" title="Date de validation">Validé le {formatDateTime(profile.validated_at)}</span>
                          )}
                          {profile.status === 'REJECTED' && profile.rejected_at && (
                            <span className="text-[#c04a2f]" title="Date de rejet">Rejeté le {formatDateTime(profile.rejected_at)}</span>
                          )}
                          {['SUBMITTED', 'IN_REVIEW'].includes(profile.status) && profile.submitted_at && (
                            <span title="Date de soumission">Soumis le {formatDateTime(profile.submitted_at)}</span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleViewProfile(profile.id)} className="h-7 px-2.5 text-xs bg-[#226D68] hover:bg-[#1a5a55] text-white shrink-0">
                        <Eye className="h-3 w-3 mr-1" /> Voir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            }
                    return (
            <Card className="border border-border shadow-sm overflow-hidden">
              <CardHeader className="py-2.5 px-3 border-b border-border bg-[#226D68]/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-anthracite">
                      <Users className="w-4 h-4 text-[#226D68]" />
                      {isKanban ? 'Pipeline de validation' : `Profils · ${STATUS_LABELS[selectedStatus]}`}
                    </CardTitle>
                    <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
                      <Button variant="ghost" size="sm" onClick={() => setProfilesViewMode('list')} className={`h-7 w-7 p-0 rounded-md ${!isKanban ? 'bg-[#226D68] text-white hover:bg-[#1a5a55]' : 'text-muted-foreground hover:text-gray-anthracite'}`} title="Liste">
                        <List className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setProfilesViewMode('kanban')} className={`h-7 w-7 p-0 rounded-md ${isKanban ? 'bg-[#226D68] text-white hover:bg-[#1a5a55]' : 'text-muted-foreground hover:text-gray-anthracite'}`} title="Kanban">
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </Button>
                            </div>
                              </div>
                  {!isKanban && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {loading ? 'Chargement…' : totalForStatus === 0 ? '0 sur 0' : `${startItem}-${endItem} sur ${totalForStatus}`}
                                </span>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" disabled={!hasPrev || loading} onClick={() => { const p = profilesPage - 1; setProfilesPage(p); loadProfiles(selectedStatus, p) }} className="h-7 px-2 text-xs border-border text-gray-anthracite hover:bg-[#226D68]/10 disabled:opacity-50">Précédent</Button>
                        <Button variant="outline" size="sm" disabled={!hasNext || loading} onClick={() => { const p = profilesPage + 1; setProfilesPage(p); loadProfiles(selectedStatus, p) }} className="h-7 px-2 text-xs border-border text-gray-anthracite hover:bg-[#226D68]/10 disabled:opacity-50">Suivant</Button>
                      </div>
                    </div>
                  )}
                  {isKanban && (
                    <Button variant="outline" size="sm" onClick={loadProfilesKanban} disabled={loadingKanban} className="h-7 px-2 text-xs border-border text-gray-anthracite hover:bg-[#226D68]/10">
                      {loadingKanban ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Actualiser
                    </Button>
                                )}
                              </div>
              </CardHeader>
              <CardContent className="p-2 sm:p-3">
              {isKanban ? (
                (loadingKanban || error) ? (
                  loadingKanban ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#226D68]" /></div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-[#e76f51] mb-2" />
                      <p className="text-sm font-medium text-gray-anthracite mb-1">Erreur</p>
                      <p className="text-xs text-muted-foreground mb-3">{error}</p>
                      <Button onClick={loadProfilesKanban} size="sm" className="h-8 bg-[#226D68] hover:bg-[#1a5a55]">Réessayer</Button>
                            </div>
                  )
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[320px]">
                    {['SUBMITTED', 'VALIDATED', 'REJECTED'].map((status) => {
                      const list = (profilesByStatus[status] || []).filter(filterProfile)
                      const totalForCol = stats[status] ?? 0
                      const page = kanbanPages[status] ?? 1
                      const startItem = totalForCol === 0 ? 0 : (page - 1) * KANBAN_PER_COLUMN + 1
                      const endItem = totalForCol === 0 ? 0 : (page - 1) * KANBAN_PER_COLUMN + list.length
                      const hasNext = endItem < totalForCol && list.length === KANBAN_PER_COLUMN
                      const hasPrev = page > 1
                      const colLoading = loadingKanbanColumn === status
                      const headerBg = status === 'SUBMITTED' ? 'bg-amber-100/80 border-amber-200' : status === 'VALIDATED' ? 'bg-[#226D68]/10 border-[#226D68]/30' : 'bg-[#e76f51]/10 border-[#e76f51]/30'
                      return (
                        <div key={status} className="flex flex-col rounded-lg border border-border bg-muted/20 overflow-hidden">
                          <div className={`px-3 py-2 border-b ${headerBg} shrink-0 space-y-2`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-anthracite">{STATUS_LABELS[status]}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {totalForCol === 0 ? '0 sur 0' : `${startItem}-${endItem} sur ${totalForCol}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!hasPrev || colLoading}
                                onClick={() => loadKanbanColumn(status, page - 1)}
                                className="h-6 px-1.5 text-[10px] border-border text-gray-anthracite hover:bg-[#226D68]/10 disabled:opacity-50"
                              >
                                Précédent
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!hasNext || colLoading}
                                onClick={() => loadKanbanColumn(status, page + 1)}
                                className="h-6 px-1.5 text-[10px] border-border text-gray-anthracite hover:bg-[#226D68]/10 disabled:opacity-50"
                              >
                                Suivant
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0 max-h-[60vh]">
                            {colLoading ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-[#226D68]" />
                              </div>
                            ) : list.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-6 text-center">Aucun profil dans cette colonne</p>
                            ) : (
                              list.map((p) => renderProfileCard(p, true))
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#226D68]" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-[#e76f51] mb-2" />
                  <p className="text-sm font-medium text-gray-anthracite mb-1">Erreur</p>
                  <p className="text-xs text-muted-foreground mb-3 max-w-sm">{error}</p>
                  <Button onClick={() => loadProfiles(selectedStatus, profilesPage)} size="sm" className="h-8 bg-[#226D68] hover:bg-[#1a5a55]">
                    Réessayer
                  </Button>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed border-border bg-muted/20">
                  <User className="h-10 w-10 text-muted-foreground mb-2 opacity-60" />
                  <p className="text-sm font-medium text-gray-anthracite">Aucun profil</p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                    {searchQuery ? `Aucun candidat ne correspond à « ${searchQuery} ».` : `Aucun profil en statut ${STATUS_LABELS[selectedStatus].toLowerCase()} pour le moment.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredProfiles.map((profile) => renderProfileCard(profile, false))}
                </div>
              )}
            </CardContent>
          </Card>
            )
          })()}

          {activeSection === 'companies' && (
            <>
              {activeSubsection === 'list' && (
                <Card className="border border-neutral-200 shadow-none overflow-hidden bg-white">
                  <CardHeader className="py-2 px-3 border-b border-neutral-200 bg-[#E8F4F3]/60">
                    <CardTitle className="flex items-center gap-1.5 text-xs font-semibold text-[#2C2C2C] font-heading">
                      <Building className="w-3.5 h-3.5 text-[#226D68]" />
                      Annuaire entreprises
                    </CardTitle>
                    <CardDescription className="text-[11px] text-neutral-500 mt-0.5">
                      {companiesLoading ? 'Chargement…' : `${companies.length} entreprise${companies.length !== 1 ? 's' : ''} partenaire${companies.length !== 1 ? 's' : ''}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2">
                    {companiesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-[#226D68]" />
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center rounded-md border border-dashed border-neutral-200 bg-[#F4F6F8]">
                        <Building className="h-8 w-8 text-neutral-400 mb-1.5" />
                        <p className="text-xs font-medium text-[#2C2C2C]">Aucune entreprise</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Aucune entreprise partenaire enregistrée.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {companies.map((company) => {
                          const subscription = companySubscriptions[company.id]
                          const hasContactInfo = company.contact_first_name || company.contact_last_name || company.contact_email || company.contact_phone || company.contact_function
                          const contactParts = []
                          if (company.contact_first_name || company.contact_last_name) contactParts.push([company.contact_first_name, company.contact_last_name].filter(Boolean).join(' '))
                          if (company.contact_email) contactParts.push(company.contact_email)
                          if (company.contact_phone) contactParts.push(company.contact_phone)
                          return (
                            <Card
                              key={company.id}
                              className={`border transition-colors cursor-pointer ${selectedCompany?.id === company.id ? 'border-[#226D68] bg-[#E8F4F3]/50 shadow-sm' : 'border-neutral-200 hover:border-[#226D68]/40 hover:bg-[#F4F6F8]'}`}
                              onClick={() => setSelectedCompany(company)}
                            >
                              <CardContent className="py-2 px-2.5">
                                <div className="flex items-center gap-2.5">
                                  {company.logo_url ? (
                                    <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded-md object-cover border border-neutral-200 shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-md bg-[#E8F4F3] flex items-center justify-center shrink-0">
                                      <Building className="w-4 h-4 text-[#226D68]" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <h3 className="text-xs font-medium text-[#2C2C2C] truncate">{company.name}</h3>
                                      {subscription?.plan && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5 border-[#226D68]/30 text-[#1a5a55] font-normal shrink-0">
                                          {subscription.plan.plan_type || 'N/A'}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-neutral-500 truncate">{company.legal_id}</p>
                                    {hasContactInfo && contactParts.length > 0 && (
                                      <p className="text-[10px] text-neutral-600 truncate mt-0.5 flex items-center gap-1">
                                        {company.contact_phone && <Phone className="w-2.5 h-2.5 text-[#226D68] shrink-0" />}
                                        {contactParts.join(' · ')}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => { e.stopPropagation(); handleViewCompany(company) }}
                                    className="h-6 px-2 text-[10px] text-[#226D68] hover:bg-[#226D68]/10 hover:text-[#1a5a55] shrink-0"
                                  >
                                    <Eye className="w-2.5 h-2.5 mr-1" />
                                    Voir
                                  </Button>
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
                <Card className="border border-neutral-200 shadow-none overflow-hidden bg-white">
                  <CardHeader className="py-2 px-3 border-b border-neutral-200 bg-[#E8F4F3]/60">
                    <CardTitle className="flex items-center gap-1.5 text-xs font-semibold text-[#2C2C2C] font-heading">
                      <UserCheck className="w-3.5 h-3.5 text-[#226D68]" />
                      Recruteurs par entreprise
                    </CardTitle>
                    <CardDescription className="text-[11px] text-neutral-500 mt-0.5">
                      {selectedCompany ? `${selectedCompany.name} · ${companyRecruiters.length} recruteur${companyRecruiters.length !== 1 ? 's' : ''}` : 'Choisir une entreprise dans la liste'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2">
                    {!selectedCompany ? (
                      <div className="flex flex-col items-center py-8 text-center rounded-md border border-dashed border-neutral-200 bg-[#F4F6F8]">
                        <UserCheck className="h-8 w-8 text-neutral-400 mb-1.5" />
                        <p className="text-xs font-medium text-[#2C2C2C]">Sélectionnez une entreprise</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 mb-2">Cliquez sur « Voir » dans la liste pour afficher les recruteurs.</p>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] border-[#226D68]/40 text-[#226D68] hover:bg-[#226D68]/10" onClick={() => { setActiveSubsection('list'); setCompaniesSubmenuOpen(true) }}>
                          Aller à la liste
                        </Button>
                      </div>
                    ) : companyRecruiters.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center rounded-md border border-dashed border-neutral-200 bg-[#F4F6F8]">
                        <Users className="h-8 w-8 text-neutral-400 mb-1.5" />
                        <p className="text-xs font-medium text-[#2C2C2C]">Aucun recruteur</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Aucun compte recruteur associé à cette entreprise.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="mb-1.5 px-2 py-1 rounded-md bg-[#E8F4F3]/80 border border-[#226D68]/20">
                          <p className="text-[11px] font-medium text-[#1a5a55]">{selectedCompany.name}</p>
                        </div>
                        {companyRecruiters.map((recruiter) => (
                          <Card key={recruiter.id || recruiter.user_id} className="border border-neutral-200">
                            <CardContent className="py-2 px-2.5 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#E8F4F3] flex items-center justify-center text-[#226D68] font-semibold text-xs shrink-0">
                                {recruiter.first_name?.[0] || recruiter.email?.[0] || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#2C2C2C] truncate">
                                  {recruiter.first_name && recruiter.last_name ? `${recruiter.first_name} ${recruiter.last_name}` : recruiter.email}
                                </p>
                                <p className="text-[10px] text-neutral-500 truncate">{recruiter.email}</p>
                                {recruiter.role_in_company && (
                                  <Badge variant="outline" className="mt-0.5 text-[10px] px-1 py-0 h-3.5 border-[#226D68]/20 text-[#1a5a55] font-normal">
                                    {recruiter.role_in_company}
                                  </Badge>
                                )}
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
                <Card className="border border-neutral-200 shadow-none overflow-hidden bg-white">
                  <CardHeader className="py-2 px-3 border-b border-neutral-200 bg-[#E8F4F3]/60">
                    <CardTitle className="flex items-center gap-1.5 text-xs font-semibold text-[#2C2C2C] font-heading">
                      <CreditCard className="w-3.5 h-3.5 text-[#226D68]" />
                      Abonnements
                    </CardTitle>
                    <CardDescription className="text-[11px] text-neutral-500 mt-0.5">
                      Plans, statut et quotas par entreprise
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-2">
                    {companiesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-[#226D68]" />
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center rounded-md border border-dashed border-neutral-200 bg-[#F4F6F8]">
                        <CreditCard className="h-8 w-8 text-neutral-400 mb-1.5" />
                        <p className="text-xs font-medium text-[#2C2C2C]">Aucune entreprise</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Aucune entreprise partenaire enregistrée.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {companies.map((company) => {
                          const subscription = companySubscriptions[company.id]
                          return (
                            <Card key={company.id} className="border border-neutral-200">
                              <CardContent className="py-2 px-2.5 flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {company.logo_url ? (
                                    <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded-md object-cover border border-neutral-200 shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-md bg-[#E8F4F3] flex items-center justify-center shrink-0">
                                      <Building className="w-4 h-4 text-[#226D68]" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <h3 className="text-xs font-medium text-[#2C2C2C] truncate">{company.name}</h3>
                                    {subscription?.plan ? (
                                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5 border-[#226D68]/30 text-[#1a5a55] font-normal">
                                          {subscription.plan.plan_type || 'FREEMIUM'}
                                        </Badge>
                                        {subscription.status === 'active' && (
                                          <Badge className="text-[10px] px-1 py-0 h-3.5 bg-[#226D68]/15 text-[#1a5a55] border-0">
                                            actif
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-neutral-500 mt-0.5">Aucun abonnement</p>
                                    )}
                                  </div>
                                </div>
                                {subscription?.quota_limit != null && (
                                  <span className="text-[10px] text-neutral-500 shrink-0">
                                    {subscription.quota_used ?? 0}/{subscription.quota_limit}
                                  </span>
                                )}
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

      {viewingCompany && (
        <Dialog open={!!viewingCompany} onOpenChange={(open) => !open && handleCloseCompanyView()}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-neutral-200 rounded-lg">
            <DialogHeader className="border-b border-neutral-200 pb-2 bg-[#E8F4F3]/60 -m-6 mb-0 p-3 rounded-t-lg">
              <DialogTitle className="flex items-center gap-1.5 text-xs font-semibold text-[#2C2C2C] font-heading">
                <Building className="w-3.5 h-3.5 text-[#226D68]" />
                Fiche entreprise
              </DialogTitle>
              <DialogDescription className="text-[11px] text-neutral-500 mt-0.5">
                Informations générales et contact référent
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 mt-3">
              {/* Informations générales */}
              <div className="rounded-md border border-neutral-200 bg-white overflow-hidden">
                <div className="px-2.5 py-1.5 border-b border-neutral-200 bg-[#F4F6F8]">
                  <h3 className="text-[10px] font-semibold text-[#2C2C2C] uppercase tracking-wider">Informations générales</h3>
                </div>
                <div className="p-2.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    {viewingCompany.logo_url && (
                      <img src={viewingCompany.logo_url} alt={viewingCompany.name} className="w-10 h-10 rounded-md object-cover border border-neutral-200 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Raison sociale</p>
                        <p className="text-xs font-semibold text-[#2C2C2C]">{viewingCompany.name}</p>
                      </div>
                      {viewingCompany.legal_id && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">RCCM</p>
                          <p className="text-[11px]">{viewingCompany.legal_id}</p>
                        </div>
                      )}
                      {viewingCompany.adresse && (
                        <div className="flex items-start gap-1">
                          <MapPin className="w-2.5 h-2.5 text-neutral-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-neutral-600">{viewingCompany.adresse}</p>
                        </div>
                      )}
                      {companySubscriptions[viewingCompany.id]?.plan && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Plan</p>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5 border-[#226D68]/30 text-[#1a5a55] font-normal">
                            {companySubscriptions[viewingCompany.id].plan.plan_type || 'N/A'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact référent */}
              {(viewingCompany.contact_first_name || viewingCompany.contact_last_name || viewingCompany.contact_email || viewingCompany.contact_phone || viewingCompany.contact_function) && (
                <div className="rounded-md border border-neutral-200 bg-white overflow-hidden">
                  <div className="px-2.5 py-1.5 border-b border-neutral-200 bg-[#E8F4F3]/60">
                    <h3 className="text-[10px] font-semibold text-[#2C2C2C] uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-[#226D68]" />
                      Contact référent
                    </h3>
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    {(viewingCompany.contact_first_name || viewingCompany.contact_last_name) && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Nom</p>
                        <p className="text-xs font-medium text-[#2C2C2C]">
                          {viewingCompany.contact_first_name} {viewingCompany.contact_last_name}
                        </p>
                      </div>
                    )}
                    {viewingCompany.contact_function && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Fonction</p>
                        <p className="text-[11px]">{viewingCompany.contact_function}</p>
                      </div>
                    )}
                    {viewingCompany.contact_email && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> Email</p>
                        <a href={`mailto:${viewingCompany.contact_email}`} className="text-[11px] text-[#226D68] hover:underline">
                          {viewingCompany.contact_email}
                        </a>
                      </div>
                    )}
                    {viewingCompany.contact_phone && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium flex items-center gap-1"><Phone className="w-2.5 h-2.5 text-[#226D68]" /> Téléphone</p>
                        <a href={`tel:${viewingCompany.contact_phone}`} className="text-[11px] text-[#226D68] hover:underline">
                          {viewingCompany.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Statut et abonnement */}
              <div className="rounded-md border border-neutral-200 bg-white overflow-hidden">
                <div className="px-2.5 py-1.5 border-b border-neutral-200 bg-[#F4F6F8]">
                  <h3 className="text-[10px] font-semibold text-[#2C2C2C] uppercase tracking-wider">Statut et abonnement</h3>
                </div>
                <div className="p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Statut</p>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5 border-neutral-200">{viewingCompany.status || 'ACTIVE'}</Badge>
                  </div>
                  {viewingCompany.created_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-2.5 h-2.5 text-neutral-500" />
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Inscription</span>
                      <span className="text-[11px]">{formatDateTime(viewingCompany.created_at)}</span>
                    </div>
                  )}
                  {companySubscriptions[viewingCompany.id] && (
                    <div className="pt-0.5 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5 border-[#226D68]/30 text-[#1a5a55] font-normal">
                          {companySubscriptions[viewingCompany.id].plan?.plan_type || 'FREEMIUM'}
                        </Badge>
                        {companySubscriptions[viewingCompany.id].status === 'active' && (
                          <Badge className="text-[10px] px-1 py-0 h-3.5 bg-[#226D68]/15 text-[#1a5a55 border-0 font-normal">actif</Badge>
                        )}
                      </div>
                      {companySubscriptions[viewingCompany.id].quota_limit != null && (
                        <p className="text-[11px] text-neutral-600">
                          Quota : {companySubscriptions[viewingCompany.id].quota_used ?? 0} / {companySubscriptions[viewingCompany.id].quota_limit}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-1.5 mt-3 pt-2.5 border-t border-neutral-200">
              <Button variant="outline" size="sm" className="h-7 text-[11px] border-neutral-200 text-[#2C2C2C] hover:bg-[#226D68]/10 hover:text-[#226D68]" onClick={handleCloseCompanyView}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
