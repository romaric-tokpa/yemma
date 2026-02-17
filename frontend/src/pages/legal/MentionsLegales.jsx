import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building, Mail, Globe, Shield, ArrowRight, Scale, FileText, Link2 } from 'lucide-react'
import { SEO } from '@/components/seo/SEO'
import { Button } from '@/components/ui/button'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

const fadeInUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.5 } }

export default function MentionsLegales() {
  return (
    <>
      <SEO
        title="Mentions légales"
        description="Mentions légales Yemma Solutions - Éditeur, hébergeur, plateforme de recrutement."
        canonical="/legal/mentions"
      />
      <PublicPageLayout
        title="Mentions légales"
        subtitle="Identité de l'éditeur, hébergeur et informations relatives à l'utilisation du site."
        badge={<>Informations légales</>}
        heroImage={
          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
            <img
              src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=400&fit=crop"
              alt="Documents légaux"
              className="w-full h-full object-cover"
            />
          </div>
        }
      >
        {/* Section 1 - Éditeur */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-[#E8F4F3] border border-[#226D68]/20">
                  <Building className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Éditeur du site</h3>
                  <p className="text-sm text-[#6b7280]">Identité et coordonnées légales</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#226D68] mb-4">1. Éditeur du site</h2>
                <p className="text-[#6b7280] leading-relaxed mb-4">
                  Le site <strong>yemma-solutions.com</strong> (ci-après «&nbsp;le Site&nbsp;») est édité par&nbsp;:
                </p>
                <div className="bg-[#F4F6F8] rounded-xl p-6 border border-gray-200">
                  <p className="font-semibold text-[#226D68] text-lg mb-3">Yemma Solutions</p>
                  <p className="text-sm text-[#6b7280] mb-1">Société par actions simplifiée (SAS) – Acte uniforme OHADA</p>
                  <p className="text-sm text-[#6b7280] mb-1">Siège social&nbsp;: Abidjan, Côte d&apos;Ivoire</p>
                  <p className="text-sm text-[#6b7280] mb-1">Capital social&nbsp;: [À compléter]</p>
                  <p className="text-sm text-[#6b7280] mb-1">RCCM&nbsp;: [À compléter – ex. CI-ABJ-XX-XXXX-BXX-XXXXX]</p>
                  <p className="text-sm text-[#6b7280] mb-4">NIU / IDU&nbsp;: [À compléter]</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <Mail className="h-4 w-4 text-[#226D68]" />
                    <a href="mailto:contact@yemma-solutions.com" className="font-medium hover:underline text-[#226D68]">
                      contact@yemma-solutions.com
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2 - Fond vert clair */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#E8F4F3' }}>
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div {...fadeInUp} className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-[#e76f51]">
                <h2 className="text-lg font-bold text-[#e76f51] mb-3">2. Directeur de la publication</h2>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Le directeur de la publication du Site est [Nom du responsable], en qualité de [fonction].
                </p>
              </motion.div>
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-[#226D68]">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#E8F4F3] shrink-0">
                    <Globe className="h-5 w-5 text-[#226D68]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#226D68] mb-2">3. Hébergeur</h2>
                    <p className="text-sm text-[#6b7280] leading-relaxed mb-3">Le Site est hébergé par&nbsp;:</p>
                    <div className="bg-[#F4F6F8] rounded-lg p-4 border border-gray-200">
                      <p className="font-semibold text-[#226D68] mb-1">[Nom de l&apos;hébergeur]</p>
                      <p className="text-sm text-[#6b7280] mb-1">[Adresse du siège]</p>
                      <p className="text-sm text-[#6b7280]">[Coordonnées]</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 3 - Propriété intellectuelle */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-[#FDF2F0] border border-[#e76f51]/20">
                  <FileText className="w-12 h-12 text-[#e76f51] mb-4" />
                  <h3 className="font-bold text-[#e76f51] text-lg mb-2">Propriété intellectuelle</h3>
                  <p className="text-sm text-[#6b7280]">Protection des contenus et marques</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#e76f51] mb-4">4. Propriété intellectuelle</h2>
                <p className="text-[#6b7280] leading-relaxed mb-3">
                  L&apos;ensemble du Site (structure, textes, logos, visuels, bases de données, logiciels, etc.) est protégé par le droit d&apos;auteur, le droit des marques et le droit des bases de données, en vigueur en Côte d&apos;Ivoire et dans l&apos;espace OHADA.
                </p>
                <p className="text-[#6b7280] leading-relaxed">
                  La marque «&nbsp;Yemma&nbsp;» et le logo Yemma Solutions sont des signes distinctifs protégés. Leur utilisation sans autorisation est prohibée.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 4 - Données personnelles - fond pêche */}
        <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#FDEEDC' }}>
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-white shadow-md border border-[#226D68]/20">
                  <Shield className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Données & cookies</h3>
                  <p className="text-sm text-[#6b7280]">Protection conforme à la loi ivoirienne</p>
                </div>
              </div>
              <div className="lg:flex-1">
                <h2 className="text-xl font-bold text-[#226D68] mb-4">5. Données personnelles et cookies</h2>
                <p className="text-[#6b7280] leading-relaxed mb-4">
                  Les données à caractère personnel collectées via le Site sont traitées conformément à la <strong>loi n°&nbsp;2013-450 du 19&nbsp;juin 2013</strong> relative à la protection des données à caractère personnel en Côte d&apos;Ivoire.
                </p>
                <p className="text-sm text-[#6b7280] mb-3">Pour plus d&apos;informations&nbsp;:</p>
                <ul className="space-y-2 mb-4">
                  <li>
                    <Link to="/legal/privacy" className="font-medium hover:underline text-[#226D68] flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" /> Politique de confidentialité
                    </Link>
                  </li>
                </ul>
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  Les cookies et traceurs permettent d&apos;assurer le fonctionnement du site, d&apos;analyser l&apos;audience et de personnaliser les contenus. Vous pouvez gérer vos préférences via les paramètres de votre navigateur.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 5 - Bloc sombre */}
        <section className="py-12 md:py-16 bg-[#0B3C5D] overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div {...fadeInUp} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h2 className="text-lg font-bold text-white mb-3">6. Limitation de responsabilité</h2>
                <p className="text-sm text-white/85 leading-relaxed">
                  Yemma Solutions s&apos;efforce d&apos;assurer l&apos;exactitude des informations. L&apos;utilisation du Site s&apos;effectue sous la seule responsabilité de l&apos;utilisateur.
                </p>
              </motion.div>
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-start gap-3">
                  <Link2 className="h-5 w-5 text-[#226D68] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-bold text-white mb-2">7. Liens hypertextes</h2>
                    <p className="text-sm text-white/85 leading-relaxed">
                      Tout lien vers le Site devra faire l&apos;objet d&apos;une autorisation préalable. Les liens vers des sites externes sont fournis à titre indicatif.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section 6 - Droit applicable */}
        <section className="py-12 md:py-16 bg-white overflow-hidden">
          <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeInUp} className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-1/3 flex-shrink-0">
                <div className="p-6 rounded-2xl bg-[#E8F4F3] border border-[#226D68]/20">
                  <Scale className="w-12 h-12 text-[#226D68] mb-4" />
                  <h3 className="font-bold text-[#226D68] text-lg mb-2">Droit applicable</h3>
                  <p className="text-sm text-[#6b7280]">Tribunaux compétents de Côte d&apos;Ivoire</p>
                </div>
              </div>
              <div className="lg:flex-1 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#e76f51] mb-2">8. Droit applicable et juridiction compétente</h2>
                  <p className="text-[#6b7280] leading-relaxed">
                    Les présentes mentions légales sont régies par le <strong>droit ivoirien</strong>. En cas de litige, les <strong>tribunaux compétents de Côte d&apos;Ivoire</strong> seront seuls compétents.
                  </p>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#226D68] mb-2">9. Dernière mise à jour</h2>
                  <p className="text-[#6b7280] leading-relaxed">
                    Dernière mise à jour&nbsp;: [Date à compléter]. Yemma Solutions se réserve le droit de modifier les présentes mentions à tout moment.
                  </p>
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
              <h2 className="text-xl md:text-2xl font-bold text-[#2C2C2C]">Une question sur nos mentions légales ?</h2>
              <p className="text-[#6b7280]">Notre équipe est à votre disposition pour toute précision.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="mailto:contact@yemma-solutions.com">
                  <Button className="h-11 px-6 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold">
                    Nous contacter <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
                <Link to="/legal/terms">
                  <Button variant="outline" className="h-11 px-6 border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white font-semibold">
                    Consulter les CGU
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
