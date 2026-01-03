import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  step0Schema, 
  step1Schema, 
  step2Schema, 
  step3Schema, 
  step4Schema, 
  step5Schema, 
  step6Schema, 
  step7Schema 
} from '@/schemas/onboarding'
import { candidateApi, authApiService } from '@/services/api'
import { transformBackendToFrontend, mapStep0ToBackend, mapStep1ToBackend, mapStep2ToBackend, mapStep3ToBackend, mapStep4ToBackend, mapStep5ToBackend, mapStep7ToBackend, saveOnboardingProfile } from '@/utils/onboardingApiMapper'
import { useNavigate } from 'react-router-dom'
import Step0 from './onboarding/Step0'
import Step1 from './onboarding/Step1'
import Step2 from './onboarding/Step2'
import Step3 from './onboarding/Step3'
import Step4 from './onboarding/Step4'
import Step5 from './onboarding/Step5'
import Step6 from './onboarding/Step6'
import Step7 from './onboarding/Step7'
import Step8 from './onboarding/Step8'
import { CheckCircle2, Circle } from 'lucide-react'

const STEPS = [
  { id: 0, title: 'Conditions & Consentement', component: Step0, schema: step0Schema },
  { id: 1, title: 'Profil Général', component: Step1, schema: step1Schema },
  { id: 2, title: 'Expériences Professionnelles', component: Step2, schema: step2Schema },
  { id: 3, title: 'Formations & Diplômes', component: Step3, schema: step3Schema },
  { id: 4, title: 'Certifications', component: Step4, schema: step4Schema },
  { id: 5, title: 'Compétences', component: Step5, schema: step5Schema },
  { id: 6, title: 'Documents', component: Step6, schema: step6Schema },
  { id: 7, title: 'Recherche d\'emploi', component: Step7, schema: step7Schema },
  { id: 8, title: 'Récapitulatif', component: Step8, schema: null },
]

