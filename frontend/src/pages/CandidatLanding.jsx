import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { motion } from 'framer-motion'
import { SEO } from '../components/seo/SEO'
import { Button } from '../components/ui/button'
import { ArrowRight, MapPin, Briefcase, UserCheck, FileCheck, Target, Cpu, Factory } from 'lucide-react'
import CandidateHeroIllustration from '../components/landing/CandidateHeroIllustration'
import CandidateCTAIllustration from '../components/landing/CandidateCTAIllustration'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'

export default function CandidatLanding() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-[100vw]">
      <SEO
        title="Candidat - Rendez votre profil visible aux recruteurs"
        description="Créez votre profil sur Yemma Solutions. Rendez vos compétences et qualifications visibles aux entreprises. Validation par des experts, matching et scoring pour des opportunités ciblées."
        keywords="candidat, profil emploi, compétences, qualifications, cvthèque, matching, scoring, recrutement, visibilité recruteurs"
        canonical="/candidat"
      />

      <PublicNavbar variant="dark" />

      {/* Hero - mêmes dimensions que landing /, animations */}
      <section className="relative pt-16 xs:pt-20 md:pt-24 pb-12 xs:pb-16 md:pb-24 overflow-hidden bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 sm:gap-12 lg:gap-16">
            {/* Illustration gauche */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
              className="lg:flex-1 lg:flex lg:justify-start lg:items-center order-2 lg:order-1"
            >
              <CandidateHeroIllustration />
            </motion.div>

            {/* Copy droite */}
            <div className="lg:flex-1 lg:flex lg:flex-col lg:justify-center lg:items-end order-1 lg:order-2">
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-4 sm:mb-6 font-heading text-left lg:text-right"
              >
                Rendez votre profil visible
                <br />
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.15 }}
                  className="text-[#e76f51]"
                >
                  aux recruteurs
                </motion.span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 }}
                className="mb-8"
              >
                <p className="text-base sm:text-lg text-white/85 leading-relaxed mb-1 text-left lg:text-right">
                  Qualifié dans votre domaine ?
                </p>
                <p className="text-base sm:text-lg text-white/85 leading-relaxed mb-6 text-left lg:text-right">
                  Complétez votre profil et accédez à la CVthèque. Nos experts valident vos{' '}
                  <strong className="text-white">compétences et qualifications</strong> pour un matching optimal avec les entreprises.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate(ROUTES.REGISTER_CANDIDAT)}
                  className="h-11 px-6 text-base font-semibold bg-[#e76f51] hover:bg-[#d45a3f] text-white rounded-lg"
                >
                  Créer mon profil
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Bloc postes recherchés - compact, juste sous le hero */}
      <section className="py-5 md:py-6 bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6">
          <p className="text-center text-sm text-[#6b7280] mb-4">
            Des postes recherchés dans tous les secteurs
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 w-8 md:w-16 h-full z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            <div className="absolute right-0 top-0 w-8 md:w-16 h-full z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
            <div className="animate-scroll-jobs gap-3 py-1">
              {[...Array(2)].map((_, dup) =>
                [
                  { sector: 'Tech', role: 'Développeur Java / Angular', location: 'Abidjan', exp: '3+ ans' },
                  { sector: 'Tech', role: 'Lead Dev Node.JS / React', location: 'Abidjan', exp: '5+ ans' },
                  { sector: 'Tech', role: 'Architecte .Net', location: 'Yamoussoukro', exp: '8+ ans' },
                  { sector: 'Tech', role: 'Scrum Master', location: 'Abidjan', exp: '5+ ans' },
                  { sector: 'Tech', role: 'Développeur Frontend', location: 'Télétravail', exp: '2+ ans' },
                  { sector: 'Tech', role: 'Développeur PHP Symfony', location: 'Bouaké', exp: '3+ ans' },
                  { sector: 'Data', role: 'Data Engineer', location: 'Abidjan', exp: '4+ ans' },
                  { sector: 'Tech', role: 'DevOps / Cloud', location: 'San-Pédro', exp: '4+ ans' },
                  { sector: 'Prod', role: 'Product Manager', location: 'Abidjan', exp: '5+ ans' },
                  { sector: 'Tech', role: 'Développeur Java AWS', location: 'Abidjan', exp: '3+ ans' },
                  { sector: 'Fin', role: 'Analyste Financier', location: 'Abidjan', exp: '3+ ans' },
                  { sector: 'Mkt', role: 'Chef de projet digital', location: 'Abidjan', exp: '4+ ans' },
                ].map((item, i) => (
                  <div
                    key={`${i}-${dup}`}
                    className="flex-shrink-0 w-[200px] md:w-[220px] bg-white rounded-lg border border-gray-100 shadow-sm p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-md bg-[#E8F4F3] flex items-center justify-center shrink-0">
                        <span className="text-[#226D68] font-bold text-[10px]">{item.sector.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <h3 className="font-semibold text-[#2C2C2C] text-xs line-clamp-2">{item.role}</h3>
                    </div>
                    <div className="flex gap-2 text-[10px] text-[#6b7280]">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Briefcase className="w-3 h-3 shrink-0" />
                        {item.exp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bloc stats CVthèque - fond vert clair, style capture */}
      <section className="py-10 xs:py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#E8F4F3' }}>
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
                préqualifiés avec soin dans la CVthèque.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0"
            >
              <div className="w-36 h-36 xs:w-48 xs:h-48 md:w-64 md:h-64 rounded-full overflow-hidden bg-[#FDF2F0] border-4 border-white shadow-lg">
                <img
                  src="/candidate-profile-cvtheque.png"
                  alt="Profils préqualifiés dans la CVthèque Yemma"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Rejoignez la meilleure Cvthèque en afrique - fond vert, tous secteurs */}
      <section className="py-12 md:py-16 overflow-hidden" style={{ backgroundColor: '#236E5D' }}>
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
            {/* Colonne gauche - Titre + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:w-2/5 lg:sticky lg:top-24"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6">
                Rejoignez la meilleure Cvthèque en afrique
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-6">
                Tous les secteurs d&apos;activité. Rendez votre profil visible aux entreprises qui recrutent.
              </p>
              <Button
                size="lg"
                onClick={() => navigate(ROUTES.REGISTER_CANDIDAT)}
                className="w-full sm:w-auto h-12 px-6 bg-white text-[#236E5D] hover:bg-gray-100 font-semibold rounded-lg"
              >
                Créer mon profil
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Colonne droite - Tous les secteurs d'activité */}
            <div className="lg:flex-1 space-y-0">
              {[
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
              ].map((category, idx) => {
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
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className="border-b border-white/20 last:border-b-0 py-5 md:py-6 first:pt-0"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white mb-3">{category.title}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                          <ul className="space-y-1">
                            {leftCol.map((sector) => (
                              <li key={sector} className="flex items-center gap-2 text-white/85 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#226D68] shrink-0" />
                                {sector}
                              </li>
                            ))}
                          </ul>
                          <ul className="space-y-1">
                            {rightCol.map((sector) => (
                              <li key={sector} className="flex items-center gap-2 text-white/85 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#226D68] shrink-0" />
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

      {/* Section La promesse de Yemma pour vous - style capture */}
      <section id="promesse" className="py-16 md:py-20 bg-[#F9FAFB]">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-[#2C2C2C] text-center mb-2"
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
            Rendez vos compétences et qualifications visibles aux entreprises qui recrutent.
          </motion.p>

          {/* Bloc 1 - Yemma vous simplifie la vie */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16 mb-20"
          >
            <div className="md:w-2/5 flex justify-center">
              <div className="relative w-full max-w-[280px]">
                <div className="bg-[#2a2a2a] rounded-xl p-4 shadow-xl border border-gray-200">
                  <div className="flex gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#226D68]/30" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 bg-gray-300 rounded w-full" />
                      <div className="h-2 bg-gray-200 rounded w-4/5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 bg-gray-200 rounded w-full" />
                    <div className="h-1.5 bg-gray-200 rounded w-5/6" />
                    <div className="flex gap-1 mt-2">
                      <span className="px-2 py-0.5 bg-[#226D68]/20 rounded text-[10px] text-[#226D68]">Compétences</span>
                      <span className="px-2 py-0.5 bg-[#226D68]/20 rounded text-[10px] text-[#226D68]">Qualifications</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#e76f51] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-md">
                  Profil validé
                </div>
              </div>
            </div>
            <div className="md:w-3/5">
              <p className="text-[#226D68] font-semibold text-sm mb-2">Yemma vous simplifie la vie</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-4">
                Rendez votre profil visible aux recruteurs
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed mb-3">
                Complétez votre profil (compétences, expériences, formations). Nos experts RH le valident par entretien et évaluation. Une fois validé, vous intégrez la CVthèque et devenez visible par 500+ entreprises.
              </p>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed">
                Pas d&apos;agences, pas d&apos;intermédiaires : une plateforme où vos qualifications parlent pour vous.
              </p>
            </div>
          </motion.div>

          {/* Bloc 2 - Yemma vous dit tout */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row-reverse md:items-center gap-10 md:gap-16"
          >
            <div className="md:w-2/5 flex justify-center">
              <div className="relative w-full max-w-[280px]">
                <div className="bg-[#2a2a2a] rounded-xl p-4 shadow-xl border border-gray-200 overflow-hidden">
                  <div className="h-24 bg-[#1a1a1a] rounded-lg mb-3 flex items-end justify-around px-2 pb-2">
                    {[40, 65, 45, 80, 55, 90].map((h, i) => (
                      <div key={i} className="w-3 bg-[#226D68] rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded w-full" />
                    <div className="h-2 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
                <div className="absolute -top-2 -left-2 bg-[#236E5D] text-white text-xs font-bold px-3 py-2 rounded-lg shadow-md">
                  Matching & Scoring
                </div>
              </div>
            </div>
            <div className="md:w-3/5">
              <p className="text-[#226D68] font-semibold text-sm mb-2">Yemma vous dit tout</p>
              <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-4">
                Ici tout est transparent
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed mb-3">
                Matching et scoring aident les recruteurs à vous identifier. Vous recevez des opportunités ciblées, adaptées à votre profil et à vos critères.
              </p>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed">
                Processus clair : validation par nos experts, visibilité dans la CVthèque, mises en relation avec les entreprises qui vous correspondent.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section Comment marche la plateforme ? - 3 colonnes */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl font-bold text-[#2C2C2C] text-center mb-12"
          >
            Comment marche la plateforme ?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-xl border-2 border-gray-200 flex items-center justify-center mb-4 bg-white">
                <UserCheck className="w-8 h-8 text-[#226D68]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[#2C2C2C] text-lg mb-3">Complétez votre profil</h3>
              <p className="text-[#6b7280] text-sm leading-relaxed">
                Créez un profil détaillé : compétences, expériences, formations, certifications. Soumettez-le pour validation. Nos experts RH examineront votre dossier.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-xl border-2 border-gray-200 flex items-center justify-center mb-4 bg-white">
                <FileCheck className="w-8 h-8 text-[#226D68]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[#2C2C2C] text-lg mb-3">Passez la validation</h3>
              <p className="text-[#6b7280] text-sm leading-relaxed">
                Entretien et évaluation par nos experts. Une fois validé, votre profil intègre la CVthèque et devient visible aux recruteurs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-xl border-2 border-gray-200 flex items-center justify-center mb-4 bg-white">
                <Target className="w-8 h-8 text-[#226D68]" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-[#2C2C2C] text-lg mb-3">Recevez des opportunités</h3>
              <p className="text-[#6b7280] text-sm leading-relaxed">
                Votre profil est consulté par les entreprises. Matching et scoring les aident à vous identifier. Vous recevez des mises en relation ciblées.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate(ROUTES.REGISTER_CANDIDAT)}
              className="h-12 px-8 bg-[#e76f51] hover:bg-[#d45a3f] text-white font-semibold rounded-lg"
            >
              Créer mon profil
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA finale - style capture (2 colonnes, fond pêche) - orienté candidat */}
      <section className="py-10 md:py-14 px-3 xs:px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-2xl sm:rounded-[32px] p-5 xs:p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8 lg:gap-12"
            style={{ backgroundColor: '#FDEEDC' }}
          >
            <div className="lg:flex-[1.2] min-w-0">
              <h2 className="text-xl xs:text-2xl md:text-3xl lg:text-4xl font-bold text-[#2C2C2C] leading-tight mb-3 sm:mb-4">
                Candidat : rendez-vous visible aux recruteurs !
              </h2>
              <p className="text-sm xs:text-base md:text-lg text-[#374151] leading-relaxed mb-2">
                Yemma Solutions met en valeur vos compétences et qualifications. Une CVthèque de profils validés par des experts RH, avec matching et scoring pour des opportunités ciblées.
              </p>
              <p className="text-sm xs:text-base md:text-lg text-[#374151] leading-relaxed mb-4 sm:mb-6">
                Complétez votre profil, passez la validation, et devenez visible par 500+ entreprises qui recrutent.
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(ROUTES.REGISTER_CANDIDAT)}
                className="h-12 px-6 border-2 border-[#2C2C2C] bg-transparent text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-white font-medium rounded-lg transition-colors"
              >
                Créer mon profil
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-sm text-[#6b7280] mt-3">Inscription gratuite · Validation par nos experts</p>
            </div>
            <div className="lg:flex-1 flex items-center justify-center lg:justify-end">
              <CandidateCTAIllustration />
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
