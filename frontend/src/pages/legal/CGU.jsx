import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileCheck, Users, AlertTriangle, Shield, Mail, Scale, ArrowRight, BookOpen, UserCheck } from 'lucide-react'
import { SEO } from '@/components/seo/SEO'
import { Button } from '@/components/ui/button'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

const fadeInUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.5 } }

export default function CGU() {
  return (
    <>
      <SEO
        title="Conditions générales d'utilisation"
        description="CGU Yemma Solutions - Conditions d'utilisation de la plateforme de recrutement."
        canonical="/legal/terms"
      />
      <PublicPageLayout
        title="Conditions générales d'utilisation"
        subtitle="Les règles d'utilisation de la plateforme Yemma Solutions."
        badge={<>Conditions d&apos;utilisation</>}
        heroImage={
          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=400&fit=crop"
              alt="Conditions d'utilisation"
              className="w-full h-full object-cover"
            />
          </div>
        }
      >
        {/* Section 1 - Objet et acceptation */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-[#E8F4F3] border border-[#226D68]/20">
                  <FileCheck className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Objet et acceptation</h3>
                  <p className="text-sm text-[#6b7280]">Règles d&apos;accès à la plateforme</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#226D68] mb-4">1. Objet et acceptation</h2>
                <p className="text-[#6b7280] leading-relaxed mb-4">
                  Les présentes CGU régissent l&apos;accès et l&apos;utilisation de la plateforme <strong>Yemma Solutions</strong>, accessible à l&apos;adresse yemma-solutions.com.
                </p>
                <p className="text-[#6b7280] leading-relaxed">
                  En créant un compte ou en utilisant la Plateforme, vous acceptez sans réserve les présentes CGU. L&apos;éditeur est <strong>Yemma Solutions</strong>, dont les coordonnées figurent dans les <Link to="/legal/mentions" className="font-medium hover:underline text-[#226D68]">mentions légales</Link>.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2 - Description des services - fond vert */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#E8F4F3' }}>
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-white shadow-sm border border-[#e76f51]/20">
                  <Users className="w-12 h-12 text-[#e76f51] mb-4" />
                  <h3 className="font-bold text-[#e76f51] text-lg mb-2">Description des services</h3>
                  <p className="text-sm text-[#6b7280]">Candidats & recruteurs</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#e76f51] mb-4">2. Description des services</h2>
                <p className="text-[#6b7280] leading-relaxed mb-4">
                  Yemma Solutions propose une plateforme de mise en relation entre <strong>candidats</strong> et <strong>entreprises/recruteurs</strong>&nbsp;:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-[#6b7280] mb-4">
                  <li><strong>Candidats&nbsp;:</strong> profil professionnel, validation par experts RH, visibilité auprès des recruteurs, réception d&apos;offres.</li>
                  <li><strong>Recruteurs / Entreprises&nbsp;:</strong> accès à la CVthèque, recherche et filtrage, comptes-rendus RH, contact des candidats.</li>
                </ul>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Les fonctionnalités et offres tarifaires sont décrites sur le Site. Yemma se réserve le droit de faire évoluer les services.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3 - Inscription et compte */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-[#E8F4F3] border border-[#226D68]/20">
                  <UserCheck className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Inscription et compte</h3>
                  <p className="text-sm text-[#6b7280]">Création, validation, exactitude</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#226D68] mb-4">3. Inscription et compte utilisateur</h2>
                <div className="space-y-4 text-[#6b7280]">
                  <p><strong>3.1. Création de compte</strong> — Compte requis pour certains services. Vous êtes responsable de la confidentialité de vos identifiants.</p>
                  <p><strong>3.2. Comptes candidats</strong> — Inscription gratuite. Validation RH possible. Visibilité conditionnée à cette validation.</p>
                  <p><strong>3.3. Comptes recruteurs</strong> — Accès soumis à inscription et abonnement. Conditions dans les CGV et page Tarifs.</p>
                  <p><strong>3.4. Exactitude</strong> — Informations exactes et complètes. Fausse déclaration = suspension ou résiliation.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 4 - Obligations - fond pêche */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#FDEEDC' }}>
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-white shadow-md border border-[#e76f51]/20">
                  <AlertTriangle className="w-12 h-12 text-[#e76f51] mb-4" />
                  <h3 className="font-bold text-[#e76f51] text-lg mb-2">Obligations</h3>
                  <p className="text-sm text-[#6b7280]">Utilisation loyale et conforme</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#e76f51] mb-4">4. Obligations des utilisateurs</h2>
                <ul className="list-disc pl-5 space-y-2 text-[#6b7280] mb-4">
                  <li>Utiliser les services de manière loyale et conforme aux CGU.</li>
                  <li>Ne pas transmettre de contenus illicites, diffamatoires ou discriminatoires.</li>
                  <li>Ne pas usurper l&apos;identité d&apos;autrui.</li>
                  <li>Ne pas accéder aux comptes ou données d&apos;autrui.</li>
                  <li>Ne pas utiliser de robots ou outils automatisés non autorisés.</li>
                  <li>Respecter les droits de propriété intellectuelle.</li>
                </ul>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-[#6b7280] mb-2"><strong className="text-[#e76f51]">Candidats&nbsp;:</strong> garantie d&apos;exactitude du profil, participation de bonne foi à la validation.</p>
                  <p className="text-sm text-[#6b7280]"><strong className="text-[#e76f51]">Recruteurs&nbsp;:</strong> utilisation des données uniquement pour recrutement, pas de réutilisation ou revente.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 5 - Bloc sombre */}
        <section className="py-12 md:py-16 bg-[#0B3C5D] overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div {...fadeInUp} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <BookOpen className="w-10 h-10 text-[#226D68] mb-4" />
                <h2 className="text-lg font-bold text-white mb-3">5. Propriété intellectuelle</h2>
                <p className="text-sm text-white/85 leading-relaxed mb-3">
                  La Plateforme, son architecture, textes, logos et logiciels sont protégés. Vous concédez une licence pour l&apos;utilisation de vos contenus dans le cadre du service.
                </p>
                <Link to="/legal/privacy" className="text-[#226D68] font-medium hover:underline text-sm">Politique de confidentialité →</Link>
              </motion.div>
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <Shield className="w-10 h-10 text-[#226D68] mb-4" />
                <h2 className="text-lg font-bold text-white mb-3">6. Données personnelles</h2>
                <p className="text-sm text-white/85 leading-relaxed">
                  Le traitement est décrit dans notre <Link to="/legal/privacy" className="font-medium hover:underline text-[#226D68]">politique de confidentialité</Link>, conforme à la loi ivoirienne. En acceptant les CGU, vous confirmez en avoir pris connaissance.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 6 - Responsabilité et modération */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div {...fadeInUp} className="bg-[#F4F6F8] rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-[#226D68] mb-3">7. Responsabilité et limitation</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-2">
                  Yemma s&apos;efforce d&apos;assurer la disponibilité et la qualité. Nous déclinons toute responsabilité en cas d&apos;interruption, perte de données ou dommages indirects.
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  La conclusion d&apos;un contrat de travail relève de la seule responsabilité des parties. Yemma n&apos;est pas partie à ces relations.
                </p>
              </motion.div>
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-[#F4F6F8] rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-[#e76f51] mb-3">8. Modération, suspension et résiliation</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-3">
                  Yemma se réserve le droit de modérer, retirer ou refuser tout contenu contraire aux CGU, de suspendre ou résilier tout compte en cas de manquement.
                </p>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Vous pouvez à tout moment supprimer votre compte et demander l&apos;effacement de vos données.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 7 - Droit applicable et contact */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#E8F4F3' }}>
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-white shadow-sm border border-[#226D68]/20">
                  <Scale className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Droit applicable</h3>
                  <p className="text-sm text-[#6b7280]">Tribunaux de Côte d&apos;Ivoire</p>
                </div>
              </div>
              <div className="lg:flex-1 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#e76f51] mb-2">9. Modifications des CGU</h2>
                  <p className="text-[#6b7280] leading-relaxed">
                    Yemma peut modifier les CGU à tout moment. Les utilisateurs seront informés des changements substantiels. La poursuite de l&apos;utilisation vaut acceptation.
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#226D68] mb-2">10. Droit applicable et litiges</h2>
                  <p className="text-[#6b7280] leading-relaxed mb-4">
                    Les CGU sont régies par le <strong>droit ivoirien</strong>. En cas de litige, les <strong>tribunaux compétents de Côte d&apos;Ivoire</strong> seront seuls compétents.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h2 className="text-lg font-bold text-[#226D68] mb-2 flex items-center gap-2"><Mail className="h-5 w-5" />11. Contact</h2>
                  <p className="text-sm text-[#6b7280] mb-2">Pour toute question relative aux CGU&nbsp;:</p>
                  <a href="mailto:contact@yemma-solutions.com" className="font-medium hover:underline text-[#226D68]">contact@yemma-solutions.com</a>
                  <p className="text-xs text-[#6b7280] mt-3"><strong>Dernière mise à jour&nbsp;:</strong> [Date à compléter]</p>
                </div>
              </div>
            </motion.div>
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
              <h2 className="text-xl md:text-2xl font-bold text-[#2C2C2C]">Des questions sur nos conditions ?</h2>
              <p className="text-[#6b7280]">Notre équipe juridique vous répond.</p>
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
                <Link to="/legal/privacy">
                  <Button variant="outline" className="h-11 px-6 border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white font-semibold">
                    Confidentialité
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
