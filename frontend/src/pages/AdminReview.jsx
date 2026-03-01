/**
 * Page de revue/validation du profil candidat par l'administrateur.
 * Profil détaillé + lien vers la page d'évaluation dédiée.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import CandidateDataView from '@/components/admin/CandidateDataView'
import { candidateApi, documentApi, adminApi } from '@/services/api'
import { ROUTES } from '@/constants/routes'
import { formatDateTime } from '@/utils/dateUtils'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Loader2, AlertCircle, RefreshCw,
  Mail, Phone, MapPin, Briefcase, FileText, CheckCircle2, Star,
  Clock, ArrowLeft, Archive, ArchiveRestore, Download, MapPinned, Calendar, X, Eye, ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const formatAvailability = (v) => ({ immediate: 'Immédiate', '1_week': 'Sous 1 semaine', '2_weeks': 'Sous 2 semaines', '1_month': 'Sous 1 mois', '2_months': 'Sous 2 mois', '3_months': 'Sous 3 mois', negotiable: 'À négocier' }[v] || v || '—')

export default function AdminReview() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [candidateData, setCandidateData] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [photoError, setPhotoError] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [unarchiveLoading, setUnarchiveLoading] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState(null)

  const handleDownloadDocument = (doc) => {
    const link = document.createElement('a')
    link.href = doc.viewUrl
    link.download = doc.originalFilename || doc.original_filename || `document_${doc.id}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      } catch (docError) {
        setDocuments([])
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
  }, [candidateId])

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
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-red-800">Erreur de chargement</h2>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={fetchCandidateData} className="border-red-300 text-red-700 hover:bg-red-100">
                  <RefreshCw className="w-4 h-4 mr-2" />Réessayer
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/validation')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />Retour
                </Button>
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
  const hasHistory = candidateData?.created_at || candidateData?.submitted_at || candidateData?.validated_at || candidateData?.rejected_at

  const skills = Array.isArray(candidateData?.skills) ? candidateData.skills.slice(0, 5) : []

  return (
    <AdminLayout>
      <div className="space-y-0">

        {/* Hero section — style ProfileCVHeroIllustration */}
        <section className="relative pt-4 pb-6 sm:pb-8 overflow-hidden bg-white">
          <div className="relative max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
            {/* Breadcrumb + actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  to="/admin/validation"
                  className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#226D68] hover:bg-[#E8F4F3] transition-colors shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex items-center gap-2 text-sm min-w-0 flex-wrap">
                  <Link to="/admin/validation" className="text-[#6b7280] hover:text-[#226D68] shrink-0 transition-colors">
                    Validation
                  </Link>
                  <span className="text-gray-300 shrink-0">/</span>
                  <span className="font-semibold text-[#2C2C2C] truncate">{fullName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  asChild
                  size="sm"
                  className="h-8 px-3 text-xs bg-[#226D68] hover:bg-[#1a5a55] text-white"
                >
                  <Link to={ROUTES.ADMIN_REVIEW_EVALUATION(candidateId)}>
                    <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                    Grille d&apos;évaluation
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCandidateData}
                  disabled={loading}
                  className="h-8 px-3 text-xs border-gray-200 hover:border-[#226D68]/50 hover:bg-[#E8F4F3]/50"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Actualiser
                </Button>
                {candidateData?.status === 'ARCHIVED' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUnarchiveDialogOpen(true)}
                    disabled={unarchiveLoading}
                    className="h-8 px-3 text-xs border-gray-200 hover:border-[#226D68]/50 hover:bg-[#E8F4F3]/50"
                  >
                    {unarchiveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <ArchiveRestore className="h-3.5 w-3.5 mr-1.5" />}
                    Déarchiver
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setArchiveDialogOpen(true)}
                    disabled={archiveLoading}
                    className="h-8 px-3 text-xs border-gray-200 hover:border-gray-300 text-[#6b7280]"
                  >
                    {archiveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Archive className="h-3.5 w-3.5 mr-1.5" />}
                    Archiver
                  </Button>
                )}
              </div>
            </div>

            {/* Carte CV principale — style ProfileCVHeroIllustration */}
            <div
              className="relative bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] border border-gray-200 overflow-hidden"
              style={{ boxShadow: '0 20px 60px -15px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)' }}
            >
              {/* En-tête CV - photo + nom + badge */}
              <div className="p-5 sm:p-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-gray-100 bg-[#226D68]/10">
                      <img
                        src={displayPhoto}
                        alt={fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (!photoError && e.target.src !== defaultAvatar) {
                            setPhotoError(true)
                            e.target.src = defaultAvatar
                          } else {
                            e.target.src = defaultAvatar
                          }
                        }}
                      />
                    </div>
                    {candidateData?.status === 'VALIDATED' && candidateData?.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow border border-gray-100">
                        <CheckCircle2 className="h-4 w-4 text-[#226D68]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] font-heading leading-tight">
                      {fullName}
                    </h1>
                    {candidateData?.profile_title && (
                      <p className="text-sm sm:text-base text-[#226D68] font-medium mt-0.5">{candidateData.profile_title}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[#6b7280]">
                      {candidateData?.total_experience != null && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          {candidateData.total_experience} an{candidateData.total_experience > 1 ? 's' : ''} d&apos;expérience
                        </span>
                      )}
                      {candidateLocation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />{candidateLocation}
                        </span>
                      )}
                      {(candidateData?.job_preferences?.mobility || candidateData?.job_preferences?.willing_to_relocate) && (
                        <span className="flex items-center gap-1">
                          <MapPinned className="h-3 w-3 shrink-0" />
                          {candidateData.job_preferences.willing_to_relocate ? 'Prêt(e) à déménager' : candidateData.job_preferences.mobility}
                        </span>
                      )}
                      {candidateData?.job_preferences?.availability && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {formatAvailability(candidateData.job_preferences.availability)}
                        </span>
                      )}
                      {candidateData?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[200px]">{candidateData.email}</span>
                        </span>
                      )}
                      {candidateData?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />{candidateData.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className={`text-xs font-medium ${STATUS_COLORS[candidateData?.status] || STATUS_COLORS.DRAFT}`}>
                      {STATUS_LABELS[candidateData?.status] || candidateData?.status}
                    </Badge>
                    {candidateData?.admin_score != null && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#226D68]/10">
                        <Star className="w-4 h-4 text-[#226D68]" fill="currentColor" strokeWidth={0} />
                        <span className="text-xs sm:text-sm font-semibold text-[#226D68]">{candidateData.admin_score.toFixed(1)}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Corps du CV — résumé, compétences, documents + infos clés */}
              <div className="p-5 sm:p-6 space-y-4">
                {candidateData?.professional_summary && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#226D68]" strokeWidth={1.5} />
                      <span className="text-sm font-semibold text-[#2C2C2C]">Résumé professionnel</span>
                    </div>
                    <div
                      className="text-sm text-[#374151] leading-relaxed rounded-lg border border-gray-100 p-3 bg-[#F9FAFB]/80 rich-text-content"
                      dangerouslySetInnerHTML={{ __html: candidateData.professional_summary }}
                    />
                  </div>
                )}
                {documents.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#226D68]" strokeWidth={1.5} />
                      <span className="text-sm font-semibold text-[#2C2C2C]">Documents</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {documents.map((doc) => (
                        <div key={doc.id} className="inline-flex items-center gap-1 rounded-md overflow-hidden border border-[#226D68]/20 bg-[#226D68]/10">
                          <button
                            type="button"
                            onClick={() => setPreviewDocument(doc)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#226D68] hover:bg-[#226D68]/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[140px]">{doc.originalFilename || doc.original_filename || `Document ${doc.id}`}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-1.5 text-[#226D68] hover:bg-[#226D68]/20 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {candidateData?.completion_percentage != null && (
                    <Badge variant="outline" className="text-xs border-gray-200 text-[#6b7280]">
                      {candidateData.completion_percentage.toFixed(0)}% complété
                    </Badge>
                  )}
                </div>
                {skills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-[#226D68]" strokeWidth={1.5} />
                      <span className="text-sm font-semibold text-[#2C2C2C]">Compétences</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <span
                          key={s.id || s.name || s}
                          className="px-2.5 py-1 rounded-md text-xs sm:text-sm font-medium bg-[#226D68]/10 text-[#226D68]"
                        >
                          {typeof s === 'string' ? s : (s.name || s.skill_name || s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pied de carte — validé par Yemma + historique */}
              <div className="px-5 sm:px-6 py-3 bg-[#F9FAFB] border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm text-[#6b7280]">
                    {candidateData?.status === 'VALIDATED' ? 'Profil validé' : 'En cours de validation'}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-[#226D68]/30" />
                    <span className="text-xs sm:text-sm font-medium text-[#226D68]">Yemma</span>
                  </div>
                </div>
                {hasHistory && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6b7280]">
                    {candidateData.created_at && (
                      <span><Clock className="h-3 w-3 inline mr-1 text-gray-400" />Inscrit {formatDateTime(candidateData.created_at)}</span>
                    )}
                    {candidateData.submitted_at && (
                      <span>Soumis {formatDateTime(candidateData.submitted_at)}</span>
                    )}
                    {candidateData.validated_at && (
                      <span className="text-[#1a5a55] font-medium">Validé {formatDateTime(candidateData.validated_at)}</span>
                    )}
                    {candidateData.rejected_at && (
                      <span className="text-[#c04a2f] font-medium">Rejeté {formatDateTime(candidateData.rejected_at)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Contenu détaillé — profil */}
        <div className="bg-[#F9FAFB] pt-6 sm:pt-8 pb-10">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
            <CandidateDataView data={candidateData} />
          </div>
        </div>

        {/* Modale prévisualisation document — centrée, animation bas → haut */}
        <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
          <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6 xl:p-8 bg-black/70 backdrop-blur-sm border-0 max-w-none rounded-none [&>button:last-child]:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 !left-0 !top-0 !translate-x-0 !translate-y-0">
            {previewDocument && (() => {
              const mimeType = previewDocument.mimeType || previewDocument.mime_type
              const isPDF = mimeType?.includes('pdf')
              const isImage = mimeType?.includes('image')
              const filename = previewDocument.originalFilename || previewDocument.original_filename || `Document ${previewDocument.id}`
              return (
                <div className="slide-in-from-bottom w-full max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] h-[85vh] md:h-[88vh] lg:h-[90vh] max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-2.5rem)] lg:max-h-[calc(100dvh-3rem)] flex flex-col rounded-xl overflow-hidden bg-white shadow-2xl border border-gray-200">
                  <div className="shrink-0 flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 border-b border-gray-200 bg-[#F9FAFB]">
                    <span className="text-sm font-medium text-[#2C2C2C] truncate max-w-[60%]" title={filename}>{filename}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(previewDocument)}
                        className="h-9 px-3 border-gray-200 hover:bg-[#E8F4F3] hover:border-[#226D68]/30 text-[#226D68]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                      <button
                        type="button"
                        onClick={() => setPreviewDocument(null)}
                        className="p-2 rounded-lg text-[#6b7280] hover:bg-gray-200 hover:text-[#2C2C2C] transition-colors"
                        aria-label="Fermer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto flex items-center justify-center p-4 lg:p-6 xl:p-8 bg-gray-100/50 min-h-0">
                    {isPDF ? (
                      <iframe
                        src={previewDocument.viewUrl}
                        className="w-full h-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] border-0 rounded-lg bg-white shadow-sm"
                        title={filename}
                      />
                    ) : isImage ? (
                      <img
                        src={previewDocument.viewUrl}
                        alt={filename}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-[#9ca3af]" />
                        <p className="text-base text-[#6b7280] mb-4">Aperçu non disponible pour ce type de fichier.</p>
                        <Button
                          onClick={() => handleDownloadDocument(previewDocument)}
                          className="bg-[#226D68] hover:bg-[#1a5a55] text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger le fichier
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* Modale confirmation archivage */}
        <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm p-0 gap-0 overflow-hidden border-[#e5e7eb] shadow-xl rounded-2xl">
            <div className="p-4 sm:p-5 pr-10 sm:pr-12">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#226D68]/10 flex items-center justify-center flex-shrink-0">
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
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm p-0 gap-0 overflow-hidden border-[#e5e7eb] shadow-xl rounded-2xl">
            <div className="p-4 sm:p-5 pr-10 sm:pr-12">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#226D68]/10 flex items-center justify-center flex-shrink-0">
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