export default function OnboardingStepper() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [formData, setFormData] = useState({})
  const [profileId, setProfileId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const currentStepConfig = STEPS[currentStep]
  const StepComponent = currentStepConfig.component

  // Calcul du pourcentage de progression (utiliser celui du backend si disponible)
  const progress = formData.completionPercentage || ((currentStep + 1) / STEPS.length) * 100

  // Charger le profil au montage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        // Vérifier si l'utilisateur est connecté
        const token = localStorage.getItem('auth_token')
        if (!token) {
          // Rediriger vers login si non connecté
          navigate('/login')
          return
        }

        // Récupérer le profil
        try {
          const profile = await candidateApi.getMyProfile()
          setProfileId(profile.id)
          
          // Transformer les données backend vers frontend
          const transformedData = transformBackendToFrontend(profile)
          setFormData(transformedData)
          
          // Marquer les étapes complétées
          const completed = new Set()
          for (let i = 0; i <= (transformedData.lastStep || 0); i++) {
            completed.add(i)
          }
          setCompletedSteps(completed)
          
          // Aller à la dernière étape complétée + 1
          if (transformedData.lastStep !== undefined && transformedData.lastStep < STEPS.length - 1) {
            setCurrentStep(transformedData.lastStep + 1)
          }
        } catch (error) {
          // Si le profil n'existe pas (404), créer un nouveau profil
          if (error.response?.status === 404) {
            try {
              const user = await authApiService.getCurrentUser()
              const newProfile = await candidateApi.createProfile({
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
              })
              setProfileId(newProfile.id)
            } catch (createError) {
              console.error('Erreur lors de la création du profil:', createError)
            }
          } else {
            console.error('Erreur lors du chargement du profil:', error)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [navigate])

  // Form pour l'étape actuelle
  const form = useForm({
    resolver: currentStepConfig.schema ? zodResolver(currentStepConfig.schema) : undefined,
    defaultValues: formData[`step${currentStep}`] || {},
    mode: 'onChange',
  })

  // Sauvegarde automatique
  const saveToAPI = useCallback(async (data, stepNumber = currentStep) => {
    if (isSaving || !profileId) return
    
    try {
      setIsSaving(true)
      
      if (stepNumber === 0 || stepNumber === 1) {
        // Mettre à jour le profil principal
        const backendData = stepNumber === 0 
          ? mapStep0ToBackend(data)
          : mapStep1ToBackend(data)
        
        await candidateApi.updateProfile(profileId, {
          ...backendData,
          last_step_completed: stepNumber,
        })
      } else if (stepNumber === 2) {
        // Gérer les expériences
        const experiences = mapStep2ToBackend({ experiences: data.experiences || [] })
        try {
          const existing = await candidateApi.getExperiences(profileId)
          for (const exp of existing) {
            await candidateApi.deleteExperience(profileId, exp.id)
          }
        } catch (error) {
          // Ignorer si aucune expérience n'existe
        }
        for (const exp of experiences) {
          await candidateApi.createExperience(profileId, exp)
        }
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      } else if (stepNumber === 3) {
        // Gérer les formations
        const educations = mapStep3ToBackend({ educations: data.educations || [] })
        try {
          const existing = await candidateApi.getEducations(profileId)
          for (const edu of existing) {
            await candidateApi.deleteEducation(profileId, edu.id)
          }
        } catch (error) {
          // Ignorer si aucune formation n'existe
        }
        for (const edu of educations) {
          await candidateApi.createEducation(profileId, edu)
        }
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      } else if (stepNumber === 4) {
        // Gérer les certifications
        const certifications = mapStep4ToBackend({ certifications: data.certifications || [] })
        try {
          const existing = await candidateApi.getCertifications(profileId)
          for (const cert of existing) {
            await candidateApi.deleteCertification(profileId, cert.id)
          }
        } catch (error) {
          // Ignorer si aucune certification n'existe
        }
        for (const cert of certifications) {
          await candidateApi.createCertification(profileId, cert)
        }
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      } else if (stepNumber === 5) {
        // Gérer les compétences
        const skills = mapStep5ToBackend({ skills: data.skills || [] })
        try {
          const existing = await candidateApi.getSkills(profileId)
          for (const skill of existing) {
            await candidateApi.deleteSkill(profileId, skill.id)
          }
        } catch (error) {
          // Ignorer si aucune compétence n'existe
        }
        for (const skill of skills) {
          await candidateApi.createSkill(profileId, skill)
        }
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      } else if (stepNumber === 7) {
        // Gérer les préférences
        const preferences = mapStep7ToBackend(data)
        await candidateApi.updateJobPreferences(profileId, preferences)
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      }
      
      // Mettre à jour les données locales
      setFormData(prev => ({
        ...prev,
        [`step${stepNumber}`]: data,
        lastStep: stepNumber,
      }))
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      // Afficher une notification d'erreur (à implémenter avec un toast)
      alert('Erreur lors de la sauvegarde: ' + (error.response?.data?.detail || error.message))
    } finally {
      setIsSaving(false)
    }
  }, [currentStep, profileId, isSaving])

  // Sauvegarde automatique toutes les 30 secondes
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Mettre à jour les données locales
      setFormData(prev => ({
        ...prev,
        [`step${currentStep}`]: data,
      }))
    })

    const autoSaveInterval = setInterval(() => {
      const currentData = form.getValues()
      if (Object.keys(currentData).length > 0) {
        saveToAPI(currentData)
      }
    }, 30000) // 30 secondes

    return () => {
      subscription.unsubscribe()
      clearInterval(autoSaveInterval)
    }
  }, [form, currentStep, saveToAPI])

  // Sauvegarde au changement d'étape
  const handleStepChange = useCallback(async (newStep) => {
    const currentData = form.getValues()
    
    // Valider avant de changer d'étape (sauf pour l'étape 8)
    if (currentStepConfig.schema && newStep > currentStep) {
      const isValid = await form.trigger()
      if (!isValid) {
        return
      }
    }

    // Sauvegarder avant de changer
    if (Object.keys(currentData).length > 0) {
      await saveToAPI(currentData)
    }

    // Marquer l'étape comme complétée
    setCompletedSteps(prev => new Set([...prev, currentStep]))

    // Charger les données de la nouvelle étape
    const nextStepData = formData[`step${newStep}`] || {}
    form.reset(nextStepData)
    
    setCurrentStep(newStep)
  }, [currentStep, form, formData, currentStepConfig, saveToAPI])

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      handleStepChange(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1)
    }
  }

  const handleSubmit = async (data) => {
    if (!profileId) {
      alert('Erreur: Profil non trouvé')
      return
    }
    
    try {
      setIsSaving(true)
      
      // Sauvegarder toutes les données
      const finalData = {
        ...formData,
        [`step${currentStep}`]: data,
      }
      
      await saveOnboardingProfile(profileId, finalData, candidateApi)
      
      // Soumettre le profil pour validation
      await candidateApi.submitProfile(profileId)
      
      // Rediriger vers une page de confirmation
      navigate('/onboarding/complete')
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de la soumission du profil'
      alert('Erreur lors de la soumission: ' + errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Afficher un loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Barre de progression */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-medium text-muted-foreground">
                Étape {currentStep + 1} sur {STEPS.length}
              </h2>
              <span className="text-sm text-muted-foreground">
                {isSaving ? 'Sauvegarde...' : lastSaved ? `Dernière sauvegarde: ${lastSaved.toLocaleTimeString()}` : ''}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Indicateurs d'étapes */}
          <div className="flex justify-between mt-4">
            {STEPS.slice(0, 8).map((step, index) => (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1 cursor-pointer"
                onClick={() => index <= currentStep && handleStepChange(index)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  completedSteps.has(index)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStep
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted text-muted-foreground'
                }`}>
                  {completedSteps.has(index) ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs mt-1 text-center ${
                  index === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}>
                  {step.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-6">{currentStepConfig.title}</h1>
          
          <StepComponent
            form={form}
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            isLastStep={currentStep === STEPS.length - 1}
            isFirstStep={currentStep === 0}
          />
        </div>
      </div>
    </div>
  )
}

