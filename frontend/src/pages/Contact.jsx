import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Mail, Phone, MessageCircle, Send, MapPin, Clock, 
  Menu, X, CheckCircle2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function Contact() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

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
  const contactEmail = 'contact@yemma-solutions.com'
  const contactPhone = '+225 07 98 87 26 72'
  const whatsappLink = `https://wa.me/2250798872672`

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Nom: ${formData.name}\nEmail: ${formData.email}\nTéléphone: ${formData.phone}\n\nMessage:\n${formData.message}`
      )}`
      window.location.href = mailtoLink

      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <a href="/#benefits" className="text-sm text-gray-700 transition-colors font-medium" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                Avantages
              </a>
              <a href="/#testimonials" className="text-sm text-gray-700 transition-colors font-medium" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                Témoignages
              </a>
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
              <a href="/#benefits" className="block text-sm text-gray-700 py-2 transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'} onClick={() => setMobileMenuOpen(false)}>Avantages</a>
              <a href="/#testimonials" className="block text-sm text-gray-700 py-2 transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#374151'} onClick={() => setMobileMenuOpen(false)}>Témoignages</a>
              <div className="pt-2 space-y-2 border-t">
                <Button variant="outline" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }} className="w-full text-sm h-9" style={{ borderColor: primaryColor, color: primaryColor }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryLight }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>Connexion</Button>
                <Button onClick={() => { navigate('/register/company'); setMobileMenuOpen(false) }} className="w-full text-white text-sm h-9" style={{ backgroundColor: primaryColor }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}>Essai gratuit</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section Compact */}
      <section className="relative pt-20 md:pt-24 pb-8 md:pb-10 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryLight} 0%, #ffffff 50%, ${secondaryLight} 100%)` }}>
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ backgroundColor: secondaryColor }}></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ backgroundColor: primaryLight }}>
              <MessageCircle className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-xs font-semibold" style={{ color: primaryColor }}>Contactez-nous</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ color: '#1a293e' }}>
              Parlons de votre projet
            </h1>
            <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto">
              Notre équipe est là pour répondre à toutes vos questions.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section Compact */}
      <section className="py-8 md:py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              
              {/* Informations de contact compactes */}
              <div className="lg:col-span-1 space-y-3">
                <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryLight }}>
                        <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1.5" style={{ color: primaryColor }}>Email</h3>
                        <a 
                          href={`mailto:${contactEmail}`}
                          className="text-xs text-gray-700 hover:underline break-all"
                          style={{ color: primaryColor }}
                          onMouseEnter={(e) => e.target.style.color = '#1a5a55'}
                          onMouseLeave={(e) => e.target.style.color = primaryColor}
                        >
                          {contactEmail}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                        <Phone className="w-4 h-4" style={{ color: secondaryColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1.5" style={{ color: secondaryColor }}>Téléphone</h3>
                        <a 
                          href={`tel:${contactPhone.replace(/\s/g, '')}`}
                          className="text-xs hover:underline block mb-2"
                          style={{ color: secondaryColor }}
                          onMouseEnter={(e) => e.target.style.color = '#d45a3f'}
                          onMouseLeave={(e) => e.target.style.color = secondaryColor}
                        >
                          {contactPhone}
                        </a>
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all"
                          style={{ backgroundColor: '#25D366', color: 'white' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#20BA5A' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#25D366' }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: primaryLight }}>
                        <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1" style={{ color: primaryColor }}>Adresse</h3>
                        <p className="text-xs text-gray-700">
                          Abidjan, Côte d&apos;Ivoire
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: secondaryColor }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: secondaryLight }}>
                        <Clock className="w-4 h-4" style={{ color: secondaryColor }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm mb-1" style={{ color: secondaryColor }}>Horaires</h3>
                        <p className="text-xs text-gray-700 mb-0.5">Lun-Ven : 9h-18h</p>
                        <p className="text-xs text-gray-700">Sam : 9h-13h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Formulaire de contact compact */}
              <div className="lg:col-span-2">
                <Card className="shadow-md border-0">
                  <CardContent className="p-5 md:p-6">
                    <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                      Envoyez-nous un message
                    </h2>

                    {submitStatus === 'success' && (
                      <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs" style={{ backgroundColor: primaryLight, border: `1px solid ${primaryColor}` }}>
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                        <p style={{ color: primaryColor }}>
                          Message envoyé avec succès ! Nous vous répondrons rapidement.
                        </p>
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs bg-red-50 border border-red-200">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                        <p className="text-red-600">
                          Erreur lors de l&apos;envoi. Contactez-nous directement.
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <Label htmlFor="name" className="text-xs font-medium text-gray-700 mb-1.5 block">
                            Nom complet *
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full h-9 text-sm"
                            placeholder="Votre nom"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-xs font-medium text-gray-700 mb-1.5 block">
                            Email *
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full h-9 text-sm"
                            placeholder="votre@email.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        <div>
                          <Label htmlFor="phone" className="text-xs font-medium text-gray-700 mb-1.5 block">
                            Téléphone
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full h-9 text-sm"
                            placeholder="+225 XX XX XX XX XX"
                          />
                        </div>
                        <div>
                          <Label htmlFor="subject" className="text-xs font-medium text-gray-700 mb-1.5 block">
                            Sujet *
                          </Label>
                          <Input
                            id="subject"
                            name="subject"
                            type="text"
                            required
                            value={formData.subject}
                            onChange={handleInputChange}
                            className="w-full h-9 text-sm"
                            placeholder="Sujet de votre message"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="message" className="text-xs font-medium text-gray-700 mb-1.5 block">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          required
                          value={formData.message}
                          onChange={handleInputChange}
                          className="w-full min-h-[120px] text-sm"
                          placeholder="Décrivez votre demande ou votre projet..."
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="text-white flex-1 h-10 text-sm"
                          style={{ backgroundColor: primaryColor }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor }}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                              Envoi...
                            </>
                          ) : (
                            <>
                              Envoyer
                              <Send className="w-3.5 h-3.5 ml-2" />
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => window.open(whatsappLink, '_blank')}
                          className="flex-1 h-10 text-sm"
                          style={{ borderColor: '#25D366', color: '#25D366' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E8F5E9' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-2" />
                          WhatsApp
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
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
                <li><a href="/#benefits" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Avantages</a></li>
                <li><a href="/#testimonials" className="transition-colors" onMouseEnter={(e) => e.target.style.color = primaryColor} onMouseLeave={(e) => e.target.style.color = '#9CA3AF'}>Témoignages</a></li>
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
