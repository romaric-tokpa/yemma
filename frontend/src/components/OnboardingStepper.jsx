import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Step0 from './onboarding/Step0'
import Step1 from './onboarding/Step1'
import Step2 from './onboarding/Step2'
import Step3 from './onboarding/Step3'
import Step4 from './onboarding/Step4'
import Step5 from './onboarding/Step5'
import Step6 from './onboarding/Step6'
import Step7 from './onboarding/Step7'
import Step8 from './onboarding/Step8'
import { 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Save,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Zap,
  File,
  Search,
  CheckSquare
} from 'lucide-react'
import { Card } from '@/components/ui/card'

const STEPS = [
  { id: 0, title: 'Conditions & Consentement', icon: FileText, component: Step0, schema: step0Schema },
  { id: 1, title: 'Profil Général', icon: User, component: Step1, schema: step1Schema },
  { id: 2, title: 'Expériences', icon: Briefcase, component: Step2, schema: step2Schema },
  { id: 3, title: 'Formations', icon: GraduationCap, component: Step3, schema: step3Schema },
  { id: 4, title: 'Certifications', icon: Award, component: Step4, schema: step4Schema },
  { id: 5, title: 'Compétences', icon: Zap, component: Step5, schema: step5Schema },
  { id: 6, title: 'Documents', icon: File, component: Step6, schema: step6Schema },
  { id: 7, title: 'Recherche d\'emploi', icon: Search, component: Step7, schema: step7Schema },
  { id: 8, title: 'Récapitulatif', icon: CheckSquare, component: Step8, schema: step0Schema },
]

