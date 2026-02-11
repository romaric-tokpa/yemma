import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Shield, User, Clock, CheckCircle, XCircle, Building, ChevronDown, ChevronRight,
  BarChart3, Menu, X, LogOut, UserCheck, CreditCard
} from 'lucide-react'

/**
 * Sidebar partagée pour le dashboard admin et la page invitations.
 * @param {object} props
 * @param {'dashboard'|'invitations'} props.mode - Contexte d'affichage
 * @param {string} props.activeSection - Section active (candidates|statistics|admin-invitations|companies)
 * @param {string} [props.activeSubsection] - Sous-section (list|recruiters|subscriptions)
 * @param {string} [props.selectedStatus] - Statut candidats (SUBMITTED|VALIDATED|REJECTED)
 * @param {boolean} [props.companiesSubmenuOpen]
 * @param {function} [props.onSectionClick] - Pour mode dashboard
 * @param {function} [props.onSubsectionClick]
 * @param {function} [props.onStatusClick]
 * @param {boolean} props.sidebarOpen
 * @param {function} props.setSidebarOpen
 * @param {boolean} props.isSuperAdmin
 * @param {function} props.onLogout
 */
export default function AdminSidebar({
  mode,
  activeSection,
  activeSubsection = null,
  selectedStatus = 'SUBMITTED',
  companiesSubmenuOpen = false,
  onSectionClick,
  onSubsectionClick,
  onStatusClick,
  sidebarOpen,
  setSidebarOpen,
  isSuperAdmin,
  onLogout,
}) {
  const btn = (section, label, Icon, isActive) => {
    const active = activeSection === section
    const className = `w-full justify-start h-8 text-xs px-2 mb-0.5 ${active ? 'bg-[#226D68] hover:bg-[#1a5a55] text-white' : 'text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]'}`
    if (mode === 'invitations' && section !== 'admin-invitations') {
      return (
        <Link to="/admin/dashboard">
          <Button variant="ghost" className={className}>
            <Icon className="w-3.5 h-3.5 mr-2 shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </Button>
        </Link>
      )
    }
    if (section === 'admin-invitations') {
      const invActive = active || mode === 'invitations'
      const invClassName = `w-full justify-start h-8 text-xs px-2 mb-0.5 ${invActive ? 'bg-[#226D68] hover:bg-[#1a5a55] text-white' : 'text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]'}`
      return (
        <Link to="/admin/invitations">
          <Button variant="ghost" className={invClassName}>
            <Shield className="w-3.5 h-3.5 mr-2 shrink-0" />
            {sidebarOpen && <span className="truncate">Invitations Admin</span>}
          </Button>
        </Link>
      )
    }
    return (
      <Button
        variant="ghost"
        className={className}
        onClick={() => onSectionClick?.(section)}
      >
        <Icon className="w-3.5 h-3.5 mr-2 shrink-0" />
        {sidebarOpen && <span className="truncate">{label}</span>}
      </Button>
    )
  }

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-50
      bg-white border-r border-border shadow-sm
      transition-all duration-300 ease-in-out
      ${sidebarOpen ? 'w-52 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-14'}
      flex flex-col
    `}>
      <div className="h-11 border-b border-border flex items-center justify-between px-2.5 bg-[#226D68]/5">
        {sidebarOpen && (
          <Link to="/admin/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-[#226D68] rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-anthracite truncate">Admin</span>
          </Link>
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
          {mode === 'dashboard' ? (
            btn('candidates', 'Candidats', User, activeSection === 'candidates')
          ) : (
            btn('candidates', 'Candidats', User, false)
          )}
          {mode === 'dashboard' && activeSection === 'candidates' && sidebarOpen && (
            <div className="ml-5 pl-2 border-l border-[#226D68]/20 space-y-0.5 mt-1">
              {['SUBMITTED', 'VALIDATED', 'REJECTED'].map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-7 text-xs px-2 ${selectedStatus === status ? 'bg-[#226D68]/10 text-[#1a5a55] font-medium' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                  onClick={() => onStatusClick?.(status)}
                >
                  {status === 'SUBMITTED' && <Clock className="w-3 h-3 mr-2 shrink-0" />}
                  {status === 'VALIDATED' && <CheckCircle className="w-3 h-3 mr-2 shrink-0" />}
                  {status === 'REJECTED' && <XCircle className="w-3 h-3 mr-2 shrink-0" />}
                  {status === 'SUBMITTED' ? 'Soumis' : status === 'VALIDATED' ? 'Validés' : 'Rejetés'}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div>{btn('statistics', 'Statistiques', BarChart3, activeSection === 'statistics')}</div>

        {isSuperAdmin && (
          <>
            <Separator className="my-2" />
            <div>{btn('admin-invitations', 'Invitations Admin', Shield, activeSection === 'admin-invitations' || mode === 'invitations')}</div>
          </>
        )}

        <Separator className="my-2" />

        <div>
          {mode === 'dashboard' ? (
            <Button
              variant={activeSection === 'companies' ? 'default' : 'ghost'}
              className={`w-full justify-between h-8 text-xs px-2 ${activeSection === 'companies' ? 'bg-[#226D68] hover:bg-[#1a5a55] text-white' : 'text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]'}`}
              onClick={() => onSectionClick?.('companies')}
            >
              <div className="min-w-0 flex items-center">
                <Building className="w-3.5 h-3.5 mr-2 shrink-0" />
                {sidebarOpen && <span className="truncate">Entreprises</span>}
              </div>
              {sidebarOpen && (companiesSubmenuOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />)}
            </Button>
          ) : (
            <Link to="/admin/dashboard">
              <Button variant="ghost" className="w-full justify-between h-8 text-xs px-2 text-gray-anthracite hover:bg-[#226D68]/10 hover:text-[#226D68]">
                <div className="min-w-0 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-2 shrink-0" />
                  {sidebarOpen && <span className="truncate">Entreprises</span>}
                </div>
              </Button>
            </Link>
          )}
          {mode === 'dashboard' && activeSection === 'companies' && companiesSubmenuOpen && sidebarOpen && (
            <div className="ml-5 pl-2 border-l border-[#226D68]/20 space-y-0.5 mt-1">
              {[
                { id: 'list', label: 'Liste', Icon: Building },
                { id: 'recruiters', label: 'Recruteurs', Icon: UserCheck },
                { id: 'subscriptions', label: 'Abonnements', Icon: CreditCard },
              ].map(({ id, label, Icon }) => (
                <Button
                  key={id}
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start h-7 text-xs px-2 ${activeSubsection === id ? 'bg-[#226D68]/10 text-[#1a5a55] font-medium' : 'text-muted-foreground hover:text-gray-anthracite'}`}
                  onClick={() => onSubsectionClick?.(id)}
                >
                  <Icon className="w-3 h-3 mr-2 shrink-0" />
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-border p-2 bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-[#e76f51] hover:bg-[#e76f51]/5 h-8 text-xs px-2"
          onClick={onLogout}
        >
          <LogOut className="w-3.5 h-3.5 mr-2 shrink-0" />
          {sidebarOpen && <span>Déconnexion</span>}
        </Button>
      </div>
    </aside>
  )
}
