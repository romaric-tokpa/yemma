import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Loader2, Eye, EyeOff, FileText, UserPlus, Clock, Archive,
  RefreshCw, ChevronRight, Target, Building2,
} from 'lucide-react'
import { candidateApi } from '@/services/api'

export function CompanyJobStatsTab({ companyId, basePath = '/company/dashboard/jobs' }) {
  const [jobStats, setJobStats] = useState(null)
  const [loadingJobStats, setLoadingJobStats] = useState(false)

  const loadJobStats = async () => {
    if (!companyId) return
    try {
      setLoadingJobStats(true)
      const data = await candidateApi.companyJobsStats(companyId)
      setJobStats(data && typeof data === 'object' ? data : null)
    } catch {
      setJobStats(null)
    } finally {
      setLoadingJobStats(false)
    }
  }

  useEffect(() => {
    loadJobStats()
  }, [companyId])

  const LABELS = {
    PENDING: 'En attente',
    TO_INTERVIEW: 'À voir en entretien',
    INTERVIEW_SCHEDULED: 'Entretien programmé',
    INTERVIEW_DONE: 'Entretien réalisé',
    HIRED: 'Embauché',
    REJECTED: 'Refusé',
    EXTERNAL_REDIRECT: 'Externe',
    REVIEWED: 'Examiné',
    ACCEPTED: 'Accepté',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2C2C2C] font-heading">Statistiques des offres</h1>
        <p className="text-[#6b7280] mt-1">Vue d&apos;ensemble de vos offres d&apos;emploi et candidatures.</p>
      </div>

      {loadingJobStats ? (
        <div className="flex gap-3 items-center justify-center py-16 text-[#6b7280] rounded-2xl border border-gray-200 bg-white">
          <Loader2 className="w-6 h-6 animate-spin text-[#226D68]" />
          <span className="text-sm">Chargement des statistiques…</span>
        </div>
      ) : !jobStats ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 text-[#6b7280]" />
          </div>
          <p className="text-base font-semibold text-[#2C2C2C]">Aucune donnée disponible</p>
          <p className="text-sm text-[#6b7280] mt-2">Créez des offres pour voir les statistiques.</p>
          <Link to={`${basePath}/new`} className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[#226D68] hover:text-[#1a5a55]">
            Créer une offre
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { icon: Briefcase, label: 'Total offres', value: jobStats.total ?? 0, color: 'text-[#2C2C2C]' },
              { icon: Eye, label: 'Publiées', value: jobStats.by_status?.PUBLISHED ?? 0, color: 'text-[#1a5a55]' },
              { icon: Clock, label: 'Expirées', value: jobStats.expired_published ?? 0, color: 'text-[#c04a2f]' },
              { icon: FileText, label: 'Candidatures', value: jobStats.applications ?? 0, color: 'text-[#226D68]' },
              { icon: Eye, label: 'Vues pages', value: jobStats.total_view_count ?? 0, color: 'text-[#6b7280]' },
              { icon: UserPlus, label: 'Clics inscription', value: jobStats.total_register_click_count ?? 0, color: 'text-[#6b7280]' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                <div className="flex items-center gap-2 text-[#6b7280] text-xs mb-1">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </div>
                <p className={`text-xl font-bold tabular-nums ${color}`}>{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
              </div>
            ))}
          </div>

          {(jobStats.by_status?.PUBLISHED ?? 0) > 0 && (
            <div className="rounded-xl border border-gray-200 bg-[#E8F4F3]/30 p-4 flex items-center gap-3">
              <Target className="w-8 h-8 text-[#226D68] shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#2C2C2C]">Moyenne candidatures par offre publiée</p>
                <p className="text-2xl font-bold text-[#226D68] tabular-nums">{jobStats.avg_applications_per_job ?? 0}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-[#E8F4F3]/60 to-white flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#2C2C2C]">Offres par statut</h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={loadJobStats} disabled={loadingJobStats} className="h-8 w-8 p-0 rounded-lg text-[#6b7280] hover:bg-[#E8F4F3] hover:text-[#226D68] flex items-center justify-center">
                  <RefreshCw className={`w-4 h-4 ${loadingJobStats ? 'animate-spin' : ''}`} />
                </button>
                <Link to={basePath} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#226D68] hover:text-[#1a5a55]">
                  Gérer les offres
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'DRAFT', label: 'Brouillons', icon: EyeOff, color: 'text-[#6b7280]' },
                  { key: 'PUBLISHED', label: 'Publiées', icon: Eye, color: 'text-[#1a5a55]' },
                  { key: 'CLOSED', label: 'Fermées', icon: Archive, color: 'text-[#6b7280]' },
                  { key: 'ARCHIVED', label: 'Archivées', icon: Archive, color: 'text-[#6b7280]' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">{label}</p>
                      <p className={`text-lg font-semibold tabular-nums ${color}`}>{jobStats.by_status?.[key] ?? 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {jobStats.applications_by_status && Object.keys(jobStats.applications_by_status).length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-[#E8F4F3]/60 to-white">
                <h3 className="text-sm font-semibold text-[#2C2C2C]">Pipeline candidatures — par étape</h3>
                <p className="text-xs text-[#6b7280] mt-0.5">Répartition des candidatures selon l&apos;étape de recrutement</p>
              </div>
              <div className="p-4 sm:p-5">
                <div className="space-y-3">
                  {(() => {
                    const byStatus = jobStats.applications_by_status
                    const maxCount = Math.max(...Object.values(byStatus), 1)
                    const order = ['PENDING', 'TO_INTERVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEW_DONE', 'HIRED', 'REJECTED', 'REVIEWED', 'ACCEPTED', 'EXTERNAL_REDIRECT']
                    const sorted = order.filter((k) => (byStatus[k] ?? 0) > 0).concat(Object.keys(byStatus).filter((k) => !order.includes(k)))
                    return sorted.map((key) => {
                      const count = byStatus[key] ?? 0
                      const pct = (count / maxCount) * 100
                      const isHired = key === 'HIRED'
                      const isRejected = key === 'REJECTED'
                      return (
                        <div key={key} className="flex items-center gap-3 min-w-0">
                          <span className="text-sm text-[#2C2C2C] w-40 sm:w-48 truncate shrink-0">{LABELS[key] || key}</span>
                          <div className="flex-1 min-w-0 h-7 rounded-lg bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-lg transition-all ${isHired ? 'bg-[#226D68]' : isRejected ? 'bg-red-400' : 'bg-[#226D68]/70'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-[#2C2C2C] w-10 text-right shrink-0">{count}</span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>
          )}

          {jobStats.top_jobs_by_applications?.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-[#E8F4F3]/60 to-white flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#2C2C2C]">Top offres par candidatures</h3>
                <Link to={basePath} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#226D68] hover:text-[#1a5a55]">
                  Voir toutes
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-100">
                {jobStats.top_jobs_by_applications.slice(0, 8).map((job, i) => (
                  <Link key={job.job_id} to={`${basePath}/${job.job_id}/candidatures`} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#E8F4F3]/30 transition-colors">
                    <span className="text-sm text-[#6b7280] w-6 shrink-0">{i + 1}.</span>
                    <Building2 className="w-4 h-4 text-[#6b7280] shrink-0 hidden sm:block" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2C2C2C] truncate">{job.title}</p>
                      {job.company_name && <p className="text-xs text-[#6b7280] truncate">{job.company_name}</p>}
                    </div>
                    <span className="text-sm font-semibold text-[#226D68] tabular-nums shrink-0">{job.applications} candidature{job.applications !== 1 ? 's' : ''}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
