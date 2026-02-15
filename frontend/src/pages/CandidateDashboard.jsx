import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link, useParams, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  User, Edit, FileText, CheckCircle2, Clock, XCircle, 
  Briefcase, GraduationCap, Award, Code, MapPin, Star,
  Plus, Trash2, Eye, EyeOff, Mail, Phone, Calendar, LogOut,
  Home, Settings, Menu, X, TrendingUp, FileCheck,
  Flag, Download, Image as ImageIcon, Loader2, Upload,
  Wrench, Sparkles, BarChart3, HelpCircle, Target, Search,
  Save
} from 'lucide-react'
import { candidateApi, authApiService, documentApi } from '../services/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Separator } from '../components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Checkbox } from '../components/ui/checkbox'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { RichTextEditor } from '../components/ui/rich-text-editor'
import { SearchableSelect } from '../components/ui/searchable-select'
import { SECTORS_FR } from '../data/sectors'
import { COUNTRIES_FR } from '../data/countries'
import { getApiErrorDetail } from '../utils/apiError'
import {
  experienceToApiPayload,
  educationToApiPayload,
  skillToApiPayload,
  certificationToApiPayload,
  jobPreferencesToApiPayload,
} from '../utils/profilePayloads'
import { formatDateTime } from '../utils/dateUtils'
import SupportWidget from '../components/candidate/SupportWidget'

// Charte graphique Yemma (landing)
const CHARTE = {
  vert: '#226D68',
  vertClair: '#E8F4F3',
  coral: '#e76f51',
  texte: '#2C2C2C',
  fond: '#F4F6F8',
}

const profileEditSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  profileTitle: z.string().optional(),
  professionalSummary: z.string().optional(),
  sector: z.string().optional(),
  mainJob: z.string().optional(),
  totalExperience: z.number().min(0).optional(),
})

/** En-tête de section redesigné (charte landing) */
const SectionHeader = ({ title, subtitle, icon: Icon, action }) => (
  <div className="mb-6 sm:mb-8">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[#E8F4F3] shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#226D68]" />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] font-heading tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm sm:text-base text-[#6b7280] leading-relaxed max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:mt-0">{action}</div>}
    </div>
  </div>
)

const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
}