export default function OnboardingStepper() {
  const navigate = useNavigate()
  const location = useLocation()
  const [completedSteps, setCompletedSteps] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [formData, setFormData] = useState({})
  const [profileId, setProfileId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialStepLoaded, setInitialStepLoaded] = useState(false)
  const previousStepRef = useRef(null)

  const getStepFromPath = () => {
    const match = location.pathname.match(/\/onboarding\/step(\d+)/)
    if (match) {
      const stepNum = parseInt(match[1], 10)
      if (stepNum === 0) return 1
      if (stepNum >= 1 && stepNum <= 8) return stepNum
    }
    return 1
  }

  const currentStep = getStepFromPath()
  const currentStepConfig = STEPS[currentStep]
  const StepComponent = currentStepConfig.component

  const progress = useMemo(() => {
    if (formData.completionPercentage !== undefined && formData.completionPercentage !== null) {
      return formData.completionPercentage
    }
    
    const completedCount = completedSteps.length
    const hasCurrentStepData = formData[`step${currentStep}`] && Object.keys(formData[`step${currentStep}`]).length > 0
    const isCurrentStepCompleted = completedSteps.includes(currentStep)
    
    let progressValue = completedCount
    if (!isCurrentStepCompleted && hasCurrentStepData) {
      progressValue += 0.5
    }
    
    return Math.min(100, (progressValue / 8) * 100)
  }, [formData.completionPercentage, completedSteps, formData, currentStep])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('auth_token')
        if (!token) {
          navigate('/login')
          return
        }

        try {
          const profile = await candidateApi.getMyProfile()
          setProfileId(profile.id)
          
          const transformedData = transformBackendToFrontend(profile)
          setFormData(transformedData)
          
          const completed = []
          const lastStep = transformedData.lastStep !== undefined && transformedData.lastStep !== null ? transformedData.lastStep : 0
          for (let i = 1; i <= Math.min(lastStep, 8); i++) {
            completed.push(i)
          }
          setCompletedSteps(completed)
          
          if (!initialStepLoaded) {
            const stepFromPath = getStepFromPath()
            const lastStep = transformedData.lastStep !== undefined && transformedData.lastStep !== null ? transformedData.lastStep : 0
            const targetStep = lastStep < 1 ? 1 : Math.min(lastStep + 1, 8)
            if (location.pathname === '/onboarding' || location.pathname === '/onboarding/step0' || stepFromPath < 1 || stepFromPath > 8) {
              navigate(`/onboarding/step${targetStep}`, { replace: true })
            } else if (stepFromPath > targetStep && stepFromPath !== 8) {
              navigate(`/onboarding/step${targetStep}`, { replace: true })
            }
            setInitialStepLoaded(true)
          }
        } catch (error) {
          if (error.response?.status === 404) {
            try {
              const user = await authApiService.getCurrentUser()
              const newProfile = await candidateApi.createProfile({
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
              })
              setProfileId(newProfile.id)
              // Préremplir step1 avec les infos d'inscription (prénom, nom, email)
              setFormData((prev) => ({
                ...prev,
                step1: {
                  ...(prev.step1 || {}),
                  firstName: newProfile.first_name ?? user.first_name ?? '',
                  lastName: newProfile.last_name ?? user.last_name ?? '',
                  email: newProfile.email ?? user.email ?? '',
                },
              }))
              if (!initialStepLoaded) {
                navigate('/onboarding/step1', { replace: true })
                setInitialStepLoaded(true)
              }
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
  }, [navigate, initialStepLoaded])

  const form = useForm({
    resolver: currentStepConfig.schema ? zodResolver(currentStepConfig.schema) : undefined,
    defaultValues: {},
    mode: 'onChange',
  })

  const currentStepData = useMemo(() => {
    const stepFromPath = getStepFromPath()
    const stepData = formData[`step${stepFromPath}`] || {}
    if (stepFromPath === 8) {
      const step0 = formData.step0 || { acceptCGU: false, acceptRGPD: false, acceptVerification: false }
      return { ...stepData, ...step0 }
    }
    return stepData
  }, [location.pathname, formData])

  useEffect(() => {
    const stepFromPath = getStepFromPath()
    previousStepRef.current = stepFromPath
    // Toujours synchroniser le formulaire avec currentStepData (navigation ou préremplissage après inscription)
    form.reset(currentStepData)
  }, [location.pathname, form, currentStepData])

  const saveToAPI = useCallback(async (data, stepNumber = currentStep) => {
    if (isSaving || !profileId) return
    
    try {
      setIsSaving(true)
      
      if (stepNumber === 0 || stepNumber === 1) {
        const backendData = stepNumber === 0 
          ? mapStep0ToBackend(data)
          : mapStep1ToBackend(data)
        
        if (stepNumber === 0) {
          console.log('Sauvegarde des consentements (étape 0):', {
            frontend_data: data,
            backend_mapped: backendData,
          })
        }
        
        await candidateApi.updateProfile(profileId, {
          ...backendData,
          last_step_completed: stepNumber,
        })
      } else if (stepNumber === 2) {
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
          console.log('Création d\'expérience avec données:', JSON.stringify(exp, null, 2))
          if (!exp.company_name || !exp.position || !exp.start_date) {
            console.error('Expérience invalide - champs manquants:', {
              company_name: exp.company_name,
              position: exp.position,
              start_date: exp.start_date
            })
            throw new Error(`Expérience invalide: champs obligatoires manquants (company_name, position, start_date)`)
          }
          // Validation : si is_current est false, end_date doit être présent
          if (!exp.is_current && !exp.end_date) {
            console.error('Expérience invalide - date de fin manquante pour expérience terminée:', {
              company_name: exp.company_name,
              is_current: exp.is_current,
              end_date: exp.end_date
            })
            throw new Error(`Expérience invalide: la date de fin est obligatoire si l'expérience n'est pas en cours`)
          }
          // S'assurer que end_date n'est pas inclus si is_current est true
          const expToSend = { ...exp }
          if (expToSend.is_current) {
            delete expToSend.end_date
          }
          await candidateApi.createExperience(profileId, expToSend)
        }
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      } else if (stepNumber === 3) {
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
        const skills = mapStep5ToBackend(data)
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
      } else if (stepNumber === 6) {
        // Pour l'étape 6, les documents sont déjà sauvegardés automatiquement dans Step6
        // On met juste à jour le last_step_completed
        // Les documents sont uploadés immédiatement lors de leur sélection dans Step6
        // et stockés dans formData.step6.cv_document_id et formData.step6.additional_document_ids
        
        // Si on a des IDs de documents dans formData, on peut les utiliser pour mettre à jour le profil
        // mais normalement ils sont déjà sauvegardés via Step6
        const step6Data = formData.step6 || {}
        
        // Si le CV a un document_id, on peut le mettre à jour dans le profil si nécessaire
        // (actuellement, le CV est juste uploadé et stocké dans le Document Service)
        
        // Mettre à jour uniquement le last_step_completed
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      } else if (stepNumber === 7) {
        const preferences = mapStep7ToBackend(data)
        await candidateApi.updateJobPreferences(profileId, preferences)
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      }
      
      try {
        const updatedProfile = await candidateApi.getMyProfile()
        const transformedData = transformBackendToFrontend(updatedProfile)
        setFormData(transformedData)
        
        const completed = []
        const lastStep = transformedData.lastStep !== undefined && transformedData.lastStep !== null ? transformedData.lastStep : -1
        for (let i = 0; i <= lastStep && i < STEPS.length; i++) {
          completed.push(i)
        }
        setCompletedSteps(completed)
      } catch (error) {
        console.error('Erreur lors du rechargement du profil:', error)
        setFormData(prev => ({
          ...prev,
          [`step${stepNumber}`]: data,
          lastStep: stepNumber,
        }))
        setCompletedSteps(prev => {
          if (!prev.includes(stepNumber)) {
            return [...prev, stepNumber].sort((a, b) => a - b)
          }
          return prev
        })
      }
      
      setLastSaved(new Date())
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      const errorDetails = error.response?.data
      let errorMessage = error.message
      if (errorDetails) {
        if (errorDetails.detail) {
          if (Array.isArray(errorDetails.detail)) {
            const validationErrors = errorDetails.detail.map(err => {
              const field = err.loc ? err.loc.join('.') : 'unknown'
              return `${field}: ${err.msg}`
            }).join('\n')
            errorMessage = `Erreurs de validation:\n${validationErrors}`
          } else {
            errorMessage = errorDetails.detail
          }
        } else if (errorDetails.message) {
          errorMessage = errorDetails.message
        }
      }
      alert('Erreur lors de la sauvegarde: ' + errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [currentStep, profileId, isSaving])

  useEffect(() => {
    const subscription = form.watch((data) => {
      setFormData(prev => ({
        ...prev,
        [`step${currentStep}`]: data,
      }))
    })

    const autoSaveInterval = setInterval(() => {
      const currentData = form.getValues()
      if (Object.keys(currentData).length > 0) {
        // Pour l'étape 6, ne pas sauvegarder automatiquement les fichiers
        // car ils sont déjà sauvegardés immédiatement lors de leur sélection
        // On sauvegarde seulement si ce n'est pas l'étape 6 ou si les documents sont déjà uploadés
        if (currentStep !== 6) {
          saveToAPI(currentData)
        } else {
          // Pour l'étape 6, sauvegarder seulement le last_step_completed si nécessaire
          // Les documents sont déjà sauvegardés via Step6
          const step6Data = formData.step6 || {}
          if (step6Data.cv_document_id || step6Data.additional_document_ids?.length > 0) {
            // Les documents sont déjà sauvegardés, on peut juste mettre à jour le last_step_completed
            candidateApi.updateProfile(profileId, { last_step_completed: 6 }).catch(err => {
              console.warn('Erreur lors de la mise à jour du last_step_completed:', err)
            })
          }
        }
      }
    }, 30000)

    return () => {
      subscription.unsubscribe()
      clearInterval(autoSaveInterval)
    }
  }, [form, currentStep, saveToAPI, formData, profileId])

  const handleStepChange = useCallback(async (newStep) => {
    const currentData = form.getValues()
    
    if (currentStepConfig.schema && newStep > currentStep) {
      const isValid = await form.trigger()
      if (!isValid) {
        console.log('Validation échouée, ne pas changer d\'étape')
        return false
      }
    }

    const shouldMarkCompleted = newStep > currentStep
    if (Object.keys(currentData).length > 0 && profileId) {
      try {
        await saveToAPI(currentData, currentStep)
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
      }
    }

    if (shouldMarkCompleted) {
      setCompletedSteps(prev => {
        if (!prev.includes(currentStep)) {
          return [...prev, currentStep].sort((a, b) => a - b)
        }
        return prev
      })
    }

    navigate(`/onboarding/step${newStep}`)
    return true
  }, [currentStep, form, formData, currentStepConfig, saveToAPI, profileId, navigate])

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      await handleStepChange(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
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
      
      let profile
      let transformedData
      try {
        profile = await candidateApi.getMyProfile()
        transformedData = transformBackendToFrontend(profile)
      } catch (error) {
        console.error('Erreur lors du rechargement du profil avant soumission:', error)
        throw new Error('Impossible de charger le profil depuis le serveur')
      }
      
      const finalData = {
        ...transformedData,
        ...formData,
        [`step${currentStep}`]: data,
        step0: currentStep === 8 ? {
          acceptCGU: data.acceptCGU === true,
          acceptRGPD: data.acceptRGPD === true,
          acceptVerification: data.acceptVerification === true,
        } : (transformedData.step0 || {
          acceptCGU: false,
          acceptRGPD: false,
          acceptVerification: false,
        }),
      }
      
      // Sauvegarder explicitement l'étape courante si ce n'est pas l'étape 8 (récapitulatif)
      if (currentStep < 8 && data) {
        console.log(`Sauvegarde de l'étape ${currentStep} avant soumission...`)
        try {
          await saveToAPI(data, currentStep)
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.warn(`Erreur lors de la sauvegarde de l'étape ${currentStep}:`, error)
          // Continuer quand même, les données seront sauvegardées dans saveOnboardingProfile
        }
      }
      
      // Sauvegarder toutes les données avant la soumission
      console.log('Sauvegarde complète du profil avant soumission...')
      await saveOnboardingProfile(profileId, finalData, candidateApi)
      
      // Attendre un peu pour que la sauvegarde soit complète
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Recharger le profil pour s'assurer que toutes les données sont à jour
      try {
        const refreshedProfile = await candidateApi.getMyProfile()
        console.log('Profil rechargé après sauvegarde:', {
          completion_percentage: refreshedProfile.completion_percentage || 'Non calculé',
          experiences: refreshedProfile.experiences?.length || 0,
          educations: refreshedProfile.educations?.length || 0,
          skills: refreshedProfile.skills?.length || 0,
          job_preferences: refreshedProfile.job_preferences ? 'Oui' : 'Non',
        })
      } catch (error) {
        console.warn('Erreur lors du rechargement du profil après sauvegarde:', error)
      }
      
      let updatedProfile
      try {
        updatedProfile = await candidateApi.getMyProfile()
        const transformedData = transformBackendToFrontend(updatedProfile)
        setFormData(transformedData)
        
        console.log('Profil avant soumission:', {
          completion_percentage: updatedProfile.completion_percentage || 'Non calculé',
          accept_cgu: updatedProfile.accept_cgu,
          accept_rgpd: updatedProfile.accept_rgpd,
          accept_verification: updatedProfile.accept_verification,
          experiences: updatedProfile.experiences?.length || 0,
          educations: updatedProfile.educations?.length || 0,
          skills: updatedProfile.skills?.length || 0,
          job_preferences: updatedProfile.job_preferences ? 'Oui' : 'Non',
          has_cv: 'Vérification en cours...'
        })
      } catch (error) {
        console.warn('Erreur lors du rechargement du profil avant soumission:', error)
        updatedProfile = profile
      }
      
      await candidateApi.submitProfile(profileId)
      
      navigate('/candidate/dashboard')
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      
      // Extraire le message d'erreur détaillé
      let errorMessage = 'Erreur lors de la soumission du profil'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Messages d'erreur plus clairs pour l'utilisateur
      const errorMessages = {
        'CV PDF': 'Un CV PDF est obligatoire. Veuillez télécharger votre CV à l\'étape 6 (Documents).',
        'consentements': 'Vous devez accepter les conditions d\'utilisation (CGU, RGPD et vérification).',
        'prénom': 'Le prénom et le nom sont obligatoires. Veuillez compléter l\'étape 1 (Profil général).',
        'email': 'L\'email est obligatoire.',
        'date de naissance': 'La date de naissance est obligatoire. Veuillez compléter l\'étape 1 (Profil général).',
        'nationalité': 'La nationalité est obligatoire. Veuillez compléter l\'étape 1 (Profil général).',
        'téléphone': 'Le téléphone est obligatoire. Veuillez compléter l\'étape 1 (Profil général).',
        'adresse': 'L\'adresse complète (adresse, ville, pays) est obligatoire. Veuillez compléter l\'étape 1 (Profil général).',
        'titre du profil': 'Le titre du profil est obligatoire. Veuillez compléter l\'étape 1 (Profil général).',
        'résumé professionnel': 'Le résumé professionnel (minimum 300 caractères) est obligatoire. Veuillez compléter l\'étape 1 (Profil général).',
        'secteur': 'Le secteur d\'activité est obligatoire. Veuillez compléter l\'étape 1 (Profil général).',
        'métier principal': 'Le métier principal est obligatoire. Veuillez compléter l\'étape 1 (Profil général).',
        'expérience': 'Au moins une expérience professionnelle est requise. Veuillez compléter l\'étape 2 (Expériences).',
        'formation': 'Au moins une formation est requise. Veuillez compléter l\'étape 3 (Formations).',
        'compétence': 'Au moins une compétence technique est requise. Veuillez compléter l\'étape 5 (Compétences).',
        'préférences': 'Les préférences de recherche d\'emploi sont requises. Veuillez compléter l\'étape 7 (Recherche d\'emploi).',
        'type de contrat': 'Le type de contrat souhaité est obligatoire. Veuillez compléter l\'étape 7 (Recherche d\'emploi).',
        'localisation': 'La localisation souhaitée est obligatoire. Veuillez compléter l\'étape 7 (Recherche d\'emploi).',
        'disponibilité': 'La disponibilité est obligatoire. Veuillez compléter l\'étape 7 (Recherche d\'emploi).',
        'poste recherché': 'Au moins un poste recherché est obligatoire. Veuillez compléter l\'étape 7 (Recherche d\'emploi).',
        'prétentions salariales': 'Les prétentions salariales (min ou max) sont obligatoires. Veuillez compléter l\'étape 7 (Recherche d\'emploi).',
      }
      
      // Chercher un message d'erreur plus clair basé sur le contenu
      for (const [key, message] of Object.entries(errorMessages)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
          errorMessage = message
          break
        }
      }
      
      alert('Erreur lors de la soumission:\n\n' + errorMessage + '\n\nVeuillez compléter les informations manquantes et réessayer.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-light to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#226D68] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white">
      {/* Header avec gradient vert émeraude - Responsive */}
      <div className="bg-gradient-to-r from-[#226D68] to-[#1a5a55] text-white shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-heading mb-1 sm:mb-2">Création de votre profil</h1>
              <p className="text-xs sm:text-sm text-white/80">Complétez votre profil pour être visible par les recruteurs</p>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80 flex-shrink-0">
                <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Dernière sauvegarde: {lastSaved.toLocaleTimeString()}</span>
                <span className="sm:hidden">{lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
          
          {/* Barre de progression améliorée */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium">
                Étape {currentStep} sur 8
              </span>
              <span className="text-xs sm:text-sm font-semibold">{Math.round(progress)}% complété</span>
            </div>
            <Progress value={progress} className="h-2 sm:h-3 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Indicateurs d'étapes horizontaux - Responsive */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
            {STEPS.slice(1, 9).map((step) => {
              const index = step.id
              const isCompleted = completedSteps.includes(index)
              const isCurrent = index === currentStep
              const isAccessible = isCompleted || isCurrent || index < currentStep
              
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isAccessible) {
                      handleStepChange(index)
                    }
                  }}
                  className={`flex flex-col items-center flex-shrink-0 min-w-[60px] sm:min-w-[80px] transition-all duration-200 ${
                    isAccessible ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'
                  }`}
                >
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
                      React.createElement(step.icon, { className: 'w-5 h-5 sm:w-6 sm:h-6' })
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs text-center font-medium transition-colors leading-tight ${
                    isCurrent ? 'text-[#226D68]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {step.title.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contenu de l'étape - Responsive */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-4xl">
        <Card className="rounded-[16px] shadow-lg border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#226D68]/5 to-blue-deep/5 p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#226D68] to-blue-deep flex items-center justify-center text-white shadow-md flex-shrink-0">
                {React.createElement(currentStepConfig.icon, { className: 'w-6 h-6 sm:w-8 sm:h-8' })}
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-anthracite font-heading">{currentStepConfig.title}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Étape {currentStep} sur 8
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 md:p-8">
            <StepComponent
              form={form}
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              onEditStep={handleStepChange}
              isLastStep={currentStep === STEPS.length - 1}
              isFirstStep={currentStep === 1}
              profileId={profileId}
            />
          </div>
          
          {/* Navigation en bas - Responsive */}
          <div className="bg-gray-50 px-4 sm:px-6 md:px-8 py-3 sm:py-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isSaving}
              className="border-blue-deep text-blue-deep hover:bg-blue-deep/10 w-full sm:w-auto order-2 sm:order-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
            
            {isSaving && (
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground order-1 sm:order-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Sauvegarde en cours...</span>
                <span className="sm:hidden">Sauvegarde...</span>
              </div>
            )}
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="bg-[#226D68] hover:bg-[#1a5a55] text-white w-full sm:w-auto order-3"
              >
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSaving}
                className="bg-[#226D68] hover:bg-[#1a5a55] text-white w-full sm:w-auto order-3"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Soumission...</span>
                    <span className="sm:hidden">Soumission...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Soumettre mon profil
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
