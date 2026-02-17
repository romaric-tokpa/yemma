/**
 * Page liste des candidatures pour une offre d'emploi.
 * Design compact et pro pour afficher de nombreux profils.
 * Gestion des étapes de recrutement : en attente, entretien, embauché, etc.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Briefcase, Loader2, User, ArrowLeft, FileText, Search, Pencil, ChevronRight } from 'lucide-react'
import { candidateApi, documentApi } from '@/services/api'
import { buildPhotoUrl } from '@/utils/photoUtils'
import AdminLayout from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Toast } from '@/components/common/Toast'
import { formatDate } from '@/utils/dateUtils'
import { ROUTES } from '@/constants/routes'

/** Étapes de recrutement pour les candidatures */
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

export default function AdminJobCandidateListPage() {
  const { id: jobId } = useParams()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [profilePhotos, setProfilePhotos] = useState({})
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [toast, setToast] = useState(null)
  const [rejectDialog, setRejectDialog] = useState(null) // { app, previousStatus }
  const [rejectReason, setRejectReason] = useState('')

  const loadProfilePhotos = useCallback(async (apps) => {
    const photosMap = {}
    const needPhoto = apps.filter((app) => !buildPhotoUrl(app.photo_url, documentApi))
    await Promise.all(
      needPhoto.map(async (app) => {
        try {
          const docs = await documentApi.getCandidateDocuments(app.candidate_id)
          const photoDoc = docs
            ?.filter((d) => (d.document_type === 'PROFILE_PHOTO' || d.document_type === 'OTHER') && !d.deleted_at)
            ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
          if (photoDoc) photosMap[app.candidate_id] = documentApi.getDocumentServeUrl(photoDoc.id)
        } catch {}
      })
    )
    setProfilePhotos((prev) => ({ ...prev, ...photosMap }))
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!jobId) return
      try {
        setLoading(true)
        setError(null)
        const [jobData, appsData] = await Promise.all([
          candidateApi.adminGetJob(jobId),
          candidateApi.adminGetJobApplications(jobId),
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
  }, [jobId, loadProfilePhotos])

  const filteredApplications = useMemo(() => {
    let result = applications
    if (statusFilter) {
      result = result.filter((app) => (app.status || 'PENDING') === statusFilter)
    }
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
      await candidateApi.adminUpdateApplicationStatus(jobId, app.id, newStatus, rejectionReason)
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
      )
      setToast({ message: 'Étape mise à jour.', type: 'success' })
      setRejectDialog(null)
      setRejectReason('')
    } catch (err) {
      const detail = err.response?.data?.detail
      setToast({
        message: typeof detail === 'string' ? detail : 'Erreur lors de la mise à jour.',
        type: 'error',
      })
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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[300px] gap-2 text-[#6b7280]">
          <Loader2 className="h-6 w-6 animate-spin text-[#226D68]" />
          <span className="text-sm">Chargement…</span>
        </div>
      </AdminLayout>
    )
  }

  if (error || !job) {
    return (
      <AdminLayout>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-gray-200">
            <CardContent className="py-12 text-center">
              <Briefcase className="h-10 w-10 text-[#6b7280] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280] mb-4">{error || 'Offre introuvable.'}</p>
              <Link to={ROUTES.ADMIN_JOBS}>
                <Button variant="outline" size="sm">Retour aux offres</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* En-tête compact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={ROUTES.ADMIN_JOBS}
              className="shrink-0 p-1.5 rounded-lg text-[#6b7280] hover:bg-[#E8F4F3] hover:text-[#226D68] transition-colors"
              title="Retour aux offres"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-[#2C2C2C] truncate">
                Candidatures — {job.title}
              </h1>
              <p className="text-xs text-[#6b7280]">
                {job.company_name && <span>{job.company_name} · </span>}
                {applications.length} profil{applications.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link to={`/admin/jobs/${job.id}/edit`} className="shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Modifier l&apos;offre
            </Button>
          </Link>
        </div>

        {/* Liste compacte en tableau */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {applications.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100 bg-[#F8FAFC]/60 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af]" />
                <Input
                  placeholder="Rechercher nom, email, poste…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs border-gray-200 focus:ring-1 focus:ring-[#226D68]/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs text-[#2C2C2C] focus:border-[#226D68] focus:ring-1 focus:ring-[#226D68]/30 focus:outline-none"
                >
                  <option value="">Toutes les étapes</option>
                  {APPLICATION_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {(search || statusFilter) && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setStatusFilter('') }}
                    className="h-8 px-2.5 rounded-lg text-xs text-[#6b7280] hover:bg-gray-100 hover:text-[#226D68] transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
              <span className="text-xs text-[#6b7280] shrink-0">
                {filteredApplications.length} / {applications.length}
              </span>
            </div>
          )}

          {filteredApplications.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-10 w-10 text-[#9ca3af] mx-auto mb-3" />
              <p className="text-sm text-[#6b7280] font-medium">
                {applications.length === 0
                  ? 'Aucune candidature pour cette offre.'
                  : 'Aucun résultat pour cette recherche.'}
              </p>
              {(search || statusFilter) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setStatusFilter('') }}
                  className="mt-2 text-xs text-[#226D68] hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-[#F8FAFC]/40">
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider w-14">Photo</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Candidat</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Poste visé</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Étape</th>
                    <th className="text-left py-2 px-3 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Date</th>
                    <th className="text-right py-2 px-3 text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                      <td className="py-2 px-3">
                        {(() => {
                          const defaultAvatar = generateAvatarUrl(app.first_name, app.last_name)
                          let photoUrl = buildPhotoUrl(app.photo_url, documentApi)
                          if (!photoUrl && profilePhotos[app.candidate_id]) photoUrl = profilePhotos[app.candidate_id]
                          const displayPhoto = photoUrl || defaultAvatar
                          return (
                            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100 shrink-0 flex-shrink-0">
                              <img
                                src={displayPhoto}
                                alt={`${app.first_name || ''} ${app.last_name || ''}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = defaultAvatar }}
                              />
                            </div>
                          )
                        })()}
                      </td>
                      <td className="py-2 px-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#2C2C2C] truncate">
                            {[app.first_name, app.last_name].filter(Boolean).join(' ') || '—'}
                          </p>
                          {app.email && (
                            <p className="text-xs text-[#6b7280] truncate">{app.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 hidden md:table-cell">
                        {app.profile_title ? (
                          <span className="text-xs text-[#226D68] truncate block max-w-[180px]">
                            {app.profile_title}
                          </span>
                        ) : (
                          <span className="text-xs text-[#9ca3af]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={app.status || 'PENDING'}
                          onChange={(e) => handleStatusChange(app, e.target.value)}
                          disabled={updatingStatusId === app.id}
                          className={`h-8 min-w-[140px] max-w-[180px] px-2.5 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#226D68]/30 ${
                            app.status === 'HIRED'
                              ? 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30'
                              : app.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : app.status === 'INTERVIEW_DONE' || app.status === 'TO_INTERVIEW' || app.status === 'INTERVIEW_SCHEDULED'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-gray-50 text-[#6b7280] border-gray-200'
                          }`}
                        >
                          {APPLICATION_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {updatingStatusId === app.id && (
                          <Loader2 className="inline-block h-3.5 w-3.5 animate-spin ml-1.5 text-[#226D68]" />
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-xs text-[#6b7280]">
                          {app.applied_at ? formatDate(app.applied_at) : '—'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Link to={ROUTES.ADMIN_REVIEW(app.candidate_id)}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-[#226D68] hover:bg-[#E8F4F3] opacity-0 group-hover:opacity-100 md:opacity-100"
                          >
                            <User className="h-3.5 w-3.5 mr-1" />
                            Profil
                            <ChevronRight className="h-3 w-3 ml-0.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}

        {/* Popup motif de refus */}
        <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Motifs de refus</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[#6b7280]">
              Rédigez les motifs de refus pour informer le candidat. Ce message sera visible dans son espace.
            </p>
            <Textarea
              placeholder="Ex. : Profil ne correspondant pas au poste recherché…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] mt-2"
              maxLength={2000}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason('') }}>
                Annuler
              </Button>
              <Button onClick={handleRejectConfirm} disabled={!rejectReason?.trim()}>
                Confirmer le refus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
