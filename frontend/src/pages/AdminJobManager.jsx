import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Plus, Loader2, MapPin, DollarSign, Pencil,
  Eye, EyeOff, ExternalLink, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { candidateApi } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import AdminLayout from '@/components/admin/AdminLayout'
import { Toast } from '@/components/common/Toast'

const JOB_STATUS = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', CLOSED: 'Fermé' }
const PER_PAGE = 15

export default function AdminJobManager() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [page, setPage] = useState(1)

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

  const toggleStatus = async (job) => {
    const nextStatus = job.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    try {
      await candidateApi.adminUpdateJobStatus(job.id, nextStatus)
      setToast({ message: nextStatus === 'PUBLISHED' ? 'Offre publiée.' : 'Offre passée en brouillon.', type: 'success' })
      loadJobs()
    } catch (err) {
      const detail = err.response?.data?.detail
      setToast({ message: (typeof detail === 'string' ? detail : 'Erreur') || 'Erreur', type: 'error' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(jobs.length / PER_PAGE))
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return jobs.slice(start, start + PER_PAGE)
  }, [jobs, page])

  return (
    <AdminLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* En-tête */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2C2C2C] font-heading">Gestion des offres</h1>
              <p className="text-[#6b7280] mt-1">Créez et publiez des offres pour attirer des candidats (effet Leurre).</p>
            </div>
            <div className="flex items-center gap-3">
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
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#F8FAFC]/60">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider w-12" />
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Offre</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden md:table-cell">Localisation</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider hidden lg:table-cell">Contrat</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Statut</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#F8FAFC]/40 transition-colors">
                        <td className="py-3 px-4">
                          {job.company_logo_url ? (
                            <img src={job.company_logo_url} alt="" className="h-10 w-10 rounded-lg object-contain border bg-white" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-[#E8F4F3] flex items-center justify-center">
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
                                <DollarSign className="h-3 w-3" />
                                {job.salary_range}
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
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                              job.status === 'PUBLISHED'
                                ? 'bg-[#226D68]/15 text-[#1a5a55]'
                                : job.status === 'CLOSED'
                                ? 'bg-gray-100 text-[#6b7280]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {JOB_STATUS[job.status] || job.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/offres/${job.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[#6b7280] hover:bg-[#E8F4F3] hover:text-[#226D68] transition-colors"
                              title="Voir sur le site"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            {job.status === 'PUBLISHED' ? (
                              <Button variant="outline" size="sm" onClick={() => toggleStatus(job)} className="h-8 text-xs px-2">
                                <EyeOff className="h-3.5 w-3.5 mr-1" />
                                Dépublier
                              </Button>
                            ) : job.status === 'DRAFT' ? (
                              <Button size="sm" className="bg-[#226D68] hover:bg-[#1a5a55] text-white h-8 text-xs px-2" onClick={() => toggleStatus(job)}>
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Publier
                              </Button>
                            ) : null}
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
                  Affichage {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, jobs.length)} sur {jobs.length} offres
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </AdminLayout>
  )
}
