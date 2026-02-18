/**
 * Layout partagé pour les pages admin : header, sidebar, contenu principal.
 * Design aligné sur le dashboard candidat.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  LogOut, Menu, X, HelpCircle, LayoutDashboard, FileCheck, Briefcase,
  BarChart3, Search, Shield, Building, Bell, User, ExternalLink
} from 'lucide-react'
import { LogoutConfirmDialog } from '@/components/common/LogoutConfirmDialog'
import { authApiService, notificationApi } from '@/services/api'

const NAV_GROUPS = [
  {
    label: 'Accueil',
    items: [
      { path: '/admin/dashboard', label: 'Accueil', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Candidats',
    items: [
      { path: '/admin/validation', label: 'Validation', icon: FileCheck },
      { path: '/admin/cvtheque', label: 'CVthèque', icon: Search },
    ],
  },
  {
    label: 'Entreprises',
    items: [
      { path: '/admin/companies', label: 'Entreprises', icon: Building },
      { path: '/admin/jobs', label: "Offres d'emploi", icon: Briefcase },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { path: '/admin/statistics', label: 'Statistiques', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { path: '/admin/invitations', label: 'Invitations Admin', icon: Shield, superAdminOnly: true },
    ],
  },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return false
  })
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const notifRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.getValidationRequests(10)
      setNotifications(data || [])
      setNotifCount((data || []).length)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()

  // Auto-close sidebar on mobile resize, auto-open on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}')
      setIsSuperAdmin(Array.isArray(u?.roles) && u.roles.includes('ROLE_SUPER_ADMIN'))
    } catch {
      setIsSuperAdmin(false)
    }
  }, [])

  const confirmLogout = () => {
    authApiService.logout()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard'
    if (path === '/admin/jobs') return location.pathname.startsWith('/admin/jobs')
    if (path === '/admin/companies') return location.pathname.startsWith('/admin/companies')
    if (path === '/admin/statistics') return location.pathname.startsWith('/admin/statistics')
    return location.pathname === path
  }

  const isCvtheque = location.pathname === '/admin/cvtheque'
  const isJobs = location.pathname.startsWith('/admin/jobs')

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:px-3 focus:py-2 focus:bg-[#226D68] focus:text-white focus:rounded-md">
        Aller au contenu principal
      </a>

      {/* Top bar - Logo, badge, user (aligné dashboard candidat) */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 safe-top">
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[#E8F4F3] text-[#2C2C2C]"
              aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.ico" alt="Yemma Solutions" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/logo-icon.svg' }} />
            </Link>
          </div>

          {/* Badge Administration - centre */}
          <div className="flex-1 min-w-0 mx-1 sm:mx-4 flex items-center justify-center">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-[#E8F4F3]/80 border border-[#226D68]/20">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#226D68] shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-[#2C2C2C] hidden sm:inline">Administration</span>
              <span className="font-semibold text-xs text-[#2C2C2C] sm:hidden">Admin</span>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-1.5 sm:p-2 rounded-xl hover:bg-[#E8F4F3] text-[#6b7280] hover:text-[#226D68] transition-colors"
                title="Demandes de validation"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-0.5 sm:px-1 rounded-full bg-[#e76f51] text-white text-[9px] sm:text-[10px] font-bold leading-none shadow-sm">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  {/* Overlay mobile */}
                  <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setNotifOpen(false)} aria-hidden />
                  <div className="
                    fixed left-3 right-3 top-14 z-50
                    sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80
                    bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden
                  ">
                  <div className="px-4 py-3 bg-[#E8F4F3]/50 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-semibold text-sm text-[#2C2C2C]">Demandes de validation</p>
                    {notifCount > 0 && (
                      <span className="text-xs text-[#226D68] font-medium bg-[#226D68]/10 px-2 py-0.5 rounded-full">{notifCount}</span>
                    )}
                  </div>
                  <div className="max-h-[60vh] sm:max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-[#6b7280]">
                        Aucune demande de validation en attente.
                      </div>
                    ) : (
                      notifications.map((profile) => {
                        const candidateName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Candidat'
                        const requestedAt = profile.validation_requested_at ? new Date(profile.validation_requested_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
                        return (
                          <Link
                            key={profile.id}
                            to={`/admin/review/${profile.id}`}
                            onClick={() => setNotifOpen(false)}
                            className="flex items-start gap-3 px-3 sm:px-4 py-3 hover:bg-[#F4F6F8] transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#e76f51]/15 flex items-center justify-center shrink-0 mt-0.5">
                              <User className="h-4 w-4 text-[#e76f51]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#2C2C2C] font-medium truncate">{candidateName}</p>
                              <p className="text-xs text-[#6b7280] truncate">{profile.email || ''}</p>
                              <p className="text-[11px] text-[#9ca3af] mt-0.5">{requestedAt}</p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-[#9ca3af] shrink-0 mt-1" />
                          </Link>
                        )
                      })
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 bg-[#F4F6F8]/30">
                      <Link
                        to="/admin/validation"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs text-[#226D68] hover:text-[#1a5a55] font-medium"
                      >
                        Voir tous les profils en attente
                      </Link>
                    </div>
                  )}
                </div>
                </>
              )}
            </div>
            <Link to="/contact" className="hidden sm:flex p-2 rounded-xl hover:bg-[#E8F4F3] text-[#6b7280] hover:text-[#226D68] transition-colors" title="Aide">
              <HelpCircle className="h-5 w-5" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-[#E8F4F3] transition-colors"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#226D68] flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0 border-2 border-[#E8F4F3]">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full mt-2 py-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-[#F4F6F8]/50 border-b border-gray-100">
                      <p className="font-semibold text-sm text-[#2C2C2C] truncate">{user?.email || 'Admin'}</p>
                      <p className="text-xs text-[#6b7280] truncate mt-0.5">{isSuperAdmin ? 'Super Admin' : 'Administrateur'}</p>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 rounded-none h-10 px-4" onClick={() => { setUserMenuOpen(false); setLogoutDialogOpen(true) }}>
                      <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar - design aligné dashboard candidat */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 flex flex-col shrink-0
          lg:static lg:translate-x-0
          bg-gradient-to-b from-[#F8FAFC] to-white
          border-r border-gray-200/80
          shadow-[4px_0_24px_-4px_rgba(34,109,104,0.06)]
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* En-tête sidebar - avatar + fermer mobile */}
          <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200/60">
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-white/80 text-[#6b7280] hover:text-[#2C2C2C] transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#226D68] flex items-center justify-center text-white font-semibold text-sm shrink-0 ring-2 ring-white shadow-sm">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#2C2C2C] truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-xs text-[#6b7280] truncate">
                  {isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[#226D68] font-medium">
                      <Shield className="h-3 w-3 shrink-0" />
                      Super Admin
                    </span>
                  ) : (
                    'Administrateur'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation par groupes */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-6 last:mb-0">
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items
                    .filter((item) => !item.superAdminOnly || isSuperAdmin)
                    .map((item) => {
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

          <div className="p-4 border-t border-gray-200/60">
            <Button
              variant="ghost"
              className="w-full justify-start text-[#6b7280] hover:text-red-600 hover:bg-red-50 rounded-xl h-10 px-3"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </aside>

        <LogoutConfirmDialog
          open={logoutDialogOpen}
          onOpenChange={setLogoutDialogOpen}
          onConfirm={confirmLogout}
        />

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />}

        <main id="admin-main" className={`flex-1 min-w-0 flex flex-col overflow-x-hidden ${isCvtheque ? 'overflow-hidden' : 'overflow-y-auto'}`} aria-label="Contenu administration">
          {isCvtheque ? (
            <div className="flex-1 flex flex-col min-h-0 w-full max-w-full min-w-0 px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
              {children}
            </div>
          ) : isJobs ? (
            <div className="flex-1 w-full max-w-full min-w-0 px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24 lg:px-8 lg:pb-8 safe-x">
              {children}
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto min-w-0 px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24 lg:px-8 lg:pb-8 safe-x">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
