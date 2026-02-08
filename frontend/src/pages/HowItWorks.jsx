import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText, ArrowRight, Menu, X, UserPlus, FileCheck, Search,
  CheckCircle, Building, Users, Shield, Clock, Star, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HowItWorks() {
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

  const candidateSteps = [
    {
      icon: UserPlus,
      title: 'Créez votre compte',
      description: 'Inscrivez-vous gratuitement en quelques clics avec votre email.'
    },
    {
      icon: FileCheck,
      title: 'Complétez votre profil',
      description: 'Renseignez vos expériences, compétences, formations et téléchargez votre CV.'
    },
    {
      icon: Shield,
      title: 'Validation par nos experts',
      description: 'Notre équipe vérifie et valide votre profil pour garantir sa qualité.'
    },
    {
      icon: Star,
      title: 'Soyez visible',
      description: 'Votre profil validé devient visible par les recruteurs de confiance.'
    }
  ]

  const recruiterSteps = [
    {
      icon: Building,
      title: 'Créez votre compte entreprise',
      description: 'Inscrivez votre entreprise et configurez votre espace recruteur.'
    },
    {
      icon: Search,
      title: 'Accédez à la CVthèque',
      description: 'Parcourez notre base de candidats validés avec des filtres avancés.'
    },
    {
      icon: Users,
      title: 'Contactez les talents',
      description: 'Entrez en contact direct avec les candidats qui correspondent à vos besoins.'
    },
    {
      icon: CheckCircle,
      title: 'Recrutez en confiance',
      description: 'Tous nos candidats sont vérifiés pour vous garantir des profils de qualité.'
    }
  ]

  const advantages = [
    {
      icon: Shield,
      title: 'Profils vérifiés',
      description: 'Chaque candidat est validé par notre équipe d\'experts.'
    },
    {
      icon: Clock,
      title: 'Gain de temps',
      description: 'Accédez directement à des profils qualifiés et pertinents.'
    },
    {
      icon: Zap,
      title: 'Mise en relation rapide',
      description: 'Contactez les candidats en quelques clics.'
    },
    {
      icon: Star,
      title: 'Qualité garantie',
      description: 'Une sélection rigoureuse pour des recrutements réussis.'
    }
  ]

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

      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 pb-8 md:pb-12 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryLight} 0%, #ffffff 50%, ${secondaryLight} 100%)` }}>
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ backgroundColor: secondaryColor }}></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: primaryLight }}>
              <FileText className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-xs font-semibold" style={{ color: primaryColor }}>Guide</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ color: '#1a293e' }}>
              Comment ça marche ?
            </h1>
            <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto">
              Découvrez comment Yemma Solutions connecte candidats qualifiés et entreprises de confiance en quelques étapes simples.
            </p>
          </div>
        </div>
      </section>

      {/* Candidats Section */}
      <section className="py-10 md:py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: primaryColor }}>
                Pour les candidats
              </h2>
              <p className="text-sm text-gray-600">
                Valorisez votre profil et accédez à des opportunités de qualité
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {candidateSteps.map((step, index) => (
                <Card key={index} className="relative border-t-4 shadow-sm hover:shadow-md transition-shadow" style={{ borderTopColor: primaryColor }}>
                  <CardContent className="p-4 text-center">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: primaryColor }}>
                      {index + 1}
                    </div>
                    <div className="mt-4 mb-3 mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryLight }}>
                      <step.icon className="w-6 h-6" style={{ color: primaryColor }} />
                    </div>
                    <h3 className="font-semibold text-sm mb-2" style={{ color: '#1a293e' }}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-6">
              <Button
                onClick={() => navigate('/register/candidat')}
                className="text-white h-10 text-sm"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}
              >
                Créer mon profil candidat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recruteurs Section */}
      <section className="py-10 md:py-14" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: secondaryColor }}>
                Pour les recruteurs
              </h2>
              <p className="text-sm text-gray-600">
                Accédez à une CVthèque de candidats vérifiés et qualifiés
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recruiterSteps.map((step, index) => (
                <Card key={index} className="relative border-t-4 shadow-sm hover:shadow-md transition-shadow bg-white" style={{ borderTopColor: secondaryColor }}>
                  <CardContent className="p-4 text-center">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: secondaryColor }}>
                      {index + 1}
                    </div>
                    <div className="mt-4 mb-3 mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: secondaryLight }}>
                      <step.icon className="w-6 h-6" style={{ color: secondaryColor }} />
                    </div>
                    <h3 className="font-semibold text-sm mb-2" style={{ color: '#1a293e' }}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-6">
              <Button
                onClick={() => navigate('/register/company')}
                className="text-white h-10 text-sm"
                style={{ backgroundColor: secondaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d45a3f' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = secondaryColor }}
              >
                Créer mon compte recruteur
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages Section */}
      <section className="py-10 md:py-14 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#1a293e' }}>
                Pourquoi choisir Yemma Solutions ?
              </h2>
              <p className="text-sm text-gray-600">
                Une plateforme pensée pour simplifier le recrutement
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {advantages.map((advantage, index) => (
                <Card key={index} className="shadow-sm hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: index % 2 === 0 ? primaryColor : secondaryColor }}>
                  <CardContent className="p-4">
                    <div className="mb-3 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: index % 2 === 0 ? primaryLight : secondaryLight }}>
                      <advantage.icon className="w-5 h-5" style={{ color: index % 2 === 0 ? primaryColor : secondaryColor }} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1" style={{ color: '#1a293e' }}>
                      {advantage.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {advantage.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 border-t border-gray-100" style={{ background: `linear-gradient(135deg, ${primaryLight} 0%, #ffffff 100%)` }}>
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-lg md:text-xl font-bold mb-3" style={{ color: '#1a293e' }}>
              Prêt à commencer ?
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Rejoignez Yemma Solutions et découvrez une nouvelle façon de recruter ou de trouver votre prochain emploi.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/register/candidat')}
                className="text-white h-10 text-sm"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}
              >
                Je suis candidat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/register/company')}
                variant="outline"
                className="h-10 text-sm"
                style={{ borderColor: secondaryColor, color: secondaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = secondaryLight }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Je suis recruteur
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
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
                <li><Link to="/how-it-works" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Comment ça marche</Link></li>
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
