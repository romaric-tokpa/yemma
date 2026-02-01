import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowRight, CheckCircle2, Users, Briefcase, Search, Shield, 
  TrendingUp, Star, ChevronRight, Menu, X, Zap, Target, Award,
  BarChart3, Globe, Lock, Clock, DollarSign, CheckCircle,
  ArrowDown, Play, Timer, TrendingDown, Percent, Rocket, Heart, Eye,
  Cpu, Landmark, HeartPulse, ShoppingCart, Factory, GraduationCap, Building2,
  Truck, UtensilsCrossed, Lightbulb, Megaphone, Scale, Home, Sprout, Leaf,
  Radio, Gem, Car, Plane, Pill, ShieldCheck, MapPin, Trophy, Palette, Music,
  Ruler, Wrench, FlaskConical, Microscope, UserPlus, ShoppingBag, Smartphone,
  BookOpen, CalendarDays, Sparkles, Apple, Shirt, Box, Gamepad2, Film, BookMarked,
  Cloud, Server, Code2, ShieldAlert, Wallet, Layout, Layers, Mail, Share2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

export default function LandingPage() {
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

  // Couleurs personnalisées
  const primaryColor = '#226D68'
  const secondaryColor = '#e76f51'
  const primaryLight = '#E8F4F3'
  const secondaryLight = '#FDF2F0'

  const stats = [
    { value: '10,000+', label: 'Candidats vérifiés', icon: Users, color: 'primary' },
    { value: '48h', label: 'Temps moyen de recrutement', icon: Clock, color: 'secondary' },
    { value: '95%', label: 'Taux de satisfaction', icon: Star, color: 'primary' },
    { value: '3x', label: 'Plus rapide que les méthodes classiques', icon: Zap, color: 'secondary' }
  ]

  const benefits = [
    {
      icon: TrendingDown,
      title: 'Réduisez vos coûts de 60%',
      description: 'Fini les agences de recrutement coûteuses. Recrutez directement avec Yemma.',
      color: 'primary'
    },
    {
      icon: Timer,
      title: 'Gagnez 15h par semaine',
      description: 'Automatisez la recherche et le tri des candidats. Concentrez-vous sur l\'essentiel.',
      color: 'secondary'
    },
    {
      icon: Target,
      title: 'Taux de matching de 87%',
      description: 'Notre IA trouve les profils qui correspondent vraiment à vos besoins.',
      color: 'primary'
    },
    {
      icon: Shield,
      title: '100% des profils vérifiés',
      description: 'Chaque candidat est validé par nos experts. Zéro risque, que des talents.',
      color: 'secondary'
    }
  ]

  const features = [
    { text: 'Recherche multi-critères ultra-précise', icon: CheckCircle },
    { text: 'Profils enrichis avec évaluations expertes', icon: CheckCircle },
    { text: 'Matching intelligent par IA', icon: CheckCircle },
    { text: 'Interface intuitive, zéro formation nécessaire', icon: CheckCircle },
    { text: 'Support dédié 7j/7', icon: CheckCircle },
    { text: 'Conformité RGPD garantie', icon: CheckCircle }
  ]

  const testimonials = [
    {
      name: 'Sophie Martin',
      role: 'DRH, TechCorp (150 employés)',
      content: 'En 2 semaines, nous avons recruté 3 développeurs seniors. Yemma a divisé notre temps de recrutement par 4.',
      rating: 5,
      metric: '4x plus rapide'
    },
    {
      name: 'Jean Dupont',
      role: 'Fondateur, StartupHub',
      content: 'La qualité des profils vérifiés est exceptionnelle. Nous avons économisé 15 000€ en frais d\'agence cette année.',
      rating: 5,
      metric: '15k€ économisés'
    },
    {
      name: 'Marie Leclerc',
      role: 'Responsable RH, InnovateLab',
      content: 'Notre taux de rétention a augmenté de 40% depuis qu\'on utilise Yemma. Les candidats correspondent vraiment au poste.',
      rating: 5,
      metric: '+40% rétention'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Compacte */}
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
              <a href="#benefits" className="text-sm text-gray-700 transition-colors font-medium" style={{ '--hover-color': primaryColor }} onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                Avantages
              </a>
              <a href="#testimonials" className="text-sm text-gray-700 transition-colors font-medium" style={{ '--hover-color': primaryColor }} onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                Témoignages
              </a>
              <a href="/contact" className="text-sm text-gray-700 transition-colors font-medium" style={{ '--hover-color': primaryColor }} onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                Contact
              </a>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="text-sm h-9"
                style={{ borderColor: primaryColor, color: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryLight}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
              <a href="#benefits" className="block text-sm text-gray-700 py-2 transition-colors" style={{ '--hover-color': primaryColor }} onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'} onClick={() => setMobileMenuOpen(false)}>Avantages</a>
              <a href="#testimonials" className="block text-sm text-gray-700 py-2 transition-colors" style={{ '--hover-color': primaryColor }} onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'} onClick={() => setMobileMenuOpen(false)}>Témoignages</a>
              <div className="pt-2 space-y-2 border-t">
                <Button variant="outline" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="w-full text-sm h-9" style={{ borderColor: primaryColor, color: primaryColor }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryLight} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Connexion</Button>
                <Button onClick={() => { navigate('/register/company'); setMobileMenuOpen(false) }} className="w-full text-white text-sm h-9" style={{ backgroundColor: primaryColor }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}>Essai gratuit</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section Compacte */}
      <section className="pt-20 md:pt-24 pb-12 md:pb-16" style={{ background: `linear-gradient(135deg, ${primaryLight} 0%, #ffffff 50%, ${secondaryLight} 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: primaryLight, color: primaryColor }}>
                <Rocket className="h-3.5 w-3.5" />
                <span>+500 entreprises nous font confiance</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Recrutez les{' '}
                <span style={{ color: primaryColor }}>meilleurs talents</span>
                {' '}en{' '}
                <span style={{ color: secondaryColor }}>48h chrono</span>
              </h1>
              
              <p className="text-base md:text-lg text-gray-700 mb-6 max-w-xl mx-auto lg:mx-0 font-medium">
                La seule plateforme qui vous fait économiser <span className="font-bold" style={{ color: primaryColor }}>60% sur vos coûts de recrutement</span> tout en trouvant des candidats vérifiés par des experts.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                <Button
                  size="lg"
                  onClick={() => navigate('/register/company')}
                  className="text-white px-6 py-5 h-auto text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}
                >
                  Essai gratuit 14 jours
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/register/candidat')}
                  className="border-2 px-6 py-5 h-auto text-base font-semibold"
                  style={{ borderColor: secondaryColor, color: secondaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = secondaryLight }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  Je suis candidat
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} />
                  <span>Sans engagement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} />
                  <span>Annulation à tout moment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: primaryColor }} />
                  <span>Support inclus</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-xl p-6 shadow-2xl" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}>
                <div className="bg-white rounded-lg p-5">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {stats.slice(0, 2).map((stat, idx) => {
                      const Icon = stat.icon
                      const bgColor = stat.color === 'primary' ? primaryLight : secondaryLight
                      const textColor = stat.color === 'primary' ? primaryColor : secondaryColor
                      return (
                        <div key={idx} className="rounded-lg p-3" style={{ backgroundColor: bgColor }}>
                          <Icon className="h-5 w-5 mb-1" style={{ color: textColor }} />
                          <p className="text-xl font-bold" style={{ color: textColor }}>{stat.value}</p>
                          <p className="text-xs text-gray-600">{stat.label}</p>
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.slice(2).map((stat, idx) => {
                      const Icon = stat.icon
                      const bgColor = stat.color === 'primary' ? primaryLight : secondaryLight
                      const textColor = stat.color === 'primary' ? primaryColor : secondaryColor
                      return (
                        <div key={idx} className="rounded-lg p-3" style={{ backgroundColor: bgColor }}>
                          <Icon className="h-5 w-5 mb-1" style={{ color: textColor }} />
                          <p className="text-xl font-bold" style={{ color: textColor }}>{stat.value}</p>
                          <p className="text-xs text-gray-600">{stat.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-full h-full rounded-xl -z-10" style={{ backgroundColor: secondaryColor + '33' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Secteurs d'activités - Défilement Compact */}
      <section className="py-8 md:py-10 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header compact */}
          <div className="text-center mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">
              Tous les <span style={{ color: primaryColor }}>secteurs d'activités</span> couverts
            </h3>
            <p className="text-xs md:text-sm text-gray-600">
              Plus de <span className="font-semibold" style={{ color: primaryColor }}>100 secteurs</span> représentés
            </p>
          </div>
          
          {/* Mapping secteur → icône (lucide-react) + couleur par nom */}
          {(() => {
            const getSectorColor = (sectorName) => {
              const colors = [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
                '#14B8A6', '#A855F7', '#EAB308', '#22C55E', '#F43F5E',
                '#0EA5E9', '#64748B', '#DC2626', '#059669', '#7C3AED',
                '#BE185D', '#0369A1', '#B45309', '#7E22CE', '#0D9488',
                '#C2410C', '#1E40AF', '#047857', '#B91C1C', '#6D28D9',
              ]
              let hash = 0
              for (let i = 0; i < sectorName.length; i++) {
                hash = sectorName.charCodeAt(i) + ((hash << 5) - hash)
              }
              return colors[Math.abs(hash) % colors.length]
            }

            const SECTOR_ICONS = {
              'Technologie & Informatique': Cpu,
              'Finance & Banque': Landmark,
              'Santé & Médical': HeartPulse,
              'Commerce & Distribution': ShoppingCart,
              'Industrie & Production': Factory,
              'Éducation & Formation': GraduationCap,
              'Construction & BTP': Building2,
              'Transport & Logistique': Truck,
              'Hôtellerie & Restauration': UtensilsCrossed,
              'Consulting & Conseil': Lightbulb,
              'Marketing & Communication': Megaphone,
              'Juridique & Droit': Scale,
              'Immobilier': Home,
              'Agriculture & Agroalimentaire': Sprout,
              'Énergie & Environnement': Leaf,
              'Média & Audiovisuel': Radio,
              'Luxe & Mode': Gem,
              'Automobile': Car,
              'Aéronautique': Plane,
              'Pharmaceutique': Pill,
              'Assurance': ShieldCheck,
              'Tourisme': MapPin,
              'Sport & Loisirs': Trophy,
              'Culture & Art': Palette,
              'Design & Architecture': Ruler,
              'Ingénierie': Wrench,
              'Recherche & Développement': FlaskConical,
              'Public & Associatif': Users,
              'Startup & Innovation': Rocket,
              'E-commerce': ShoppingBag,
              'Télécom': Smartphone,
              'Édition & Presse': BookOpen,
              'Événementiel': CalendarDays,
              'RH & Recrutement': UserPlus,
              'Formation & Coaching': GraduationCap,
              'Beauté & Bien-être': Sparkles,
              'Alimentaire': Apple,
              'Textile': Shirt,
              'Chimie': FlaskConical,
              'Métallurgie': Wrench,
              'Électronique': Cpu,
              'Plastique': Box,
              'Bois & Mobilier': Box,
              'Joaillerie & Horlogerie': Gem,
              'Divertissement': Gamepad2,
              'Jeux & Gaming': Gamepad2,
              'Musique': Music,
              'Cinéma': Film,
              'Théâtre': Music,
              'Littérature': BookMarked,
              'Biotechnologie': Microscope,
              'Médical & Paramédical': HeartPulse,
              'Vétérinaire': HeartPulse,
              'Cosmétique & Parfumerie': Sparkles,
              'Divertissement Digital': Gamepad2,
              'Streaming': Radio,
              'Social Media': Share2,
              'Content Creation': Layers,
              'Publishing': BookOpen,
              'News & Média': Radio,
              'Advertising': Megaphone,
              'Digital Marketing': Megaphone,
              'SEO & SEM': Search,
              'Branding': Gem,
              'Graphic Design': Palette,
              'Web Design': Layout,
              'UI/UX Design': Layout,
              'Product Design': Box,
              'Fashion Design': Shirt,
              'Interior Design': Home,
              'Urban Planning': MapPin,
              'Landscape Architecture': Sprout,
              'Civil Engineering': Building2,
              'Mechanical Engineering': Wrench,
              'Electrical Engineering': Zap,
              'Chemical Engineering': FlaskConical,
              'Aerospace Engineering': Plane,
              'Biomedical Engineering': HeartPulse,
              'Environmental Engineering': Leaf,
              'Software Engineering': Code2,
              'Data Engineering': Server,
              'ML Engineering': Cpu,
              'DevOps': Cloud,
              'Cloud Computing': Cloud,
              'Cybersecurity': ShieldAlert,
              'Network Security': Shield,
              'Information Security': Lock,
              'Compliance': Scale,
              'Risk Management': ShieldAlert,
              'Audit': BookOpen,
              'Tax & Accounting': Landmark,
              'Financial Planning': Wallet,
              'Investment Banking': Landmark,
              'Private Equity': Landmark,
              'Venture Capital': Rocket,
              'Asset Management': Landmark,
              'Wealth Management': Gem,
              'Life Insurance': ShieldCheck,
              'Health Insurance': HeartPulse,
              'Property Insurance': Home,
            }

            const getSectorIcon = (sectorName) => SECTOR_ICONS[sectorName] ?? Briefcase

            const sectorsRow1 = [
              'Technologie & Informatique',
              'Finance & Banque',
              'Santé & Médical',
              'Commerce & Distribution',
              'Industrie & Production',
              'Éducation & Formation',
              'Construction & BTP',
              'Transport & Logistique',
              'Hôtellerie & Restauration',
              'Consulting & Conseil',
              'Marketing & Communication',
              'Juridique & Droit',
              'Immobilier',
              'Agriculture & Agroalimentaire',
              'Énergie & Environnement',
              'Média & Audiovisuel',
              'Luxe & Mode',
              'Automobile',
              'Aéronautique',
              'Pharmaceutique',
              'Assurance',
              'Tourisme',
              'Sport & Loisirs',
              'Culture & Art',
              'Design & Architecture',
              'Ingénierie',
              'Recherche & Développement',
              'Public & Associatif',
              'Startup & Innovation',
              'E-commerce',
              'Télécom',
              'Édition & Presse',
              'Événementiel',
              'RH & Recrutement',
              'Formation & Coaching',
              'Beauté & Bien-être',
              'Alimentaire',
              'Textile',
              'Chimie',
              'Métallurgie',
              'Électronique',
              'Plastique',
              'Bois & Mobilier',
              'Joaillerie & Horlogerie',
              'Divertissement',
              'Jeux & Gaming',
              'Musique',
              'Cinéma',
              'Théâtre',
              'Littérature'
            ]
            
            const sectorsRow2 = [
              'Biotechnologie',
              'Médical & Paramédical',
              'Vétérinaire',
              'Cosmétique & Parfumerie',
              'Divertissement Digital',
              'Streaming',
              'Social Media',
              'Content Creation',
              'Publishing',
              'News & Média',
              'Advertising',
              'Digital Marketing',
              'SEO & SEM',
              'Branding',
              'Graphic Design',
              'Web Design',
              'UI/UX Design',
              'Product Design',
              'Fashion Design',
              'Interior Design',
              'Urban Planning',
              'Landscape Architecture',
              'Civil Engineering',
              'Mechanical Engineering',
              'Electrical Engineering',
              'Chemical Engineering',
              'Aerospace Engineering',
              'Biomedical Engineering',
              'Environmental Engineering',
              'Software Engineering',
              'Data Engineering',
              'ML Engineering',
              'DevOps',
              'Cloud Computing',
              'Cybersecurity',
              'Network Security',
              'Information Security',
              'Compliance',
              'Risk Management',
              'Audit',
              'Tax & Accounting',
              'Financial Planning',
              'Investment Banking',
              'Private Equity',
              'Venture Capital',
              'Asset Management',
              'Wealth Management',
              'Life Insurance',
              'Health Insurance',
              'Property Insurance'
            ]
            
            const SectorBadge = ({ sector, idx, prefix = '' }) => {
              const sectorColor = getSectorColor(sector)
              const Icon = getSectorIcon(sector)
              return (
                <div
                  key={`${prefix}-${idx}`}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = sectorColor
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.borderColor = sectorColor
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${sectorColor}66`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6'
                    e.currentTarget.style.color = '#6b7280'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  <span>{sector}</span>
                </div>
              )
            }
            
            return (
              <div className="space-y-3 relative">
                {/* Masques de fade */}
                <div className="absolute left-0 top-0 w-20 h-full z-20 pointer-events-none" style={{ background: 'linear-gradient(to right, white, transparent)' }}></div>
                <div className="absolute right-0 top-0 w-20 h-full z-20 pointer-events-none" style={{ background: 'linear-gradient(to left, white, transparent)' }}></div>
                
                {/* Première ligne : défile de droite à gauche */}
                <div className="relative flex overflow-hidden">
                  <div className="flex animate-scroll-right gap-2">
                    {[...sectorsRow1, ...sectorsRow1].map((sector, idx) => (
                      <SectorBadge key={`row1-${idx}`} sector={sector} idx={idx} prefix="row1" />
                    ))}
                  </div>
                </div>

                {/* Deuxième ligne : défile de gauche à droite */}
                <div className="relative flex overflow-hidden">
                  <div className="flex animate-scroll-left gap-2">
                    {[...sectorsRow2, ...sectorsRow2].map((sector, idx) => (
                      <SectorBadge key={`row2-${idx}`} sector={sector} idx={idx} prefix="row2" />
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* Benefits Section Compacte */}
      <section id="benefits" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Pourquoi <span style={{ color: primaryColor }}>500+ entreprises</span> choisissent Yemma ?
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              Des résultats concrets, mesurables et rapides
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon
              const bgColor = benefit.color === 'primary' ? primaryLight : secondaryLight
              const textColor = benefit.color === 'primary' ? primaryColor : secondaryColor
              return (
                <Card key={idx} className="border-2 transition-all hover:shadow-md" style={{ borderColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor + '66'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bgColor }}>
                        <Icon className="h-6 w-6" style={{ color: textColor }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features List Compacte */}
      <section className="py-10 md:py-12" style={{ background: `linear-gradient(135deg, ${primaryLight} 0%, ${secondaryLight} 100%)` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">
              Tout ce dont vous avez besoin, inclus
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, idx) => {
                const Icon = feature.icon
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <Icon className="h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
                    <span className="text-sm text-gray-700">{feature.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Compactes */}
      <section id="testimonials" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Ils ont <span style={{ color: secondaryColor }}>transformé</span> leur recrutement
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              Des résultats réels, des économies mesurables
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="bg-white border-2 transition-all hover:shadow-md" style={{ borderColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = secondaryColor + '66'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                <CardContent className="p-5">
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4" style={{ fill: secondaryColor, color: secondaryColor }} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-4 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                      <p className="text-xs text-gray-600">{testimonial.role}</p>
                    </div>
                    <div className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: secondaryLight, color: secondaryColor }}>
                      {testimonial.metric}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Finale Compacte */}
      <section className="py-12 md:py-16" style={{ background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Prêt à économiser 60% sur vos recrutements ?
          </h2>
          <p className="text-base md:text-lg mb-6" style={{ color: primaryLight }}>
            Rejoignez 500+ entreprises. Essai gratuit 14 jours, sans carte bancaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/register/company')}
              className="bg-white hover:bg-gray-100 px-8 py-5 h-auto text-base font-semibold shadow-lg"
              style={{ color: primaryColor }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/demo/cvtheque')}
              className="border-2 border-white text-white px-8 py-5 h-auto text-base font-semibold"
              style={{ borderColor: 'white', color: 'white' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <Eye className="mr-2 h-5 w-5" />
              Voir la démo
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white px-8 py-5 h-auto text-base font-semibold"
              style={{ borderColor: 'white', color: 'white' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              J'ai déjà un compte
            </Button>
          </div>
          <p className="text-xs mt-4" style={{ color: primaryLight }}>
            ✓ Sans engagement • ✓ Annulation à tout moment • ✓ Support 7j/7
          </p>
        </div>
      </section>

      {/* Footer Compact */}
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
                <li><a href="#benefits" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Avantages</a></li>
                <li><a href="#testimonials" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Témoignages</a></li>
                <li><a href="/contact" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2 text-sm">Candidats</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="/register/candidat" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Créer un compte</a></li>
                <li><a href="/login" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Se connecter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2 text-sm">Légal</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="/legal/mentions" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Mentions légales</a></li>
                <li><a href="/legal/privacy" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Confidentialité</a></li>
                <li><a href="/legal/terms" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>CGU</a></li>
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
