import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileCheck, ArrowRight, Mail, Users, Shield, AlertTriangle, Scale, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function CGU() {
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
              <FileCheck className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-xs font-semibold" style={{ color: primaryColor }}>Conditions d&apos;utilisation</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight" style={{ color: '#1a293e' }}>
              Conditions générales
              <br />
              d&apos;utilisation
            </h1>
            <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto">
              Les règles d&apos;utilisation de la plateforme Yemma Solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section Compact */}
      <section className="py-6 md:py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">

              {/* Objet et acceptation */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    1. Objet et acceptation
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    Les présentes Conditions Générales d&apos;Utilisation (ci-après «&nbsp;CGU&nbsp;») régissent l&apos;accès et l&apos;utilisation de la plateforme <strong>Yemma Solutions</strong> (ci-après «&nbsp;la Plateforme&nbsp;» ou «&nbsp;le Site&nbsp;»), accessible à l&apos;adresse yemma-solutions.com, ainsi que des services associés.
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    En créant un compte ou en utilisant la Plateforme, vous acceptez sans réserve les présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser nos services. L&apos;éditeur de la Plateforme est <strong>Yemma Solutions</strong>, dont les coordonnées figurent dans les{' '}
                    <Link to="/legal/mentions" className="font-medium hover:underline" style={{ color: primaryColor }}>mentions légales</Link>.
                  </p>
                </CardContent>
              </Card>

              {/* Description des services */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                      <Users className="w-4 h-4" style={{ color: secondaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                        2. Description des services
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        Yemma Solutions propose une plateforme de mise en relation entre <strong>candidats</strong> et <strong>entreprises/recruteurs</strong>&nbsp;:
                      </p>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 mb-3">
                        <li><strong>Candidats&nbsp;:</strong> création d&apos;un profil professionnel, validation du profil par nos experts RH (entretien, compte-rendu), visibilité auprès des recruteurs inscrits, réception d&apos;offres et de contacts.</li>
                        <li><strong>Recruteurs / Entreprises&nbsp;:</strong> accès à une CVthèque de profils validés, outils de recherche et de filtrage, consultation des comptes-rendus RH, gestion d&apos;équipe de recruteurs, contact des candidats.</li>
                      </ul>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Les fonctionnalités détaillées, les offres tarifaires et les modalités d&apos;abonnement sont décrites sur le Site (pages Tarifs, FAQ, etc.). Yemma se réserve le droit de faire évoluer les services dans le respect des présentes CGU.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inscription et compte */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    3. Inscription et compte utilisateur
                  </h2>
                  <div className="space-y-2 text-xs">
                    <p className="text-gray-700 leading-relaxed">
                      <strong>3.1. Création de compte</strong> — Pour accéder à certains services, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités réalisées depuis votre compte.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>3.2. Comptes candidats</strong> — L&apos;inscription en tant que candidat est gratuite. Après création du profil, un processus de validation (entretien RH) peut être proposé. L&apos;accès à la CVthèque et la visibilité auprès des recruteurs peuvent être conditionnés à cette validation.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>3.3. Comptes recruteurs / entreprises</strong> — L&apos;accès à la CVthèque et aux outils recruteur est soumis à une inscription et, selon les offres, à un abonnement payant. Les conditions financières sont précisées dans les Conditions Générales de Vente (CGV) et sur la page Tarifs.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>3.4. Exactitude des informations</strong> — Vous vous engagez à maintenir des informations exactes et complètes. Toute fausse déclaration ou utilisation frauduleuse peut entraîner la suspension ou la résiliation de votre compte.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Obligations des utilisateurs */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                      <AlertTriangle className="w-4 h-4" style={{ color: secondaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                        4. Obligations des utilisateurs
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        En utilisant la Plateforme, vous vous engagez à&nbsp;:
                      </p>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 mb-3">
                        <li>Utiliser les services de manière loyale, conforme à leur finalité et aux présentes CGU.</li>
                        <li>Ne pas transmettre de contenus illicites, diffamatoires, discriminatoires, ou portant atteinte aux droits de tiers.</li>
                        <li>Ne pas usurper l&apos;identité d&apos;une personne physique ou morale.</li>
                        <li>Ne pas tenter d&apos;accéder aux comptes ou données d&apos;autrui, ni de perturber le fonctionnement du Site.</li>
                        <li>Ne pas utiliser de robots, scripts ou outils automatisés non autorisés pour extraire des données ou solliciter la Plateforme.</li>
                        <li>Respecter les droits de propriété intellectuelle de Yemma Solutions et des tiers.</li>
                      </ul>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-700 mb-1.5">
                          <strong style={{ color: secondaryColor }}>Candidats&nbsp;:</strong> vous garantissez l&apos;exactitude des informations de votre profil (CV, expériences, compétences). Vous vous engagez à participer de bonne foi au processus de validation si vous y souscrivez.
                        </p>
                        <p className="text-xs text-gray-700">
                          <strong style={{ color: secondaryColor }}>Recruteurs&nbsp;:</strong> vous vous engagez à utiliser les données des candidats uniquement à des fins de recrutement, dans le respect du droit du travail et de la protection des données personnelles. Toute réutilisation ou revente des données est interdite.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Propriété intellectuelle */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    5. Propriété intellectuelle
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    La Plateforme, son architecture, les textes, graphismes, logos, bases de données et logiciels sont protégés par le droit d&apos;auteur et le droit des marques. Yemma Solutions vous concède un droit d&apos;utilisation personnelle, non exclusif et non transférable, limité à l&apos;accès aux services. Toute reproduction, représentation ou exploitation non autorisée est interdite.
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Les contenus que vous publiez (CV, descriptions, etc.) restent votre propriété. En les publiant, vous accordez à Yemma Solutions une licence mondiale, non exclusive et sublicenciable, pour les utiliser, afficher et communiquer aux recruteurs dans le cadre du service, conformément à notre{' '}
                    <Link to="/legal/privacy" className="font-medium hover:underline" style={{ color: primaryColor }}>politique de confidentialité</Link>.
                  </p>
                </CardContent>
              </Card>

              {/* Données personnelles */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                      <Shield className="w-4 h-4" style={{ color: secondaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                        6. Données personnelles
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Le traitement de vos données personnelles est décrit dans notre{' '}
                        <Link to="/legal/privacy" className="font-medium hover:underline" style={{ color: secondaryColor }}>politique de confidentialité</Link>, conforme à la loi n°&nbsp;2013-450 du 19&nbsp;juin 2013 relative à la protection des données à caractère personnel en Côte d&apos;Ivoire. En acceptant les CGU, vous confirmez avoir pris connaissance de ces documents et acceptez le traitement de vos données dans les conditions qui y sont décrites.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Responsabilité et garanties */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    7. Responsabilité et limitation des garanties
                  </h2>
                  <div className="space-y-2 text-xs">
                    <p className="text-gray-700 leading-relaxed">
                      <strong>7.1. Yemma Solutions</strong> — Nous nous efforçons d&apos;assurer la disponibilité et la qualité du service. Toutefois, nous ne garantissons pas une disponibilité ininterrompue ni l&apos;absence d&apos;erreurs. Nous déclinons toute responsabilité en cas d&apos;interruption, de perte de données ou de dommages indirects résultant de l&apos;utilisation de la Plateforme.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>7.2. Contenus et mises en relation</strong> — Yemma Solutions assure une validation des profils candidats (entretien, compte-rendu) mais ne garantit pas l&apos;exactitude complète des informations fournies par les utilisateurs. La conclusion d&apos;un contrat de travail entre un candidat et une entreprise relève de la seule responsabilité des parties concernées. Yemma n&apos;est pas partie à ces relations.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>7.3. Utilisation des services</strong> — Vous utilisez la Plateforme sous votre seule responsabilité. Yemma Solutions ne peut être tenu responsable des agissements des utilisateurs (candidats ou recruteurs) ou des contenus qu&apos;ils publient, sous réserve des obligations légales en matière de modération.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Modération, suspension, résiliation */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                    8. Modération, suspension et résiliation
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-3">
                    Yemma Solutions se réserve le droit de&nbsp;:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 mb-3">
                    <li>Modérer, retirer ou refuser tout contenu contraire aux CGU ou au droit en vigueur.</li>
                    <li>Suspendre ou résilier tout compte en cas de manquement aux présentes CGU, de comportement frauduleux ou préjudiciable, ou sur simple décision, avec ou sans préavis.</li>
                    <li>Refuser l&apos;inscription ou la validation d&apos;un candidat ou d&apos;une entreprise.</li>
                  </ul>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    En cas de résiliation, votre droit d&apos;accès aux services cessera. Les dispositions qui, par leur nature, doivent survivre (propriété intellectuelle, responsabilité, droit applicable) resteront applicables.
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Vous pouvez à tout moment supprimer votre compte et demander l&apos;effacement de vos données conformément à la politique de confidentialité.
                  </p>
                </CardContent>
              </Card>

              {/* Modifications des CGU */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    9. Modifications des CGU
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Yemma Solutions peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés des changements substantiels par email ou par un avis sur la Plateforme. La poursuite de l&apos;utilisation des services après l&apos;entrée en vigueur des modifications vaut acceptation des nouvelles CGU. À défaut d&apos;acceptation, vous devez cesser d&apos;utiliser la Plateforme et clôturer votre compte.
                  </p>
                </CardContent>
              </Card>

              {/* Droit applicable et litiges */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                      <Scale className="w-4 h-4" style={{ color: secondaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                        10. Droit applicable et litiges
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Les présentes CGU sont régies par le <strong>droit ivoirien</strong>. En cas de litige, et à défaut de résolution amiable, les <strong>tribunaux compétents de Côte d&apos;Ivoire</strong> seront seuls compétents (notamment le Tribunal de commerce d&apos;Abidjan pour les litiges commerciaux).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryLight }}>
                      <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                        11. Contact
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        Pour toute question relative aux présentes CGU&nbsp;:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold mb-1.5 text-sm" style={{ color: primaryColor }}>Yemma Solutions</p>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                          <span className="text-xs text-gray-700">Email&nbsp;: </span>
                          <a href="mailto:contact@yemma-solutions.com" className="text-xs font-medium hover:underline" style={{ color: primaryColor }}>
                            contact@yemma-solutions.com
                          </a>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mt-3">
                        <p className="text-xs text-gray-700">
                          <strong style={{ color: primaryColor }}>Dernière mise à jour des CGU&nbsp;:</strong> [Date à compléter]
                        </p>
                      </div>
                    </div>
                  </div>
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
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center">
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
              <Link to="/legal/mentions">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto h-10 text-sm"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryLight }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Mentions légales
                </Button>
              </Link>
              <Link to="/legal/privacy">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto h-10 text-sm"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryLight }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Politique de confidentialité
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
