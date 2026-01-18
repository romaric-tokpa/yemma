import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Building, Users, Search, Settings, LogOut, Menu, X,
  Home, FileText, CreditCard, TrendingUp, UserPlus,
  CheckCircle2, Clock, AlertCircle, Sparkles, MapPin, Mail, Phone
} from 'lucide-react'
import { companyApi, authApiService, paymentApiService } from '@/services/api'
import { CompanyManagement } from './CompanyManagement'
import { ProSearchPage } from './ProSearchPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ui/theme-toggle'
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
    // Définir l'onglet actif selon l'URL
    const path = location.pathname
    if (path.includes('/company/search')) {
      setActiveTab('search')
    } else if (path.includes('/company/settings')) {
      setActiveTab('settings')
    } else if (path.includes('/company/management')) {
      setActiveTab('management')
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
          console.error('Error loading subscription:', error)
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-emerald" />
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
            <Button onClick={() => navigate('/company/onboarding')} className="w-full bg-green-emerald hover:bg-green-emerald/90">
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

  return (
    <div className="min-h-screen bg-gray-light flex">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-16'} 
        bg-white border-r shadow-sm
        fixed left-0 top-0 h-screen z-30
        transition-all duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Logo/Header Sidebar */}
        <div className="h-16 border-b flex items-center justify-between px-4">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-emerald rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-anthracite font-heading">Yemma</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 p-0 mx-auto"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  if (item.id === 'search') {
                    navigate('/company/search')
                  } else if (item.id === 'management') {
                    navigate('/company/management')
                  } else {
                    navigate('/company/dashboard')
                  }
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors duration-200
                  ${activeTab === item.id 
                    ? 'bg-green-emerald text-white shadow-sm' 
                    : 'text-muted-foreground hover:bg-gray-light hover:text-gray-anthracite'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Company info */}
        <div className="border-t p-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-light transition-colors">
              <img
                src={displayLogo}
                alt={company.name}
                className="w-10 h-10 rounded-lg object-cover border-2 border-green-emerald/20"
                onError={(e) => {
                  e.target.src = generateAvatarUrl(company.name)
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-anthracite">{company.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {activeMembers.length} membre{activeMembers.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                src={displayLogo}
                alt={company.name}
                className="w-10 h-10 rounded-lg object-cover border-2 border-green-emerald/20"
                onError={(e) => {
                  e.target.src = generateAvatarUrl(company.name)
                }}
              />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
        {/* Vue d'ensemble avec header vert émeraude */}
        {activeTab === 'overview' ? (
          <div className="min-h-screen bg-gray-light">
            {/* Header avec gradient vert émeraude */}
            <div className="bg-gradient-to-r from-green-emerald to-green-emerald/90 text-white shadow-lg">
              <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                  {/* Logo de l'entreprise */}
                  <div className="flex-shrink-0">
                    <img
                      src={displayLogo}
                      alt={company.name}
                      className="w-24 h-24 rounded-[12px] object-cover border-4 border-white/30 shadow-xl"
                      onError={(e) => {
                        e.target.src = generateAvatarUrl(company.name)
                      }}
                    />
                  </div>

                  {/* Informations principales */}
                  <div className="flex-1 text-white">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h1 className="text-4xl font-bold font-heading text-white">{company.name}</h1>
                      {company.status === 'ACTIVE' && (
                        <Badge className="bg-white/20 text-white border-white/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                    </div>

                    {/* Informations en grille */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {company.adresse && (
                        <div className="flex items-center gap-2 text-white/80">
                          <MapPin className="h-5 w-5 flex-shrink-0" />
                          <span>{company.adresse}</span>
                        </div>
                      )}
                      {company.legal_id && (
                        <div className="flex items-center gap-2 text-white/80">
                          <FileText className="h-5 w-5 flex-shrink-0" />
                          <span>Numéro RCCM: {company.legal_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions header */}
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/company/onboarding')}
                      className="text-white hover:bg-white/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Paramètres</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-white hover:bg-white/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Déconnexion</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-7xl mx-auto px-6 py-8">
              {/* Cards de statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="rounded-[12px] shadow-sm border-l-4 border-l-blue-deep hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2 font-medium">Membres actifs</p>
                        <p className="text-3xl font-bold text-gray-anthracite">{activeMembers.length}</p>
                      </div>
                      <div className="w-14 h-14 bg-blue-deep/10 rounded-lg flex items-center justify-center">
                        <Users className="w-7 h-7 text-blue-deep" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[12px] shadow-sm border-l-4 border-l-green-emerald hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2 font-medium">Statut</p>
                        <Badge className="mt-1 bg-green-emerald text-white">
                          {company.status === 'ACTIVE' ? 'Actif' : company.status}
                        </Badge>
                      </div>
                      <div className="w-14 h-14 bg-green-emerald/10 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-green-emerald" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[12px] shadow-sm border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2 font-medium">Abonnement</p>
                        <p className="text-2xl font-bold text-gray-anthracite">
                          {subscription?.plan?.name || 'Aucun'}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-7 h-7 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[12px] shadow-sm border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2 font-medium">Quota restant</p>
                        <p className="text-3xl font-bold text-gray-anthracite">
                          {subscription?.quota_remaining !== undefined ? subscription.quota_remaining : '∞'}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions rapides */}
              <Card className="mb-8 rounded-[12px] shadow-lg border-l-4 border-l-green-emerald bg-gradient-to-r from-white to-green-emerald/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-emerald/10 rounded-lg">
                      <Sparkles className="h-6 w-6 text-green-emerald" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-anthracite font-heading">Actions rapides</CardTitle>
                      <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Button
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-center gap-3 border-2 border-blue-deep text-blue-deep hover:bg-blue-deep/10 rounded-[12px]"
                      onClick={() => {
                        setActiveTab('search')
                        navigate('/company/search')
                      }}
                    >
                      <Search className="w-8 h-8 text-green-emerald" />
                      <div className="text-center">
                        <p className="font-semibold text-base">Rechercher des candidats</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Accédez à la CVthèque de profils validés
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-center gap-3 border-2 border-blue-deep text-blue-deep hover:bg-blue-deep/10 rounded-[12px]"
                      onClick={() => {
                        setActiveTab('management')
                        navigate('/company/management')
                      }}
                    >
                      <UserPlus className="w-8 h-8 text-green-emerald" />
                      <div className="text-center">
                        <p className="font-semibold text-base">Gérer l'équipe</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Inviter et gérer vos recruteurs
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-center gap-3 border-2 border-blue-deep text-blue-deep hover:bg-blue-deep/10 rounded-[12px]"
                      onClick={() => navigate('/company/onboarding')}
                    >
                      <Settings className="w-8 h-8 text-green-emerald" />
                      <div className="text-center">
                        <p className="font-semibold text-base">Paramètres</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Modifier les informations de l'entreprise
                        </p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {/* Top Header pour les autres onglets */}
            <header className="h-16 border-b bg-white sticky top-0 z-20 shadow-sm">
              <div className="h-full px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-anthracite font-heading">Espace Entreprise</h1>
                </div>
                
                <div className="flex items-center gap-4">
                  <ThemeToggle />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/company/onboarding')}
                    className="border-blue-deep text-blue-deep hover:bg-blue-deep/10"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Paramètres</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </Button>
                </div>
              </div>
            </header>

            {/* Main Content Area pour les autres onglets */}
            <main className={activeTab === 'search' ? '' : 'p-6 max-w-7xl mx-auto'}>
              {activeTab === 'search' && (
                <ProSearchPage />
              )}

              {activeTab === 'management' && (
                <CompanyManagement />
              )}
            </main>
          </>
        )}
      </div>
    </div>
  )
}
