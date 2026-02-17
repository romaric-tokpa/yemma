import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  FileText,
  CreditCard,
  TrendingUp,
  UserPlus,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { companyApi, authApiService, paymentApiService } from '@/services/api'
import CompanyManagement from './CompanyManagement'
import { SearchTab } from '../components/company/SearchTab'
import { LogoutConfirmDialog } from '../components/common/LogoutConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

const generateAvatarUrl = (name) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CO'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const path = location.pathname
    if (path.includes('/company/dashboard/search')) setActiveTab('search')
    else if (path.includes('/company/dashboard/management')) setActiveTab('management')
    else setActiveTab('overview')
  }, [location.pathname])

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
          // 404 = pas d'abonnement (plan gratuit), 502 = service indisponible
          if (error.response?.status === 404 || error.response?.status === 502 || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
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
        navigate('/company/onboarding')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => setLogoutDialogOpen(true)

  const confirmLogout = () => {
    authApiService.logout()
    navigate('/login')
  }

  const goToTab = (id, subtab) => {
    setActiveTab(id)
    if (id === 'search') navigate('/company/dashboard/search')
    else if (id === 'management') navigate(subtab ? `/company/dashboard/management/${subtab}` : '/company/dashboard/management')
    else navigate('/company/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#226D68]" />
          <p className="text-sm text-[#2C2C2C]/70">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-0 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-semibold text-[#2C2C2C]">Aucune entreprise</CardTitle>
            <CardDescription className="text-xs mt-1">
              Créez votre entreprise pour accéder au dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Button
              onClick={() => navigate('/company/onboarding')}
              className="w-full h-9 text-sm bg-[#226D68] hover:bg-[#1a5a55]"
            >
              Créer mon entreprise
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
    { id: 'search', label: 'Recherche', icon: Search },
    { id: 'management', label: 'Gestion', icon: Settings },
  ]

  const displayLogo = company.logo_url || generateAvatarUrl(company.name)
  const activeMembers = teamMembers.filter(m => m.status === 'active')
  const shouldContractSidebar = activeTab === 'search'
  const effectiveSidebarOpen = shouldContractSidebar ? false : sidebarOpen

  return (
    <div className="h-screen bg-[#F4F6F8] flex overflow-hidden max-h-screen">
      {/* Sidebar compact */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-white border-r border-[#e5e7eb]
          transition-all duration-200
          ${effectiveSidebarOpen ? 'w-52 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-14'}
          flex flex-col
        `}
      >
        <div className="h-11 border-b border-[#e5e7eb] flex items-center justify-between px-3">
          {effectiveSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#226D68] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-[#2C2C2C]">
                <span className="text-[#226D68]">Yemma</span>
                <span className="text-[#e76f51]">-Solutions</span>
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden h-8 w-8 flex-shrink-0"
          >
            {effectiveSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const href = item.id === 'overview' ? '/company/dashboard' : item.id === 'search' ? '/company/dashboard/search' : '/company/dashboard/management'
            return (
              <Link
                key={item.id}
                to={href}
                className={`
                  w-full flex items-center gap-2 h-9 px-2.5 rounded-md text-sm font-medium transition-colors
                  ${isActive ? 'bg-[#E8F4F3] text-[#226D68]' : 'text-[#2C2C2C]/70 hover:bg-[#F4F6F8]'}
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {effectiveSidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[#e5e7eb] p-2 space-y-0">
          {effectiveSidebarOpen && (
            <div className="flex items-center gap-2 p-2 rounded-md mb-1 hover:bg-[#F4F6F8] transition-colors">
              <img
                src={displayLogo}
                alt={company.name}
                className="w-8 h-8 rounded-md object-cover border border-[#e5e7eb]"
                onError={(e) => {
                  e.target.src = generateAvatarUrl(company.name)
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-[#2C2C2C]">{company.name}</p>
                <p className="text-[10px] text-[#9ca3af] truncate">
                  {activeMembers.length} membre{activeMembers.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 h-9 px-2.5 rounded-md text-sm text-[#e76f51] hover:bg-[#FDF2F0] transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {effectiveSidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={confirmLogout}
      />

      {effectiveSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <main className={`flex-1 overflow-hidden ${activeTab === 'search' ? 'flex flex-col' : ''}`}>
        {activeTab === 'search' ? (
          <SearchTab />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-4 sm:py-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-lg font-semibold text-[#2C2C2C] font-[Poppins]">
                    {activeTab === 'overview' ? 'Vue d\'ensemble' : 'Gestion'}
                  </h1>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {activeTab === 'overview'
                      ? `Bienvenue, ${company.name}`
                      : 'Équipe, abonnement et historique'}
                  </p>
                </div>
                {activeTab === 'overview' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/company/onboarding')}
                    className="h-8 text-xs border-[#d1d5db] text-[#2C2C2C] hover:bg-[#F4F6F8]"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    Paramètres
                  </Button>
                )}
              </div>

              {activeTab === 'overview' && (
                <>
                  {/* Stats row compact */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <Card className="border-[#e5e7eb] shadow-none">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wide">Membres</span>
                          <Users className="w-4 h-4 text-[#226D68]" />
                        </div>
                        <p className="text-xl font-bold text-[#2C2C2C] mt-1">{activeMembers.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-[#e5e7eb] shadow-none">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wide">Statut</span>
                          <Badge className="h-5 text-[10px] px-1.5 bg-[#226D68] text-white">
                            {company.status === 'ACTIVE' ? 'Actif' : company.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-[#2C2C2C] mt-1">Entreprise</p>
                      </CardContent>
                    </Card>
                    <button
                      onClick={() => goToTab('management', 'subscription')}
                      className="w-full text-left"
                    >
                      <Card className="border-[#e5e7eb] shadow-none hover:border-[#226D68]/40 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wide">Plan</span>
                            <CreditCard className="w-4 h-4 text-[#9ca3af]" />
                          </div>
                          <p className="text-sm font-medium text-[#2C2C2C] mt-1 truncate">
                            {subscription?.plan?.name || 'Aucun'}
                          </p>
                          <p className="text-[10px] text-[#226D68] mt-0.5">Modifier l'abonnement</p>
                        </CardContent>
                      </Card>
                    </button>
                    <Card className="border-[#e5e7eb] shadow-none">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wide">Quota</span>
                          <TrendingUp className="w-4 h-4 text-[#e76f51]" />
                        </div>
                        <p className="text-xl font-bold text-[#2C2C2C] mt-1">
                          {subscription?.quota_remaining !== undefined ? subscription.quota_remaining : '∞'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Entreprise compact */}
                  <Card className="border-[#e5e7eb] shadow-none mb-4">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={displayLogo}
                          alt={company.name}
                          className="w-11 h-11 rounded-lg object-cover border border-[#e5e7eb]"
                          onError={(e) => {
                            e.target.src = generateAvatarUrl(company.name)
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#2C2C2C]">{company.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-[#9ca3af]">
                            {company.legal_id && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {company.legal_id}
                              </span>
                            )}
                            {company.adresse && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                {company.adresse}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions rapides */}
                  <Card className="border-[#e5e7eb] shadow-none">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">
                        Actions rapides
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          onClick={() => goToTab('search')}
                          className="flex items-center gap-3 p-3 rounded-lg border border-[#e5e7eb] bg-white hover:border-[#226D68]/40 hover:bg-[#E8F4F3]/50 transition-colors text-left group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#E8F4F3] flex items-center justify-center group-hover:bg-[#226D68]/20">
                            <Search className="w-4 h-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2C2C2C]">Rechercher candidats</p>
                            <p className="text-[10px] text-[#9ca3af]">Accéder à la CVthèque</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                        </button>

                        <button
                          onClick={() => goToTab('management')}
                          className="flex items-center gap-3 p-3 rounded-lg border border-[#e5e7eb] bg-white hover:border-[#226D68]/40 hover:bg-[#E8F4F3]/50 transition-colors text-left group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#E8F4F3] flex items-center justify-center group-hover:bg-[#226D68]/20">
                            <UserPlus className="w-4 h-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2C2C2C]">Gérer l'équipe</p>
                            <p className="text-[10px] text-[#9ca3af]">Inviter des recruteurs</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                        </button>

                        <button
                          onClick={() => navigate('/company/onboarding')}
                          className="flex items-center gap-3 p-3 rounded-lg border border-[#e5e7eb] bg-white hover:border-[#226D68]/40 hover:bg-[#E8F4F3]/50 transition-colors text-left group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[#E8F4F3] flex items-center justify-center group-hover:bg-[#226D68]/20">
                            <Settings className="w-4 h-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2C2C2C]">Paramètres</p>
                            <p className="text-[10px] text-[#9ca3af]">Modifier l'entreprise</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#9ca3af] flex-shrink-0" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === 'management' && (
                <div className="mt-0">
                  <CompanyManagement embedded />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
