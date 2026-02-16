import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ImageIcon,
  User,
  Mail,
  Phone,
  Briefcase,
  ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { companyApi, documentApi, authApiService, paymentApi } from '@/services/api'
import { Check, Crown, Zap, CreditCard } from 'lucide-react'

const companyOnboardingSchema = z.object({
  name: z.string().min(2, 'Nom entreprise min. 2 caractères'),
  legal_id: z.string().min(9, 'RCCM min. 9 caractères'),
  adresse: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(10, 'Adresse min. 10 caractères').optional()
  ),
  logo: z.instanceof(FileList).optional(),
  contact_first_name: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2, 'Prénom min. 2 caractères').optional()
  ),
  contact_last_name: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2, 'Nom min. 2 caractères').optional()
  ),
  contact_email: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().email('Email invalide').optional()
  ),
  contact_phone: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().optional()
  ),
  contact_function: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2, 'Fonction min. 2 caractères').optional()
  ),
})

const STEPS = [
  { id: 1, title: 'Entreprise', short: 'Entreprise', icon: Building2 },
  { id: 2, title: 'Logo & récapitulatif', short: 'Logo', icon: ImageIcon },
  { id: 3, title: 'Choix du plan', short: 'Abonnement', icon: CreditCard },
]

export default function CompanyOnboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [company, setCompany] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(companyOnboardingSchema),
    defaultValues: {
      name: '',
      legal_id: '',
      adresse: '',
      contact_first_name: '',
      contact_last_name: '',
      contact_email: '',
      contact_phone: '',
      contact_function: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = form

  useEffect(() => {
    loadCompany()
  }, [])

  const loadCompany = async () => {
    try {
      setLoading(true)
      setError(null)
      const companyData = await companyApi.getMyCompany()
      setCompany(companyData)
      setLogoUrl(companyData.logo_url)
      if (companyData) {
        setValue('name', companyData.name || '')
        setValue('legal_id', companyData.legal_id || '')
        setValue('adresse', companyData.adresse || '')
        setValue('contact_first_name', companyData.contact_first_name || '')
        setValue('contact_last_name', companyData.contact_last_name || '')
        setValue('contact_email', companyData.contact_email || '')
        setValue('contact_phone', companyData.contact_phone || '')
        setValue('contact_function', companyData.contact_function || '')
        const noContact = !companyData.contact_first_name && !companyData.contact_last_name && !companyData.contact_email
        if (noContact) {
          try {
            const user = await authApiService.getCurrentUser()
            setValue('contact_first_name', user.first_name || '')
            setValue('contact_last_name', user.last_name || '')
            setValue('contact_email', user.email || '')
          } catch (e) {
            console.warn('Préremplissage contact:', e)
          }
        }
      }
    } catch (err) {
      console.error('Error loading company:', err)
      if (err.response?.status === 404) {
        setCompany(null)
        setError(null)
        try {
          const user = await authApiService.getCurrentUser()
          setValue('contact_first_name', user.first_name || '')
          setValue('contact_last_name', user.last_name || '')
          setValue('contact_email', user.email || '')
        } catch (e) {}
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Connexion impossible. Vérifiez votre réseau.')
      } else {
        setError(err.response?.data?.detail || err.message || 'Erreur de chargement')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (files) => {
    if (!files?.length) return
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      setError('Fichier image requis (JPG, PNG)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Taille max. 5 Mo')
      return
    }
    try {
      setUploading(true)
      setError(null)
      let companyId = company?.id
      if (!companyId) {
        const formData = getValues()
        if (!formData.name || !formData.legal_id) {
          setError('Remplissez nom et RCCM avant le logo')
          return
        }
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          const newCompany = await companyApi.createCompany({
            name: formData.name,
            legal_id: formData.legal_id,
            adresse: formData.adresse || null,
            admin_id: user.id,
            contact_first_name: formData.contact_first_name || null,
            contact_last_name: formData.contact_last_name || null,
            contact_email: formData.contact_email || null,
            contact_phone: formData.contact_phone || null,
            contact_function: formData.contact_function || null,
          })
          companyId = newCompany.id
          setCompany(newCompany)
          setLastSaved(new Date())
        } catch (err) {
          setError('Erreur création: ' + (err.response?.data?.detail || err.message))
          return
        }
      }
      const uploadResponse = await documentApi.uploadCompanyLogo(file, companyId)
      if (uploadResponse.url) {
        setLogoUrl(uploadResponse.url)
        setLastSaved(new Date())
      }
    } catch (err) {
      setError('Erreur upload: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploading(false)
    }
  }

  const loadPlans = async () => {
    try {
      setPlansLoading(true)
      const data = await paymentApi.getPlans()
      const list = Array.isArray(data) ? data : (data?.data ?? [])
      setPlans(list.filter(p => p?.plan_type !== 'FREEMIUM'))
    } catch (e) {
      console.warn('Plans non chargés:', e)
      setPlans([])
    } finally {
      setPlansLoading(false)
    }
  }

  const onStepSubmit = async (data) => {
    try {
      setError(null)
      if (currentStep === 1) {
        if (!data.name || !data.legal_id) {
          setError('Nom et RCCM obligatoires')
          return
        }
        setCurrentStep(2)
        setLastSaved(new Date())
      } else if (currentStep === 2) {
        await saveCompanyData(data)
        setLastSaved(new Date())
        setCurrentStep(3)
        loadPlans()
      } else if (currentStep === 3) {
        await finalizeOnboarding(data)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur')
    }
  }

  const handlePlanChoice = async (planId, billingPeriod = 'monthly') => {
    try {
      setError(null)
      setUploading(true)
      const data = getValues()
      const companyId = await saveCompanyData(data)
      const checkout = await paymentApi.createCheckoutSession({
        company_id: companyId,
        plan_id: planId,
        billing_period: billingPeriod
      })
      window.location.href = checkout.url
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création de la session de paiement')
    } finally {
      setUploading(false)
    }
  }

  const handleChooseFree = async () => {
    try {
      setError(null)
      await finalizeOnboarding(getValues())
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur')
    }
  }

  const saveCompanyData = async (data) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const payload = {
      name: data.name,
      legal_id: data.legal_id,
      adresse: data.adresse || null,
      logo_url: logoUrl || null,
      contact_first_name: data.contact_first_name || null,
      contact_last_name: data.contact_last_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      contact_function: data.contact_function || null,
    }
    if (company?.id) {
      await companyApi.updateCompany(company.id, payload)
      return company.id
    } else {
      const newCompany = await companyApi.createCompany({ ...payload, admin_id: user.id })
      setCompany(newCompany)
      return newCompany.id
    }
  }

  const finalizeOnboarding = async (data) => {
    try {
      setUploading(true)
      await saveCompanyData(data)
      navigate('/company/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur finalisation')
      throw err
    } finally {
      setUploading(false)
    }
  }

  const progress = ((currentStep - 1) / Math.max(1, STEPS.length - 1)) * 100

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-x-hidden w-full max-w-[100vw]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#226D68]" />
          <p className="text-sm text-[#2C2C2C]/70">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden w-full max-w-[100vw]">
      {/* Header compact */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 xs:px-5 py-3 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/company/dashboard" className="text-sm font-bold hover:opacity-80 transition-opacity">
                <span className="text-[#226D68]">Yemma</span>
                <span className="text-[#e76f51]">-Solutions</span>
              </Link>
              <span className="text-[#d1d5db]">|</span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#226D68] flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-[#2C2C2C] font-[Poppins]">
                    Configuration entreprise
                  </h1>
                  <p className="text-[10px] text-[#2C2C2C]/60">
                    Étape {currentStep}/{STEPS.length}
                  </p>
                </div>
              </div>
            </div>
            {lastSaved && (
              <span className="text-xs text-[#2C2C2C]/50">
                Sauvegardé {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <Progress value={progress} className="h-1 mt-2 bg-[#e5e7eb]" />
        </div>
      </header>

      {/* Stepper minimal */}
      <div className="border-b border-[#e5e7eb] bg-white/80">
        <div className="max-w-2xl mx-auto px-4 xs:px-5 py-2 min-w-0">
          <div className="flex gap-2">
            {STEPS.map((step, i) => {
              const isDone = currentStep > step.id
              const isCurrent = currentStep === step.id
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 flex-1 ${i < STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                      isCurrent ? 'bg-[#E8F4F3] text-[#226D68]' : isDone ? 'text-[#226D68]' : 'text-[#9ca3af]'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium truncate">{step.short}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-[#d1d5db] flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <main className="max-w-2xl mx-auto px-4 xs:px-5 py-5 sm:py-6 min-w-0">
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="py-4 px-4 sm:px-5 bg-white border-b border-[#e5e7eb]">
            <CardTitle className="text-base font-semibold text-[#2C2C2C] font-[Poppins]">
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-xs text-[#2C2C2C]/60 mt-0.5">
              {currentStep === 1
                ? 'Informations légales et contact référent'
                : currentStep === 2
                  ? 'Logo optionnel puis vérification'
                  : 'Choisissez votre plan d\'abonnement'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Étape 1 : Entreprise + Contact */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium text-[#2C2C2C]">
                        Nom entreprise *
                      </Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Ex: Acme SAS"
                        className="h-9 text-sm w-full min-w-0"
                      />
                      {errors.name && (
                        <p className="text-xs text-red-600">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="legal_id" className="text-xs font-medium text-[#2C2C2C]">
                        RCCM *
                      </Label>
                      <Input
                        id="legal_id"
                        {...register('legal_id')}
                        placeholder="CI-ABJ-2024-A-12345"
                        className="h-9 text-sm w-full min-w-0"
                      />
                      {errors.legal_id && (
                        <p className="text-xs text-red-600">{errors.legal_id.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="adresse" className="text-xs font-medium text-[#2C2C2C]">
                      Adresse
                    </Label>
                    <Input
                      id="adresse"
                      {...register('adresse')}
                      placeholder="123 Rue Example, 75001 Paris"
                      className="h-9 text-sm w-full min-w-0"
                    />
                    {errors.adresse && (
                      <p className="text-xs text-red-600">{errors.adresse.message}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#e5e7eb]">
                    <p className="text-xs font-medium text-[#2C2C2C]/80 mb-3 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      Contact référent
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_first_name" className="text-xs text-[#2C2C2C]/70">
                          Prénom
                        </Label>
                        <Input
                          id="contact_first_name"
                          {...register('contact_first_name')}
                          placeholder="Jean"
                          className="h-9 text-sm w-full min-w-0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_last_name" className="text-xs text-[#2C2C2C]/70">
                          Nom
                        </Label>
                        <Input
                          id="contact_last_name"
                          {...register('contact_last_name')}
                          placeholder="Dupont"
                          className="h-9 text-sm w-full min-w-0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_email" className="text-xs text-[#2C2C2C]/70 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Email
                        </Label>
                        <Input
                          id="contact_email"
                          type="email"
                          {...register('contact_email')}
                          placeholder="jean@entreprise.com"
                          className="h-9 text-sm w-full min-w-0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contact_phone" className="text-xs text-[#2C2C2C]/70 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Téléphone
                        </Label>
                        <Input
                          id="contact_phone"
                          type="tel"
                          {...register('contact_phone')}
                          placeholder="+225 07 12 34 56 78"
                          className="h-9 text-sm w-full min-w-0"
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <Label htmlFor="contact_function" className="text-xs text-[#2C2C2C]/70 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> Fonction
                      </Label>
                      <Input
                        id="contact_function"
                        {...register('contact_function')}
                        placeholder="DRH, Responsable Recrutement"
                        className="h-9 text-sm w-full min-w-0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 3 : Choix du plan */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#2C2C2C]/80">Sélectionnez un plan pour accéder à la CVthèque.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Plan gratuit */}
                    <Card className="flex-1 border-[#e5e7eb] shadow-none hover:border-[#226D68]/40 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-4 h-4 text-[#9ca3af]" />
                          <span className="text-sm font-semibold text-[#2C2C2C]">Gratuit</span>
                        </div>
                        <p className="text-xs text-[#9ca3af] mb-3">Accès limité pour découvrir</p>
                        <ul className="space-y-1.5 mb-4 text-xs text-[#2C2C2C]">
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#226D68]" /> 10 consultations/mois</li>
                          <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#226D68]" /> Recherche limitée</li>
                        </ul>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs"
                          onClick={handleChooseFree}
                          disabled={uploading}
                        >
                          {uploading ? 'Enregistrement...' : 'Commencer gratuitement'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Plans payants */}
                    {plansLoading ? (
                      <div className="flex-1 flex items-center justify-center py-8 text-xs text-[#9ca3af]">Chargement des plans...</div>
                    ) : (
                      [...plans].sort((a, b) => a.name === 'Essentiel' ? -1 : b.name === 'Essentiel' ? 1 : 0).map((plan) => (
                        <Card
                          key={plan.id}
                          className={`flex-1 border shadow-none overflow-hidden transition-colors hover:border-[#226D68]/40 ${
                            plan.name === 'Essentiel' ? 'border-[#226D68] ring-1 ring-[#226D68]/20' : 'border-[#e5e7eb]'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {plan.plan_type === 'ENTERPRISE' && plan.name !== 'Essentiel' ? (
                                <Crown className="w-4 h-4 text-amber-500" />
                              ) : plan.plan_type === 'PRO' && plan.name !== 'Essentiel' ? (
                                <Zap className="w-4 h-4 text-blue-500" />
                              ) : null}
                              <span className="text-sm font-semibold text-[#2C2C2C]">{plan.name}</span>
                            </div>
                            <p className="text-[10px] text-[#226D68] font-medium mb-1">3 jours d'essai gratuit</p>
                            <p className="text-[10px] text-[#9ca3af] mb-2">Puis facturation automatique</p>
                            {plan.name === 'Essentiel' ? (
                              <p className="text-lg font-bold text-[#2C2C2C] mb-2">
                                {Math.round(plan.price_monthly * 655).toLocaleString('fr-FR')} FCFA<span className="text-xs font-normal text-[#9ca3af]">/mois</span>
                              </p>
                            ) : (
                              <p className="text-lg font-bold text-[#2C2C2C] mb-2">
                                {plan.price_monthly.toFixed(2)}€<span className="text-xs font-normal text-[#9ca3af]">/mois</span>
                              </p>
                            )}
                            <ul className="space-y-1 mb-4 text-xs text-[#2C2C2C]">
                              {plan.unlimited_search && <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#226D68]" /> Recherche illimitée</li>}
                              {plan.max_profile_views === null ? (
                                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#226D68]" /> Consultations illimitées</li>
                              ) : (
                                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#226D68]" /> {plan.max_profile_views} consultations/mois</li>
                              )}
                              {plan.document_access && <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-[#226D68]" /> Accès aux documents</li>}
                            </ul>
                            <Button
                              type="button"
                              size="sm"
                              className="w-full h-8 text-xs"
                              variant={plan.name === 'Essentiel' ? 'default' : 'outline'}
                              onClick={() => handlePlanChoice(plan.id, 'monthly')}
                              disabled={uploading}
                            >
                              {uploading ? 'Redirection...' : 'Choisir ce plan'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                  <p className="text-[10px] text-[#9ca3af]">Coordonnées bancaires requises pour la facturation automatique après l'essai.</p>
                </div>
              )}

              {/* Étape 2 : Logo + Récap */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <Label className="text-xs font-medium text-[#2C2C2C] mb-2 block">Logo</Label>
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-[#e5e7eb] bg-[#F4F6F8] flex items-center justify-center overflow-hidden hover:border-[#226D68]/40 transition-colors">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-[#9ca3af]" />
                        )}
                      </div>
                      <div className="mt-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploading}
                            onChange={(e) => handleLogoUpload(e.target.files)}
                            className="hidden"
                          />
                          <span className="text-xs text-[#226D68] hover:underline font-medium">
                            {uploading ? 'Upload...' : 'Changer / Ajouter'}
                          </span>
                        </label>
                      </div>
                      <p className="text-[10px] text-[#9ca3af] mt-1">JPG, PNG, max 5 Mo</p>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs font-medium text-[#2C2C2C]/80">Récapitulatif</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex gap-2">
                          <span className="text-[#9ca3af] min-w-[70px]">Entreprise</span>
                          <span className="font-medium text-[#2C2C2C] truncate">{watch('name')}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[#9ca3af] min-w-[70px]">RCCM</span>
                          <span className="font-medium text-[#2C2C2C] truncate">{watch('legal_id')}</span>
                        </div>
                        {watch('adresse') && (
                          <div className="flex gap-2">
                            <span className="text-[#9ca3af] min-w-[70px]">Adresse</span>
                            <span className="text-[#2C2C2C] truncate">{watch('adresse')}</span>
                          </div>
                        )}
                        {(watch('contact_first_name') || watch('contact_last_name') || watch('contact_email')) && (
                          <div className="flex gap-2 pt-1 border-t border-[#e5e7eb]">
                            <span className="text-[#9ca3af] min-w-[70px]">Contact</span>
                            <span className="text-[#2C2C2C] truncate">
                              {[watch('contact_first_name'), watch('contact_last_name')].filter(Boolean).join(' ')}
                              {watch('contact_email') && (
                                <span className="text-[#9ca3af]"> • {watch('contact_email')}</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-between pt-4 border-t border-[#e5e7eb]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/company/dashboard')
                  }
                  className="h-9 text-xs border-[#d1d5db] text-[#2C2C2C] hover:bg-[#F4F6F8]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  {currentStep === 1 ? 'Annuler' : 'Précédent'}
                </Button>
                {currentStep < 3 && (
                  <Button
                    type="submit"
                    disabled={uploading}
                    size="sm"
                    className="h-9 text-xs bg-[#226D68] hover:bg-[#1a5a55] text-white px-4"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Enregistrement...
                      </>
                    ) : currentStep === 2 ? (
                      <>
                        Suivant
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </>
                    ) : (
                      <>
                        Suivant
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
