import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Layout compact pour les pages publiques secondaires (HowItWorks, Contact, Légal)
 * Aligné sur la charte graphique Yemma : #226D68, #e76f51, #F4F6F8, #2C2C2C
 */
export default function PublicPageLayout({ children, title, subtitle, badge }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav compacte */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-12 md:h-14">
            <Link to="/" className="text-lg font-bold">
              <span className="text-[#226D68]">Yemma</span>
              <span className="text-[#e76f51]">-Solutions</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/" className="text-sm font-medium text-[#2C2C2C] hover:text-[#226D68] transition-colors">
                Accueil
              </Link>
              <Link to="/how-it-works" className="text-sm font-medium text-[#2C2C2C] hover:text-[#226D68] transition-colors">
                Comment ça marche
              </Link>
              <Link to="/contact" className="text-sm font-medium text-[#2C2C2C] hover:text-[#226D68] transition-colors">
                Contact
              </Link>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}
                className="h-8 text-sm border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]">
                Connexion
              </Button>
              <Button size="sm" onClick={() => navigate('/register/company')}
                className="h-8 text-sm bg-[#226D68] hover:bg-[#1a5a55] text-white">
                Essai gratuit
              </Button>
            </div>
            <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t px-4 py-3 space-y-2">
            <Link to="/" className="block text-sm py-2 text-[#2C2C2C]" onClick={() => setMobileMenuOpen(false)}>Accueil</Link>
            <Link to="/how-it-works" className="block text-sm py-2 text-[#2C2C2C]" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</Link>
            <Link to="/contact" className="block text-sm py-2 text-[#2C2C2C]" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}>Connexion</Button>
              <Button size="sm" className="flex-1 bg-[#226D68] hover:bg-[#1a5a55]" onClick={() => { navigate('/register/company'); setMobileMenuOpen(false) }}>Essai gratuit</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero compact */}
      {(title || subtitle || badge) && (
        <section className="pt-16 md:pt-20 pb-6 md:pb-8 bg-[#F4F6F8]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {badge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F4F3] text-[#226D68] text-xs font-semibold mb-4">
                {badge}
              </div>
            )}
            {title && (
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-[#6b7280] max-w-xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        </section>
      )}

      <main className="flex-1">
        {children}
      </main>

      {/* Footer compact */}
      <footer className="bg-[#2C2C2C] text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <Link to="/" className="text-base font-bold">
                <span className="text-[#226D68]">Yemma</span>
                <span className="text-[#e76f51]">-Solutions</span>
              </Link>
              <p className="text-xs text-gray-500 mt-1">Recrutement nouvelle génération</p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Entreprise</h4>
              <ul className="space-y-1 text-xs">
                <li><Link to="/how-it-works" className="hover:text-[#226D68] transition-colors">Comment ça marche</Link></li>
                <li><Link to="/contact" className="hover:text-[#226D68] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Candidats</h4>
              <ul className="space-y-1 text-xs">
                <li><Link to="/register/candidat" className="hover:text-[#226D68] transition-colors">Créer un compte</Link></li>
                <li><Link to="/login" className="hover:text-[#226D68] transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Légal</h4>
              <ul className="space-y-1 text-xs">
                <li><Link to="/legal/mentions" className="hover:text-[#226D68] transition-colors">Mentions légales</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-[#226D68] transition-colors">Confidentialité</Link></li>
                <li><Link to="/legal/terms" className="hover:text-[#226D68] transition-colors">CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Yemma. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
