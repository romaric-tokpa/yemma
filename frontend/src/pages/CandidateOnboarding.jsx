import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  FileText, Upload, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, Plus, Trash2, Briefcase, GraduationCap,
  Wrench, User, ArrowLeft, Save, Award, Settings, MapPin,
  Check, Cloud
} from 'lucide-react'
import { candidateApi, documentApi, parsingApi } from '@/services/api'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { SECTORS_FR } from '@/data/sectors'
import {
  parsedToOnboardingState,
  experienceToApiPayload,
  educationToApiPayload,
  skillToApiPayload,
  certificationToApiPayload,
  jobPreferencesToApiPayload,
} from '@/utils/profilePayloads'

const ACCEPT = '.pdf,.docx'
const MAX_SIZE_MB = 10

// Stepper compact et professionnel - Charte Yemma
function OnboardingStepper({ currentStep }) {
  const steps = [
    { key: 'upload', label: 'CV', number: 1 },
    { key: 'review', label: 'Vérifier', number: 2 },
    { key: 'success', label: 'Terminé', number: 3 },
  ]
  const currentIndex = steps.findIndex(s => s.key === currentStep)
  return (
    <nav aria-label="Progression" className="w-full max-w-md mx-auto">
      <ol className="flex items-center justify-between gap-0.5">
        {steps.map((s, i) => {
          const isDone = currentIndex > i
          const isActive = currentIndex === i
          return (
            <li key={s.key} className="flex items-center gap-1 flex-1 min-w-0">
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone 
                    ? 'bg-[#226D68] text-white shadow-sm' 
                    : isActive 
                    ? 'bg-[#226D68] text-white ring-2 ring-[#226D68]/30 shadow-sm' 
                    : 'bg-[#E8F4F3] text-gray-400'
                }`}
              >
                {isDone ? <Check className="w-2.5 h-2.5" /> : s.number}
              </span>
              <span className={`text-[10px] truncate ${isActive ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{s.label}</span>
              {i < steps.length - 1 && (
                <span 
                  className={`flex-shrink-0 flex-1 h-px mx-1 hidden sm:block transition-colors ${
                    isDone ? 'bg-[#226D68]' : 'bg-[#E8F4F3]'
                  }`} 
                  aria-hidden 
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default function CandidateOnboarding() {
  const navigate = useNavigate()

  // États généraux
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState('upload') // 'upload' | 'review' | 'success'
  const preferencesSectionRef = useRef(null)

  // États pour les données parsées/éditées
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    profile_title: '',
    professional_summary: '',
    sector: '',
    main_job: '',
    total_experience: null,
    nationality: '',
  })
  const [experiences, setExperiences] = useState([])
  const [educations, setEducations] = useState([])
  const [skills, setSkills] = useState([])
  const [certifications, setCertifications] = useState([])

  // Préférences d'emploi (obligatoire)
  const [preferences, setPreferences] = useState({
    desired_positions: [], // Tableau de postes recherchés
    contract_types: [],
    availability: '',
    salary_expectation_min: '',
    salary_expectation_max: '',
    remote_preference: 'hybrid',
    willing_to_relocate: false,
    preferred_locations: '',
  })
  const [newPositionInput, setNewPositionInput] = useState('') // Input pour ajouter un nouveau poste

  // États pour les sections ouvertes/fermées (toutes ouvertes pour faciliter le remplissage)
  const [openSections, setOpenSections] = useState({
    profile: true,
    experiences: true,
    educations: true,
    skills: true,
    certifications: true,
    preferences: true,
  })

  const handleFile = useCallback((f) => {
    if (!f) return
    setError(null)
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Format non supporté. Utilisez un fichier PDF ou DOCX.')
      return
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`)
      return
    }
    setFile(f)
  }, [])

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        await candidateApi.getMyProfile()
        if (!cancelled) navigate('/candidate/dashboard', { replace: true })
      } catch (err) {
        if (!cancelled && err.response?.status !== 404) {
          if (err.response?.status === 401) {
            navigate('/login', { replace: true })
            return
          }
          setError('Impossible de charger votre profil. Rechargez la page.')
        }
      } finally {
        if (!cancelled) setCheckingProfile(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [navigate])

  // Parser le CV et passer à l'étape de révision
  const onParseCv = async () => {
    if (!file) {
      setError('Veuillez sélectionner votre CV.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const userEmail = user?.email

      console.log('[CandidateOnboarding] Parsing CV via HRFlow...')
      const parsedData = await parsingApi.parseCv(file, userEmail)
      const state = parsedToOnboardingState(parsedData, userEmail)
      setProfile(state.profile)
      setExperiences(state.experiences)
      setEducations(state.educations)
      setSkills(state.skills)
      setCertifications(state.certifications)
      if (parsedData?.profile?.profile_title) {
        setPreferences(prev => ({
          ...prev,
          desired_positions: [parsedData.profile.profile_title],
        }))
      }

      // Passer à l'étape de révision
      setStep('review')
    } catch (err) {
      console.error('[CandidateOnboarding] Parsing error:', err)
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : err.message || 'Erreur lors du parsing du CV.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Créer le profil final avec les données éditées
  const onSubmitProfile = async () => {
    // Validation des préférences obligatoires
    if (!isPreferencesValid()) {
      setError('Remplissez : poste souhaité, type de contrat, disponibilité.')
      setOpenSections(prev => ({ ...prev, preferences: true }))
      setTimeout(() => preferencesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      return
    }

    setLoading(true)
    setError(null)
    try {
      console.log('[CandidateOnboarding] Creating profile...')
      // Créer le profil (sans les préférences, elles sont sauvegardées séparément)
      const createdProfile = await candidateApi.createProfile(profile)
      console.log('[CandidateOnboarding] Profile created:', createdProfile?.id)

      if (createdProfile?.id) {
        // Ajouter les expériences (payload normalisé)
        for (const exp of experiences) {
          if (exp.company_name || exp.position) {
            try {
              await candidateApi.createExperience(createdProfile.id, experienceToApiPayload(exp))
            } catch (e) {
              console.warn('Failed to add experience:', e)
            }
          }
        }

        // Ajouter les formations (payload normalisé)
        for (const edu of educations) {
          if (edu.diploma || edu.institution) {
            try {
              await candidateApi.createEducation(createdProfile.id, educationToApiPayload(edu))
            } catch (e) {
              console.warn('Failed to add education:', e)
            }
          }
        }

        // Ajouter les compétences (payload normalisé)
        for (const skill of skills) {
          if (skill.name) {
            try {
              await candidateApi.createSkill(createdProfile.id, skillToApiPayload(skill))
            } catch (e) {
              console.warn('Failed to add skill:', e)
            }
          }
        }

        // Ajouter les certifications (payload normalisé)
        for (const cert of certifications) {
          if (cert.title) {
            try {
              await candidateApi.createCertification(createdProfile.id, certificationToApiPayload(cert))
            } catch (e) {
              console.warn('Failed to add certification:', e)
            }
          }
        }

        // Sauvegarder les préférences (desired_location renseigné depuis preferred_locations si besoin)
        try {
          const prefsPayload = jobPreferencesToApiPayload({
            desired_positions: preferences.desired_positions || [],
            contract_types: preferences.contract_types || [],
            availability: preferences.availability || null,
            salary_min: preferences.salary_expectation_min != null ? preferences.salary_expectation_min : preferences.salary_min,
            salary_max: preferences.salary_expectation_max != null ? preferences.salary_expectation_max : preferences.salary_max,
            remote_preference: preferences.remote_preference || null,
            willing_to_relocate: preferences.willing_to_relocate || false,
            preferred_locations: preferences.preferred_locations || null,
            desired_location: preferences.preferred_locations || null,
          })
          await candidateApi.updateJobPreferences(createdProfile.id, prefsPayload)
        } catch (e) {
          console.warn('Failed to save job preferences:', e)
        }

        // Uploader le CV comme document (visible dans l'onglet Documents du dashboard)
        try {
          await documentApi.uploadDocument(file, createdProfile.id, 'CV')
        } catch (e) {
          console.warn('Failed to upload CV to documents:', e)
          // L'upload échoue silencieusement pour ne pas bloquer la création du profil
          // (ex: formats DOCX exigent que le service document accepte docx)
        }

        // Envoyer l'email de confirmation de création de profil (profil créé)
        try {
          await candidateApi.notifyProfileCreated()
        } catch (e) {
          console.warn('Failed to send profile created notification:', e)
        }
      }

      setStep('success')
    } catch (err) {
      console.error('[CandidateOnboarding] Error:', err)
      const detail = err.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : err.message || 'Erreur lors de la création du profil.'
      if (err.response?.status === 409) {
        navigate('/candidate/dashboard#profile', { replace: true })
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Helpers pour modifier les listes
  const updateExperience = (idx, field, value) => {
    setExperiences(prev => prev.map((exp, i) => i === idx ? { ...exp, [field]: value } : exp))
  }
  const removeExperience = (idx) => {
    setExperiences(prev => prev.filter((_, i) => i !== idx))
  }
  const addExperience = () => {
    setExperiences(prev => [...prev, {
      id: `temp-${Date.now()}`,
      company_name: '',
      position: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      achievements: '',
      company_sector: '',
    }])
  }

  const updateEducation = (idx, field, value) => {
    setEducations(prev => prev.map((edu, i) => i === idx ? { ...edu, [field]: value } : edu))
  }
  const removeEducation = (idx) => {
    setEducations(prev => prev.filter((_, i) => i !== idx))
  }
  const addEducation = () => {
    setEducations(prev => [...prev, {
      id: `temp-${Date.now()}`,
      diploma: '',
      institution: '',
      country: '',
      start_year: '',
      graduation_year: new Date().getFullYear(),
      level: 'Non spécifié',
    }])
  }

  const updateSkill = (idx, field, value) => {
    setSkills(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }
  const removeSkill = (idx) => {
    setSkills(prev => prev.filter((_, i) => i !== idx))
  }
  const addSkill = () => {
    setSkills(prev => [...prev, {
      id: `temp-${Date.now()}`,
      name: '',
      skill_type: 'TECHNICAL',
      level: null,
    }])
  }

  const updateCertification = (idx, field, value) => {
    setCertifications(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }
  const removeCertification = (idx) => {
    setCertifications(prev => prev.filter((_, i) => i !== idx))
  }
  const addCertification = () => {
    setCertifications(prev => [...prev, {
      id: `temp-${Date.now()}`,
      title: '',
      issuer: '',
      year: new Date().getFullYear(),
      expiration_date: '',
      verification_url: '',
      certification_id: '',
    }])
  }

  // Validation des préférences (obligatoire)
  const isPreferencesValid = () => {
    return (
      preferences.desired_positions?.length > 0 &&
      preferences.contract_types?.length > 0 &&
      preferences.availability?.trim()
    )
  }

  // Ajouter un poste recherché
  const addDesiredPosition = () => {
    const trimmed = newPositionInput.trim()
    if (trimmed && !preferences.desired_positions?.includes(trimmed)) {
      setPreferences(prev => ({
        ...prev,
        desired_positions: [...(prev.desired_positions || []), trimmed]
      }))
      setNewPositionInput('')
    }
  }

  // Supprimer un poste recherché
  const removeDesiredPosition = (position) => {
    setPreferences(prev => ({
      ...prev,
      desired_positions: (prev.desired_positions || []).filter(p => p !== position)
    }))
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Étape 1 : Upload du CV — compact, charte (gray-light, primary, rounded-[12px])
  if (step === 'upload') {
    const hasFile = !!file
    const ext = file?.name?.split('.').pop()?.toLowerCase()
    const isPdf = ext === 'pdf'
    return (
      <div className="min-h-screen bg-gray-light flex flex-col items-center justify-center p-4 sm:p-5 safe-x safe-y">
        <div className="w-full max-w-[480px]">
          <div className="mb-4">
            <OnboardingStepper currentStep="upload" />
          </div>
          <Card className="border border-border shadow-sm rounded-lg overflow-hidden bg-card">
            <div className="bg-gradient-to-r from-[#226D68] to-[#1a5a55] text-white px-4 py-3">
              <h1 className="text-base font-bold">1. Déposez votre CV</h1>
              <p className="text-white/90 text-[10px] mt-0.5">On l’analyse pour remplir votre profil automatiquement.</p>
            </div>
            <CardContent className="p-3 space-y-3">
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('cv-upload')?.click() } }}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => !hasFile && document.getElementById('cv-upload')?.click()}
                className={`min-h-[140px] rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#226D68] focus-visible:ring-offset-2 ${
                  hasFile ? 'border-[#226D68] bg-[#E8F4F3]/30' : dragOver ? 'border-[#226D68] bg-[#E8F4F3]/50 scale-[1.01]' : 'border-dashed border-[#E8F4F3] bg-[#E8F4F3]/20 hover:border-[#226D68]/50'
                }`}
              >
                <input type="file" id="cv-upload" accept={ACCEPT} onChange={(e) => handleFile(e.target.files?.[0])} className="hidden" />
                {hasFile ? (
                  <>
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-card border border-border">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-medium text-sm text-gray-anthracite truncate max-w-[180px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} Ko · {isPdf ? 'PDF' : 'DOCX'}</p>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-3 h-8 text-xs" onClick={(e) => { e.stopPropagation(); document.getElementById('cv-upload')?.click() }}>
                      Changer de fichier
                    </Button>
                  </>
                ) : (
                  <>
                    {dragOver ? <Cloud className="w-10 h-10 text-primary mb-2" /> : <Upload className="w-10 h-10 text-muted-foreground mb-2" />}
                    <p className="font-medium text-sm text-gray-anthracite">Glissez votre CV ici</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ou cliquez pour choisir · PDF ou DOCX</p>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">Max {MAX_SIZE_MB} Mo</p>
              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-xs">{error}</p>
                </div>
              )}
              <Button
                type="button"
                onClick={onParseCv}
                disabled={!file || loading}
                className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 rounded-lg"
                style={{ backgroundColor: '#226D68' }}
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />Analyse en cours…</> : <><CheckCircle2 className="w-4 h-4 mr-2" aria-hidden />Analyser mon CV</>}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground leading-tight">Données analysées de façon sécurisée. Modifiable à l’étape suivante. Propulsé par Hrflow.ai</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Étape 3 : Succès — Compact et professionnel
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-light flex flex-col items-center justify-center p-4 safe-x safe-y">
        <div className="w-full max-w-sm text-center">
          <OnboardingStepper currentStep="success" />
          <div className="mt-5 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-[#226D68] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Check className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Profil créé</h1>
            <p className="text-xs text-muted-foreground mt-1">Complétez les zones manquantes si besoin, puis soumettez depuis votre tableau de bord.</p>
            <Button
              onClick={() => navigate('/candidate/dashboard#profile', { replace: true })}
              className="mt-5 w-full h-9 text-xs bg-[#226D68] hover:bg-[#1a5a55] text-white rounded-lg focus-visible:ring-2 focus-visible:ring-[#226D68] focus-visible:ring-offset-2 shadow-sm"
            >
              Accéder à mon espace candidat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Étape 2 : Révision — Compact et professionnel
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-light py-3 sm:py-4 px-4 sm:px-5 safe-x safe-y safe-bottom overflow-x-hidden">
      <div className="max-w-3xl mx-auto space-y-2.5 min-w-0">
        <OnboardingStepper currentStep="review" />
          <div className="flex items-center justify-between gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => setStep('upload')} className="text-muted-foreground hover:text-gray-900 shrink-0 h-7 text-[10px] px-2 focus-visible:ring-2 focus-visible:ring-[#226D68]">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Retour
          </Button>
          <div className="text-center min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold text-gray-900">2. Vérifiez et complétez</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Données extraites de votre CV. Corrigez si besoin, puis validez.</p>
          </div>
          <div className="w-14 sm:w-16 shrink-0" />
        </div>
        <div className="mb-2.5 p-2.5 rounded-lg bg-[#E8F4F3]/50 border border-[#226D68]/20">
          <p className="text-[10px] text-gray-700">
            <strong>Conseil :</strong> Déroulez chaque bloc, vérifiez les champs pré-remplis (* obligatoires) et ajoutez ce qui manque. Vous pourrez modifier plus tard depuis votre tableau de bord.
          </p>
        </div>
        {error && (
          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <p className="text-[10px]">{error}</p>
          </div>
        )}

        {/* Section Profil */}
        <Card className="border border-border shadow-sm rounded-lg bg-card">
          <div className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#E8F4F3]/30 rounded-t-lg transition-colors" onClick={() => toggleSection('profile')}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#226D68]/10 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-[#226D68]" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-900">Identité</h3>
                <p className="text-[10px] text-muted-foreground">{profile.first_name || profile.last_name ? `${profile.first_name} ${profile.last_name}`.trim() : 'Nom, email, téléphone…'}</p>
              </div>
            </div>
            {openSections.profile ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
          </div>
            {openSections.profile && (
            <CardContent className="pt-0 pb-3 px-2.5 space-y-2.5">
              <p className="text-[9px] text-muted-foreground mb-0.5">* champs obligatoires</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="first_name" className="text-[10px]">Prénom <span className="text-red-500">*</span></Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="Votre prénom"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-[10px]">Nom <span className="text-red-500">*</span></Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="Votre nom"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-[10px]">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    placeholder="votre@email.com"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-[10px]">Téléphone <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+225 07 00 00 00 00"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-[10px]">Ville <span className="text-red-500">*</span></Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
                    placeholder="Abidjan"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="text-[10px]">Pays <span className="text-red-500">*</span></Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => setProfile(p => ({ ...p, country: e.target.value }))}
                    placeholder="Côte d'Ivoire"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="profile_title" className="text-[10px]">Titre du profil <span className="text-red-500">*</span></Label>
                  <Input
                    id="profile_title"
                    value={profile.profile_title}
                    onChange={(e) => setProfile(p => ({ ...p, profile_title: e.target.value }))}
                    placeholder="Ex: Développeur Full Stack Senior"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="professional_summary" className="text-[10px]">Résumé professionnel <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="professional_summary"
                    value={profile.professional_summary}
                    onChange={(e) => setProfile(p => ({ ...p, professional_summary: e.target.value }))}
                    placeholder="Décrivez votre parcours et vos compétences clés..."
                    rows={3}
                    className="text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="sector" className="text-[10px]">Secteur d'activité <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    id="sector"
                    options={SECTORS_FR}
                    value={profile.sector || ''}
                    onChange={(value) => setProfile(p => ({ ...p, sector: value }))}
                    placeholder="Choisir un secteur"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="total_experience" className="text-[10px]">Années d'expérience <span className="text-red-500">*</span></Label>
                  <Input
                    id="total_experience"
                    type="number"
                    min="0"
                    value={profile.total_experience || ''}
                    onChange={(e) => setProfile(p => ({ ...p, total_experience: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="5"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section Expériences */}
        <Card className="border border-border shadow-sm rounded-lg bg-card">
          <div className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#E8F4F3]/30 rounded-t-lg transition-colors" onClick={() => toggleSection('experiences')}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#226D68]/10 flex items-center justify-center shrink-0">
                <Briefcase className="w-3.5 h-3.5 text-[#226D68]" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-900">Expériences</h3>
                <p className="text-[10px] text-muted-foreground">{experiences.length ? `${experiences.length} ajoutée(s)` : 'Au moins une requise'}</p>
              </div>
              {!openSections.experiences && experiences.length > 0 && <Badge variant="secondary" className="shrink-0 text-[9px] h-4 bg-[#E8F4F3] text-[#226D68]">{experiences.length}</Badge>}
            </div>
            {openSections.experiences ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
          </div>
          {openSections.experiences && (
            <CardContent className="pt-0 pb-3 px-2.5 space-y-2">
              {experiences.map((exp, idx) => (
                <div key={exp.id} className="p-2.5 border border-[#E8F4F3] rounded-lg space-y-2 relative bg-[#E8F4F3]/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1.5 right-1.5 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeExperience(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-8">
                    <div>
                      <Label className="text-[10px]">Entreprise <span className="text-red-500">*</span></Label>
                      <Input
                        value={exp.company_name}
                        onChange={(e) => updateExperience(idx, 'company_name', e.target.value)}
                        placeholder="Nom de l'entreprise"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Poste <span className="text-red-500">*</span></Label>
                      <Input
                        value={exp.position}
                        onChange={(e) => updateExperience(idx, 'position', e.target.value)}
                        placeholder="Intitulé du poste"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[10px]">Secteur de l'entreprise</Label>
                      <SearchableSelect
                        options={SECTORS_FR}
                        value={exp.company_sector || ''}
                        onChange={(value) => updateExperience(idx, 'company_sector', value)}
                        placeholder="Choisir un secteur"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Date de début <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={exp.start_date}
                        onChange={(e) => updateExperience(idx, 'start_date', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Date de fin</Label>
                      <Input
                        type="date"
                        value={exp.end_date}
                        onChange={(e) => updateExperience(idx, 'end_date', e.target.value)}
                        disabled={exp.is_current}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`current-${idx}`}
                        checked={exp.is_current}
                        onChange={(e) => updateExperience(idx, 'is_current', e.target.checked)}
                        className="rounded w-3.5 h-3.5"
                      />
                      <Label htmlFor={`current-${idx}`} className="cursor-pointer text-[10px]">Poste actuel</Label>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-[10px]">Description <span className="text-red-500">*</span></Label>
                      <Textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                        placeholder="Décrivez vos missions et responsabilités..."
                        rows={2}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addExperience} className="w-full h-8 text-xs border-[#226D68]/30 hover:bg-[#E8F4F3]">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Ajouter une expérience
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section Formations */}
        <Card className="border border-border shadow-sm rounded-lg bg-card">
          <div className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#E8F4F3]/30 rounded-t-lg transition-colors" onClick={() => toggleSection('educations')}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#226D68]/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-3.5 h-3.5 text-[#226D68]" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-900">Formations</h3>
                <p className="text-[10px] text-muted-foreground">{educations.length ? `${educations.length} ajoutée(s)` : 'Au moins une requise'}</p>
              </div>
              {!openSections.educations && educations.length > 0 && <Badge variant="secondary" className="shrink-0 text-[9px] h-4 bg-[#E8F4F3] text-[#226D68]">{educations.length}</Badge>}
            </div>
            {openSections.educations ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
          </div>
          {openSections.educations && (
            <CardContent className="pt-0 pb-3 px-2.5 space-y-2">
              {educations.map((edu, idx) => (
                <div key={edu.id} className="p-2.5 border border-[#E8F4F3] rounded-lg space-y-2 relative bg-[#E8F4F3]/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1.5 right-1.5 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeEducation(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-8">
                    <div>
                      <Label className="text-[10px]">Diplôme / Formation</Label>
                      <Input
                        value={edu.diploma}
                        onChange={(e) => updateEducation(idx, 'diploma', e.target.value)}
                        placeholder="Ex: Master en Informatique"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Établissement <span className="text-red-500">*</span></Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                        placeholder="Nom de l'établissement"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Année d'obtention <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        min="1950"
                        max="2100"
                        value={edu.graduation_year}
                        onChange={(e) => updateEducation(idx, 'graduation_year', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Niveau <span className="text-red-500">*</span></Label>
                      <select
                        value={edu.level}
                        onChange={(e) => updateEducation(idx, 'level', e.target.value)}
                        className="w-full h-8 px-2.5 border rounded-md bg-background text-xs"
                      >
                        <option value="Non spécifié">Non spécifié</option>
                        <option value="CAP/BEP">CAP/BEP</option>
                        <option value="Bac">Bac</option>
                        <option value="Bac+2">Bac+2</option>
                        <option value="Bac+3">Bac+3 (Licence)</option>
                        <option value="Bac+4">Bac+4</option>
                        <option value="Bac+5">Bac+5 (Master)</option>
                        <option value="Bac+8">Bac+8 (Doctorat)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addEducation} className="w-full h-8 text-xs border-[#226D68]/30 hover:bg-[#E8F4F3]">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Ajouter une formation
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section Compétences */}
        <Card className="border border-border shadow-sm rounded-lg bg-card">
          <div className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#E8F4F3]/30 rounded-t-lg transition-colors" onClick={() => toggleSection('skills')}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#226D68]/10 flex items-center justify-center shrink-0">
                <Wrench className="w-3.5 h-3.5 text-[#226D68]" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-900">Compétences</h3>
                <p className="text-[10px] text-muted-foreground">{skills.length ? `${skills.length} ajoutée(s)` : 'Au moins une technique requise'}</p>
              </div>
              {!openSections.skills && skills.length > 0 && <Badge variant="secondary" className="shrink-0 text-[9px] h-4 bg-[#E8F4F3] text-[#226D68]">{skills.length}</Badge>}
            </div>
            {openSections.skills ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
          </div>
          {openSections.skills && (
            <CardContent className="pt-0 pb-3 px-2.5 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-1.5 px-2 py-1 bg-[#E8F4F3] rounded-full group border border-[#226D68]/20"
                  >
                    <Input
                      value={skill.name}
                      onChange={(e) => updateSkill(idx, 'name', e.target.value)}
                      className="h-5 w-auto min-w-[80px] border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                      placeholder="Compétence"
                    />
                    <select
                      value={skill.skill_type}
                      onChange={(e) => updateSkill(idx, 'skill_type', e.target.value)}
                      className="h-5 text-[9px] border-0 bg-transparent cursor-pointer text-[#226D68] font-medium"
                    >
                      <option value="TECHNICAL">Technique</option>
                      <option value="SOFT">Soft Skill</option>
                      <option value="TOOL">Outil</option>
                    </select>
                    <button
                      onClick={() => removeSkill(idx)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addSkill} size="sm" className="h-8 text-xs border-[#226D68]/30 hover:bg-[#E8F4F3]">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Ajouter une compétence
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section Certifications */}
        <Card className="border border-border shadow-sm rounded-lg bg-card">
          <div className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#E8F4F3]/30 rounded-t-lg transition-colors" onClick={() => toggleSection('certifications')}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#226D68]/10 flex items-center justify-center shrink-0">
                <Award className="w-3.5 h-3.5 text-[#226D68]" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-900">Certifications</h3>
                <p className="text-[10px] text-muted-foreground">{certifications.length ? `${certifications.length} ajoutée(s)` : 'Optionnel'}</p>
              </div>
              {!openSections.certifications && certifications.length > 0 && <Badge variant="secondary" className="shrink-0 text-[9px] h-4 bg-[#E8F4F3] text-[#226D68]">{certifications.length}</Badge>}
            </div>
            {openSections.certifications ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
          </div>
          {openSections.certifications && (
            <CardContent className="pt-0 pb-3 px-2.5 space-y-2">
              {certifications.map((cert, idx) => (
                <div key={cert.id} className="p-2.5 border border-[#E8F4F3] rounded-lg space-y-2 relative bg-[#E8F4F3]/10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1.5 right-1.5 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeCertification(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-8">
                    <div>
                      <Label className="text-[10px]">Titre de la certification</Label>
                      <Input
                        value={cert.title}
                        onChange={(e) => updateCertification(idx, 'title', e.target.value)}
                        placeholder="Ex: AWS Solutions Architect"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Organisme délivreur</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) => updateCertification(idx, 'issuer', e.target.value)}
                        placeholder="Ex: Amazon Web Services"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Année d'obtention <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        min="1950"
                        max="2100"
                        value={cert.year}
                        onChange={(e) => updateCertification(idx, 'year', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">URL de vérification (optionnel)</Label>
                      <Input
                        type="url"
                        value={cert.verification_url}
                        onChange={(e) => updateCertification(idx, 'verification_url', e.target.value)}
                        placeholder="https://..."
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addCertification} className="w-full h-8 text-xs border-[#226D68]/30 hover:bg-[#E8F4F3]">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Ajouter une certification
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Section Préférences d'emploi (OBLIGATOIRE) */}
        <Card
          ref={preferencesSectionRef}
          className={`border shadow-sm rounded-lg bg-card ${!isPreferencesValid() ? 'border-amber-400/70 bg-amber-50/20' : 'border-[#226D68]/30'}`}
        >
          <div className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-[#E8F4F3]/30 rounded-t-lg transition-colors" onClick={() => toggleSection('preferences')}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${!isPreferencesValid() ? 'bg-amber-100' : 'bg-[#226D68]/10'}`}>
                <Settings className={`w-3.5 h-3.5 ${!isPreferencesValid() ? 'text-amber-600' : 'text-[#226D68]'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-900">Recherche d'emploi</h3>
                <p className="text-[10px] text-muted-foreground">{isPreferencesValid() ? 'Poste, contrat, lieu…' : 'Poste souhaité, type de contrat, disponibilité'}</p>
              </div>
            </div>
            {openSections.preferences ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
          </div>
          {openSections.preferences && (
            <CardContent className="pt-0 pb-3 px-2.5 space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="md:col-span-2">
                  <Label className="text-[10px]">Poste(s) recherché(s) <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1.5">
                    {preferences.desired_positions?.map((position) => (
                      <span
                        key={position}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#226D68] text-white rounded-full text-[10px]"
                      >
                        {position}
                        <button
                          type="button"
                          onClick={() => removeDesiredPosition(position)}
                          className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          aria-label={`Supprimer ${position}`}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      id="desired_position_input"
                      value={newPositionInput}
                      onChange={(e) => setNewPositionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addDesiredPosition()
                        }
                      }}
                      placeholder="Ex: Développeur Full Stack..."
                      className={`h-8 text-xs ${preferences.desired_positions?.length === 0 ? 'border-orange-400' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDesiredPosition}
                      disabled={!newPositionInput.trim()}
                      className="shrink-0 h-8 w-8 p-0 border-[#226D68]/30 hover:bg-[#E8F4F3]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {preferences.desired_positions?.length === 0 && (
                    <p className="text-[10px] text-orange-600 mt-1">Ajoutez au moins un poste recherché</p>
                  )}
                  <p className="text-[9px] text-muted-foreground mt-1">Appuyez sur Entrée ou cliquez sur + pour ajouter</p>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-[10px]">Type(s) de contrat souhaité(s) <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['CDI', 'CDD', 'FREELANCE', 'STAGE', 'ALTERNANCE', 'INTERIM'].map(type => (
                      <label
                        key={type}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer transition-colors text-[10px] ${
                          preferences.contract_types?.includes(type)
                            ? 'bg-[#226D68] text-white border-[#226D68]'
                            : 'bg-[#E8F4F3]/50 border-[#E8F4F3] hover:border-[#226D68]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={preferences.contract_types?.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPreferences(p => ({ ...p, contract_types: [...(p.contract_types || []), type] }))
                            } else {
                              setPreferences(p => ({ ...p, contract_types: (p.contract_types || []).filter(t => t !== type) }))
                            }
                          }}
                          className="sr-only"
                        />
                        <span className="font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                  {preferences.contract_types?.length === 0 && (
                    <p className="text-[10px] text-orange-600 mt-1">Sélectionnez au moins un type de contrat</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="availability" className="text-[10px]">Disponibilité <span className="text-red-500">*</span></Label>
                  <select
                    id="availability"
                    value={preferences.availability}
                    onChange={(e) => setPreferences(p => ({ ...p, availability: e.target.value }))}
                    className={`w-full h-8 px-2.5 border rounded-md bg-background text-xs ${!preferences.availability ? 'border-orange-400' : ''}`}
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="immediate">Immédiate</option>
                    <option value="1_week">Sous 1 semaine</option>
                    <option value="2_weeks">Sous 2 semaines</option>
                    <option value="1_month">Sous 1 mois</option>
                    <option value="2_months">Sous 2 mois</option>
                    <option value="3_months">Sous 3 mois</option>
                    <option value="negotiable">À négocier</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="remote_preference" className="text-[10px]">Préférence télétravail</Label>
                  <select
                    id="remote_preference"
                    value={preferences.remote_preference}
                    onChange={(e) => setPreferences(p => ({ ...p, remote_preference: e.target.value }))}
                    className="w-full h-8 px-2.5 border rounded-md bg-background text-xs"
                  >
                    <option value="onsite">Sur site uniquement</option>
                    <option value="hybrid">Hybride (présentiel + télétravail)</option>
                    <option value="remote">Télétravail complet</option>
                    <option value="flexible">Flexible / Indifférent</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="salary_min" className="text-[10px]">Salaire minimum (FCFA/mois) <span className="text-red-500">*</span></Label>
                  <Input
                    id="salary_min"
                    type="number"
                    min="0"
                    value={preferences.salary_expectation_min}
                    onChange={(e) => setPreferences(p => ({ ...p, salary_expectation_min: e.target.value }))}
                    placeholder="Ex: 500000"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="salary_max" className="text-[10px]">Salaire maximum (FCFA/mois) <span className="text-red-500">*</span></Label>
                  <Input
                    id="salary_max"
                    type="number"
                    min="0"
                    value={preferences.salary_expectation_max}
                    onChange={(e) => setPreferences(p => ({ ...p, salary_expectation_max: e.target.value }))}
                    placeholder="Ex: 1000000"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="preferred_locations" className="text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#226D68]" />
                      Zones géographiques préférées <span className="text-red-500">*</span>
                    </div>
                  </Label>
                  <Input
                    id="preferred_locations"
                    value={preferences.preferred_locations}
                    onChange={(e) => setPreferences(p => ({ ...p, preferred_locations: e.target.value }))}
                    placeholder="Ex: Abidjan, Bouaké, Télétravail..."
                    className="h-8 text-xs"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="willing_to_relocate"
                    checked={preferences.willing_to_relocate}
                    onChange={(e) => setPreferences(p => ({ ...p, willing_to_relocate: e.target.checked }))}
                    className="rounded w-3.5 h-3.5"
                  />
                  <Label htmlFor="willing_to_relocate" className="cursor-pointer text-[10px]">
                    Prêt(e) à déménager pour une opportunité
                  </Label>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Bouton de validation */}
        <div className="flex flex-col items-center gap-1.5 pt-2">
          {!isPreferencesValid() && (
            <p className="text-[10px] text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Remplissez : poste souhaité, type de contrat, disponibilité
            </p>
          )}
          <Button
            onClick={onSubmitProfile}
            disabled={loading || !profile.email || !isPreferencesValid()}
            className="w-full sm:max-w-xs h-9 text-xs bg-[#226D68] hover:bg-[#1a5a55] text-white rounded-lg disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#226D68] focus-visible:ring-offset-2 shadow-sm"
          >
            {loading ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Création…</> : <><Save className="w-3.5 h-3.5 mr-1.5" />Créer mon profil</>}
          </Button>
        </div>
      </div>
    </div>
  )
}
