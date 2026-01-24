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
import React from 'react'
import { Building, Upload, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Loader2, Save, FileText, Image as ImageIcon, User, Mail, Phone, Briefcase } from 'lucide-react'
import { companyApi, documentApi } from '@/services/api'

const companyOnboardingSchema = z.object({
  name: z.string().min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères'),
  legal_id: z.string().min(9, 'Le RCCM doit contenir au moins 9 caractères'),
  adresse: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(10, 'L\'adresse doit contenir au moins 10 caractères').optional()
  ),
  logo: z.instanceof(FileList).optional(),
  // Champs de contact du référent
  contact_first_name: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').optional()
  ),
  contact_last_name: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional()
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
    z.string().min(2, 'La fonction doit contenir au moins 2 caractères').optional()
  ),
})

const STEPS = [
  { id: 1, title: 'Informations générales', description: 'Nom, RCCM et adresse', icon: Building },
  { id: 2, title: 'Contact du référent', description: 'Informations du référent de l\'entreprise', icon: Building },
  { id: 3, title: 'Logo de l\'entreprise', description: 'Téléchargez le logo de votre entreprise', icon: ImageIcon },
  { id: 4, title: 'Récapitulatif', description: 'Vérifiez vos informations avant de finaliser', icon: CheckCircle2 },
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

  const form = useForm({
    resolver: zodResolver(companyOnboardingSchema),
    defaultValues: {
      name: '',
      legal_id: '',
      adresse: '',
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
      }
    } catch (error) {
      console.error('Error loading company:', error)
      
      if (error.response?.status === 404) {
        setCompany(null)
        setError(null)
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion et que les services sont démarrés.')
      } else if (error.response?.data?.detail) {
        setError(`Erreur lors du chargement des données de l'entreprise: ${error.response.data.detail}`)
      } else {
        setError(`Erreur lors du chargement des données de l'entreprise: ${error.message || 'Erreur inconnue'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (files) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5 Mo')
      return
    }

    try {
      setUploading(true)
      setError(null)

      let companyId = company?.id
      
      if (!companyId) {
        const formData = getValues()
        if (!formData.name || !formData.legal_id) {
          setError('Veuillez remplir les informations générales (nom et RCCM) avant de télécharger le logo')
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
          console.error('Error creating company:', err)
          setError('Erreur lors de la création de l\'entreprise: ' + (err.response?.data?.detail || err.message))
          return
        }
      }

      const uploadResponse = await documentApi.uploadCompanyLogo(file, companyId)
      
      if (uploadResponse.url) {
        setLogoUrl(uploadResponse.url)
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      setError('Erreur lors du téléchargement du logo: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploading(false)
    }
  }

  const onStepSubmit = async (data) => {
    try {
      setError(null)

      if (currentStep === 1) {
        if (!data.name || !data.legal_id) {
          setError('Veuillez remplir tous les champs obligatoires')
          return
        }
        setCurrentStep(2)
        setLastSaved(new Date())
      } else if (currentStep === 2) {
        // Étape contact du référent - peut être vide, on passe à l'étape suivante
        setCurrentStep(3)
        setLastSaved(new Date())
      } else if (currentStep === 3) {
        // Étape logo - on passe au récapitulatif
        setCurrentStep(4)
      } else if (currentStep === 4) {
        await finalizeOnboarding(data)
      }
    } catch (err) {
      console.error('Error in step submit:', err)
      setError(err.response?.data?.detail || 'Une erreur est survenue')
    }
  }

  const finalizeOnboarding = async (data) => {
    try {
      setUploading(true)

      if (company?.id) {
        await companyApi.updateCompany(company.id, {
          name: data.name,
          legal_id: data.legal_id,
          adresse: data.adresse || null,
          logo_url: logoUrl || null,
          contact_first_name: data.contact_first_name || null,
          contact_last_name: data.contact_last_name || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          contact_function: data.contact_function || null,
        })
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        await companyApi.createCompany({
          name: data.name,
          legal_id: data.legal_id,
          adresse: data.adresse || null,
          logo_url: logoUrl || null,
          admin_id: user.id,
          contact_first_name: data.contact_first_name || null,
          contact_last_name: data.contact_last_name || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
          contact_function: data.contact_function || null,
        })
      }

      navigate('/company/dashboard')
    } catch (err) {
      console.error('Error finalizing onboarding:', err)
      setError(err.response?.data?.detail || 'Erreur lors de la finalisation')
      throw err
    } finally {
      setUploading(false)
    }
  }

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#226D68]" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white">
      {/* Header avec gradient vert émeraude - Responsive */}
      <div className="bg-gradient-to-r from-[#226D68] to-[#1a5a55] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading mb-1 sm:mb-2">Configuration de votre entreprise</h1>
              <p className="text-xs sm:text-sm text-white/80">Complétez les informations de votre entreprise pour commencer</p>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80 flex-shrink-0">
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Dernière sauvegarde: {lastSaved.toLocaleTimeString()}</span>
                <span className="sm:hidden">{lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
          
          {/* Barre de progression */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium">
                Étape {currentStep} sur {STEPS.length}
              </span>
              <span className="text-xs sm:text-sm font-semibold">{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="h-2 sm:h-3 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Indicateurs d'étapes - Responsive */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
            {STEPS.map((step, index) => {
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              const Icon = step.icon
              
              return (
                <div key={step.id} className="flex items-center flex-1 min-w-[80px] sm:min-w-0">
                  <div className="flex flex-col items-center flex-1 w-full">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 mb-1 sm:mb-2 transition-all duration-200 ${
                      isCompleted
                        ? 'bg-[#226D68] border-[#226D68] text-white shadow-md'
                        : isCurrent
                        ? 'bg-[#226D68]/20 border-[#226D68] text-[#226D68] shadow-sm scale-110'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs text-center font-medium transition-colors leading-tight ${
                      isCurrent ? 'text-[#226D68]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {step.title.split(' ')[0]}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors hidden sm:block ${
                      isCompleted ? 'bg-[#226D68]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contenu principal - Responsive */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <Card className="rounded-[16px] shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#226D68]/5 to-blue-deep/5 p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#226D68] to-blue-deep flex items-center justify-center text-white shadow-md flex-shrink-0">
                {React.createElement(STEPS[currentStep - 1].icon, { className: 'w-6 h-6 sm:w-8 sm:h-8' })}
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl font-bold text-gray-anthracite font-heading">{STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1">{STEPS[currentStep - 1].description}</CardDescription>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-4 sm:space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm flex-1">{error}</p>
                </div>
              )}

              {/* Step 1: Informations générales */}
              {currentStep === 1 && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base font-semibold">Nom de l'entreprise *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Ex: Acme Corporation"
                      className="h-10 sm:h-12 text-sm sm:text-base"
                    />
                    {errors.name && (
                      <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legal_id" className="text-sm sm:text-base font-semibold">Numéro RCCM *</Label>
                    <Input
                      id="legal_id"
                      {...register('legal_id')}
                      placeholder="CI-ABJ-2024-A-12345"
                      maxLength={50}
                      className="h-10 sm:h-12 text-sm sm:text-base"
                    />
                    {errors.legal_id && (
                      <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.legal_id.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Le RCCM (Registre du Commerce et du Crédit Mobilier) identifie votre entreprise
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adresse" className="text-sm sm:text-base font-semibold">Adresse complète</Label>
                    <Input
                      id="adresse"
                      {...register('adresse')}
                      placeholder="123 Rue Example, 75001 Paris, France"
                      className="h-10 sm:h-12 text-sm sm:text-base"
                    />
                    {errors.adresse && (
                      <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.adresse.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Contact du référent */}
              {currentStep === 2 && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Information :</strong> Ces informations concernent le référent principal de l'entreprise. Tous les champs sont optionnels.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contact_first_name" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Prénom du référent
                      </Label>
                      <Input
                        id="contact_first_name"
                        {...register('contact_first_name')}
                        placeholder="Ex: Jean"
                        className="h-10 sm:h-12 text-sm sm:text-base"
                      />
                      {errors.contact_first_name && (
                        <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.contact_first_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_last_name" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom du référent
                      </Label>
                      <Input
                        id="contact_last_name"
                        {...register('contact_last_name')}
                        placeholder="Ex: Dupont"
                        className="h-10 sm:h-12 text-sm sm:text-base"
                      />
                      {errors.contact_last_name && (
                        <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.contact_last_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email du référent
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      {...register('contact_email')}
                      placeholder="Ex: jean.dupont@entreprise.com"
                      className="h-10 sm:h-12 text-sm sm:text-base"
                    />
                    {errors.contact_email && (
                      <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.contact_email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone du référent
                      </Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        {...register('contact_phone')}
                        placeholder="Ex: +225 07 12 34 56 78"
                        className="h-10 sm:h-12 text-sm sm:text-base"
                      />
                      {errors.contact_phone && (
                        <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.contact_phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_function" className="text-sm sm:text-base font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Fonction du référent
                      </Label>
                      <Input
                        id="contact_function"
                        {...register('contact_function')}
                        placeholder="Ex: Directeur RH, Responsable Recrutement"
                        className="h-10 sm:h-12 text-sm sm:text-base"
                      />
                      {errors.contact_function && (
                        <p className="text-xs sm:text-sm text-red-600 animate-in fade-in">{errors.contact_function.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Logo */}
              {currentStep === 3 && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <Label className="text-sm sm:text-base font-semibold">Logo de l'entreprise</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-[12px] p-6 sm:p-8 md:p-12 text-center bg-gray-50 hover:border-[#226D68] transition-colors">
                      {logoUrl ? (
                        <div className="space-y-3 sm:space-y-4">
                          <img
                            src={logoUrl}
                            alt="Logo entreprise"
                            className="max-w-full sm:max-w-xs max-h-32 sm:max-h-40 mx-auto object-contain rounded-lg shadow-md"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Logo actuel. Téléchargez une nouvelle image pour le remplacer.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-[#226D68]/20 to-blue-deep/20 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-[#226D68]" />
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                            Aucun logo téléchargé
                          </p>
                        </div>
                      )}
                      <div className="mt-4 sm:mt-6">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          disabled={uploading}
                          onChange={(e) => handleLogoUpload(e.target.files)}
                          className="max-w-full sm:max-w-xs mx-auto text-xs sm:text-sm"
                        />
                        {uploading && (
                          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Téléchargement en cours...</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-3 sm:mt-4">
                          Formats acceptés: JPG, PNG. Taille maximale: 5 Mo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Récapitulatif */}
              {currentStep === 4 && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6 rounded-[12px] border border-gray-200 space-y-3 sm:space-4">
                    <div className="pb-3 sm:pb-4 border-b border-gray-200">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Nom de l'entreprise</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{watch('name')}</p>
                    </div>
                    <div className="pb-3 sm:pb-4 border-b border-gray-200">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">RCCM</p>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">{watch('legal_id')}</p>
                    </div>
                    {watch('adresse') && (
                      <div className="pb-3 sm:pb-4 border-b border-gray-200">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Adresse</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-900 break-words">{watch('adresse')}</p>
                      </div>
                    )}
                    {(watch('contact_first_name') || watch('contact_last_name') || watch('contact_email') || watch('contact_phone') || watch('contact_function')) && (
                      <div className="pb-3 sm:pb-4 border-b border-gray-200">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Contact du référent</p>
                        <div className="space-y-2">
                          {(watch('contact_first_name') || watch('contact_last_name')) && (
                            <p className="text-base sm:text-lg font-semibold text-gray-900">
                              {watch('contact_first_name')} {watch('contact_last_name')}
                            </p>
                          )}
                          {watch('contact_function') && (
                            <p className="text-sm text-gray-600">{watch('contact_function')}</p>
                          )}
                          {watch('contact_email') && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {watch('contact_email')}
                            </p>
                          )}
                          {watch('contact_phone') && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {watch('contact_phone')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {logoUrl && (
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">Logo</p>
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="max-w-full sm:max-w-40 max-h-20 sm:max-h-24 object-contain rounded-lg shadow-sm border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    Vérifiez que toutes les informations sont correctes avant de finaliser.
                  </p>
                </div>
              )}

              {/* Navigation Buttons - Responsive */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (currentStep > 1) {
                      setCurrentStep(currentStep - 1)
                    } else {
                      navigate('/company/dashboard')
                    }
                  }}
                  className="border-blue-deep text-blue-deep hover:bg-blue-deep/10 w-full sm:w-auto order-2 sm:order-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {currentStep === 1 ? 'Annuler' : 'Précédent'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploading}
                  className="bg-[#226D68] hover:bg-[#226D68]/90 text-white w-full sm:w-auto order-1 sm:order-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Enregistrement...</span>
                      <span className="sm:hidden">Enregistrement...</span>
                    </>
                  ) : currentStep === STEPS.length ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finaliser
                    </>
                  ) : (
                    <>
                      Suivant
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