const generateCompanyLogoUrl = (companyName) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&size=100&background=e8f4f3&color=226D68&bold=true`
}

// Composant page Paramètres (mot de passe + suppression compte)
function SettingsPageContent({ onSuccess, onError }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      onError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      onError('Les mots de passe ne correspondent pas.')
      return
    }
    try {
      setChangingPassword(true)
      await authApiService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onSuccess('Mot de passe modifié avec succès.')
    } catch (err) {
      const detail = err.response?.data?.detail || err.message
      onError(typeof detail === 'string' ? detail : 'Erreur lors du changement de mot de passe.')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      onError('Tapez SUPPRIMER pour confirmer la suppression.')
      return
    }
    try {
      setDeletingAccount(true)
      await authApiService.anonymizeAccount()
      authApiService.logout()
      if (typeof window !== 'undefined') window.location.href = '/login'
    } catch (err) {
      const detail = err.response?.data?.detail || err.message
      onError(typeof detail === 'string' ? detail : 'Erreur lors de la suppression du compte.')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Changement de mot de passe */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-[#2C2C2C] mb-3">Changer le mot de passe</h3>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#226D68]">
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                placeholder="••••••••"
                minLength={8}
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#226D68]">
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Minimum 8 caractères</p>
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" disabled={changingPassword} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {changingPassword ? 'Modification...' : 'Modifier le mot de passe'}
          </Button>
        </form>
      </section>

      {/* Suppression du compte */}
      <section className="rounded-xl border border-red-200 bg-red-50/30 p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Zone de danger</h3>
        <p className="text-sm text-[#6b7280] mb-3">
          La suppression de votre compte est irréversible. Toutes vos données personnelles seront anonymisées conformément au RGPD.
        </p>
        <div className="space-y-2 max-w-md">
          <Label htmlFor="delete-confirm">Pour confirmer, tapez <strong>SUPPRIMER</strong></Label>
          <Input
            id="delete-confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="SUPPRIMER"
            className="border-red-200 focus-visible:ring-red-500"
          />
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deletingAccount || deleteConfirmText !== 'SUPPRIMER'}
          >
            {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
            {deletingAccount ? 'Suppression...' : 'Supprimer mon compte'}
          </Button>
        </div>
      </section>
    </div>
  )
}

const VALID_TABS = ['dashboard', 'profile', 'situation', 'preferences', 'documents', 'experiences', 'educations', 'skills', 'certifications', 'settings']

export default function CandidateDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tab } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [experiences, setExperiences] = useState([])
  const [educations, setEducations] = useState([])
  const [certifications, setCertifications] = useState([])
  const [skills, setSkills] = useState([])
  const [jobPreferences, setJobPreferences] = useState(null)
  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  // États pour les modales
  const [showExperienceDialog, setShowExperienceDialog] = useState(false)
  const [showEducationDialog, setShowEducationDialog] = useState(false)
  const [showCertificationDialog, setShowCertificationDialog] = useState(false)
  const [showSkillDialog, setShowSkillDialog] = useState(false)
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false)
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)
  
  // États pour les éléments en cours d'édition
  const [editingExperience, setEditingExperience] = useState(null)
  const [editingEducation, setEditingEducation] = useState(null)
  const [editingCertification, setEditingCertification] = useState(null)
  const [editingSkill, setEditingSkill] = useState(null)
  
  // États pour les formulaires
  const [saving, setSaving] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null)
  const [selectedDocumentType, setSelectedDocumentType] = useState('CV')

  // États pour la prévisualisation de document
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)

  // Toast (remplace alert) : { message, type: 'success'|'error' }
  const [toast, setToast] = useState(null)
  // Modale de confirmation (remplace confirm) : { title, message, onConfirm, variant?: 'danger' }
  const [confirmDialog, setConfirmDialog] = useState(null)
  // Modale consentements avant soumission du profil (un seul consentement combiné)
  const [showSubmitConsentModal, setShowSubmitConsentModal] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [submittingProfile, setSubmittingProfile] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  
  // États pour les filtres et recherche des compétences
  const [skillSearchQuery, setSkillSearchQuery] = useState('')
  const [skillFilterType, setSkillFilterType] = useState('ALL')
  const [skillFilterLevel, setSkillFilterLevel] = useState('ALL')
  // Guide de complétion du profil (visible quand < 100%)
  const [showCompletionGuide, setShowCompletionGuide] = useState(false)
  const completionGuideRef = useRef(null)
  // Mode édition du profil (intégré dans l'onglet Profil)
  const [profileEditMode, setProfileEditMode] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      nationality: '',
      address: '',
      city: '',
      country: '',
      profileTitle: '',
      professionalSummary: '',
      sector: '',
      mainJob: '',
      totalExperience: 0,
    },
  })
  const { register: regProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, setValue: setProfileValue, control: profileControl } = profileForm

  useEffect(() => {
    if (showCompletionGuide && completionGuideRef.current) {
      completionGuideRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [showCompletionGuide])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    loadProfile()
  }, [])

  // Synchroniser activeTab avec l'URL (route /candidate/dashboard/:tab)
  useEffect(() => {
    const urlTab = tab || 'dashboard'
    // "situation" affiche le contenu "preferences"
    const resolvedTab = urlTab === 'situation' ? 'preferences' : urlTab
    if (VALID_TABS.includes(urlTab) || urlTab === 'situation') {
      setActiveTab(resolvedTab)
    } else {
      setActiveTab('dashboard')
      if (tab) navigate('/candidate/dashboard', { replace: true })
    }
  }, [tab, navigate])

  // Mode édition profil : synchronisé avec ?edit=1 sur l'onglet profile
  useEffect(() => {
    if (tab === 'profile') {
      setProfileEditMode(searchParams.get('edit') === '1')
    }
  }, [tab, searchParams])

  // Remplir le formulaire profil quand le profil est chargé et qu'on est en mode édition
  useEffect(() => {
    if (!profile || !profileEditMode) return
    setProfileValue('firstName', profile.first_name || '')
    setProfileValue('lastName', profile.last_name || '')
    setProfileValue('phone', profile.phone || '')
    setProfileValue('dateOfBirth', profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '')
    setProfileValue('nationality', profile.nationality || '')
    setProfileValue('address', profile.address || '')
    setProfileValue('city', profile.city || '')
    setProfileValue('country', profile.country || '')
    setProfileValue('profileTitle', profile.profile_title || '')
    setProfileValue('professionalSummary', profile.professional_summary || '')
    setProfileValue('sector', profile.sector || '')
    setProfileValue('mainJob', profile.main_job || '')
    setProfileValue('totalExperience', profile.total_experience ?? 0)
  }, [profile, profileEditMode, setProfileValue])

  const [photoError, setPhotoError] = useState(false)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null)

  useEffect(() => {
    const loadPhotoUrl = async () => {
      if (!profile?.id) {
        setCurrentPhotoUrl(null)
        return
      }
      if (profile.photo_url) {
        let photoUrl = profile.photo_url
        if (photoUrl && photoUrl.startsWith('/')) {
          const match = photoUrl.match(/\/api\/v1\/documents\/serve\/(\d+)/)
          if (match?.[1]) {
            photoUrl = documentApi.getDocumentServeUrl(parseInt(match[1]))
          }
        }
        if (photoUrl && !photoUrl.includes('ui-avatars.com') && photoUrl.trim() !== '') {
          setCurrentPhotoUrl(photoUrl)
          setPhotoError(false)
          return
        }
      }
      try {
        const docs = await documentApi.getCandidateDocuments(profile.id)
        const photoDoc = docs
          ?.filter(doc =>
            (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER') && !doc.deleted_at
          )
          ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        if (photoDoc) {
          const serveUrl = documentApi.getDocumentServeUrl(photoDoc.id)
          setCurrentPhotoUrl(serveUrl)
          setPhotoError(false)
          if (!profile.photo_url || profile.photo_url !== serveUrl) {
            await candidateApi.updateProfile(profile.id, { photo_url: serveUrl })
          }
        } else {
          setCurrentPhotoUrl(null)
        }
      } catch (err) {
        setCurrentPhotoUrl(null)
        if (err.response?.status !== 500) console.warn('Documents non chargés pour la photo:', err.message)
      }
    }
    loadPhotoUrl()
  }, [profile?.id, profile?.photo_url])

  const loadProfile = async () => {
    try {
      setLoading(true)
      // Un seul appel backend : /profiles/me renvoie déjà profil + experiences, educations, certifications, skills, job_preferences
      const profileData = await candidateApi.getMyProfile()
      setProfile(profileData)

      if (profileData.id) {
        setExperiences(Array.isArray(profileData.experiences) ? profileData.experiences : [])
        setEducations(Array.isArray(profileData.educations) ? profileData.educations : [])
        setCertifications(Array.isArray(profileData.certifications) ? profileData.certifications : [])
        setSkills(Array.isArray(profileData.skills) ? profileData.skills : [])
        setJobPreferences(profileData.job_preferences ?? null)
        // Documents : service séparé, chargement en parallèle après réception du profil
        try {
          const docs = await documentApi.getCandidateDocuments(profileData.id)
          setDocuments(docs || [])
        } catch (docErr) {
          if (docErr.response?.status === 500) {
            const detail = docErr.response?.data?.detail
            const msg = typeof detail === 'string' ? detail : 'Service documents temporairement indisponible.'
            setToast({ message: msg, type: 'error' })
          } else {
            console.error('Error loading documents:', docErr)
          }
          setDocuments([])
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      if (error.response?.status === 404) {
        navigate('/onboarding')
        return
      }
      if (error.response?.status === 401) {
        navigate('/login')
        return
      }
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setToast({ message: 'Le serveur met trop de temps à répondre. Réessayez.', type: 'error' })
        return
      }
      if (error.code === 'ERR_NETWORK' || !error.response) {
        setToast({ message: 'Impossible de joindre le serveur. Vérifiez votre connexion.', type: 'error' })
        return
      }
      const detail = error.response?.data?.detail
      const msg = typeof detail === 'string' ? detail : 'Erreur lors du chargement du profil.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const onProfileFormSubmit = async (data) => {
    if (!profile?.id) return
    try {
      setSavingProfile(true)
      await candidateApi.updateProfile(profile.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        date_of_birth: data.dateOfBirth ? `${data.dateOfBirth}T00:00:00` : null,
        nationality: data.nationality || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        profile_title: data.profileTitle || null,
        professional_summary: data.professionalSummary || null,
        sector: data.sector || null,
        main_job: data.mainJob || null,
        total_experience: data.totalExperience ?? null,
      })
      setToast({ message: 'Profil enregistré.', type: 'success' })
      setProfileEditMode(false)
      navigate('/candidate/dashboard/profile', { replace: true })
      await loadProfile()
    } catch (err) {
      setToast({ message: getApiErrorDetail(err, "Erreur lors de l'enregistrement."), type: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  const loadDocuments = async () => {
    if (!profile?.id) return
    try {
      const docs = await documentApi.getCandidateDocuments(profile.id)
      setDocuments(docs || [])
    } catch (error) {
      if (error.response?.status === 500) {
        setToast({ message: 'Service documents temporairement indisponible.', type: 'error' })
      }
      setDocuments([])
    }
  }

  const handleDocumentUpload = async () => {
    if (!selectedDocumentFile || !profile?.id) {
      setToast({ message: 'Veuillez sélectionner un fichier.', type: 'error' })
      return
    }
    if (selectedDocumentFile.size > 10 * 1024 * 1024) {
      setToast({ message: 'Le fichier ne doit pas dépasser 10 Mo.', type: 'error' })
      return
    }
    try {
      setUploadingDocument(true)
      await documentApi.uploadDocument(selectedDocumentFile, profile.id, selectedDocumentType)
      setToast({ message: 'Document ajouté avec succès.', type: 'success' })
      setShowDocumentDialog(false)
      setSelectedDocumentFile(null)
      setSelectedDocumentType('CV')
      await loadDocuments()
    } catch (error) {
      console.error('Error uploading document:', error)
      setToast({ message: 'Erreur : ' + (error.response?.data?.detail || error.message), type: 'error' })
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleLogout = () => {
    setConfirmDialog({
      title: 'Déconnexion',
      message: 'Vous allez être déconnecté. Continuer ?',
      variant: 'danger',
      onConfirm: () => {
        setConfirmDialog(null)
        authApiService.logout()
        navigate('/login')
      },
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText },
      SUBMITTED: { label: 'Soumis', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      IN_REVIEW: { label: 'En cours de validation', className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      VALIDATED: { label: 'Validé', className: 'text-white', bgColor: '#226D68', borderColor: '#226D68', icon: CheckCircle2 },
      REJECTED: { label: 'Refusé', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      ARCHIVED: { label: 'Archivé', className: 'bg-gray-100 text-gray-800 border-gray-200', icon: FileText },
    }
    
    const config = statusConfig[status] || statusConfig.DRAFT
    const Icon = config.icon
    
    return (
      <Badge className={`${config.className} border flex items-center gap-1.5`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleDeleteExperience = (experienceId) => {
    const exp = experiences.find(e => e.id === experienceId)
    setConfirmDialog({
      title: 'Supprimer cette expérience ?',
      message: exp?.company_name ? `« ${exp.company_name} » sera supprimée.` : 'Cette expérience sera supprimée.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await candidateApi.deleteExperience(profile.id, experienceId)
          setExperiences(experiences.filter(exp => exp.id !== experienceId))
          setToast({ message: 'Expérience supprimée.', type: 'success' })
        } catch (error) {
          console.error('Error deleting experience:', error)
          setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        }
      },
    })
  }

  const handleDeleteEducation = (educationId) => {
    const edu = educations.find(e => e.id === educationId)
    setConfirmDialog({
      title: 'Supprimer cette formation ?',
      message: edu?.institution ? `« ${edu.institution} » sera supprimée.` : 'Cette formation sera supprimée.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await candidateApi.deleteEducation(profile.id, educationId)
          setEducations(educations.filter(e => e.id !== educationId))
          setToast({ message: 'Formation supprimée.', type: 'success' })
        } catch (error) {
          console.error('Error deleting education:', error)
          setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        }
      },
    })
  }

  const handleDeleteCertification = (certificationId) => {
    setConfirmDialog({
      title: 'Supprimer cette certification ?',
      message: 'Cette certification sera supprimée définitivement.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await candidateApi.deleteCertification(profile.id, certificationId)
          setCertifications(certifications.filter(c => c.id !== certificationId))
          setToast({ message: 'Certification supprimée.', type: 'success' })
        } catch (error) {
          console.error('Error deleting certification:', error)
          setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        }
      },
    })
  }

  const handleDeleteSkill = (skillId) => {
    setConfirmDialog({
      title: 'Supprimer cette compétence ?',
      message: 'Cette compétence sera retirée de votre profil.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await candidateApi.deleteSkill(profile.id, skillId)
          setSkills(skills.filter(s => s.id !== skillId))
          setToast({ message: 'Compétence supprimée.', type: 'success' })
        } catch (error) {
          console.error('Error deleting skill:', error)
          setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
        }
      },
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex flex-col">
        <div className="flex-1 container mx-auto p-4 md:p-6 max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 bg-muted rounded-full" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
            <div className="rounded-[12px] border border-border bg-card overflow-hidden">
              <div className="h-12 bg-muted/50 border-b border-border" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-4/5 bg-muted rounded" />
                <div className="h-4 w-3/5 bg-muted rounded" />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <Card className="w-full max-w-md rounded-[12px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Profil non trouvé</CardTitle>
            <CardDescription className="text-center">
              Vous devez créer votre profil pour accéder au dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full text-white"
              style={{ backgroundColor: '#226D68' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#226D68' }}
              onClick={() => navigate('/onboarding')}
            >
              Créer mon profil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Candidat'
  const completionPercentage = Number(profile.completion_percentage) || 0
  const canSubmit = Math.round(completionPercentage) >= 80
  const defaultAvatar = generateAvatarUrl(profile.first_name, profile.last_name)
  
  // Déterminer quelle photo afficher - utiliser currentPhotoUrl seulement si elle existe et n'est pas l'avatar
  const displayPhoto = (currentPhotoUrl && !photoError && !currentPhotoUrl.includes('ui-avatars.com')) 
    ? currentPhotoUrl 
    : defaultAvatar

  // Navigation principale (style Freelance Republik)
  const navItems = [
    { id: 'dashboard', label: 'Mon dashboard', icon: Home },
    { id: 'profile', label: 'Mon profil', icon: User },
    { id: 'situation', label: 'Ma situation', icon: Search },
    { id: 'preferences', label: 'Préférences emploi', icon: Target },
    { id: 'documents', label: 'Mon CV', icon: FileText },
    { id: 'experiences', label: 'Expériences', icon: Briefcase, count: experiences.length },
    { id: 'educations', label: 'Formations', icon: GraduationCap, count: educations.length },
    { id: 'skills', label: 'Compétences', icon: Code, count: skills.length },
    { id: 'certifications', label: 'Certifications', icon: Award, count: certifications.length },
  ]

  // Checklist complétion (alignée BRIEF)
  const completionChecklist = [
    { key: 'preferences', label: 'Préférences emploi', done: !!(jobPreferences?.desired_positions?.length && jobPreferences?.contract_types?.length && jobPreferences?.availability) },
    { key: 'photo', label: 'Photo de profil', done: !!(currentPhotoUrl && !currentPhotoUrl.includes('ui-avatars.com')) },
    { key: 'summary', label: 'Description', done: !!(profile?.professional_summary && profile.professional_summary.length >= 300) },
    { key: 'skills', label: 'Compétences clés', done: skills.filter(s => s.skill_type === 'TECHNICAL').length > 0 },
    { key: 'skills_any', label: 'Compétences', done: skills.length > 0 },
    { key: 'experiences', label: 'Expériences', done: experiences.length > 0 },
    { key: 'educations', label: 'Formations', done: educations.length > 0 },
  ]

  const cvDoc = documents?.find(d => d.document_type === 'CV')
  const minCompletionForSubmit = 80

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F8]">
      <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:px-3 focus:py-2 focus:bg-[#226D68] focus:text-white focus:rounded-md">
        Aller au contenu principal
      </a>

      {/* Top bar - Logo, progression, user */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 safe-top">
        <div className="flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/favicon.ico" alt="Yemma Solutions" className="h-8 w-8 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/logo-icon.svg' }} />
          </Link>

          {/* Barre de progression - compacte et élégante */}
          <div className="flex-1 min-w-0 max-w-xs sm:max-w-sm mx-2 sm:mx-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Progress value={completionPercentage} className="h-2 rounded-full bg-gray-100 [&>div]:bg-[#226D68]" />
              </div>
              <span className="text-sm font-semibold text-[#2C2C2C] shrink-0 tabular-nums">{Math.round(completionPercentage)}%</span>
            </div>
            <p className="text-[10px] text-[#6b7280] mt-0.5 truncate">Profil complété</p>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-1 shrink-0">
            <Link to="/candidate/dashboard/settings" className="p-2 rounded-xl hover:bg-[#E8F4F3] text-[#6b7280] hover:text-[#226D68] transition-colors" title="Paramètres">
              <Settings className="h-5 w-5" />
            </Link>
            <Link to="/contact" className="p-2 rounded-xl hover:bg-[#E8F4F3] text-[#6b7280] hover:text-[#226D68] transition-colors" title="Aide">
              <HelpCircle className="h-5 w-5" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#E8F4F3] transition-colors"
                aria-expanded={userMenuOpen}
              >
                <img src={displayPhoto} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-[#E8F4F3]" onError={(e) => { e.target.src = defaultAvatar }} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden />
                  <div className="absolute right-0 top-full mt-2 py-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-[#F4F6F8]/50 border-b border-gray-100">
                      <p className="font-semibold text-sm text-[#2C2C2C] truncate">{fullName}</p>
                      <p className="text-xs text-[#6b7280] truncate mt-0.5">{profile?.email}</p>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 rounded-none h-10 px-4" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar gauche - fond blanc (style capture) */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col
          bg-white border-r border-gray-100 shadow-sm
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-4 border-b border-gray-100">
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 text-[#2C2C2C]">
              <X className="h-5 w-5" />
            </button>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6b7280] mt-4 mb-3">Navigation</p>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const path = item.id === 'dashboard' ? '/candidate/dashboard' : `/candidate/dashboard/${item.id}`
                const isActive = activeTab === item.id || (item.id === 'situation' && activeTab === 'preferences')
                return (
                  <Link
                    key={item.id}
                    to={path}
                    onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                      isActive ? 'bg-[#E8F4F3] text-[#226D68]' : 'text-[#2C2C2C] hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.count != null && item.count > 0 && (
                      <span className="ml-auto text-xs text-[#6b7280]">{item.count}</span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-1" />
          <div className="p-4 border-t border-gray-100 space-y-1">
            <Link
              to="/candidate/dashboard/settings"
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#E8F4F3] text-sm text-[#6b7280] hover:text-[#226D68] transition-colors"
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </Link>
            <Link to="/contact" className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-[#E8F4F3] text-sm text-[#6b7280] hover:text-[#226D68] transition-colors">
              <HelpCircle className="h-4 w-4" />
              Besoin d&apos;aide ?
            </Link>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        {!sidebarOpen && (
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)} className="fixed bottom-4 left-4 z-50 lg:hidden h-12 w-12 rounded-full shadow-lg bg-white border-[#226D68]">
            <Menu className="h-5 w-5 text-[#226D68]" />
          </Button>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0">
          <main id="dashboard-main" className="flex-1 overflow-y-auto min-w-0 bg-[#F4F6F8]" aria-label="Contenu du profil">
            <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 safe-x">
          {/* Vue Dashboard (style capture) */}
          {activeTab === 'dashboard' && (
            <>
              {/* Hero accueil */}
              <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] font-heading tracking-tight">
                  Bonjour, {profile?.first_name || 'Candidat'}
                </h1>
                <p className="text-[#6b7280] mt-2 max-w-2xl">
                  Complétez votre profil pour accéder à la validation. Une fois validé, vous entrez dans la CVthèque et devenez visible auprès des recruteurs.
                </p>
              </div>

              {profile?.status === 'IN_REVIEW' && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3" role="status">
                  <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">Profil en cours de validation</p>
                    <p className="text-sm text-amber-800 mt-0.5">Notre équipe examine votre dossier. Vous serez contacté prochainement.</p>
                  </div>
                </div>
              )}

              {/* Carte complétion - design épuré */}
              <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E8F4F3" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#226D68" strokeWidth="3" strokeDasharray={`${completionPercentage}, 100`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#226D68] font-heading">{Math.round(completionPercentage)}%</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C2C2C]">Complétion du profil</p>
                      <p className="text-sm text-[#6b7280] mt-0.5">{minCompletionForSubmit}% minimum pour soumettre</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {completionChecklist.map((item) => (
                        <span key={item.key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${item.done ? 'bg-[#E8F4F3] text-[#226D68]' : 'bg-gray-100 text-[#6b7280]'}`}>
                          {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {item.label}
                        </span>
                      ))}
                    </div>
                    {profile?.status === 'DRAFT' && (
                      <Button
                        onClick={() => setShowSubmitConsentModal(true)}
                        disabled={!canSubmit}
                        className="bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold"
                      >
                        <FileCheck className="mr-2 h-4 w-4" />
                        Soumettre mon profil
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grille de sections - cartes redesignées */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {[
                  { id: 'situation', icon: Search, label: 'Ma situation', value: jobPreferences?.availability || 'À compléter', desc: 'Disponibilité et préférences', action: () => setShowPreferencesDialog(true), done: !!jobPreferences?.availability },
                  { id: 'cv', icon: FileText, label: 'Mon CV', value: cvDoc ? `Importé le ${new Date(cvDoc.created_at).toLocaleDateString('fr-FR')}` : 'À uploader', desc: 'CV à jour pour la validation', action: () => setShowDocumentDialog(true), done: !!cvDoc },
                  { id: 'experiences', icon: Briefcase, label: 'Expériences', value: experiences.length, desc: 'Parcours professionnel', action: () => navigate('/candidate/dashboard/experiences'), done: experiences.length > 0 },
                  { id: 'educations', icon: GraduationCap, label: 'Formations', value: educations.length, desc: 'Diplômes et parcours', action: () => navigate('/candidate/dashboard/educations'), done: educations.length > 0 },
                  { id: 'skills', icon: Code, label: 'Compétences', value: skills.length, desc: 'Techniques et transversales', action: () => navigate('/candidate/dashboard/skills'), done: skills.length > 0 },
                  { id: 'certifications', icon: Award, label: 'Certifications', value: certifications.length, desc: 'Certifications et attestations', action: () => navigate('/candidate/dashboard/certifications'), done: certifications.length > 0 },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      className="group text-left rounded-xl border border-gray-200 bg-white p-5 hover:border-[#226D68]/40 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-[#E8F4F3]' : 'bg-gray-100 group-hover:bg-[#E8F4F3]'}`}>
                          <Icon className={`h-6 w-6 ${item.done ? 'text-[#226D68]' : 'text-[#6b7280] group-hover:text-[#226D68]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#2C2C2C] text-sm mb-1">{item.label}</p>
                          <p className={`text-xs font-medium mb-1 ${item.done ? 'text-[#226D68]' : 'text-amber-600'}`}>
                            {typeof item.value === 'number' ? item.value : item.value}
                          </p>
                          <p className="text-xs text-[#6b7280]">{item.desc}</p>
                          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-[#226D68] opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.done ? 'Modifier' : 'Compléter'} →
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Contenu des onglets (profile, experiences, etc.) - masqué en vue dashboard */}
          {activeTab !== 'dashboard' && (
          <>
          {/* Bandeau profil (visible hors dashboard) */}
          <div className="mb-6">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div 
                className="h-1"
                style={{
                  backgroundColor: profile?.status === 'VALIDATED' ? '#22c55e' : 
                                  profile?.status === 'REJECTED' ? '#ef4444' : 
                                  profile?.status === 'IN_REVIEW' ? '#f59e0b' : '#94a3b8'
                }}
              />
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={displayPhoto}
                        alt=""
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#E8F4F3]"
                        onError={(e) => { e.target.src = defaultAvatar }}
                      />
                      {profile?.status && (
                        <div 
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white"
                          style={{ backgroundColor: profile.status === 'VALIDATED' ? '#22c55e' : profile.status === 'REJECTED' ? '#ef4444' : profile.status === 'IN_REVIEW' ? '#f59e0b' : '#94a3b8' }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-semibold text-[#2C2C2C] truncate">{fullName}</h1>
                        {getStatusBadge(profile.status)}
                      </div>
                      {profile.profile_title && (
                        <p className="text-sm text-[#226D68] font-medium mt-0.5 truncate">{profile.profile_title}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-[#6b7280]">
                        {profile.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" />{profile.email}</span>}
                        {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{profile.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {profile.status === 'DRAFT' && (
                      <Button size="sm" className="bg-[#226D68] hover:bg-[#1a5a55] text-white" onClick={() => setShowSubmitConsentModal(true)} disabled={!canSubmit}>
                        <FileCheck className="w-4 h-4 mr-1.5" /> Soumettre
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => { completionPercentage < 100 && profile.status === 'DRAFT' ? setShowCompletionGuide(true) : navigate('/candidate/dashboard/profile?edit=1') }} className="border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]">
                      <Edit className="w-4 h-4 mr-1.5" /> Modifier
                    </Button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-[#6b7280]">Complétion</span>
                    <span className="text-sm font-bold text-[#226D68]">{Math.round(completionPercentage)}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2 rounded-full bg-gray-100 [&>div]:bg-[#226D68]" />
                  {completionPercentage < 100 && profile.status === 'DRAFT' && (
                    <Button variant="ghost" size="sm" className="w-full justify-between mt-2 text-xs text-[#6b7280] hover:text-[#226D68] hover:bg-[#E8F4F3]/50" onClick={() => setShowCompletionGuide(!showCompletionGuide)}>
                      <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" />Comment compléter à 100 % ?</span>
                      {showCompletionGuide ? '−' : '+'}
                    </Button>
                  )}
                  {showCompletionGuide && completionPercentage < 100 && profile.status === 'DRAFT' && (
                    <div ref={completionGuideRef} className="mt-3 p-4 rounded-xl bg-[#E8F4F3]/50 border border-[#226D68]/20 text-sm space-y-2">
                      <p className="font-semibold text-[#226D68]">Pour soumettre :</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[#6b7280]">
                        <li>Profil ≥ 80 %, CV uploadé, CGU/RGPD cochées</li>
                        <li>Au moins 1 expérience, 1 formation, 1 compétence technique</li>
                      </ul>
                      <Button size="sm" className="mt-2 bg-[#226D68] hover:bg-[#1a5a55] text-white" onClick={() => { setShowCompletionGuide(false); navigate('/candidate/dashboard/profile?edit=1') }}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Modifier mon profil
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Barre d'onglets - sections détaillées */}
          <Tabs value={activeTab} onValueChange={(v) => navigate(`/candidate/dashboard/${v}`)} className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-gray-100/80 border border-gray-200 rounded-xl overflow-x-auto flex-wrap gap-1">
              {[
                { id: 'profile', label: 'Profil', icon: User },
                { id: 'preferences', label: 'Préférences', icon: Target },
                { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
                { id: 'experiences', label: 'Expériences', icon: Briefcase, count: experiences.length },
                { id: 'educations', label: 'Formations', icon: GraduationCap, count: educations.length },
                { id: 'skills', label: 'Compétences', icon: Code, count: skills.length },
                { id: 'certifications', label: 'Certifications', icon: Award, count: certifications.length },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium data-[state=active]:bg-[#226D68] data-[state=active]:text-white rounded-lg transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                    {item.count != null && item.count > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{item.count}</Badge>}
                  </TabsTrigger>
                )
              })}
            </TabsList>

              {/* Contenu des onglets */}
              <TabsContent value="profile" className="mt-3">
                <SectionHeader
                  title="Mon profil"
                  subtitle="Identité, contact et parcours. Un profil complet facilite votre validation par nos experts RH avant d'entrer dans la CVthèque."
                  icon={User}
                  action={
                    profileEditMode ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setProfileEditMode(false); navigate('/candidate/dashboard/profile') }}
                        className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]"
                      >
                        Annuler
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (completionPercentage < 100 && profile.status === 'DRAFT') {
                            setShowCompletionGuide(true)
                          } else {
                            navigate('/candidate/dashboard/profile?edit=1')
                          }
                        }}
                        className="border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3] hover:text-[#1a5a55]"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    )
                  }
                />
                {profileEditMode ? (
                <form onSubmit={handleProfileSubmit(onProfileFormSubmit)} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6 space-y-5">
                    {/* Photo */}
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <img src={displayPhoto} alt="Photo de profil" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#226D68]/20" onError={(e) => { setPhotoError(true); e.target.src = defaultAvatar }} />
                        {uploadingPhoto && <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" aria-hidden /></span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="photo-edit-profile" className="text-xs font-medium text-[#6b7280] block mb-1">Photo de profil</Label>
                        <label htmlFor="photo-edit-profile">
                          <span className="inline-flex items-center justify-center rounded-md border border-neutral-200 h-9 px-3 text-xs font-medium cursor-pointer hover:bg-[#E8F4F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226D68]/30">
                            {uploadingPhoto ? 'Chargement...' : 'Changer la photo'}
                          </span>
                        </label>
                        <input id="photo-edit-profile" type="file" accept="image/*" className="sr-only" disabled={uploadingPhoto} onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file || !profile?.id) return
                          if (!file.type.startsWith('image/')) { setToast({ message: 'Sélectionnez une image (JPG, PNG).', type: 'error' }); return }
                          if (file.size > 5 * 1024 * 1024) { setToast({ message: 'La photo ne doit pas dépasser 5 Mo.', type: 'error' }); return }
                          try {
                            setUploadingPhoto(true)
                            const uploadResult = await documentApi.uploadProfilePhoto(file, profile.id)
                            let serveUrl = uploadResult.serve_url
                            if (serveUrl?.startsWith('/')) serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
                            else if (uploadResult.id) serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
                            await candidateApi.updateProfile(profile.id, { photo_url: serveUrl })
                            setCurrentPhotoUrl(serveUrl)
                            setPhotoError(false)
                            await loadProfile()
                            setToast({ message: 'Photo mise à jour.', type: 'success' })
                          } catch { setToast({ message: 'Erreur lors de l\'upload.', type: 'error' }) }
                          finally { setUploadingPhoto(false); e.target.value = '' }
                        }} />
                        <p className="text-xs text-[#6b7280] mt-1">JPG, PNG · max 5 Mo</p>
                      </div>
                    </div>
                    {/* Identité */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#226D68]" /> Identité</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="firstName" className="text-xs">Prénom <span className="text-red-500">*</span></Label>
                          <Input id="firstName" {...regProfile('firstName')} className="h-9 text-sm w-full min-w-0 rounded-xl border-neutral-200" placeholder="Prénom" />
                          {profileErrors.firstName && <p className="text-xs text-red-600">{profileErrors.firstName.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName" className="text-xs">Nom <span className="text-red-500">*</span></Label>
                          <Input id="lastName" {...regProfile('lastName')} className="h-9 text-sm w-full min-w-0 rounded-xl border-neutral-200" placeholder="Nom" />
                          {profileErrors.lastName && <p className="text-xs text-red-600">{profileErrors.lastName.message}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="dateOfBirth" className="text-xs">Date de naissance</Label>
                          <Input id="dateOfBirth" type="date" {...regProfile('dateOfBirth')} className="h-9 text-sm w-full min-w-0 rounded-xl border-neutral-200" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nationality" className="text-xs">Nationalité</Label>
                          <Controller name="nationality" control={profileControl} render={({ field }) => (
                            <SearchableSelect id="nationality" options={COUNTRIES_FR} value={field.value || ''} onChange={field.onChange} placeholder="Choisir une nationalité" className="h-9 text-sm" />
                          )} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs">Téléphone</Label>
                        <Input id="phone" {...regProfile('phone')} className="h-9 text-sm w-full min-w-0 rounded-xl border-neutral-200" placeholder="+33 6 00 00 00 00" />
                      </div>
                    </div>
                    {/* Adresse */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#226D68]" /> Adresse</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="city" className="text-xs">Ville</Label>
                          <Input id="city" {...regProfile('city')} className="h-9 text-sm w-full min-w-0 rounded-xl border-neutral-200" placeholder="Ville" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="country" className="text-xs">Pays</Label>
                          <Controller name="country" control={profileControl} render={({ field }) => (
                            <SearchableSelect id="country" options={COUNTRIES_FR} value={field.value || ''} onChange={field.onChange} placeholder="Choisir un pays" className="h-9 text-sm" />
                          )} />
                        </div>
                      </div>
                    </div>
                    {/* Profil professionnel */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-[#226D68]" /> Profil professionnel</p>
                      <div className="space-y-1.5">
                        <Label htmlFor="profileTitle" className="text-xs">Titre du profil</Label>
                        <Input id="profileTitle" {...regProfile('profileTitle')} className="h-9 text-sm w-full min-w-0 rounded-xl border-neutral-200" placeholder="Ex. Ingénieur Génie Civil" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="sector" className="text-xs">Secteur d&apos;activité</Label>
                          <Controller name="sector" control={profileControl} render={({ field }) => (
                            <SearchableSelect id="sector" options={SECTORS_FR} value={field.value || ''} onChange={field.onChange} placeholder="Choisir un secteur" className="h-9 text-sm" />
                          )} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="mainJob" className="text-xs">Poste principal</Label>
                          <Input id="mainJob" {...regProfile('mainJob')} className="h-9 text-sm w-full min-w-0 rounded-xl border-neutral-200" placeholder="Ex. Chef de chantier" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="totalExperience" className="text-xs">Années d&apos;expérience</Label>
                        <Input id="totalExperience" type="number" min={0} {...regProfile('totalExperience', { valueAsNumber: true })} className="h-9 text-sm w-24 rounded-xl border-neutral-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="professionalSummary" className="text-xs">Résumé professionnel</Label>
                        <Textarea id="professionalSummary" {...regProfile('professionalSummary')} rows={4} className="resize-none text-sm min-h-[80px] w-full min-w-0 rounded-xl border-neutral-200" placeholder="Décrivez votre parcours et vos compétences..." />
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100">
                      <Button type="button" variant="outline" size="sm" onClick={() => { setProfileEditMode(false); navigate('/candidate/dashboard/profile') }} className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]">Annuler</Button>
                      <Button type="submit" disabled={savingProfile} size="sm" className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
                        {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Enregistrement...</> : <><Save className="w-4 h-4 mr-2" aria-hidden /> Enregistrer</>}
                      </Button>
                    </div>
                  </div>
                </form>
                ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6">
                    <div className="space-y-6">
                      {/* Hero identité */}
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start pb-6 border-b border-gray-100">
                        <div className="relative group self-center sm:self-start">
                          <span className="sr-only">Photo de profil</span>
                          <img
                            src={displayPhoto}
                            alt={`Photo de profil de ${fullName}`}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 flex-shrink-0 shadow-md"
                            style={{ borderColor: 'rgba(34, 109, 104, 0.25)' }}
                            onError={(e) => {
                              if (!photoError && e.target.src !== defaultAvatar) {
                                setPhotoError(true)
                                e.target.src = defaultAvatar
                              } else if (e.target.src !== defaultAvatar) {
                                e.target.src = defaultAvatar
                              }
                            }}
                            onLoad={() => {
                              if (photoError && currentPhotoUrl) setPhotoError(false)
                            }}
                          />
                          <label
                            htmlFor="photo-upload"
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center sm:pointer-events-none"
                            aria-label="Changer la photo de profil"
                          >
                            {uploadingPhoto ? (
                              <Loader2 className="h-5 w-5 text-white animate-spin" aria-hidden />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-white" aria-hidden />
                            )}
                          </label>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingPhoto || !profile?.id}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file || !profile?.id) return

                              if (!file.type.startsWith('image/')) {
                                setToast({ message: 'Veuillez sélectionner une image pour la photo de profil (JPG, PNG).', type: 'error' })
                                return
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                setToast({ message: 'La photo de profil ne doit pas dépasser 5 Mo.', type: 'error' })
                                return
                              }

                              try {
                                setUploadingPhoto(true)
                                
                                // Utiliser l'endpoint dédié pour les photos de profil
                                const uploadResult = await documentApi.uploadProfilePhoto(file, profile.id)
                                let serveUrl = uploadResult.serve_url
                                if (serveUrl && serveUrl.startsWith('/')) {
                                  serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
                                } else if (uploadResult.id) {
                                  serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
                                }
                                await candidateApi.updateProfile(profile.id, { photo_url: serveUrl })
                                
                                // Mettre à jour l'état local immédiatement
                                setCurrentPhotoUrl(serveUrl)
                                setPhotoError(false)
                                
                                // Recharger le profil pour mettre à jour l'affichage
                                await loadProfile()
                                setToast({ message: 'Photo de profil mise à jour.', type: 'success' })
                              } catch (err) {
                                console.error('Error uploading photo:', err)
                                setToast({ message: 'Erreur : ' + (err.response?.data?.detail || err.message), type: 'error' })
                              } finally {
                                setUploadingPhoto(false)
                                // Réinitialiser l'input
                                e.target.value = ''
                              }
                            }}
                          />
                          <label htmlFor="photo-upload" className={`sm:hidden mt-1.5 block ${uploadingPhoto ? 'pointer-events-none opacity-70' : ''}`}>
                            <span className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2.5 py-1 text-[10px] font-medium h-7 cursor-pointer hover:bg-muted">
                              {uploadingPhoto ? 'Chargement...' : 'Modifier'}
                            </span>
                          </label>
                        </div>
                        <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
                          <h3 className="text-lg sm:text-xl font-bold text-[#2C2C2C] mb-1 truncate">{fullName}</h3>
                          {profile.profile_title && (
                            <p className="text-sm font-semibold text-[#226D68] mb-3 truncate">{profile.profile_title}</p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
                            {profile.email && (
                              <div className="flex items-center gap-2 text-sm text-[#6b7280] justify-center sm:justify-start">
                                <Mail className="h-4 w-4 text-[#226D68] flex-shrink-0" />
                                <span className="truncate">{profile.email}</span>
                              </div>
                            )}
                            {profile.phone && (
                              <div className="flex items-center gap-2 text-sm text-[#6b7280] justify-center sm:justify-start">
                                <Phone className="h-4 w-4 text-[#226D68] flex-shrink-0" />
                                <span className="truncate">{profile.phone}</span>
                              </div>
                            )}
                            {(profile.city || profile.country) && (
                              <div className="flex items-center gap-2 text-sm text-[#6b7280] justify-center sm:justify-start">
                                <MapPin className="h-4 w-4 text-[#226D68] flex-shrink-0" />
                                <span className="truncate">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Informations détaillées - Bento grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {profile.date_of_birth && (
                          <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#E8F4F3] rounded-lg">
                                <Calendar className="h-4 w-4 text-[#226D68]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#6b7280] font-medium">Date de naissance</p>
                                <p className="text-sm font-semibold text-[#2C2C2C] truncate">{new Date(profile.date_of_birth).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {profile.nationality && (
                          <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#E8F4F3] rounded-lg">
                                <Flag className="h-4 w-4 text-[#226D68]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#6b7280] font-medium">Nationalité</p>
                                <p className="text-sm font-semibold text-[#2C2C2C] truncate">{profile.nationality}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {profile.sector && (
                          <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#E8F4F3] rounded-lg">
                                <Briefcase className="h-4 w-4 text-[#226D68]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#6b7280] font-medium">Secteur d&apos;activité</p>
                                <p className="text-sm font-semibold text-[#2C2C2C] truncate">{profile.sector}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {profile.main_job && (
                          <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#E8F4F3] rounded-lg">
                                <Briefcase className="h-4 w-4 text-[#226D68]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#6b7280] font-medium">Métier principal</p>
                                <p className="text-sm font-semibold text-[#2C2C2C] truncate">{profile.main_job}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {profile.total_experience !== undefined && (
                          <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#E8F4F3] rounded-lg">
                                <TrendingUp className="h-4 w-4 text-[#226D68]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#6b7280] font-medium">Expérience</p>
                                <p className="text-sm font-semibold text-[#2C2C2C]">{profile.total_experience} an{profile.total_experience > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Résumé professionnel */}
                      {profile.professional_summary && (
                        <div className="pt-6 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-[#E8F4F3] rounded-lg">
                              <FileText className="h-4 w-4 text-[#226D68]" />
                            </div>
                            <h4 className="text-sm font-semibold text-[#2C2C2C]">
                              Résumé professionnel
                            </h4>
                          </div>
                          <div 
                            className="text-sm text-[#6b7280] leading-relaxed rich-text-content"
                            dangerouslySetInnerHTML={{ __html: profile.professional_summary }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </TabsContent>

              <TabsContent value="experiences" className="mt-3">
                <SectionHeader
                  title="Mes expériences"
                  subtitle="Parlez de vos expériences professionnelles. Elles renforcent votre crédibilité auprès des recruteurs une fois votre profil validé."
                  icon={Briefcase}
                  action={
                    <Button
                      size="sm"
                      onClick={() => { setEditingExperience(null); setShowExperienceDialog(true) }}
                      className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  }
                />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="p-4 sm:p-6 min-w-0">
                      {experiences.length > 0 ? (
                        <div className="space-y-4 min-w-0">
                          {[...experiences]
                            .sort((a, b) => {
                              const getSortDate = (exp) => {
                                if (exp.is_current) return new Date()
                                if (exp.end_date) return new Date(exp.end_date)
                                if (exp.start_date) return new Date(exp.start_date)
                                return new Date(0)
                              }
                              return getSortDate(b).getTime() - getSortDate(a).getTime()
                            })
                            .map((exp, index) => {
                            const defaultCompanyLogo = generateCompanyLogoUrl(exp.company_name)
                            const displayCompanyLogo = exp.company_logo_url || defaultCompanyLogo
                            
                            return (
                              <div key={exp.id} className="w-full min-w-0 rounded-xl border border-gray-100 bg-[#F4F6F8]/30 hover:border-[#E8F4F3] hover:shadow-md transition-all group p-4 sm:p-5">
                                  <div className="flex gap-4 items-start">
                                    <div className="relative shrink-0">
                                      <img
                                        src={displayCompanyLogo}
                                        alt={`Logo de ${exp.company_name}`}
                                        className="w-12 h-12 rounded-xl object-cover border-2 border-[#E8F4F3] shadow-sm"
                                        onError={(e) => {
                                          if (e.target.src !== defaultCompanyLogo) {
                                            e.target.src = defaultCompanyLogo
                                          }
                                        }}
                                      />
                                      {exp.is_current && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                      )}
                                    </div>
                                    
                                    {/* Contenu principal */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-sm sm:text-base text-[#2C2C2C] truncate mb-0.5 leading-tight">{exp.position}</h4>
                                          <p className="text-sm font-semibold text-[#226D68] truncate mb-2">{exp.company_name}</p>
                                          
                                          {/* Métadonnées compactes */}
                                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            {/* Date */}
                                            <div className="flex items-center gap-1 text-[10px] text-gray-600 bg-[#E8F4F3] px-1.5 py-0.5 rounded">
                                              <Calendar className="w-2.5 h-2.5 text-[#226D68]" />
                                              <span className="font-medium">
                                                {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                                {exp.end_date 
                                                  ? ` - ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`
                                                  : exp.is_current ? ' - Actuellement' : ''}
                                              </span>
                                            </div>
                                            
                                            {/* Type de contrat */}
                                            {exp.contract_type && (
                                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium">
                                                {exp.contract_type}
                                              </Badge>
                                            )}
                                            
                                            {/* Secteur */}
                                            {exp.company_sector && (
                                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[#226D68]/30 text-gray-700">
                                                {exp.company_sector}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Actions - toujours visible sur mobile, hover sur desktop */}
                                        <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setEditingExperience(exp)
                                              setShowExperienceDialog(true)
                                            }}
                                            className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-[#E8F4F3] active:bg-[#E8F4F3]"
                                            title="Modifier"
                                          >
                                            <Edit className="h-4 w-4 sm:h-3 sm:w-3 text-[#226D68]" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteExperience(exp.id)}
                                            className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-red-50 active:bg-red-50"
                                            title="Supprimer"
                                          >
                                            <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 text-red-500" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Description */}
                                      {exp.description && (
                                        <div className="mt-2 pt-2 border-t border-[#E8F4F3] min-w-0">
                                          <div className="flex items-center gap-1 mb-1">
                                            <div className="w-1 h-1 rounded-full bg-[#226D68]"></div>
                                            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Description</p>
                                          </div>
                                          <div 
                                            className="text-xs text-gray-700 rich-text-content leading-relaxed break-words"
                                            dangerouslySetInnerHTML={{ __html: exp.description }}
                                          />
                                        </div>
                                      )}

                                      {/* Réalisations */}
                                      {exp.achievements && (
                                        <div className="mt-2 pt-2 border-t border-[#E8F4F3] min-w-0">
                                          <div className="flex items-center gap-1 mb-1">
                                            <div className="w-1 h-1 rounded-full bg-[#226D68]"></div>
                                            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Réalisations</p>
                                          </div>
                                          <div 
                                            className="text-xs text-gray-700 rich-text-content leading-relaxed break-words"
                                            dangerouslySetInnerHTML={{ __html: exp.achievements }}
                                          />
                                        </div>
                                      )}

                                      {/* Document justificatif */}
                                      {exp.has_document && exp.document_id && (
                                        <div className="mt-2 pt-2 border-t border-[#E8F4F3]">
                                          <div className="flex items-center gap-1.5 text-[#226D68]">
                                            <FileText className="h-3 w-3" />
                                            <span className="text-[10px] font-medium">Pièce justificative disponible</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center rounded-xl border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/20">
                          <div className="p-4 bg-[#E8F4F3] rounded-2xl mb-4">
                            <Briefcase className="h-10 w-10 text-[#226D68]" />
                          </div>
                          <p className="text-base font-semibold text-[#2C2C2C] mb-2">Aucune expérience</p>
                          <p className="text-sm text-[#6b7280] mb-4 max-w-sm">Au moins une expérience requise pour soumettre votre profil à la validation.</p>
                          <Button 
                            size="sm"
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                            onClick={() => setShowExperienceDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une expérience
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="educations" className="mt-4">
                <SectionHeader
                  title="Mes formations"
                  subtitle="Diplômes et parcours académique. Au moins une formation est requise pour soumettre votre profil à la validation."
                  icon={GraduationCap}
                  action={
                    <Button size="sm" onClick={() => { setEditingEducation(null); setShowEducationDialog(true) }} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  }
                />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6">
                    {educations.length > 0 ? (
                      <div className="space-y-4">
                        {[...educations]
                          .sort((a, b) => {
                            const getYear = (edu) => Number(edu.graduation_year) || Number(edu.start_year) || 0
                            return getYear(b) - getYear(a)
                          })
                          .map((edu) => {
                            const duration = edu.start_year && edu.graduation_year 
                              ? edu.graduation_year - edu.start_year 
                              : null
                            
                            return (
                              <div
                                key={edu.id}
                                className="rounded-xl border border-gray-100 bg-[#F4F6F8] hover:border-[#E8F4F3] hover:shadow-md transition-all group p-4 sm:p-5"
                              >
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-[#E8F4F3] flex items-center justify-center shrink-0 shadow-sm">
                                        <GraduationCap className="h-5 w-5 text-[#226D68]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm sm:text-base text-[#2C2C2C] mb-0.5 group-hover:text-[#226D68] transition-colors truncate">
                                          {edu.diploma}
                                        </h4>
                                        <p className="text-sm font-medium text-[#6b7280] truncate mb-2">{edu.institution}</p>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          {edu.level && (
                                            <Badge variant="secondary" className="bg-[#E8F4F3] text-[#1a5a55] border-[#B8DDD9] text-[10px] font-medium px-1.5 py-0 h-4">
                                              {edu.level}
                                            </Badge>
                                          )}
                                          {edu.country && (
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                              <MapPin className="h-2.5 w-2.5 text-[#226D68]" />
                                              <span>{edu.country}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Calendar className="h-2.5 w-2.5 text-[#226D68]" />
                                            <span>
                                              {edu.start_year ? `${edu.start_year} - ${edu.graduation_year}` : edu.graduation_year}
                                            </span>
                                            {duration && duration > 0 && (
                                              <span className="text-muted-foreground"> • {duration} an{duration > 1 ? 's' : ''}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingEducation(edu); setShowEducationDialog(true) }} className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-[#E8F4F3] active:bg-[#E8F4F3]">
                                      <Edit className="h-4 w-4 sm:h-3 sm:w-3 text-[#226D68]" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEducation(edu.id)} className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-red-50 active:bg-red-50">
                                      <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center rounded-xl border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/20">
                        <div className="p-4 bg-[#E8F4F3] rounded-2xl mb-4">
                          <GraduationCap className="h-10 w-10 text-[#226D68]" />
                        </div>
                        <h3 className="text-base font-semibold text-[#2C2C2C] mb-2">Aucune formation</h3>
                        <p className="text-sm text-[#6b7280] mb-4 max-w-sm">Au moins une formation requise pour soumettre votre profil à la validation.</p>
                        <Button 
                          size="sm"
                          onClick={() => { setEditingEducation(null); setShowEducationDialog(true) }}
                          className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter une formation
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="certifications" className="mt-3">
                <SectionHeader
                  title="Mes certifications"
                  subtitle="Certifications et attestations. Optionnel mais valorisant pour votre profil dans la CVthèque."
                  icon={Award}
                  action={
                    <Button size="sm" onClick={() => { setEditingCertification(null); setShowCertificationDialog(true) }} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  }
                />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6">
                      {certifications.length > 0 ? (
                        <div className="space-y-4">
                          {certifications.map((cert) => (
                            <div key={cert.id} className="rounded-xl border border-gray-100 bg-[#F4F6F8]/30 hover:border-[#E8F4F3] hover:shadow-md transition-all group p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-[#E8F4F3] flex items-center justify-center shrink-0 shadow-sm">
                                        <Award className="h-5 w-5 text-[#226D68]" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm sm:text-base text-[#2C2C2C] truncate mb-0.5 group-hover:text-[#226D68] transition-colors">{cert.title}</h4>
                                        <p className="text-sm font-medium text-[#6b7280] truncate mb-2">{cert.issuer}</p>
                                        
                                        {/* Métadonnées compactes */}
                                        <div className="flex flex-wrap items-center gap-1">
                                          <div className="flex items-center gap-0.5 text-[9px] text-gray-600 bg-[#E8F4F3] px-1 py-0.5 rounded">
                                            <Calendar className="w-2 h-2 text-[#226D68]" />
                                            <span className="font-medium">{cert.year}</span>
                                          </div>
                                          {cert.expiration_date && (
                                            <div className="flex items-center gap-0.5 text-[9px] text-[#226D68] bg-[#E8F4F3] px-1 py-0.5 rounded">
                                              <Clock className="w-2 h-2" />
                                              <span className="font-medium">Expire {new Date(cert.expiration_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                          )}
                                          {cert.certification_id && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-[#226D68]/30 text-gray-700">
                                              ID: {cert.certification_id}
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        {/* Lien de vérification */}
                                        {cert.verification_url && (
                                          <div className="mt-1.5 pt-1.5 border-t border-[#E8F4F3]">
                                            <a 
                                              href={cert.verification_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-[9px] text-[#226D68] hover:underline inline-flex items-center gap-1 font-medium"
                                            >
                                              <Eye className="h-2.5 w-2.5" />
                                              Lien de vérification
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Actions - toujours visible sur mobile */}
                                  <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCertification(cert)
                                        setShowCertificationDialog(true)
                                      }}
                                      className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-[#E8F4F3] active:bg-[#E8F4F3]"
                                      title="Modifier"
                                    >
                                      <Edit className="h-4 w-4 sm:h-3 sm:w-3 text-[#226D68]" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCertification(cert.id)}
                                      className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-red-50 active:bg-red-50"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center rounded-xl border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/20">
                          <div className="p-4 bg-[#E8F4F3] rounded-2xl mb-4">
                            <Award className="h-10 w-10 text-[#226D68]" />
                          </div>
                          <p className="text-base font-semibold text-[#2C2C2C] mb-2">Aucune certification</p>
                          <p className="text-sm text-[#6b7280] mb-4 max-w-sm">Optionnel mais valorisant pour votre profil dans la CVthèque.</p>
                          <Button 
                            size="sm"
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                            onClick={() => setShowCertificationDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une certification
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="mt-3">
                <SectionHeader
                  title="Mes compétences"
                  subtitle="Compétences techniques et transversales. Un profil complet augmente vos chances d'être contacté par les recruteurs."
                  icon={Code}
                  action={
                    <Button size="sm" onClick={() => { setEditingSkill(null); setShowSkillDialog(true) }} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  }
                />

                {/* Liste des compétences */}
                {(() => {
                  // Grouper par type
                  const technicalSkills = skills.filter(s => s.skill_type === 'TECHNICAL')
                  const softSkills = skills.filter(s => s.skill_type === 'SOFT')
                  const toolSkills = skills.filter(s => s.skill_type === 'TOOL')
                  
                  const getLevelColor = (level) => {
                    switch(level) {
                      case 'EXPERT': return { bg: 'bg-[#226D68]', text: 'text-[#1a5a55]', border: 'border-[#226D68]' }
                      case 'ADVANCED': return { bg: 'bg-[#226D68]/80', text: 'text-[#1a5a55]', border: 'border-[#226D68]/80' }
                      case 'INTERMEDIATE': return { bg: 'bg-[#226D68]/60', text: 'text-[#1a5a55]', border: 'border-[#226D68]/60' }
                      case 'BEGINNER': return { bg: 'bg-[#226D68]/40', text: 'text-[#1a5a55]', border: 'border-[#226D68]/40' }
                      default: return { bg: 'bg-gray-400', text: 'text-gray-700', border: 'border-gray-300' }
                    }
                  }
                  
                  const getLevelProgress = (level) => {
                    switch(level) {
                      case 'EXPERT': return 100
                      case 'ADVANCED': return 75
                      case 'INTERMEDIATE': return 50
                      case 'BEGINNER': return 25
                      default: return 0
                    }
                  }
                  
                  const getLevelLabel = (level) => {
                    switch(level) {
                      case 'EXPERT': return 'Expert'
                      case 'ADVANCED': return 'Avancé'
                      case 'INTERMEDIATE': return 'Intermédiaire'
                      case 'BEGINNER': return 'Débutant'
                      default: return ''
                    }
                  }
                  
                  if (skills.length === 0) {
                    return (
                      <div className="rounded-xl border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/20 p-12 sm:p-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="p-4 bg-[#E8F4F3] rounded-2xl mb-4">
                            <Code className="h-10 w-10 text-[#226D68]" />
                          </div>
                          <p className="text-base font-semibold text-[#2C2C2C] mb-2">Aucune compétence</p>
                          <p className="text-sm text-[#6b7280] mb-4 max-w-sm">Au moins une compétence technique requise pour soumettre votre profil.</p>
                          <Button 
                            size="sm"
                            onClick={() => { setEditingSkill(null); setShowSkillDialog(true) }}
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter ma première compétence
                          </Button>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      <div className="space-y-6 p-4 sm:p-6">
                      {/* Compétences Techniques */}
                      {technicalSkills.length > 0 && (
                        <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 overflow-hidden">
                          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-[#E8F4F3]/30">
                            <div className="p-2 bg-[#226D68] rounded-lg">
                              <Code className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-[#2C2C2C]">Compétences techniques</h3>
                              <p className="text-xs text-[#6b7280]">{technicalSkills.length} compétence{technicalSkills.length > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {technicalSkills.map((skill) => {
                                const levelColors = getLevelColor(skill.level || 'BEGINNER')
                                return (
                                  <div
                                    key={skill.id}
                                    className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-[#E8F4F3] hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-[#2C2C2C] truncate mb-1">
                                          {skill.name}
                                        </h4>
                                        {skill.level && (
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className={`text-[10px] font-medium ${levelColors.text}`}>
                                                {getLevelLabel(skill.level)}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground">
                                                {getLevelProgress(skill.level)}%
                                              </span>
                                            </div>
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                              <div 
                                                className={`h-full ${levelColors.bg} transition-all duration-300`}
                                                style={{ width: `${getLevelProgress(skill.level)}%` }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                        {skill.years_of_practice > 0 && (
                                          <div className="flex items-center gap-1 mt-1.5">
                                            <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">
                                              {skill.years_of_practice} an{skill.years_of_practice > 1 ? 's' : ''}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-[#E8F4F3] active:bg-[#E8F4F3]"
                                          onClick={() => {
                                            setEditingSkill(skill)
                                            setShowSkillDialog(true)
                                          }}
                                        >
                                          <Edit className="h-4 w-4 sm:h-3 sm:w-3 text-[#226D68]" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-red-50 active:bg-red-50"
                                          onClick={() => handleDeleteSkill(skill.id)}
                                        >
                                          <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Soft Skills */}
                      {softSkills.length > 0 && (
                        <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 overflow-hidden">
                          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-[#E8F4F3]/30">
                            <div className="p-2 bg-[#226D68] rounded-lg">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-[#2C2C2C]">Soft Skills</h3>
                              <p className="text-xs text-[#6b7280]">{softSkills.length} compétence{softSkills.length > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {softSkills.map((skill) => (
                                <div
                                  key={skill.id}
                                  className="group relative bg-[#E8F4F3]/50 border border-[#E8F4F3] rounded-xl px-4 py-2.5 hover:border-[#226D68]/50 hover:shadow-sm transition-all duration-200 flex items-center gap-2"
                                >
                                  <Sparkles className="h-4 w-4 text-[#226D68] shrink-0" />
                                  <span className="font-medium text-sm text-[#2C2C2C]">
                                    {skill.name}
                                  </span>
                                  <div className="flex items-center gap-0.5 ml-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 sm:h-5 sm:w-5 p-0 hover:bg-[#E8F4F3] active:bg-[#E8F4F3]"
                                      onClick={() => {
                                        setEditingSkill(skill)
                                        setShowSkillDialog(true)
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 sm:h-2.5 sm:w-2.5 text-[#226D68]" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 sm:h-5 sm:w-5 p-0 hover:bg-red-50 active:bg-red-50"
                                      onClick={() => handleDeleteSkill(skill.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 sm:h-2.5 sm:w-2.5 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Outils & Logiciels */}
                      {toolSkills.length > 0 && (
                        <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 overflow-hidden">
                          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-[#E8F4F3]/30">
                            <div className="p-2 bg-[#226D68] rounded-lg">
                              <Wrench className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-[#2C2C2C]">Outils & Logiciels</h3>
                              <p className="text-xs text-[#6b7280]">{toolSkills.length} outil{toolSkills.length > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {toolSkills.map((skill) => {
                                const levelColors = getLevelColor(skill.level || 'BEGINNER')
                                return (
                                  <div
                                    key={skill.id}
                                    className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-[#E8F4F3] hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-[#2C2C2C] truncate mb-1">
                                          {skill.name}
                                        </h4>
                                        {skill.level && (
                                          <div className="space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className={`text-[10px] font-medium ${levelColors.text}`}>
                                                {getLevelLabel(skill.level)}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground">
                                                {getLevelProgress(skill.level)}%
                                              </span>
                                            </div>
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                              <div 
                                                className={`h-full ${levelColors.bg} transition-all duration-300`}
                                                style={{ width: `${getLevelProgress(skill.level)}%` }}
                                              />
                                            </div>
                                          </div>
                                        )}
                                        {skill.years_of_practice > 0 && (
                                          <div className="flex items-center gap-1 mt-1.5">
                                            <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                                            <span className="text-[10px] text-muted-foreground">
                                              {skill.years_of_practice} an{skill.years_of_practice > 1 ? 's' : ''}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-[#E8F4F3] active:bg-[#E8F4F3]"
                                          onClick={() => {
                                            setEditingSkill(skill)
                                            setShowSkillDialog(true)
                                          }}
                                        >
                                          <Edit className="h-4 w-4 sm:h-3 sm:w-3 text-[#226D68]" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-red-50 active:bg-red-50"
                                          onClick={() => handleDeleteSkill(skill.id)}
                                        >
                                          <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  )
                })()}
              </TabsContent>

              <TabsContent value="preferences" className="mt-3">
                <SectionHeader
                  title="Ma situation"
                  subtitle="Postes recherchés, types de contrat, localisation et disponibilité. Ces critères aident les recruteurs à vous trouver dans la CVthèque."
                  icon={Search}
                  action={
                    <Button size="sm" onClick={() => setShowPreferencesDialog(true)} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
                      <Edit className="h-4 w-4 mr-2" /> Modifier
                    </Button>
                  }
                />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6">
                      {jobPreferences ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Postes recherchés */}
                          {jobPreferences.desired_positions?.length > 0 && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-2 bg-[#E8F4F3] rounded-lg">
                                    <Briefcase className="h-4 w-4 text-[#226D68]" />
                                  </div>
                                  <p className="text-xs font-semibold text-[#6b7280]">Postes recherchés</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {jobPreferences.desired_positions.map((pos, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium">
                                      {pos}
                                    </Badge>
                                  ))}
                                </div>
                            </div>
                          )}
                          
                          {/* Types de contrat */}
                          {(jobPreferences.contract_types?.length > 0 || jobPreferences.contract_type) && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-2 bg-[#E8F4F3] rounded-lg">
                                    <FileText className="h-4 w-4 text-[#226D68]" />
                                  </div>
                                  <p className="text-xs font-semibold text-[#6b7280]">Type(s) de contrat</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {jobPreferences.contract_types?.length > 0
                                    ? jobPreferences.contract_types.map((type, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium">
                                          {type}
                                        </Badge>
                                      ))
                                    : <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium">
                                          {jobPreferences.contract_type}
                                        </Badge>
                                  }
                                </div>
                            </div>
                          )}
                          
                          {/* Secteurs ciblés */}
                          {jobPreferences.target_sectors?.length > 0 && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-1 mb-1.5">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <TrendingUp className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Secteurs ciblés</p>
                                </div>
                                <div className="flex flex-wrap gap-0.5">
                                  {jobPreferences.target_sectors.map((sector, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium">
                                      {sector}
                                    </Badge>
                                  ))}
                                </div>
                            </div>
                          )}
                          
                          {/* Localisation souhaitée */}
                          {jobPreferences.desired_location && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Localisation</p>
                                </div>
                                <p className="font-semibold text-[10px] text-gray-900 leading-tight">{jobPreferences.desired_location}</p>
                            </div>
                          )}
                          
                          {/* Mobilité */}
                          {jobPreferences.mobility && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Mobilité</p>
                                </div>
                                <p className="font-semibold text-[10px] text-gray-900 leading-tight">{jobPreferences.mobility}</p>
                            </div>
                          )}
                          
                          {/* Disponibilité */}
                          {jobPreferences.availability && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <Calendar className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Disponibilité</p>
                                </div>
                                <p className="font-semibold text-[10px] text-gray-900 leading-tight">
                                  {jobPreferences.availability === 'immediate' ? 'Immédiate' :
                                   jobPreferences.availability === '1_week' ? 'Sous 1 semaine' :
                                   jobPreferences.availability === '2_weeks' ? 'Sous 2 semaines' :
                                   jobPreferences.availability === '1_month' ? 'Sous 1 mois' :
                                   jobPreferences.availability === '2_months' ? 'Sous 2 mois' :
                                   jobPreferences.availability === '3_months' ? 'Sous 3 mois' :
                                   jobPreferences.availability === 'negotiable' ? 'À négocier' :
                                   jobPreferences.availability}
                                </p>
                            </div>
                          )}
                          
                          {/* Télétravail */}
                          {jobPreferences.remote_preference && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Télétravail</p>
                                </div>
                                <p className="font-semibold text-[10px] text-gray-900 leading-tight">
                                  {jobPreferences.remote_preference === 'onsite' ? 'Sur site uniquement' :
                                   jobPreferences.remote_preference === 'hybrid' ? 'Hybride' :
                                   jobPreferences.remote_preference === 'remote' ? 'Télétravail complet' :
                                   jobPreferences.remote_preference === 'flexible' ? 'Flexible' :
                                   jobPreferences.remote_preference}
                                </p>
                            </div>
                          )}
                          
                          {/* Zones préférées */}
                          {jobPreferences.preferred_locations && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Zones préférées</p>
                                </div>
                                <p className="font-semibold text-[10px] text-gray-900 leading-tight">{jobPreferences.preferred_locations}</p>
                            </div>
                          )}
                          
                          {/* Prêt à déménager */}
                          {jobPreferences.willing_to_relocate && (
                            <div className="rounded-xl border border-gray-100 bg-[#F4F6F8]/50 p-4 hover:border-[#E8F4F3] transition-colors">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Mobilité</p>
                                </div>
                                <p className="font-semibold text-[10px] text-[#226D68] leading-tight">Prêt(e) à déménager</p>
                            </div>
                          )}
                          
                          {/* Prétentions salariales */}
                          {(jobPreferences.salary_min || jobPreferences.salary_max) && (
                            <div className="rounded-xl border border-gray-100 bg-[#E8F4F3]/30 p-4 hover:border-[#E8F4F3] transition-colors sm:col-span-2 lg:col-span-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-[#226D68] rounded-lg">
                                  <TrendingUp className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-xs font-semibold text-[#6b7280]">Prétentions salariales</p>
                              </div>
                              <p className="font-bold text-base text-[#226D68]">
                                  {jobPreferences.salary_min && jobPreferences.salary_max
                                    ? `${jobPreferences.salary_min.toLocaleString('fr-FR')} - ${jobPreferences.salary_max.toLocaleString('fr-FR')} CFA/mois`
                                    : jobPreferences.salary_min
                                    ? `${jobPreferences.salary_min.toLocaleString('fr-FR')} CFA/mois`
                                    : `${jobPreferences.salary_max.toLocaleString('fr-FR')} CFA/mois`}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center rounded-xl border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/20">
                          <div className="p-4 bg-[#E8F4F3] rounded-2xl mb-4">
                            <MapPin className="h-10 w-10 text-[#226D68]" />
                          </div>
                          <p className="text-base font-semibold text-[#2C2C2C] mb-2">Recherche non renseignée</p>
                          <p className="text-sm text-[#6b7280] mb-4 max-w-sm">Ces critères aident les recruteurs à vous trouver dans la CVthèque.</p>
                          <Button 
                            size="sm"
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                            onClick={() => setShowPreferencesDialog(true)}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Remplir la recherche
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Documents */}
              <TabsContent value="documents" className="mt-3">
                <SectionHeader
                  title="Mes documents"
                  subtitle="Votre CV et les pièces justificatives. Un CV à jour renforce votre profil pour la validation par nos experts (objectif 48h)."
                  icon={FileText}
                  action={
                    <Button size="sm" onClick={() => setShowDocumentDialog(true)} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  }
                />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-4 sm:p-6">
                    {(() => {
                      // Filtrer les documents qui sont des photos de profil et des logos d'entreprise
                      // On les exclut de la liste des documents car ils sont déjà affichés ailleurs
                      const filteredDocuments = documents.filter((doc) => {
                        // Exclure les photos de profil (PROFILE_PHOTO)
                        if (doc.document_type === 'PROFILE_PHOTO') return false
                        if (doc.document_type === 'COMPANY_LOGO') return false
                        const isImage = doc.mime_type?.startsWith('image/')
                        const isOtherType = doc.document_type === 'OTHER'
                        if (isImage && isOtherType) return false
                        return true
                      })

                      return filteredDocuments.length > 0 ? (
                        <div className="space-y-4">
                          {filteredDocuments.map((doc) => {
                          const getDocumentTypeLabel = (type) => {
                            const labels = {
                              'CV': 'Curriculum Vitae',
                              'ATTESTATION': 'Attestation',
                              'CERTIFICATE': 'Certificat',
                              'RECOMMENDATION_LETTER': 'Lettre de recommandation',
                              'DIPLOMA': 'Diplôme',
                              'OTHER': 'Autre'
                            }
                            return labels[type] || type
                          }

                          const getDocumentTypeColor = () => 'bg-secondary text-secondary-foreground border-border'

                          const formatFileSize = (bytes) => {
                            if (bytes < 1024) return `${bytes} B`
                            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
                            return `${(bytes / 1024 / 1024).toFixed(1)} MB`
                          }

                          const handleViewDocument = () => {
                            // Ouvrir le popup de prévisualisation
                            setPreviewDocument({
                              ...doc,
                              url: documentApi.getDocumentServeUrl(doc.id)
                            })
                            setShowPreviewDialog(true)
                          }

                          const handleDownloadDocument = () => {
                            // Utiliser l'endpoint serve pour télécharger
                            const downloadUrl = documentApi.getDocumentServeUrl(doc.id)
                            const link = document.createElement('a')
                            link.href = downloadUrl
                            link.download = doc.original_filename
                            link.target = '_blank'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }

                          const handleDeleteDocument = () => {
                            setConfirmDialog({
                              title: 'Supprimer ce document ?',
                              message: `« ${doc.original_filename} » sera supprimé. Cette action est irréversible.`,
                              variant: 'danger',
                              onConfirm: async () => {
                                setConfirmDialog(null)
                                try {
                                  await documentApi.deleteDocument(doc.id)
                                  setDocuments(documents.filter(d => d.id !== doc.id))
                                  setToast({ message: 'Document supprimé.', type: 'success' })
                                } catch (error) {
                                  console.error('Error deleting document:', error)
                                  setToast({ message: 'Erreur lors de la suppression.', type: 'error' })
                                }
                              },
                            })
                          }

                            return (
                              <div key={doc.id} className="rounded-xl border border-gray-100 bg-[#F4F6F8]/30 hover:border-[#E8F4F3] hover:shadow-md transition-all group p-4 sm:p-5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-[#E8F4F3] flex items-center justify-center shrink-0 shadow-sm">
                                          <FileText className="h-5 w-5 text-[#226D68]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h4 className="font-semibold text-sm text-[#2C2C2C] truncate group-hover:text-[#226D68] transition-colors">{doc.original_filename}</h4>
                                            <Badge variant="secondary" className={`text-[9px] px-1 py-0 h-4 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium`}>
                                              {getDocumentTypeLabel(doc.document_type)}
                                            </Badge>
                                            {doc.status && (
                                              <Badge 
                                                variant={doc.status === 'uploaded' ? 'secondary' : 'outline'} 
                                                className="text-[9px] px-1 py-0 h-4"
                                              >
                                                {doc.status === 'uploaded' ? 'Téléchargé' : doc.status}
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {/* Métadonnées compactes */}
                                          <div className="flex flex-wrap items-center gap-1">
                                            <div className="flex items-center gap-0.5 text-[9px] text-gray-600 bg-[#E8F4F3] px-1 py-0.5 rounded">
                                              <span className="font-medium">{formatFileSize(doc.file_size)}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5 text-[9px] text-gray-600 bg-[#E8F4F3] px-1 py-0.5 rounded">
                                              <span className="font-medium">{doc.mime_type?.split('/')[1]?.toUpperCase() || doc.mime_type}</span>
                                            </div>
                                            {doc.created_at && (
                                              <div className="flex items-center gap-0.5 text-[9px] text-gray-600 bg-[#E8F4F3] px-1 py-0.5 rounded">
                                                <Calendar className="w-2 h-2 text-[#226D68]" />
                                                <span className="font-medium">{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Actions compactes - toujours visible sur mobile */}
                                    <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleViewDocument}
                                        className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-[#E8F4F3] active:bg-[#E8F4F3]"
                                        title="Voir"
                                      >
                                        <Eye className="h-4 w-4 sm:h-3 sm:w-3 text-[#226D68]" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDownloadDocument}
                                        className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-[#E8F4F3] active:bg-[#E8F4F3]"
                                        title="Télécharger"
                                      >
                                        <Download className="h-4 w-4 sm:h-3 sm:w-3 text-[#226D68]" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDeleteDocument}
                                        className="h-8 w-8 sm:h-6 sm:w-6 p-0 hover:bg-red-50 active:bg-red-50"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center rounded-xl border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/20">
                          <div className="p-4 bg-[#E8F4F3] rounded-2xl mb-4">
                            <FileText className="h-10 w-10 text-[#226D68]" />
                          </div>
                          <p className="text-base font-semibold text-[#2C2C2C] mb-2">Aucun document</p>
                          <p className="text-sm text-[#6b7280] mb-4 max-w-sm">Un CV à jour renforce votre profil pour la validation par nos experts (objectif 48h). PDF ou DOCX.</p>
                          <Button 
                            size="sm"
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                            onClick={() => setShowDocumentDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un document
                          </Button>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Paramètres */}
              <TabsContent value="settings" className="mt-3">
                <SectionHeader
                  title="Paramètres du compte"
                  subtitle="Modifiez votre mot de passe ou supprimez votre compte"
                  icon={Settings}
                />
                <SettingsPageContent
                  onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
                  onError={(msg) => setToast({ message: msg, type: 'error' })}
                />
              </TabsContent>
            </Tabs>
          </>
          )}

          {/* Footer avec dates du profil */}
          {(profile?.created_at || profile?.updated_at || profile?.submitted_at) && (
            <footer className="mt-6 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                {profile.created_at && (
                  <span>Inscription: {formatDateTime(profile.created_at)}</span>
                )}
                {profile.updated_at && (
                  <span>Dernière modification: {formatDateTime(profile.updated_at)}</span>
                )}
                {profile.submitted_at && (
                  <span>Soumission: {formatDateTime(profile.submitted_at)}</span>
                )}
              </div>
            </footer>
          )}
        </div>
      </main>
    </div>

      {/* Popup flottant Expert Yemma - bas à droite */}
      <SupportWidget floating />

    </div>

      {/* Toast (succès / erreur) */}
      {toast && (
        <div
          role="alert"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-[12px] shadow-lg border text-sm font-medium text-white max-w-[90vw] ${
            toast.type === 'success' ? 'bg-primary border-primary/80' : 'bg-red-600 border-red-700'
          }`}
          style={toast.type === 'success' ? { backgroundColor: '#226D68' } : {}}
        >
          {toast.message}
        </div>
      )}

      {/* Modale de confirmation (suppression, déconnexion) */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="max-w-sm border-l-4 border-l-[#226D68]">
          <DialogHeader className="border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="text-gray-anthracite font-heading font-semibold text-xl">{confirmDialog?.title}</DialogTitle>
            <DialogDescription className="text-neutral-500 mt-1">{confirmDialog?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)} className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]">Annuler</Button>
            <Button
              variant={confirmDialog?.variant === 'danger' ? 'destructive' : 'default'}
              onClick={() => confirmDialog?.onConfirm?.()}
            >
              {confirmDialog?.variant === 'danger' && confirmDialog?.title?.includes('Déconnexion') ? 'Déconnexion' : confirmDialog?.variant === 'danger' ? 'Supprimer' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale consentement unique avant soumission du profil */}
      <Dialog open={showSubmitConsentModal} onOpenChange={(open) => { if (!submittingProfile) { setShowSubmitConsentModal(open); setSubmitError(null); if (!open) setConsentAccepted(false); } }}>
        <DialogContent className="max-w-md border-l-4 border-l-[#226D68]">
          <DialogHeader className="text-left border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-heading font-semibold text-gray-anthracite flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Accepter les conditions
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-500 mt-1">
              Pour soumettre votre profil à la validation, vous devez lire et accepter les conditions d'utilisation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-gray-anthracite mb-2">Récapitulatif de votre profil</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: canSubmit ? '#22c55e' : '#eab308' }} aria-hidden />
                  Profil complété à {Math.round(profile?.completion_percentage || 0)} %
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: documents?.some(d => d.document_type === 'CV') ? '#22c55e' : '#ef4444' }} aria-hidden />
                  CV PDF : {documents?.some(d => d.document_type === 'CV') ? 'Oui' : 'Non'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (experiences?.length || 0) > 0 ? '#22c55e' : '#ef4444' }} aria-hidden />
                  {experiences?.length || 0} expérience(s) professionnelle(s)
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (educations?.length || 0) > 0 ? '#22c55e' : '#ef4444' }} aria-hidden />
                  {educations?.length || 0} formation(s)
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: (skills?.length || 0) > 0 ? '#22c55e' : '#ef4444' }} aria-hidden />
                  {skills?.length || 0} compétence(s)
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: jobPreferences?.contract_type && jobPreferences?.desired_location ? '#22c55e' : '#eab308' }} aria-hidden />
                  Recherche : {jobPreferences?.contract_type && jobPreferences?.desired_location ? 'Renseignées' : 'À compléter'}
                </li>
              </ul>
            </div>

              Consultez les documents suivants avant d’accepter&nbsp;:
            </p>
            <ul className="text-sm space-y-1.5">
              <li>
                <a
                  href="/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  style={{ color: '#226D68' }}
                >
                  Conditions générales d’utilisation (CGU)
                </a>
              </li>
              <li>
                <a
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  style={{ color: '#226D68' }}
                >
                  Politique de confidentialité (RGPD)
                </a>
              </li>
            </ul>
            <label className="flex items-start gap-3 cursor-pointer checkbox-label rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
              <Checkbox checked={consentAccepted} onCheckedChange={(v) => setConsentAccepted(!!v)} className="mt-0.5" />
              <span className="text-sm text-gray-anthracite break-words">
                J’ai lu les conditions ci-dessus et j’accepte les <strong>CGU</strong>, la <strong>politique de confidentialité (RGPD)</strong> et j’autorise la <strong>vérification des informations</strong> de mon profil par l’équipe Yemma.
              </span>
            </label>
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                <p className="font-medium mb-1">Impossible de soumettre le profil</p>
                <p>{submitError}</p>
                <p className="mt-2 text-xs text-red-700">Complétez les éléments manquants puis réessayez.</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => { setShowSubmitConsentModal(false); setConsentAccepted(false); setSubmitError(null); }} disabled={submittingProfile} className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]">
              Annuler
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              style={{ backgroundColor: '#226D68' }}
              disabled={!consentAccepted || submittingProfile}
              onClick={async () => {
                if (!consentAccepted || !profile?.id) return
                setSubmitError(null)
                try {
                  setSubmittingProfile(true)
                  await candidateApi.updateProfile(profile.id, { accept_cgu: true, accept_rgpd: true, accept_verification: true })
                  await candidateApi.submitProfile(profile.id)
                  setShowSubmitConsentModal(false)
                  setConsentAccepted(false)
                  setToast({ message: 'Profil soumis avec succès. Notre équipe vous contactera pour la suite.', type: 'success' })
                  await loadProfile()
                } catch (error) {
                  const detail = error.response?.data?.detail
                  const message = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(d => d.msg || d.message || d).join(', ') : error.message
                  setSubmitError(message || 'Erreur lors de la soumission.')
                  setToast({ message: 'Erreur : ' + message, type: 'error' })
                } finally {
                  setSubmittingProfile(false)
                }
              }}
            >
              {submittingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden /> Envoi en cours...</> : <><FileCheck className="w-4 h-4 mr-2" aria-hidden /> Accepter et soumettre</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale pour ajouter une expérience */}
      <Dialog open={showExperienceDialog} onOpenChange={setShowExperienceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-l-4 border-l-[#226D68]">
          <DialogHeader className="border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="text-gray-anthracite font-heading font-semibold text-xl">{editingExperience ? 'Modifier l\'expérience professionnelle' : 'Ajouter une expérience professionnelle'}</DialogTitle>
            <DialogDescription className="text-neutral-500 mt-1">
              {editingExperience ? 'Modifiez les informations de votre expérience professionnelle' : 'Remplissez les informations de votre expérience professionnelle'}
            </DialogDescription>
          </DialogHeader>
          <ExperienceForm 
            profileId={profile?.id}
            experience={editingExperience}
            onSuccess={async () => {
              setShowExperienceDialog(false)
              setEditingExperience(null)
              await loadProfile()
              setToast({ message: 'Expérience enregistrée.', type: 'success' })
            }}
            onCancel={() => {
              setShowExperienceDialog(false)
              setEditingExperience(null)
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        </DialogContent>
      </Dialog>

      {/* Modale pour ajouter une formation */}
      <Dialog open={showEducationDialog} onOpenChange={setShowEducationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-l-4 border-l-[#226D68]">
          <DialogHeader className="border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="text-gray-anthracite font-heading font-semibold text-xl">{editingEducation ? 'Modifier la formation' : 'Ajouter une formation'}</DialogTitle>
            <DialogDescription className="text-neutral-500 mt-1">
              {editingEducation ? 'Modifiez les informations de votre formation' : 'Remplissez les informations de votre formation'}
            </DialogDescription>
          </DialogHeader>
          <EducationForm 
            profileId={profile?.id}
            education={editingEducation}
            onSuccess={async () => {
              setShowEducationDialog(false)
              setEditingEducation(null)
              await loadProfile()
              setToast({ message: 'Formation enregistrée.', type: 'success' })
            }}
            onCancel={() => {
              setShowEducationDialog(false)
              setEditingEducation(null)
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        </DialogContent>
      </Dialog>

      {/* Modale pour ajouter une certification */}
      <Dialog open={showCertificationDialog} onOpenChange={setShowCertificationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-l-4 border-l-[#226D68]">
          <DialogHeader className="border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="text-gray-anthracite font-heading font-semibold text-xl">{editingCertification ? 'Modifier la certification' : 'Ajouter une certification'}</DialogTitle>
            <DialogDescription className="text-neutral-500 mt-1">
              {editingCertification ? 'Modifiez les informations de votre certification' : 'Remplissez les informations de votre certification'}
            </DialogDescription>
          </DialogHeader>
          <CertificationForm 
            profileId={profile?.id}
            certification={editingCertification}
            onSuccess={async () => {
              setShowCertificationDialog(false)
              setEditingCertification(null)
              await loadProfile()
              setToast({ message: 'Certification enregistrée.', type: 'success' })
            }}
            onCancel={() => {
              setShowCertificationDialog(false)
              setEditingCertification(null)
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        </DialogContent>
      </Dialog>

      {/* Modale pour ajouter une compétence */}
      <Dialog open={showSkillDialog} onOpenChange={setShowSkillDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-l-4 border-l-[#226D68]">
          <DialogHeader className="border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="text-gray-anthracite font-heading font-semibold text-xl">{editingSkill ? 'Modifier la compétence' : 'Ajouter une compétence'}</DialogTitle>
            <DialogDescription className="text-neutral-500 mt-1">
              {editingSkill ? 'Modifiez les informations de votre compétence' : 'Ajoutez une nouvelle compétence à votre profil'}
            </DialogDescription>
          </DialogHeader>
          <SkillForm 
            profileId={profile?.id}
            skill={editingSkill}
            onSuccess={async () => {
              setShowSkillDialog(false)
              setEditingSkill(null)
              await loadProfile()
              setToast({ message: 'Compétence enregistrée.', type: 'success' })
            }}
            onCancel={() => {
              setShowSkillDialog(false)
              setEditingSkill(null)
            }}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        </DialogContent>
      </Dialog>

      {/* Modale pour modifier les préférences */}
      <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-l-4 border-l-[#226D68]">
          <DialogHeader className="border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="text-gray-anthracite font-heading font-semibold text-xl">Modifier les préférences</DialogTitle>
            <DialogDescription className="text-neutral-500 mt-1">
              Définissez vos préférences de recherche d'emploi
            </DialogDescription>
          </DialogHeader>
          <PreferencesForm 
            profileId={profile?.id}
            currentPreferences={jobPreferences}
            onSuccess={async () => {
              setShowPreferencesDialog(false)
              await loadProfile()
              setToast({ message: 'Préférences enregistrées.', type: 'success' })
            }}
            onCancel={() => setShowPreferencesDialog(false)}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        </DialogContent>
      </Dialog>

      {/* Modale pour ajouter un document */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="max-w-lg border-l-4 border-l-[#226D68]">
          <DialogHeader className="border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="text-gray-anthracite font-heading font-semibold text-xl">Ajouter un document</DialogTitle>
            <DialogDescription className="text-neutral-500 mt-1">
              Téléchargez un document justificatif (PDF, JPG, PNG - max 10MB)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="document-type">Type de document <span className="text-red-500">*</span></Label>
              <select
                id="document-type"
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-anthracite placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226D68]/30 focus-visible:ring-offset-2 focus-visible:border-[#226D68] disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="CV">Curriculum Vitae</option>
                <option value="ATTESTATION">Attestation</option>
                <option value="CERTIFICATE">Certificat</option>
                <option value="RECOMMENDATION_LETTER">Lettre de recommandation</option>
                <option value="DIPLOMA">Diplôme</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <Label htmlFor="document-file">Fichier <span className="text-red-500">*</span></Label>
              <Input
                id="document-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      setToast({ message: 'Le fichier ne doit pas dépasser 10 Mo.', type: 'error' })
                      e.target.value = ''
                      return
                    }
                    setSelectedDocumentFile(file)
                  }
                }}
                className="cursor-pointer"
              />
              {selectedDocumentFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Fichier sélectionné: {selectedDocumentFile.name} ({(selectedDocumentFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: PDF, JPG, PNG. Taille maximale: 10MB
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-neutral-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowDocumentDialog(false)
                setSelectedDocumentFile(null)
                setSelectedDocumentType('CV')
              }}
              disabled={uploadingDocument}
              className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]"
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleDocumentUpload}
              disabled={!selectedDocumentFile || uploadingDocument}
              className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
            >
              {uploadingDocument ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Ajouter le document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de prévisualisation de document */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border-l-4 border-l-[#226D68]">
          <DialogHeader className="border-b border-neutral-100 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-gray-anthracite font-heading font-semibold text-xl">
              <FileText className="h-5 w-5 text-[#226D68]" />
              {previewDocument?.original_filename || 'Document'}
            </DialogTitle>
            <DialogDescription className="text-neutral-500 mt-1">
              Prévisualisation du document
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-[60vh] bg-[#F4F6F8] rounded-xl overflow-hidden">
            {previewDocument && (
              previewDocument.mime_type?.startsWith('image/') ? (
                <img
                  src={previewDocument.url}
                  alt={previewDocument.original_filename}
                  className="w-full h-full object-contain"
                />
              ) : previewDocument.mime_type === 'application/pdf' ? (
                <iframe
                  src={previewDocument.url}
                  title={previewDocument.original_filename}
                  className="w-full h-[60vh] border-0"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Prévisualisation non disponible pour ce type de fichier
                  </p>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = previewDocument.url
                      link.download = previewDocument.original_filename
                      link.target = '_blank'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le fichier
                  </Button>
                </div>
              )
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between pt-4 border-t border-neutral-100">
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
              className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]"
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                if (previewDocument) {
                  const link = document.createElement('a')
                  link.href = previewDocument.url
                  link.download = previewDocument.original_filename
                  link.target = '_blank'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }
              }}
              className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant formulaire pour ajouter/modifier une expérience
function ExperienceForm({ profileId, experience, onSuccess, onCancel, onError }) {
  const [formData, setFormData] = useState({
    companyName: experience?.company_name || '',
    companyLogoUrl: experience?.company_logo_url || null,
    position: experience?.position || '',
    contract_type: experience?.contract_type || '',
    company_sector: experience?.company_sector || '',
    startDate: experience?.start_date ? new Date(experience.start_date).toISOString().split('T')[0] : '',
    endDate: experience?.end_date ? new Date(experience.end_date).toISOString().split('T')[0] : '',
    isCurrent: experience?.is_current || false,
    description: experience?.description || '',
    achievements: experience?.achievements || '',
    hasDocument: experience?.has_document || false,
    documentId: experience?.document_id || null
  })
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Mettre à jour le formulaire quand experience change
  useEffect(() => {
    if (experience) {
      setFormData({
        companyName: experience.company_name || '',
        companyLogoUrl: experience.company_logo_url || null,
        position: experience.position || '',
        contract_type: experience.contract_type || '',
        company_sector: experience.company_sector || '',
        startDate: experience.start_date ? new Date(experience.start_date).toISOString().split('T')[0] : '',
        endDate: experience.end_date ? new Date(experience.end_date).toISOString().split('T')[0] : '',
        isCurrent: experience.is_current || false,
        description: experience.description || '',
        achievements: experience.achievements || '',
        hasDocument: experience.has_document || false,
        documentId: experience.document_id || null
      })
    } else {
      setFormData({
        companyName: '',
        companyLogoUrl: null,
        position: '',
        contract_type: '',
        company_sector: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: '',
        achievements: '',
        hasDocument: false,
        documentId: null
      })
    }
  }, [experience])

  // Générer un avatar logo d'entreprise par défaut
  const generateCompanyAvatar = (companyName) => {
    const initials = companyName
      ? companyName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
      : 'CO'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=100&background=random&color=fff&bold=true&format=svg`
  }

  // Gérer l'upload du logo d'entreprise
  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !profileId) return

    if (!file.type.startsWith('image/')) {
      onError?.('Veuillez sélectionner une image (JPG, PNG).')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      onError?.('Le logo ne doit pas dépasser 2 Mo.')
      return
    }

    try {
      setUploadingLogo(true)
      const uploadedDoc = await documentApi.uploadDocument(file, profileId, 'OTHER')
      const serveUrl = documentApi.getDocumentServeUrl(uploadedDoc.id)
      setFormData({ ...formData, companyLogoUrl: serveUrl })
    } catch (error) {
      console.error('Erreur lors de l\'upload du logo:', error)
      onError?.('Erreur upload logo : ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploadingLogo(false)
    }
  }

  // Gérer l'upload du document justificatif
  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !profileId) return

    if (file.size > 10 * 1024 * 1024) {
      onError?.('Le document ne doit pas dépasser 10 Mo.')
      return
    }

    try {
      setUploadingDoc(true)
      const fileName = file.name.toLowerCase()
      let docType = 'OTHER'
      if (fileName.includes('attestation') || fileName.includes('certificat')) {
        docType = 'ATTESTATION'
      } else if (fileName.includes('recommandation') || fileName.includes('lettre')) {
        docType = 'RECOMMENDATION_LETTER'
      }
      
      const uploadedDoc = await documentApi.uploadDocument(file, profileId, docType)
      setFormData({ ...formData, documentId: uploadedDoc.id, hasDocument: true })
    } catch (error) {
      console.error('Erreur lors de l\'upload du document:', error)
      onError?.('Erreur upload document : ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profileId) return

    if (!formData.companyName || !formData.position || !formData.startDate || !formData.description) {
      onError?.('Veuillez remplir tous les champs obligatoires (Nom de l\'entreprise, Poste, Date de début, Description).')
      return
    }

    try {
      setSaving(true)
      const exp = {
        company_name: formData.companyName,
        company_logo_url: formData.companyLogoUrl,
        company_sector: formData.company_sector || null,
        position: formData.position,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        is_current: formData.isCurrent || !formData.endDate,
        description: formData.description,
        achievements: formData.achievements || null,
        has_document: formData.hasDocument,
        document_id: formData.documentId || null,
      }
      const data = experienceToApiPayload(exp)

      // Si on modifie une expérience existante, supprimer l'ancienne puis créer la nouvelle
      if (experience?.id) {
        try {
          await candidateApi.deleteExperience(profileId, experience.id)
        } catch (deleteError) {
          if (deleteError.response?.status !== 404) {
            throw deleteError
          }
        }
      }

      await candidateApi.createExperience(profileId, data)
      onSuccess()
    } catch (error) {
      console.error('Error saving experience:', error)
      onError?.('Erreur : ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Logo d'entreprise */}
      <div className="border rounded-lg p-4 bg-muted/50">
        <p className="text-xs font-medium text-muted-foreground mb-2">Logo de l&apos;entreprise pour cette expérience (distinct de votre photo de profil)</p>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={formData.companyLogoUrl || generateCompanyAvatar(formData.companyName)}
                alt={`Logo de l'entreprise ${formData.companyName || ''}`}
                className="w-16 h-16 rounded-lg object-cover border-2 border-primary"
                onError={(e) => {
                  e.target.src = generateCompanyAvatar(formData.companyName)
                }}
              />
              {uploadingLogo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="logo-upload" className="text-sm font-medium">
              Logo ou image de l&apos;entreprise (facultatif)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="logo-upload"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={uploadingLogo}
              >
                <Upload className="w-4 h-4 mr-2" />
                {formData.companyLogoUrl ? 'Changer' : 'Télécharger'}
              </Button>
              {formData.companyLogoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, companyLogoUrl: null })}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG (max 2 Mo). Si non renseigné, un avatar basé sur le nom de l&apos;entreprise sera affiché.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Nom de l'entreprise <span className="text-red-500">*</span></Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="position">Poste occupé <span className="text-red-500">*</span></Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="company_sector">Secteur de l'entreprise</Label>
        <SearchableSelect
          id="company_sector"
          options={SECTORS_FR}
          value={formData.company_sector || ''}
          onChange={(value) => setFormData({ ...formData, company_sector: value })}
          placeholder="Choisir un secteur"
          className="h-10 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Date de début <span className="text-red-500">*</span></Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">Date de fin</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value, isCurrent: false })}
            disabled={formData.isCurrent}
          />
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={formData.isCurrent}
              onChange={(e) => {
                setFormData({ ...formData, isCurrent: e.target.checked, endDate: e.target.checked ? '' : formData.endDate })
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isCurrent" className="text-sm cursor-pointer">En cours</Label>
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description des missions <span className="text-red-500">*</span></Label>
        <RichTextEditor
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Décrivez vos missions et responsabilités..."
        />
      </div>
      <div>
        <Label htmlFor="achievements">Réalisations majeures</Label>
        <RichTextEditor
          value={formData.achievements}
          onChange={(value) => setFormData({ ...formData, achievements: value })}
          placeholder="Listez vos réalisations et accomplissements..."
        />
      </div>
      {/* Document justificatif */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="document-upload" className="text-sm font-medium">
              Document justificatif (facultatif)
            </Label>
            <p className="text-xs text-muted-foreground">
              Attestation, certificat de travail, lettre de recommandation, contrat, etc. (PDF, JPG, PNG - max 10MB)
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="document-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
                disabled={uploadingDoc}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('document-upload')?.click()}
                disabled={uploadingDoc}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingDoc ? 'Upload en cours...' : (formData.documentId ? 'Changer le document' : 'Télécharger un document')}
              </Button>
              {formData.documentId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await documentApi.deleteDocument(formData.documentId)
                      setFormData({ ...formData, documentId: null, hasDocument: false })
                    } catch (error) {
                      console.error('Erreur lors de la suppression:', error)
                    }
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
            {formData.documentId && (
              <p className="text-xs text-[#226D68] flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Document téléchargé avec succès
              </p>
            )}
          </div>
        </div>
      </div>
      <DialogFooter className="pt-4 border-t border-neutral-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]">
          Annuler
        </Button>
        <Button type="submit" disabled={saving} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
          {saving ? 'Enregistrement...' : (experience ? 'Modifier' : 'Ajouter')}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Composant formulaire pour ajouter/modifier une formation
function EducationForm({ profileId, education, onSuccess, onCancel, onError }) {
  const [formData, setFormData] = useState({
    diploma: education?.diploma || '',
    institution: education?.institution || '',
    country: education?.country || '',
    startYear: education?.start_year?.toString() || '',
    graduationYear: education?.graduation_year || new Date().getFullYear(),
    level: education?.level || ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (education) {
      setFormData({
        diploma: education.diploma || '',
        institution: education.institution || '',
        country: education.country || '',
        startYear: education.start_year?.toString() || '',
        graduationYear: education.graduation_year || new Date().getFullYear(),
        level: education.level || ''
      })
    } else {
      setFormData({
        diploma: '',
        institution: '',
        country: '',
        startYear: '',
        graduationYear: new Date().getFullYear(),
        level: ''
      })
    }
  }, [education])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profileId) return

    try {
      setSaving(true)
      const edu = {
        diploma: formData.diploma,
        institution: formData.institution,
        country: formData.country || null,
        start_year: formData.startYear || null,
        graduation_year: formData.graduationYear,
        level: formData.level || 'Non spécifié',
      }
      const data = educationToApiPayload(edu)
      await candidateApi.createEducation(profileId, data)
      onSuccess()
    } catch (error) {
      console.error('Error creating education:', error)
      onError?.('Erreur : ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="diploma">Intitulé du diplôme / formation <span className="text-red-500">*</span></Label>
          <Input
            id="diploma"
            value={formData.diploma}
            onChange={(e) => setFormData({ ...formData, diploma: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="institution">Établissement <span className="text-red-500">*</span></Label>
          <Input
            id="institution"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Pays <span className="text-red-500">*</span></Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="startYear">Année de début</Label>
          <Input
            id="startYear"
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            value={formData.startYear}
            onChange={(e) => setFormData({ ...formData, startYear: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="graduationYear">Année d'obtention <span className="text-red-500">*</span></Label>
          <Input
            id="graduationYear"
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            value={formData.graduationYear}
            onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="level">Niveau <span className="text-red-500">*</span></Label>
          <select
            id="level"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
            <option value="">Sélectionner un niveau</option>
            {formData.level && !['Non spécifié', 'CAP/BEP', 'Bac', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Bac+8'].includes(formData.level) && (
              <option value={formData.level}>{formData.level}</option>
            )}
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
      <DialogFooter className="pt-4 border-t border-neutral-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]">
          Annuler
        </Button>
        <Button type="submit" disabled={saving} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
          {saving ? 'Enregistrement...' : (education ? 'Modifier' : 'Ajouter')}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Composant formulaire pour ajouter/modifier une certification
function CertificationForm({ profileId, certification, onSuccess, onCancel, onError }) {
  const [formData, setFormData] = useState({
    title: certification?.title || '',
    issuer: certification?.issuer || '',
    year: certification?.year || new Date().getFullYear(),
    expirationDate: certification?.expiration_date ? new Date(certification.expiration_date).toISOString().split('T')[0] : '',
    verificationUrl: certification?.verification_url || '',
    certificationId: certification?.certification_id || certification?.credential_id || ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (certification) {
      setFormData({
        title: certification.title || '',
        issuer: certification.issuer || '',
        year: certification.year || new Date().getFullYear(),
        expirationDate: certification.expiration_date ? new Date(certification.expiration_date).toISOString().split('T')[0] : '',
        verificationUrl: certification.verification_url || '',
        certificationId: certification.certification_id || certification.credential_id || ''
      })
    } else {
      setFormData({
        title: '',
        issuer: '',
        year: new Date().getFullYear(),
        expirationDate: '',
        verificationUrl: '',
        certificationId: ''
      })
    }
  }, [certification])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profileId) return

    try {
      setSaving(true)
      const cert = {
        title: formData.title,
        issuer: formData.issuer,
        year: formData.year,
        expiration_date: formData.expirationDate || null,
        verification_url: formData.verificationUrl || null,
        certification_id: formData.certificationId || null,
      }
      const data = certificationToApiPayload(cert)
      await candidateApi.createCertification(profileId, data)
      onSuccess()
    } catch (error) {
      console.error('Error creating certification:', error)
      onError?.('Erreur : ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Intitulé de la certification <span className="text-red-500">*</span></Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="issuer">Organisme délivreur <span className="text-red-500">*</span></Label>
          <Input
            id="issuer"
            value={formData.issuer}
            onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year">Année d'obtention <span className="text-red-500">*</span></Label>
          <Input
            id="year"
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="expirationDate">Date d'expiration</Label>
          <Input
            id="expirationDate"
            type="date"
            value={formData.expirationDate}
            onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="verificationUrl">URL de vérification</Label>
          <Input
            id="verificationUrl"
            type="url"
            value={formData.verificationUrl}
            onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label htmlFor="certificationId">ID de la certification</Label>
          <Input
            id="certificationId"
            value={formData.certificationId}
            onChange={(e) => setFormData({ ...formData, certificationId: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter className="pt-4 border-t border-neutral-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]">
          Annuler
        </Button>
        <Button type="submit" disabled={saving} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
          {saving ? 'Enregistrement...' : (certification ? 'Modifier' : 'Ajouter')}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Composant formulaire pour ajouter/modifier une compétence
function SkillForm({ profileId, skill, onSuccess, onCancel, onError }) {
  const [formData, setFormData] = useState({
    name: skill?.name || '',
    skillType: skill?.skill_type || 'TECHNICAL',
    level: skill?.level || 'BEGINNER',
    yearsOfPractice: skill?.years_of_practice || 0
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name || '',
        skillType: skill.skill_type || 'TECHNICAL',
        level: skill.level || 'BEGINNER',
        yearsOfPractice: skill.years_of_practice || 0
      })
    } else {
      setFormData({
        name: '',
        skillType: 'TECHNICAL',
        level: 'BEGINNER',
        yearsOfPractice: 0
      })
    }
  }, [skill])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profileId) return

    try {
      setSaving(true)
      const skillPayload = {
        name: formData.name,
        skill_type: formData.skillType,
        level: formData.skillType === 'SOFT' ? null : formData.level,
        years_of_practice: formData.skillType === 'SOFT' ? null : formData.yearsOfPractice,
      }
      const data = skillToApiPayload(skillPayload)

      // Si on modifie une compétence existante, supprimer l'ancienne puis créer la nouvelle
      if (skill?.id) {
        try {
          await candidateApi.deleteSkill(profileId, skill.id)
        } catch (deleteError) {
          if (deleteError.response?.status !== 404) {
            throw deleteError
          }
        }
      }

      await candidateApi.createSkill(profileId, data)
      onSuccess()
    } catch (error) {
      console.error('Error saving skill:', error)
      onError?.('Erreur : ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Type de compétence */}
        <div>
          <Label htmlFor="skillType">Type de compétence <span className="text-red-500">*</span></Label>
          <select
            id="skillType"
            value={formData.skillType || 'TECHNICAL'}
            onChange={(e) => setFormData({ ...formData, skillType: e.target.value, level: e.target.value === 'SOFT' ? '' : (formData.level || 'BEGINNER') })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="TECHNICAL">Compétence technique</option>
            <option value="SOFT">Compétence comportementale (Soft Skill)</option>
            <option value="TOOL">Outil & Logiciel</option>
          </select>
        </div>

        {/* Nom de la compétence */}
        <div>
          <Label htmlFor="name">Compétence <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={formData.skillType === 'SOFT' ? 'Ex: Communication, Leadership...' : 'Ex: Python, React...'}
            required
          />
        </div>

        {/* Niveau et années de pratique - seulement pour les compétences techniques et outils */}
        {formData.skillType !== 'SOFT' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="level">Niveau <span className="text-red-500">*</span></Label>
              <select
                id="level"
                value={formData.level || 'BEGINNER'}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="BEGINNER">Débutant</option>
                <option value="INTERMEDIATE">Intermédiaire</option>
                <option value="ADVANCED">Avancé</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
            <div>
              <Label htmlFor="yearsOfPractice">Années de pratique</Label>
              <Input
                id="yearsOfPractice"
                type="number"
                min="0"
                value={formData.yearsOfPractice}
                onChange={(e) => setFormData({ ...formData, yearsOfPractice: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Message informatif pour les soft skills */}
        {formData.skillType === 'SOFT' && (
          <div className="bg-[#226D68]/10 border border-[#226D68]/20 rounded-lg p-3 text-sm text-[#226D68]">
            <p>Les compétences comportementales n'ont pas de niveau ou d'années de pratique.</p>
          </div>
        )}
      </div>
      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t border-neutral-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="w-full sm:w-auto border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]">
          Annuler
        </Button>
        <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-[#226D68] hover:bg-[#1a5a55] text-white">
          {saving ? 'Enregistrement...' : (skill ? 'Modifier' : 'Ajouter')}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Composant formulaire pour modifier les préférences
function PreferencesForm({ profileId, currentPreferences, onSuccess, onCancel, onError }) {
  const [desiredPositions, setDesiredPositions] = useState(
    currentPreferences?.desired_positions || ['']
  )
  const [contractTypes, setContractTypes] = useState(
    currentPreferences?.contract_types || []
  )
  const [formData, setFormData] = useState({
    contractType: currentPreferences?.contract_type || '',
    desiredLocation: currentPreferences?.desired_location || '',
    preferredLocations: currentPreferences?.preferred_locations || '',
    mobility: currentPreferences?.mobility || '',
    remotePreference: currentPreferences?.remote_preference || 'hybrid',
    willingToRelocate: currentPreferences?.willing_to_relocate || false,
    availability: currentPreferences?.availability || '',
    salaryMin: currentPreferences?.salary_min || '',
    salaryMax: currentPreferences?.salary_max || ''
  })
  const [saving, setSaving] = useState(false)

  const addPosition = () => {
    if (desiredPositions.length < 5) {
      setDesiredPositions([...desiredPositions, ''])
    }
  }

  const removePosition = (index) => {
    if (desiredPositions.length > 1) {
      setDesiredPositions(desiredPositions.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profileId) return

    try {
      setSaving(true)
      const prefs = {
        desired_positions: desiredPositions.filter(p => p.trim()).map(p => p.trim()),
        contract_type: formData.contractType || null,
        contract_types: contractTypes,
        desired_location: formData.desiredLocation || formData.preferredLocations || null,
        preferred_locations: formData.preferredLocations || null,
        mobility: formData.mobility || null,
        remote_preference: formData.remotePreference || null,
        willing_to_relocate: formData.willingToRelocate || false,
        availability: formData.availability || null,
        salary_min: formData.salaryMin || null,
        salary_max: formData.salaryMax || null,
      }
      const data = jobPreferencesToApiPayload(prefs)
      await candidateApi.updateJobPreferences(profileId, data)
      onSuccess()
    } catch (error) {
      console.error('Error updating preferences:', error)
      onError?.('Erreur : ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Poste(s) recherché(s) <span className="text-red-500">*</span> (max 5)</Label>
        {desiredPositions.map((position, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={position}
              onChange={(e) => {
                const updated = [...desiredPositions]
                updated[index] = e.target.value
                setDesiredPositions(updated)
              }}
              required
            />
            {desiredPositions.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => removePosition(index)}
              >
                Supprimer
              </Button>
            )}
          </div>
        ))}
        {desiredPositions.length < 5 && (
          <Button type="button" variant="outline" onClick={addPosition}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un poste
          </Button>
        )}
      </div>

      <div>
        <Label>Type(s) de contrat souhaité(s) *</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {['CDI', 'CDD', 'FREELANCE', 'STAGE', 'ALTERNANCE', 'INTERIM'].map(type => (
            <label
              key={type}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                contractTypes.includes(type)
                  ? 'bg-[#226D68] text-white border-[#226D68]'
                  : 'bg-gray-50 border-gray-200 hover:border-[#226D68]'
              }`}
            >
              <input
                type="checkbox"
                checked={contractTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setContractTypes([...contractTypes, type])
                  } else {
                    setContractTypes(contractTypes.filter(t => t !== type))
                  }
                }}
                className="sr-only"
              />
              <span className="text-sm font-medium">{type}</span>
            </label>
          ))}
        </div>
        {contractTypes.length === 0 && (
          <p className="text-xs text-orange-600 mt-1">Sélectionnez au moins un type de contrat</p>
        )}
      </div>

      <div>
        <Label htmlFor="remotePreference">Préférence télétravail</Label>
        <select
          id="remotePreference"
          value={formData.remotePreference}
          onChange={(e) => setFormData({ ...formData, remotePreference: e.target.value })}
          className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-anthracite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226D68]/30 focus-visible:border-[#226D68]"
        >
          <option value="onsite">Sur site uniquement</option>
          <option value="hybrid">Hybride (présentiel + télétravail)</option>
          <option value="remote">Télétravail complet</option>
          <option value="flexible">Flexible / Indifférent</option>
        </select>
      </div>

      <div>
        <Label htmlFor="preferredLocations">Zones géographiques préférées <span className="text-red-500">*</span></Label>
        <Input
          id="preferredLocations"
          value={formData.preferredLocations}
          onChange={(e) => setFormData({ ...formData, preferredLocations: e.target.value })}
          placeholder="Ex: Abidjan, Bouaké, Télétravail..."
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="willingToRelocate"
          checked={formData.willingToRelocate}
          onChange={(e) => setFormData({ ...formData, willingToRelocate: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="willingToRelocate" className="cursor-pointer font-normal">
          Prêt(e) à déménager pour une opportunité
        </Label>
      </div>

      <div>
        <Label htmlFor="availability">Disponibilité <span className="text-red-500">*</span></Label>
        <select
          id="availability"
          value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-gray-anthracite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#226D68]/30 focus-visible:border-[#226D68]"
          required
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
        <Label>Prétentions salariales <span className="text-red-500">*</span> (CFA/mois)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="salaryMin" className="text-sm font-normal">Minimum (CFA/mois)</Label>
            <Input
              id="salaryMin"
              type="number"
              min="0"
              placeholder="Ex: 250000"
              value={formData.salaryMin}
              onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="salaryMax" className="text-sm font-normal">Maximum (CFA/mois)</Label>
            <Input
              id="salaryMax"
              type="number"
              min="0"
              placeholder="Ex: 500000"
              value={formData.salaryMax}
              onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
              required
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Indiquez la fourchette salariale mensuelle que vous souhaitez (minimum et maximum)
        </p>
      </div>

      <DialogFooter className="pt-4 border-t border-neutral-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="border-neutral-200 text-gray-anthracite hover:bg-[#E8F4F3]">
          Annuler
        </Button>
        <Button type="submit" disabled={saving} className="bg-[#226D68] hover:bg-[#1a5a55] text-white">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export { ExperienceForm, EducationForm, CertificationForm, SkillForm, PreferencesForm }
