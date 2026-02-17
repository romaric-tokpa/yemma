import { Link } from 'react-router-dom'
import { Linkedin, Briefcase, User, Building2, FileText, Shield } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

const LINKEDIN_URL = 'https://www.linkedin.com/company/yemma-solutions/'

/**
 * Footer public uniforme pour toutes les pages landing (/, /candidat, /contact, /legal/*)
 */
export default function PublicFooter() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bloc principal */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <Link to={ROUTES.HOME} className="inline-block text-xl font-bold tracking-tight">
                <span className="text-[#226D68]">Yemma</span>
                <span className="text-[#e76f51]">-Solutions</span>
              </Link>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-xs">
                Recrutement nouvelle génération. Candidats vérifiés, recherche intelligente, gain de temps.
              </p>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-gray-400 hover:text-[#226D68] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                Suivez-nous sur LinkedIn
              </a>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#226D68]" />
                Entreprise
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to={ROUTES.HOME} className="hover:text-[#226D68] transition-colors">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.CONTACT} className="hover:text-[#226D68] transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Candidats */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#226D68]" />
                Candidats
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to={ROUTES.CANDIDAT} className="hover:text-[#226D68] transition-colors">
                    Espace candidat
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.JOB_OFFERS} className="hover:text-[#226D68] transition-colors flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Offres d&apos;emploi
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.REGISTER_CANDIDAT} className="hover:text-[#226D68] transition-colors">
                    Créer un compte
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.LOGIN} className="hover:text-[#226D68] transition-colors">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#226D68]" />
                Légal
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to={ROUTES.LEGAL_MENTIONS} className="hover:text-[#226D68] transition-colors">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.LEGAL_PRIVACY} className="hover:text-[#226D68] transition-colors flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.LEGAL_TERMS} className="hover:text-[#226D68] transition-colors">
                    CGU
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Barre bas */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Yemma Solutions. Tous droits réservés.
            </p>
            <p className="text-xs text-gray-600">
              Recrutement simplifié, candidats qualifiés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
