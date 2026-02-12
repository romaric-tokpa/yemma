import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  User, Edit, FileText, CheckCircle2, Clock, XCircle, 
  Briefcase, GraduationCap, Award, Code, MapPin, Star,
  Plus, Trash2, Eye, Mail, Phone, Calendar, LogOut,
  Home, Settings, Menu, X, TrendingUp, Users, FileCheck,
  Flag, Download, Image as ImageIcon, Loader2, Upload,
  Wrench, Sparkles, BarChart3
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
import {
  experienceToApiPayload,
  educationToApiPayload,
  skillToApiPayload,
  certificationToApiPayload,
  jobPreferencesToApiPayload,
} from '../utils/profilePayloads'
import { formatDateTime } from '../utils/dateUtils'

// Générer un avatar par défaut basé sur les initiales
const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

// Générer un avatar par défaut pour les logos d'entreprises
const generateCompanyLogoUrl = (companyName) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&size=100&background=random&color=fff&bold=true`
}

export default function CandidateDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
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
  const [activeTab, setActiveTab] = useState('profile')
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
    // Définir l'onglet actif selon l'URL ou le hash
    const hash = location.hash.replace('#', '')
    if (hash && ['profile', 'experiences', 'educations', 'certifications', 'skills', 'preferences', 'documents'].includes(hash)) {
      setActiveTab(hash)
    } else {
      setActiveTab('profile') // Par défaut, afficher le profil
    }
  }, [location])

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
      } catch {
        setCurrentPhotoUrl(null)
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
          console.error('Error loading documents:', docErr)
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
      setToast({ message: 'Erreur lors du chargement du profil.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    if (!profile?.id) return
    try {
      const docs = await documentApi.getCandidateDocuments(profile.id)
      setDocuments(docs || [])
    } catch (error) {
      console.error('Error loading documents:', error)
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

  // Navigation principale : 7 sections (sidebar = menu compte)
  const navItems = [
    { id: 'profile', label: 'Identité', icon: User },
    { id: 'experiences', label: 'Expériences', icon: Briefcase, count: experiences.length },
    { id: 'educations', label: 'Formations', icon: GraduationCap, count: educations.length },
    { id: 'certifications', label: 'Certifications', icon: Award, count: certifications.length },
    { id: 'skills', label: 'Compétences', icon: Code, count: skills.length },
    { id: 'preferences', label: 'Recherche', icon: MapPin },
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
  ]

  return (
    <div className="h-screen bg-gray-light flex overflow-hidden max-h-[100dvh] max-h-screen safe-top safe-bottom">
      <a href="#dashboard-main" className="absolute left-[-9999px] top-2 z-[100] px-3 py-2 bg-primary text-white rounded-md font-medium text-sm focus:left-2 focus:inline-block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
        Aller au contenu principal
      </a>
      {/* Sidebar compacte et professionnelle */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-card border-r border-border shadow-xl lg:shadow-none
        transition-[transform,width] duration-300 ease-out
        flex flex-col safe-left
        ${sidebarOpen
          ? 'w-[min(240px,75vw)] sm:w-56 translate-x-0 lg:w-56'
          : 'w-0 -translate-x-full lg:translate-x-0 lg:w-16 lg:min-w-[4rem]'
        }
      `}
        aria-label="Menu principal"
        aria-hidden={!sidebarOpen}
      >
        {/* Header Sidebar compact */}
        <div className="h-12 border-b border-border flex items-center justify-between px-3 shrink-0 safe-top bg-[#E8F4F3]/30">
          <div className={`flex items-center ${sidebarOpen ? 'gap-2' : 'justify-center w-full'}`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#226D68] shrink-0">
              <Users className="w-3.5 h-3.5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-sm text-gray-900">Yemma</span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="h-7 w-7 shrink-0 hover:bg-muted"
            title={sidebarOpen ? 'Réduire' : 'Agrandir'}
          >
            {sidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          </Button>
        </div>

        {/* Espace flexible */}
        <div className="flex-1" />

        {/* Footer Sidebar compact */}
        <div className="border-t border-border p-2 space-y-1.5 shrink-0 safe-bottom">
          <div className={`flex items-center ${sidebarOpen ? 'gap-2' : 'justify-center'} p-1.5 rounded-lg hover:bg-muted/50 transition-colors`}>
            <div className="relative shrink-0">
              <img
                src={displayPhoto}
                alt={`Photo de profil de ${fullName}`}
                className="w-8 h-8 rounded-lg object-cover border border-border"
                onError={(e) => {
                  if (!photoError && e.target.src !== defaultAvatar) {
                    setPhotoError(true)
                    e.target.src = defaultAvatar
                  } else if (e.target.src !== defaultAvatar) {
                    e.target.src = defaultAvatar
                  }
                }}
                onLoad={() => {
                  if (photoError && currentPhotoUrl) {
                    setPhotoError(false)
                  }
                }}
              />
              {profile?.status && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card"
                  style={{ 
                    backgroundColor: profile.status === 'VALIDATED' ? '#22c55e' : 
                                  profile.status === 'REJECTED' ? '#ef4444' : 
                                  profile.status === 'IN_REVIEW' ? '#f59e0b' : '#94a3b8'
                  }}
                />
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-gray-900">{fullName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'} text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs px-2`}
            onClick={handleLogout}
            title={!sidebarOpen ? 'Déconnexion' : ''}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {sidebarOpen && <span className="ml-1.5">Déconnexion</span>}
          </Button>
        </div>
      </aside>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main id="dashboard-main" className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-light min-w-0" aria-label="Contenu du profil">
        <div className="container mx-auto px-4 py-3 sm:px-5 md:px-6 lg:px-8 max-w-7xl safe-x">
          {/* Alerte statut IN_REVIEW compacte */}
          {profile?.status === 'IN_REVIEW' && (
            <div className="mb-3 rounded-lg border-l-3 border-l-amber-500 bg-amber-50/80 p-2.5 flex items-start gap-2" role="status">
              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-900 text-xs mb-0.5">Profil en cours de validation</p>
                <p className="text-[10px] text-amber-800">Notre équipe examine votre dossier. Vous serez contacté prochainement.</p>
              </div>
            </div>
          )}

          {/* Header principal compact */}
          <div className="mb-3">
            <Card className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              {/* Bandeau de statut */}
              <div 
                className="h-0.5"
                style={{
                  backgroundColor: profile?.status === 'VALIDATED' ? '#22c55e' : 
                                  profile?.status === 'REJECTED' ? '#ef4444' : 
                                  profile?.status === 'IN_REVIEW' ? '#f59e0b' : '#94a3b8'
                }}
              />
              
              <CardContent className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Informations candidat compactes */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={displayPhoto}
                        alt={`Photo de profil de ${fullName}`}
                        className="w-12 h-12 rounded-lg object-cover border-2"
                        style={{ borderColor: 'rgba(34, 109, 104, 0.2)' }}
                        onError={(e) => {
                          if (!photoError && e.target.src !== defaultAvatar) {
                            setPhotoError(true)
                            e.target.src = defaultAvatar
                          } else if (e.target.src !== defaultAvatar) {
                            e.target.src = defaultAvatar
                          }
                        }}
                        onLoad={() => {
                          if (photoError && currentPhotoUrl) {
                            setPhotoError(false)
                          }
                        }}
                      />
                      {profile?.status && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card"
                          style={{ 
                            backgroundColor: profile.status === 'VALIDATED' ? '#22c55e' : 
                                          profile.status === 'REJECTED' ? '#ef4444' : 
                                          profile.status === 'IN_REVIEW' ? '#f59e0b' : '#94a3b8'
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h1 className="text-base font-semibold text-gray-900 truncate">{fullName}</h1>
                        {getStatusBadge(profile.status)}
                      </div>
                      {profile.profile_title && (
                        <p className="text-xs text-gray-700 font-medium mb-0.5 truncate">{profile.profile_title}</p>
                      )}
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground">
                        {profile.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-2.5 w-2.5" />
                            <span className="truncate">{profile.email}</span>
                          </span>
                        )}
                        {profile.phone && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />
                              <span>{profile.phone}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions compactes */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {profile.status === 'DRAFT' && (
                      <Button 
                        size="sm"
                        className="text-white h-8 px-3 text-xs flex items-center gap-1.5 bg-[#226D68] hover:bg-[#1a5a55] shadow-sm"
                        onClick={() => setShowSubmitConsentModal(true)}
                        disabled={!canSubmit}
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Soumettre</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (completionPercentage < 100 && profile.status === 'DRAFT') {
                          setShowCompletionGuide(true)
                        } else {
                          navigate('/profile/edit')
                        }
                      }}
                      className="h-8 px-3 text-xs border hover:bg-muted"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </div>

                {/* Barre de progression compacte */}
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-[#226D68]" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Complétion</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#226D68]">{Math.round(completionPercentage)}%</span>
                      {canSubmit && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={completionPercentage} 
                    className="h-2 rounded-full bg-muted"
                  />
                  {!canSubmit && profile.status === 'DRAFT' && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      <span>Complétez à 80% minimum pour soumettre</span>
                    </p>
                  )}
                  {/* Guide de complétion (affiché quand < 100%, au clic sur Modifier) */}
                  {completionPercentage < 100 && profile.status === 'DRAFT' && (
                    <div ref={completionGuideRef} className="mt-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between h-7 text-[10px] text-muted-foreground hover:text-[#226D68] hover:bg-[#E8F4F3]/50"
                        onClick={() => setShowCompletionGuide(!showCompletionGuide)}
                      >
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Comment compléter mon profil à 100 % ?
                        </span>
                        <span className="text-muted-foreground">{showCompletionGuide ? '−' : '+'}</span>
                      </Button>
                      {showCompletionGuide && (
                        <div className="mt-1.5 p-2.5 rounded-lg bg-[#E8F4F3]/40 border border-[#226D68]/20 text-[11px] space-y-2">
                          <p className="font-semibold text-[#226D68]">Pour soumettre :</p>
                          <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                            <li>Profil ≥ 80 %, CV uploadé, cases CGU/RGPD cochées</li>
                            <li>Au moins 1 expérience, 1 formation, 1 compétence technique</li>
                          </ul>
                          <p className="font-semibold text-[#226D68] pt-1">Où remplir :</p>
                          <ul className="list-disc list-inside space-y-0.5 text-gray-700">
                            <li>Identité : nom, email, téléphone, adresse</li>
                            <li>Profil pro : titre, résumé (≥ 300 caractères), secteur, métier</li>
                            <li>Expériences, Formations, Compétences</li>
                            <li>Documents : CV · Recherche : type de contrat, disponibilité</li>
                          </ul>
                          <p className="text-[10px] text-muted-foreground pt-1">
                            Soumis → un admin Yemma vous contactera pour un entretien.
                          </p>
                          <Button
                            size="sm"
                            className="mt-1.5 h-7 text-xs bg-[#226D68] hover:bg-[#1a5a55] text-white"
                            onClick={() => {
                              setShowCompletionGuide(false)
                              navigate('/profile/edit')
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier mon profil
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Barre d'onglets compacte */}
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); navigate({ hash: `#${value}` }) }} className="w-full">
            <TabsList className="w-full justify-start h-auto p-0.5 bg-[#E8F4F3]/30 border border-border rounded-lg overflow-x-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all hover:bg-muted data-[state=active]:hover:bg-[#1a5a55]"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.count != null && item.count > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="ml-1 h-4 px-1 text-[10px] font-medium data-[state=active]:bg-white/20 data-[state=active]:text-white"
                      >
                        {item.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>

              {/* Contenu des onglets */}
              <TabsContent value="profile" className="mt-3">
                <Card className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b border-border/50 py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                        <div className="p-1 bg-[#226D68] rounded">
                          <User className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span>Identité</span>
                      </CardTitle>
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (completionPercentage < 100 && profile.status === 'DRAFT') {
                            setShowCompletionGuide(true)
                          } else {
                            navigate('/profile/edit')
                          }
                        }}
                        className="h-7 px-2.5 text-xs hover:bg-[#E8F4F3] hover:text-[#226D68]"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2.5">
                    <div className="space-y-2.5">
                      {/* Photo de profil et informations principales */}
                      <div className="flex flex-col sm:flex-row gap-2.5 items-start pb-2.5 border-b border-[#E8F4F3]">
                        <div className="relative group self-center sm:self-start">
                          <span className="sr-only">Photo de profil</span>
                          <img
                            src={displayPhoto}
                            alt={`Photo de profil de ${fullName}`}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 flex-shrink-0 shadow-sm"
                            style={{ borderColor: 'rgba(34, 109, 104, 0.3)' }}
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
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5 truncate">{fullName}</h3>
                          {profile.profile_title && (
                            <p className="text-xs font-medium text-[#226D68] mb-1.5 truncate">{profile.profile_title}</p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1.5 justify-center sm:justify-start">
                            {profile.email && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-600 justify-center sm:justify-start">
                                <Mail className="h-3 w-3 text-[#226D68] flex-shrink-0" />
                                <span className="truncate">{profile.email}</span>
                              </div>
                            )}
                            {profile.phone && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-600 justify-center sm:justify-start">
                                <Phone className="h-3 w-3 text-[#226D68] flex-shrink-0" />
                                <span className="truncate">{profile.phone}</span>
                              </div>
                            )}
                            {(profile.city || profile.country) && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-600 justify-center sm:justify-start">
                                <MapPin className="h-3 w-3 text-[#226D68] flex-shrink-0" />
                                <span className="truncate">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Informations détaillées - Design compact avec cartes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {profile.date_of_birth && (
                          <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 p-2">
                            <div className="flex items-center gap-1.5">
                              <div className="p-0.5 bg-[#226D68] rounded">
                                <Calendar className="h-2.5 w-2.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-medium">Date de naissance</p>
                                <p className="text-xs font-semibold text-gray-900 truncate">{new Date(profile.date_of_birth).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </Card>
                        )}
                        {profile.nationality && (
                          <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 p-2">
                            <div className="flex items-center gap-1.5">
                              <div className="p-0.5 bg-[#226D68] rounded">
                                <Flag className="h-2.5 w-2.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-medium">Nationalité</p>
                                <p className="text-xs font-semibold text-gray-900 truncate">{profile.nationality}</p>
                              </div>
                            </div>
                          </Card>
                        )}
                        {profile.sector && (
                          <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 p-2">
                            <div className="flex items-center gap-1.5">
                              <div className="p-0.5 bg-[#226D68] rounded">
                                <Briefcase className="h-2.5 w-2.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-medium">Secteur d'activité</p>
                                <p className="text-xs font-semibold text-gray-900 truncate">{profile.sector}</p>
                              </div>
                            </div>
                          </Card>
                        )}
                        {profile.main_job && (
                          <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 p-2">
                            <div className="flex items-center gap-1.5">
                              <div className="p-0.5 bg-[#226D68] rounded">
                                <Briefcase className="h-2.5 w-2.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-medium">Métier principal</p>
                                <p className="text-xs font-semibold text-gray-900 truncate">{profile.main_job}</p>
                              </div>
                            </div>
                          </Card>
                        )}
                        {profile.total_experience !== undefined && (
                          <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 p-2">
                            <div className="flex items-center gap-1.5">
                              <div className="p-0.5 bg-[#226D68] rounded">
                                <TrendingUp className="h-2.5 w-2.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-medium">Expérience</p>
                                <p className="text-xs font-semibold text-gray-900">{profile.total_experience} an{profile.total_experience > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>

                      {/* Résumé professionnel */}
                      {profile.professional_summary && (
                        <div className="pt-2 border-t border-[#E8F4F3]">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="p-0.5 bg-[#226D68] rounded">
                              <FileText className="h-2.5 w-2.5 text-white" />
                            </div>
                            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                              Résumé professionnel
                            </h4>
                          </div>
                          <div 
                            className="text-xs text-gray-700 leading-relaxed rich-text-content"
                            dangerouslySetInnerHTML={{ __html: profile.professional_summary }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experiences" className="mt-3">
                <Card className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b border-border/50 py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                        <div className="p-1 bg-[#226D68] rounded">
                          <Briefcase className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span>Expériences</span>
                        {experiences.length > 0 && (
                          <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px] font-medium bg-[#E8F4F3] text-[#226D68]">
                            {experiences.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setEditingExperience(null)
                          setShowExperienceDialog(true)
                        }}
                        className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                    <CardContent className="p-3">
                      {experiences.length > 0 ? (
                        <div className="space-y-2.5">
                          {experiences.map((exp, index) => {
                            const defaultCompanyLogo = generateCompanyLogoUrl(exp.company_name)
                            const displayCompanyLogo = exp.company_logo_url || defaultCompanyLogo
                            
                            return (
                              <Card key={exp.id} className="rounded-lg border border-border hover:border-[#226D68]/50 hover:shadow-md transition-all border-l-3 border-l-[#226D68] group bg-gradient-to-r from-white to-[#E8F4F3]/20">
                                <CardContent className="p-2.5">
                                  <div className="flex gap-2.5 items-start">
                                    {/* Logo entreprise */}
                                    <div className="relative shrink-0">
                                      <img
                                        src={displayCompanyLogo}
                                        alt={`Logo de ${exp.company_name}`}
                                        className="w-10 h-10 rounded-lg object-cover border-2 border-[#E8F4F3] shadow-sm"
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
                                      {/* En-tête avec titre et actions */}
                                      <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-xs text-gray-900 truncate mb-0.5 leading-tight">{exp.position}</h4>
                                          <p className="text-xs font-semibold text-[#226D68] truncate mb-1">{exp.company_name}</p>
                                          
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
                                        
                                        {/* Actions */}
                                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setEditingExperience(exp)
                                              setShowExperienceDialog(true)
                                            }}
                                            className="h-6 w-6 p-0 hover:bg-[#E8F4F3]"
                                            title="Modifier"
                                          >
                                            <Edit className="h-3 w-3 text-[#226D68]" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteExperience(exp.id)}
                                            className="h-6 w-6 p-0 hover:bg-red-50"
                                            title="Supprimer"
                                          >
                                            <Trash2 className="h-3 w-3 text-red-500" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Description */}
                                      {exp.description && (
                                        <div className="mt-2 pt-2 border-t border-[#E8F4F3]">
                                          <div className="flex items-center gap-1 mb-1">
                                            <div className="w-1 h-1 rounded-full bg-[#226D68]"></div>
                                            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Description</p>
                                          </div>
                                          <div 
                                            className="text-xs text-gray-700 rich-text-content leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: exp.description }}
                                          />
                                        </div>
                                      )}

                                      {/* Réalisations */}
                                      {exp.achievements && (
                                        <div className="mt-2 pt-2 border-t border-[#E8F4F3]">
                                          <div className="flex items-center gap-1 mb-1">
                                            <div className="w-1 h-1 rounded-full bg-[#226D68]"></div>
                                            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Réalisations</p>
                                          </div>
                                          <div 
                                            className="text-xs text-gray-700 rich-text-content leading-relaxed"
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
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/30">
                          <div className="p-2 bg-[#E8F4F3] rounded-full mb-2">
                            <Briefcase className="h-5 w-5 text-[#226D68]" />
                          </div>
                          <p className="text-xs font-semibold text-gray-900 mb-0.5">Aucune expérience</p>
                          <p className="text-[10px] text-muted-foreground mb-3 max-w-xs">Au moins une expérience requise pour soumettre</p>
                          <Button 
                            size="sm"
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs"
                            onClick={() => setShowExperienceDialog(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter une expérience
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="educations" className="mt-4">
                <Card className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b border-border/50 py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                        <div className="p-1 bg-[#226D68] rounded">
                          <GraduationCap className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span>Formations & Diplômes</span>
                        {educations.length > 0 && (
                          <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px] font-medium">
                            {educations.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setEditingEducation(null)
                          setShowEducationDialog(true)
                        }}
                        className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    {educations.length > 0 ? (
                      <div className="space-y-2">
                        {[...educations]
                          .sort((a, b) => (b.graduation_year || 0) - (a.graduation_year || 0))
                          .map((edu) => {
                            const duration = edu.start_year && edu.graduation_year 
                              ? edu.graduation_year - edu.start_year 
                              : null
                            
                            return (
                              <Card 
                                key={edu.id} 
                                className="rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all border-l-3 border-l-[#226D68] group"
                              >
                                <CardContent className="p-2.5">
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#226D68] to-[#1a5a55] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                          <GraduationCap className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-xs text-gray-900 mb-0.5 group-hover:text-[#226D68] transition-colors truncate">
                                            {edu.diploma}
                                          </h4>
                                          <p className="text-xs font-medium text-gray-700 truncate mb-1">{edu.institution}</p>
                                          
                                          {/* Métadonnées compactes */}
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            {edu.level && (
                                              <Badge 
                                                variant="secondary" 
                                                className="bg-[#E8F4F3] text-[#1a5a55] border-[#B8DDD9] text-[10px] font-medium px-1.5 py-0 h-4"
                                              >
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
                                                {edu.start_year 
                                                  ? `${edu.start_year} - ${edu.graduation_year}` 
                                                  : edu.graduation_year}
                                              </span>
                                              {duration && duration > 0 && (
                                                <span className="text-muted-foreground">• {duration} an{duration > 1 ? 's' : ''}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Actions compactes */}
                                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingEducation(edu)
                                          setShowEducationDialog(true)
                                        }}
                                        className="h-6 w-6 p-0 hover:bg-[#E8F4F3]"
                                      >
                                        <Edit className="h-3 w-3 text-[#226D68]" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleDeleteEducation(edu.id)}
                                        className="h-6 w-6 p-0 hover:bg-red-50" 
                                      >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-border bg-[#E8F4F3]/30">
                        <div className="p-2 bg-[#E8F4F3] rounded-full mb-2">
                          <GraduationCap className="h-5 w-5 text-[#226D68]" />
                        </div>
                        <h3 className="text-xs font-semibold text-gray-900 mb-0.5">Aucune formation</h3>
                        <p className="text-[10px] text-muted-foreground mb-3 max-w-xs">
                          Au moins une formation requise pour soumettre
                        </p>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setEditingEducation(null)
                            setShowEducationDialog(true)
                          }}
                          className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-8 px-3 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Ajouter une formation
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications" className="mt-3">
                <Card className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b border-border/50 py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                        <div className="p-1 bg-[#226D68] rounded">
                          <Award className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span>Certifications</span>
                        {certifications.length > 0 && (
                          <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px] font-medium bg-[#E8F4F3] text-[#226D68]">
                            {certifications.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setEditingCertification(null)
                          setShowCertificationDialog(true)
                        }}
                        className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                    <CardContent className="p-2.5">
                      {certifications.length > 0 ? (
                        <div className="space-y-2">
                          {certifications.map((cert) => (
                            <Card key={cert.id} className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all group">
                              <CardContent className="p-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2">
                                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#226D68] to-[#1a5a55] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                        <Award className="h-3 w-3 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-xs text-gray-900 truncate mb-0.5 group-hover:text-[#226D68] transition-colors">{cert.title}</h4>
                                        <p className="text-[10px] font-medium text-gray-700 truncate mb-1">{cert.issuer}</p>
                                        
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
                                  
                                  {/* Actions */}
                                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCertification(cert)
                                        setShowCertificationDialog(true)
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-[#E8F4F3]"
                                      title="Modifier"
                                    >
                                      <Edit className="h-3 w-3 text-[#226D68]" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDeleteCertification(cert.id)}
                                      className="h-6 w-6 p-0 hover:bg-red-50"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/30">
                          <div className="p-2 bg-[#E8F4F3] rounded-full mb-2">
                            <Award className="h-5 w-5 text-[#226D68]" />
                          </div>
                          <p className="text-xs font-semibold text-gray-900 mb-0.5">Aucune certification</p>
                          <p className="text-[10px] text-muted-foreground mb-3 max-w-xs">Optionnel</p>
                          <Button 
                            size="sm"
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs"
                            onClick={() => setShowCertificationDialog(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter une certification
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="skills" className="mt-3">
                {/* Header compact */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5 text-[#226D68]" />
                    Mes Compétences
                  </h2>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setEditingSkill(null)
                      setShowSkillDialog(true)
                    }}
                    className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs shrink-0"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </div>

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
                      <Card className="rounded-lg border-2 border-dashed border-border bg-[#E8F4F3]/30">
                        <CardContent className="p-8">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="p-2 bg-[#E8F4F3] rounded-full mb-2">
                              <Code className="h-5 w-5 text-[#226D68]" />
                            </div>
                            <p className="text-xs font-semibold text-gray-900 mb-0.5">
                              Aucune compétence
                            </p>
                            <p className="text-[10px] text-muted-foreground mb-3 max-w-xs">
                              Au moins une compétence technique requise pour soumettre
                            </p>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setEditingSkill(null)
                                setShowSkillDialog(true)
                              }}
                              className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Ajouter ma première compétence
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }
                  
                  return (
                    <div className="space-y-2.5">
                      {/* Compétences Techniques */}
                      {technicalSkills.length > 0 && (
                        <Card className="rounded-lg border border-border border-l-3 border-l-[#226D68] bg-card shadow-sm">
                          <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b py-2 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-[#226D68] rounded">
                                  <Code className="h-3 w-3 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-xs font-semibold text-gray-900">
                                    Compétences techniques
                                  </CardTitle>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {technicalSkills.length} compétence{technicalSkills.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {technicalSkills.map((skill) => {
                                const levelColors = getLevelColor(skill.level || 'BEGINNER')
                                return (
                                  <div
                                    key={skill.id}
                                    className="group relative bg-card border border-border rounded-lg p-2 hover:border-[#226D68] hover:shadow-sm transition-all duration-200"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-xs text-gray-900 truncate mb-1">
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
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-[#E8F4F3]"
                                          onClick={() => {
                                            setEditingSkill(skill)
                                            setShowSkillDialog(true)
                                          }}
                                        >
                                          <Edit className="h-3 w-3 text-[#226D68]" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 w-6 p-0 hover:bg-red-50" 
                                          onClick={() => handleDeleteSkill(skill.id)}
                                        >
                                          <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Soft Skills */}
                      {softSkills.length > 0 && (
                        <Card className="rounded-lg border border-border border-l-3 border-l-[#226D68] bg-card shadow-sm">
                          <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b py-2 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-[#226D68] rounded">
                                  <Sparkles className="h-3 w-3 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-xs font-semibold text-gray-900">
                                    Soft Skills
                                  </CardTitle>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {softSkills.length} compétence{softSkills.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {softSkills.map((skill) => (
                                <div
                                  key={skill.id}
                                  className="group relative bg-gradient-to-br from-[#E8F4F3] to-white border border-[#B8DDD9] rounded-lg px-2 py-1.5 hover:border-[#226D68] hover:shadow-sm transition-all duration-200 flex items-center gap-1.5"
                                >
                                  <Sparkles className="h-3 w-3 text-[#226D68] shrink-0" />
                                  <span className="font-medium text-xs text-gray-900">
                                    {skill.name}
                                  </span>
                                  <div className="flex items-center gap-0.5 ml-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 hover:bg-[#E8F4F3]"
                                      onClick={() => {
                                        setEditingSkill(skill)
                                        setShowSkillDialog(true)
                                      }}
                                    >
                                      <Edit className="h-2.5 w-2.5 text-[#226D68]" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-5 w-5 p-0 hover:bg-red-50" 
                                      onClick={() => handleDeleteSkill(skill.id)}
                                    >
                                      <Trash2 className="h-2.5 w-2.5 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Outils & Logiciels */}
                      {toolSkills.length > 0 && (
                        <Card className="rounded-lg border border-border border-l-3 border-l-[#226D68] bg-card shadow-sm">
                          <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b py-2 px-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 bg-[#226D68] rounded">
                                  <Wrench className="h-3 w-3 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-xs font-semibold text-gray-900">
                                    Outils & Logiciels
                                  </CardTitle>
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {toolSkills.length} outil{toolSkills.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-2.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {toolSkills.map((skill) => {
                                const levelColors = getLevelColor(skill.level || 'BEGINNER')
                                return (
                                  <div
                                    key={skill.id}
                                    className="group relative bg-card border border-border rounded-lg p-2 hover:border-purple-300 hover:shadow-sm transition-all duration-200"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-xs text-gray-900 truncate mb-1">
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
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-purple-50"
                                          onClick={() => {
                                            setEditingSkill(skill)
                                            setShowSkillDialog(true)
                                          }}
                                        >
                                          <Edit className="h-3 w-3 text-purple-600" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 w-6 p-0 hover:bg-red-50" 
                                          onClick={() => handleDeleteSkill(skill.id)}
                                        >
                                          <Trash2 className="h-3 w-3 text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )
                })()}
              </TabsContent>

              <TabsContent value="preferences" className="mt-3">
                <Card className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b border-border/50 py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                        <div className="p-1 bg-[#226D68] rounded">
                          <MapPin className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span>Recherche d'emploi</span>
                      </CardTitle>
                      <Button 
                        size="sm"
                        onClick={() => setShowPreferencesDialog(true)}
                        className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Edit className="h-3 w-3" />
                        Modifier
                      </Button>
                    </div>
                  </CardHeader>
                    <CardContent className="p-2.5">
                      {jobPreferences ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {/* Postes recherchés */}
                          {jobPreferences.desired_positions?.length > 0 && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
                                <div className="flex items-center gap-1 mb-1.5">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <Briefcase className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Postes recherchés</p>
                                </div>
                                <div className="flex flex-wrap gap-0.5">
                                  {jobPreferences.desired_positions.map((pos, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium">
                                      {pos}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Types de contrat */}
                          {(jobPreferences.contract_types?.length > 0 || jobPreferences.contract_type) && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
                                <div className="flex items-center gap-1 mb-1.5">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <FileText className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Type(s) de contrat</p>
                                </div>
                                <div className="flex flex-wrap gap-0.5">
                                  {jobPreferences.contract_types?.length > 0
                                    ? jobPreferences.contract_types.map((type, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium">
                                          {type}
                                        </Badge>
                                      ))
                                    : <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-[#226D68]/10 text-[#226D68] border border-[#226D68]/20 font-medium">
                                          {jobPreferences.contract_type}
                                        </Badge>
                                  }
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Secteurs ciblés */}
                          {jobPreferences.target_sectors?.length > 0 && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
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
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Localisation souhaitée */}
                          {jobPreferences.desired_location && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Localisation</p>
                                </div>
                                <p className="font-semibold text-[10px] text-gray-900 leading-tight">{jobPreferences.desired_location}</p>
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Mobilité */}
                          {jobPreferences.mobility && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Mobilité</p>
                                </div>
                                <p className="font-semibold text-[10px] text-gray-900 leading-tight">{jobPreferences.mobility}</p>
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Disponibilité */}
                          {jobPreferences.availability && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
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
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Télétravail */}
                          {jobPreferences.remote_preference && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
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
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Zones préférées */}
                          {jobPreferences.preferred_locations && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Zones préférées</p>
                                </div>
                                <p className="font-semibold text-[10px] text-gray-900 leading-tight">{jobPreferences.preferred_locations}</p>
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Prêt à déménager */}
                          {jobPreferences.willing_to_relocate && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all">
                              <CardContent className="p-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <MapPin className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Mobilité</p>
                                </div>
                                <p className="font-semibold text-[10px] text-[#226D68] leading-tight">Prêt(e) à déménager</p>
                              </CardContent>
                            </Card>
                          )}
                          
                          {/* Prétentions salariales */}
                          {(jobPreferences.salary_min || jobPreferences.salary_max) && (
                            <Card className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-[#226D68]/5 to-[#E8F4F3]/20 hover:shadow-sm transition-all sm:col-span-2 lg:col-span-3">
                              <CardContent className="p-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <div className="p-0.5 bg-[#226D68] rounded">
                                    <TrendingUp className="h-2.5 w-2.5 text-white" />
                                  </div>
                                  <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Prétentions salariales</p>
                                </div>
                                <p className="font-bold text-xs text-[#226D68]">
                                  {jobPreferences.salary_min && jobPreferences.salary_max
                                    ? `${jobPreferences.salary_min.toLocaleString('fr-FR')} - ${jobPreferences.salary_max.toLocaleString('fr-FR')} CFA/mois`
                                    : jobPreferences.salary_min
                                    ? `${jobPreferences.salary_min.toLocaleString('fr-FR')} CFA/mois`
                                    : `${jobPreferences.salary_max.toLocaleString('fr-FR')} CFA/mois`}
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-border bg-[#E8F4F3]/30">
                          <div className="p-2 bg-[#E8F4F3] rounded-full mb-2">
                            <MapPin className="h-5 w-5 text-[#226D68]" />
                          </div>
                          <p className="text-xs font-semibold text-gray-900 mb-0.5">Recherche non renseignée</p>
                          <p className="text-[10px] text-muted-foreground mb-3 max-w-xs">Poste souhaité, type de contrat, disponibilité</p>
                          <Button 
                            size="sm"
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs"
                            onClick={() => setShowPreferencesDialog(true)}
                          >
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            Remplir la recherche
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>

              {/* Onglet Documents */}
              <TabsContent value="documents" className="mt-3">
                <Card className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#E8F4F3]/50 to-transparent border-b border-border/50 py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                        <div className="p-1 bg-[#226D68] rounded">
                          <FileText className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span>Documents</span>
                        {documents.length > 0 && (
                          <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px] font-medium">
                            {documents.length}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        onClick={() => setShowDocumentDialog(true)}
                        size="sm"
                        className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2.5">
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
                        <div className="space-y-2">
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
                              <Card key={doc.id} className="rounded-lg border border-border border-l-2 border-l-[#226D68] bg-gradient-to-r from-white to-[#E8F4F3]/20 hover:shadow-sm transition-all group">
                                <CardContent className="p-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#226D68] to-[#1a5a55] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                          <FileText className="h-3 w-3 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                            <h4 className="font-semibold text-xs text-gray-900 truncate group-hover:text-[#226D68] transition-colors">{doc.original_filename}</h4>
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
                                    
                                    {/* Actions compactes */}
                                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleViewDocument} 
                                        className="h-6 w-6 p-0 hover:bg-[#E8F4F3]"
                                        title="Voir"
                                      >
                                        <Eye className="h-3 w-3 text-[#226D68]" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleDownloadDocument} 
                                        className="h-6 w-6 p-0 hover:bg-[#E8F4F3]"
                                        title="Télécharger"
                                      >
                                        <Download className="h-3 w-3 text-[#226D68]" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleDeleteDocument} 
                                        className="h-6 w-6 p-0 hover:bg-red-50"
                                        title="Supprimer"
                                      >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-[#E8F4F3] bg-[#E8F4F3]/30">
                          <div className="p-2 bg-[#E8F4F3] rounded-full mb-2">
                            <FileText className="h-5 w-5 text-[#226D68]" />
                          </div>
                          <p className="text-xs font-semibold text-gray-900 mb-0.5">Aucun document</p>
                          <p className="text-[10px] text-muted-foreground mb-3 max-w-xs">CV obligatoire pour soumettre · PDF ou DOCX</p>
                          <Button 
                            size="sm"
                            className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2.5 text-xs"
                            onClick={() => setShowDocumentDialog(true)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter un document
                          </Button>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Annuler</Button>
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
        <DialogContent className="max-w-md rounded-[12px] border border-border border-l-4 border-l-primary shadow-xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-semibold text-gray-anthracite flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Accepter les conditions
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
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
            <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
              <Checkbox checked={consentAccepted} onCheckedChange={(v) => setConsentAccepted(!!v)} className="mt-0.5" />
              <span className="text-sm text-gray-anthracite">
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
            <Button variant="outline" onClick={() => { setShowSubmitConsentModal(false); setConsentAccepted(false); setSubmitError(null); }} disabled={submittingProfile}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExperience ? 'Modifier l\'expérience professionnelle' : 'Ajouter une expérience professionnelle'}</DialogTitle>
            <DialogDescription>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEducation ? 'Modifier la formation' : 'Ajouter une formation'}</DialogTitle>
            <DialogDescription>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCertification ? 'Modifier la certification' : 'Ajouter une certification'}</DialogTitle>
            <DialogDescription>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSkill ? 'Modifier la compétence' : 'Ajouter une compétence'}</DialogTitle>
            <DialogDescription>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les préférences</DialogTitle>
            <DialogDescription>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
            <DialogDescription>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowDocumentDialog(false)
                setSelectedDocumentFile(null)
                setSelectedDocumentType('CV')
              }}
              disabled={uploadingDocument}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={handleDocumentUpload}
              disabled={!selectedDocumentFile || uploadingDocument}
              className="bg-primary hover:bg-primary/90"
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {previewDocument?.original_filename || 'Document'}
            </DialogTitle>
            <DialogDescription>
              Prévisualisation du document
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-[60vh] bg-gray-100 rounded-lg overflow-hidden">
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
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowPreviewDialog(false)}
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
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
          <Input
            id="level"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            placeholder="Bac, Bac+2, Bac+5, etc."
            required
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
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
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
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
            value={formData.skillType}
            onChange={(e) => setFormData({ ...formData, skillType: e.target.value, level: e.target.value === 'SOFT' ? null : formData.level })}
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
                value={formData.level}
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
      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="w-full sm:w-auto">
          Annuler
        </Button>
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
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
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export { ExperienceForm, EducationForm, CertificationForm, SkillForm, PreferencesForm }
