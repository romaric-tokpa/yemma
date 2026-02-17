import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
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
  Upload,
  Sparkles,
} from 'lucide-react'
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
  { id: 1, title: 'Votre entreprise', subtitle: 'Informations légales', icon: Building2 },
  { id: 2, title: 'Identité visuelle', subtitle: 'Logo & récapitulatif', icon: ImageIcon },
  { id: 3, title: 'Votre plan', subtitle: 'Choisissez votre abonnement', icon: CreditCard },
]

export default function CompanyOnboarding() {
  const navigate = useNavigate()
  const { step } = useParams()
  const stepNum = Math.min(3, Math.max(1, parseInt(step || '1', 10) || 1))
  const currentStep = stepNum
  const [company, setCompany] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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

  useEffect(() => {
    if (step && step !== String(stepNum)) {
      navigate(`/company/onboarding/etape-${stepNum}`, { replace: true })
    }
  }, [step, stepNum, navigate])

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
        setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Erreur de chargement')
      }
    } finally {
      setLoading(false)
    }
  }

  const processLogoFile = useCallback(async (file) => {
    if (!file?.type?.startsWith('image/')) {
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
  }, [company?.id, getValues])

  const handleLogoUpload = async (files) => {
    if (!files?.length) return
    await processLogoFile(files[0])
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) processLogoFile(file)
  }, [processLogoFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

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
        navigate('/company/onboarding/etape-2')
        setLastSaved(new Date())
      } else if (currentStep === 2) {
        await saveCompanyData(data)
        setLastSaved(new Date())
        navigate('/company/onboarding/etape-3')
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

  const progress = (currentStep / STEPS.length) * 100

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-green-emerald/5">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-green-emerald/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-7 w-7 animate-spin text-green-emerald" />
          </div>
          <p className="text-sm font-medium text-gray-anthracite/70">Chargement de votre espace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-green-emerald/[0.03]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/company/dashboard"
              className="flex items-center gap-2 text-gray-anthracite hover:text-green-emerald transition-colors group"
            >
              <span className="font-heading font-bold text-lg">
                <span className="text-green-emerald">Yemma</span>
                <span className="text-orange-secondary">-Solutions</span>
              </span>
            </Link>
            {lastSaved && (
              <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-emerald" />
                Sauvegardé {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div className="mt-3">
            <Progress value={progress} className="h-1.5 bg-neutral-100" />
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="border-b border-neutral-200/60 bg-white/60">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((stepItem, i) => {
              const isDone = currentStep > stepItem.id
              const isCurrent = currentStep === stepItem.id
              const isClickable = isDone
              const Icon = stepItem.icon
              const stepContent = (
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                      isCurrent
                        ? 'bg-green-emerald text-white shadow-lg shadow-green-emerald/25'
                        : isDone
                          ? 'bg-green-emerald/10 text-green-emerald'
                          : 'bg-neutral-100 text-neutral-400'
                    } ${isClickable ? 'cursor-pointer hover:opacity-90' : ''}`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${
                    isCurrent ? 'text-green-emerald' : isDone ? 'text-neutral-600' : 'text-neutral-400'
                  }`}>
                    {stepItem.title}
                  </span>
                </div>
              )
              return (
                <div key={stepItem.id} className="flex items-center flex-1">
                  {isClickable ? (
                    <Link to={`/company/onboarding/etape-${stepItem.id}`} className="flex flex-col items-center flex-1 no-underline">
                      {stepContent}
                    </Link>
                  ) : (
                    stepContent
                  )}
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px bg-neutral-200 mx-2 max-w-[40px] sm:max-w-none" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="animate-fade-in">
          <Card className="border-0 shadow-xl shadow-neutral-200/50 overflow-hidden rounded-2xl">
            <CardHeader className="px-6 sm:px-8 pt-8 pb-6 bg-gradient-to-b from-white to-neutral-50/50 border-b border-neutral-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-emerald/10 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const Icon = STEPS[currentStep - 1].icon
                    return <Icon className="w-6 h-6 text-green-emerald" />
                  })()}
                </div>
                <div>
                  <CardTitle className="text-xl font-heading font-semibold text-gray-anthracite">
                    {STEPS[currentStep - 1].title}
                  </CardTitle>
                  <CardDescription className="text-sm text-neutral-500 mt-0.5">
                    {STEPS[currentStep - 1].subtitle}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-6">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Step 1 */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-anthracite mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-green-emerald" />
                        Informations légales
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-anthracite">
                            Nom de l'entreprise *
                          </Label>
                          <Input
                            id="name"
                            {...register('name')}
                            placeholder="Ex: Acme SAS"
                            className="h-11 border-neutral-200 focus:border-green-emerald focus:ring-green-emerald/20"
                          />
                          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="legal_id" className="text-sm font-medium text-gray-anthracite">
                            RCCM / SIRET *
                          </Label>
                          <Input
                            id="legal_id"
                            {...register('legal_id')}
                            placeholder="CI-ABJ-2024-A-12345"
                            className="h-11 border-neutral-200 focus:border-green-emerald focus:ring-green-emerald/20"
                          />
                          {errors.legal_id && <p className="text-xs text-red-600">{errors.legal_id.message}</p>}
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label htmlFor="adresse" className="text-sm font-medium text-gray-anthracite">
                          Adresse
                        </Label>
                        <Input
                          id="adresse"
                          {...register('adresse')}
                          placeholder="Ex: Plateau, 01 BP 123 Abidjan 01"
                          className="h-11 border-neutral-200 focus:border-green-emerald focus:ring-green-emerald/20"
                        />
                        {errors.adresse && <p className="text-xs text-red-600">{errors.adresse.message}</p>}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-neutral-100">
                      <h3 className="text-sm font-semibold text-gray-anthracite mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-green-emerald" />
                        Contact référent
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contact_first_name" className="text-sm text-neutral-600">Prénom</Label>
                          <Input
                            id="contact_first_name"
                            {...register('contact_first_name')}
                            placeholder="Jean"
                            className="h-11 border-neutral-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_last_name" className="text-sm text-neutral-600">Nom</Label>
                          <Input
                            id="contact_last_name"
                            {...register('contact_last_name')}
                            placeholder="Dupont"
                            className="h-11 border-neutral-200"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="contact_email" className="text-sm text-neutral-600 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Email
                          </Label>
                          <Input
                            id="contact_email"
                            type="email"
                            {...register('contact_email')}
                            placeholder="jean@entreprise.com"
                            className="h-11 border-neutral-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_phone" className="text-sm text-neutral-600 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Téléphone
                          </Label>
                          <Input
                            id="contact_phone"
                            type="tel"
                            {...register('contact_phone')}
                            placeholder="+225 07 12 34 56 78"
                            className="h-11 border-neutral-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_function" className="text-sm text-neutral-600 flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" /> Fonction
                          </Label>
                          <Input
                            id="contact_function"
                            {...register('contact_function')}
                            placeholder="DRH, Responsable Recrutement"
                            className="h-11 border-neutral-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row gap-8">
                      <div className="flex-shrink-0">
                        <Label className="text-sm font-medium text-gray-anthracite mb-3 block">Logo de l'entreprise</Label>
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all duration-200 cursor-pointer ${
                            isDragging
                              ? 'border-green-emerald bg-green-emerald/5'
                              : logoUrl
                                ? 'border-neutral-200 bg-neutral-50 hover:border-green-emerald/50'
                                : 'border-neutral-200 bg-neutral-50/80 hover:border-green-emerald/50 hover:bg-green-emerald/5'
                          }`}
                        >
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploading}
                              onChange={(e) => handleLogoUpload(e.target.files)}
                              className="hidden"
                            />
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" onError={(e) => (e.target.style.display = 'none')} />
                            ) : (
                              <>
                                <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-green-emerald' : 'text-neutral-400'}`} />
                                <span className="text-xs text-neutral-500 text-center px-2">
                                  {uploading ? 'Upload...' : 'Glissez ou cliquez'}
                                </span>
                              </>
                            )}
                          </label>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">JPG, PNG • max 5 Mo</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-anthracite mb-4 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-orange-secondary" />
                          Récapitulatif
                        </h3>
                        <div className="space-y-3 p-4 rounded-xl bg-neutral-50/80">
                          <div className="flex justify-between gap-4">
                            <span className="text-sm text-neutral-500">Entreprise</span>
                            <span className="text-sm font-medium text-gray-anthracite truncate text-right">{watch('name') || '—'}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-sm text-neutral-500">RCCM</span>
                            <span className="text-sm font-medium text-gray-anthracite truncate text-right">{watch('legal_id') || '—'}</span>
                          </div>
                          {watch('adresse') && (
                            <div className="flex justify-between gap-4 pt-2 border-t border-neutral-200">
                              <span className="text-sm text-neutral-500">Adresse</span>
                              <span className="text-sm text-gray-anthracite truncate text-right">{watch('adresse')}</span>
                            </div>
                          )}
                          {(watch('contact_first_name') || watch('contact_last_name') || watch('contact_email')) && (
                            <div className="flex justify-between gap-4 pt-2 border-t border-neutral-200">
                              <span className="text-sm text-neutral-500">Contact</span>
                              <span className="text-sm text-gray-anthracite text-right">
                                {[watch('contact_first_name'), watch('contact_last_name')].filter(Boolean).join(' ')}
                                {watch('contact_email') && <span className="text-neutral-500 block text-xs">{watch('contact_email')}</span>}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <p className="text-sm text-neutral-600">Sélectionnez un plan pour accéder à la CVthèque et recruter les meilleurs talents.</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Plan gratuit */}
                      <Card className="border-2 border-neutral-200 hover:border-green-emerald/30 transition-colors rounded-xl overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <CreditCard className="w-5 h-5 text-neutral-400" />
                            <span className="font-semibold text-gray-anthracite">Gratuit</span>
                          </div>
                          <p className="text-xs text-neutral-500 mb-4">Découvrez la plateforme</p>
                          <ul className="space-y-2 mb-6 text-sm text-gray-anthracite">
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-emerald flex-shrink-0" /> 10 consultations/mois</li>
                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-emerald flex-shrink-0" /> Recherche limitée</li>
                          </ul>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-10"
                            onClick={handleChooseFree}
                            disabled={uploading}
                          >
                            {uploading ? 'Enregistrement...' : 'Commencer gratuitement'}
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Plans payants */}
                      {plansLoading ? (
                        <div className="col-span-1 sm:col-span-2 flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-green-emerald" />
                        </div>
                      ) : (
                        [...plans].sort((a, b) => a.name === 'Essentiel' ? -1 : b.name === 'Essentiel' ? 1 : 0).map((plan) => (
                          <Card
                            key={plan.id}
                            className={`border-2 overflow-hidden rounded-xl transition-all hover:shadow-lg ${
                              plan.name === 'Essentiel'
                                ? 'border-green-emerald shadow-lg shadow-green-emerald/10 ring-2 ring-green-emerald/20'
                                : 'border-neutral-200 hover:border-green-emerald/30'
                            }`}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-2">
                                {plan.plan_type === 'ENTERPRISE' && plan.name !== 'Essentiel' ? (
                                  <Crown className="w-5 h-5 text-amber-500" />
                                ) : plan.plan_type === 'PRO' && plan.name !== 'Essentiel' ? (
                                  <Zap className="w-5 h-5 text-blue-500" />
                                ) : null}
                                <span className="font-semibold text-gray-anthracite">{plan.name}</span>
                              </div>
                              <p className="text-xs font-medium text-green-emerald mb-1">3 jours d'essai gratuit</p>
                              <p className="text-xs text-neutral-500 mb-3">Puis facturation automatique</p>
                              {plan.name === 'Essentiel' ? (
                                <p className="text-2xl font-bold text-gray-anthracite mb-3">
                                  {Math.round(plan.price_monthly * 655).toLocaleString('fr-FR')} <span className="text-sm font-normal text-neutral-500">FCFA/mois</span>
                                </p>
                              ) : (
                                <p className="text-2xl font-bold text-gray-anthracite mb-3">
                                  {plan.price_monthly?.toFixed(2) || '0'}€ <span className="text-sm font-normal text-neutral-500">/mois</span>
                                </p>
                              )}
                              <ul className="space-y-2 mb-6 text-sm text-gray-anthracite">
                                {plan.unlimited_search && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-emerald flex-shrink-0" /> Recherche illimitée</li>}
                                {plan.max_profile_views === null ? (
                                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-emerald flex-shrink-0" /> Consultations illimitées</li>
                                ) : (
                                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-emerald flex-shrink-0" /> {plan.max_profile_views} consultations/mois</li>
                                )}
                                {plan.document_access && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-emerald flex-shrink-0" /> Accès aux documents</li>}
                              </ul>
                              <Button
                                type="button"
                                size="sm"
                                className={`w-full h-10 ${plan.name === 'Essentiel' ? 'bg-green-emerald hover:bg-green-emerald/90' : ''}`}
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
                    <p className="text-xs text-neutral-500">Coordonnées bancaires requises pour la facturation automatique après l'essai gratuit.</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-8 border-t border-neutral-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => currentStep > 1 ? navigate(`/company/onboarding/etape-${currentStep - 1}`) : navigate('/company/dashboard')}
                    className="text-neutral-600 hover:text-gray-anthracite"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {currentStep === 1 ? 'Annuler' : 'Précédent'}
                  </Button>
                  {currentStep < 3 && (
                    <Button
                      type="submit"
                      disabled={uploading}
                      className="bg-green-emerald hover:bg-green-emerald/90 text-white px-6"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          Suivant
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
