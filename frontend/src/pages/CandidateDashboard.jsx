import { useState, useEffect } from 'react'
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
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { RichTextEditor } from '../components/ui/rich-text-editor'

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
  const [activeTab, setActiveTab] = useState('overview')
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

  // Debug: vérifier la photo_url
  useEffect(() => {
    if (profile?.photo_url) {
      console.log('Photo URL:', profile.photo_url)
    }
  }, [profile?.photo_url])

  // Gérer l'affichage de la photo avec fallback - DOIT être avant les returns conditionnels
  const [photoError, setPhotoError] = useState(false)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null)
  
  // Si photo_url change, réinitialiser l'erreur et construire l'URL complète si nécessaire
  useEffect(() => {
    const loadPhotoUrl = async () => {
      if (!profile?.id) {
        setCurrentPhotoUrl(null)
        return
      }

      // D'abord, essayer d'utiliser photo_url du profil
      if (profile.photo_url) {
        let photoUrl = profile.photo_url
        console.log('Processing photo_url from profile:', photoUrl)
        
        // Si c'est une URL relative (commence par /), construire l'URL complète
        if (photoUrl && photoUrl.startsWith('/')) {
          // Extraire l'ID du document depuis l'URL relative
          const match = photoUrl.match(/\/api\/v1\/documents\/serve\/(\d+)/)
          if (match && match[1]) {
            const documentId = parseInt(match[1])
            photoUrl = documentApi.getDocumentServeUrl(documentId)
            console.log('Converted relative URL to full URL:', photoUrl, 'Document ID:', documentId)
          }
        }
        
        // Vérifier que ce n'est pas déjà l'URL de l'avatar
        if (photoUrl && !photoUrl.includes('ui-avatars.com') && photoUrl.trim() !== '') {
          console.log('Setting photo URL from profile.photo_url:', photoUrl)
          setCurrentPhotoUrl(photoUrl)
          setPhotoError(false)
          return
        }
      }

      // Si photo_url n'existe pas ou est invalide, chercher le document PROFILE_PHOTO
      console.log('photo_url not found or invalid, searching for PROFILE_PHOTO document...')
      try {
        const docs = await documentApi.getCandidateDocuments(profile.id)
        const photoDoc = docs
          .filter(doc => 
            (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER') &&
            !doc.deleted_at
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        
        if (photoDoc) {
          const serveUrl = documentApi.getDocumentServeUrl(photoDoc.id)
          console.log('Found PROFILE_PHOTO document, using serve URL:', serveUrl)
          setCurrentPhotoUrl(serveUrl)
          setPhotoError(false)
          
          // Mettre à jour le profil avec cette URL si elle n'était pas déjà là
          if (!profile.photo_url || profile.photo_url !== serveUrl) {
            await candidateApi.updateProfile(profile.id, { photo_url: serveUrl })
            console.log('Updated profile.photo_url with:', serveUrl)
          }
        } else {
          console.log('No PROFILE_PHOTO document found')
          setCurrentPhotoUrl(null)
        }
      } catch (error) {
        console.error('Error loading photo document:', error)
        setCurrentPhotoUrl(null)
      }
    }

    loadPhotoUrl()
  }, [profile?.id, profile?.photo_url])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await candidateApi.getMyProfile()
      setProfile(profileData)
      
      if (profileData.id) {
        try {
          const [exps, edus, certs, skls, prefs, docs] = await Promise.all([
            candidateApi.getExperiences(profileData.id).catch(() => []),
            candidateApi.getEducations(profileData.id).catch(() => []),
            candidateApi.getCertifications(profileData.id).catch(() => []),
            candidateApi.getSkills(profileData.id).catch(() => []),
            candidateApi.getJobPreferences(profileData.id).catch(() => null),
            documentApi.getCandidateDocuments(profileData.id).catch(() => []),
          ])
          
          setExperiences(exps || [])
          setEducations(edus || [])
          setCertifications(certs || [])
          setSkills(skls || [])
          setJobPreferences(prefs)
          setDocuments(docs || [])
        } catch (error) {
          console.error('Error loading relations:', error)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      if (error.response?.status === 404) {
        navigate('/onboarding')
        return
      }
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
      alert('Veuillez sélectionner un fichier')
      return
    }

    // Vérifier la taille du fichier (max 10MB)
    if (selectedDocumentFile.size > 10 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 10MB')
      return
    }

    try {
      setUploadingDocument(true)
      await documentApi.uploadDocument(selectedDocumentFile, profile.id, selectedDocumentType)
      alert('Document ajouté avec succès')
      setShowDocumentDialog(false)
      setSelectedDocumentFile(null)
      setSelectedDocumentType('CV')
      // Recharger les documents
      await loadDocuments()
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Erreur lors de l\'upload du document: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      authApiService.logout()
      navigate('/login')
    }
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

  const handleDeleteExperience = async (experienceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette expérience ?')) return
    try {
      await candidateApi.deleteExperience(profile.id, experienceId)
      setExperiences(experiences.filter(exp => exp.id !== experienceId))
    } catch (error) {
      console.error('Error deleting experience:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteEducation = async (educationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return
    try {
      await candidateApi.deleteEducation(profile.id, educationId)
      setEducations(educations.filter(edu => edu.id !== educationId))
    } catch (error) {
      console.error('Error deleting education:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteCertification = async (certificationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette certification ?')) return
    try {
      await candidateApi.deleteCertification(profile.id, certificationId)
      setCertifications(certifications.filter(cert => cert.id !== certificationId))
    } catch (error) {
      console.error('Error deleting certification:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) return
    try {
      await candidateApi.deleteSkill(profile.id, skillId)
      setSkills(skills.filter(skill => skill.id !== skillId))
    } catch (error) {
      console.error('Error deleting skill:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#226D68' }}></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
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
  const completionPercentage = profile.completion_percentage || 0
  const defaultAvatar = generateAvatarUrl(profile.first_name, profile.last_name)
  
  // Déterminer quelle photo afficher - utiliser currentPhotoUrl seulement si elle existe et n'est pas l'avatar
  const displayPhoto = (currentPhotoUrl && !photoError && !currentPhotoUrl.includes('ui-avatars.com')) 
    ? currentPhotoUrl 
    : defaultAvatar

  // Sidebar simplifiée - seulement overview
  const sidebarItems = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Home },
  ]

  return (
    <div className="h-screen bg-gray-light flex overflow-hidden max-h-screen">
      {/* Sidebar - Compact */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-56 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-16'}
        flex flex-col
      `}>
        {/* Header Sidebar - Compact */}
        <div className="h-12 border-b border-gray-200 flex items-center justify-between px-3">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#226D68' }}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-gray-anthracite font-heading">Yemma</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden h-8 w-8"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation - Compact */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                className="w-full justify-start h-9 text-sm px-2"
                onClick={() => {
                  setActiveTab(item.id)
                  navigate({ hash: `#${item.id}` })
                }}
              >
                <Icon className="w-3.5 h-3.5 mr-2" />
                {sidebarOpen && <span>{item.label}</span>}
              </Button>
            )
          })}
        </nav>

        {/* Footer Sidebar - Compact */}
        <div className="border-t border-gray-200 p-2 space-y-2">
          {sidebarOpen && (
            <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors mb-2">
              <img
                src={displayPhoto}
                alt={fullName}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
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
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-gray-anthracite">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-9 text-sm px-2"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            {sidebarOpen && <span>Déconnexion</span>}
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
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
          {/* Header - Responsive */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <img
                  src={displayPhoto}
                  alt={fullName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 flex-shrink-0"
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
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent truncate" style={{ background: `linear-gradient(to right, #226D68, #1a5a55)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {fullName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                    {getStatusBadge(profile.status)}
                    {profile.profile_title && (
                      <span className="text-xs text-muted-foreground truncate">• {profile.profile_title}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {profile.status === 'DRAFT' && (
                  <Button 
                    size="sm"
                    className="text-white h-8 px-2 sm:px-3 text-xs flex items-center gap-1"
                    style={{ backgroundColor: '#226D68' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a5a55' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#226D68' }}
                    onClick={async () => {
                      try {
                        await candidateApi.submitProfile(profile.id)
                        alert('Profil soumis avec succès !')
                        loadProfile()
                      } catch (error) {
                        alert('Erreur lors de la soumission: ' + (error.response?.data?.detail || error.message))
                      }
                    }}
                  >
                    <FileCheck className="w-3.5 h-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Soumettre</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/profile/edit')}
                  className="h-8 px-2 sm:px-3 text-xs flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Modifier</span>
                </Button>
              </div>
            </div>

            {/* Onglets du profil - Responsive */}
            <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value)
              navigate({ hash: `#${value}` })
            }} className="w-full">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
                <TabsList className="inline-flex w-full sm:grid sm:grid-cols-7 h-auto sm:h-9 bg-white border mb-3 min-w-max sm:min-w-0">
                  <TabsTrigger value="profile" className="text-xs data-[state=active]:text-white whitespace-nowrap px-3 sm:px-2 py-2 sm:py-1.5" style={{ '--active-bg': '#226D68' }} data-style-active-bg="#226D68">
                    <User className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="ml-1.5 sm:ml-0">Profil</span>
                  </TabsTrigger>
                  <TabsTrigger value="experiences" className="text-xs data-[state=active]:bg-[#226D68] data-[state=active]:text-white whitespace-nowrap px-3 sm:px-2 py-2 sm:py-1.5">
                    <Briefcase className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="ml-1.5 sm:ml-0">Expériences</span>
                    {experiences.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                        {experiences.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="educations" className="text-xs data-[state=active]:bg-[#226D68] data-[state=active]:text-white whitespace-nowrap px-3 sm:px-2 py-2 sm:py-1.5">
                    <GraduationCap className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="ml-1.5 sm:ml-0">Formations</span>
                    {educations.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                        {educations.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="certifications" className="text-xs data-[state=active]:bg-[#226D68] data-[state=active]:text-white whitespace-nowrap px-3 sm:px-2 py-2 sm:py-1.5">
                    <Award className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="ml-1.5 sm:ml-0">Certifications</span>
                    {certifications.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                        {certifications.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="text-xs data-[state=active]:bg-[#226D68] data-[state=active]:text-white whitespace-nowrap px-3 sm:px-2 py-2 sm:py-1.5">
                    <Code className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="ml-1.5 sm:ml-0">Compétences</span>
                    {skills.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                        {skills.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="text-xs data-[state=active]:bg-[#226D68] data-[state=active]:text-white whitespace-nowrap px-3 sm:px-2 py-2 sm:py-1.5">
                    <MapPin className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="ml-1.5 sm:ml-0">Préférences</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="text-xs data-[state=active]:bg-[#226D68] data-[state=active]:text-white whitespace-nowrap px-3 sm:px-2 py-2 sm:py-1.5">
                    <FileText className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="ml-1.5 sm:ml-0">Documents</span>
                    {documents.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-xs">
                        {documents.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Contenu des onglets */}
              {/* Onglet Profil Général */}
              <TabsContent value="profile" className="mt-0">
                <Card className="rounded-[12px] shadow-lg border-l-4" style={{ borderLeftColor: '#226D68' }}>
                  <CardHeader className="border-b py-2 px-3" style={{ background: `linear-gradient(to right, rgba(34, 109, 104, 0.05), rgba(34, 109, 104, 0.1))` }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <User className="h-4 w-4 flex-shrink-0" style={{ color: '#226D68' }} />
                        <span className="truncate">Informations Générales</span>
                      </CardTitle>
                      <Button 
                        size="sm"
                        onClick={() => navigate('/profile/edit')}
                        className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2 text-xs w-full sm:w-auto flex items-center justify-center gap-1"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-4">
                      {/* Photo et informations principales */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                        <div className="relative group self-center sm:self-start">
                          <img
                            src={displayPhoto}
                            alt={fullName}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 flex-shrink-0"
                            style={{ borderColor: 'rgba(34, 109, 104, 0.2)' }}
                            onError={(e) => {
                              console.error('Error loading profile photo:', displayPhoto, 'Falling back to default avatar')
                              if (!photoError && e.target.src !== defaultAvatar) {
                                setPhotoError(true)
                                e.target.src = defaultAvatar
                              } else if (e.target.src !== defaultAvatar) {
                                e.target.src = defaultAvatar
                              }
                            }}
                            onLoad={(e) => {
                              console.log('Profile photo loaded successfully:', e.target.src)
                              console.log('Was using:', currentPhotoUrl ? 'photo URL' : 'default avatar')
                              if (photoError && currentPhotoUrl) {
                                setPhotoError(false)
                              }
                            }}
                          />
                          <label
                            htmlFor="photo-upload"
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                          >
                            {uploadingPhoto ? (
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-white" />
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
                                alert('Veuillez sélectionner une image (JPG, PNG)')
                                return
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                alert('La photo ne doit pas dépasser 5MB')
                                return
                              }

                              try {
                                setUploadingPhoto(true)
                                
                                // Utiliser l'endpoint dédié pour les photos de profil
                                const uploadResult = await documentApi.uploadProfilePhoto(file, profile.id)
                                console.log('Upload profile photo result:', uploadResult)
                                
                                // Construire l'URL complète
                                let serveUrl = uploadResult.serve_url
                                if (serveUrl && serveUrl.startsWith('/')) {
                                  serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
                                } else if (uploadResult.id) {
                                  serveUrl = documentApi.getDocumentServeUrl(uploadResult.id)
                                }
                                
                                console.log('Final serve URL:', serveUrl)

                                // Mettre à jour le profil avec l'URL complète
                                await candidateApi.updateProfile(profile.id, { photo_url: serveUrl })
                                console.log('Profile updated with photo_url:', serveUrl)
                                
                                // Mettre à jour l'état local immédiatement
                                setCurrentPhotoUrl(serveUrl)
                                setPhotoError(false)
                                
                                // Recharger le profil pour mettre à jour l'affichage
                                await loadProfile()
                                alert('Photo de profil mise à jour avec succès !')
                              } catch (err) {
                                console.error('Error uploading photo:', err)
                                alert('Erreur lors du téléchargement de la photo: ' + (err.response?.data?.detail || err.message))
                              } finally {
                                setUploadingPhoto(false)
                                // Réinitialiser l'input
                                e.target.value = ''
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
                          <h3 className="text-base sm:text-lg font-bold text-gray-anthracite mb-1 truncate">{fullName}</h3>
                          {profile.profile_title && (
                            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 truncate">{profile.profile_title}</p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 justify-center sm:justify-start">
                            {profile.email && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center sm:justify-start">
                                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{profile.email}</span>
                              </div>
                            )}
                            {profile.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center sm:justify-start">
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{profile.phone}</span>
                              </div>
                            )}
                            {(profile.city || profile.country) && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center sm:justify-start">
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{[profile.city, profile.country].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Informations détaillées */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t">
                        {profile.date_of_birth && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Date de naissance</p>
                              <p className="text-sm font-medium">{new Date(profile.date_of_birth).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                        )}
                        {profile.nationality && (
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Nationalité</p>
                              <p className="text-sm font-medium">{profile.nationality}</p>
                            </div>
                          </div>
                        )}
                        {profile.address && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Adresse</p>
                              <p className="text-sm font-medium">{profile.address}</p>
                            </div>
                          </div>
                        )}
                        {profile.sector && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Secteur d'activité</p>
                              <p className="text-sm font-medium">{profile.sector}</p>
                            </div>
                          </div>
                        )}
                        {profile.main_job && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Métier principal</p>
                              <p className="text-sm font-medium">{profile.main_job}</p>
                            </div>
                          </div>
                        )}
                        {profile.total_experience !== undefined && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Années d'expérience</p>
                              <p className="text-sm font-medium">{profile.total_experience} an{profile.total_experience > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Résumé professionnel */}
                      {profile.professional_summary && (
                        <div className="pt-3 border-t">
                          <h4 className="text-sm font-semibold text-gray-anthracite mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Résumé professionnel
                          </h4>
                          <div 
                            className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: profile.professional_summary }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experiences" className="mt-0">
                <Card className="rounded-[12px] shadow-lg border-l-4 border-l-[#226D68]">
                    <CardHeader className="bg-gradient-to-r from-[#226D68]/5 to-[#226D68]/10 border-b py-2 px-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <Briefcase className="h-4 w-4 text-[#226D68] flex-shrink-0" />
                          <span className="truncate">Expériences professionnelles</span>
                        </CardTitle>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setEditingExperience(null)
                            setShowExperienceDialog(true)
                          }}
                          className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2 text-xs w-full sm:w-auto flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      {experiences.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {experiences.map((exp) => {
                            const defaultCompanyLogo = generateCompanyLogoUrl(exp.company_name)
                            const displayCompanyLogo = exp.company_logo_url || defaultCompanyLogo
                            
                            return (
                              <Card key={exp.id} className="rounded-lg shadow-sm hover:shadow-md transition-all border-l-2 border-l-[#226D68]/50 group">
                                <CardContent className="pt-3 pb-3 px-3">
                                  <div className="flex gap-2 sm:gap-3 items-start">
                                    <img
                                      src={displayCompanyLogo}
                                      alt={exp.company_name}
                                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                                      onError={(e) => {
                                        if (e.target.src !== defaultCompanyLogo) {
                                          e.target.src = defaultCompanyLogo
                                        }
                                      }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-xs sm:text-sm text-gray-anthracite truncate">{exp.position}</h4>
                                          <p className="text-xs font-medium text-gray-700 truncate">{exp.company_name}</p>
                                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                                            {exp.contract_type && (
                                              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                                                {exp.contract_type}
                                              </Badge>
                                            )}
                                            {exp.company_sector && (
                                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                                                {exp.company_sector}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                            <span className="whitespace-nowrap">
                                              {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                              {exp.end_date 
                                                ? ` - ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                                                : exp.is_current ? ' - Actuellement' : ''}
                                            </span>
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setEditingExperience(exp)
                                              setShowExperienceDialog(true)
                                            }}
                                            className="h-7 w-7 p-0"
                                          >
                                            <Edit className="h-3.5 w-3.5 text-blue-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteExperience(exp.id)}
                                            className="h-7 w-7 p-0"
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Description */}
                                      {exp.description && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Description des missions</p>
                                          <div 
                                            className="text-xs text-gray-700 rich-text-content"
                                            dangerouslySetInnerHTML={{ __html: exp.description }}
                                          />
                                        </div>
                                      )}

                                      {/* Réalisations majeures */}
                                      {exp.achievements && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Réalisations majeures</p>
                                          <div 
                                            className="text-xs text-gray-700 rich-text-content"
                                            dangerouslySetInnerHTML={{ __html: exp.achievements }}
                                          />
                                        </div>
                                      )}

                                      {/* Document justificatif */}
                                      {exp.has_document && exp.document_id && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#226D68]" />
                                            <span className="text-xs font-medium text-gray-700">Pièce justificative disponible</span>
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
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Briefcase className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-semibold mb-1">Aucune expérience enregistrée</p>
                          <Button 
                            size="sm"
                            className="mt-3 bg-[#226D68] hover:bg-[#1a5a55] text-white h-8 px-2 text-xs"
                            onClick={() => setShowExperienceDialog(true)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Ajouter une expérience
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="educations" className="mt-0">
                <Card className="rounded-[12px] shadow-lg border-l-4 border-l-blue-deep">
                    <CardHeader className="bg-gradient-to-r from-blue-deep/5 to-blue-deep/10 border-b py-2 px-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <GraduationCap className="h-4 w-4 text-blue-deep flex-shrink-0" />
                          <span className="truncate">Formations & Diplômes</span>
                        </CardTitle>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setEditingEducation(null)
                            setShowEducationDialog(true)
                          }}
                          className="bg-blue-deep hover:bg-blue-deep/90 text-white h-7 px-2 text-xs w-full sm:w-auto flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      {educations.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {educations.map((edu) => (
                            <Card key={edu.id} className="rounded-lg shadow-sm hover:shadow-md transition-all border-l-2 border-l-blue-deep/50 group">
                              <CardContent className="pt-3 pb-3 px-3">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-xs sm:text-sm text-gray-anthracite truncate">{edu.diploma}</h4>
                                    <p className="text-xs font-medium text-gray-700 truncate">{edu.institution}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      {edu.level && (
                                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                                          {edu.level}
                                        </Badge>
                                      )}
                                      {edu.country && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <MapPin className="w-3 h-3" />
                                          <span>{edu.country}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {edu.start_year ? `${edu.start_year} - ${edu.graduation_year}` : edu.graduation_year}
                                      </span>
                                    </div>
                                  </div>
                                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingEducation(edu)
                                        setShowEducationDialog(true)
                                      }}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit className="h-3.5 w-3.5 text-blue-600" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDeleteEducation(edu.id)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <GraduationCap className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-semibold mb-1">Aucune formation enregistrée</p>
                          <Button 
                            size="sm"
                            className="mt-3 bg-blue-deep hover:bg-blue-deep/90 text-white h-8 px-2 text-xs"
                            onClick={() => setShowEducationDialog(true)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Ajouter une formation
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="certifications" className="mt-0">
                <Card className="rounded-[12px] shadow-lg border-l-4 border-l-[#e76f51]">
                    <CardHeader className="bg-gradient-to-r from-[#FDF2F0] to-[#FBE5E0] border-b py-2 px-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <Award className="h-4 w-4 text-[#e76f51] flex-shrink-0" />
                          <span className="truncate">Certifications</span>
                        </CardTitle>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setEditingCertification(null)
                            setShowCertificationDialog(true)
                          }}
                          className="bg-[#e76f51] hover:bg-[#d45a3f] text-white h-7 px-2 text-xs w-full sm:w-auto flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      {certifications.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {certifications.map((cert) => (
                            <Card key={cert.id} className="rounded-lg shadow-sm hover:shadow-md transition-all border-l-2 border-l-[#e76f51]/50 group">
                              <CardContent className="pt-3 pb-3 px-3">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-xs sm:text-sm text-gray-anthracite truncate">{cert.title}</h4>
                                    <p className="text-xs font-medium text-gray-700 truncate">{cert.issuer}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        <span>{cert.year}</span>
                                      </div>
                                      {cert.expiration_date && (
                                        <div className="flex items-center gap-1 text-xs text-[#e76f51]">
                                          <Clock className="w-3 h-3" />
                                          <span>Expire le {new Date(cert.expiration_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                      )}
                                      {cert.certification_id && (
                                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                                          ID: {cert.certification_id}
                                        </Badge>
                                      )}
                                    </div>
                                    {cert.verification_url && (
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <a 
                                          href={cert.verification_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-xs text-[#e76f51] hover:text-[#c04a2f] hover:underline inline-flex items-center gap-1.5 font-medium"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                          Lien de vérification
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCertification(cert)
                                        setShowCertificationDialog(true)
                                      }}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit className="h-3.5 w-3.5 text-blue-600" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDeleteCertification(cert.id)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Award className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-semibold mb-1">Aucune certification enregistrée</p>
                          <Button 
                            size="sm"
                            className="mt-3 bg-[#e76f51] hover:bg-[#d45a3f] text-white h-8 px-2 text-xs"
                            onClick={() => setShowCertificationDialog(true)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Ajouter une certification
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="skills" className="mt-0 space-y-4">
                {/* En-tête avec statistiques */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#226D68]" />
                      Mes Compétences
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {skills.length} compétence{skills.length > 1 ? 's' : ''} au total
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setEditingSkill(null)
                      setShowSkillDialog(true)
                    }}
                    className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-9 px-4 text-sm w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une compétence
                  </Button>
                </div>

                {skills.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Compétences Techniques */}
                    {(() => {
                      const technicalSkills = skills.filter(s => s.skill_type === 'TECHNICAL')
                      if (technicalSkills.length === 0) return null
                      return (
                        <Card className="rounded-xl shadow-md border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-b pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                  <Code className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-bold text-blue-900">
                                    Compétences techniques
                                  </CardTitle>
                                  <p className="text-xs text-blue-700 mt-0.5">
                                    {technicalSkills.length} compétence{technicalSkills.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {technicalSkills.map((skill) => (
                                <div
                                  key={skill.id}
                                  className="group relative bg-white border border-blue-200 rounded-lg px-3 py-2 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex items-center gap-2 min-w-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-sm text-gray-900 truncate">
                                        {skill.name}
                                      </span>
                                      {skill.level && (
                                        <Badge 
                                          variant="secondary" 
                                          className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-medium px-2 py-0.5 whitespace-nowrap"
                                        >
                                          {skill.level === 'BEGINNER' ? 'Débutant' :
                                           skill.level === 'INTERMEDIATE' ? 'Intermédiaire' :
                                           skill.level === 'ADVANCED' ? 'Avancé' : 'Expert'}
                                        </Badge>
                                      )}
                                    </div>
                                    {skill.years_of_practice > 0 && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Calendar className="h-3 w-3 text-gray-500" />
                                        <span className="text-xs text-gray-600">
                                          {skill.years_of_practice} an{skill.years_of_practice > 1 ? 's' : ''} d'expérience
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-blue-50"
                                      onClick={() => {
                                        setEditingSkill(skill)
                                        setShowSkillDialog(true)
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-blue-600" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 hover:bg-red-50" 
                                      onClick={() => handleDeleteSkill(skill.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })()}

                    {/* Soft Skills */}
                    {(() => {
                      const softSkills = skills.filter(s => s.skill_type === 'SOFT')
                      if (softSkills.length === 0) return null
                      return (
                        <Card className="rounded-xl shadow-md border-l-4 border-l-[#226D68] hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="bg-gradient-to-br from-[#E8F4F3] to-[#D1E9E7]/50 border-b pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-[#226D68] rounded-lg">
                                  <Users className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-bold text-[#1a5a55]">
                                    Soft Skills
                                  </CardTitle>
                                  <p className="text-xs text-[#1a5a55] mt-0.5">
                                    {softSkills.length} compétence{softSkills.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {softSkills.map((skill) => (
                                <div
                                  key={skill.id}
                                  className="group relative bg-white border border-[#B8DDD9] rounded-lg px-3 py-2.5 hover:border-[#226D68] hover:shadow-md transition-all duration-200 flex items-center gap-2 min-w-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="h-3.5 w-3.5 text-[#226D68] flex-shrink-0" />
                                      <span className="font-semibold text-sm text-gray-900">
                                        {skill.name}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-[#E8F4F3]"
                                      onClick={() => {
                                        setEditingSkill(skill)
                                        setShowSkillDialog(true)
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-[#226D68]" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 hover:bg-red-50" 
                                      onClick={() => handleDeleteSkill(skill.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })()}

                    {/* Outils & Logiciels */}
                    {(() => {
                      const toolSkills = skills.filter(s => s.skill_type === 'TOOL')
                      if (toolSkills.length === 0) return null
                      return (
                        <Card className="rounded-xl shadow-md border-l-4 border-l-purple-600 hover:shadow-lg transition-shadow duration-200">
                          <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-b pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-600 rounded-lg">
                                  <Wrench className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm font-bold text-purple-900">
                                    Outils & Logiciels
                                  </CardTitle>
                                  <p className="text-xs text-purple-700 mt-0.5">
                                    {toolSkills.length} outil{toolSkills.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {toolSkills.map((skill) => (
                                <div
                                  key={skill.id}
                                  className="group relative bg-white border border-purple-200 rounded-lg px-3 py-2 hover:border-purple-400 hover:shadow-md transition-all duration-200 flex items-center gap-2 min-w-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-sm text-gray-900 truncate">
                                        {skill.name}
                                      </span>
                                      {skill.level && (
                                        <Badge 
                                          variant="secondary" 
                                          className="bg-purple-100 text-purple-800 border-purple-300 text-xs font-medium px-2 py-0.5 whitespace-nowrap"
                                        >
                                          {skill.level === 'BEGINNER' ? 'Débutant' :
                                           skill.level === 'INTERMEDIATE' ? 'Intermédiaire' :
                                           skill.level === 'ADVANCED' ? 'Avancé' : 'Expert'}
                                        </Badge>
                                      )}
                                    </div>
                                    {skill.years_of_practice > 0 && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Calendar className="h-3 w-3 text-gray-500" />
                                        <span className="text-xs text-gray-600">
                                          {skill.years_of_practice} an{skill.years_of_practice > 1 ? 's' : ''} d'expérience
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-purple-50"
                                      onClick={() => {
                                        setEditingSkill(skill)
                                        setShowSkillDialog(true)
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-purple-600" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 hover:bg-red-50" 
                                      onClick={() => handleDeleteSkill(skill.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })()}
                  </div>
                ) : (
                  <Card className="rounded-xl shadow-md border-2 border-dashed border-gray-300">
                    <CardContent className="p-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                          <Code className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Aucune compétence enregistrée
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 max-w-sm">
                          Commencez par ajouter vos compétences techniques, soft skills et outils pour enrichir votre profil.
                        </p>
                        <Button 
                          size="default"
                          onClick={() => setShowSkillDialog(true)}
                          className="bg-[#226D68] hover:bg-[#1a5a55] text-white shadow-sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter ma première compétence
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">
                <Card className="rounded-[12px] shadow-lg border-l-4 border-l-[#226D68]">
                    <CardHeader className="bg-gradient-to-r from-[#226D68]/5 to-[#226D68]/10 border-b py-2 px-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <MapPin className="h-4 w-4 text-[#226D68] flex-shrink-0" />
                          <span className="truncate">Préférences d'emploi</span>
                        </CardTitle>
                        <Button 
                          size="sm"
                          onClick={() => setShowPreferencesDialog(true)}
                          className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-7 px-2 text-xs w-full sm:w-auto flex items-center justify-center gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Modifier
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      {jobPreferences ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {jobPreferences.desired_positions?.length > 0 && (
                            <Card className="rounded-lg border-l-2 border-l-[#226D68]/50 bg-gradient-to-r from-white to-[#226D68]/5">
                              <CardContent className="p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                  <Briefcase className="h-3.5 w-3.5 text-[#226D68]" />
                                  Postes recherchés
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {jobPreferences.desired_positions.map((pos, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0 h-5">
                                      {pos}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          {jobPreferences.contract_type && (
                            <Card className="rounded-lg border-l-2 border-l-blue-deep/50 bg-gradient-to-r from-white to-blue-deep/5">
                              <CardContent className="p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-blue-deep" />
                                  Type de contrat
                                </p>
                                <p className="font-bold text-sm text-gray-anthracite">{jobPreferences.contract_type}</p>
                              </CardContent>
                            </Card>
                          )}
                          {jobPreferences.target_sectors?.length > 0 && (
                            <Card className="rounded-lg border-l-2 border-l-purple-500/50 bg-gradient-to-r from-white to-purple-500/5">
                              <CardContent className="p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                  <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                                  Secteurs ciblés
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {jobPreferences.target_sectors.map((sector, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0 h-5">
                                      {sector}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          {jobPreferences.desired_location && (
                            <Card className="rounded-lg border-l-2 border-l-[#e76f51]/50 bg-gradient-to-r from-white to-[#e76f51]/5">
                              <CardContent className="p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-[#e76f51]" />
                                  Localisation souhaitée
                                </p>
                                <p className="font-bold text-sm text-gray-anthracite">{jobPreferences.desired_location}</p>
                              </CardContent>
                            </Card>
                          )}
                          {jobPreferences.mobility && (
                            <Card className="rounded-lg border-l-2 border-l-blue-deep/50 bg-gradient-to-r from-white to-blue-deep/5">
                              <CardContent className="p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-blue-deep" />
                                  Mobilité
                                </p>
                                <p className="font-bold text-sm text-gray-anthracite">{jobPreferences.mobility}</p>
                              </CardContent>
                            </Card>
                          )}
                          {jobPreferences.availability && (
                            <Card className="rounded-lg border-l-2 border-l-[#226D68]/50 bg-gradient-to-r from-white to-[#226D68]/5">
                              <CardContent className="p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-[#226D68]" />
                                  Disponibilité
                                </p>
                                <p className="font-bold text-sm text-gray-anthracite">{jobPreferences.availability}</p>
                              </CardContent>
                            </Card>
                          )}
                          {(jobPreferences.salary_min || jobPreferences.salary_max) && (
                            <Card className="rounded-lg border-l-2 border-l-[#e76f51]/50 bg-gradient-to-r from-white to-[#e76f51]/5 md:col-span-2">
                              <CardContent className="p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                                  <TrendingUp className="h-3.5 w-3.5 text-[#e76f51]" />
                                  Prétentions salariales
                                </p>
                                <p className="font-bold text-lg text-gray-anthracite">
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
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-semibold mb-1">Aucune préférence enregistrée</p>
                          <Button 
                            size="sm"
                            className="mt-3 bg-[#226D68] hover:bg-[#1a5a55] text-white h-8 px-2 text-xs"
                            onClick={() => setShowPreferencesDialog(true)}
                          >
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            Définir mes préférences
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </TabsContent>

              {/* Onglet Documents */}
              <TabsContent value="documents" className="mt-0">
                <Card className="rounded-[12px] shadow-lg border-l-4 border-l-blue-deep">
                  <CardHeader className="bg-gradient-to-r from-blue-deep/5 to-blue-deep/10 border-b py-2 px-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-blue-deep flex-shrink-0" />
                        <span className="truncate">Documents justificatifs</span>
                      </CardTitle>
                      <Button
                        onClick={() => setShowDocumentDialog(true)}
                        size="sm"
                        className="h-7 px-3 text-xs bg-blue-deep hover:bg-blue-deep/90 w-full sm:w-auto flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter un document
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    {(() => {
                      // Filtrer les documents qui sont des photos de profil et des logos d'entreprise
                      // On les exclut de la liste des documents car ils sont déjà affichés ailleurs
                      const filteredDocuments = documents.filter((doc) => {
                        // Exclure les photos de profil (PROFILE_PHOTO)
                        if (doc.document_type === 'PROFILE_PHOTO') {
                          console.log('Excluding profile photo from documents:', doc.id, doc.original_filename)
                          return false
                        }
                        
                        // Exclure les logos d'entreprise (COMPANY_LOGO)
                        if (doc.document_type === 'COMPANY_LOGO') {
                          console.log('Excluding company logo from documents:', doc.id, doc.original_filename)
                          return false
                        }
                        
                        // Exclure aussi les images de type 'OTHER' qui sont des photos de profil
                        // (pour rétrocompatibilité avec les anciennes photos uploadées)
                        const isImage = doc.mime_type?.startsWith('image/')
                        const isOtherType = doc.document_type === 'OTHER'
                        if (isImage && isOtherType) {
                          console.log('Excluding profile photo (OTHER type) from documents:', doc.id, doc.original_filename)
                          return false
                        }
                        
                        return true // Inclure tous les autres documents
                      })
                      
                      console.log('Total documents:', documents.length, 'Filtered documents:', filteredDocuments.length)
                      
                      return filteredDocuments.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
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

                          const getDocumentTypeColor = (type) => {
                            const colors = {
                              'CV': 'bg-blue-100 text-blue-800 border-blue-200',
                              'ATTESTATION': 'bg-[#D1E9E7] text-[#1a5a55] border-[#B8DDD9]',
                              'CERTIFICATE': 'bg-[#FBE5E0] text-[#c04a2f] border-[#F8D3CA]',
                              'RECOMMENDATION_LETTER': 'bg-purple-100 text-purple-800 border-purple-200',
                              'DIPLOMA': 'bg-indigo-100 text-indigo-800 border-indigo-200',
                              'OTHER': 'bg-gray-100 text-gray-800 border-gray-200'
                            }
                            return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
                          }

                          const formatFileSize = (bytes) => {
                            if (bytes < 1024) return `${bytes} B`
                            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
                            return `${(bytes / 1024 / 1024).toFixed(1)} MB`
                          }

                          const handleViewDocument = async () => {
                            try {
                              const viewResponse = await documentApi.getDocumentViewUrl(doc.id)
                              window.open(viewResponse.view_url, '_blank')
                            } catch (error) {
                              console.error('Error viewing document:', error)
                              alert('Erreur lors de l\'ouverture du document: ' + (error.response?.data?.detail || error.message))
                            }
                          }

                          const handleDownloadDocument = async () => {
                            try {
                              const viewResponse = await documentApi.getDocumentViewUrl(doc.id)
                              const link = document.createElement('a')
                              link.href = viewResponse.view_url
                              link.download = doc.original_filename
                              link.target = '_blank'
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            } catch (error) {
                              console.error('Error downloading document:', error)
                              alert('Erreur lors du téléchargement du document: ' + (error.response?.data?.detail || error.message))
                            }
                          }

                          const handleDeleteDocument = async () => {
                            if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le document "${doc.original_filename}" ? Cette action est irréversible.`)) {
                              return
                            }
                            
                            try {
                              await documentApi.deleteDocument(doc.id)
                              // Retirer le document de la liste
                              setDocuments(documents.filter(d => d.id !== doc.id))
                              alert('Document supprimé avec succès')
                            } catch (error) {
                              console.error('Error deleting document:', error)
                              alert('Erreur lors de la suppression du document: ' + (error.response?.data?.detail || error.message))
                            }
                          }

                            return (
                              <Card key={doc.id} className="rounded-lg shadow-sm hover:shadow-md transition-all border-l-2 border-l-blue-deep/50 group">
                                <CardContent className="pt-3 pb-3 px-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4 text-blue-deep flex-shrink-0" />
                                        <h4 className="font-semibold text-sm text-gray-anthracite truncate">{doc.original_filename}</h4>
                                        <Badge className={`text-xs px-1.5 py-0 h-4 ${getDocumentTypeColor(doc.document_type)}`}>
                                          {getDocumentTypeLabel(doc.document_type)}
                                        </Badge>
                                      </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                      <span>{formatFileSize(doc.file_size)}</span>
                                      <span>•</span>
                                      <span>{doc.mime_type}</span>
                                      {doc.created_at && (
                                        <>
                                          <span>•</span>
                                          <span>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </>
                                      )}
                                      {doc.status && (
                                        <>
                                          <span>•</span>
                                          <Badge 
                                            variant={doc.status === 'uploaded' ? 'secondary' : 'outline'} 
                                            className="text-xs px-1.5 py-0 h-4"
                                          >
                                            {doc.status === 'uploaded' ? 'Téléchargé' : doc.status}
                                          </Badge>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleViewDocument}
                                      className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      Voir
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleDownloadDocument}
                                      className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Download className="h-3.5 w-3.5 mr-1" />
                                      Télécharger
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleDeleteDocument}
                                      className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-semibold mb-1">Aucun document enregistré</p>
                          <p className="text-xs text-muted-foreground mb-3">Cliquez sur "Ajouter un document" pour télécharger vos documents justificatifs</p>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

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
            }}
            onCancel={() => {
              setShowExperienceDialog(false)
              setEditingExperience(null)
            }}
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
            }}
            onCancel={() => {
              setShowEducationDialog(false)
              setEditingEducation(null)
            }}
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
            }}
            onCancel={() => {
              setShowCertificationDialog(false)
              setEditingCertification(null)
            }}
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
            }}
            onCancel={() => {
              setShowSkillDialog(false)
              setEditingSkill(null)
            }}
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
            }}
            onCancel={() => setShowPreferencesDialog(false)}
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
              <Label htmlFor="document-type">Type de document *</Label>
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
              <Label htmlFor="document-file">Fichier *</Label>
              <Input
                id="document-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      alert('Le fichier ne doit pas dépasser 10MB')
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
              className="bg-blue-deep hover:bg-blue-deep/90"
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
    </div>
  )
}

// Composant formulaire pour ajouter/modifier une expérience
function ExperienceForm({ profileId, experience, onSuccess, onCancel }) {
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
      alert('Veuillez sélectionner une image (JPG, PNG)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Le logo ne doit pas dépasser 2MB')
      return
    }

    try {
      setUploadingLogo(true)
      const uploadedDoc = await documentApi.uploadDocument(file, profileId, 'OTHER')
      const serveUrl = documentApi.getDocumentServeUrl(uploadedDoc.id)
      setFormData({ ...formData, companyLogoUrl: serveUrl })
    } catch (error) {
      console.error('Erreur lors de l\'upload du logo:', error)
      alert('Erreur lors de l\'upload du logo: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploadingLogo(false)
    }
  }

  // Gérer l'upload du document justificatif
  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !profileId) return

    if (file.size > 10 * 1024 * 1024) {
      alert('Le document ne doit pas dépasser 10MB')
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
      alert('Erreur lors de l\'upload du document: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!profileId) return

    if (!formData.companyName || !formData.position || !formData.startDate || !formData.description) {
      alert('Veuillez remplir tous les champs obligatoires (Nom de l\'entreprise, Poste, Date de début, Description)')
      return
    }

    try {
      setSaving(true)
      const data = {
        company_name: formData.companyName,
        company_logo_url: formData.companyLogoUrl,
        position: formData.position,
        contract_type: formData.contract_type || null,
        company_sector: formData.company_sector || null,
        start_date: new Date(formData.startDate).toISOString(),
        end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        is_current: formData.isCurrent || !formData.endDate,
        description: formData.description,
        achievements: formData.achievements || null,
        has_document: formData.hasDocument
      }
      
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
      alert('Erreur lors de la sauvegarde de l\'expérience: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Logo d'entreprise */}
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                src={formData.companyLogoUrl || generateCompanyAvatar(formData.companyName)}
                alt={`Logo ${formData.companyName || 'entreprise'}`}
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
              Logo de l'entreprise (facultatif)
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
              Formats: JPG, PNG (max 2MB). Si non renseigné, un avatar sera généré.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Nom de l'entreprise *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="position">Poste occupé *</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Date de début *</Label>
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
        <Label htmlFor="description">Description des missions *</Label>
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
function EducationForm({ profileId, education, onSuccess, onCancel }) {
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
      const data = {
        diploma: formData.diploma,
        institution: formData.institution,
        country: formData.country || null,
        start_year: formData.startYear ? parseInt(formData.startYear) : null,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        level: formData.level || null
      }
      await candidateApi.createEducation(profileId, data)
      onSuccess()
    } catch (error) {
      console.error('Error creating education:', error)
      alert('Erreur lors de l\'ajout de la formation: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="diploma">Intitulé du diplôme / formation *</Label>
          <Input
            id="diploma"
            value={formData.diploma}
            onChange={(e) => setFormData({ ...formData, diploma: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="institution">Établissement *</Label>
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
          <Label htmlFor="country">Pays</Label>
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
          <Label htmlFor="graduationYear">Année d'obtention *</Label>
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
          <Label htmlFor="level">Niveau *</Label>
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
function CertificationForm({ profileId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: certification?.title || '',
    issuer: certification?.issuer || '',
    year: certification?.year || new Date().getFullYear(),
    expirationDate: certification?.expiration_date ? new Date(certification.expiration_date).toISOString().split('T')[0] : '',
    verificationUrl: certification?.verification_url || '',
    certificationId: certification?.credential_id || ''
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
        certificationId: certification.credential_id || ''
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
      const data = {
        title: formData.title,
        issuer: formData.issuer,
        year: formData.year ? parseInt(formData.year) : null,
        expiration_date: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : null,
        verification_url: formData.verificationUrl || null,
        credential_id: formData.certificationId || null
      }
      await candidateApi.createCertification(profileId, data)
      onSuccess()
    } catch (error) {
      console.error('Error creating certification:', error)
      alert('Erreur lors de l\'ajout de la certification: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Intitulé de la certification *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="issuer">Organisme délivreur *</Label>
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
          <Label htmlFor="year">Année d'obtention *</Label>
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
function SkillForm({ profileId, skill, onSuccess, onCancel }) {
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
      const data = {
        name: formData.name,
        skill_type: formData.skillType,
        // Pour les soft skills, level et years_of_practice sont null
        level: formData.skillType === 'SOFT' ? null : formData.level,
        years_of_practice: formData.skillType === 'SOFT' ? null : (formData.yearsOfPractice ? parseInt(formData.yearsOfPractice) : 0)
      }
      
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
      alert('Erreur lors de la sauvegarde de la compétence: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Type de compétence */}
        <div>
          <Label htmlFor="skillType">Type de compétence *</Label>
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
          <Label htmlFor="name">Compétence *</Label>
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
              <Label htmlFor="level">Niveau *</Label>
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
function PreferencesForm({ profileId, currentPreferences, onSuccess, onCancel }) {
  const [desiredPositions, setDesiredPositions] = useState(
    currentPreferences?.desired_positions || ['']
  )
  const [formData, setFormData] = useState({
    contractType: currentPreferences?.contract_type || '',
    desiredLocation: currentPreferences?.desired_location || '',
    mobility: currentPreferences?.mobility || '',
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
      const data = {
        contract_type: formData.contractType || null,
        desired_positions: desiredPositions.filter(p => p.trim()).map(p => p.trim()),
        desired_location: formData.desiredLocation || null,
        mobility: formData.mobility || null,
        availability: formData.availability || null,
        salary_min: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        salary_max: formData.salaryMax ? parseInt(formData.salaryMax) : null
      }
      await candidateApi.updateJobPreferences(profileId, data)
      onSuccess()
    } catch (error) {
      console.error('Error updating preferences:', error)
      alert('Erreur lors de la mise à jour des préférences: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Poste(s) recherché(s) * (max 5)</Label>
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
        <Label htmlFor="contractType">Type de contrat souhaité *</Label>
        <select
          id="contractType"
          value={formData.contractType}
          onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">Sélectionner...</option>
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
          <option value="FREELANCE">Freelance</option>
          <option value="STAGE">Stage</option>
          <option value="ALTERNANCE">Alternance</option>
        </select>
      </div>

      <div>
        <Label htmlFor="desiredLocation">Localisation souhaitée *</Label>
        <Input
          id="desiredLocation"
          value={formData.desiredLocation}
          onChange={(e) => setFormData({ ...formData, desiredLocation: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="mobility">Mobilité géographique</Label>
        <Input
          id="mobility"
          value={formData.mobility}
          onChange={(e) => setFormData({ ...formData, mobility: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="availability">Disponibilité *</Label>
        <select
          id="availability"
          value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="">Sélectionner...</option>
          <option value="IMMEDIATE">Immédiate</option>
          <option value="1_MONTH">1 mois</option>
          <option value="2_MONTHS">2 mois</option>
          <option value="3_MONTHS">3 mois</option>
          <option value="MORE">Plus de 3 mois</option>
        </select>
      </div>

      <div>
        <Label>Prétentions salariales * (CFA/mois)</Label>
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
