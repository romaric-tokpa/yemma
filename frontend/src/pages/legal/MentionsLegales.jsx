import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, ArrowRight, Mail, Building, Globe, Shield, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function MentionsLegales() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const primaryColor = '#226D68'
  const secondaryColor = '#e76f51'
  const primaryLight = '#E8F4F3'
  const secondaryLight = '#FDF2F0'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl font-bold">
                <span style={{ color: primaryColor }}>Yemma</span>
                <span style={{ color: secondaryColor }}>-Solutions</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm text-gray-700 transition-colors font-medium" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                Accueil
              </Link>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-sm h-9"
                style={{ borderColor: primaryColor, color: primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryLight }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Connexion
              </Button>
              <Button
                onClick={() => navigate('/register/company')}
                className="text-white text-sm h-9"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}
              >
                Essai gratuit
              </Button>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-3 space-y-2">
              <Link to="/" className="block text-sm text-gray-700 py-2 transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'} onClick={() => setMobileMenuOpen(false)}>Accueil</Link>
              <div className="pt-2 space-y-2 border-t">
                <Button variant="outline" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="w-full text-sm h-9" style={{ borderColor: primaryColor, color: primaryColor }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryLight }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>Connexion</Button>
                <Button onClick={() => { navigate('/register/company'); setMobileMenuOpen(false) }} className="w-full text-white text-sm h-9" style={{ backgroundColor: primaryColor }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}>Essai gratuit</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section Compact */}
      <section className="relative pt-20 md:pt-24 pb-6 md:pb-8 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryLight} 0%, #ffffff 50%, ${secondaryLight} 100%)` }}>
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ backgroundColor: secondaryColor }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: primaryLight }}>
              <FileText className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-xs font-semibold" style={{ color: primaryColor }}>Informations légales</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight" style={{ color: '#1a293e' }}>
              Mentions légales
            </h1>
            <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto">
              Identité de l&apos;éditeur, hébergeur et informations relatives à l&apos;utilisation du site.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section Compact */}
      <section className="py-6 md:py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">

              {/* Éditeur */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryLight }}>
                      <Building className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                        1. Éditeur du site
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        Le site <strong>yemma-solutions.com</strong> (ci-après «&nbsp;le Site&nbsp;») est édité par&nbsp;:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold mb-1.5 text-sm" style={{ color: primaryColor }}>Yemma Solutions</p>
                        <p className="text-xs text-gray-700 mb-1">Société par actions simplifiée (SAS) – Acte uniforme OHADA</p>
                        <p className="text-xs text-gray-700 mb-1">Siège social&nbsp;: Abidjan, Côte d&apos;Ivoire</p>
                        <p className="text-xs text-gray-700 mb-1">Capital social&nbsp;: [À compléter]</p>
                        <p className="text-xs text-gray-700 mb-1">RCCM&nbsp;: [À compléter – ex. CI-ABJ-XX-XXXX-BXX-XXXXX]</p>
                        <p className="text-xs text-gray-700 mb-2">NIU / IDU&nbsp;: [À compléter]</p>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <Mail className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                          <a href="mailto:contact@yemma-solutions.com" className="text-xs font-medium hover:underline" style={{ color: primaryColor }}>
                            contact@yemma-solutions.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Directeur de la publication */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                    2. Directeur de la publication
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Le directeur de la publication du Site est [Nom du responsable], en qualité de [fonction].
                  </p>
                </CardContent>
              </Card>

              {/* Hébergeur */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryLight }}>
                      <Globe className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                        3. Hébergeur
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        Le Site est hébergé par&nbsp;:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold mb-1.5 text-sm" style={{ color: primaryColor }}>[Nom de l&apos;hébergeur]</p>
                        <p className="text-xs text-gray-700 mb-1">[Adresse du siège]</p>
                        <p className="text-xs text-gray-700">[Coordonnées]</p>
                      </div>
                      <p className="text-gray-600 text-xs mt-3">
                        En cas de difficulté d&apos;accès au Site ou de contenu illicite, vous pouvez contacter l&apos;hébergeur aux coordonnées ci-dessus.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Propriété intellectuelle */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                    4. Propriété intellectuelle
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    L&apos;ensemble du Site (structure, textes, logos, visuels, bases de données, logiciels, etc.) est protégé par le droit d&apos;auteur, le droit des marques et le droit des bases de données, en vigueur en Côte d&apos;Ivoire et dans l&apos;espace OHADA. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation préalable écrite de Yemma Solutions est interdite et constitue une contrefaçon susceptible d&apos;engager la responsabilité civile et pénale de son auteur.
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    La marque «&nbsp;Yemma&nbsp;» et le logo Yemma Solutions sont des signes distinctifs protégés. Leur utilisation sans autorisation est prohibée.
                  </p>
                </CardContent>
              </Card>

              {/* Données personnelles */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryLight }}>
                      <Shield className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                        5. Données personnelles et cookies
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        Les données à caractère personnel collectées via le Site sont traitées conformément à la <strong>loi n°&nbsp;2013-450 du 19&nbsp;juin 2013</strong> relative à la protection des données à caractère personnel en Côte d&apos;Ivoire. Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement et d&apos;opposition. Vous pouvez introduire une réclamation auprès de l&apos;ARTCI (Autorité de régulation des télécommunications/TIC de Côte d&apos;Ivoire), autorité compétente en matière de protection des données.
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed mb-2">
                        Pour plus d&apos;informations&nbsp;:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700 mb-3">
                        <li>
                          <Link to="/legal/privacy" className="font-medium hover:underline" style={{ color: primaryColor }}>
                            Politique de confidentialité
                          </Link>
                        </li>
                        <li>
                          <Link to="/legal/rgpd" className="font-medium hover:underline" style={{ color: primaryColor }}>
                            Protection des données personnelles
                          </Link>
                        </li>
                      </ul>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Les cookies et traceurs utilisés sur le Site permettent d&apos;assurer son fonctionnement, d&apos;analyser l&apos;audience et, le cas échéant, de personnaliser les contenus. Vous pouvez gérer vos préférences via les paramètres de votre navigateur ou via les mécanismes prévus sur le Site.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Limitation de responsabilité */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                    6. Limitation de responsabilité
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    Yemma Solutions s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées sur le Site. Toutefois, Yemma Solutions ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des informations. L&apos;utilisation du Site et des contenus qui y sont proposés s&apos;effectue sous la seule responsabilité de l&apos;utilisateur.
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Yemma Solutions décline toute responsabilité&nbsp;: (i)&nbsp;en cas d&apos;interruption ou de dysfonctionnement du Site&nbsp;; (ii)&nbsp;en cas d&apos;accès illicite ou d&apos;altération des données des utilisateurs&nbsp;; (iii)&nbsp;pour les contenus publiés par des tiers (liens, espaces utilisateurs, etc.) ou pour les dommages résultant de l&apos;utilisation de sites tiers accessibles via des liens depuis le Site.
                  </p>
                </CardContent>
              </Card>

              {/* Liens hypertextes */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    7. Liens hypertextes
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Tout lien vers le Site devra faire l&apos;objet d&apos;une autorisation préalable de Yemma Solutions. Les liens vers des sites externes sont fournis à titre indicatif&nbsp;; Yemma Solutions n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
                  </p>
                </CardContent>
              </Card>

              {/* Droit applicable */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                    8. Droit applicable et juridiction compétente
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Les présentes mentions légales et l&apos;utilisation du Site sont régies par le <strong>droit ivoirien</strong>. En cas de litige, et à défaut de résolution amiable, les <strong>tribunaux compétents de Côte d&apos;Ivoire</strong> (notamment le Tribunal de commerce d&apos;Abidjan pour les litiges commerciaux) seront seuls compétents.
                  </p>
                </CardContent>
              </Card>

              {/* Dernière mise à jour */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    9. Dernière mise à jour
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Dernière mise à jour des mentions légales&nbsp;: [Date à compléter]. Yemma Solutions se réserve le droit de modifier les présentes mentions à tout moment. Il est recommandé de les consulter régulièrement.
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </section>

      {/* CTA Section Compact */}
      <section className="py-6 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <a href="mailto:contact@yemma-solutions.com">
                <Button
                  className="text-white w-full sm:w-auto h-10 text-sm"
                  style={{ backgroundColor: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}
                >
                  Nous contacter
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <Link to="/legal/terms">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto h-10 text-sm"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryLight }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Consulter les CGU
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-bold">
                  <span style={{ color: primaryColor }}>Yemma</span>
                  <span style={{ color: secondaryColor }}>-Solutions</span>
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Recrutement nouvelle génération
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2 text-sm">Entreprise</h4>
              <ul className="space-y-1.5 text-xs">
                <li><Link to="/" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Accueil</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2 text-sm">Candidats</h4>
              <ul className="space-y-1.5 text-xs">
                <li><Link to="/register/candidat" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Créer un compte</Link></li>
                <li><Link to="/login" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Se connecter</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2 text-sm">Légal</h4>
              <ul className="space-y-1.5 text-xs">
                <li><Link to="/legal/mentions" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Mentions légales</Link></li>
                <li><Link to="/legal/privacy" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Confidentialité</Link></li>
                <li><Link to="/legal/terms" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-400">
            <p>&copy; {new Date().getFullYear()} Yemma. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
