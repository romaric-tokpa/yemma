import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, ArrowRight, Mail, Lock, Database, Eye, CheckCircle, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function PrivacyPolicy() {
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
              <Shield className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-xs font-semibold" style={{ color: primaryColor }}>Protection des données</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight" style={{ color: '#1a293e' }}>
              Politique de confidentialité
            </h1>
            <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto">
              Comment Yemma Solutions collecte, utilise et protège vos données personnelles.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section Compact */}
      <section className="py-6 md:py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">

              {/* Introduction */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    1. Introduction
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    Yemma Solutions (ci-après «&nbsp;nous&nbsp;», «&nbsp;notre&nbsp;» ou «&nbsp;Yemma&nbsp;») s&apos;engage à protéger la confidentialité et la sécurité de vos données personnelles. La présente politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre site web et nos services.
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">
                    Le traitement de vos données est effectué conformément à la <strong>loi n°&nbsp;2013-450 du 19&nbsp;juin 2013</strong> relative à la protection des données à caractère personnel en Côte d&apos;Ivoire, et sous le contrôle de l&apos;<strong>ARTCI</strong> (Autorité de régulation des télécommunications/TIC de Côte d&apos;Ivoire).
                  </p>
                  <p className="text-xs text-gray-700 leading-relaxed mb-3">
                    En utilisant notre plateforme, vous acceptez les pratiques décrites dans cette politique. Si vous n&apos;êtes pas d&apos;accord avec cette politique, veuillez ne pas utiliser nos services.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-700">
                      <strong style={{ color: primaryColor }}>Dernière mise à jour&nbsp;:</strong> [Date à compléter]
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Responsable du traitement */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                      <Mail className="w-4 h-4" style={{ color: secondaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                        2. Responsable du traitement
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        Le responsable du traitement de vos données personnelles est&nbsp;:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold mb-1.5 text-sm" style={{ color: secondaryColor }}>Yemma Solutions</p>
                        <p className="text-xs text-gray-700 mb-2">Siège social&nbsp;: Abidjan, Côte d&apos;Ivoire</p>
                        <div className="space-y-1.5 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
                            <span className="text-xs text-gray-700">Contact&nbsp;: </span>
                            <a href="mailto:contact@yemma-solutions.com" className="text-xs font-medium hover:underline" style={{ color: secondaryColor }}>
                              contact@yemma-solutions.com
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5" style={{ color: secondaryColor }} />
                            <span className="text-xs text-gray-700">DPO&nbsp;: </span>
                            <a href="mailto:dpo@yemma-solutions.com" className="text-xs font-medium hover:underline" style={{ color: secondaryColor }}>
                              dpo@yemma-solutions.com
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Données collectées */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryLight }}>
                      <Database className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                        3. Données personnelles collectées
                      </h2>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold mb-1.5 text-xs" style={{ color: primaryColor }}>3.1. Données fournies directement</h3>
                          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                            <li><strong>Pour les candidats&nbsp;:</strong> nom, prénom, email, téléphone, adresse, date de naissance, CV, lettre de motivation, parcours professionnel, formations, compétences, préférences géographiques, etc.</li>
                            <li><strong>Pour les entreprises/recruteurs&nbsp;:</strong> raison sociale, RCCM, NIU, adresse, nom et coordonnées des responsables, informations de facturation, etc.</li>
                            <li><strong>Lors des entretiens de validation&nbsp;:</strong> enregistrements audio/vidéo (avec consentement), notes d&apos;entretien, évaluations.</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1.5 text-xs" style={{ color: primaryColor }}>3.2. Données collectées automatiquement</h3>
                          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                            <li>Données de connexion&nbsp;: adresse IP, type de navigateur, système d&apos;exploitation, pages visitées, durée de visite, etc.</li>
                            <li>Cookies et traceurs&nbsp;: voir section dédiée ci-dessous.</li>
                            <li>Données d&apos;utilisation&nbsp;: interactions avec la plateforme, recherches effectuées, profils consultés, etc.</li>
                          </ul>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1.5 text-xs" style={{ color: primaryColor }}>3.3. Données provenant de tiers</h3>
                          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                            <li>Données issues de réseaux sociaux si vous vous connectez via ces services.</li>
                            <li>Données de référencement professionnel (LinkedIn, etc.) si vous les importez.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Finalités */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                      <CheckCircle className="w-4 h-4" style={{ color: secondaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                        4. Finalités du traitement
                      </h2>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 mb-3">
                        <li><strong>Gestion de votre compte et des services&nbsp;:</strong> création de profil, authentification, mise à jour de vos informations, accès à la CVthèque (recruteurs), etc.</li>
                        <li><strong>Validation des profils candidats&nbsp;:</strong> organisation d&apos;entretiens, évaluation, rédaction de compte-rendu RH.</li>
                        <li><strong>Mise en relation&nbsp;:</strong> permettre aux recruteurs de découvrir et contacter les candidats validés, et inversement.</li>
                        <li><strong>Communication&nbsp;:</strong> envoi de notifications, réponses à vos demandes, informations sur nos services.</li>
                        <li><strong>Amélioration de nos services&nbsp;:</strong> analyse statistique, développement de nouvelles fonctionnalités, optimisation de l&apos;expérience utilisateur.</li>
                        <li><strong>Facturation et gestion commerciale&nbsp;:</strong> pour les entreprises abonnées.</li>
                        <li><strong>Obligations légales&nbsp;:</strong> respect des obligations comptables, fiscales et de sécurité en vigueur en Côte d&apos;Ivoire.</li>
                        <li><strong>Prévention de la fraude et sécurité&nbsp;:</strong> détection d&apos;activités suspectes, protection de la plateforme.</li>
                      </ul>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-700">
                          <strong style={{ color: secondaryColor }}>Base légale&nbsp;:</strong> Le traitement repose sur votre consentement, l&apos;exécution d&apos;un contrat, le respect d&apos;obligations légales ou nos intérêts légitimes, conformément à la loi ivoirienne sur la protection des données.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conservation */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    5. Durée de conservation
                  </h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 mb-3">
                    <li><strong>Données de compte actif&nbsp;:</strong> pendant toute la durée d&apos;utilisation de nos services, puis 3 ans après la dernière connexion.</li>
                    <li><strong>Profils candidats validés&nbsp;:</strong> conservés tant que le candidat souhaite rester visible, puis 2 ans après désactivation (sauf demande de suppression).</li>
                    <li><strong>Données de facturation&nbsp;:</strong> 10 ans conformément aux obligations comptables applicables en Côte d&apos;Ivoire (OHADA, droit ivoirien).</li>
                    <li><strong>Données de connexion et logs&nbsp;:</strong> 12 mois maximum.</li>
                    <li><strong>Cookies&nbsp;:</strong> voir section dédiée.</li>
                  </ul>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Au-delà de ces durées, vos données sont supprimées ou anonymisées, sauf obligation légale de conservation.
                  </p>
                </CardContent>
              </Card>

              {/* Destinataires */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                    6. Destinataires des données
                  </h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 mb-3">
                    <li><strong>Équipe Yemma Solutions&nbsp;:</strong> personnel autorisé (RH, support, technique, commercial) dans le cadre de leurs fonctions.</li>
                    <li><strong>Recruteurs et entreprises&nbsp;:</strong> pour les candidats validés, les informations de profil (CV, compte-rendu RH) sont visibles par les recruteurs inscrits sur la plateforme.</li>
                    <li><strong>Prestataires techniques&nbsp;:</strong> hébergeurs, services cloud, outils d&apos;analyse, services de paiement, etc., sous contrat strict de confidentialité.</li>
                    <li><strong>Autorités compétentes&nbsp;:</strong> en cas d&apos;obligation légale ou de réquisition judiciaire en Côte d&apos;Ivoire.</li>
                  </ul>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-700">
                      <strong style={{ color: secondaryColor }}>Transferts hors Côte d&apos;Ivoire&nbsp;:</strong> Certains prestataires peuvent être situés à l&apos;étranger. Dans ce cas, nous nous assurons que des garanties appropriées sont en place (clauses contractuelles, adéquation) conformément à la loi ivoirienne sur la protection des données.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cookies */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                    7. Cookies et traceurs
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed mb-3">
                    Notre site utilise des cookies et traceurs pour&nbsp;:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 mb-3">
                    <li><strong>Cookies strictement nécessaires&nbsp;:</strong> authentification, sécurité, fonctionnement du site (conservation&nbsp;: session ou 12 mois).</li>
                    <li><strong>Cookies de préférences&nbsp;:</strong> mémorisation de vos choix (langue, paramètres) (conservation&nbsp;: 12 mois).</li>
                    <li><strong>Cookies analytiques&nbsp;:</strong> mesure d&apos;audience, statistiques d&apos;utilisation (conservation&nbsp;: 13 mois maximum).</li>
                    <li><strong>Cookies de ciblage/publicité&nbsp;:</strong> personnalisation de contenus, publicité ciblée (si applicable) (conservation&nbsp;: 13 mois maximum).</li>
                  </ul>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur ou via le bandeau de consentement affiché lors de votre première visite. Le refus de certains cookies peut affecter le fonctionnement du site.
                  </p>
                </CardContent>
              </Card>

              {/* Droits */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                      <Eye className="w-4 h-4" style={{ color: secondaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                        8. Vos droits
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-3">
                        Conformément à la <strong>loi n°&nbsp;2013-450 du 19&nbsp;juin 2013</strong> relative à la protection des données à caractère personnel en Côte d&apos;Ivoire, vous disposez des droits suivants&nbsp;:
                      </p>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700 mb-3">
                        <li><strong>Droit d&apos;accès&nbsp;:</strong> obtenir une copie de vos données personnelles.</li>
                        <li><strong>Droit de rectification&nbsp;:</strong> corriger vos données inexactes ou incomplètes.</li>
                        <li><strong>Droit à l&apos;effacement&nbsp;:</strong> demander la suppression de vos données (sous réserve d&apos;obligations légales).</li>
                        <li><strong>Droit à la limitation&nbsp;:</strong> limiter le traitement de vos données dans certains cas.</li>
                        <li><strong>Droit d&apos;opposition&nbsp;:</strong> vous opposer au traitement pour motifs légitimes ou à des fins de prospection.</li>
                        <li><strong>Droit de retirer votre consentement&nbsp;:</strong> à tout moment, sans affecter la licéité du traitement antérieur.</li>
                      </ul>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-700 mb-1.5">
                          Pour exercer vos droits, contactez-nous à&nbsp;:{' '}
                          <a href="mailto:dpo@yemma-solutions.com" className="font-medium hover:underline" style={{ color: secondaryColor }}>
                            dpo@yemma-solutions.com
                          </a>
                          . Nous répondrons dans un délai d&apos;un mois.
                        </p>
                        <p className="text-xs text-gray-700">
                          Vous avez également le droit d&apos;introduire une réclamation auprès de l&apos;<strong>ARTCI</strong>&nbsp;: {' '}
                          <a href="https://www.artci.ci" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: secondaryColor }}>
                            www.artci.ci
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sécurité */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryLight }}>
                      <Lock className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-bold mb-2" style={{ color: primaryColor }}>
                        9. Sécurité des données
                      </h2>
                      <p className="text-xs text-gray-700 leading-relaxed mb-2">
                        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre la perte, l&apos;accès non autorisé, la divulgation, l&apos;altération ou la destruction&nbsp;: chiffrement (HTTPS/TLS), authentification forte, contrôle d&apos;accès, sauvegardes régulières, audits de sécurité, etc.
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Cependant, aucune méthode de transmission ou de stockage n&apos;est totalement sécurisée. Nous ne pouvons garantir une sécurité absolue, mais nous nous engageons à prendre toutes les précautions raisonnables.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modifications */}
              <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                <CardContent className="p-4">
                  <h2 className="text-base font-bold mb-2" style={{ color: secondaryColor }}>
                    10. Modifications de la politique
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications importantes vous seront notifiées par email ou via un avis sur le site. La date de dernière mise à jour est indiquée en haut de cette page. Il est recommandé de consulter régulièrement cette politique.
                  </p>
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
                        Pour toute question concernant cette politique de confidentialité ou le traitement de vos données, contactez&nbsp;:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="font-semibold mb-1.5 text-sm" style={{ color: primaryColor }}>Délégué à la protection des données (DPO)</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                            <span className="text-xs text-gray-700">Email&nbsp;: </span>
                            <a href="mailto:dpo@yemma-solutions.com" className="text-xs font-medium hover:underline" style={{ color: primaryColor }}>
                              dpo@yemma-solutions.com
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                            <span className="text-xs text-gray-700">Ou&nbsp;: </span>
                            <a href="mailto:contact@yemma-solutions.com" className="text-xs font-medium hover:underline" style={{ color: primaryColor }}>
                              contact@yemma-solutions.com
                            </a>
                          </div>
                        </div>
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
              <Link to="/legal/terms">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto h-10 text-sm"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryLight }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  CGU
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
