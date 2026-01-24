import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import CandidateDataView from '@/components/admin/CandidateDataView'
import DocumentViewer from '@/components/admin/DocumentViewer'
import EvaluationForm from '@/components/admin/EvaluationForm'
import { candidateApi, documentApi } from '@/services/api'
import { 
  Loader2, AlertCircle, RefreshCw, ArrowLeft, 
  User, Mail, Phone, MapPin, Briefcase, Award,
  ChevronRight, Calendar, FileText, CheckCircle2, Star,
  GraduationCap, Target, TrendingUp, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

// Générer un avatar par défaut
const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  VALIDATED: 'bg-[#D1E9E7] text-[#1a5a55] border-[#B8DDD9]',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 border-gray-200',
}

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  IN_REVIEW: 'En cours de validation',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
}

export default function AdminReview() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [candidateData, setCandidateData] = useState(null)
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Gérer l'affichage de la photo avec fallback - DOIT être avant les returns conditionnels
  const [photoError, setPhotoError] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)

  const fetchCandidateData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const profile = await candidateApi.getProfile(candidateId)
        console.log('AdminReview: Profile loaded:', profile)
        console.log('AdminReview: Admin report present:', !!profile.admin_report, profile.admin_report)
        setCandidateData(profile)

        try {
          const docs = await documentApi.getCandidateDocuments(candidateId)
          // Filtrer les documents supprimés (au cas où le backend ne le ferait pas)
          const activeDocs = docs.filter(doc => !doc.deleted_at)
          
          // Filtrer les photos de profil, logos d'entreprise et images OTHER
          const filteredDocs = activeDocs.filter((doc) => {
            // Exclure les photos de profil (PROFILE_PHOTO)
            if (doc.document_type === 'PROFILE_PHOTO') {
              return false
            }
            
            // Exclure les logos d'entreprise (COMPANY_LOGO)
            if (doc.document_type === 'COMPANY_LOGO') {
              return false
            }
            
            // Exclure les images de type OTHER (anciennes photos de profil)
            const isImage = doc.mime_type?.startsWith('image/')
            const isOtherType = doc.document_type === 'OTHER'
            if (isImage && isOtherType) {
              return false
            }
            
            return true // Inclure tous les autres documents
          })
          
          // Utiliser les URLs permanentes pour les documents
          const docsWithUrls = filteredDocs.map((doc) => {
            const serveUrl = documentApi.getDocumentServeUrl(doc.id)
            return { 
              ...doc, 
              viewUrl: serveUrl,
              originalFilename: doc.original_filename,
              mimeType: doc.mime_type,
              documentType: doc.document_type,
              fileSize: doc.file_size
            }
          })
          setDocuments(docsWithUrls)
          // Si le document sélectionné a été supprimé ou filtré, sélectionner le premier disponible
          if (docsWithUrls.length > 0) {
            if (!selectedDocument || !docsWithUrls.find(d => d.id === selectedDocument.id)) {
              setSelectedDocument(docsWithUrls[0])
            }
          } else {
            setSelectedDocument(null)
          }
        } catch (docError) {
          console.warn('Erreur lors du chargement des documents (non bloquant):', docError)
          setDocuments([])
          setSelectedDocument(null)
        }
      } catch (err) {
        console.error('Error fetching candidate data:', err)
        
        let errorMessage = 'Erreur lors du chargement des données du candidat'
        
        if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
          errorMessage = `Erreur réseau : Impossible de se connecter au serveur.`
        } else if (err.response?.status === 401) {
          errorMessage = 'Non autorisé : Votre session a expiré. Veuillez vous reconnecter.'
        } else if (err.response?.status === 403) {
          errorMessage = 'Accès refusé : Vous n\'avez pas les permissions nécessaires.'
        } else if (err.response?.status === 404) {
          errorMessage = `Profil non trouvé : Aucun profil trouvé avec l'ID ${candidateId}.`
        } else if (err.response?.status === 502 || err.response?.status === 503) {
          errorMessage = 'Service indisponible : Le service candidate n\'est pas accessible.'
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail
        } else if (err.message) {
          errorMessage = err.message
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
  }

  useEffect(() => {
    if (candidateId) {
      fetchCandidateData()
    }
  }, [candidateId, refreshKey])

  // Si photo_url change, réinitialiser l'erreur et construire l'URL complète si nécessaire
  useEffect(() => {
    const loadPhotoUrl = async () => {
      if (!candidateData?.id) {
        setPhotoUrl(null)
        return
      }

      // D'abord, essayer d'utiliser photo_url du profil
      if (candidateData.photo_url) {
        let photoUrlValue = candidateData.photo_url
        console.log('AdminReview: Processing photo_url from profile:', photoUrlValue)
        
        // Si c'est une URL relative (commence par /), construire l'URL complète
        if (photoUrlValue && photoUrlValue.startsWith('/')) {
          // Extraire l'ID du document depuis l'URL relative
          const match = photoUrlValue.match(/\/api\/v1\/documents\/serve\/(\d+)/)
          if (match && match[1]) {
            const documentId = parseInt(match[1])
            photoUrlValue = documentApi.getDocumentServeUrl(documentId)
            console.log('AdminReview: Converted relative URL to full URL:', photoUrlValue, 'Document ID:', documentId)
          }
        }
        
        // Vérifier que ce n'est pas déjà l'URL de l'avatar
        if (photoUrlValue && !photoUrlValue.includes('ui-avatars.com') && photoUrlValue.trim() !== '') {
          console.log('AdminReview: Setting photo URL from profile.photo_url:', photoUrlValue)
          setPhotoUrl(photoUrlValue)
          setPhotoError(false)
          return
        }
      }

      // Si photo_url n'existe pas ou est invalide, chercher le document PROFILE_PHOTO
      console.log('AdminReview: photo_url not found or invalid, searching for PROFILE_PHOTO document...')
      try {
        const docs = await documentApi.getCandidateDocuments(candidateData.id)
        const photoDoc = docs
          .filter(doc => 
            (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER') &&
            !doc.deleted_at
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        
        if (photoDoc) {
          const serveUrl = documentApi.getDocumentServeUrl(photoDoc.id)
          console.log('AdminReview: Found PROFILE_PHOTO document, using serve URL:', serveUrl)
          setPhotoUrl(serveUrl)
          setPhotoError(false)
        } else {
          console.log('AdminReview: No PROFILE_PHOTO document found')
          setPhotoUrl(null)
        }
      } catch (error) {
        console.error('AdminReview: Error loading photo document:', error)
        setPhotoUrl(null)
      }
    }

    loadPhotoUrl()
  }, [candidateData?.id, candidateData?.photo_url])


  const handleValidationSuccess = async () => {
    // Attendre un peu pour laisser le backend traiter la validation
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Forcer le rafraîchissement immédiat après validation
    await fetchCandidateData()
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => fetchCandidateData()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
                <Link to="/admin/dashboard">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour au dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const defaultAvatar = candidateData ? generateAvatarUrl(candidateData.first_name, candidateData.last_name) : ''
  
  // Déterminer quelle photo afficher - utiliser photoUrl seulement si elle existe et n'est pas l'avatar
  const displayPhoto = (photoUrl && !photoError && !photoUrl.includes('ui-avatars.com')) 
    ? photoUrl 
    : defaultAvatar
  const fullName = candidateData ? `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim() || 'Candidat' : 'Chargement...'
  const location = candidateData ? [candidateData.city, candidateData.country].filter(Boolean).join(', ') : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header compact avec navigation */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Retour
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-xs text-muted-foreground">
              <Link to="/admin/dashboard" className="hover:text-primary">Dashboard</Link>
              <ChevronRight className="w-3 h-3 inline mx-1" />
              <span>Validation #{candidateId}</span>
            </div>
            {candidateData && (
              <Badge className={`${STATUS_COLORS[candidateData.status] || STATUS_COLORS.DRAFT} ml-auto text-xs px-2 py-0.5`}>
                {STATUS_LABELS[candidateData.status] || candidateData.status}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchCandidateData()}
              className="h-8 px-2 text-xs"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Header avec gradient (comme CandidateDetailPage) */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start gap-4">
            {/* Photo de profil avec badge de score */}
            <div className="flex-shrink-0 relative">
              <div className="relative">
                <img
                  src={displayPhoto}
                  alt={fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-xl"
                  onError={(e) => {
                    if (!photoError && e.target.src !== defaultAvatar) {
                      setPhotoError(true)
                      e.target.src = defaultAvatar
                    } else if (e.target.src !== defaultAvatar) {
                      e.target.src = defaultAvatar
                    }
                  }}
                  onLoad={() => {
                    if (photoError && photoUrl) {
                      setPhotoError(false)
                    }
                  }}
                />
                {candidateData?.status === 'VALIDATED' && candidateData?.is_verified && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-lg z-10">
                    <CheckCircle2 className="h-4 w-4 text-[#226D68]" />
                  </div>
                )}
                
                {/* Badge de score */}
                {candidateData?.admin_score && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#e76f51] text-white rounded-full px-2.5 py-1 shadow-xl flex items-center gap-1 border-2 border-white z-10">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs font-bold whitespace-nowrap">
                      {candidateData.admin_score.toFixed(1)}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Informations principales */}
            <div className="flex-1 text-white min-w-0">
              <h1 className="text-2xl font-bold mb-1 truncate">{fullName}</h1>
              
              {candidateData?.profile_title && (
                <p className="text-base text-white/90 mb-3 font-medium truncate">{candidateData.profile_title}</p>
              )}
              
              {/* Informations de contact compactes */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {location && (
                  <div className="flex items-center gap-1.5 text-white/80">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                )}
                {candidateData?.total_experience !== undefined && (
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{candidateData.total_experience} an{candidateData.total_experience > 1 ? 's' : ''}</span>
                  </div>
                )}
                {candidateData?.email && (
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{candidateData.email}</span>
                  </div>
                )}
                {candidateData?.phone && (
                  <div className="flex items-center gap-1.5 text-white/80">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{candidateData.phone}</span>
                  </div>
                )}
                {candidateData?.completion_percentage !== undefined && (
                  <div className="flex items-center gap-1.5 text-white/80">
                    <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{candidateData.completion_percentage.toFixed(0)}% complété</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Avis Expert en avant - Card mise en évidence */}
        {candidateData?.admin_report && Object.keys(candidateData.admin_report).length > 0 && (
          <Card className="mb-4 sm:mb-6 border-l-4 border-l-[#226D68] shadow-lg bg-gradient-to-r from-white to-[#226D68]/5">
            <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                <div className="p-2 bg-[#226D68]/10 rounded-lg flex-shrink-0">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[#226D68]" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-anthracite">Avis de l'Expert</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">Évaluation professionnelle du profil</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {candidateData.admin_report.overall_score !== undefined && (
                  <div className="bg-gradient-to-br from-[#226D68]/10 to-[#226D68]/5 rounded-lg p-4 border border-[#226D68]/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Note globale</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(candidateData.admin_report.overall_score)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-bold text-xl text-gray-anthracite">
                        {candidateData.admin_report.overall_score.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                )}
                
                {candidateData.admin_report.technical_skills_rating !== undefined && (
                  <div className="bg-blue-deep/5 rounded-lg p-4 border border-blue-deep/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Compétences techniques</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < candidateData.admin_report.technical_skills_rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-bold text-lg text-gray-anthracite">
                        {candidateData.admin_report.technical_skills_rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {candidateData.admin_report.soft_skills_rating !== undefined && (
                  <div className="bg-blue-deep/5 rounded-lg p-4 border border-blue-deep/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Compétences comportementales</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < candidateData.admin_report.soft_skills_rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-bold text-lg text-gray-anthracite">
                        {candidateData.admin_report.soft_skills_rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {candidateData.admin_report.communication_rating !== undefined && (
                  <div className="bg-blue-deep/5 rounded-lg p-4 border border-blue-deep/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Communication</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < candidateData.admin_report.communication_rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-bold text-lg text-gray-anthracite">
                        {candidateData.admin_report.communication_rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {candidateData.admin_report.motivation_rating !== undefined && (
                  <div className="bg-blue-deep/5 rounded-lg p-4 border border-blue-deep/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Motivation</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < candidateData.admin_report.motivation_rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-bold text-lg text-gray-anthracite">
                        {candidateData.admin_report.motivation_rating}/5
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {candidateData.admin_report.soft_skills_tags && candidateData.admin_report.soft_skills_tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Tags de compétences comportementales</p>
                  <div className="flex flex-wrap gap-2">
                    {candidateData.admin_report.soft_skills_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-[#226D68]/10 text-[#226D68] border-[#226D68]/20">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {candidateData.admin_report.summary && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-anthracite mb-2">Résumé de l'évaluation</p>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{candidateData.admin_report.summary}</p>
                </div>
              )}

              {(candidateData.admin_report.interview_notes || candidateData.admin_report.recommendations) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                  {candidateData.admin_report.interview_notes && (
                    <div>
                      <p className="text-sm font-semibold text-gray-anthracite mb-2">Notes d'entretien</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{candidateData.admin_report.interview_notes}</p>
                    </div>
                  )}
                  {candidateData.admin_report.recommendations && (
                    <div>
                      <p className="text-sm font-semibold text-gray-anthracite mb-2">Recommandations</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{candidateData.admin_report.recommendations}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs pour le reste du contenu */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-white mb-3 h-9">
            <TabsTrigger value="profile" className="text-xs px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <User className="w-3.5 h-3.5 mr-1.5" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="text-xs px-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Évaluation
            </TabsTrigger>
          </TabsList>

          {/* Contenu Profile */}
          <TabsContent value="profile" className="mt-3 space-y-3">
            <CandidateDataView data={candidateData} />
          </TabsContent>

          {/* Contenu Documents */}
          <TabsContent value="documents" className="mt-3">
            <Card className="shadow-md min-h-[400px]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-purple-50 to-purple-100/50 border-b">
                <CardTitle className="text-sm flex items-center gap-1.5 text-purple-900">
                  <FileText className="w-4 h-4" />
                  Documents du Candidat
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 text-purple-700">
                  {documents.length > 0 
                    ? `${documents.length} document(s) disponible(s)`
                    : 'Aucun document disponible'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[400px]">
                  <DocumentViewer
                    documents={documents}
                    selectedDocument={selectedDocument}
                    onSelectDocument={setSelectedDocument}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenu Évaluation */}
          <TabsContent value="evaluation" className="mt-3">
            <Card className="shadow-md border-l-4 border-l-[#226D68]">
              <CardHeader className="py-2 px-3 bg-gradient-to-r from-[#E8F4F3] to-[#D1E9E7]/50 border-b border-[#B8DDD9]">
                <CardTitle className="text-sm flex items-center gap-1.5 text-[#1a5a55]">
                  <CheckCircle2 className="w-4 h-4" />
                  Grille d'Évaluation et Validation
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 text-[#1a5a55]">
                  Remplissez cette grille pour valider ou rejeter le profil
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <EvaluationForm
                  candidateId={candidateId}
                  candidateData={candidateData}
                  onSuccess={handleValidationSuccess}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
