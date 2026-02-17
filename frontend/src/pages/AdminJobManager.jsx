import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase, Plus, Loader2, MapPin, Pencil,
  ExternalLink, ChevronLeft, ChevronRight,
  Calendar, RotateCcw, Eye, UserPlus, FileText,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { candidateApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AdminLayout from '@/components/admin/AdminLayout'
import { Toast } from '@/components/common/Toast'
import { formatDate } from '@/utils/dateUtils'

const JOB_STATUS = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  CLOSED: 'Fermé',
  ARCHIVED: 'Archivé (expiré)',
}
const PER_PAGE = 15
const FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'active', label: 'Publiées' },
  { id: 'draft', label: 'Brouillons' },
  { id: 'archived', label: 'Expirées' },
  { id: 'closed', label: 'Fermées' },
]

export default function AdminJobManager() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [renewJob, setRenewJob] = useState(null)
  const [renewDate, setRenewDate] = useState('')
  const [renewing, setRenewing] = useState(false)
  const [changingStatusId, setChangingStatusId] = useState(null)

  useEffect(() => {
    if (renewJob) {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      setRenewDate(d.toISOString().slice(0, 10))
    }
  }, [renewJob])

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const data = await candidateApi.adminListJobs()
      setJobs(Array.isArray(data) ? data : [])
      setPage(1)
    } catch (err) {
      console.error('Erreur chargement offres:', err)
      setJobs([])
      setToast({ message: 'Impossible de charger les offres.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = useMemo(() => {
    const isExpired = (j) => j.expires_at && new Date(j.expires_at) < new Date()
    switch (filter) {
      case 'active':
        return jobs.filter((j) => j.status === 'PUBLISHED' && !isExpired(j))
      case 'draft':
        return jobs.filter((j) => j.status === 'DRAFT')
      case 'archived':
        return jobs.filter((j) => j.status === 'ARCHIVED' || (j.status === 'PUBLISHED' && isExpired(j)))
      case 'closed':
        return jobs.filter((j) => j.status === 'CLOSED')
      default:
        return jobs
    }
  }, [jobs, filter])

  const handleRenew = async () => {
    if (!renewJob || !renewDate) return
    try {
      setRenewing(true)
      await candidateApi.adminRenewJob(renewJob.id, renewDate)
      setToast({ message: 'Offre reconduite et republiée.', type: 'success' })
      setRenewJob(null)
      loadJobs()
    } catch (err) {
      const detail = err.response?.data?.detail
      setToast({ message: (typeof detail === 'string' ? detail : 'Erreur lors de la reconduction.') || 'Erreur', type: 'error' })
    } finally {
      setRenewing(false)
    }
  }

  const handleStatusChange = async (job, newStatus) => {
    if (job.status === newStatus) return
    try {
      setChangingStatusId(job.id)
      await candidateApi.adminUpdateJobStatus(job.id, newStatus)
      setToast({ message: `Statut mis à jour : ${JOB_STATUS[newStatus]}`, type: 'success' })
      loadJobs()
    } catch (err) {
      const detail = err.response?.data?.detail
      setToast({ message: (typeof detail === 'string' ? detail : 'Erreur lors du changement de statut.') || 'Erreur', type: 'error' })
    } finally {
      setChangingStatusId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PER_PAGE))
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return filteredJobs.slice(start, start + PER_PAGE)
  }, [filteredJobs, page])

  const isExpired = (job) => {
    if (!job.expires_at) return false
    return new Date(job.expires_at) < new Date()
  }

  return (
    <AdminLayout>
      <div className="w-full min-w-0 px-3 xs:px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2C2C2C] font-heading">Gestion des offres</h1>
              <p className="text-[#6b7280] mt-1">Créez et publiez des offres. Les offres arrivées à leur date d&apos;expiration sont automatiquement dépublier et archivées. Consultez l&apos;historique (expirées, fermées) et reconduisez les offres si besoin.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link to="/offres" target="_blank" rel="noopener noreferrer" className="text-sm text-[#6b7280] hover:text-[#226D68] flex items-center gap-1.5">
                <ExternalLink className="h-4 w-4" />
                Voir la page publique
              </Link>
              <Link
                to="/admin/jobs/new"
                className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle offre
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#226D68]" />
          </div>
        ) : jobs.length === 0 ? (
          <Card className="border-gray-200 rounded-2xl overflow-hidden">
            <CardContent className="py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#E8F4F3] flex items-center justify-center mx-auto mb-6">
                <Briefcase className="h-8 w-8 text-[#226D68]" />
              </div>
              <h2 className="text-lg font-semibold text-[#2C2C2C] mb-2">Aucune offre pour le moment</h2>
              <p className="text-[#6b7280] mb-6 max-w-sm mx-auto">Créez votre première offre pour attirer des candidats et enrichir la CVthèque.</p>
              <Link
                to="/admin/jobs/new"
                className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-[#226D68] hover:bg-[#1a5a55] text-white text-sm font-semibold transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer une offre
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filtres + Historique */}
            {(filter === 'archived' || filter === 'closed') && (
              <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-1">Historique des offres</h3>
                <p className="text-sm text-amber-800">
                  {filter === 'archived'
                    ? "Offres arrivées à leur date d'expiration (archivées automatiquement). Vous pouvez les modifier ou les reconduire avec une nouvelle date."
                    : "Offres fermées manuellement. Vous pouvez les modifier ou les reconduire pour les republier."}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFilter(f.id); setPage(1) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.id
                      ? 'bg-[#226D68] text-white'
                      : 'bg-white border border-gray-200 text-[#6b7280] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#F8FAFC]/60">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider w-12" />
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Offre</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Localisation</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">Contrat</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Dates</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden xl:table-cell" title="Vues de la page détail">Vues</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden xl:table-cell" title="Clics Créer mon compte">Créer compte</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Candidatures</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Statut</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#F8FAFC]/40 transition-colors">
                        <td className="py-3 px-4">
                          {job.company_logo_url ? (
                            <div className="w-12 h-12 rounded-full ring-2 ring-gray-100 shadow-sm bg-white flex items-center justify-center overflow-hidden p-1">
                              <img src={job.company_logo_url} alt="" className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#E8F4F3] flex items-center justify-center ring-2 ring-gray-100 shadow-sm">
                              <Briefcase className="h-5 w-5 text-[#226D68]" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="min-w-0">
                            <Link
                              to={`/admin/jobs/${job.id}/edit`}
                              className="font-medium text-[#2C2C2C] hover:text-[#226D68] truncate block"
                            >
                              {job.title}
                            </Link>
                            {job.company_name && (
                              <p className="text-sm text-[#6b7280] truncate">{job.company_name}</p>
                            )}
                            {job.salary_range && (
                              <p className="text-xs text-amber-700 mt-0.5 flex items-center gap-1">
                                <span className="font-semibold">FCFA</span>
                                {job.salary_range}
                              </p>
                            )}
                            {job.sector && (
                              <p className="text-xs text-purple-700 mt-0.5 flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {job.sector}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="text-sm text-[#6b7280] flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {job.location}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="text-sm text-[#6b7280]">{job.contract_type}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-[#6b7280] space-y-0.5">
                            {job.created_at && (
                              <p className="flex items-center gap-1" title="Publié le">
                                <Calendar className="h-3 w-3 shrink-0" />
                                Publié {formatDate(job.created_at)}
                              </p>
                            )}
                            {job.expires_at && (
                              <p className={`flex items-center gap-1 ${isExpired(job) ? 'text-amber-700' : ''}`} title="Expire le">
                                <Calendar className="h-3 w-3 shrink-0" />
                                Expire {formatDate(job.expires_at)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden xl:table-cell">
                          <span className="inline-flex items-center gap-1 text-sm text-[#6b7280]" title="Vues de la page détail">
                            <Eye className="h-3.5 w-3.5" />
                            {job.view_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden xl:table-cell">
                          <span className="inline-flex items-center gap-1 text-sm text-[#1a5a55] font-medium" title="Clics sur Créer mon compte (depuis Postuler)">
                            <UserPlus className="h-3.5 w-3.5" />
                            {job.register_click_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/admin/jobs/${job.id}/candidatures`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#226D68] hover:text-[#1a5a55] hover:underline"
                            title="Voir les candidatures"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Candidatures
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={job.status}
                            onChange={(e) => handleStatusChange(job, e.target.value)}
                            disabled={changingStatusId === job.id}
                            className={`h-8 min-w-[120px] px-2.5 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#226D68]/30 ${
                              job.status === 'PUBLISHED'
                                ? 'bg-[#226D68]/10 text-[#1a5a55] border-[#226D68]/30'
                                : job.status === 'ARCHIVED'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : job.status === 'CLOSED'
                                ? 'bg-gray-50 text-[#6b7280] border-gray-200'
                                : job.status === 'DRAFT'
                                ? 'bg-slate-50 text-slate-700 border-slate-200'
                                : 'bg-gray-50 text-[#6b7280] border-gray-200'
                            }`}
                          >
                            {Object.entries(JOB_STATUS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          {changingStatusId === job.id && (
                            <Loader2 className="inline-block h-3.5 w-3.5 animate-spin ml-1.5 text-[#226D68]" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {job.status === 'PUBLISHED' && (
                              <Link
                                to={`/offres/${job.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[#6b7280] hover:bg-[#E8F4F3] hover:text-[#226D68] transition-colors"
                                title="Voir sur le site"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            )}
                            {(job.status === 'ARCHIVED' || job.status === 'CLOSED' || (job.status === 'PUBLISHED' && isExpired(job))) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRenewJob(job)}
                                className="h-8 text-xs px-2 border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]"
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                Reconduire
                              </Button>
                            )}
                            <Link
                              to={`/admin/jobs/${job.id}/edit`}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-sm text-[#6b7280]">
                  Affichage {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredJobs.length)} sur {filteredJobs.length} offres
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-9"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                  <span className="text-sm text-[#6b7280] px-2">
                    Page {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-9"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Reconduire */}
      <Dialog open={!!renewJob} onOpenChange={(open) => !open && setRenewJob(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reconduire l&apos;offre</DialogTitle>
            <DialogDescription>
              Définissez une nouvelle date d&apos;expiration. L&apos;offre sera republiée automatiquement.
            </DialogDescription>
          </DialogHeader>
          {renewJob && (
            <div className="space-y-4 py-4">
              <p className="text-sm font-medium text-[#2C2C2C]">{renewJob.title}</p>
              <div>
                <Label htmlFor="renew-date">Nouvelle date d&apos;expiration</Label>
                <Input
                  id="renew-date"
                  type="date"
                  value={renewDate}
                  onChange={(e) => setRenewDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setRenewJob(null)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleRenew}
                  disabled={!renewDate || renewing}
                  className="bg-[#226D68] hover:bg-[#1a5a55]"
                >
                  {renewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                  Reconduire et publier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  )
}
