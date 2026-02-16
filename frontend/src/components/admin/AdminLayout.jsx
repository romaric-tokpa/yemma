/**
 * Layout partagé pour les pages admin : header, sidebar, contenu principal.
 * Utilise useLocation pour mettre en surbrillance l'élément actif.
 */
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  User, Clock, CheckCircle, XCircle, BarChart3, Search, Shield, Building,
  LogOut, Menu, X, HelpCircle, LayoutDashboard, FileCheck
} from 'lucide-react'
import { LogoutConfirmDialog } from '@/components/common/LogoutConfirmDialog'
import { authApiService } from '@/services/api'

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  })()

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

  const isActive = (path, section) => {
    if (section) {
      return location.pathname === path && location.state?.section === section
    }
    return location.pathname === path
  }

  const isCvtheque = location.pathname === '/admin/cvtheque'

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:px-3 focus:py-2 focus:bg-[#226D68] focus:text-white focus:rounded-md">
        Aller au contenu principal
      </a>

      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 safe-top">
        <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/favicon.ico" alt="Yemma Solutions" className="h-8 w-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/logo-icon.svg' }} />
          </Link>
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E8F4F3]/80">
              <Shield className="h-5 w-5 text-[#226D68]" />
              <span className="font-semibold text-sm text-[#2C2C2C]">Administration</span>
            </div>
          </div>
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
                <div className="w-9 h-9 rounded-full bg-[#226D68] flex items-center justify-center text-white font-semibold text-sm shrink-0">
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
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col
          bg-white border-r border-gray-100 shadow-sm
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 border-b border-gray-100">
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 text-[#2C2C2C]">
              <X className="h-5 w-5" />
            </button>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mt-4 mb-3">Navigation</p>
            <nav className="space-y-0.5">
              <Link
                to="/admin/dashboard"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                  location.pathname === '/admin/dashboard' ? 'bg-[#E8F4F3] text-[#226D68]' : 'text-[#2C2C2C] hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Accueil
              </Link>
              <Link
                to="/admin/validation"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                  isActive('/admin/validation') ? 'bg-[#E8F4F3] text-[#226D68]' : 'text-[#2C2C2C] hover:bg-gray-50'
                }`}
              >
                <FileCheck className="h-4 w-4 shrink-0" />
                Validation
              </Link>
              <Link
                to="/admin/statistics"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                  location.pathname === '/admin/statistics' ? 'bg-[#E8F4F3] text-[#226D68]' : 'text-[#2C2C2C] hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                Statistiques
              </Link>
              <Link
                to="/admin/cvtheque"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                  location.pathname === '/admin/cvtheque' ? 'bg-[#E8F4F3] text-[#226D68]' : 'text-[#2C2C2C] hover:bg-gray-50'
                }`}
              >
                <Search className="h-4 w-4 shrink-0" />
                CVthèque
              </Link>
              <Link
                to="/admin/companies"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                  location.pathname === '/admin/companies' ? 'bg-[#E8F4F3] text-[#226D68]' : 'text-[#2C2C2C] hover:bg-gray-50'
                }`}
              >
                <Building className="h-4 w-4 shrink-0" />
                Entreprises
              </Link>
              {isSuperAdmin && (
                <Link
                  to="/admin/invitations"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium text-[#2C2C2C] hover:bg-gray-50 transition-colors"
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  Invitations Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex-1" />
          <div className="p-4 border-t border-gray-100">
            <Button
              variant="ghost"
              className="w-full justify-start text-[#6b7280] hover:text-[#e76f51] hover:bg-[#e76f51]/5"
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

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        {!sidebarOpen && (
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)} className="fixed bottom-4 left-4 z-50 lg:hidden h-12 w-12 rounded-full shadow-lg bg-white border-[#226D68]">
            <Menu className="h-5 w-5 text-[#226D68]" />
          </Button>
        )}

        <main id="admin-main" className={`flex-1 min-w-0 bg-[#F4F6F8] flex flex-col ${isCvtheque ? 'overflow-hidden' : 'overflow-y-auto'}`} aria-label="Contenu administration">
          {isCvtheque ? (
            <div className="flex-1 flex flex-col min-h-0 w-full max-w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
              {children}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-24 lg:px-8 lg:pb-8 safe-x">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
