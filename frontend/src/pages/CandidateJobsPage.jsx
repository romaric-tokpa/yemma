import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Briefcase, MapPin, FileText, Search,
  Loader2, Clock, X, Calendar,
} from 'lucide-react'
import { candidateApi } from '@/services/api'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { SECTORS_FR } from '@/data/sectors'
import { SEO } from '@/components/seo/SEO'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PublicFooter from '@/components/layout/PublicFooter'
import { Toast } from '@/components/common/Toast'
import { formatDate } from '@/utils/dateUtils'

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance', 'Intérim']

export default function CandidateJobsPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTitle, setFilterTitle] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterContract, setFilterContract] = useState('')
  const [filterSector, setFilterSector] = useState('')
  const [debouncedTitle, setDebouncedTitle] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')
  const [debouncedSector, setDebouncedSector] = useState('')
  const [toast, setToast] = useState(null)

  const hasActiveFilters = filterTitle || filterLocation || filterContract || filterSector

  const clearFilters = () => {
    setFilterTitle('')
    setFilterLocation('')
    setFilterContract('')
    setFilterSector('')
    setDebouncedTitle('')
    setDebouncedLocation('')
    setDebouncedSector('')
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTitle(filterTitle), 400)
    return () => clearTimeout(t)
  }, [filterTitle])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedLocation(filterLocation), 400)
    return () => clearTimeout(t)
  }, [filterLocation])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSector(filterSector), 400)
    return () => clearTimeout(t)
  }, [filterSector])

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await candidateApi.listJobs({
        title: debouncedTitle || undefined,
        location: debouncedLocation || undefined,
        contract_type: filterContract || undefined,
        sector: debouncedSector || undefined,
      })
      setJobs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erreur chargement offres:', err)
      setJobs([])
      setToast({ message: 'Impossible de charger les offres.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [debouncedTitle, debouncedLocation, filterContract, debouncedSector])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <SEO
        title="Offres d'emploi | Yemma Solutions"
        description="Découvrez des offres d'emploi qualifiées. CDI, CDD, stage, alternance. Postulez en un clic. Complétez votre profil pour être visible aux recruteurs de la CVthèque."
        keywords="offres emploi, recrutement, CDI, CDD, stage, alternance, candidature, CVthèque"
        canonical="/offres"
      />
      <PublicNavbar variant="light" />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:pb-24 lg:px-8 lg:pb-8">
        <div className="flex flex-col min-h-0">
          {/* En-tête compact - identique au dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] font-heading tracking-tight">
                Offres d&apos;emploi
              </h1>
              <p className="text-sm text-[#6b7280] mt-0.5">
                CDI, CDD, stage, alternance… postulez en un clic.
              </p>
            </div>
            {!loading && (
              <span className="text-sm font-medium text-[#6b7280]">
                {jobs.length} offre{jobs.length !== 1 ? 's' : ''} trouvée{jobs.length !== 1 ? 's' : ''}
                {hasActiveFilters && ' pour vos critères'}
              </span>
            )}
          </div>

          {/* Barre de filtres compacte - identique au dashboard */}
          <div className="flex flex-wrap items-end gap-3 mb-6 shrink-0">
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <label className="sr-only">Intitulé de poste</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                <Input
                  placeholder="Poste..."
                  value={filterTitle}
                  onChange={(e) => setFilterTitle(e.target.value)}
                  className="pl-8 h-9 rounded-lg border-gray-200 text-sm focus:border-[#226D68] focus:ring-1 focus:ring-[#226D68]/20"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[140px] max-w-[200px]">
              <label className="sr-only">Localisation</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7280]" />
                <Input
                  placeholder="Ville, pays..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="pl-8 h-9 rounded-lg border-gray-200 text-sm focus:border-[#226D68] focus:ring-1 focus:ring-[#226D68]/20"
                />
              </div>
            </div>
            <div className="w-[140px]">
              <label className="sr-only">Type de contrat</label>
              <select
                value={filterContract}
                onChange={(e) => setFilterContract(e.target.value)}
                className="h-9 w-full px-3 rounded-lg border border-gray-200 bg-white text-sm focus:border-[#226D68] focus:ring-1 focus:ring-[#226D68]/20 focus:outline-none"
              >
                <option value="">Tous contrats</option>
                {CONTRACT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
            <div className="w-[200px] min-w-[180px]">
              <label className="sr-only">Secteur d&apos;activité</label>
              <SearchableSelect
                id="filter-sector"
                options={SECTORS_FR}
                value={filterSector}
                onChange={setFilterSector}
                placeholder="Secteur..."
                className="h-9 text-sm rounded-lg border-gray-200"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 px-3 rounded-lg text-sm text-[#6b7280] hover:bg-gray-100 hover:text-[#226D68] transition-colors flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Zone résultats - identique au dashboard */}
          <div className="flex-1 min-h-0 overflow-auto">
            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#226D68]" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                <Briefcase className="h-14 w-14 text-[#9ca3af] mb-4" />
                <p className="text-[#6b7280] font-medium">Aucune offre</p>
                <p className="text-sm text-[#9ca3af] mt-1">
                  {hasActiveFilters ? 'Modifiez vos filtres' : 'Aucune offre publiée pour le moment'}
                </p>
                {!hasActiveFilters && (
                  <Button
                    onClick={() => navigate(ROUTES.REGISTER_CANDIDAT)}
                    className="mt-4 bg-[#226D68] hover:bg-[#1a5a55]"
                  >
                    Créer mon compte
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4">
                {jobs.map((job) => (
                  <Link key={job.id} to={ROUTES.JOB_OFFER_DETAIL(job.id)}>
                    <Card className="border border-gray-200 bg-white rounded-xl hover:border-[#226D68]/40 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full group">
                      <div className="p-4 pb-0">
                        {job.company_logo_url ? (
                          <img
                            src={job.company_logo_url}
                            alt={job.company_name || ''}
                            className="h-9 w-auto max-w-[100px] object-contain object-left"
                          />
                        ) : (
                          <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide truncate">
                            {job.company_name || 'Yemma'}
                          </p>
                        )}
                      </div>
                      <div className="px-4 pt-3">
                        <h3 className="font-semibold text-[#2C2C2C] text-sm leading-tight line-clamp-2 group-hover:text-[#226D68] transition-colors">
                          {job.title}
                        </h3>
                      </div>
                      <div className="px-4 py-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-[#6b7280]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#226D68] shrink-0" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-[#226D68] shrink-0" />
                          {job.contract_type}
                        </span>
                        {job.salary_range && (
                          <span className="flex items-center gap-1 text-[#226D68] font-medium">
                            FCFA {job.salary_range}
                          </span>
                        )}
                        {job.sector && (
                          <span className="flex items-center gap-1 truncate max-w-full">
                            <Briefcase className="h-3.5 w-3.5 text-[#226D68] shrink-0" />
                            <span className="truncate">{job.sector}</span>
                          </span>
                        )}
                        {job.created_at && (
                          <span className="flex items-center gap-1" title="Publié le">
                            <Calendar className="h-3.5 w-3.5 text-[#226D68] shrink-0" />
                            Publié {formatDate(job.created_at)}
                          </span>
                        )}
                        {job.expires_at && (
                          <span className="flex items-center gap-1 text-amber-700" title="Expire le">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            Expire {formatDate(job.expires_at)}
                          </span>
                        )}
                      </div>
                      <div className="px-4 pb-4 mt-auto">
                        <span className="inline-flex items-center justify-center gap-1.5 w-full h-8 rounded-lg bg-[#226D68] group-hover:bg-[#1a5a55] text-white text-xs font-medium transition-colors">
                          <FileText className="h-3.5 w-3.5" />
                          Postuler
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* CTA public - visible uniquement pour visiteurs non connectés */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-[#6b7280] mb-3">
              Inscrivez-vous pour postuler aux offres et être visible dans la CVthèque.
            </p>
            <Button
              onClick={() => navigate(ROUTES.REGISTER_CANDIDAT)}
              className="bg-[#226D68] hover:bg-[#1a5a55]"
            >
              Créer mon compte gratuit
            </Button>
          </div>
        </div>
      </main>

      <PublicFooter />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
