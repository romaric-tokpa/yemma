import { useNavigate, Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { motion } from 'framer-motion'
import { SEO } from '../components/seo/SEO'
import {
  ArrowRight, CheckCircle2, Users, Shield, Clock, Star, Zap,
  Target, Timer, Cpu, Briefcase, HeartPulse, ShoppingCart,
  Factory, GraduationCap, Building2, Truck, Lightbulb, Megaphone,
  Scale, Home, Leaf, Rocket, ShoppingBag, FileText, GitBranch, UserCheck
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import HeroIllustration from '../components/landing/HeroIllustration'
import CTACardsIllustration from '../components/landing/CTACardsIllustration'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'

export default function LandingPage() {
  const navigate = useNavigate()

  const stats = [
    { value: '10 000+', label: 'Candidats vérifiés', icon: Users },
    { value: '48h', label: 'Délai moyen', icon: Clock },
    { value: '95%', label: 'Satisfaction', icon: Star },
    { value: '-60%', label: 'Coûts recrutement', icon: Zap },
  ]

  // Bloc "Pourquoi 500+ entreprises nous font confiance" - aligné BRIEF_PROJET.md (§2 Réponse Yemma)
  const trustSteps = [
    {
      title: '100 % des profils visibles validés par des experts',
      desc: 'Entretien, évaluation, compte-rendu : chaque profil visible dans la CVthèque a été vérifié par nos experts RH. Fini le coût élevé des agences, le temps perdu à trier des CV non qualifiés et le risque de profils embellis.',
      icon: 'brief',
      dotColor: '#e76f51',
    },
    {
      title: 'Recherche multi-critères et matching affiché',
      desc: 'Secteur, compétences, expérience, localisation… Ciblez rapidement les bons profils. Matching affiché (ex. taux ~87 %) et évaluations détaillées (scores, soft skills, synthèse) pour aider à la décision.',
      icon: 'candidates',
      dotColor: '#226D68',
      cta: true,
    },
    {
      title: 'Économies et gain de temps',
      desc: '~60 % sur les coûts de recrutement et ~15 h par semaine gagnées grâce à l\'automatisation de la recherche et du tri. Conformité RGPD garantie.',
      icon: 'mission',
      dotColor: '#e76f51',
    },
  ]

  const features = [
    'Recherche multi-critères ultra-précise',
    'Profils enrichis avec évaluations expertes',
    'Matching intelligent par IA',
    'Interface intuitive, zéro formation nécessaire',
    'Support dédié 7j/7',
    'Conformité RGPD garantie',
  ]

  // Secteurs groupés pour le bloc style capture - textes d'origine respectés
  const sectorCategories = [
    {
      title: 'Technologie & Digital',
      icon: Cpu,
      sectors: ['Technologie', 'Digital', 'E-commerce', 'Cybersécurité', 'Startup', 'Télécom', 'R&D', 'Innovation'],
    },
    {
      title: 'Services & Finance',
      icon: Briefcase,
      sectors: ['Finance', 'Commerce', 'Assurance', 'Consulting', 'Marketing', 'Juridique', 'Immobilier'],
    },
    {
      title: 'Industrie & Santé',
      icon: Factory,
      sectors: ['Santé', 'Industrie', 'Biotech', 'Médical', 'BTP', 'Ingénierie', 'Éducation', 'Logistique', 'Environnement', 'Tourisme', 'Sport', 'Culture', 'Design', 'Public', 'Événementiel'],
    },
  ]

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white relative overflow-x-hidden w-full max-w-[100vw]">
      <SEO
        title="Plateforme de Recrutement | CVthèque de candidats vérifiés"
        description="Yemma Solutions - CVthèque de candidats 100% validés par des experts RH. Réduisez vos coûts de recrutement (~60%), accélérez vos embauches (objectif 48h). Recherche avancée, matching et évaluations expertes. Essai gratuit 14 jours."
        keywords="recrutement, emploi, offre emploi, recherche emploi, candidat, recruteur, cvthèque, profils préqualifiés, matching, scoring, plateforme recrutement, RH"
        canonical="/"
      />
      <PublicNavbar variant="light" />

      {/* Hero */}
      <section className="relative pt-16 xs:pt-20 md:pt-24 pb-12 xs:pb-16 md:pb-24 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 sm:gap-12 lg:gap-16">
            {/* Contenu gauche */}
            <div className="lg:max-w-[50%] lg:flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-[1.15] mb-4 sm:mb-6 font-heading"
              >
                La plateforme qui met en relation
                <br />
                <span className="text-[#226D68]">candidats et entreprises</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-8"
              >
                <p className="text-base sm:text-lg text-[#6b7280] leading-relaxed mb-1">
                  <strong className="text-[#2C2C2C]">Réduisez les coûts</strong> de recrutement (moins d&apos;agences), <strong className="text-[#2C2C2C]">accélérez</strong> vos embauches (objectif 48h) et <strong className="text-[#2C2C2C]">garantissez la qualité</strong> des profils grâce à une validation par des experts RH avant mise en visibilité.
                </p>
                <p className="text-base sm:text-lg text-[#6b7280] leading-relaxed mb-6">
                  Une CVthèque de candidats vérifiés, accessibles via recherche avancée, avec des évaluations expertes (scores, résumés, avis) pour faciliter le matching et la décision.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button
                  size="lg"
                  onClick={() => navigate(ROUTES.REGISTER_COMPANY)}
                  className="h-11 px-6 text-base font-semibold bg-[#226D68] hover:bg-[#1a5a55] text-white"
                >
                  Obtenir des profils
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(ROUTES.CONTACT)}
                  className="h-11 px-6 text-base font-semibold border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] bg-white"
                >
                  Prendre rdv
                </Button>
              </motion.div>
            </div>

            {/* Illustration droite - ordinateur, CV, lampe */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:flex-1 lg:flex lg:justify-end lg:items-center"
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bloc partenaires - compact avec défilement */}
      <section className="py-5 xs:py-6 md:py-8 bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 mb-6">
          <p className="text-center text-sm md:text-base text-[#2C2C2C]">
            <span className="font-semibold underline decoration-[#226D68] decoration-2 underline-offset-2">+ 500 entreprises</span>
            {' '}nous font confiance pour recruter des candidats vérifiés
          </p>
        </div>
        <div className="relative w-full overflow-hidden">
          <div className="absolute left-0 top-0 w-12 md:w-20 h-full z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
          <div className="absolute right-0 top-0 w-12 md:w-20 h-full z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
          <div className="flex animate-scroll-partners gap-8 md:gap-12">
            {[...Array(2)].map((_, dup) =>
              ['TechCorp', 'InnovateLab', 'DataFlow', 'CloudSync', 'FinancePlus', 'DigitalPro', 'StartupHub', 'ConsultGroup', 'HealthTech', 'RetailMax'].map((name) => (
                <span key={`${name}-${dup}`} className="flex-shrink-0 text-xs md:text-sm font-semibold text-[#374151] grayscale opacity-80 whitespace-nowrap">
                  {name}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Bloc stats CVthèque - fond pêche */}
      <section className="py-10 xs:py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#FDEEDC' }}>
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 sm:gap-8 md:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <p className="text-xl xs:text-2xl md:text-3xl lg:text-4xl font-bold text-[#2C2C2C] leading-tight">
                Déjà{' '}
                <span className="inline-block px-2 xs:px-3 py-0.5 xs:py-1 rounded-full bg-[#2C2C2C] text-white text-xl xs:text-2xl md:text-3xl lg:text-4xl font-bold whitespace-nowrap">
                  +10700
                </span>{' '}
                profils de qualité
              </p>
              <p className="text-base xs:text-lg md:text-xl text-[#374151] mt-2 font-medium">
                préqualifiés avec soin dans la CVthèque
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0"
            >
              <div className="w-36 h-36 xs:w-48 xs:h-48 md:w-64 md:h-64 rounded-full overflow-hidden bg-[#FDF2F0] border-2 xs:border-4 border-white shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop"
                  alt="Profils qualifiés dans la CVthèque Yemma"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Secteurs d'activités - style capture */}
      <section className="py-10 xs:py-12 md:py-16 bg-[#226D68] overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-16">
            {/* Colonne gauche - Titre */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="lg:w-2/5 lg:sticky lg:top-24 mb-10 lg:mb-0"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
                La plateforme de recrutement
                <br />
                <span className="text-[#e76f51]">des profils préqualifiés</span>
              </h2>
              <p className="text-white/80 text-sm md:text-base mt-4 max-w-md">
                Tous les secteurs d&apos;activité couverts. Recrutez des profils vérifiés dans votre domaine.
              </p>
            </motion.div>

            {/* Colonne droite - Bloc secteurs */}
            <div className="lg:flex-1 space-y-0">
              {sectorCategories.map((category, idx) => {
                const Icon = category.icon
                const half = Math.ceil(category.sectors.length / 2)
                const leftCol = category.sectors.slice(0, half)
                const rightCol = category.sectors.slice(half)
                    return (
                  <motion.div
                    key={category.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="border-b border-dashed border-[#e76f51]/50 last:border-b-0 py-6 md:py-8 first:pt-0"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-4">{category.title}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                          <ul className="space-y-2">
                            {leftCol.map((sector) => (
                              <li key={sector} className="flex items-center gap-2 text-white/90 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#e76f51] shrink-0" />
                                {sector}
                              </li>
                            ))}
                          </ul>
                          <ul className="space-y-2">
                            {rightCol.map((sector) => (
                              <li key={sector} className="flex items-center gap-2 text-white/90 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#e76f51] shrink-0" />
                                {sector}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                    )
                  })}
                </div>
          </div>
        </div>
      </section>

      {/* Pourquoi 500+ entreprises nous font confiance - style capture */}
      <section id="benefits" className="py-10 xs:py-12 md:py-16 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xl md:text-2xl font-bold text-[#2C2C2C] text-center mb-2"
          >
            Pourquoi 500+ entreprises nous font confiance
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm text-[#6b7280] text-center mb-12"
          >
            Réponse Yemma : profils 100 % validés par des experts, recherche multi-critères, matching affiché et économies sur les coûts de recrutement
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-6">
            {trustSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center text-center"
              >
                {/* Icône avec points animés */}
                <motion.div
                  className="relative w-20 h-20 mb-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
                >
                  {step.icon === 'brief' && (
                    <div className="w-full h-full rounded-xl border-2 border-gray-200 flex items-center justify-center bg-gray-50/50 relative">
                      <FileText className="w-9 h-9 text-gray-500" strokeWidth={1.5} />
                      <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                        {[0, 1, 2].map((j) => (
                          <motion.span
                            key={j}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: step.dotColor }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: j * 0.2 }}
                          />
                        ))}
                      </div>
                      <motion.span
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: step.dotColor }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.span
                        className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: step.dotColor }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </div>
                  )}
                  {step.icon === 'candidates' && (
                    <div className="w-full h-full rounded-xl border-2 border-[#226D68]/40 flex items-center justify-center bg-[#E8F4F3]/60 relative">
                      <GitBranch className="w-9 h-9 text-[#226D68]" strokeWidth={1.5} />
                      <motion.span
                        className="absolute w-2 h-2 rounded-full bg-[#226D68]"
                        style={{ top: '15%', right: '20%' }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.span
                        className="absolute w-1.5 h-1.5 rounded-full bg-[#226D68]"
                        style={{ bottom: '30%', left: '15%' }}
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                      <motion.span
                        className="absolute w-1.5 h-1.5 rounded-full bg-[#226D68]"
                        style={{ bottom: '15%', right: '20%' }}
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      />
                    </div>
                  )}
                  {step.icon === 'mission' && (
                    <div className="w-full h-full rounded-xl border-2 border-gray-200 flex items-center justify-center bg-gray-50/50 relative overflow-visible">
                      <UserCheck className="w-9 h-9 text-gray-500" strokeWidth={1.5} />
                      <motion.span className="absolute -top-0.5 right-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.dotColor }}
                        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
                      <motion.span className="absolute top-1/2 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.dotColor }}
                        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
                      <motion.span className="absolute -bottom-0.5 left-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.dotColor }}
                        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
                    </div>
                  )}
                </motion.div>

                <h3 className="font-bold text-[#2C2C2C] text-base md:text-lg mb-3">{step.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed mb-4 max-w-xs">
                  {step.desc}
                </p>

                {step.cta && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={() => navigate(ROUTES.REGISTER_COMPANY)}
                      className="mt-2 h-11 px-6 bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold transition-all hover:scale-105"
                    >
                      Faire une demande
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
        </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* La promesse de Yemma pour vous */}
      <section id="promesse" className="py-12 xs:py-16 md:py-20 bg-[#F9FAFB] overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-[#2C2C2C] text-center mb-3"
          >
            La promesse de Yemma pour vous
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-[#6b7280] text-sm md:text-base max-w-2xl mx-auto mb-16"
          >
            Une CVthèque de candidats vérifiés, accessibles via recherche avancée. Évaluations expertes (scores, résumés, avis) pour faciliter le matching et la décision. Pas d&apos;agences, pas d&apos;intermédiaires : des profils validés par nos experts RH avant mise en visibilité.
          </motion.p>

          {/* Bloc 1 - Identification des profils */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16 mb-20"
          >
            <div className="md:w-2/5 relative">
              <div className="relative">
                <div className="flex gap-2 -rotate-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="w-20 h-28 xs:w-24 xs:h-32 md:w-28 md:h-36 bg-white rounded-lg shadow-lg border border-gray-100 flex flex-col p-2"
                      style={{ transform: `translateY(${i * 4}px)` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 mx-auto mt-2" />
                      <div className="flex-1 mt-2 space-y-1">
                        <div className="h-1.5 bg-gray-100 rounded w-full" />
                        <div className="h-1.5 bg-gray-100 rounded w-4/5" />
                        <div className="h-1.5 bg-gray-100 rounded w-3/5" />
                    </div>
                    </motion.div>
                  ))}
                  </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 bg-[#e76f51] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-md"
                >
                  +10 700 profils
                  <br />
                  préqualifiés
                </motion.div>
              </div>
            </div>
            <div className="md:w-3/5">
              <p className="text-[#226D68] font-semibold text-sm mb-2">Arrêtez de perdre du temps</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-4">
                Nous identifions pour vous les meilleurs profils
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed mb-3">
                Accédez à une CVthèque de candidats déjà validés par nos experts. Recherche multi-critères, <strong>matching</strong> et <strong>scoring</strong> pour cibler rapidement les profils les plus adaptés à vos besoins.
              </p>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed">
                Chaque profil est préqualifié avec une évaluation détaillée (scores, synthèse, compétences). Vous recevez une sélection pertinente en moins de 48h.
              </p>
            </div>
          </motion.div>

          {/* Bloc 2 - Gestion de A à Z */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row-reverse md:items-center gap-10 md:gap-16 mb-20"
          >
            <div className="md:w-2/5 relative">
              <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-xs">
                <div className="space-y-2 mb-6">
                  <div className="h-2 bg-gray-100 rounded w-full" />
                  <div className="h-2 bg-gray-100 rounded w-4/5" />
                  <div className="h-2 bg-gray-100 rounded w-3/5" />
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="h-6 w-32 bg-gray-200 rounded" />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="absolute -top-2 -left-2 bg-[#0B3C5D] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-md"
                >
                  100% vérification
                  <br />
                  par nos experts
                </motion.div>
              </div>
                    </div>
            <div className="md:w-3/5 text-left md:text-right">
              <p className="text-[#226D68] font-semibold text-sm mb-2">Concentrez-vous sur l&apos;essentiel</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-4">
                Nous gérons tout de A à Z
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed mb-3">
                Conformité RGPD garantie, traçabilité des accès et audit. Nos experts valident chaque profil par entretien et évaluation avant mise en CVthèque.
              </p>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed">
                Concentrez-vous sur l&apos;essentiel : votre recrutement. Nous assurons la qualité et la fiabilité des profils.
              </p>
                  </div>
          </motion.div>

          {/* Bloc 3 - Sélection rigoureuse */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16"
          >
            <div className="md:w-2/5">
              <div className="relative bg-white rounded-xl p-6 shadow-lg border border-gray-100 max-w-xs">
                <div className="space-y-3">
                  {['Entretien', 'Évaluation', 'Validation', 'CVthèque'].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`py-2 px-3 rounded-lg border border-gray-200 text-sm font-medium text-[#374151] ${i === 0 ? 'w-full' : i === 1 ? 'w-[90%] ml-[5%]' : i === 2 ? 'w-[80%] ml-[10%]' : 'w-[70%] ml-[15%]'}`}
                    >
                      {step}
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 py-2 px-4 bg-[#2C2C2C] text-white text-sm font-bold rounded-lg text-center w-3/4 mx-auto"
                >
                  Profils validés
                </motion.div>
              </div>
            </div>
            <div className="md:w-3/5">
              <p className="text-[#226D68] font-semibold text-sm mb-2">Votre projet est exigeant, nous aussi</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-4">
                La sélection de profils la plus rigoureuse du marché
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed mb-3">
                Chaque candidat intègre la CVthèque après une phase de validation poussée. Nos experts RH échangent avec chaque candidat pour vérifier ses compétences, ses références et ses motivations.
              </p>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed">
                Nous ne retenons que les meilleurs profils audités. Matching et scoring vous aident à prendre la bonne décision.
              </p>
          </div>
          </motion.div>
        </div>
      </section>

      {/* CTA finale - style capture (2 colonnes, fond pêche) */}
      <section className="py-10 md:py-14 px-3 xs:px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-2xl sm:rounded-[32px] p-5 xs:p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8 lg:gap-12"
            style={{ backgroundColor: '#FDEEDC' }}
          >
            <div className="lg:flex-[1.2] min-w-0">
              <h2 className="text-xl xs:text-2xl md:text-3xl lg:text-4xl font-bold text-[#2C2C2C] leading-tight mb-3 sm:mb-4">
                Recrutement : centralisez vos recherches !
          </h2>
              <p className="text-sm xs:text-base md:text-lg text-[#374151] leading-relaxed mb-2">
                Yemma Solutions simplifie et accélère vos recrutements. Une CVthèque de profils préqualifiés, avec matching et scoring, validés par des experts RH.
              </p>
              <p className="text-sm xs:text-base md:text-lg text-[#374151] leading-relaxed mb-4 sm:mb-6">
                Une gestion recrutement simple, fluide et éprouvée, avec des économies jusqu&apos;à 60%.
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(ROUTES.REGISTER_COMPANY)}
                className="h-12 px-6 border-2 border-[#2C2C2C] bg-transparent text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white font-medium rounded-lg transition-colors"
              >
                En savoir plus
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
              <p className="text-sm text-[#6b7280] mt-3">Essai gratuit 14 jours · Sans carte bancaire</p>
            </div>
            <div className="lg:flex-1 flex items-center justify-center lg:justify-end">
              <CTACardsIllustration />
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
