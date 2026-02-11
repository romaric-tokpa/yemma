import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { authApiService } from '@/services/api'

export default function Navbar({ variant = 'default' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRoles, setUserRoles] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const user = await authApiService.getCurrentUser()
          setUserRoles(user.roles || [])
          setIsAuthenticated(true)
        }
      } catch (error) {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  const getDashboardLink = () => {
    if (userRoles.includes('ROLE_CANDIDAT')) return '/candidate/dashboard'
    if (userRoles.includes('ROLE_COMPANY_ADMIN') || userRoles.includes('ROLE_RECRUITER')) return '/company/dashboard'
    if (userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPER_ADMIN')) return '/admin/dashboard'
    return '/login'
  }

  const navLinks = [
    { label: 'Accueil', href: '/' },
  ]

  return (
    <header className={`sticky top-0 z-50 w-full border-b safe-top ${
      variant === 'transparent' 
        ? 'bg-white/80 backdrop-blur-md border-transparent' 
        : 'bg-white border-gray-200'
    } shadow-sm`}>
      <nav className="container mx-auto px-4 safe-x">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="group">
            <span className="text-xl font-bold text-blue-deep font-heading transition-colors group-hover:text-[#226D68]">
              Yemma-Solutions
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-deep hover:bg-gray-50 rounded-md transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-blue-deep">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    localStorage.removeItem('auth_token')
                    window.location.href = '/login'
                  }}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-blue-deep">
                    Connexion
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="sm" className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
                    Commencer
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-3 rounded-md text-gray-700 hover:bg-gray-100 min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center touch-target-min"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Ouvrir le menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 safe-x">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-3 py-3 text-sm font-medium text-gray-700 hover:text-blue-deep hover:bg-gray-50 rounded-md transition-colors min-h-[2.75rem] flex items-center touch-target-min"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 mt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link to={getDashboardLink()}>
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        localStorage.removeItem('auth_token')
                        window.location.href = '/login'
                      }}
                    >
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                        Connexion
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button size="sm" className="w-full bg-[#226D68] hover:bg-[#1a5a55] text-white" onClick={() => setIsOpen(false)}>
                        Commencer
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
