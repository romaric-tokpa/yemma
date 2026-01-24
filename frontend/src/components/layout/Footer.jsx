import { Link } from 'react-router-dom'
import { FileText, Linkedin, Twitter, Mail, Phone } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    candidat: [
      { label: 'Créer mon profil', href: '/register/candidat' },
    ],
    recruteur: [
      { label: 'Accéder à la CVthèque', href: '/register/company' },
    ],
    entreprise: [
      { label: 'Blog', href: '/blog' },
      { label: 'Carrières', href: '/careers' },
    ],
    legal: [
      { label: 'Mentions légales', href: '/legal/mentions' },
      { label: 'CGU', href: '/legal/terms' },
      { label: 'Politique de confidentialité', href: '/legal/privacy' },
      { label: 'RGPD', href: '/legal/rgpd' },
    ],
  }

  return (
    <footer className="bg-blue-deep text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#226D68] rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold font-heading">Yemma Solutions</span>
            </Link>
            <p className="text-sm text-white/80 mb-4 leading-relaxed">
              Valoriser le capital humain dans un cadre crédible et international. 
              Connectez des candidats validés avec des entreprises de confiance.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://linkedin.com/company/yemma-solutions" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-[#226D68] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/yemmasolutions" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-[#226D68] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="mailto:contact@yemma-solutions.com" className="text-white/80 hover:text-[#226D68] transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Candidat */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Candidat</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {footerLinks.candidat.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-[#226D68] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recruteur */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Recruteur</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {footerLinks.recruteur.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-[#226D68] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">Entreprise</h4>
            <ul className="space-y-2 text-sm text-white/80">
              {footerLinks.entreprise.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-[#226D68] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col md:flex-row gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:contact@yemma-solutions.com" className="hover:text-[#226D68] transition-colors">
                  contact@yemma-solutions.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+33123456789" className="hover:text-[#226D68] transition-colors">
                  +33 1 23 45 67 89
                </a>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              {footerLinks.legal.map((link) => (
                <Link key={link.href} to={link.href} className="hover:text-[#226D68] transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/70">
          <p>&copy; {currentYear} Yemma Solutions. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
