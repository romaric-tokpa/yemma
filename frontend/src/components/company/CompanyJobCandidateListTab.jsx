import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Loader2, User, ArrowLeft, FileText, Search, Pencil, ChevronRight, Star, CheckCircle2 } from 'lucide-react'
import { candidateApi, documentApi } from '@/services/api'
import { CandidateProfileDialog } from './CandidateProfileDialog'
import { buildPhotoUrl } from '@/utils/photoUtils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Toast } from '@/components/common/Toast'
import { formatDate } from '@/utils/dateUtils'

const getAdminScore = (app) => app.admin_report?.overall_score ?? app.admin_score ?? null

const APPLICATION_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'TO_INTERVIEW', label: 'À voir en entretien' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Entretien programmé' },
  { value: 'INTERVIEW_DONE', label: 'Entretien réalisé' },
  { value: 'HIRED', label: 'Embauché' },
  { value: 'REJECTED', label: 'Refusé' },
  { value: 'EXTERNAL_REDIRECT', label: 'Externe (redirection)' },
  { value: 'REVIEWED', label: 'Examiné' },
  { value: 'ACCEPTED', label: 'Accepté' },
]

const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
}

export function CompanyJobCandidateListTab({ companyId, jobId, basePath = '/company/dashboard/jobs' }) {
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [profilePhotos, setProfilePhotos] = useState({})
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [toast, setToast] = useState(null)
  const [rejectDialog, setRejectDialog] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [profileDialogCandidateId, setProfileDialogCandidateId] = useState(null)

  const loadProfilePhotos = useCallback(async (apps) => {
    const photosMap = {}
    const needPhoto = apps.filter((app) => !buildPhotoUrl(app.photo_url, documentApi))
    await Promise.all(
      needPhoto.map(async (app) => {
        try {
          const docs = await documentApi.getCandidateDocuments(app.candidate_id)
          const photoDoc = docs?.filter((d) => (d.document_type === 'PROFILE_PHOTO' || d.document_type === 'OTHER') && !d.deleted_at)?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          if (photoDoc) photosMap[app.candidate_id] = documentApi.getDocumentServeUrl(photoDoc.id)
        } catch {}
      })
    )
    setProfilePhotos((prev) => ({ ...prev, ...photosMap }))
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!jobId || !companyId) return
      try {
        setLoading(true)
        setError(null)
        const [jobData, appsData] = await Promise.all([
          candidateApi.companyGetJob(companyId, parseInt(jobId, 10)),
          candidateApi.companyGetJobApplications(companyId, parseInt(jobId, 10)),
        ])
        const apps = Array.isArray(appsData) ? appsData : []
        setJob(jobData)
        setApplications(apps)
        if (apps.length > 0) loadProfilePhotos(apps)
      } catch (err) {
        console.error('Erreur chargement candidatures:', err)
        setError('Impossible de charger les données.')
        setJob(null)
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [jobId, companyId, loadProfilePhotos])

  const filteredApplications = useMemo(() => {
    let result = applications
    if (statusFilter) result = result.filter((app) => (app.status || 'PENDING') === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (app) =>
          [app.first_name, app.last_name].some((s) => s?.toLowerCase().includes(q)) ||
          app.email?.toLowerCase().includes(q) ||
          app.profile_title?.toLowerCase().includes(q)
      )
    }
    return result
  }, [applications, search, statusFilter])

  const handleStatusChange = async (app, newStatus, rejectionReason = null) => {
    if (app.status === newStatus) return
    if (newStatus === 'REJECTED') {
      setRejectDialog({ app, previousStatus: app.status })
      setRejectReason('')
      return
    }
    await doUpdateStatus(app, newStatus, null)
  }

  const doUpdateStatus = async (app, newStatus, rejectionReason = null) => {
    try {
      setUpdatingStatusId(app.id)
      await candidateApi.companyUpdateApplicationStatus(companyId, parseInt(jobId, 10), app.id, newStatus, rejectionReason)
      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a)))
      setToast({ message: 'Étape mise à jour.', type: 'success' })
      setRejectDialog(null)
      setRejectReason('')
    } catch (err) {
      const detail = err.response?.data?.detail
      setToast({ message: typeof detail === 'string' ? detail : 'Erreur lors de la mise à jour.', type: 'error' })
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleRejectConfirm = () => {
    if (!rejectDialog?.app) return
    const reason = rejectReason?.trim()
    if (!reason) {
      setToast({ message: 'Veuillez rédiger les motifs de refus.', type: 'error' })
      return
    }
    doUpdateStatus(rejectDialog.app, 'REJECTED', reason)
  }

  if (loading) {
    return (
      <div className="flex justify-center min-h-[300px] gap-2 text-[#6b7280]">
        <Loader2 className="h-6 w-6 animate-spin text-[#226D68]" />
        <span className="text-sm">Chargement…</span>
      </div>
    )
  }

  if (error || !job) {
    return (
      <Card className="border-gray-200">
        <CardContent className="py-12 text-center">
          <Briefcase className="h-10 w-10 text-[#6b7280] mx-auto mb-3" />
          <p className="text-sm text-[#6b7280] mb-4">{error || 'Offre introuvable.'}</p>
          <Link to={basePath}><Button variant="outline" size="sm">Retour aux offres</Button></Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête redesigné */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden shadow-sm">
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <Link to={basePath} className="shrink-0 p-2 rounded-xl bg-white border border-gray-200 text-[#6b7280] hover:bg-[#E8F4F3] hover:border-[#226D68]/30 hover:text-[#226D68] transition-colors shadow-sm" title="Retour aux offres">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] font-heading tracking-tight">{job.title}</h1>
                <p className="text-sm text-[#6b7280] mt-0.5">{job.company_name && <span>{job.company_name} · </span>}{job.contract_type}{job.location && ` · ${job.location}`}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="outline" className="bg-[#E8F4F3]/80 text-[#1a5a55] border-[#226D68]/30 font-medium">
                    {applications.length} candidature{applications.length !== 1 ? 's' : ''}
                  </Badge>
                  {job.expires_at && new Date(job.expires_at) > new Date() && (
                    <span className="text-xs text-[#6b7280]">Expire le {formatDate(job.expires_at)}</span>
                  )}
                </div>
              </div>
            </div>
            <Link to={`${basePath}/${job.id}/edit`} className="shrink-0">
              <Button variant="outline" size="sm" className="h-9 px-4 text-sm border-gray-200 hover:border-[#226D68]/50 hover:bg-[#E8F4F3]/50">
                <Pencil className="h-4 w-4 mr-2" />
                Modifier l&apos;offre
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Barre de filtres */}
      {applications.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <Input placeholder="Rechercher nom, email, poste…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9 text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-[#226D68]/20" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-4 rounded-xl border border-gray-200 bg-white text-sm text-[#2C2C2C] focus:border-[#226D68] focus:ring-2 focus:ring-[#226D68]/20 focus:outline-none">
              <option value="">Toutes les étapes</option>
              {APPLICATION_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {(search || statusFilter) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('') }} className="h-9 text-sm text-[#6b7280] hover:text-[#226D68]">Réinitialiser</Button>
            )}
            <span className="text-sm text-[#6b7280] shrink-0">{filteredApplications.length} / {applications.length}</span>
          </div>
        </div>
      )}

      {/* Liste des candidatures — cartes */}
      {filteredApplications.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 bg-white">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#9ca3af]" />
            </div>
            <p className="text-base font-semibold text-[#2C2C2C]">
              {applications.length === 0 ? 'Aucune candidature pour cette offre.' : 'Aucun résultat pour cette recherche.'}
            </p>
            <p className="text-sm text-[#6b7280] mt-1">Les candidatures apparaîtront ici lorsqu&apos;elles seront reçues.</p>
            {(search || statusFilter) && (
              <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter('') }} className="mt-4">Réinitialiser les filtres</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((app) => {
            const defaultAvatar = generateAvatarUrl(app.first_name, app.last_name)
            let photoUrl = buildPhotoUrl(app.photo_url, documentApi)
            if (!photoUrl && profilePhotos[app.candidate_id]) photoUrl = profilePhotos[app.candidate_id]
            const displayPhoto = photoUrl || defaultAvatar
            const adminScore = getAdminScore(app)
            const report = app.admin_report || {}
            const summary = report.summary
            const isValidated = app.profile_status === 'VALIDATED'
            return (
              <Card key={app.id} className="border border-gray-200 hover:border-[#226D68]/30 hover:shadow-md transition-all overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-stretch gap-0">
                    {/* Colonne gauche : candidat + évaluation */}
                    <div className="flex-1 flex items-start gap-4 p-4 sm:p-5 min-w-0">
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-gray-100">
                          <img src={displayPhoto} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = defaultAvatar }} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[#2C2C2C]">{[app.first_name, app.last_name].filter(Boolean).join(' ') || '—'}</h3>
                          {isValidated && (
                            <Badge className="bg-[#226D68]/15 text-[#1a5a55] border-0 text-[10px] font-medium">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Vérifié
                            </Badge>
                          )}
                        </div>
                        {app.profile_title && <p className="text-sm text-[#226D68] mt-0.5">{app.profile_title}</p>}
                        {app.email && <p className="text-xs text-[#6b7280] truncate mt-1">{app.email}</p>}
                        {/* Évaluation administrateur */}
                        <div className="mt-3 p-3 rounded-lg bg-[#F8FAFC] border border-gray-100">
                          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Évaluation Yemma</p>
                          {adminScore != null || summary ? (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                {adminScore != null ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#226D68]/15 text-[#1a5a55] text-sm font-semibold">
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                    {Number(adminScore).toFixed(1)}/5
                                  </span>
                                ) : null}
                                {report.technical_skills_rating != null && (
                                  <span className="text-xs text-[#6b7280]">Tech {report.technical_skills_rating}/5</span>
                                )}
                                {report.soft_skills_rating != null && (
                                  <span className="text-xs text-[#6b7280]">Soft {report.soft_skills_rating}/5</span>
                                )}
                              </div>
                              {summary && <p className="text-xs text-[#2C2C2C] mt-2 line-clamp-2 leading-relaxed">{summary}</p>}
                            </>
                          ) : (
                            <p className="text-xs text-[#9ca3af] italic">Profil en attente d&apos;évaluation</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Colonne droite : modifier l'étape + date + action */}
                    <div className="flex flex-col sm:min-w-[220px] gap-4 p-4 sm:p-5 border-t sm:border-t-0 sm:border-l border-gray-100 bg-[#FAFBFC]/50">
                      <div className="flex-1 flex flex-col gap-3">
                        <div>
                          <label htmlFor={`status-${app.id}`} className="block text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Modifier l&apos;étape</label>
                          <div className="flex items-center gap-2">
                            <select
                              id={`status-${app.id}`}
                              value={app.status || 'PENDING'}
                              onChange={(e) => handleStatusChange(app, e.target.value)}
                              disabled={updatingStatusId === app.id}
                              className={`flex-1 min-w-0 h-10 px-3 rounded-lg text-sm font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#226D68]/30 focus:border-[#226D68]/50 ${
                                app.status === 'HIRED' ? 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30'
                                  : app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200'
                                  : ['INTERVIEW_DONE', 'TO_INTERVIEW', 'INTERVIEW_SCHEDULED'].includes(app.status) ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-white text-[#6b7280] border-gray-200'
                              }`}
                            >
                              {APPLICATION_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            {updatingStatusId === app.id && <Loader2 className="h-5 w-5 animate-spin text-[#226D68] shrink-0" aria-hidden />}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-0.5">Candidature</p>
                          <span className="text-xs text-[#6b7280]">{app.applied_at ? formatDate(app.applied_at) : '—'}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto h-9 text-sm text-[#226D68] border-[#226D68]/30 hover:bg-[#E8F4F3] hover:border-[#226D68]/50"
                        onClick={() => setProfileDialogCandidateId(app.candidate_id)}
                        title="Voir le profil et les documents"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profil & documents
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <CandidateProfileDialog
        candidateId={profileDialogCandidateId}
        candidateIds={filteredApplications.map((a) => a.candidate_id)}
        jobId={jobId}
        companyId={companyId}
        open={!!profileDialogCandidateId}
        onOpenChange={(open) => !open && setProfileDialogCandidateId(null)}
        onNavigate={(id) => setProfileDialogCandidateId(id)}
      />

      <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motifs de refus</DialogTitle>
            <DialogDescription className="text-sm text-[#6b7280]">
              Rédigez les motifs de refus pour informer le candidat. Ce message sera visible dans son espace.
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Ex. : Profil ne correspondant pas au poste recherché…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[100px] mt-2" maxLength={2000} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason('') }}>Annuler</Button>
            <Button onClick={handleRejectConfirm} disabled={!rejectReason?.trim()}>Confirmer le refus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
