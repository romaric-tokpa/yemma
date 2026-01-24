import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Building, Users, Search, Settings, LogOut, Menu, X,
  Home, FileText, CreditCard, TrendingUp, UserPlus,
  CheckCircle2, Clock, AlertCircle, Sparkles, MapPin, Mail, Phone
} from 'lucide-react'
import { companyApi, authApiService, paymentApiService } from '@/services/api'
import CompanyManagement from './CompanyManagement'
import { SearchTab } from '../components/company/SearchTab'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

const generateAvatarUrl = (name) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CO'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

export default function CompanyDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [company, setCompany] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Définir l'onglet actif selon l'URL ou les paramètres de requête
    const path = location.pathname
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')
    
    if (tabParam === 'search') {
      setActiveTab('search')
    } else if (path.includes('/company/management')) {
      setActiveTab('management')
    } else if (path === '/company/dashboard' && !tabParam) {
      setActiveTab('overview')
    }
  }, [location])

  const loadData = async () => {
    try {
      setLoading(true)
      const [companyData, membersData] = await Promise.all([
        companyApi.getMyCompany().catch(() => null),
        companyApi.getMyCompany()
          .then(c => companyApi.getTeamMembers(c.id))
          .catch(() => []),
      ])
      
      setCompany(companyData)
      setTeamMembers(membersData || [])

      if (companyData?.id) {
        try {
          const sub = await paymentApiService.getSubscription(companyData.id)
          setSubscription(sub)
        } catch (error) {
          // Gérer les erreurs de manière non bloquante
          if (error.response?.status === 502 || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
            console.warn('Payment service unavailable (502 Bad Gateway). Subscription data will not be available.')
            // Ne pas définir subscription, l'application continuera sans ces données
            setSubscription(null)
          } else {
            console.error('Error loading subscription:', error)
            setSubscription(null)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      if (error.response?.status === 404) {
        // Pas d'entreprise créée, rediriger vers l'onboarding
        navigate('/company/onboarding')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      authApiService.logout()
      navigate('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#226D68]" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-[12px] shadow-lg">
          <CardHeader>
            <CardTitle>Aucune entreprise trouvée</CardTitle>
            <CardDescription>
              Vous devez créer votre entreprise pour accéder au dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/company/onboarding')} className="w-full bg-[#226D68] hover:bg-[#1a5a55]">
              Créer mon entreprise
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
    { id: 'search', label: 'Recherche candidats', icon: Search },
    { id: 'management', label: 'Gestion', icon: Settings },
  ]

  const displayLogo = company.logo_url || generateAvatarUrl(company.name)
  const activeMembers = teamMembers.filter(m => m.status === 'active')
  
  // Contracter automatiquement la sidebar sur l'onglet search
  const shouldContractSidebar = activeTab === 'search'
  const effectiveSidebarOpen = shouldContractSidebar ? false : sidebarOpen

  return (
    <div className="h-screen bg-gray-light flex overflow-hidden max-h-screen">
      {/* Sidebar - Compact */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${effectiveSidebarOpen ? 'w-56 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-16'}
        flex flex-col
      `}>
        {/* Header Sidebar - Compact */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-3">
          {effectiveSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#226D68] rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-gray-anthracite font-heading">Yemma</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden h-8 w-8"
          >
            {effectiveSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation - Compact */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                className="w-full justify-start h-9 text-sm px-2"
                onClick={() => {
                  setActiveTab(item.id)
                  if (item.id === 'search') {
                    navigate('/company/dashboard?tab=search')
                  } else if (item.id === 'management') {
                    navigate('/company/management')
                  } else {
                    navigate('/company/dashboard')
                  }
                }}
              >
                <Icon className="w-3.5 h-3.5 mr-2" />
                {effectiveSidebarOpen && <span>{item.label}</span>}
              </Button>
            )
          })}
        </nav>

        {/* Footer Sidebar - Compact */}
        <div className="border-t border-gray-200 p-2 space-y-2">
          {effectiveSidebarOpen && (
            <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors mb-2">
              <img
                src={displayLogo}
                alt={company.name}
                className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  e.target.src = generateAvatarUrl(company.name)
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-gray-anthracite">{company.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {activeMembers.length} membre{activeMembers.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-9 text-sm px-2"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            {effectiveSidebarOpen && <span>Déconnexion</span>}
          </Button>
        </div>
      </aside>

      {/* Overlay pour mobile */}
      {effectiveSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-hidden bg-gray-50 ${activeTab === 'search' ? 'flex flex-col' : ''}`}>
        {activeTab === 'search' ? (
          <SearchTab />
        ) : (
          <div className="container mx-auto p-4 max-w-7xl overflow-y-auto h-full">
          {/* Header - Compact */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#226D68] to-[#1a5a55] bg-clip-text text-transparent">
                  {activeTab === 'overview' ? 'Vue d\'ensemble' : activeTab === 'search' ? 'Recherche Candidats' : 'Gestion'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeTab === 'overview' 
                    ? `Bienvenue dans votre espace ${company.name}`
                    : activeTab === 'search'
                      ? 'Recherchez et découvrez des candidats validés'
                      : 'Gérez votre équipe et vos paramètres'}
                </p>
              </div>
              {activeTab === 'overview' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/company/onboarding')}
                  className="h-8 px-2 text-xs"
                >
                  <Settings className="w-3.5 h-3.5 mr-1" />
                  Paramètres
                </Button>
              )}
            </div>

            {/* Statistiques - Compact */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-blue-900">
                        Membres actifs
                      </CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold text-blue-900">{activeMembers.length}</div>
                    <p className="text-xs text-blue-700 mt-0.5">Recruteurs</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#E8F4F3] to-[#D1E9E7] border-[#B8DDD9]">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-[#1a5a55]">
                        Statut
                      </CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-[#226D68]" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <Badge className="mt-1 bg-[#226D68] text-white text-xs px-1.5 py-0 h-4">
                      {company.status === 'ACTIVE' ? 'Actif' : company.status}
                    </Badge>
                    <p className="text-xs text-[#1a5a55] mt-0.5">Entreprise</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-purple-900">
                        Abonnement
                      </CardTitle>
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-sm font-bold text-purple-900 truncate">
                      {subscription?.plan?.name || 'Aucun'}
                    </div>
                    <p className="text-xs text-purple-700 mt-0.5">Plan actuel</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-[#FDF2F0] to-[#FBE5E0] border-[#F8D3CA]">
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-[#c04a2f]">
                        Quota restant
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-[#e76f51]" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-xl font-bold text-[#c04a2f]">
                      {subscription?.quota_remaining !== undefined ? subscription.quota_remaining : '∞'}
                    </div>
                    <p className="text-xs text-[#c04a2f] mt-0.5">Consultations</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Contenu conditionnel selon l'onglet */}
          {activeTab === 'overview' ? (
            <>
              {/* Informations de l'entreprise - Compact */}
              <Card className="mb-3">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b py-2 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={displayLogo}
                        alt={company.name}
                        className="w-12 h-12 rounded-lg object-cover border-2 border-[#226D68]/20"
                        onError={(e) => {
                          e.target.src = generateAvatarUrl(company.name)
                        }}
                      />
                      <div>
                        <CardTitle className="text-sm font-semibold">{company.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {company.adresse && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {company.adresse}
                            </span>
                          )}
                          {company.legal_id && (
                            <span className="flex items-center gap-1 mt-1">
                              <FileText className="w-3 h-3" />
                              RCCM: {company.legal_id}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Actions rapides - Compact */}
              <Card className="mb-3">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b py-2 px-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex flex-col items-center gap-2 border-2 text-xs"
                      onClick={() => {
                        setActiveTab('search')
                        navigate('/company/dashboard?tab=search')
                      }}
                    >
                      <Search className="w-5 h-5 text-[#226D68]" />
                      <div className="text-center">
                        <p className="font-semibold text-xs">Rechercher candidats</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Accéder à la CVthèque
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex flex-col items-center gap-2 border-2 text-xs"
                      onClick={() => {
                        setActiveTab('management')
                        navigate('/company/management')
                      }}
                    >
                      <UserPlus className="w-5 h-5 text-[#226D68]" />
                      <div className="text-center">
                        <p className="font-semibold text-xs">Gérer l'équipe</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Inviter des recruteurs
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex flex-col items-center gap-2 border-2 text-xs"
                      onClick={() => navigate('/company/onboarding')}
                    >
                      <Settings className="w-5 h-5 text-[#226D68]" />
                      <div className="text-center">
                        <p className="font-semibold text-xs">Paramètres</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Modifier l'entreprise
                        </p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : activeTab === 'management' ? (
            <div className="mt-0">
              <CompanyManagement />
            </div>
          ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
