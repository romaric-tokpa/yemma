import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { motion } from 'framer-motion'
import { SEO } from '../components/seo/SEO'
import {
  ArrowRight, Cpu, Briefcase, Factory,
  FileText, GitBranch, UserCheck
} from 'lucide-react'
import { Button } from '../components/ui/button'
import ProfileCVHeroIllustration from '../components/landing/ProfileCVHeroIllustration'
import CTACardsIllustration from '../components/landing/CTACardsIllustration'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'

export default function LandingPage() {
  const navigate = useNavigate()

  const trustSteps = [
    {
      title: 'Zéro profil non qualifié dans notre CVthèque',
      desc: 'Entretien, évaluation, compte-rendu expert : chaque candidat visible a été vérifié par nos experts RH. Scores, soft skills, synthèse — vous ne voyez que des profils qui tiennent la route.',
      icon: 'brief',
      dotColor: '#e76f51',
    },
    {
      title: 'Trouvez le bon profil en quelques minutes',
      desc: 'Secteur, compétences, expérience, localisation… Filtres précis et matching affiché (ex. 87 %) avec évaluations détaillées pour décider rapidement et en toute confiance.',
      icon: 'candidates',
      dotColor: '#226D68',
      cta: true,
    },
    {
      title: '−60 % sur vos coûts de recrutement',
      desc: 'Nos clients économisent en moyenne 60 % et récupèrent ~15h par semaine. Conformité RGPD incluse.',
      icon: 'mission',
      dotColor: '#e76f51',
    },
  ]

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
    <div className="min-h-screen min-h-[100dvh] relative overflow-x-hidden w-full max-w-[100vw]">
      <SEO
        title="CVthèque de candidats pré-validés | Recrutez en 48h | Yemma Solutions"
        description="Yemma Solutions — 10 700+ candidats interviewés et évalués par des experts RH. Recrutez sans trier de CV, réduisez vos coûts de 60 % et shortlistez en moins de 48h. Recherche avancée, matching et scoring."
        keywords="recrutement, cvthèque, candidats validés, profils préqualifiés, matching, scoring, recrutement Afrique, plateforme RH, sans agence"
        canonical="/"
      />
      <PublicNavbar variant="light" />

      {/* Hero */}
      <section className="relative pt-16 xs:pt-20 md:pt-24 pb-14 xs:pb-20 md:pb-28 overflow-hidden bg-white">
        <div className="relative max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 sm:gap-12 lg:gap-16">
            {/* Contenu gauche */}
            <div className="lg:max-w-[50%] lg:flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2C2C] leading-[1.15] mb-4 sm:mb-6 font-heading"
              >
                100% des profils validés par entretien expert.
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-8"
              >
                <p className="text-base sm:text-lg text-[#374151] leading-relaxed mb-3">
                  Accédez directement aux bons candidats — scorés, évalués, prêts à rejoindre votre équipe.
                </p>
                <p className="text-base sm:text-lg text-[#374151] leading-relaxed mb-6">
                  <span className="text-[#226D68] font-semibold">→ Shortlist en 48h. Zéro tri inutile.</span>
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
                  Accéder à la CVthèque
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(ROUTES.CONTACT)}
                  className="h-11 px-6 text-base font-semibold border-[#2C2C2C]/40 text-[#2C2C2C] hover:bg-[#2C2C2C]/5 bg-transparent"
                >
                  Prendre rendez-vous
                </Button>
              </motion.div>
            </div>

            {/* Illustration droite - CV de profil validé */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:flex-1 lg:flex lg:justify-end lg:items-center"
            >
              <ProfileCVHeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bloc partenaires - compact avec défilement */}
      <section className="py-5 xs:py-6 md:py-8 border-b border-gray-100 overflow-hidden">
        <div className="max-w-5xl mx-auto px-3 xs:px-4 sm:px-6 mb-6">
          <p className="text-center text-sm md:text-base text-[#2C2C2C]">
            <span className="font-semibold underline decoration-[#226D68] decoration-2 underline-offset-2">+500 entreprises</span>
            {' '}recrutent grâce à Yemma
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
                  +10 700
                </span>{' '}
                profils validés
              </p>
              <p className="text-base xs:text-lg md:text-xl text-[#374151] mt-2 font-medium">
                interviewés, évalués, prêts à être recrutés.
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
                  src="/recruiter-profile-cvtheque.png"
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
                Quel que soit votre secteur,
                <br />
                <span className="text-[#e76f51]">nous avons les profils.</span>
              </h2>
              <p className="text-white/80 text-sm md:text-base mt-4 max-w-md">
                Tous les domaines d&apos;activité couverts. Des candidats vérifiés prêts à rejoindre votre équipe.
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
      <section id="benefits" className="py-10 xs:py-12 md:py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xl md:text-2xl font-bold text-[#2C2C2C] text-center mb-2"
          >
            Pourquoi 500+ entreprises nous choisissent
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm text-[#6b7280] text-center mb-12"
          >
            Sans agences. Sans CV non qualifiés. Sans mauvaises surprises.
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

      {/* Notre méthode. Vos résultats. */}
      <section id="promesse" className="py-12 xs:py-16 md:py-20 bg-[#F9FAFB] overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-[#2C2C2C] text-center mb-3"
          >
            Notre méthode. Vos résultats.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center text-[#6b7280] text-sm md:text-base max-w-2xl mx-auto mb-16"
          >
            Moins d&apos;intermédiaires, plus de qualité. Des profils vérifiés et évalués, disponibles dès que vous en avez besoin.
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
              <p className="text-[#226D68] font-semibold text-sm mb-2">Recrutement ciblé</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-4">
                Accédez directement aux bons candidats
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed mb-3">
                Notre CVthèque rassemble des profils déjà validés par nos experts RH. Recherche multi-critères, <strong>matching</strong> et <strong>scoring</strong> pour identifier en quelques clics le candidat qui correspond exactement à votre besoin.
              </p>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed">
                Chaque profil est évalué en détail : score global, compétences techniques, soft skills, synthèse RH. Vous recevez une sélection pertinente en moins de 48h.
              </p>
            </div>
          </motion.div>

          {/* Bloc 2 - Conformité et sérénité */}
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
              <p className="text-[#226D68] font-semibold text-sm mb-2">Zéro risque légal</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-4">
                RGPD, audit et conformité : on s&apos;en occupe
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed mb-3">
                Accès sécurisé aux profils, traçabilité complète des consultations, audit disponible. Nous gérons la conformité réglementaire pour que vous puissiez vous concentrer sur vos recrutements.
              </p>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed">
                Chaque candidat a donné son consentement explicite. Pas de zone grise, pas de friction : un recrutement 100 % serein et conforme.
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
              <p className="text-[#226D68] font-semibold text-sm mb-2">Notre process</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-4">
                3 étapes avant qu&apos;un profil soit visible
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed mb-3">
                Entretien individuel, évaluation des compétences, validation finale par notre équipe RH. Un filtre exigeant qui garantit que chaque profil visible correspond réellement à ce que vous cherchez.
              </p>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed">
                Résultat : des candidats fiables, vérifiés, avec des évaluations détaillées pour prendre la bonne décision rapidement.
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
                Votre prochain recrutement peut prendre 48h.
              </h2>
              <p className="text-sm xs:text-base md:text-lg text-[#374151] leading-relaxed mb-2">
                Accédez à +10 700 profils validés par nos experts RH. Recherche avancée, matching et évaluations détaillées pour recruter vite et bien — sans intermédiaires.
              </p>
              <p className="text-sm xs:text-base md:text-lg text-[#374151] leading-relaxed mb-4 sm:mb-6">
                14 jours pour tester la plateforme gratuitement. Sans engagement, sans carte bancaire.
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(ROUTES.REGISTER_COMPANY)}
                className="h-12 px-6 border-2 border-[#2C2C2C] bg-transparent text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white font-medium rounded-lg transition-colors"
              >
                Démarrer maintenant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
              <p className="text-sm text-[#6b7280] mt-3">Essai gratuit · Sans engagement · Annulez à tout moment</p>
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
