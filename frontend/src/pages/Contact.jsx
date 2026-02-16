import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shield, UserCheck, Euro, ArrowRight, MessageCircle, CheckCircle2, AlertCircle,
  Mail, MapPin, Linkedin
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { SEO } from '@/components/seo/SEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

const contactEmail = 'contact@yemma-solutions.com'
const whatsappLink = 'https://wa.me/2250798872672'
const linkedinUrl = 'https://www.linkedin.com/company/yemma-solutions/'

const strengths = [
  { icon: Shield, text: 'Profils validés à 100 % par des experts RH' },
  { icon: UserCheck, text: 'Matching et scoring pour des recrutements ciblés' },
  { icon: UserCheck, text: 'Accompagnement personnalisé candidats et entreprises' },
  { icon: Euro, text: 'Économies jusqu\'à 60 % sur les coûts de recrutement' },
]

const contactChannels = [
  { icon: Mail, label: 'Email', href: `mailto:${contactEmail}`, accent: false },
  { icon: MessageCircle, label: 'WhatsApp', href: whatsappLink, accent: true },
  { icon: Linkedin, label: 'LinkedIn', href: linkedinUrl, accent: false },
  { icon: MapPin, label: 'Siège', href: 'https://maps.google.com/?q=Abidjan,Cote+Ivoire', accent: false },
]

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
        {/* Hero */}
        <section className="pt-16 md:pt-20 pb-10 md:pb-14 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F4F3] text-[#226D68] text-xs font-semibold mb-4">
                Nous sommes à votre écoute
              </span>
              <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-3 font-heading leading-tight">
                Contactez-nous
              </h1>
              <p className="text-base sm:text-lg text-[#6b7280] leading-relaxed">
                Une question, un projet recrutement ? Notre équipe vous répond sous 48h.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Canaux de contact — cartes cliquables */}
        <section className="py-8 md:py-12 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3 sm:gap-4"
            >
              {contactChannels.map((channel, i) => {
                const Icon = channel.icon
                return (
                  <motion.a
                    key={channel.label}
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={channel.label}
                    aria-label={channel.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    whileHover={{ scale: 1.08 }}
                    className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all ${
                      channel.accent
                        ? 'bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25'
                        : 'bg-[#E8F4F3] text-[#226D68] hover:bg-[#226D68]/20'
                    }`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                  </motion.a>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* Contenu principal : présentation + formulaire */}
        <section className="py-10 md:py-14 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 xs:px-5 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
              {/* Colonne gauche — Qui sommes-nous */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <h2 className="text-xl md:text-2xl font-bold text-[#2C2C2C] font-heading">
                  Qui sommes-nous ?
                </h2>
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

                <h3 className="text-base font-bold text-[#2C2C2C] pt-2">Nos points forts</h3>
                <ul className="space-y-3">
                  {strengths.map((item, i) => {
                    const Icon = item.icon
                    return (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 text-sm text-[#374151]"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="h-4 w-4 text-[#226D68]" strokeWidth={1.5} />
                        </div>
                        {item.text}
                      </motion.li>
                    )
                  })}
                </ul>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-[#25D366] text-white hover:bg-[#20BA5A] transition-colors shadow-sm"
                >
                  <MessageCircle className="h-5 w-5" />
                  Nous contacter par WhatsApp
                </a>
              </motion.div>

              {/* Colonne droite — Formulaire */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8"
              >
                <h2 className="text-lg font-bold text-[#2C2C2C] mb-6">Envoyez-nous un message</h2>
                {submitStatus === 'success' && (
                  <div className="mb-4 p-4 rounded-xl flex items-center gap-3 text-sm bg-[#E8F4F3] border border-[#226D68]/30 text-[#226D68]">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    Message envoyé avec succès ! Nous vous répondrons rapidement.
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mb-4 p-4 rounded-xl flex items-center gap-3 text-sm bg-red-50 border border-red-200 text-red-600">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    Erreur lors de l&apos;envoi. Contactez-nous directement.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-[#374151]">
                        Prénom *
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="h-11 mt-0 border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20 rounded-lg"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-[#374151]">
                        Nom *
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="h-11 mt-0 border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20 rounded-lg"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
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
                      className="h-11 border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20 rounded-lg"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-[#374151]">
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-11 border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20 rounded-lg"
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactType" className="text-sm font-medium text-[#374151]">
                      Type de contact *
                    </Label>
                    <select
                      id="contactType"
                      name="contactType"
                      required
                      value={formData.contactType}
                      onChange={handleInputChange}
                      className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#226D68]/20 focus:border-[#226D68]"
                    >
                      <option value="">Veuillez sélectionner</option>
                      <option value="Candidat">Candidat</option>
                      <option value="Entreprise">Entreprise</option>
                      <option value="Recruteur">Recruteur</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium text-[#374151]">
                      Votre message
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="min-h-[120px] border-gray-200 focus:border-[#226D68] focus:ring-[#226D68]/20 text-sm resize-y rounded-lg"
                      placeholder="Décrivez votre demande..."
                    />
                  </div>
                  <p className="text-xs text-[#6b7280] leading-relaxed">
                    En cliquant ci-dessous, vous autorisez Yemma Solutions à stocker et traiter les données personnelles soumises afin de traiter votre demande. Consultez notre{' '}
                    <Link to={ROUTES.LEGAL_PRIVACY} className="text-[#226D68] hover:underline font-medium">
                      Politique de confidentialité
                    </Link>{' '}
                    pour en savoir plus.
                  </p>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#226D68] hover:bg-[#1a5a55] text-white font-medium rounded-xl"
                  >
                    {isSubmitting ? 'Envoi...' : (
                      <>
                        Envoyer le message
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      </PublicPageLayout>
    </>
  )
}