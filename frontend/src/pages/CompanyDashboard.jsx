/**
 * Company Dashboard — Redesign Yemma Solutions
 * Aesthetic: Luxury editorial SaaS × premium recruitment platform
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom'
import {
  Building2, Users, Search, Settings, LogOut, Menu, X, Home, FileText,
  CreditCard, TrendingUp, UserPlus, MapPin, ChevronRight, HelpCircle,
  Briefcase, BarChart3,   ArrowUpRight, Zap, Shield, ChevronDown
} from 'lucide-react'
import { companyApi, authApiService, paymentApiService, documentApi } from '@/services/api'
import CompanyManagement from './CompanyManagement'
import { SearchTab } from '../components/company/SearchTab'
import { CompanySettingsTab } from '../components/company/CompanySettingsTab'
import { CompanyJobsTab } from '../components/company/CompanyJobsTab'
import { CompanyJobFormTab } from '../components/company/CompanyJobFormTab'
import { CompanyJobCandidateListTab } from '../components/company/CompanyJobCandidateListTab'
import { CompanyJobStatsTab } from '../components/company/CompanyJobStatsTab'
import { LogoutConfirmDialog } from '../components/common/LogoutConfirmDialog'

/* ─── Helpers ──────────────────────────────────────────────────── */

const generateAvatarUrl = (name) => {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CO'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=0E7C7B&color=fff&bold=true&font-size=0.38`
}

/* ─── Inline Styles (injected once) ────────────────────────────── */

const STYLES = `
.ym-dash { font-family: 'DM Sans', system-ui, sans-serif; }
.ym-serif { font-family: 'DM Serif Display', Georgia, serif; }

.ym-glass { background: rgba(255,255,255,0.82); backdrop-filter: blur(24px) saturate(1.5); -webkit-backdrop-filter: blur(24px) saturate(1.5); }
.ym-glass-dark { background: rgba(10,94,93,0.92); backdrop-filter: blur(24px) saturate(1.5); -webkit-backdrop-filter: blur(24px) saturate(1.5); }

.ym-card {
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.ym-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.04);
  border-color: rgba(14,124,123,0.08);
}
.ym-card-interactive:hover { transform: translateY(-2px); }

.ym-sidebar {
  background: linear-gradient(180deg, #FAFBFC 0%, #F3F5F7 40%, #EEF1F4 100%);
}
.ym-nav-item {
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.ym-nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 24px;
  border-radius: 0 4px 4px 0;
  background: linear-gradient(180deg, #0E7C7B, #F28C28);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.ym-nav-active::before { transform: translateY(-50%) scaleY(1); }

.ym-reveal { animation: ymSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
.ym-d1 { animation-delay: 0.04s; } .ym-d2 { animation-delay: 0.08s; }
.ym-d3 { animation-delay: 0.12s; } .ym-d4 { animation-delay: 0.16s; }
.ym-d5 { animation-delay: 0.20s; } .ym-d6 { animation-delay: 0.24s; }
@keyframes ymSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ymPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
.ym-pulse { animation: ymPulse 2.5s ease-in-out infinite; }
@keyframes ymShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.ym-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ymShimmer 1.5s ease-in-out infinite;
}

.ym-scroll::-webkit-scrollbar { width: 4px; }
.ym-scroll::-webkit-scrollbar-track { background: transparent; }
.ym-scroll::-webkit-scrollbar-thumb { background: rgba(14,124,123,0.12); border-radius: 10px; }
.ym-scroll::-webkit-scrollbar-thumb:hover { background: rgba(14,124,123,0.25); }

.ym-dots { background-image: radial-gradient(circle at 1px 1px, rgba(14,124,123,0.035) 1px, transparent 0); background-size: 20px 20px; }

.ym-ring-track { stroke: #E2E8F0; }
.ym-ring-fill { transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
`

/* ─── Mini Components ──────────────────────────────────────────── */

