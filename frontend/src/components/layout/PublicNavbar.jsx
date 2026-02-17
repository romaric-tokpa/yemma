import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApiService, candidateApi, documentApi } from '@/services/api'
import { generateAvatarUrl } from '@/utils/photoUtils'

/**
 * Navbar publique uniforme pour toutes les pages landing (/, /candidat, /contact, /legal/*)
 * variant: "light" | "dark" - light pour fond clair, dark pour hero sombre (page Candidat)
 * Affiche la session utilisateur (Dashboard, Déconnexion) si authentifié.
 */
export default function PublicNavbar({ variant = 'light' }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const [user, setUser] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
  const [photoError, setPhotoError] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const u = await authApiService.getCurrentUser()
          setUser(u)
          setUserRoles(u?.roles || [])
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          setUser(null)
          setUserRoles([])
        }
      } catch {
        setIsAuthenticated(false)
        setUser(null)
        setUserRoles([])
      }
    }
    checkAuth()
  }, [])

  // Charger la photo de profil pour les candidats authentifiés
  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!isAuthenticated || !userRoles.includes('ROLE_CANDIDAT')) {
        setProfilePhotoUrl(null)
        setPhotoError(false)
        return
      }
      try {
        const profile = await candidateApi.getMyProfile()
        if (!profile?.id) {
          setProfilePhotoUrl(null)
          return
        }
        let photoUrl = profile.photo_url
        if (photoUrl?.startsWith('/')) {
          const match = photoUrl.match(/\/api\/v1\/documents\/serve\/(\d+)/)
          if (match?.[1]) {
            photoUrl = documentApi.getDocumentServeUrl(parseInt(match[1]))
          }
        }
        if (photoUrl && !photoUrl.includes('ui-avatars.com') && photoUrl.trim() !== '') {
          setProfilePhotoUrl(photoUrl)
          setPhotoError(false)
          return
        }
        const docs = await documentApi.getCandidateDocuments(profile.id)
        const photoDoc = docs
          ?.filter(doc =>
            (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER') && !doc.deleted_at
          )
          ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        if (photoDoc) {
          setProfilePhotoUrl(documentApi.getDocumentServeUrl(photoDoc.id))
          setPhotoError(false)
        } else {
          setProfilePhotoUrl(null)
        }
      } catch {
        setProfilePhotoUrl(null)
      }
    }
    loadProfilePhoto()
  }, [isAuthenticated, userRoles])

  const getDashboardLink = () => {
    if (userRoles.includes('ROLE_CANDIDAT')) return '/candidate/dashboard'
    if (userRoles.includes('ROLE_COMPANY_ADMIN') || userRoles.includes('ROLE_RECRUITER')) return '/company/dashboard'
    if (userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPER_ADMIN')) return '/admin/dashboard'
    return '/login'
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    window.location.href = '/login'
  }

  const displayName = user?.first_name || user?.email?.split('@')[0] || 'Mon espace'
  const defaultAvatar = generateAvatarUrl(user?.first_name || '', user?.last_name || '')
  const displayPhoto = (profilePhotoUrl && !photoError) ? profilePhotoUrl : defaultAvatar

  const isDark = variant === 'dark'
  const navBg = isDark
    ? (scrolled ? 'bg-[#1a1a1a]/95 backdrop-blur-sm' : 'bg-transparent')
    : (scrolled ? 'bg-white shadow-sm' : 'bg-white')
  const logoColor = isDark ? 'text-white' : 'text-[#2C2C2C]'
  const linkBase = isDark ? 'text-white/90 hover:text-white' : 'text-[#2C2C2C] hover:text-[#226D68]'
  const linkActive = isDark ? 'text-white hover:text-[#226D68]' : 'text-[#2C2C2C] hover:text-[#226D68]'
  const linkHint = isDark ? 'text-white/70 hover:text-white' : 'text-[#6b7280] hover:text-[#226D68]'
  const btnOutline = isDark
    ? 'border-white/40 text-white hover:bg-white/10 bg-transparent'
    : 'border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] bg-white'
  const btnPrimary = isDark
    ? 'bg-[#e76f51] hover:bg-[#d45a3f] text-white'
    : 'bg-[#226D68] hover:bg-[#1a5a55] text-white'
  const hintText = isDark ? 'Vous êtes une entreprise ?' : 'Vous êtes un candidat ?'
  const hintLink = isDark ? ROUTES.HOME : ROUTES.CANDIDAT
  const registerRoute = isDark ? ROUTES.REGISTER_CANDIDAT : ROUTES.REGISTER_COMPANY

  const mobileBg = isDark ? 'bg-[#252525] border-white/10' : 'bg-white border-t'
  const mobileLink = isDark ? 'text-white/90' : 'text-[#2C2C2C]'
  const mobileLinkActive = isDark ? 'text-white' : 'text-[#2C2C2C]'
  const mobileBorder = isDark ? 'border-white/10' : 'border-t'
  const iconColor = isDark ? 'text-white' : ''

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <img
              src="/logo-icon.svg"
              alt="Yemma Solutions"
              className="w-9 h-9 object-contain shrink-0"
            />
            <span className={`text-base xs:text-lg font-bold ${logoColor}`}>
              <span className="text-[#226D68]">Yemma</span>
              <span className="text-[#e76f51]">-Solutions</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to={ROUTES.HOME} className={`text-sm font-medium transition-colors ${linkBase}`}>
              Entreprise
            </Link>
            <Link to={ROUTES.CANDIDAT} className={`text-sm font-medium transition-colors ${linkActive}`}>
              Candidat
            </Link>
            <Link to="/offres" className={`text-sm font-medium transition-colors ${linkBase}`}>
              Offres
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} className={`text-sm font-medium transition-colors ${linkBase}`}>
                  Mon espace
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-[#E8F4F3] text-[#2C2C2C]'}`}
                    aria-expanded={userMenuOpen}
                  >
                    <img
                      src={displayPhoto}
                      alt=""
                      className={`w-8 h-8 rounded-full object-cover border-2 shrink-0 ${isDark ? 'border-white/50' : 'border-[#E8F4F3]'}`}
                      onError={() => setPhotoError(true)}
                    />
                    <span className="text-sm font-medium truncate max-w-[120px]">{displayName}</span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
                      <div className={`absolute right-0 top-full mt-1 py-2 min-w-[180px] rounded-lg shadow-lg z-50 ${isDark ? 'bg-[#252525] border border-white/10' : 'bg-white border border-gray-200'}`}>
                        <div className={`px-3 py-2 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                          <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-[#2C2C2C]'}`}>{displayName}</p>
                          {user?.email && <p className={`text-xs truncate ${isDark ? 'text-white/70' : 'text-[#6b7280]'}`}>{user.email}</p>}
                        </div>
                        <Link to={getDashboardLink()} onClick={() => setUserMenuOpen(false)} className={`block px-3 py-2 text-sm hover:bg-[#E8F4F3] ${isDark ? 'text-white hover:bg-white/10' : 'text-[#2C2C2C]'}`}>
                          Mon espace
                        </Link>
                        <button onClick={handleLogout} className={`w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 ${isDark ? 'hover:bg-red-500/20' : ''}`}>
                          <LogOut className="h-4 w-4" /> Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to={hintLink} className={`text-sm transition-colors ${linkHint}`}>
                  {hintText}
                </Link>
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.LOGIN)} className={`h-9 px-4 text-sm font-medium ${btnOutline}`}>
                  Me connecter
                </Button>
                <Button size="sm" onClick={() => navigate(registerRoute)} className={`h-9 px-4 text-sm font-medium ${btnPrimary}`}>
                  M&apos;inscrire
                </Button>
              </>
            )}
          </div>
          <button
            className={`md:hidden p-2 -mr-2 ${iconColor}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className={`md:hidden ${mobileBg} border-t px-4 py-4 space-y-3`}>
          <Link to={ROUTES.HOME} className={`block text-sm py-2 ${mobileLink}`} onClick={() => setMobileMenuOpen(false)}>
            Entreprise
          </Link>
          <Link to={ROUTES.CANDIDAT} className={`block text-sm py-2 ${mobileLinkActive}`} onClick={() => setMobileMenuOpen(false)}>
            Candidat
          </Link>
          <Link to="/offres" className={`block text-sm py-2 ${mobileLink}`} onClick={() => setMobileMenuOpen(false)}>
            Offres
          </Link>
          <div className={`pt-3 ${mobileBorder} flex flex-col gap-2`}>
            {isAuthenticated ? (
              <>
                <div className={`flex items-center gap-3 px-3 py-2 ${isDark ? 'text-white/90' : 'text-[#6b7280]'}`}>
                  <img
                    src={displayPhoto}
                    alt=""
                    className={`w-10 h-10 rounded-full object-cover border-2 shrink-0 ${isDark ? 'border-white/50' : 'border-[#E8F4F3]'}`}
                    onError={() => setPhotoError(true)}
                  />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#2C2C2C]'}`}>{displayName}</p>
                    {user?.email && <p className="text-xs truncate">{user.email}</p>}
                  </div>
                </div>
                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className={isDark ? 'w-full border-white/40 text-white hover:bg-white/10' : 'w-full'}>
                    Mon espace
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => { handleLogout(); setMobileMenuOpen(false) }}>
                  <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className={isDark ? 'w-full border-white/40 text-white hover:bg-white/10' : 'w-full'}
                  onClick={() => {
                    navigate(ROUTES.LOGIN)
                    setMobileMenuOpen(false)
                  }}
                >
                  Me connecter
                </Button>
                <Button
                  size="sm"
                  className={`w-full ${btnPrimary}`}
                  onClick={() => {
                    navigate(registerRoute)
                    setMobileMenuOpen(false)
                  }}
                >
                  M&apos;inscrire
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
