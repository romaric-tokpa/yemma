import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import CandidateDataView from '@/components/admin/CandidateDataView'
import DocumentViewer from '@/components/admin/DocumentViewer'
import EvaluationForm from '@/components/admin/EvaluationForm'
import { candidateApi, documentApi } from '@/services/api'
import { 
  Loader2, AlertCircle, RefreshCw, ArrowLeft, 
  User, Mail, Phone, MapPin, Briefcase, Award,
  ChevronRight, Calendar, FileText, CheckCircle2
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
  VALIDATED: 'bg-green-100 text-green-800 border-green-200',
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
  const [refreshKey, setRefreshKey] = useState(0) // Clé pour forcer le rechargement

  const fetchCandidateData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Récupérer les données du candidat depuis Candidate Service
        const profile = await candidateApi.getProfile(candidateId)
        setCandidateData(profile)

        // Récupérer les documents depuis Document Service (optionnel - ne pas bloquer si ça échoue)
        try {
          const docs = await documentApi.getCandidateDocuments(candidateId)
          // Générer les URLs de visualisation pour chaque document
          const docsWithUrls = await Promise.all(
            docs.map(async (doc) => {
              try {
                const viewData = await documentApi.getDocumentViewUrl(doc.id)
                return { ...doc, viewUrl: viewData.view_url }
              } catch (err) {
                console.error(`Error getting view URL for document ${doc.id}:`, err)
                return { ...doc, viewUrl: null }
              }
            })
          )
          setDocuments(docsWithUrls.filter(doc => doc.viewUrl))
          if (docsWithUrls.length > 0 && docsWithUrls[0].viewUrl) {
            setSelectedDocument(docsWithUrls[0])
          }
        } catch (docError) {
          console.warn('Erreur lors du chargement des documents (non bloquant):', docError)
          // Ne pas bloquer l'affichage si les documents ne peuvent pas être chargés
          setDocuments([])
        }
      } catch (err) {
        console.error('Error fetching candidate data:', err)
        console.error('Full error object:', {
          code: err.code,
          message: err.message,
          response: err.response,
          config: err.config,
        })
        
        // Messages d'erreur plus détaillés
        let errorMessage = 'Erreur lors du chargement des données du candidat'
        
        if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
          const apiUrl = err.config?.url || 'URL inconnue'
          const baseUrl = err.config?.baseURL || 'Base URL inconnue'
          errorMessage = `Erreur réseau : Impossible de se connecter au serveur.\n\nDétails techniques:\n- URL: ${baseUrl}${apiUrl}\n- Vérifiez que le service candidate est démarré: docker-compose ps candidate\n- Vérifiez les logs: docker-compose logs candidate --tail=50\n- Vérifiez que nginx est accessible: curl http://localhost/health`
        } else if (err.response?.status === 401) {
          errorMessage = 'Non autorisé : Votre session a expiré. Veuillez vous reconnecter.'
        } else if (err.response?.status === 403) {
          errorMessage = 'Accès refusé : Vous n\'avez pas les permissions nécessaires pour voir ce profil.'
        } else if (err.response?.status === 404) {
          errorMessage = `Profil non trouvé : Aucun profil trouvé avec l'ID ${candidateId}.`
        } else if (err.response?.status === 502 || err.response?.status === 503) {
          errorMessage = 'Service indisponible : Le service candidate n\'est pas accessible. Vérifiez qu\'il est démarré.'
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

  const handleValidationSuccess = async () => {
    // Attendre un court délai pour laisser le backend traiter complètement
    await new Promise(resolve => setTimeout(resolve, 500))
    // Recharger les données pour voir le nouveau statut
    setRefreshKey(prev => prev + 1)
    // Ne pas rediriger immédiatement, laisser l'utilisateur voir le nouveau statut mis à jour
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
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Erreur de chargement</CardTitle>
              </div>
              <CardDescription>
                Impossible de charger les données du candidat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-sm text-destructive">{error}</p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    // Recharger les données
                    const fetchCandidateData = async () => {
                      try {
                        setLoading(true)
                        setError(null)
                        const profile = await candidateApi.getProfile(candidateId)
                        setCandidateData(profile)
                        try {
                          const docs = await documentApi.getCandidateDocuments(candidateId)
                          const docsWithUrls = await Promise.all(
                            docs.map(async (doc) => {
                              try {
                                const viewData = await documentApi.getDocumentViewUrl(doc.id)
                                return { ...doc, viewUrl: viewData.view_url }
                              } catch (err) {
                                return { ...doc, viewUrl: null }
                              }
                            })
                          )
                          setDocuments(docsWithUrls.filter(doc => doc.viewUrl))
                        } catch (docError) {
                          setDocuments([])
                        }
                      } catch (err) {
                        setError(err.response?.data?.detail || err.message || 'Erreur lors du chargement')
                      } finally {
                        setLoading(false)
                      }
                    }
                    fetchCandidateData()
                  }}
                >
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
              
              {error.includes('502') || error.includes('503') || error.includes('indisponible') ? (
                <div className="bg-muted p-4 rounded-md space-y-2">
                  <p className="text-sm font-medium">Solution suggérée :</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Vérifiez que le service candidate est démarré : <code className="bg-background px-1 rounded">docker-compose ps</code></li>
                    <li>Redémarrez le service : <code className="bg-background px-1 rounded">docker-compose restart candidate</code></li>
                    <li>Vérifiez les logs : <code className="bg-background px-1 rounded">docker-compose logs candidate</code></li>
                  </ol>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const defaultAvatar = candidateData ? generateAvatarUrl(candidateData.first_name, candidateData.last_name) : ''
  const displayPhoto = candidateData?.photo_url || defaultAvatar
  const fullName = candidateData ? `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim() || 'Candidat' : 'Chargement...'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header avec navigation */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Link to="/admin/dashboard" className="hover:text-primary">Dashboard</Link>
                  <ChevronRight className="w-4 h-4" />
                  <span>Validation de profil</span>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-foreground font-medium">{candidateId}</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">Validation de Profil Candidat</h1>
              </div>
            </div>
            {candidateData && (
              <Badge className={`${STATUS_COLORS[candidateData.status] || STATUS_COLORS.DRAFT} border`}>
                {STATUS_LABELS[candidateData.status] || candidateData.status}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Carte de profil résumé */}
        {candidateData && (
          <Card className="mb-6 shadow-lg border-2">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Photo de profil */}
                <div className="flex-shrink-0">
                  <img
                    src={displayPhoto}
                    alt={fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                    onError={(e) => {
                      if (e.target.src !== defaultAvatar) {
                        e.target.src = defaultAvatar
                      }
                    }}
                  />
                </div>

                {/* Informations principales */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">{fullName}</h2>
                      {candidateData.profile_title && (
                        <p className="text-lg text-muted-foreground mb-1">{candidateData.profile_title}</p>
                      )}
                      {candidateData.professional_summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {candidateData.professional_summary}
                        </p>
                      )}
                    </div>
                    {candidateData.completion_percentage !== undefined && (
                      <div className="flex-shrink-0 ml-4 text-right">
                        <div className="text-sm text-muted-foreground mb-1">Complétion</div>
                        <div className="text-2xl font-bold text-primary">
                          {candidateData.completion_percentage.toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Métadonnées rapides */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    {candidateData.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{candidateData.email}</span>
                      </div>
                    )}
                    {candidateData.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{candidateData.phone}</span>
                      </div>
                    )}
                    {(candidateData.city || candidateData.country) && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {[candidateData.city, candidateData.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {candidateData.total_experience !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {candidateData.total_experience} an{candidateData.total_experience > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Layout principal avec Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil Complet
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Évaluation
            </TabsTrigger>
          </TabsList>

          {/* Contenu Profile */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informations Détaillées du Candidat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CandidateDataView data={candidateData} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenu Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="shadow-lg min-h-[600px]">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents du Candidat
                </CardTitle>
                <CardDescription>
                  {documents.length > 0 
                    ? `${documents.length} document(s) disponible(s)`
                    : 'Aucun document disponible'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
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
          <TabsContent value="evaluation" className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <CheckCircle2 className="w-5 h-5" />
                  Grille d'Évaluation et Validation
                </CardTitle>
                <CardDescription className="text-green-700">
                  Remplissez cette grille pour valider ou rejeter le profil du candidat
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
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

