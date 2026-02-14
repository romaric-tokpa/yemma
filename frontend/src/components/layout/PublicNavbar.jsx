import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Navbar publique uniforme pour toutes les pages landing (/, /candidat, /contact, /legal/*)
 * variant: "light" | "dark" - light pour fond clair, dark pour hero sombre (page Candidat)
 */
export default function PublicNavbar({ variant = 'light' }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
              src="/logo-search.png"
              alt="Yemma Solutions - Recherche"
              className="w-9 h-9 object-contain"
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
            <Link to={ROUTES.CONTACT} className={`text-sm font-medium transition-colors ${linkBase}`}>
              Contactez-nous !
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link to={hintLink} className={`text-sm transition-colors ${linkHint}`}>
              {hintText}
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.LOGIN)}
              className={`h-9 px-4 text-sm font-medium ${btnOutline}`}
            >
              Me connecter
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(registerRoute)}
              className={`h-9 px-4 text-sm font-medium ${btnPrimary}`}
            >
              M&apos;inscrire
            </Button>
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
          <Link to={ROUTES.CONTACT} className={`block text-sm py-2 ${mobileLink}`} onClick={() => setMobileMenuOpen(false)}>
            Contactez-nous !
          </Link>
          <div className={`pt-3 ${mobileBorder} flex flex-col gap-2`}>
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
          </div>
        </div>
      )}
    </nav>
  )
}
