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
import { Building, Upload, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { companyApi, documentApi } from '@/services/api'

// Schéma de validation pour l'onboarding entreprise
const companyOnboardingSchema = z.object({
  name: z.string().min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères'),
  legal_id: z.string().min(9, 'Le RCCM doit contenir au moins 9 caractères'),
  adresse: z.string().min(10, 'L\'adresse doit contenir au moins 10 caractères').optional(),
  logo: z.instanceof(FileList).optional(),
})

const STEPS = [
  { id: 1, title: 'Informations générales', description: 'Nom, RCCM et adresse' },
  { id: 2, title: 'Logo de l\'entreprise', description: 'Téléchargez le logo de votre entreprise' },
  { id: 3, title: 'Récapitulatif', description: 'Vérifiez vos informations avant de finaliser' },
]

export default function CompanyOnboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [company, setCompany] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

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
      const companyData = await companyApi.getMyCompany()
      setCompany(companyData)
      setLogoUrl(companyData.logo_url)
      
      // Pré-remplir le formulaire si l'entreprise existe déjà
      if (companyData) {
        setValue('name', companyData.name || '')
        setValue('legal_id', companyData.legal_id || '')
        setValue('adresse', companyData.adresse || '')
      }
    } catch (error) {
      console.error('Error loading company:', error)
      if (error.response?.status === 404) {
        // L'entreprise n'existe pas encore, c'est normal
        setCompany(null)
      } else {
        setError('Erreur lors du chargement des données de l\'entreprise')
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

      // Récupérer l'ID de l'entreprise ou créer l'entreprise si elle n'existe pas
      let companyId = company?.id
      
      // Si l'entreprise n'existe pas encore, la créer avec les données du formulaire
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
          })
          companyId = newCompany.id
          setCompany(newCompany)
        } catch (err) {
          console.error('Error creating company:', err)
          setError('Erreur lors de la création de l\'entreprise: ' + (err.response?.data?.detail || err.message))
          return
        }
      }

      const uploadResponse = await documentApi.uploadCompanyLogo(file, companyId)
      
      if (uploadResponse.url) {
        setLogoUrl(uploadResponse.url)
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
        // Vérifier que les champs requis sont remplis
        if (!data.name || !data.legal_id) {
          setError('Veuillez remplir tous les champs obligatoires')
          return
        }
        setCurrentStep(2)
      } else if (currentStep === 2) {
        // Passer à l'étape récapitulatif
        setCurrentStep(3)
      } else if (currentStep === 3) {
        // Finaliser l'onboarding
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
        // Mettre à jour l'entreprise existante
        await companyApi.updateCompany(company.id, {
          name: data.name,
          legal_id: data.legal_id,
          adresse: data.adresse || null,
          logo_url: logoUrl || null,
        })
      } else {
        // Créer l'entreprise si elle n'existe pas
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        await companyApi.createCompany({
          name: data.name,
          legal_id: data.legal_id,
          adresse: data.adresse || null,
          logo_url: logoUrl || null,
          admin_id: user.id,
        })
      }

      // Rediriger vers le dashboard
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/company/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold mb-2">Configuration de votre entreprise</h1>
          <p className="text-muted-foreground">
            Complétez les informations de votre entreprise pour commencer à utiliser la plateforme
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${currentStep > step.id ? 'bg-primary border-primary text-primary-foreground' : 
                    currentStep === step.id ? 'bg-primary border-primary text-primary-foreground' : 
                    'bg-background border-muted-foreground text-muted-foreground'}
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="font-semibold">{step.id}</span>
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-2
                    ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Step 1: Informations générales */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de l'entreprise *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Ex: Acme Corporation"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legal_id">Numéro RCCM *</Label>
                    <Input
                      id="legal_id"
                      {...register('legal_id')}
                      placeholder="CI-ABJ-2024-A-12345"
                      maxLength={50}
                    />
                    {errors.legal_id && (
                      <p className="text-sm text-destructive">{errors.legal_id.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Le RCCM (Registre du Commerce et du Crédit Mobilier) identifie votre entreprise
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adresse">Adresse complète</Label>
                    <Input
                      id="adresse"
                      {...register('adresse')}
                      placeholder="123 Rue Example, 75001 Paris, France"
                    />
                    {errors.adresse && (
                      <p className="text-sm text-destructive">{errors.adresse.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Logo */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo de l'entreprise</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      {logoUrl ? (
                        <div className="space-y-4">
                          <img
                            src={logoUrl}
                            alt="Logo entreprise"
                            className="max-w-xs max-h-32 mx-auto object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Logo actuel. Téléchargez une nouvelle image pour le remplacer.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Building className="w-16 h-16 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Aucun logo téléchargé
                          </p>
                        </div>
                      )}
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => handleLogoUpload(e.target.files)}
                        className="max-w-xs mx-auto mt-4"
                      />
                      {uploading && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Téléchargement en cours...</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Formats acceptés: JPG, PNG. Taille maximale: 5 Mo
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Récapitulatif */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nom de l'entreprise</p>
                      <p className="text-lg font-semibold">{watch('name')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">RCCM</p>
                      <p className="text-lg font-semibold">{watch('legal_id')}</p>
                    </div>
                    {watch('adresse') && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                        <p className="text-lg font-semibold">{watch('adresse')}</p>
                      </div>
                    )}
                    {logoUrl && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Logo</p>
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="max-w-32 max-h-20 object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez que toutes les informations sont correctes avant de finaliser.
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
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
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {currentStep === 1 ? 'Annuler' : 'Précédent'}
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
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
