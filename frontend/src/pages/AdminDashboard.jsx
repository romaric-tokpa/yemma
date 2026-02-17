import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { candidateApi, companyApi, paymentApiService } from '@/services/api'
import { formatDateTime } from '@/utils/dateUtils'
import AdminLayout from '@/components/admin/AdminLayout'
import { ROUTES } from '@/constants/routes'
import { 
  Users, FileCheck, Clock, CheckCircle, XCircle, Archive, 
  Loader2, User, RefreshCw, Calendar,
  Building, UserCheck, CreditCard, BarChart3,
  CheckCircle2, Mail, Phone, MapPin, Eye, Search
} from 'lucide-react'

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

const pathToSubsection = (path) => {
  if (path.endsWith('/abonnements')) return 'subscriptions'
  if (path.endsWith('/recruteurs')) return 'recruiters'
  if (path.endsWith('/liste') || path.endsWith('/companies')) return 'list'
  return 'list'
}

export default function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname
  const activeSection = path.includes('/admin/companies') ? 'companies' : 'accueil'
  const activeSubsection = pathToSubsection(path)
  
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
  const [companyRecruitersMap, setCompanyRecruitersMap] = useState({}) // { companyId: [recruiters] }
  const [recruitersLoading, setRecruitersLoading] = useState(false)
  const [companySubscriptions, setCompanySubscriptions] = useState({})
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [viewingCompany, setViewingCompany] = useState(null) // Pour la fiche entreprise

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
            return { status, count }
          } else if (response && typeof response === 'object') {
            // Réponse paginée ou objet
            if (response.items && Array.isArray(response.items)) {
              // Si on a un total, l'utiliser
              if (typeof response.total === 'number') {
                return { status, count: response.total }
              }
              // Sinon, compter les items retournés (attention: peut être incomplet si pagination)
              return { status, count: response.items.length }
            }
            // Si c'est un objet mais pas de items, essayer de trouver un total
            if (typeof response.total === 'number') {
              return { status, count: response.total }
            }
          }
          return { status, count: 0 }
        } catch {
          return { status, count: 0 }
        }
      })
      
      const statsResults = await Promise.all(statsPromises)
      const newStats = {}
      statsResults.forEach(({ status, count }) => {
        newStats[status] = count
      })
      setStats(newStats)
    } catch {
      // En cas d'erreur, ne pas mettre à jour les stats pour garder les anciennes valeurs
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (activeSection === 'companies') {
      loadCompanies()
    }
  }, [activeSection])

  // Charger les entreprises
  const loadCompanies = async () => {
    try {
      setCompaniesLoading(true)
      const companiesData = await companyApi.listCompanies()
      const list = companiesData || []
      setCompanies(list)
      
      // Charger les abonnements pour toutes les entreprises
      const subscriptionPromises = list.map(async (company) => {
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
      return list
    } catch (err) {
      console.error('Erreur lors du chargement des entreprises:', err)
      return []
    } finally {
      setCompaniesLoading(false)
    }
  }

  // Charger les recruteurs d'une entreprise (pour Annuaire quand on sélectionne)
  const loadCompanyRecruiters = async (companyId) => {
    try {
      const recruiters = await companyApi.getTeamMembers(companyId)
      setCompanyRecruiters(recruiters || [])
    } catch (err) {
      console.error('Erreur lors du chargement des recruteurs:', err)
      setCompanyRecruiters([])
    }
  }

  // Charger les recruteurs de toutes les entreprises (pour l'onglet Recruteurs)
  const loadAllRecruitersByCompany = async (companiesList) => {
    const list = companiesList ?? companies
    if (list.length === 0) {
      setCompanyRecruitersMap({})
      return
    }
    try {
      setRecruitersLoading(true)
      const results = await Promise.all(
        list.map(async (company) => {
          try {
            const recruiters = await companyApi.getTeamMembers(company.id)
            return { companyId: company.id, recruiters: recruiters || [] }
          } catch (err) {
            console.warn(`Erreur recruteurs ${company.name}:`, err)
            return { companyId: company.id, recruiters: [] }
          }
        })
      )
      const map = {}
      results.forEach(({ companyId, recruiters }) => {
        map[companyId] = recruiters
      })
      setCompanyRecruitersMap(map)
    } catch (err) {
      console.error('Erreur lors du chargement des recruteurs:', err)
      setCompanyRecruitersMap({})
    } finally {
      setRecruitersLoading(false)
    }
  }

  const refreshCompaniesSection = async () => {
    const list = await loadCompanies()
    if (activeSubsection === 'recruiters' && list.length > 0) {
      loadAllRecruitersByCompany(list)
    }
  }

  useEffect(() => {
    if (activeSubsection === 'recruiters' && activeSection === 'companies') {
      loadAllRecruitersByCompany()
    }
  }, [activeSubsection, activeSection])

  // Gérer la sélection d'une entreprise (dans l'Annuaire)
  const handleSelectCompany = (company) => {
    setSelectedCompany(company)
  }

  const handleViewCompany = (company) => {
    setViewingCompany(company)
  }

  const handleCloseCompanyView = () => {
    setViewingCompany(null)
  }

  return (
    <AdminLayout>
      <div className="min-w-0 w-full">
          {activeSection === 'accueil' && (
            <>
              {/* Hero */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
                  Tableau de bord
                </h1>
                <p className="text-sm sm:text-base text-[#6b7280] mt-1 sm:mt-2 max-w-2xl">
                  Validez les profils candidats, consultez les statistiques et gérez les entreprises partenaires.
                </p>
              </div>

              {/* Pipeline stats — compact */}
              <div className="mb-6 sm:mb-8 rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F4F6F8] p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8F4F3" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#226D68" strokeWidth="3" strokeDasharray={`${(stats.SUBMITTED || 0) + (stats.VALIDATED || 0) + (stats.REJECTED || 0) > 0 ? Math.round(((stats.VALIDATED || 0) / Math.max((stats.SUBMITTED || 0) + (stats.VALIDATED || 0) + (stats.REJECTED || 0), 1)) * 100) : 0}, 100`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-base sm:text-lg font-bold text-[#226D68] font-heading">
                        {(stats.SUBMITTED || 0) + (stats.VALIDATED || 0) + (stats.REJECTED || 0) > 0
                          ? Math.round(((stats.VALIDATED || 0) / Math.max((stats.SUBMITTED || 0) + (stats.VALIDATED || 0) + (stats.REJECTED || 0), 1)) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C2C2C] text-sm sm:text-base">Taux de validation</p>
                      <p className="text-xs sm:text-sm text-[#6b7280] mt-0.5">{stats.VALIDATED || 0} validés sur {(stats.SUBMITTED || 0) + (stats.VALIDATED || 0) + (stats.REJECTED || 0)} au total</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium ${(stats.SUBMITTED || 0) > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-[#6b7280]'}`}>
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {stats.SUBMITTED || 0} soumis
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium ${(stats.VALIDATED || 0) > 0 ? 'bg-[#E8F4F3] text-[#226D68]' : 'bg-gray-100 text-[#6b7280]'}`}>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {stats.VALIDATED || 0} validés
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium ${(stats.REJECTED || 0) > 0 ? 'bg-[#e76f51]/15 text-[#c04a2f]' : 'bg-gray-100 text-[#6b7280]'}`}>
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      {stats.REJECTED || 0} rejetés
                    </span>
                    <Button onClick={loadStats} variant="outline" size="sm" className="h-8 w-8 sm:h-7 sm:w-auto sm:px-3 p-0 rounded-lg border-gray-200 text-[#226D68] hover:bg-[#226D68]/10 shrink-0">
                      <RefreshCw className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Actualiser</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Grille raccourcis — 6 cartes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {[
                  { id: 'ALL', icon: Users, label: 'Tous les candidats', value: Object.values(stats).reduce((a, b) => a + b, 0), desc: 'Inscrits, brouillons et soumis', action: () => navigate('/admin/validation', { state: { status: 'ALL' } }), accent: 'default' },
                  { id: 'SUBMITTED', icon: Clock, label: 'Candidats soumis', value: stats.SUBMITTED || 0, desc: 'En attente de validation', action: () => navigate('/admin/validation', { state: { status: 'SUBMITTED' } }), accent: 'amber' },
                  { id: 'VALIDATED', icon: CheckCircle, label: 'Candidats validés', value: stats.VALIDATED || 0, desc: 'Visibles dans la CVthèque', action: () => navigate('/admin/validation', { state: { status: 'VALIDATED' } }), accent: 'green' },
                  { id: 'REJECTED', icon: XCircle, label: 'Candidats rejetés', value: stats.REJECTED || 0, desc: 'Profils refusés', action: () => navigate('/admin/validation', { state: { status: 'REJECTED' } }), accent: 'red' },
                  { id: 'stats', icon: BarChart3, label: 'Statistiques', value: '', desc: 'Effectifs et secteurs', action: () => navigate('/admin/statistics'), accent: 'default' },
                  { id: 'cvtheque', icon: Search, label: 'CVthèque', value: '', desc: 'Recherche dans les profils validés', action: () => navigate('/admin/cvtheque'), accent: 'default' },
                  { id: 'companies', icon: Building, label: 'Entreprises', value: companies.length, desc: 'Annuaire des partenaires', action: () => navigate('/admin/companies'), accent: 'default' },
                ].map((item) => {
                  const Icon = item.icon
                  const accentBg = item.accent === 'amber' ? 'bg-amber-50' : item.accent === 'green' ? 'bg-[#E8F4F3]' : item.accent === 'red' ? 'bg-[#e76f51]/5' : 'bg-[#E8F4F3]/60'
                  const accentColor = item.accent === 'amber' ? 'text-amber-700' : item.accent === 'green' ? 'text-[#226D68]' : item.accent === 'red' ? 'text-[#c04a2f]' : 'text-[#226D68]'
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      className="group text-left rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 hover:border-[#226D68]/40 hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${accentBg} group-hover:bg-[#E8F4F3]`}>
                          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${accentColor} group-hover:text-[#226D68]`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#2C2C2C] text-sm mb-0.5">{item.label}</p>
                          <p className="text-xs text-[#6b7280]">{item.desc}</p>
                          {typeof item.value === 'number' && (
                            <p className={`text-lg font-bold mt-2 ${item.value > 0 ? 'text-[#226D68]' : 'text-[#6b7280]'}`}>
                              {item.value}
                            </p>
                          )}
                          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#226D68] opacity-0 group-hover:opacity-100 transition-opacity">
                            Accéder →
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {activeSection === 'companies' && (
            <>
              {/* Hero Entreprises */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
                  Entreprises partenaires
                </h1>
                <p className="text-sm sm:text-base text-[#6b7280] mt-1 sm:mt-2 max-w-2xl">
                  Annuaire des entreprises, recruteurs et abonnements.
                </p>
              </div>

              {/* KPI Entreprises */}
              <div className="mb-6 sm:mb-8 rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F4F6F8] p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                      <div className="absolute inset-0 rounded-xl bg-[#226D68]/15 flex items-center justify-center">
                        <Building className="h-7 w-7 sm:h-8 sm:w-8 text-[#226D68]" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C2C2C] text-sm sm:text-base">Total entreprises</p>
                      <p className="text-2xl sm:text-3xl font-bold text-[#226D68] font-heading mt-0.5">{companies.length}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E8F4F3] text-[#226D68]">
                      <UserCheck className="h-3.5 w-3.5 shrink-0" />
                      Recruteurs par entreprise
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-[#6b7280]">
                      <CreditCard className="h-3.5 w-3.5 shrink-0" />
                      Plans et quotas
                    </span>
                    <Button onClick={refreshCompaniesSection} variant="outline" size="sm" className="h-8 w-8 sm:h-7 sm:w-auto sm:px-3 p-0 rounded-lg border-gray-200 text-[#226D68] hover:bg-[#226D68]/10 shrink-0">
                      <RefreshCw className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Actualiser</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Onglets — routes dédiées */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-1.5 mb-6 w-full sm:w-fit shadow-sm">
                {[
                  { id: 'list', label: 'Annuaire', Icon: Building, path: ROUTES.ADMIN_COMPANIES_LISTE },
                  { id: 'recruiters', label: 'Recruteurs', Icon: UserCheck, path: ROUTES.ADMIN_COMPANIES_RECRUTEURS },
                  { id: 'subscriptions', label: 'Abonnements', Icon: CreditCard, path: ROUTES.ADMIN_COMPANIES_ABONNEMENTS },
                ].map(({ id, label, Icon, path }) => (
                  <Link
                    key={id}
                    to={path}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all no-underline ${activeSubsection === id ? 'bg-[#226D68] text-white shadow-sm' : 'text-[#6b7280] hover:text-[#2C2C2C] hover:bg-gray-50'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
              {activeSubsection === 'list' && (
                <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
                      <Building className="h-5 w-5 text-[#226D68]" />
                      Annuaire
                    </h2>
                    <p className="text-sm text-[#6b7280] mt-0.5">
                      {companiesLoading ? 'Chargement…' : `${companies.length} entreprise${companies.length !== 1 ? 's' : ''} partenaire${companies.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="p-4 sm:p-6">
                    {companiesLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="flex flex-col items-center py-16 text-center rounded-xl border-2 border-dashed border-gray-200 bg-[#F4F6F8]">
                        <Building className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="font-medium text-[#2C2C2C]">Aucune entreprise</p>
                        <p className="text-sm text-[#6b7280] mt-1">Aucune entreprise partenaire enregistrée.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:gap-4">
                        {companies.map((company) => {
                          const subscription = companySubscriptions[company.id]
                          const hasContactInfo = company.contact_first_name || company.contact_last_name || company.contact_email || company.contact_phone || company.contact_function
                          const contactParts = []
                          if (company.contact_first_name || company.contact_last_name) contactParts.push([company.contact_first_name, company.contact_last_name].filter(Boolean).join(' '))
                          if (company.contact_email) contactParts.push(company.contact_email)
                          if (company.contact_phone) contactParts.push(company.contact_phone)
                          return (
                            <div
                              key={company.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedCompany(company)}
                              onKeyDown={(e) => e.key === 'Enter' && setSelectedCompany(company)}
                              className={`group rounded-xl border p-4 transition-all cursor-pointer text-left ${
                                selectedCompany?.id === company.id
                                  ? 'border-[#226D68] bg-[#E8F4F3]/50 shadow-md ring-2 ring-[#226D68]/20'
                                  : 'border-gray-200 hover:border-[#226D68]/40 hover:bg-[#F4F6F8] hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                {company.logo_url ? (
                                  <img src={company.logo_url} alt={company.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-gray-200 shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#E8F4F3] flex items-center justify-center shrink-0">
                                    <Building className="w-6 h-6 sm:w-7 sm:h-7 text-[#226D68]" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-semibold text-[#2C2C2C] text-sm sm:text-base truncate">{company.name}</h3>
                                    {subscription?.plan && (
                                      <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 border-[#226D68]/30 text-[#1a5a55] font-medium shrink-0">
                                        {subscription.plan.plan_type || 'N/A'}
                                      </Badge>
                                    )}
                                  </div>
                                  {company.legal_id && (
                                    <p className="text-xs text-[#6b7280] mt-0.5 truncate">RCCM {company.legal_id}</p>
                                  )}
                                  {hasContactInfo && contactParts.length > 0 && (
                                    <p className="text-xs text-[#6b7280] truncate mt-1 flex items-center gap-1">
                                      {company.contact_phone && <Phone className="w-3 h-3 text-[#226D68] shrink-0" />}
                                      {contactParts.join(' · ')}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => { e.stopPropagation(); handleViewCompany(company) }}
                                  className="h-8 px-3 text-xs border-[#226D68]/30 text-[#226D68] hover:bg-[#226D68]/10 shrink-0"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                                  Fiche
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSubsection === 'recruiters' && (
                <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
                      <UserCheck className="h-5 w-5 text-[#226D68]" />
                      Recruteurs par entreprise
                    </h2>
                    <p className="text-sm text-[#6b7280] mt-0.5">
                      Chaque recruteur est lié à son entreprise et à son abonnement.
                    </p>
                  </div>
                  <div className="p-4 sm:p-6">
                    {companiesLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="flex flex-col items-center py-16 text-center rounded-xl border-2 border-dashed border-gray-200 bg-[#F4F6F8]">
                        <Building className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="font-medium text-[#2C2C2C]">Aucune entreprise</p>
                        <p className="text-sm text-[#6b7280] mt-1">Aucune entreprise partenaire enregistrée.</p>
                      </div>
                    ) : recruitersLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {companies.map((company) => {
                          const recruiters = companyRecruitersMap[company.id] || []
                          const subscription = companySubscriptions[company.id]
                          const isActive = subscription?.status === 'active'
                          return (
                            <div key={company.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                              <div
                                className="flex flex-wrap items-center gap-3 sm:gap-4 p-4 bg-[#E8F4F3]/60 border-b border-gray-100 cursor-pointer hover:bg-[#E8F4F3]/80 transition-colors"
                                onClick={() => handleViewCompany(company)}
                              >
                                {company.logo_url ? (
                                  <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-[#226D68]/20 flex items-center justify-center shrink-0">
                                    <Building className="w-6 h-6 text-[#226D68]" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-[#2C2C2C]">{company.name}</h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {subscription?.plan && (
                                      <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 border-[#226D68]/30 text-[#1a5a55] font-medium">
                                        {subscription.plan.plan_type || 'FREEMIUM'}
                                      </Badge>
                                    )}
                                    {isActive && (
                                      <Badge className="text-xs px-2 py-0.5 h-5 bg-[#226D68]/15 text-[#1a5a55] border-0 font-medium">
                                        Actif
                                      </Badge>
                                    )}
                                    {subscription?.quota_limit != null && (
                                      <span className="text-xs text-[#6b7280]">
                                        {subscription.quota_used ?? 0} / {subscription.quota_limit} consultations
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-[#226D68] hover:bg-[#226D68]/10 shrink-0" onClick={(e) => { e.stopPropagation(); handleViewCompany(company) }}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Fiche
                                </Button>
                              </div>
                              <div className="p-4">
                                {recruiters.length === 0 ? (
                                  <p className="text-sm text-[#6b7280] py-2">Aucun recruteur</p>
                                ) : (
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {recruiters.map((recruiter) => (
                                      <div key={recruiter.id || recruiter.user_id} className="rounded-lg border border-gray-100 p-3 hover:border-[#226D68]/20 hover:bg-[#F4F6F8]/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-[#E8F4F3] flex items-center justify-center text-[#226D68] font-semibold text-xs shrink-0">
                                            {recruiter.first_name?.[0] || recruiter.email?.[0] || 'U'}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium text-[#2C2C2C] text-sm truncate">
                                              {recruiter.first_name && recruiter.last_name ? `${recruiter.first_name} ${recruiter.last_name}` : recruiter.email}
                                            </p>
                                            <p className="text-xs text-[#6b7280] truncate">{recruiter.email}</p>
                                            {recruiter.role_in_company && (
                                              <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 h-4 border-[#226D68]/20 text-[#1a5a55] font-normal">
                                                {recruiter.role_in_company}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}


              {activeSubsection === 'subscriptions' && (
                <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
                    <h2 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
                      <CreditCard className="h-5 w-5 text-[#226D68]" />
                      Abonnements
                    </h2>
                    <p className="text-sm text-[#6b7280] mt-0.5">
                      Plans, statut et quotas par entreprise
                    </p>
                  </div>
                  <div className="p-4 sm:p-6">
                    {companiesLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="flex flex-col items-center py-16 text-center rounded-xl border-2 border-dashed border-gray-200 bg-[#F4F6F8]">
                        <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="font-medium text-[#2C2C2C]">Aucune entreprise</p>
                        <p className="text-sm text-[#6b7280] mt-1">Aucune entreprise partenaire enregistrée.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-1">
                        {companies.map((company) => {
                          const subscription = companySubscriptions[company.id]
                          const isActive = subscription?.status === 'active'
                          return (
                            <div key={company.id} className="rounded-xl border border-gray-200 p-4 hover:border-[#226D68]/30 hover:bg-[#F4F6F8]/50 transition-colors">
                              <div className="flex items-start gap-4">
                                {company.logo_url ? (
                                  <img src={company.logo_url} alt={company.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-[#E8F4F3] flex items-center justify-center shrink-0">
                                    <Building className="w-6 h-6 text-[#226D68]" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-[#2C2C2C] text-sm truncate">{company.name}</h3>
                                  {subscription?.plan ? (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 border-[#226D68]/30 text-[#1a5a55] font-medium">
                                        {subscription.plan.plan_type || 'FREEMIUM'}
                                      </Badge>
                                      {isActive && (
                                        <Badge className="text-xs px-2 py-0.5 h-5 bg-[#226D68]/15 text-[#1a5a55] border-0 font-medium">
                                          Actif
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-[#6b7280] mt-1">Aucun abonnement</p>
                                  )}
                                  {subscription?.quota_limit != null && (
                                    <div className="mt-2 flex items-center gap-1.5">
                                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                        <div
                                          className="h-full rounded-full bg-[#226D68] transition-all"
                                          style={{ width: `${Math.min(100, ((subscription.quota_used ?? 0) / subscription.quota_limit) * 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-[#6b7280] shrink-0">
                                        {subscription.quota_used ?? 0} / {subscription.quota_limit}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

      {viewingCompany && (
        <Dialog open={!!viewingCompany} onOpenChange={(open) => !open && handleCloseCompanyView()}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-gray-200 rounded-xl sm:rounded-2xl shadow-xl">
            <DialogHeader className="border-b border-gray-100 pb-4 bg-[#F4F6F8]/80 -m-6 mb-0 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                {viewingCompany.logo_url ? (
                  <img src={viewingCompany.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#E8F4F3] flex items-center justify-center">
                    <Building className="w-6 h-6 text-[#226D68]" />
                  </div>
                )}
                <div>
                  <DialogTitle className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
                    <Building className="w-4 h-4 text-[#226D68]" />
                    Fiche entreprise
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#6b7280] mt-0.5">
                    {viewingCompany.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Informations générales */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-[#F4F6F8]">
                  <h3 className="text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Informations générales</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#6b7280] font-medium">Raison sociale</p>
                      <p className="text-sm font-semibold text-[#2C2C2C] mt-0.5">{viewingCompany.name}</p>
                    </div>
                    {viewingCompany.legal_id && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#6b7280] font-medium">RCCM</p>
                        <p className="text-sm text-[#2C2C2C] mt-0.5">{viewingCompany.legal_id}</p>
                      </div>
                    )}
                    {viewingCompany.adresse && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#226D68] mt-0.5 shrink-0" />
                        <p className="text-sm text-[#2C2C2C]">{viewingCompany.adresse}</p>
                      </div>
                    )}
                    {companySubscriptions[viewingCompany.id]?.plan && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#6b7280] font-medium">Plan</p>
                        <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 border-[#226D68]/30 text-[#1a5a55] font-medium mt-1">
                          {companySubscriptions[viewingCompany.id].plan.plan_type || 'N/A'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact référent */}
              {(viewingCompany.contact_first_name || viewingCompany.contact_last_name || viewingCompany.contact_email || viewingCompany.contact_phone || viewingCompany.contact_function) && (
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-[#E8F4F3]/60">
                    <h3 className="text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-[#226D68]" />
                      Contact référent
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {(viewingCompany.contact_first_name || viewingCompany.contact_last_name) && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#6b7280] font-medium">Nom</p>
                        <p className="text-sm font-medium text-[#2C2C2C] mt-0.5">
                          {viewingCompany.contact_first_name} {viewingCompany.contact_last_name}
                        </p>
                      </div>
                    )}
                    {viewingCompany.contact_function && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#6b7280] font-medium">Fonction</p>
                        <p className="text-sm text-[#2C2C2C] mt-0.5">{viewingCompany.contact_function}</p>
                      </div>
                    )}
                    {viewingCompany.contact_email && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#6b7280] font-medium flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</p>
                        <a href={`mailto:${viewingCompany.contact_email}`} className="text-sm text-[#226D68] hover:underline mt-0.5 block">
                          {viewingCompany.contact_email}
                        </a>
                      </div>
                    )}
                    {viewingCompany.contact_phone && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#6b7280] font-medium flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[#226D68]" /> Téléphone</p>
                        <a href={`tel:${viewingCompany.contact_phone}`} className="text-sm text-[#226D68] hover:underline mt-0.5 block">
                          {viewingCompany.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Statut et abonnement */}
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-[#F4F6F8]">
                  <h3 className="text-xs font-semibold text-[#2C2C2C] uppercase tracking-wider">Statut et abonnement</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-wider text-[#6b7280] font-medium">Statut</p>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 border-gray-200">{viewingCompany.status || 'ACTIVE'}</Badge>
                  </div>
                  {viewingCompany.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#6b7280]" />
                      <span className="text-xs uppercase tracking-wider text-[#6b7280] font-medium">Inscription</span>
                      <span className="text-sm text-[#2C2C2C]">{formatDateTime(viewingCompany.created_at)}</span>
                    </div>
                  )}
                  {companySubscriptions[viewingCompany.id] && (
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 border-[#226D68]/30 text-[#1a5a55] font-medium">
                          {companySubscriptions[viewingCompany.id].plan?.plan_type || 'FREEMIUM'}
                        </Badge>
                        {companySubscriptions[viewingCompany.id].status === 'active' && (
                          <Badge className="text-xs px-2 py-0.5 h-5 bg-[#226D68]/15 text-[#1a5a55] border-0 font-medium">Actif</Badge>
                        )}
                      </div>
                      {companySubscriptions[viewingCompany.id].quota_limit != null && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#226D68] transition-all"
                              style={{ width: `${Math.min(100, ((companySubscriptions[viewingCompany.id].quota_used ?? 0) / companySubscriptions[viewingCompany.id].quota_limit) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-[#6b7280] shrink-0">
                            {companySubscriptions[viewingCompany.id].quota_used ?? 0} / {companySubscriptions[viewingCompany.id].quota_limit}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button variant="outline" size="sm" className="h-9 px-4 border-gray-200 text-[#2C2C2C] hover:bg-[#226D68]/10 hover:text-[#226D68] hover:border-[#226D68]/30" onClick={handleCloseCompanyView}>
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </AdminLayout>
  )
}
