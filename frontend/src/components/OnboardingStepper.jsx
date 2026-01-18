import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  const location = useLocation()
  const [completedSteps, setCompletedSteps] = useState([]) // Utiliser un tableau au lieu d'un Set pour une meilleure réactivité React
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [formData, setFormData] = useState({})
  const [profileId, setProfileId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [initialStepLoaded, setInitialStepLoaded] = useState(false)
  const previousStepRef = useRef(null) // Pour suivre l'étape précédente et éviter les réinitialisations inutiles

  // Extraire le numéro d'étape depuis l'URL (ex: /onboarding/step1 -> 1)
  const getStepFromPath = () => {
    const match = location.pathname.match(/\/onboarding\/step(\d+)/)
    if (match) {
      const stepNum = parseInt(match[1], 10)
      if (stepNum >= 0 && stepNum < STEPS.length) {
        return stepNum
      }
    }
    return 0 // Par défaut, étape 0
  }

  const currentStep = getStepFromPath()
  const currentStepConfig = STEPS[currentStep]
  const StepComponent = currentStepConfig.component

  // Calcul du pourcentage de progression basé sur les étapes complétées
  // Utiliser le pourcentage du backend si disponible, sinon calculer à partir des étapes complétées
  const progress = useMemo(() => {
    // Priorité 1: Utiliser le pourcentage du backend s'il est disponible
    if (formData.completionPercentage !== undefined && formData.completionPercentage !== null) {
      return formData.completionPercentage
    }
    
    // Priorité 2: Calculer à partir de completedSteps (tableau)
    const completedCount = completedSteps.length
    const hasCurrentStepData = formData[`step${currentStep}`] && Object.keys(formData[`step${currentStep}`]).length > 0
    const isCurrentStepCompleted = completedSteps.includes(currentStep)
    
    // Si l'étape actuelle est complétée, elle est déjà comptée dans completedSteps
    // Sinon, si elle a des données, on peut la considérer comme partiellement complétée
    let progressValue = completedCount
    if (!isCurrentStepCompleted && hasCurrentStepData) {
      progressValue += 0.5 // Partiellement complétée
    }
    
    return Math.min(100, (progressValue / STEPS.length) * 100)
  }, [formData.completionPercentage, completedSteps, formData, currentStep])

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
          
          // Marquer les étapes complétées basé sur last_step_completed
          const completed = []
          const lastStep = transformedData.lastStep !== undefined && transformedData.lastStep !== null ? transformedData.lastStep : -1
          // Marquer toutes les étapes jusqu'à last_step_completed comme complétées
          for (let i = 0; i <= lastStep && i < STEPS.length; i++) {
            completed.push(i)
          }
          setCompletedSteps(completed)
          
          // Rediriger vers la bonne étape si nécessaire (une seule fois au chargement initial)
          if (!initialStepLoaded) {
            const stepFromPath = getStepFromPath()
            // Si on accède directement à /onboarding ou si l'étape dans l'URL est avant la dernière complétée
            if (location.pathname === '/onboarding' || stepFromPath < transformedData.lastStep) {
              // Aller à la dernière étape complétée + 1 (ou étape 0 si aucune n'est complétée)
              const targetStep = transformedData.lastStep !== undefined && transformedData.lastStep < STEPS.length - 1
                ? transformedData.lastStep + 1
                : 0
              navigate(`/onboarding/step${targetStep}`, { replace: true })
            } else if (stepFromPath !== getStepFromPath()) {
              // Si l'étape dans l'URL est différente de celle calculée, rediriger
              const targetStep = transformedData.lastStep !== undefined && transformedData.lastStep < STEPS.length - 1
                ? transformedData.lastStep + 1
                : 0
              navigate(`/onboarding/step${targetStep}`, { replace: true })
            }
            setInitialStepLoaded(true)
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
              // Rediriger vers step0 après création du profil
              if (!initialStepLoaded) {
                navigate('/onboarding/step0', { replace: true })
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
  }, [navigate, initialStepLoaded]) // Retirer location.pathname pour éviter les rechargements en boucle

  // Form pour l'étape actuelle
  const form = useForm({
    resolver: currentStepConfig.schema ? zodResolver(currentStepConfig.schema) : undefined,
    defaultValues: {},
    mode: 'onChange',
  })

  // Mémoriser les données de l'étape courante pour éviter les réinitialisations inutiles
  const currentStepData = useMemo(() => {
    const stepFromPath = getStepFromPath()
    return formData[`step${stepFromPath}`] || (stepFromPath === 0 ? {
      acceptCGU: false,
      acceptRGPD: false,
      acceptVerification: false,
    } : {})
  }, [location.pathname, formData])

  // Réinitialiser le formulaire uniquement quand on change vraiment d'étape (via l'URL)
  useEffect(() => {
    const stepFromPath = getStepFromPath()
    
    // Ne réinitialiser que si on change vraiment d'étape (pas si on est déjà sur cette étape)
    if (previousStepRef.current === stepFromPath) {
      return // Pas de changement d'étape, ne rien faire
    }
    
    previousStepRef.current = stepFromPath
    
    // Réinitialiser le formulaire avec les données de l'étape (mémorisées via useMemo)
    form.reset(currentStepData)
  }, [location.pathname, form, currentStepData]) // Utiliser currentStepData mémorisé au lieu de formData directement

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
        
        // Log pour l'étape 0 (consentements)
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
          // Log pour debug
          console.log('Création d\'expérience avec données:', JSON.stringify(exp, null, 2))
          // Vérifier que les champs obligatoires sont présents
          if (!exp.company_name || !exp.position || !exp.start_date) {
            console.error('Expérience invalide - champs manquants:', {
              company_name: exp.company_name,
              position: exp.position,
              start_date: exp.start_date
            })
            throw new Error(`Expérience invalide: champs obligatoires manquants (company_name, position, start_date)`)
          }
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
        // Gérer les documents (upload vers Document Service)
        const { documentApi } = await import('@/services/api')
        const filesToUpload = []
        
        // Upload du CV (obligatoire)
        // data.cv est maintenant directement un File (pas un FileList)
        if (data.cv && data.cv instanceof File) {
          try {
            const uploadedDoc = await documentApi.uploadDocument(data.cv, profileId, 'CV')
            filesToUpload.push({ type: 'CV', id: uploadedDoc.id })
          } catch (error) {
            console.error('Erreur lors de l\'upload du CV:', error)
            throw new Error('Erreur lors de l\'upload du CV: ' + (error.response?.data?.detail || error.message))
          }
        }
        
        // Upload des documents complémentaires (optionnels)
        // data.additionalDocuments est maintenant un tableau de Files
        if (data.additionalDocuments && Array.isArray(data.additionalDocuments) && data.additionalDocuments.length > 0) {
          for (const file of data.additionalDocuments) {
            try {
              // Déterminer le type de document selon le nom du fichier
              const fileType = file.name.toLowerCase().includes('attestation') ? 'ATTESTATION' :
                              file.name.toLowerCase().includes('certificat') ? 'CERTIFICATE' :
                              file.name.toLowerCase().includes('recommandation') ? 'RECOMMENDATION_LETTER' : 'OTHER'
              
              const uploadedDoc = await documentApi.uploadDocument(file, profileId, fileType)
              filesToUpload.push({ type: fileType, id: uploadedDoc.id })
            } catch (error) {
              console.error('Erreur lors de l\'upload du document:', error)
              // Ne pas bloquer pour les documents optionnels
            }
          }
        }
        
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      } else if (stepNumber === 7) {
        // Gérer les préférences
        const preferences = mapStep7ToBackend(data)
        await candidateApi.updateJobPreferences(profileId, preferences)
        await candidateApi.updateProfile(profileId, { last_step_completed: stepNumber })
      }
      
      // Recharger le profil depuis le backend pour avoir les données à jour
      try {
        const updatedProfile = await candidateApi.getMyProfile()
        const transformedData = transformBackendToFrontend(updatedProfile)
        setFormData(transformedData)
        
        // Mettre à jour les étapes complétées après la sauvegarde
        const completed = []
        const lastStep = transformedData.lastStep !== undefined && transformedData.lastStep !== null ? transformedData.lastStep : -1
        for (let i = 0; i <= lastStep && i < STEPS.length; i++) {
          completed.push(i)
        }
        setCompletedSteps(completed)
      } catch (error) {
        console.error('Erreur lors du rechargement du profil:', error)
        // En cas d'erreur, mettre à jour quand même les données locales
        setFormData(prev => ({
          ...prev,
          [`step${stepNumber}`]: data,
          lastStep: stepNumber,
        }))
        // Mettre à jour les étapes complétées même en cas d'erreur
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
      // Afficher les détails de validation si disponibles
      const errorDetails = error.response?.data
      let errorMessage = error.message
      if (errorDetails) {
        if (errorDetails.detail) {
          // Si c'est une liste d'erreurs de validation Pydantic
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
    
    // Valider avant de changer d'étape (sauf pour l'étape 8 et si on revient en arrière)
    if (currentStepConfig.schema && newStep > currentStep) {
      const isValid = await form.trigger()
      if (!isValid) {
        console.log('Validation échouée, ne pas changer d\'étape')
        return false
      }
    }

    // Sauvegarder avant de changer (même si on revient en arrière, pour garder les modifications)
    const shouldMarkCompleted = newStep > currentStep // Seulement si on avance
    if (Object.keys(currentData).length > 0 && profileId) {
      try {
        await saveToAPI(currentData, currentStep)
        // Attendre un peu pour que formData soit mis à jour par saveToAPI
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error)
        // Ne pas bloquer le changement d'étape en cas d'erreur de sauvegarde
      }
    }

    // Marquer l'étape actuelle comme complétée immédiatement si on avance (pour un feedback visuel immédiat)
    // Si la sauvegarde a réussi, saveToAPI aura déjà mis à jour completedSteps via le rechargement du profil
    // Mais on le fait quand même pour avoir un feedback immédiat
    if (shouldMarkCompleted) {
      setCompletedSteps(prev => {
        if (!prev.includes(currentStep)) {
          return [...prev, currentStep].sort((a, b) => a - b)
        }
        return prev
      })
    }

    // Naviguer vers la nouvelle étape via React Router
    navigate(`/onboarding/step${newStep}`)
    return true
  }, [currentStep, form, formData, currentStepConfig, saveToAPI, profileId, navigate])

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      await handleStepChange(currentStep + 1)
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
      
      // TOUJOURS recharger le profil depuis le backend avant la soumission
      // pour s'assurer d'avoir les dernières données, notamment les consentements (step0)
      let profile
      let transformedData
      try {
        profile = await candidateApi.getMyProfile()
        transformedData = transformBackendToFrontend(profile)
      } catch (error) {
        console.error('Erreur lors du rechargement du profil avant soumission:', error)
        throw new Error('Impossible de charger le profil depuis le serveur')
      }
      
      // Construire finalData en combinant les données du backend avec les données actuelles
      const finalData = {
        ...transformedData,
        ...formData,
        [`step${currentStep}`]: data,
        // S'assurer que step0 vient toujours du backend (source de vérité)
        step0: transformedData.step0 || {
          acceptCGU: false,
          acceptRGPD: false,
          acceptVerification: false,
        },
      }
      
      // Vérifier les consentements depuis le backend (source de vérité)
      const backendConsents = {
        acceptCGU: profile.accept_cgu === true,
        acceptRGPD: profile.accept_rgpd === true,
        acceptVerification: profile.accept_verification === true,
      }
      
      // Logs pour débogage
      console.log('Vérification des consentements avant soumission:', {
        backend: {
          accept_cgu: profile.accept_cgu,
          accept_rgpd: profile.accept_rgpd,
          accept_verification: profile.accept_verification,
        },
        computed: backendConsents,
        step0_from_transform: transformedData.step0,
      })
      
      // Si les consentements ne sont pas acceptés dans le backend, rediriger vers step0
      if (!backendConsents.acceptCGU || !backendConsents.acceptRGPD || !backendConsents.acceptVerification) {
        console.warn('Consentements non acceptés dans le backend:', {
          accept_cgu: profile.accept_cgu,
          accept_rgpd: profile.accept_rgpd,
          accept_verification: profile.accept_verification,
          types: {
            accept_cgu_type: typeof profile.accept_cgu,
            accept_rgpd_type: typeof profile.accept_rgpd,
            accept_verification_type: typeof profile.accept_verification,
          },
        })
        alert('Vous devez accepter les conditions d\'utilisation (CGU, RGPD et vérification) avant de soumettre votre profil. Redirection vers l\'étape des consentements...')
        navigate('/onboarding/step0')
        setIsSaving(false)
        return
      }
      
      // Sauvegarder toutes les données d'onboarding (incluant les consentements step0)
      await saveOnboardingProfile(profileId, finalData, candidateApi)
      
      // Attendre un peu pour que le backend mette à jour le completion_percentage
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recharger le profil depuis le backend pour avoir le completion_percentage à jour
      let updatedProfile
      try {
        updatedProfile = await candidateApi.getMyProfile()
        const transformedData = transformBackendToFrontend(updatedProfile)
        setFormData(transformedData)
        
        // Afficher le pourcentage de complétion et les détails pour debug
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
        // Continuer quand même la soumission en utilisant le profil déjà chargé
        updatedProfile = profile
      }
      
      // Soumettre le profil pour validation
      await candidateApi.submitProfile(profileId)
      
      // Rediriger vers le dashboard candidat en attente de validation
      navigate('/candidate/dashboard')
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
                onClick={() => {
                  // Permettre de cliquer sur les étapes complétées ou l'étape actuelle
                  if (completedSteps.includes(index) || index === currentStep || index < currentStep) {
                    handleStepChange(index)
                  }
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  completedSteps.includes(index)
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStep
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted text-muted-foreground'
                }`}>
                  {completedSteps.includes(index) ? (
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
            onEditStep={handleStepChange}
            isLastStep={currentStep === STEPS.length - 1}
            isFirstStep={currentStep === 0}
            profileId={profileId}
          />
        </div>
      </div>
    </div>
  )
}

