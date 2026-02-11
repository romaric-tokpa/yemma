import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import CandidateDataView from '@/components/admin/CandidateDataView'
import DocumentViewer from '@/components/admin/DocumentViewer'
import EvaluationForm from '@/components/admin/EvaluationForm'
import { candidateApi, documentApi } from '@/services/api'
import { formatDateTime } from '@/utils/dateUtils'
import { 
  Loader2, AlertCircle, RefreshCw, ArrowLeft, 
  User, Mail, Phone, MapPin, Briefcase, Award,
  ChevronRight, Calendar, FileText, CheckCircle2, Star,
  GraduationCap, Target, TrendingUp, Sparkles, Clock
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
    <div className="min-h-screen bg-gray-light">
      {/* Barre supérieure - charte */}
      <div className="bg-white border-b border-border sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-gray-anthracite hover:text-[#226D68]">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Retour
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-xs text-muted-foreground">
              <Link to="/admin/dashboard" className="hover:text-[#226D68] text-gray-anthracite">Dashboard</Link>
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
              className="h-8 px-2 text-xs text-gray-anthracite hover:text-[#226D68]"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Header candidat - bandeau charte vert */}
      <div className="bg-gradient-to-r from-[#226D68] to-[#1a5a55] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 relative">
              <img
                src={displayPhoto}
                alt={fullName}
                className="w-20 h-20 rounded-full object-cover border-2 border-white/40 shadow-lg"
                onError={(e) => {
                  if (!photoError && e.target.src !== defaultAvatar) {
                    setPhotoError(true)
                    e.target.src = defaultAvatar
                  } else if (e.target.src !== defaultAvatar) {
                    e.target.src = defaultAvatar
                  }
                }}
                onLoad={() => {
                  if (photoError && photoUrl) setPhotoError(false)
                }}
              />
              {candidateData?.status === 'VALIDATED' && candidateData?.is_verified && (
                <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow z-10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#226D68]" />
                </div>
              )}
              {candidateData?.admin_score != null && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#e76f51] text-white rounded-full px-2 py-0.5 shadow flex items-center gap-0.5 border border-white z-10">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <span className="text-[10px] font-bold">{candidateData.admin_score.toFixed(1)}/5</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-xl sm:text-2xl font-bold truncate">{fullName}</h1>
              {candidateData?.profile_title && (
                <p className="text-sm text-white/90 truncate mb-2">{candidateData.profile_title}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
                {location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {location}
                  </span>
                )}
                {location && (candidateData?.email || candidateData?.phone) && <span className="text-white/50">·</span>}
                {candidateData?.email && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    {candidateData.email}
                  </span>
                )}
                {candidateData?.email && candidateData?.phone && <span className="text-white/50">·</span>}
                {candidateData?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    {candidateData.phone}
                  </span>
                )}
                {(location || candidateData?.email || candidateData?.phone) && (candidateData?.total_experience != null || candidateData?.completion_percentage != null) && <span className="text-white/50">·</span>}
                {candidateData?.total_experience != null && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                    {candidateData.total_experience} an{candidateData.total_experience > 1 ? 's' : ''}
                  </span>
                )}
                {candidateData?.completion_percentage != null && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                    {candidateData.completion_percentage.toFixed(0)}% complété
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Dates et historique du profil */}
        {(candidateData?.created_at || candidateData?.updated_at || candidateData?.submitted_at || candidateData?.validated_at || candidateData?.rejected_at) && (
          <Card className="mb-4 border border-border overflow-hidden">
            <CardHeader className="py-2.5 px-4 border-b border-border bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-anthracite">
                <Clock className="h-4 w-4 text-[#226D68]" />
                Dates et historique
              </CardTitle>
              <CardDescription className="text-xs">Inscription, modifications et décision admin (date et heure).</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {candidateData.created_at && (
                  <div>
                    <dt className="text-muted-foreground font-medium">Inscription</dt>
                    <dd className="text-gray-anthracite font-medium mt-0.5">{formatDateTime(candidateData.created_at)}</dd>
                  </div>
                )}
                {candidateData.updated_at && (
                  <div>
                    <dt className="text-muted-foreground font-medium">Dernière modification</dt>
                    <dd className="text-gray-anthracite font-medium mt-0.5">{formatDateTime(candidateData.updated_at)}</dd>
                  </div>
                )}
                {candidateData.submitted_at && (
                  <div>
                    <dt className="text-muted-foreground font-medium">Soumission</dt>
                    <dd className="text-gray-anthracite font-medium mt-0.5">{formatDateTime(candidateData.submitted_at)}</dd>
                  </div>
                )}
                {candidateData.validated_at && (
                  <div>
                    <dt className="text-muted-foreground font-medium">Validation (admin)</dt>
                    <dd className="text-[#1a5a55] font-medium mt-0.5">{formatDateTime(candidateData.validated_at)}</dd>
                  </div>
                )}
                {candidateData.rejected_at && (
                  <div>
                    <dt className="text-muted-foreground font-medium">Rejet (admin)</dt>
                    <dd className="text-[#c04a2f] font-medium mt-0.5">{formatDateTime(candidateData.rejected_at)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Avis Expert - compact (ligne de pastilles + texte) */}
        {candidateData?.admin_report && Object.keys(candidateData.admin_report).length > 0 && (
          <Card className="mb-4 border-l-4 border-l-[#226D68] shadow-md bg-gradient-to-r from-white to-[#226D68]/5 rounded-lg">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#226D68]/10 rounded-lg">
                  <Sparkles className="h-4 w-4 text-[#226D68]" />
                </div>
                <div>
                  <CardTitle className="font-heading text-base font-bold text-gray-anthracite">Avis de l&apos;Expert</CardTitle>
                  <p className="text-xs text-muted-foreground">Évaluation professionnelle</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              {/* Ligne de pastilles : Globale · Technique · Soft · Com. · Motiv. */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                {candidateData.admin_report.overall_score !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#226D68]/10 border border-[#226D68]/20 px-2.5 py-1 text-xs font-medium text-gray-anthracite">
                    <Star className="h-3 w-3 text-[#226D68] fill-current" />
                    Globale {candidateData.admin_report.overall_score.toFixed(1)}/5
                  </span>
                )}
                {candidateData.admin_report.technical_skills_rating !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    Technique {candidateData.admin_report.technical_skills_rating}/5
                  </span>
                )}
                {candidateData.admin_report.soft_skills_rating !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    Soft {candidateData.admin_report.soft_skills_rating}/5
                  </span>
                )}
                {candidateData.admin_report.communication_rating !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    Com. {candidateData.admin_report.communication_rating}/5
                  </span>
                )}
                {candidateData.admin_report.motivation_rating !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    Motiv. {candidateData.admin_report.motivation_rating}/5
                  </span>
                )}
              </div>
              {candidateData.admin_report.soft_skills_tags && candidateData.admin_report.soft_skills_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {candidateData.admin_report.soft_skills_tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-[#226D68]/10 text-[#1a5a55] border-[#226D68]/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {candidateData.admin_report.summary && (
                <p className="text-sm text-gray-anthracite whitespace-pre-wrap leading-relaxed mb-3">{candidateData.admin_report.summary}</p>
              )}
              {(candidateData.admin_report.interview_notes || candidateData.admin_report.recommendations) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border">
                  {candidateData.admin_report.interview_notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-anthracite mb-1">Notes d&apos;entretien</p>
                      <p className="text-sm text-gray-anthracite whitespace-pre-wrap">{candidateData.admin_report.interview_notes}</p>
                    </div>
                  )}
                  {candidateData.admin_report.recommendations && (
                    <div>
                      <p className="text-xs font-semibold text-gray-anthracite mb-1">Recommandations</p>
                      <p className="text-sm text-gray-anthracite whitespace-pre-wrap">{candidateData.admin_report.recommendations}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs - charte (primary actif, fond muted) */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted/80 mb-3 h-9 rounded-lg p-0.5">
            <TabsTrigger value="profile" className="text-xs px-3 rounded-md data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-gray-anthracite">
              <User className="w-3.5 h-3.5 mr-1.5" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs px-3 rounded-md data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-gray-anthracite">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="text-xs px-3 rounded-md data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-gray-anthracite">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Évaluation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-3 space-y-3">
            <CandidateDataView data={candidateData} />
          </TabsContent>

          <TabsContent value="documents" className="mt-3">
            <Card className="shadow-sm rounded-lg border border-border overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-border bg-[#226D68]/5">
                <CardTitle className="text-sm font-heading font-semibold text-gray-anthracite flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#226D68]" />
                  Documents du candidat
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 text-muted-foreground">
                  {documents.length > 0
                    ? 'CV et pièces justificatives pour l\'évaluation du profil.'
                    : 'Aucun document déposé.'}
                  {documents.length > 0 && ` · ${documents.length} document${documents.length !== 1 ? 's' : ''}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="min-h-[480px] flex flex-col">
                  <DocumentViewer
                    documents={documents}
                    selectedDocument={selectedDocument}
                    onSelectDocument={setSelectedDocument}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation" className="mt-3">
            <Card className="shadow-md border-l-4 border-l-[#226D68] rounded-lg">
              <CardHeader className="py-2 px-4 border-b border-border bg-[#226D68]/5">
                <CardTitle className="text-sm font-heading font-semibold text-gray-anthracite flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#226D68]" />
                  Grille d&apos;évaluation
                </CardTitle>
                <CardDescription className="text-xs mt-0.5 text-muted-foreground">
                  Valider ou rejeter le profil
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
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
