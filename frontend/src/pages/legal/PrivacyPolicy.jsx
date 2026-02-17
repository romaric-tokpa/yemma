import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Mail, Database, Lock, Eye, ArrowRight, Cookie, Users } from 'lucide-react'
import { SEO } from '@/components/seo/SEO'
import { Button } from '@/components/ui/button'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

const fadeInUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.5 } }

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Politique de confidentialité"
        description="Politique de confidentialité Yemma Solutions - Protection des données personnelles, RGPD, recrutement."
        canonical="/legal/privacy"
      />
      <PublicPageLayout
        title="Politique de confidentialité"
        subtitle="Comment Yemma Solutions collecte, utilise et protège vos données personnelles."
        badge={<>Protection des données</>}
        heroImage={
          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
            <img
              src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=400&fit=crop"
              alt="Protection des données"
              className="w-full h-full object-cover"
            />
          </div>
        }
      >
        {/* Section 1 - Introduction */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-[#E8F4F3] border border-[#226D68]/20">
                  <Shield className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Introduction</h3>
                  <p className="text-sm text-[#6b7280]">Conformité loi ivoirienne 2013-450</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#226D68] mb-4">1. Introduction</h2>
                <p className="text-[#6b7280] leading-relaxed mb-4">
                  Yemma Solutions s&apos;engage à protéger la confidentialité et la sécurité de vos données personnelles. Le traitement est effectué conformément à la <strong>loi n°&nbsp;2013-450 du 19&nbsp;juin 2013</strong> relative à la protection des données à caractère personnel en Côte d&apos;Ivoire, sous le contrôle de l&apos;<strong>ARTCI</strong>.
                </p>
                <div className="bg-[#F4F6F8] rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-[#6b7280]"><strong className="text-[#226D68]">Dernière mise à jour&nbsp;:</strong> [Date à compléter]</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2 - Responsable du traitement - fond vert */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#E8F4F3' }}>
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="bg-white rounded-2xl p-8 shadow-sm border border-[#226D68]/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-[#FDF2F0]">
                  <Mail className="w-8 h-8 text-[#e76f51]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#e76f51] mb-2">2. Responsable du traitement</h2>
                  <p className="text-[#6b7280] leading-relaxed mb-4">Le responsable du traitement de vos données personnelles est&nbsp;:</p>
                  <div className="bg-[#F4F6F8] rounded-xl p-5 border border-gray-200">
                    <p className="font-semibold text-[#e76f51] text-lg mb-2">Yemma Solutions</p>
                    <p className="text-sm text-[#6b7280] mb-3">Siège social&nbsp;: Abidjan, Côte d&apos;Ivoire</p>
                    <div className="space-y-2 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#e76f51]" />
                        <a href="mailto:contact@yemma-solutions.com" className="font-medium hover:underline text-[#226D68]">contact@yemma-solutions.com</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#e76f51]" />
                        <a href="mailto:dpo@yemma-solutions.com" className="font-medium hover:underline text-[#226D68]">dpo@yemma-solutions.com</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3 - Données collectées */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-[#E8F4F3] border border-[#226D68]/20">
                  <Database className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Données collectées</h3>
                  <p className="text-sm text-[#6b7280]">Candidats, entreprises, connexion</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#226D68] mb-6">3. Données collectées</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-[#226D68] mb-2">3.1. Données fournies directement</h3>
                    <ul className="list-disc pl-5 space-y-1 text-[#6b7280] text-sm">
                      <li><strong>Candidats&nbsp;:</strong> nom, prénom, email, CV, parcours, compétences, etc.</li>
                      <li><strong>Entreprises/recruteurs&nbsp;:</strong> raison sociale, RCCM, NIU, coordonnées, etc.</li>
                      <li><strong>Entretiens de validation&nbsp;:</strong> enregistrements (avec consentement), notes, évaluations.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#226D68] mb-2">3.2. Données collectées automatiquement</h3>
                    <ul className="list-disc pl-5 space-y-1 text-[#6b7280] text-sm">
                      <li>Adresse IP, navigateur, pages visitées, durée de visite.</li>
                      <li>Cookies et traceurs.</li>
                      <li>Interactions avec la plateforme.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#226D68] mb-2">3.3. Données provenant de tiers</h3>
                    <p className="text-[#6b7280] text-sm">Réseaux sociaux, LinkedIn, etc.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 4 - Finalités - fond pêche */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#FDEEDC' }}>
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#e76f51] mb-4">4. Finalités du traitement</h2>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[#6b7280]">
                  <li>Gestion de compte et des services</li>
                  <li>Validation des profils candidats</li>
                  <li>Mise en relation candidats / recruteurs</li>
                  <li>Communication et notifications</li>
                  <li>Amélioration des services</li>
                  <li>Facturation et obligations légales</li>
                  <li>Prévention de la fraude</li>
                </ul>
                <div className="mt-4 p-3 bg-[#F4F6F8] rounded-lg border border-gray-200">
                  <p className="text-xs text-[#6b7280]"><strong className="text-[#e76f51]">Base légale&nbsp;:</strong> Consentement, exécution de contrat, obligations légales ou intérêts légitimes.</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#226D68] mb-4">5. Conservation</h2>
                <ul className="list-disc pl-5 space-y-2 text-sm text-[#6b7280]">
                  <li><strong>Compte actif&nbsp;:</strong> durée d&apos;utilisation + 3 ans</li>
                  <li><strong>Profils candidats&nbsp;:</strong> 2 ans après désactivation</li>
                  <li><strong>Facturation&nbsp;:</strong> 10 ans (OHADA)</li>
                  <li><strong>Logs&nbsp;:</strong> 12 mois max</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 5 - Destinataires & Cookies - bloc sombre */}
        <section className="py-12 md:py-16 bg-[#0B3C5D] overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div {...fadeInUp} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <Users className="w-10 h-10 text-[#226D68] mb-4" />
                <h2 className="text-lg font-bold text-white mb-3">6. Destinataires</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-white/85">
                  <li>Équipe Yemma Solutions</li>
                  <li>Recruteurs et entreprises (profils candidats)</li>
                  <li>Prestataires techniques (sous contrat)</li>
                  <li>Autorités compétentes (obligation légale)</li>
                </ul>
              </motion.div>
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <Cookie className="w-10 h-10 text-[#226D68] mb-4" />
                <h2 className="text-lg font-bold text-white mb-3">7. Cookies et traceurs</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-white/85">
                  <li><strong>Nécessaires&nbsp;:</strong> authentification, sécurité</li>
                  <li><strong>Préférences&nbsp;:</strong> langue, paramètres</li>
                  <li><strong>Analytiques&nbsp;:</strong> audience, statistiques</li>
                  <li><strong>Ciblage&nbsp;:</strong> personnalisation (si applicable)</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 6 - Vos droits */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-[#E8F4F3] border border-[#226D68]/20">
                  <Eye className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Vos droits</h3>
                  <p className="text-sm text-[#6b7280]">Accès, rectification, effacement, opposition</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#e76f51] mb-4">8. Vos droits</h2>
                <p className="text-[#6b7280] leading-relaxed mb-4">
                  Conformément à la loi n°&nbsp;2013-450, vous disposez des droits suivants&nbsp;: accès, rectification, effacement, limitation, opposition, retrait du consentement.
                </p>
                <div className="bg-[#F4F6F8] rounded-xl p-5 border border-gray-200">
                  <p className="text-sm text-[#6b7280] mb-2">Pour exercer vos droits&nbsp;: <a href="mailto:dpo@yemma-solutions.com" className="font-medium hover:underline text-[#226D68]">dpo@yemma-solutions.com</a></p>
                  <p className="text-sm text-[#6b7280]">Réclamation auprès de l&apos;<strong>ARTCI</strong>&nbsp;: <a href="https://www.artci.ci" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline text-[#226D68]">www.artci.ci</a></p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 7 - Sécurité & Contact */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#E8F4F3' }}>
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div {...fadeInUp} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Lock className="w-10 h-10 text-[#226D68] shrink-0" />
                  <div>
                    <h2 className="text-lg font-bold text-[#226D68] mb-2">9. Sécurité des données</h2>
                    <p className="text-sm text-[#6b7280] leading-relaxed">
                      Chiffrement HTTPS/TLS, authentification forte, contrôle d&apos;accès, sauvegardes régulières, audits de sécurité.
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-10 h-10 text-[#e76f51] shrink-0" />
                  <div>
                    <h2 className="text-lg font-bold text-[#e76f51] mb-2">10. Contact</h2>
                    <p className="text-sm text-[#6b7280] mb-2">Délégué à la protection des données (DPO)</p>
                    <a href="mailto:dpo@yemma-solutions.com" className="font-medium hover:underline text-[#226D68]">dpo@yemma-solutions.com</a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#FDEEDC' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-xl md:text-2xl font-bold text-[#2C2C2C]">Des questions sur vos données ?</h2>
              <p className="text-[#6b7280]">Notre DPO est à votre écoute.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                <a href="mailto:contact@yemma-solutions.com">
                  <Button className="h-11 px-6 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold">
                    Nous contacter <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
                <Link to="/legal/mentions">
                  <Button variant="outline" className="h-11 px-6 border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white font-semibold">
                    Mentions légales
                  </Button>
                </Link>
                <Link to="/legal/terms">
                  <Button variant="outline" className="h-11 px-6 border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white font-semibold">
                    CGU
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </PublicPageLayout>
    </>
  )
}
