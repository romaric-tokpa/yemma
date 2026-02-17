import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom'
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
  HelpCircle,
  Briefcase,
  BarChart3,
} from 'lucide-react'
import { companyApi, authApiService, paymentApiService } from '@/services/api'
import CompanyManagement from './CompanyManagement'
import { SearchTab } from '../components/company/SearchTab'
import { CompanySettingsTab } from '../components/company/CompanySettingsTab'
import { CompanyJobsTab } from '../components/company/CompanyJobsTab'
import { CompanyJobFormTab } from '../components/company/CompanyJobFormTab'
import { CompanyJobCandidateListTab } from '../components/company/CompanyJobCandidateListTab'
import { CompanyJobStatsTab } from '../components/company/CompanyJobStatsTab'
import { LogoutConfirmDialog } from '../components/common/LogoutConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const generateAvatarUrl = (name) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CO'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
}

/** En-tête de section (style CandidateDashboard) */
const SectionHeader = ({ title, subtitle, icon: Icon, action }) => (
  <div className="mb-6 sm:mb-8">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[#E8F4F3] shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#226D68]" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] font-heading tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm sm:text-base text-[#6b7280] leading-relaxed max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:mt-0">{action}</div>}
    </div>
  </div>
)

export default function CompanyDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { jobId } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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
    else if (path.includes('/company/dashboard/settings')) setActiveTab('settings')
    else if (path.includes('/company/dashboard/jobs')) setActiveTab('jobs')
    else if (path.includes('/company/dashboard/statistics')) setActiveTab('statistics')
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
    else if (id === 'settings') navigate('/company/dashboard/settings')
    else if (id === 'jobs') navigate('/company/dashboard/jobs')
    else if (id === 'statistics') navigate('/company/dashboard/statistics')
    else navigate('/company/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 container mx-auto p-4 md:p-6 max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="rounded-[12px] border border-border bg-card overflow-hidden">
              <div className="h-12 bg-muted/50 border-b border-border" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-4/5 bg-muted rounded" />
                <div className="h-4 w-3/5 bg-muted rounded" />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md rounded-[12px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Aucune entreprise</CardTitle>
            <CardDescription className="text-center">
              Créez votre entreprise pour accéder au dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full text-white"
              style={{ backgroundColor: '#226D68' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#226D68' }}
              onClick={() => navigate('/company/onboarding')}
            >
              Créer mon entreprise
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayLogo = company.logo_url || generateAvatarUrl(company.name)
  const activeMembers = teamMembers.filter(m => m.status === 'active')
  const quotaUsed = subscription?.quota_limit != null && subscription?.quota_remaining != null
    ? Math.max(0, subscription.quota_limit - subscription.quota_remaining)
    : 0
  const quotaTotal = subscription?.quota_limit ?? 0
  const quotaPercent = quotaTotal > 0 ? Math.min(100, (quotaUsed / quotaTotal) * 100) : 0

  const NAV_GROUPS = [
    {
      label: 'Accueil',
      items: [
        { path: '/company/dashboard', label: 'Vue d\'ensemble', icon: Home },
      ],
    },
    {
      label: 'Recrutement',
      items: [
        { path: '/company/dashboard/search', label: 'Recherche candidats', icon: Search },
        { path: '/company/dashboard/jobs', label: "Offres d'emploi", icon: Briefcase },
      ],
    },
    {
      label: 'Analyse',
      items: [
        { path: '/company/dashboard/statistics', label: 'Statistiques', icon: BarChart3 },
      ],
    },
    {
      label: 'Gestion',
      items: [
        { path: '/company/dashboard/management', label: 'Équipe & Abonnement', icon: Users },
      ],
    },
  ]

  const isActive = (path) => {
    if (path === '/company/dashboard') return location.pathname === '/company/dashboard'
    if (path === '/company/dashboard/jobs') return location.pathname.startsWith('/company/dashboard/jobs')
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:px-3 focus:py-2 focus:bg-[#226D68] focus:text-white focus:rounded-md">
        Aller au contenu principal
      </a>

      {/* Top bar - Logo, quota, user (style CandidateDashboard) */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 safe-top">
        <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 shrink-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[#E8F4F3] text-[#2C2C2C]"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.ico" alt="Yemma Solutions" className="h-8 w-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/logo-icon.svg' }} />
            </Link>
          </div>

          {/* Barre quota (équivalent progression candidat) */}
          <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm mx-2 sm:mx-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Progress
                  value={quotaTotal > 0 ? quotaPercent : 0}
                  className="h-2 rounded-full bg-gray-100 [&>div]:bg-[#226D68]"
                />
              </div>
              <span className="text-sm font-semibold text-[#2C2C2C] shrink-0 tabular-nums">
                {subscription?.quota_remaining !== undefined ? subscription.quota_remaining : '∞'}
              </span>
            </div>
            <p className="text-[10px] text-[#6b7280] mt-0.5 truncate">Consultations restantes</p>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-1 shrink-0">
            <Link to="/contact" className="p-2 rounded-xl hover:bg-[#E8F4F3] text-[#6b7280] hover:text-[#226D68] transition-colors" title="Aide">
              <HelpCircle className="h-5 w-5" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#E8F4F3] transition-colors"
                aria-expanded={userMenuOpen}
              >
                <img src={displayLogo} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-[#E8F4F3]" onError={(e) => { e.target.src = generateAvatarUrl(company.name) }} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full mt-2 py-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-[#F4F6F8]/50 border-b border-gray-100">
                      <p className="font-semibold text-sm text-[#2C2C2C] truncate">{company.name}</p>
                      <p className="text-xs text-[#6b7280] truncate mt-0.5">{activeMembers.length} membre{activeMembers.length > 1 ? 's' : ''}</p>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 rounded-none h-10 px-4" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar (style CandidateDashboard) */}
        <aside
          className={`
          fixed inset-y-0 left-0 z-40 w-72 flex flex-col shrink-0
          lg:static lg:translate-x-0
          bg-gradient-to-b from-[#F8FAFC] to-white
          border-r border-gray-200/80
          shadow-[4px_0_24px_-4px_rgba(34,109,104,0.06)]
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        >
          <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200/60">
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-white/80 text-[#6b7280] hover:text-[#2C2C2C] transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src={displayLogo}
                alt=""
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm shrink-0"
                onError={(e) => { e.target.src = generateAvatarUrl(company.name) }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2C2C2C] truncate">{company.name}</p>
                <p className="text-xs text-[#6b7280] truncate">
                  {subscription?.plan?.name || 'Plan gratuit'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-6 last:mb-0">
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                        className={`
                          group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium
                          transition-all duration-200
                          ${active
                            ? 'bg-[#226D68] text-white shadow-sm shadow-[#226D68]/20'
                            : 'text-[#4b5563] hover:bg-white hover:text-[#226D68] hover:shadow-sm'
                          }
                        `}
                      >
                        <span className={`
                          flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors
                          ${active ? 'bg-white/20' : 'bg-[#E8F4F3]/60 group-hover:bg-[#E8F4F3]'}
                        `}>
                          <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-[#226D68]'}`} />
                        </span>
                        <span className="flex-1 min-w-0 truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200/60 space-y-0.5">
            <Link
              to="/company/dashboard/settings"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#6b7280] hover:bg-[#E8F4F3] hover:text-[#226D68] transition-colors"
            >
              <Settings className="h-4 w-4 shrink-0" />
              Paramètres entreprise
            </Link>
            <Link
              to="/contact"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#6b7280] hover:bg-[#E8F4F3] hover:text-[#226D68] transition-colors"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              Besoin d&apos;aide ?
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-xl h-10 px-3 mt-2"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <LogoutConfirmDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} onConfirm={confirmLogout} />

        {/* Main */}
        <div className="flex-1 min-w-0">
          <main id="dashboard-main" className="flex-1 overflow-y-auto min-w-0" aria-label="Tableau de bord entreprise">
            <div className={`mx-auto px-4 py-6 pb-24 sm:pb-24 lg:px-8 lg:pb-8 safe-x ${['search', 'jobs', 'statistics'].includes(activeTab) ? 'max-w-7xl' : 'max-w-4xl'}`}>
              {activeTab === 'search' ? (
                <SearchTab />
              ) : (
                <>
                {activeTab === 'overview' && (
                  <>
                    {/* Hero accueil */}
                    <div className="mb-8">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
                          Bienvenue, {company.name}
                        </h1>
                        {(company.status === 'active' || company.status === 'ACTIVE') && (
                          <Badge className="bg-[#226D68] text-white border-0">Actif</Badge>
                        )}
                      </div>
                      <p className="text-[#6b7280] mt-2 max-w-2xl">
                        Gérez votre entreprise, recherchez des candidats qualifiés et pilotez votre équipe de recrutement.
                      </p>
                    </div>

                    {/* Stats - style bento CandidateDashboard */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                      <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#E8F4F3] rounded-lg">
                            <Users className="h-4 w-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#6b7280] font-medium">Membres</p>
                            <p className="text-lg font-bold text-[#2C2C2C]">{activeMembers.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#E8F4F3] rounded-lg">
                            <CreditCard className="h-4 w-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#6b7280] font-medium">Plan</p>
                            <p className="text-sm font-semibold text-[#2C2C2C] truncate">{subscription?.plan?.name || 'Gratuit'}</p>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => goToTab('management', 'subscription')} className="text-left">
                        <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] hover:shadow-sm transition-all h-full">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#E8F4F3] rounded-lg">
                              <TrendingUp className="h-4 w-4 text-[#226D68]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#6b7280] font-medium">Quota</p>
                              <p className="text-lg font-bold text-[#2C2C2C]">
                                {subscription?.quota_remaining !== undefined ? subscription.quota_remaining : '∞'}
                              </p>
                              <p className="text-[10px] text-[#226D68] font-medium mt-0.5">Modifier →</p>
                            </div>
                          </div>
                        </div>
                      </button>
                      <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#E8F4F3] rounded-lg">
                            <Building2 className="h-4 w-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#6b7280] font-medium">Statut</p>
                            <p className="text-sm font-semibold text-[#2C2C2C]">Actif</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Carte entreprise */}
                    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <img
                          src={displayLogo}
                          alt={company.name}
                          className="w-20 h-20 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0"
                          onError={(e) => { e.target.src = generateAvatarUrl(company.name) }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{company.name}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6b7280]">
                            {company.legal_id && (
                              <span className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-[#226D68] shrink-0" />
                                {company.legal_id}
                              </span>
                            )}
                            {company.adresse && (
                              <span className="flex items-center gap-2 truncate max-w-[240px]">
                                <MapPin className="h-4 w-4 text-[#226D68] shrink-0" />
                                {company.adresse}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions rapides - style CandidateDashboard */}
                    <SectionHeader
                      title="Actions rapides"
                      subtitle="Accédez rapidement aux fonctionnalités principales"
                      icon={Building2}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => goToTab('jobs')}
                        className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#E8F4F3] rounded-lg group-hover:bg-[#E8F4F3]">
                            <Briefcase className="h-4 w-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2C2C2C]">Offres d&apos;emploi</p>
                            <p className="text-xs text-[#6b7280]">Publier et gérer vos offres</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[#9ca3af] shrink-0" />
                        </div>
                      </button>
                      <button
                        onClick={() => goToTab('search')}
                        className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#E8F4F3] rounded-lg group-hover:bg-[#E8F4F3]">
                            <Search className="h-4 w-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2C2C2C]">Rechercher candidats</p>
                            <p className="text-xs text-[#6b7280]">Accéder à la CVthèque</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[#9ca3af] shrink-0" />
                        </div>
                      </button>
                      <button
                        onClick={() => goToTab('management')}
                        className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#E8F4F3] rounded-lg group-hover:bg-[#E8F4F3]">
                            <UserPlus className="h-4 w-4 text-[#226D68]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2C2C2C]">Gérer l'équipe</p>
                            <p className="text-xs text-[#6b7280]">Inviter des recruteurs</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[#9ca3af] shrink-0" />
                        </div>
                      </button>
                    </div>
                  </>
                )}

                {activeTab === 'management' && (
                  <div className="mt-0">
                    <CompanyManagement embedded />
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div className="mt-0">
                    <CompanySettingsTab company={company} onUpdate={loadData} />
                  </div>
                )}
                {activeTab === 'jobs' && company?.id && (
                  <div className="mt-0">
                    {location.pathname.endsWith('/new') ? (
                      <CompanyJobFormTab companyId={company.id} company={company} basePath="/company/dashboard/jobs" />
                    ) : location.pathname.endsWith('/candidatures') && jobId ? (
                      <CompanyJobCandidateListTab companyId={company.id} jobId={jobId} basePath="/company/dashboard/jobs" />
                    ) : location.pathname.includes('/edit') && jobId ? (
                      <CompanyJobFormTab companyId={company.id} company={company} jobId={jobId} basePath="/company/dashboard/jobs" />
                    ) : (
                      <CompanyJobsTab companyId={company.id} basePath="/company/dashboard/jobs" />
                    )}
                  </div>
                )}
                {activeTab === 'statistics' && company?.id && (
                  <div className="mt-0">
                    <CompanyJobStatsTab companyId={company.id} basePath="/company/dashboard/jobs" />
                  </div>
                )}
              </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