function QuotaRing({ used, total, size = 36 }) {
  const radius = (size - 4) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? Math.min(used / total, 1) : 0
  const offset = circumference * (1 - pct)
  const color = pct >= 0.9 ? '#EF4444' : pct >= 0.7 ? '#F59E0B' : '#0E7C7B'

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={3.5} className="ym-ring-track" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={3.5}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="ym-ring-fill" />
    </svg>
  )
}

function StatCard({ icon: Icon, label, value, sub, onClick, delay = '' }) {
  const className = `ym-card ${onClick ? 'ym-card-interactive cursor-pointer' : ''} p-5 text-left ym-reveal ${delay} group`
  const content = (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8F4F3] to-[#d5edeb] flex items-center justify-center group-hover:from-[#0E7C7B] group-hover:to-[#0A5E5D] transition-all duration-300">
          <Icon className="h-4.5 w-4.5 text-[#0E7C7B] group-hover:text-white transition-colors duration-300" />
        </div>
        {onClick && (
          <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-[#0E7C7B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
        )}
      </div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-1 tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </>
  )
  if (onClick) {
    return <button type="button" onClick={onClick} className={className}>{content}</button>
  }
  return <div className={className}>{content}</div>
}

function ActionCard({ icon: Icon, title, desc, onClick, accent = false, delay = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ym-card ym-card-interactive text-left p-5 group ym-reveal ${delay} overflow-hidden relative ${accent ? 'border-[#0E7C7B]/10' : ''}`}
    >
      {accent && (
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#F28C28]/5 to-transparent -translate-y-8 translate-x-8" />
      )}
      <div className="relative flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${accent ? 'bg-gradient-to-br from-[#0E7C7B] to-[#0A5E5D] shadow-lg shadow-[#0E7C7B]/15 group-hover:shadow-[#0E7C7B]/25' : 'bg-[#F8F9FB] group-hover:bg-[#E8F4F3] border border-gray-100 group-hover:border-[#0E7C7B]/10'}`}>
          <Icon className={`h-5 w-5 ${accent ? 'text-white' : 'text-[#0E7C7B]'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 group-hover:text-[#0E7C7B] transition-colors">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-[#0E7C7B] group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-1" />
      </div>
    </button>
  )
}

/* ─── Main Dashboard ───────────────────────────────────────────── */

export default function CompanyDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { jobId } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [company, setCompany] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
      const companyData = await companyApi.getMyCompanyOrNull()
      setCompany(companyData)
      const membersData = companyData?.id ? await companyApi.getTeamMembers(companyData.id).catch(() => []) : []
      setTeamMembers(membersData)
      if (companyData?.id) {
        try {
          const sub = await paymentApiService.getSubscription(companyData.id)
          setSubscription(sub)
        } catch (error) {
          if (error.response?.status === 404 || error.response?.status === 502 || error.code === 'ERR_NETWORK' || error.message === 'Network Error') setSubscription(null)
          else { console.error('Subscription error:', error); setSubscription(null) }
        }
      }
    } catch (error) {
      console.error('Load error:', error)
      if (error.response?.status === 404) { navigate('/company/onboarding'); return }
    } finally { setLoading(false) }
  }

  const handleLogout = () => setLogoutDialogOpen(true)
  const confirmLogout = () => { authApiService.logout(); navigate('/login') }

  const goToTab = (id, subtab) => {
    setActiveTab(id)
    const routes = {
      search: '/company/dashboard/search',
      management: subtab ? `/company/dashboard/management/${subtab}` : '/company/dashboard/management',
      settings: '/company/dashboard/settings',
      jobs: '/company/dashboard/jobs',
      statistics: '/company/dashboard/statistics',
    }
    navigate(routes[id] || '/company/dashboard')
  }

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="ym-dash min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <style>{STYLES}</style>
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0E7C7B]/10 to-[#F28C28]/10 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-[#0E7C7B] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-400">Chargement du tableau de bord…</p>
        </div>
      </div>
    )
  }

  /* ─── No company ─── */
  if (!company) {
    return (
      <div className="ym-dash min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <style>{STYLES}</style>
        <div className="ym-card max-w-md w-full p-8 text-center ym-reveal">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8F4F3] to-[#d5edeb] flex items-center justify-center mx-auto mb-5">
            <Building2 className="h-7 w-7 text-[#0E7C7B]" />
          </div>
          <h2 className="ym-serif text-2xl text-gray-800 mb-2">Créez votre entreprise</h2>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">Configurez votre espace de recrutement pour accéder à la CVthèque et gérer vos offres d&apos;emploi.</p>
          <button
            type="button"
            onClick={() => navigate('/company/onboarding')}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#0E7C7B] to-[#0A5E5D] text-white font-semibold text-sm shadow-lg shadow-[#0E7C7B]/20 hover:shadow-[#0E7C7B]/30 hover:translate-y-[-1px] transition-all duration-300"
          >
            Commencer →
          </button>
        </div>
      </div>
    )
  }

  /* ─── Data ─── */
  const displayLogo = documentApi.normalizeLogoUrl(company.logo_url) || generateAvatarUrl(company.name)
  const activeMembers = teamMembers.filter(m => m.status === 'active')
  const quotaUsed = subscription?.quota_limit != null && subscription?.quota_remaining != null ? Math.max(0, subscription.quota_limit - subscription.quota_remaining) : 0
  const quotaTotal = subscription?.quota_limit ?? 0
  const quotaRemaining = subscription?.quota_remaining

  const NAV_GROUPS = [
    { label: 'Accueil', items: [{ path: '/company/dashboard', label: 'Vue d\'ensemble', icon: Home }] },
    { label: 'Recrutement', items: [{ path: '/company/dashboard/search', label: 'Recherche candidats', icon: Search }, { path: '/company/dashboard/jobs', label: "Offres d'emploi", icon: Briefcase }] },
    { label: 'Analyse', items: [{ path: '/company/dashboard/statistics', label: 'Statistiques', icon: BarChart3 }] },
    { label: 'Gestion', items: [{ path: '/company/dashboard/management', label: 'Équipe & Abonnement', icon: Users }] },
  ]

  const isActive = (path) => {
    if (path === '/company/dashboard') return location.pathname === '/company/dashboard'
    if (path === '/company/dashboard/jobs') return location.pathname.startsWith('/company/dashboard/jobs')
    return location.pathname.startsWith(path)
  }

  const currentDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="ym-dash min-h-screen flex flex-col bg-[#F8F9FB]">
      <style>{STYLES}</style>

      <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:px-3 focus:py-2 focus:bg-[#0E7C7B] focus:text-white focus:rounded-lg">
        Aller au contenu principal
      </a>

      {/* ═══════════════════════════════════════════════════════════
          TOP BAR
         ═══════════════════════════════════════════════════════════ */}
      <header className="ym-glass sticky top-0 z-30 border-b border-gray-200/50">
        <div className="flex items-center justify-between h-[60px] px-4 sm:px-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#E8F4F3] text-gray-500 hover:text-[#0E7C7B] transition-all"
              aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {sidebarOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0E7C7B] to-[#0A5E5D] flex items-center justify-center shadow-sm shadow-[#0E7C7B]/10 group-hover:shadow-[#0E7C7B]/20 transition-shadow">
                <img src="/favicon.ico" alt="Yemma" className="h-5 w-5 object-contain brightness-0 invert" onError={(e) => { e.target.style.display = 'none' }} />
              </div>
              <span className="hidden sm:block text-sm font-bold text-gray-700 tracking-tight">Yemma<span className="text-[#0E7C7B]">.</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-3 bg-[#F8F9FB] rounded-2xl px-4 py-2 border border-gray-100">
            <QuotaRing used={quotaUsed} total={quotaTotal} size={32} />
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-700 tabular-nums leading-none">
                {quotaRemaining !== undefined ? quotaRemaining : '∞'} <span className="font-normal text-gray-400">restantes</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Consultations CV</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link to="/contact" className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-[#0E7C7B] hover:bg-[#E8F4F3] transition-all" title="Aide">
              <HelpCircle className="h-[18px] w-[18px]" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 py-1.5 px-2 rounded-xl hover:bg-[#F8F9FB] transition-all"
                aria-expanded={userMenuOpen}
              >
                <img src={displayLogo} alt="" className="w-8 h-8 rounded-xl object-cover ring-2 ring-gray-100 shadow-sm" onError={(e) => { e.target.src = generateAvatarUrl(company.name) }} />
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full mt-2 w-60 ym-card overflow-hidden z-50 py-1">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="font-bold text-sm text-gray-800 truncate">{company.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{activeMembers.length} membre{activeMembers.length > 1 ? 's' : ''} actif{activeMembers.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/company/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-[#F8F9FB] hover:text-[#0E7C7B] transition-colors">
                        <Settings className="h-4 w-4" /> Paramètres
                      </Link>
                    </div>
                    <div className="border-t border-gray-50 py-1">
                      <button type="button" onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                        <LogOut className="h-4 w-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════
            SIDEBAR
           ═══════════════════════════════════════════════════════════ */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-[264px] flex flex-col shrink-0
            lg:static lg:translate-x-0
            ym-sidebar border-r border-gray-200/60
            transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="px-5 pt-5 pb-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between gap-2 mb-1">
              <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img src={displayLogo} alt="" className="w-11 h-11 rounded-xl object-cover ring-2 ring-white shadow-md shrink-0" onError={(e) => { e.target.src = generateAvatarUrl(company.name) }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-800 truncate leading-tight">{company.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] ym-pulse" />
                  <span className="text-[10px] font-semibold text-gray-400">{subscription?.plan?.name || 'Plan gratuit'}</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto ym-scroll py-5 px-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-6 last:mb-0">
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">
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
                          ym-nav-item ${active ? 'ym-nav-active' : ''}
                          group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                          ${active
                            ? 'bg-gradient-to-r from-[#0E7C7B] to-[#0A5E5D] text-white shadow-md shadow-[#0E7C7B]/15'
                            : 'text-gray-500 hover:bg-white hover:text-[#0E7C7B] hover:shadow-sm'
                          }
                        `}
                      >
                        <span className={`
                          flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200
                          ${active ? 'bg-white/15' : 'bg-gray-50 group-hover:bg-[#E8F4F3]'}
                        `}>
                          <Icon className={`h-[16px] w-[16px] ${active ? 'text-white' : 'text-[#0E7C7B]/70 group-hover:text-[#0E7C7B]'}`} />
                        </span>
                        <span className="truncate">{item.label}</span>
                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200/50 space-y-0.5">
            <Link
              to="/company/dashboard/settings"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-400 hover:bg-white hover:text-[#0E7C7B] hover:shadow-sm transition-all"
            >
              <Settings className="h-4 w-4 shrink-0" /> Paramètres
            </Link>
            <Link
              to="/contact"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-400 hover:bg-white hover:text-[#0E7C7B] hover:shadow-sm transition-all"
            >
              <HelpCircle className="h-4 w-4 shrink-0" /> Centre d&apos;aide
            </Link>
            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all w-full text-left mt-1"
            >
              <LogOut className="h-4 w-4 shrink-0" /> Déconnexion
            </button>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}

        <LogoutConfirmDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen} onConfirm={confirmLogout} />

        {/* ═══════════════════════════════════════════════════════════
            MAIN CONTENT
           ═══════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 overflow-y-auto ym-scroll">
          <main id="dashboard-main" aria-label="Tableau de bord entreprise">
            <div className={`mx-auto px-4 py-6 pb-24 lg:px-8 lg:pb-8 ${['search', 'jobs', 'statistics'].includes(activeTab) ? 'max-w-7xl' : 'max-w-5xl'}`}>

              {activeTab === 'search' ? (
                <SearchTab />
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <div key="overview">
                      <div className="ym-reveal relative overflow-hidden rounded-2xl mb-8">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0A5E5D] via-[#0E7C7B] to-[#12918F]" />
                        <div className="absolute inset-0 ym-dots opacity-40" />
                        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#F28C28]/8 blur-3xl" />
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />

                        <div className="relative px-6 sm:px-8 py-8 sm:py-10">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                            <div className="flex items-center gap-5">
                              <img
                                src={displayLogo}
                                alt={company.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-white/20 shadow-2xl shrink-0"
                                onError={(e) => { e.target.src = generateAvatarUrl(company.name) }}
                              />
                              <div>
                                <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">{currentDate}</p>
                                <h1 className="ym-serif text-2xl sm:text-3xl text-white leading-tight">
                                  Bonjour, {company.name.split(' ')[0]}
                                </h1>
                                <p className="text-white/60 text-sm mt-1.5 max-w-md">
                                  Pilotez votre recrutement, explorez la CVthèque et suivez vos offres en cours.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {(company.status === 'active' || company.status === 'ACTIVE') && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-semibold border border-white/10">
                                  <Shield className="h-3 w-3" /> Entreprise vérifiée
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                        <StatCard icon={Users} label="Équipe" value={activeMembers.length} sub={`Membre${activeMembers.length > 1 ? 's' : ''} actif${activeMembers.length > 1 ? 's' : ''}`} delay="ym-d1" />
                        <StatCard icon={CreditCard} label="Plan" value={subscription?.plan?.name || 'Gratuit'} sub="Abonnement en cours" delay="ym-d2" />
                        <StatCard icon={Zap} label="Quota" value={quotaRemaining !== undefined ? quotaRemaining : '∞'} sub="Consultations restantes" onClick={() => goToTab('management', 'subscription')} delay="ym-d3" />
                        <StatCard icon={Building2} label="Statut" value="Actif" sub="Compte vérifié" delay="ym-d4" />
                      </div>

                      {(company.legal_id || company.adresse) && (
                        <div className="ym-card ym-reveal ym-d4 p-5 mb-8">
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                            {company.legal_id && (
                              <span className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-[#0E7C7B]/50" />
                                <span className="text-gray-400 text-xs">RCCM</span>
                                <span className="font-semibold text-gray-700">{company.legal_id}</span>
                              </span>
                            )}
                            {company.adresse && (
                              <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-[#0E7C7B]/50" />
                                <span className="text-gray-400 text-xs">Adresse</span>
                                <span className="font-semibold text-gray-700 truncate max-w-[220px]">{company.adresse}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mb-4 ym-reveal ym-d5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
                          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Actions rapides</h2>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <ActionCard icon={Briefcase} title="Offres d'emploi" desc="Publier et gérer vos offres" onClick={() => goToTab('jobs')} accent delay="ym-d5" />
                        <ActionCard icon={Search} title="Rechercher candidats" desc="Explorer la CVthèque Yemma" onClick={() => goToTab('search')} delay="ym-d5" />
                        <ActionCard icon={UserPlus} title="Gérer l'équipe" desc="Inviter des recruteurs" onClick={() => goToTab('management')} delay="ym-d6" />
                      </div>
                    </div>
                  )}

                  {activeTab === 'management' && <div className="ym-reveal"><CompanyManagement embedded /></div>}
                  {activeTab === 'settings' && <div className="ym-reveal"><CompanySettingsTab company={company} onUpdate={loadData} /></div>}
                  {activeTab === 'jobs' && company?.id && (
                    <div className="ym-reveal">
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
                    <div className="ym-reveal"><CompanyJobStatsTab companyId={company.id} basePath="/company/dashboard/jobs" /></div>
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
