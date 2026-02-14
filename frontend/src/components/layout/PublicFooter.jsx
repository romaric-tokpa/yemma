import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

/**
 * Footer public uniforme pour toutes les pages landing (/, /candidat, /contact, /legal/*)
 */
export default function PublicFooter() {
  return (
    <footer className="bg-[#2C2C2C] text-gray-400 py-8">
      <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div>
            <Link to={ROUTES.HOME} className="text-base font-bold">
              <span className="text-[#226D68]">Yemma</span>
              <span className="text-[#e76f51]">-Solutions</span>
            </Link>
            <p className="text-xs text-gray-500 mt-1">Recrutement nouvelle génération</p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Entreprise</h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link to={ROUTES.CONTACT} className="hover:text-[#226D68] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Candidats</h4>
            <ul className="space-y-1 text-xs">
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
          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Légal</h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link to={ROUTES.LEGAL_MENTIONS} className="hover:text-[#226D68] transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to={ROUTES.LEGAL_PRIVACY} className="hover:text-[#226D68] transition-colors">
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
        <div className="border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Yemma. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
