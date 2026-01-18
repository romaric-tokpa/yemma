import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Building, Users, Search, Settings, LogOut, Menu, X,
  Home, FileText, CreditCard, TrendingUp, UserPlus,
  CheckCircle2, Clock, AlertCircle
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Aucune entreprise trouvée</CardTitle>
            <CardDescription>
              Vous devez créer votre entreprise pour accéder au dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/company/onboarding')} className="w-full">
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64' : 'w-16'} 
        bg-card border-r 
        fixed left-0 top-0 h-screen z-30
        transition-all duration-300 ease-in-out
        flex flex-col
      `}>
        {/* Logo/Header Sidebar */}
        <div className="h-16 border-b flex items-center justify-between px-4">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Yemma</span>
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
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
              <img
                src={displayLogo}
                alt={company.name}
                className="w-10 h-10 rounded-lg object-cover border-2 border-primary/20"
                onError={(e) => {
                  e.target.src = generateAvatarUrl(company.name)
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{company.name}</p>
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
                className="w-10 h-10 rounded-lg object-cover border-2 border-primary/20"
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
        {/* Top Header */}
        <header className="h-16 border-b bg-card sticky top-0 z-20 shadow-sm">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Espace Entreprise</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/company/onboarding')}
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

        {/* Main Content Area */}
        <main className={activeTab === 'search' ? '' : 'p-6 max-w-7xl mx-auto'}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Card */}
              <Card className="border-l-4 border-l-primary shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        Bienvenue, {company.name} !
                      </CardTitle>
                      <CardDescription>
                        Gérez votre équipe, recherchez des candidats qualifiés et développez votre entreprise
                      </CardDescription>
                    </div>
                    <img
                      src={displayLogo}
                      alt={company.name}
                      className="w-20 h-20 rounded-lg object-cover border-4 border-background shadow-md"
                      onError={(e) => {
                        e.target.src = generateAvatarUrl(company.name)
                      }}
                    />
                  </div>
                </CardHeader>
              </Card>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Membres actifs</p>
                        <p className="text-2xl font-bold">{activeMembers.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Statut</p>
                        <Badge className="mt-1">
                          {company.status === 'ACTIVE' ? 'Actif' : company.status}
                        </Badge>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Abonnement</p>
                        <p className="text-2xl font-bold">
                          {subscription?.plan?.name || 'Aucun'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Quota restant</p>
                        <p className="text-2xl font-bold">
                          {subscription?.quota_remaining || '∞'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                  <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-center gap-3"
                      onClick={() => {
                        setActiveTab('search')
                        navigate('/company/search')
                      }}
                    >
                      <Search className="w-8 h-8 text-primary" />
                      <div className="text-center">
                        <p className="font-semibold">Rechercher des candidats</p>
                        <p className="text-sm text-muted-foreground">
                          Accédez à la CVthèque de profils validés
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-center gap-3"
                      onClick={() => {
                        setActiveTab('management')
                        navigate('/company/management')
                      }}
                    >
                      <UserPlus className="w-8 h-8 text-primary" />
                      <div className="text-center">
                        <p className="font-semibold">Gérer l'équipe</p>
                        <p className="text-sm text-muted-foreground">
                          Inviter et gérer vos recruteurs
                        </p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto py-6 flex flex-col items-center gap-3"
                      onClick={() => navigate('/company/onboarding')}
                    >
                      <Settings className="w-8 h-8 text-primary" />
                      <div className="text-center">
                        <p className="font-semibold">Paramètres</p>
                        <p className="text-sm text-muted-foreground">
                          Modifier les informations de l'entreprise
                        </p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de l'entreprise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Nom</p>
                      <p className="text-lg">{company.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">SIRET</p>
                      <p className="text-lg">{company.legal_id}</p>
                    </div>
                    {company.adresse && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Adresse</p>
                        <p className="text-lg">{company.adresse}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'search' && (
            <ProSearchPage />
          )}

          {activeTab === 'management' && (
            <CompanyManagement />
          )}
        </main>
      </div>
    </div>
  )
}
