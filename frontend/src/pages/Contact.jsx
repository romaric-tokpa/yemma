import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import PublicPageLayout from '@/components/layout/PublicPageLayout'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const contactEmail = 'contact@yemma-solutions.com'
  const contactPhone = '+225 07 98 87 26 72'
  const whatsappLink = 'https://wa.me/2250798872672'

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Nom: ${formData.name}\nEmail: ${formData.email}\nTéléphone: ${formData.phone}\n\nMessage:\n${formData.message}`
      )}`
      window.location.href = mailtoLink
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PublicPageLayout
      title="Parlons de votre projet"
      subtitle="Notre équipe est là pour répondre à toutes vos questions."
      badge={<>Contactez-nous</>}
    >
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Infos contact */}
            <div className="space-y-3">
              <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E8F4F3] flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-[#226D68]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#226D68]">Email</h3>
                      <a href={`mailto:${contactEmail}`} className="text-xs text-[#226D68] hover:underline break-all">{contactEmail}</a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FDF2F0] flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-[#e76f51]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#e76f51]">Téléphone</h3>
                      <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="text-xs text-[#e76f51] hover:underline">{contactPhone}</a>
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md text-xs font-medium bg-[#25D366] text-white hover:bg-[#20BA5A]">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm border-l-4 border-l-[#226D68]">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E8F4F3] flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-[#226D68]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#226D68]">Adresse</h3>
                      <p className="text-xs text-[#6b7280]">Abidjan, Côte d&apos;Ivoire</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm border-l-4 border-l-[#e76f51]">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FDF2F0] flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-[#e76f51]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#e76f51]">Horaires</h3>
                      <p className="text-xs text-[#6b7280]">Lun-Ven : 9h-18h</p>
                      <p className="text-xs text-[#6b7280]">Sam : 9h-13h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Formulaire */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <h2 className="text-base font-bold text-[#226D68] mb-4">Envoyez-nous un message</h2>
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
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="name" className="text-xs font-medium">Nom complet *</Label>
                        <Input id="name" name="name" required value={formData.name} onChange={handleInputChange}
                          className="h-9 text-sm" placeholder="Votre nom" />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-xs font-medium">Email *</Label>
                        <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange}
                          className="h-9 text-sm" placeholder="votre@email.com" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="phone" className="text-xs font-medium">Téléphone</Label>
                        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange}
                          className="h-9 text-sm" placeholder="+225 XX XX XX XX XX" />
                      </div>
                      <div>
                        <Label htmlFor="subject" className="text-xs font-medium">Sujet *</Label>
                        <Input id="subject" name="subject" required value={formData.subject} onChange={handleInputChange}
                          className="h-9 text-sm" placeholder="Sujet de votre message" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-xs font-medium">Message *</Label>
                      <Textarea id="message" name="message" required value={formData.message} onChange={handleInputChange}
                        className="min-h-[120px] text-sm" placeholder="Décrivez votre demande ou votre projet..." />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSubmitting}
                        className="flex-1 h-9 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm">
                        {isSubmitting ? 'Envoi...' : <><Send className="h-3.5 w-3.5 mr-2" />Envoyer</>}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => window.open(whatsappLink, '_blank')}
                        className="h-9 border-[#25D366] text-[#25D366] hover:bg-[#E8F5E9] text-sm">
                        <MessageCircle className="h-3.5 w-3.5 mr-2" /> WhatsApp
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
