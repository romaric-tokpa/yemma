import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, CheckCircle2, Users, Shield, Clock, Star, Zap,
  Target, Timer, Menu, X, Cpu, Briefcase, HeartPulse, ShoppingCart,
  Factory, GraduationCap, Building2, Truck, Lightbulb, Megaphone,
  Scale, Home, Leaf, Rocket, ShoppingBag
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

export default function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const stats = [
    { value: '10 000+', label: 'Candidats vérifiés', icon: Users },
    { value: '48h', label: 'Délai moyen', icon: Clock },
    { value: '95%', label: 'Satisfaction', icon: Star },
    { value: '-60%', label: 'Coûts recrutement', icon: Zap },
  ]

  const benefits = [
    { icon: Zap, title: 'Réduisez vos coûts de 60%', desc: 'Fini les agences de recrutement coûteuses. Recrutez directement avec Yemma.' },
    { icon: Timer, title: 'Gagnez 15h par semaine', desc: 'Automatisez la recherche et le tri des candidats. Concentrez-vous sur l\'essentiel.' },
    { icon: Target, title: 'Taux de matching de 87%', desc: 'Notre IA trouve les profils qui correspondent vraiment à vos besoins.' },
    { icon: Shield, title: '100% des profils vérifiés', desc: 'Chaque candidat est validé par nos experts. Zéro risque, que des talents.' },
  ]

  const features = [
    'Recherche multi-critères ultra-précise',
    'Profils enrichis avec évaluations expertes',
    'Matching intelligent par IA',
    'Interface intuitive, zéro formation nécessaire',
    'Support dédié 7j/7',
    'Conformité RGPD garantie',
  ]

  const partnerCompanies = [
    { name: 'TechCorp', initials: 'TC' },
    { name: 'StartupHub', initials: 'SH' },
    { name: 'InnovateLab', initials: 'IL' },
    { name: 'FinancePlus', initials: 'FP' },
    { name: 'ConsultGroup', initials: 'CG' },
    { name: 'DigitalPro', initials: 'DP' },
    { name: 'HealthTech', initials: 'HT' },
    { name: 'RetailMax', initials: 'RM' },
    { name: 'DataFlow', initials: 'DF' },
    { name: 'CloudSync', initials: 'CS' },
    { name: 'AgileSoft', initials: 'AS' },
    { name: 'NextGen', initials: 'NG' },
  ]

  const sectorRows = [
    [
      { name: 'Technologie', icon: Cpu },
      { name: 'Finance', icon: Briefcase },
      { name: 'Santé', icon: HeartPulse },
      { name: 'Commerce', icon: ShoppingCart },
      { name: 'Industrie', icon: Factory },
      { name: 'Éducation', icon: GraduationCap },
      { name: 'BTP', icon: Building2 },
      { name: 'Logistique', icon: Truck },
      { name: 'Consulting', icon: Lightbulb },
      { name: 'Marketing', icon: Megaphone },
      { name: 'Juridique', icon: Scale },
      { name: 'Immobilier', icon: Home },
      { name: 'Environnement', icon: Leaf },
      { name: 'Startup', icon: Rocket },
      { name: 'E-commerce', icon: ShoppingBag },
    ],
    [
      { name: 'Biotech', icon: HeartPulse },
      { name: 'Médical', icon: HeartPulse },
      { name: 'Digital', icon: Cpu },
      { name: 'Cybersécurité', icon: Shield },
      { name: 'Assurance', icon: Shield },
      { name: 'Tourisme', icon: Home },
      { name: 'Sport', icon: Target },
      { name: 'Culture', icon: Leaf },
      { name: 'Design', icon: Target },
      { name: 'Ingénierie', icon: Factory },
      { name: 'R&D', icon: Lightbulb },
      { name: 'Public', icon: Users },
      { name: 'Innovation', icon: Rocket },
      { name: 'Télécom', icon: Cpu },
      { name: 'Événementiel', icon: Megaphone },
    ],
  ]

  const sectorColors = [
    '#226D68', '#e76f51', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#EC4899',
  ]
  const getSectorColor = (name) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return sectorColors[Math.abs(hash) % sectorColors.length]
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav compacte */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-12 md:h-14">
            <Link to="/" className="text-lg font-bold">
              <span className="text-[#226D68]">Yemma</span>
              <span className="text-[#e76f51]">-Solutions</span>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/how-it-works" className="text-sm font-medium text-[#2C2C2C] hover:text-[#226D68] transition-colors">
                Comment ça marche
              </Link>
              <Link to="/contact" className="text-sm font-medium text-[#2C2C2C] hover:text-[#226D68] transition-colors">
                Contact
              </Link>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}
                className="h-8 text-sm border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]">
                Connexion
              </Button>
              <Button size="sm" onClick={() => navigate('/register/company')}
                className="h-8 text-sm bg-[#226D68] hover:bg-[#1a5a55] text-white">
                Essai gratuit
              </Button>
            </div>
            <button className="md:hidden p-2 -mr-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t px-4 py-3 space-y-2">
            <Link to="/how-it-works" className="block text-sm py-2 text-[#2C2C2C]" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</Link>
            <Link to="/contact" className="block text-sm py-2 text-[#2C2C2C]" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}>Connexion</Button>
              <Button size="sm" className="flex-1 bg-[#226D68] hover:bg-[#1a5a55]" onClick={() => { navigate('/register/company'); setMobileMenuOpen(false) }}>Essai gratuit</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero - compact & pro */}
      <section className="relative pt-16 md:pt-20 pb-10 md:pb-12 overflow-hidden bg-gradient-to-br from-[#E8F4F3]/50 via-[#F4F6F8] to-[#E8F4F3]/30">

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
            <div className="lg:max-w-[55%]">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F4F3] text-[#226D68] text-[11px] font-semibold mb-3"
              >
                +500 entreprises
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2C2C] leading-tight mb-2.5 font-heading"
              >
                Recrutez les <span className="text-[#226D68]">meilleurs talents</span> en 48h
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-sm sm:text-base text-[#6b7280] mb-4 max-w-lg"
              >
                La plateforme RH qui réduit vos coûts de <strong className="text-[#226D68]">60%</strong> avec des candidats vérifiés par des experts.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="flex flex-col sm:flex-row gap-2 mb-4"
              >
                <Button
                  size="sm"
                  onClick={() => navigate('/register/company')}
                  className="h-9 px-4 text-sm font-semibold bg-[#226D68] hover:bg-[#1a5a55] text-white"
                >
                  Essai gratuit 14 jours
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/register/candidat')}
                  className="h-9 px-4 text-sm font-semibold border-[#e76f51] text-[#e76f51] hover:bg-[#FDF2F0]"
                >
                  Je suis candidat
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-wrap gap-3 text-[11px] text-[#6b7280]"
              >
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[#226D68]" /> Sans engagement</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[#226D68]" /> Support inclus</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid grid-cols-2 gap-2 sm:gap-3"
            >
              {stats.map((s, i) => {
                const Icon = s.icon
                const accentColors = ['#226D68', '#e76f51', '#226D68', '#e76f51']
                const accent = accentColors[i]
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                    className="bg-white rounded-lg p-3 border-l-4 shadow-sm hover:shadow-md transition-all"
                    style={{ borderLeftColor: accent }}
                  >
                    <Icon className="h-4 w-4 mb-1.5" style={{ color: accent }} />
                    <p className="text-lg sm:text-xl font-bold text-[#2C2C2C]">{s.value}</p>
                    <p className="text-[10px] sm:text-xs text-[#6b7280]">{s.label}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Secteurs d'activités - défilement animé */}
      <section className="py-8 md:py-10 bg-white overflow-hidden border-t border-b border-[#E8F4F3]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-1">
              Tous les <span className="text-[#226D68]">secteurs d'activités</span> couverts
            </h3>
            <p className="text-xs md:text-sm text-[#6b7280]">100+ secteurs représentés</p>
          </div>
          <div className="space-y-3 relative">
            <div className="absolute left-0 top-0 w-16 h-full z-20 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            <div className="absolute right-0 top-0 w-16 h-full z-20 pointer-events-none bg-gradient-to-l from-white to-transparent" />
            {sectorRows.map((row, rowIdx) => (
              <div key={rowIdx} className="relative flex overflow-hidden">
                <div className={`flex gap-2 ${rowIdx === 0 ? 'animate-scroll-right' : 'animate-scroll-left'}`}>
                  {[...row, ...row].map(({ name, icon: Icon }, idx) => {
                    const color = getSectorColor(name)
                    return (
                      <div
                        key={`${rowIdx}-${idx}`}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 cursor-default bg-gray-100 border border-gray-200 text-[#6b7280] hover:scale-105 hover:-translate-y-0.5"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = color
                          e.currentTarget.style.color = 'white'
                          e.currentTarget.style.borderColor = color
                          e.currentTarget.style.boxShadow = `0 4px 12px ${color}66`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6'
                          e.currentTarget.style.color = '#6b7280'
                          e.currentTarget.style.borderColor = '#e5e7eb'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                        {name}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits - Pourquoi 500+ entreprises nous font confiance */}
      <section id="benefits" className="py-10 md:py-12 bg-[#F4F6F8] overflow-hidden relative">
        {/* Subtle decorative background - flottant doux */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-0 w-64 h-64 bg-[#226D68]/5 rounded-full blur-3xl -translate-x-1/2 animate-benefits-float" style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#E8F4F3]/60 rounded-full blur-3xl translate-x-1/3 animate-benefits-float" style={{ animationDelay: '2s' }} />
        </div>

        <motion.div
          className="max-w-6xl mx-auto px-4 sm:px-6 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
            hidden: {},
          }}
        >
          <motion.div
            className="text-center mb-8"
            variants={{
              visible: { opacity: 1, y: 0 },
              hidden: { opacity: 0, y: 20 },
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h2 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-1 font-heading">
              Pourquoi{' '}
              <motion.span
                className="inline-block text-[#226D68]"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                500+ entreprises
              </motion.span>
              {' '}nous font confiance
            </h2>
            <motion.p
              className="text-sm text-[#6b7280]"
              variants={{
                visible: { opacity: 1 },
                hidden: { opacity: 0 },
              }}
              transition={{ delay: 0.3 }}
            >
              Résultats concrets, mesurables
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, i) => {
              const Icon = b.icon
              const isCoral = i % 2 === 1
              const accent = isCoral ? '#e76f51' : '#226D68'
              const accentBg = isCoral ? '#FDF2F0' : '#E8F4F3'
              return (
                <motion.div
                  key={i}
                  variants={{
                    visible: { opacity: 1, y: 0 },
                    hidden: { opacity: 0, y: 30 },
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="h-full"
                  >
                    <Card className="border-0 shadow-sm bg-white overflow-hidden h-full group cursor-default transition-all duration-300 hover:shadow-lg">
                      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
                      <CardContent className="p-4 relative">
                        <motion.div
                          className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                          style={{ backgroundColor: accentBg }}
                          whileHover={{ scale: 1.15, rotate: 8 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <Icon className="h-5 w-5" style={{ color: accent }} />
                        </motion.div>
                        <h3 className="font-semibold text-[#2C2C2C] text-sm mb-1">{b.title}</h3>
                        <p className="text-sm text-[#6b7280] leading-relaxed">{b.desc}</p>
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(to right, ${accent}, transparent)` }} />
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-8 md:py-10 bg-gradient-to-r from-[#E8F4F3]/40 via-white to-[#FDF2F0]/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-lg font-bold text-[#2C2C2C] mb-4 text-center">Tout inclus</h3>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {features.map((f, i) => (
              <span key={i} className="flex items-center gap-2 text-sm text-[#6b7280] animate-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${i % 2 === 0 ? 'text-[#226D68]' : 'text-[#e76f51]'}`} />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Entreprises qui nous font confiance - logos défilants */}
      <section className="py-6 md:py-8 bg-gradient-to-b from-[#F4F6F8] via-[#E8F4F3]/20 to-[#F4F6F8] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-4">
            <h2 className="text-lg md:text-xl font-bold text-[#2C2C2C]">
              Ils nous font <span className="text-[#226D68]">confiance</span>
            </h2>
            <p className="text-[11px] text-[#6b7280] mt-0.5">500+ entreprises</p>
          </div>

          <div className="space-y-2 relative">
            <div className="absolute left-0 top-0 w-12 h-full z-20 pointer-events-none bg-gradient-to-r from-[#F4F6F8] to-transparent" />
            <div className="absolute right-0 top-0 w-12 h-full z-20 pointer-events-none bg-gradient-to-l from-[#F4F6F8] to-transparent" />

            {/* Ligne 1 - défile vers la droite */}
            <div className="relative flex overflow-hidden">
              <div className="flex gap-3 animate-scroll-right-fast items-center">
                {[...partnerCompanies, ...partnerCompanies].map((company, idx) => (
                  <div
                    key={`row1-${idx}`}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-200 shadow-sm hover:border-[#226D68]/20 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#E8F4F3] flex items-center justify-center font-semibold text-[#226D68] text-[10px]">
                      {company.initials}
                    </div>
                    <span className="font-medium text-[#2C2C2C] text-xs whitespace-nowrap">{company.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ligne 2 - défile vers la gauche */}
            <div className="relative flex overflow-hidden">
              <div className="flex gap-3 animate-scroll-left-fast items-center">
                {[...partnerCompanies].reverse().concat([...partnerCompanies].reverse()).map((company, idx) => (
                  <div
                    key={`row2-${idx}`}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-200 shadow-sm hover:border-[#e76f51]/20 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-md bg-[#FDF2F0] flex items-center justify-center font-semibold text-[#e76f51] text-[10px]">
                      {company.initials}
                    </div>
                    <span className="font-medium text-[#2C2C2C] text-xs whitespace-nowrap">{company.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="py-10 md:py-12 bg-gradient-to-br from-[#226D68] via-[#1e5d59] to-[#1a5a55]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            Prêt à économiser 60% sur vos recrutements ?
          </h2>
          <p className="text-sm text-[#E8F4F3] mb-5">Essai gratuit 14 jours · Sans carte bancaire</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button size="lg" onClick={() => navigate('/register/company')}
              className="h-10 bg-white text-[#226D68] hover:bg-gray-100 font-semibold">
              Commencer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/demo/cvtheque')}
              className="h-10 border-white text-white hover:bg-white/10">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <Link to="/" className="text-base font-bold">
                <span className="text-[#226D68]">Yemma</span>
                <span className="text-[#e76f51]">-Solutions</span>
              </Link>
              <p className="text-xs text-gray-500 mt-1">Recrutement nouvelle génération</p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Entreprise</h4>
              <ul className="space-y-1 text-xs">
                <li><Link to="/how-it-works" className="hover:text-[#226D68] transition-colors">Comment ça marche</Link></li>
                <li><Link to="/contact" className="hover:text-[#226D68] transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Candidats</h4>
              <ul className="space-y-1 text-xs">
                <li><Link to="/register/candidat" className="hover:text-[#226D68] transition-colors">Créer un compte</Link></li>
                <li><Link to="/login" className="hover:text-[#226D68] transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Légal</h4>
              <ul className="space-y-1 text-xs">
                <li><Link to="/legal/mentions" className="hover:text-[#226D68] transition-colors">Mentions légales</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-[#226D68] transition-colors">Confidentialité</Link></li>
                <li><Link to="/legal/terms" className="hover:text-[#226D68] transition-colors">CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Yemma. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
