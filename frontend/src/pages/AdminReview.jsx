/**
 * Page de revue/validation du profil candidat par l'administrateur.
 * Affiche le profil complet, les documents et le formulaire d'évaluation.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import CandidateDataView from '@/components/admin/CandidateDataView'
import DocumentViewer from '@/components/admin/DocumentViewer'
import EvaluationForm from '@/components/admin/EvaluationForm'
import { candidateApi, documentApi, adminApi } from '@/services/api'
import { formatDateTime } from '@/utils/dateUtils'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Loader2, AlertCircle, RefreshCw, ChevronRight,
  User, Mail, Phone, MapPin, Briefcase, FileText, CheckCircle2, Star,
  Clock, Sparkles, ArrowLeft, Archive, ArchiveRestore,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-[#6b7280] border-gray-200',
  SUBMITTED: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  VALIDATED: 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30',
  REJECTED: 'bg-[#e76f51]/15 text-[#c04a2f] border-[#e76f51]/30',
  ARCHIVED: 'bg-gray-100 text-[#6b7280] border-gray-200',
}

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  IN_REVIEW: 'En cours',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
}

const pathToTab = (path) => {
  if (path.endsWith('/documents')) return 'documents'
  if (path.endsWith('/evaluation')) return 'evaluation'
  return 'profile'
}

export default function AdminReview({ defaultTab }) {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [candidateData, setCandidateData] = useState(null)
  const [documents, setDocuments] = useState([])
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [photoError, setPhotoError] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [unarchiveLoading, setUnarchiveLoading] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false)
  const activeTab = pathToTab(location.pathname) || defaultTab || 'profile'

  const goToTab = (tab) => {
    if (tab === 'profile') navigate(`/admin/review/${candidateId}`)
    else navigate(`/admin/review/${candidateId}/${tab}`)
  }

  const fetchCandidateData = async () => {
    try {
      setLoading(true)
      setError(null)
      const profile = await candidateApi.getProfile(candidateId)
      setCandidateData(profile)

      try {
        const docs = await documentApi.getCandidateDocuments(candidateId)
        const activeDocs = docs.filter(doc => !doc.deleted_at)
        const filteredDocs = activeDocs.filter((doc) => {
          if (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'COMPANY_LOGO') return false
          if (doc.document_type === 'OTHER' && doc.mime_type?.startsWith('image/')) return false
          return true
        })
        const docsWithUrls = filteredDocs.map((doc) => ({
          ...doc,
          viewUrl: documentApi.getDocumentServeUrl(doc.id),
          originalFilename: doc.original_filename,
          mimeType: doc.mime_type,
          documentType: doc.document_type,
          fileSize: doc.file_size,
        }))
        setDocuments(docsWithUrls)
        if (docsWithUrls.length > 0 && (!selectedDocument || !docsWithUrls.find(d => d.id === selectedDocument.id))) {
          setSelectedDocument(docsWithUrls[0])
        } else if (docsWithUrls.length === 0) {
          setSelectedDocument(null)
        }
      } catch (docError) {
        setDocuments([])
        setSelectedDocument(null)
      }
    } catch (err) {
      let errorMessage = 'Erreur lors du chargement des données du candidat'
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') errorMessage = 'Erreur réseau.'
      else if (err.response?.status === 401) errorMessage = 'Session expirée. Reconnectez-vous.'
      else if (err.response?.status === 403) errorMessage = 'Accès refusé.'
      else if (err.response?.status === 404) errorMessage = `Profil non trouvé (ID ${candidateId}).`
      else if (err.response?.status === 502 || err.response?.status === 503) errorMessage = 'Service indisponible.'
      else if (err.response?.data?.detail) errorMessage = err.response.data.detail
      else if (err.message) errorMessage = err.message
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (candidateId) fetchCandidateData()
  }, [candidateId, refreshKey])

  useEffect(() => {
    if (!candidateData?.id) {
      setPhotoUrl(null)
      return
    }
    if (candidateData.photo_url) {
      let val = candidateData.photo_url
      if (val?.startsWith('/')) {
        const match = val.match(/\/api\/v1\/documents\/serve\/(\d+)/)
        if (match?.[1]) val = documentApi.getDocumentServeUrl(parseInt(match[1]))
      }
      if (val && !val.includes('ui-avatars.com') && val.trim()) {
        setPhotoUrl(val)
        setPhotoError(false)
        return
      }
    }
    documentApi.getCandidateDocuments(candidateData.id).then((docs) => {
      const photoDoc = docs
        .filter(doc => (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER') && !doc.deleted_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      setPhotoUrl(photoDoc ? documentApi.getDocumentServeUrl(photoDoc.id) : null)
      setPhotoError(false)
    }).catch(() => setPhotoUrl(null))
  }, [candidateData?.id, candidateData?.photo_url])

  const handleValidationSuccess = async () => {
    await new Promise(r => setTimeout(r, 1000))
    await fetchCandidateData()
    setRefreshKey(k => k + 1)
  }

  const performArchive = async () => {
    setArchiveDialogOpen(false)
    try {
      setArchiveLoading(true)
      await adminApi.archiveProfile(candidateId)
      navigate('/admin/validation')
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Erreur lors de l\'archivage'
      setError(msg)
    } finally {
      setArchiveLoading(false)
    }
  }

  const performUnarchive = async () => {
    setUnarchiveDialogOpen(false)
    try {
      setUnarchiveLoading(true)
      await adminApi.unarchiveProfile(candidateId)
      await fetchCandidateData()
      setRefreshKey(k => k + 1)
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Erreur lors du déarchivage'
      setError(msg)
    } finally {
      setUnarchiveLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-10 h-10 animate-spin text-[#226D68]" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-w-0 w-full">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-semibold text-red-800">Erreur de chargement</h2>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" size="sm" onClick={fetchCandidateData} className="border-red-300 text-red-700 hover:bg-red-100">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Réessayer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/validation')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const defaultAvatar = candidateData ? generateAvatarUrl(candidateData.first_name, candidateData.last_name) : ''
  const displayPhoto = (photoUrl && !photoError && !photoUrl.includes('ui-avatars.com')) ? photoUrl : defaultAvatar
  const fullName = candidateData ? `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim() || 'Candidat' : ''
    const candidateLocation = candidateData ? [candidateData.city, candidateData.country].filter(Boolean).join(', ') : ''

  return (
    <AdminLayout>
      <div className="min-w-0 w-full">
        {/* Fil d'Ariane */}
        <nav className="flex items-center gap-2 text-sm text-[#6b7280] mb-6">
          <Link to="/admin/dashboard" className="hover:text-[#226D68]">Dashboard</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/admin/validation" className="hover:text-[#226D68]">Validation</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#2C2C2C] font-medium truncate">{fullName || `#${candidateId}`}</span>
        </nav>

        {/* Hero profil */}
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-gradient-to-br from-[#226D68] to-[#1a5a55] overflow-hidden shadow-lg mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="relative shrink-0">
                <img
                  src={displayPhoto}
                  alt={fullName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-white/30 shadow-xl"
                  onError={(e) => {
                    if (!photoError && e.target.src !== defaultAvatar) {
                      setPhotoError(true)
                      e.target.src = defaultAvatar
                    } else {
                      e.target.src = defaultAvatar
                    }
                  }}
                />
                {candidateData?.status === 'VALIDATED' && candidateData?.is_verified && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-lg">
                    <CheckCircle2 className="h-4 w-4 text-[#226D68]" />
                  </div>
                )}
                {candidateData?.admin_score != null && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#e76f51] text-white rounded-full px-2 py-0.5 text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {candidateData.admin_score.toFixed(1)}/5
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{fullName}</h1>
                  <Badge className={`text-xs font-medium ${STATUS_COLORS[candidateData?.status] || STATUS_COLORS.DRAFT}`}>
                    {STATUS_LABELS[candidateData?.status] || candidateData?.status}
                  </Badge>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchCandidateData}
                      disabled={loading}
                      className="h-8 text-white/90 hover:text-white hover:bg-white/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5" />
                      Actualiser
                    </Button>
                    {candidateData?.status === 'ARCHIVED' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUnarchiveDialogOpen(true)}
                        disabled={unarchiveLoading}
                        className="h-8 text-white/90 hover:text-white hover:bg-white/10"
                        title="Déarchiver le profil (restaure dans la liste de validation et la CVthèque)"
                      >
                        {unarchiveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArchiveRestore className="h-4 w-4 mr-1.5" />}
                        Déarchiver
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArchiveDialogOpen(true)}
                        disabled={archiveLoading}
                        className="h-8 text-white/90 hover:text-white hover:bg-white/10"
                        title="Archiver le profil"
                      >
                        {archiveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4 mr-1.5" />}
                        Archiver
                      </Button>
                    )}
                  </div>
                </div>
                {candidateData?.profile_title && (
                  <p className="text-white/95 text-sm sm:text-base mb-3">{candidateData.profile_title}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/90">
                  {candidateLocation && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{candidateLocation}</span>}
                  {candidateData?.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{candidateData.email}</span>}
                  {candidateData?.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{candidateData.phone}</span>}
                  {candidateData?.total_experience != null && (
                    <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{candidateData.total_experience} an{candidateData.total_experience > 1 ? 's' : ''}</span>
                  )}
                  {candidateData?.completion_percentage != null && (
                    <span>{candidateData.completion_percentage.toFixed(0)}% complété</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dates et historique */}
        {(candidateData?.created_at || candidateData?.submitted_at || candidateData?.validated_at || candidateData?.rejected_at) && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 mb-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2C2C2C] mb-3">
              <Clock className="h-4 w-4 text-[#226D68]" />
              Historique
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {candidateData.created_at && (
                <div>
                  <p className="text-xs text-[#6b7280] font-medium">Inscription</p>
                  <p className="text-sm font-medium text-[#2C2C2C] mt-0.5">{formatDateTime(candidateData.created_at)}</p>
                </div>
              )}
              {candidateData.submitted_at && (
                <div>
                  <p className="text-xs text-[#6b7280] font-medium">Soumission</p>
                  <p className="text-sm font-medium text-[#2C2C2C] mt-0.5">{formatDateTime(candidateData.submitted_at)}</p>
                </div>
              )}
              {candidateData.validated_at && (
                <div>
                  <p className="text-xs text-[#6b7280] font-medium">Validation</p>
                  <p className="text-sm font-medium text-[#1a5a55] mt-0.5">{formatDateTime(candidateData.validated_at)}</p>
                </div>
              )}
              {candidateData.rejected_at && (
                <div>
                  <p className="text-xs text-[#6b7280] font-medium">Rejet</p>
                  <p className="text-sm font-medium text-[#c04a2f] mt-0.5">{formatDateTime(candidateData.rejected_at)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Avis Expert */}
        {candidateData?.admin_report && Object.keys(candidateData.admin_report).length > 0 && (
          <div className="rounded-xl border border-[#226D68]/30 bg-gradient-to-r from-white to-[#E8F4F3]/50 p-4 sm:p-5 mb-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2C2C2C] mb-4">
              <Sparkles className="h-4 w-4 text-[#226D68]" />
              Avis de l&apos;Expert
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {candidateData.admin_report.overall_score !== undefined && (
                <Badge className="bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30">
                  <Star className="h-3 w-3 fill-current mr-1" />
                  Globale {candidateData.admin_report.overall_score.toFixed(1)}/5
                </Badge>
              )}
              {candidateData.admin_report.technical_skills_rating !== undefined && (
                <Badge variant="outline" className="border-[#226D68]/30 text-[#1a5a55]">Technique {candidateData.admin_report.technical_skills_rating}/5</Badge>
              )}
              {candidateData.admin_report.soft_skills_rating !== undefined && (
                <Badge variant="outline" className="border-[#226D68]/30 text-[#1a5a55]">Soft {candidateData.admin_report.soft_skills_rating}/5</Badge>
              )}
              {candidateData.admin_report.communication_rating !== undefined && (
                <Badge variant="outline" className="border-[#226D68]/30 text-[#1a5a55]">Com. {candidateData.admin_report.communication_rating}/5</Badge>
              )}
              {candidateData.admin_report.motivation_rating !== undefined && (
                <Badge variant="outline" className="border-[#226D68]/30 text-[#1a5a55]">Motiv. {candidateData.admin_report.motivation_rating}/5</Badge>
              )}
            </div>
            {candidateData.admin_report.soft_skills_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {candidateData.admin_report.soft_skills_tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-[#226D68]/20 text-[#1a5a55]">{tag}</Badge>
                ))}
              </div>
            )}
            {candidateData.admin_report.summary && (
              <p className="text-sm text-[#2C2C2C] whitespace-pre-wrap leading-relaxed">{candidateData.admin_report.summary}</p>
            )}
            {(candidateData.admin_report.interview_notes || candidateData.admin_report.recommendations) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                {candidateData.admin_report.interview_notes && (
                  <div>
                    <p className="text-xs font-semibold text-[#6b7280] mb-1">Notes d&apos;entretien</p>
                    <p className="text-sm text-[#2C2C2C] whitespace-pre-wrap">{candidateData.admin_report.interview_notes}</p>
                  </div>
                )}
                {candidateData.admin_report.recommendations && (
                  <div>
                    <p className="text-xs font-semibold text-[#6b7280] mb-1">Recommandations</p>
                    <p className="text-sm text-[#2C2C2C] whitespace-pre-wrap">{candidateData.admin_report.recommendations}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs — routes dédiées */}
        <Tabs value={activeTab} onValueChange={goToTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl mb-4 h-11">
            <TabsTrigger value="profile" className="rounded-lg px-4 data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-[#6b7280]">
              <User className="w-4 h-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg px-4 data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-[#6b7280]">
              <FileText className="w-4 h-4 mr-2" />
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="evaluation" className="rounded-lg px-4 data-[state=active]:bg-[#226D68] data-[state=active]:text-white data-[state=inactive]:text-[#6b7280]">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Évaluation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <CandidateDataView data={candidateData} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
                  <FileText className="h-5 w-5 text-[#226D68]" />
                  Documents
                </h3>
                <p className="text-sm text-[#6b7280] mt-0.5">
                  {documents.length > 0 ? `${documents.length} document${documents.length !== 1 ? 's' : ''} déposé${documents.length !== 1 ? 's' : ''}` : 'Aucun document'}
                </p>
              </div>
              <div className="min-h-[480px]">
                <DocumentViewer
                  documents={documents}
                  selectedDocument={selectedDocument}
                  onSelectDocument={setSelectedDocument}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evaluation" className="mt-0">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#E8F4F3]/50">
                <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
                  <CheckCircle2 className="h-5 w-5 text-[#226D68]" />
                  Grille d&apos;évaluation
                </h3>
                <p className="text-sm text-[#6b7280] mt-0.5">
                  {candidateData?.status === 'VALIDATED'
                    ? 'Modifier l\'évaluation et mettre à jour avec les nouvelles informations du candidat'
                    : 'Valider ou rejeter le profil'}
                </p>
                {candidateData?.status === 'VALIDATED' && (
                  <p className="text-xs text-[#6b7280] mt-2 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Cliquez sur &quot;Actualiser&quot; en haut pour recharger les dernières modifications du candidat avant de mettre à jour l&apos;évaluation.
                  </p>
                )}
              </div>
              <div className="p-4 sm:p-6">
                <EvaluationForm
                  candidateId={candidateId}
                  candidateData={candidateData}
                  onSuccess={handleValidationSuccess}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modale confirmation archivage */}
        <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden border-[#e5e7eb] shadow-xl rounded-2xl">
            <div className="p-5 pr-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#226D68]/10 flex items-center justify-center flex-shrink-0">
                  <Archive className="w-6 h-6 text-[#226D68]" />
                </div>
                <DialogHeader className="flex-1 p-0 space-y-2">
                  <DialogTitle className="text-lg font-semibold text-[#2C2C2C]">
                    Archiver ce profil ?
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#6b7280] leading-relaxed">
                    Le profil sera retiré de la liste de validation et de l&apos;index de recherche (CVthèque). Vous pourrez le déarchiver ultérieurement.
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
            <DialogFooter className="flex flex-row-reverse gap-2 p-4 pt-0 border-t border-[#e5e7eb]">
              <Button
                size="sm"
                onClick={performArchive}
                disabled={archiveLoading}
                className="h-9 px-4 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-medium flex items-center gap-2"
              >
                {archiveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Archiver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveDialogOpen(false)}
                disabled={archiveLoading}
                className="h-9 px-4 border-[#e5e7eb] text-[#2C2C2C] hover:bg-[#F4F6F8] text-sm"
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modale confirmation déarchivage */}
        <Dialog open={unarchiveDialogOpen} onOpenChange={setUnarchiveDialogOpen}>
          <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden border-[#e5e7eb] shadow-xl rounded-2xl">
            <div className="p-5 pr-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#226D68]/10 flex items-center justify-center flex-shrink-0">
                  <ArchiveRestore className="w-6 h-6 text-[#226D68]" />
                </div>
                <DialogHeader className="flex-1 p-0 space-y-2">
                  <DialogTitle className="text-lg font-semibold text-[#2C2C2C]">
                    Déarchiver ce profil ?
                  </DialogTitle>
                  <DialogDescription className="text-sm text-[#6b7280] leading-relaxed">
                    Le profil sera restauré dans la liste de validation et l&apos;index de recherche (CVthèque).
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
            <DialogFooter className="flex flex-row-reverse gap-2 p-4 pt-0 border-t border-[#e5e7eb]">
              <Button
                size="sm"
                onClick={performUnarchive}
                disabled={unarchiveLoading}
                className="h-9 px-4 bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-medium flex items-center gap-2"
              >
                {unarchiveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Déarchiver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUnarchiveDialogOpen(false)}
                disabled={unarchiveLoading}
                className="h-9 px-4 border-[#e5e7eb] text-[#2C2C2C] hover:bg-[#F4F6F8] text-sm"
              >
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
