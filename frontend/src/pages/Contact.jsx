import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, UserCheck, Euro, ArrowRight, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { SEO } from '@/components/seo/SEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    contactType: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const contactEmail = 'contact@yemma-solutions.com'
  const whatsappLink = 'https://wa.me/2250798872672'

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(
        formData.contactType ? `[${formData.contactType}] Contact` : 'Contact'
      )}&body=${encodeURIComponent(
        `Prénom: ${formData.firstName}\nNom: ${formData.lastName}\nEmail: ${formData.email}\nTéléphone: ${formData.phone}\nType: ${formData.contactType}\n\nMessage:\n${formData.message}`
      )}`
      window.location.href = mailtoLink
      setSubmitStatus('success')
      setFormData({ firstName: '', lastName: '', email: '', phone: '', contactType: '', message: '' })
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SEO
        title="Contact - Recrutement et emploi"
        description="Contactez Yemma Solutions pour vos besoins en recrutement. Plateforme de recrutement, CVthèque, candidats vérifiés. Réponse rapide."
        keywords="contact recrutement, contact Yemma, plateforme recrutement contact"
        canonical="/contact"
      />
      <PublicPageLayout title="" subtitle="" badge={null}>
        <section className="pt-20 md:pt-24 pb-10 md:pb-14 overflow-x-hidden" style={{ backgroundColor: '#F0F7F6' }}>
          <div className="max-w-6xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8 w-full max-w-[100vw]">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              {/* Colonne gauche - Qui sommes-nous */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] mb-2">Contactez-nous dès maintenant !</h1>
                <h2 className="text-lg font-bold text-[#2C2C2C] mb-4">Qui sommes-nous ?</h2>
                <div className="space-y-4 text-sm text-[#374151] leading-relaxed">
                  <p>
                    Yemma Solutions est la plateforme sélective des profils préqualifiés pour le recrutement.
                  </p>
                  <p>
                    Nous accompagnons entreprises et candidats dans leur quête des meilleures collaborations. Une CVthèque de profils validés par des experts RH, avec matching et scoring pour des recrutements rapides et ciblés.
                  </p>
                  <p>
                    Constituée de passionnés, adossée à une technologie forte, notre équipe a fait siennes les valeurs de Qualité, de Transparence et d&apos;Engagement.
                  </p>
                </div>
                <h3 className="text-base font-bold text-[#2C2C2C] mt-8 mb-4">Nos points forts :</h3>
                <ul className="space-y-3">
                  {[
                    { icon: Shield, text: 'Profils validés à 100 % par des experts RH' },
                    { icon: UserCheck, text: 'Matching et scoring pour des recrutements ciblés' },
                    { icon: UserCheck, text: 'Accompagnement personnalisé candidats et entreprises' },
                    { icon: Euro, text: 'Économies jusqu\'à 60 % sur les coûts de recrutement' },
                  ].map((item, i) => {
                    const Icon = item.icon
                    return (
                      <li key={i} className="flex items-center gap-3 text-sm text-[#374151]">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-[#226D68]" strokeWidth={1.5} />
                        </div>
                        {item.text}
                      </li>
                    )
                  })}
                </ul>

                {/* Contact WhatsApp */}
                <div className="mt-8">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-[#25D366] text-white hover:bg-[#20BA5A] transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Nous contacter par WhatsApp
                  </a>
                </div>
              </div>

              {/* Colonne droite - Formulaire */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <h2 className="text-base font-bold text-[#2C2C2C] mb-6">Envoyez-nous un message</h2>
                {submitStatus === 'success' && (
                  <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs bg-[#E8F4F3] border border-[#226D68]/30 text-[#226D68]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Message envoyé avec succès ! Nous vous répondrons rapidement.
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs bg-red-50 border border-red-200 text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Erreur lors de l&apos;envoi. Contactez-nous directement.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-[#374151]">
                        Prénom *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="h-10 mt-1.5 border-gray-200 w-full min-w-0"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-[#374151]">
                        Nom *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="h-10 mt-1.5 border-gray-200 w-full min-w-0"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-[#374151]">
                      Email professionnel *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-10 mt-1.5 border-gray-200 w-full min-w-0"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-[#374151]">
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-10 mt-1.5 border-gray-200 w-full min-w-0"
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactType" className="text-sm font-medium text-[#374151]">
                      Type de contact *
                    </Label>
                    <select
                      id="contactType"
                      name="contactType"
                      required
                      value={formData.contactType}
                      onChange={handleInputChange}
                      className="mt-1.5 flex h-10 w-full min-w-0 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226D68] focus-visible:ring-offset-2"
                    >
                      <option value="">Veuillez sélectionner</option>
                      <option value="Candidat">Candidat</option>
                      <option value="Entreprise">Entreprise</option>
                      <option value="Recruteur">Recruteur</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-[#374151]">
                      Votre message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="min-h-[120px] mt-1.5 border-gray-200 text-sm resize-y w-full min-w-0"
                      placeholder="Décrivez votre demande..."
                    />
                  </div>
                  <p className="text-xs text-[#6b7280] leading-relaxed">
                    En cliquant ci-dessous, vous autorisez Yemma Solutions à stocker et traiter les données personnelles soumises afin de traiter votre demande. Consultez notre{' '}
                    <Link to={ROUTES.LEGAL_PRIVACY} className="text-[#226D68] hover:underline">
                      Politique de confidentialité
                    </Link>{' '}
                    pour en savoir plus.
                  </p>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#226D68] hover:bg-[#1a5a55] text-white font-medium rounded-lg"
                  >
                    {isSubmitting ? 'Envoi...' : (
                      <>
                        Contactez-nous
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </PublicPageLayout>
    </>
  )
}
