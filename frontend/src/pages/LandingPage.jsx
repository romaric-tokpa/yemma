import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

  const testimonials = [
    { name: 'Sophie Martin', role: 'DRH, TechCorp (150 employés)', content: 'En 2 semaines, nous avons recruté 3 développeurs seniors. Yemma a divisé notre temps de recrutement par 4.', metric: '4x plus rapide' },
    { name: 'Jean Dupont', role: 'Fondateur, StartupHub', content: 'La qualité des profils vérifiés est exceptionnelle. Nous avons économisé 15 000€ en frais d\'agence cette année.', metric: '15k€ économisés' },
    { name: 'Marie Leclerc', role: 'Responsable RH, InnovateLab', content: 'Notre taux de rétention a augmenté de 40% depuis qu\'on utilise Yemma. Les candidats correspondent vraiment au poste.', metric: '+40% rétention' },
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

      {/* Hero */}
      <section className="pt-16 md:pt-20 pb-10 md:pb-14 bg-[#F4F6F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F4F3] text-[#226D68] text-xs font-semibold mb-4">
                <Star className="h-3.5 w-3.5" /> +500 entreprises
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2C2C] leading-tight mb-3">
                Recrutez les{' '}
                <span className="text-[#226D68]">meilleurs talents</span>
                {' '}en 48h
              </h1>
              <p className="text-sm sm:text-base text-[#6b7280] mb-5 max-w-lg">
                La plateforme RH qui réduit vos coûts de recrutement de <strong className="text-[#226D68]">60%</strong> tout en vous donnant accès à des candidats vérifiés par des experts.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mb-5">
                <Button size="lg" onClick={() => navigate('/register/company')}
                  className="h-10 px-5 text-sm font-semibold bg-[#226D68] hover:bg-[#1a5a55] text-white">
                  Essai gratuit 14 jours
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/register/candidat')}
                  className="h-10 px-5 text-sm font-semibold border-[#e76f51] text-[#e76f51] hover:bg-[#FDF2F0]">
                  Je suis candidat
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-[#6b7280]">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#226D68]" /> Sans engagement</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[#226D68]" /> Support inclus</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {stats.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-100 shadow-sm animate-in transition-transform hover:scale-[1.02]">
                    <Icon className="h-5 w-5 text-[#226D68] mb-1.5" />
                    <p className="text-lg sm:text-xl font-bold text-[#2C2C2C]">{s.value}</p>
                    <p className="text-[10px] sm:text-xs text-[#6b7280]">{s.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Secteurs d'activités - défilement animé */}
      <section className="py-8 md:py-10 bg-white overflow-hidden">
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

      {/* Benefits */}
      <section id="benefits" className="py-10 md:py-12 bg-[#F4F6F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-1">
              Pourquoi <span className="text-[#226D68]">500+ entreprises</span> nous font confiance
            </h2>
            <p className="text-sm text-[#6b7280]">Résultats concrets, mesurables</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <Card key={i} className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}>
                  <CardContent className="p-4">
                    <div className="w-9 h-9 rounded-lg bg-[#E8F4F3] flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-[#226D68]" />
                    </div>
                    <h3 className="font-semibold text-[#2C2C2C] text-sm mb-1">{b.title}</h3>
                    <p className="text-sm text-[#6b7280] leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-lg font-bold text-[#2C2C2C] mb-4 text-center">Tout inclus</h3>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {features.map((f, i) => (
              <span key={i} className="flex items-center gap-2 text-sm text-[#6b7280] animate-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
                <CheckCircle2 className="h-4 w-4 text-[#226D68] shrink-0" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 md:py-12 bg-[#F4F6F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#2C2C2C] mb-1">
              Ils ont <span className="text-[#e76f51]">transformé</span> leur recrutement
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-0 shadow-sm bg-white animate-in transition-all hover:shadow-md" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}>
                <CardContent className="p-4">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((_) => (
                      <Star key={_} className="h-3.5 w-3.5 fill-[#e76f51] text-[#e76f51]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#2C2C2C] mb-3 italic">"{t.content}"</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-[#2C2C2C]">{t.name}</p>
                      <p className="text-xs text-[#6b7280]">{t.role}</p>
                    </div>
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-[#FDF2F0] text-[#e76f51]">{t.metric}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="py-10 md:py-12 bg-[#226D68]">
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
