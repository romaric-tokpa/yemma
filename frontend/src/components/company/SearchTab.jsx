/**
 * SearchTab — Redesign Yemma Solutions
 * Aesthetic: Luxury editorial SaaS — consistent with CompanyDashboard & CandidateProfileDialog
 */
import { useState, useEffect, useCallback } from 'react'
import { buildPhotoUrl } from '@/utils/photoUtils'
import { useNavigate } from 'react-router-dom'
import {
  Search, Download, Mail, MapPin, Briefcase, Calendar, Filter, RefreshCw,
  ChevronLeft, ChevronRight, Eye, MessageSquare, Users, X
} from 'lucide-react'
import { searchApiService, documentApi } from '../../services/api'
import { CandidateSkeleton } from '../search/CandidateSkeleton'
import { ExpertReviewDialog } from '../search/ExpertReviewDialog'
import { AdvancedSearchFilters } from '../search/AdvancedSearchFilters'
import { generateAvatarFromFullName } from '@/utils/photoUtils'
import { getDisplayScore, getScoreColor } from '@/utils/validationScore'

/* ─── Styles ───────────────────────────────────────────────────── */

const STYLES = `
.ys-root { font-family: 'DM Sans', system-ui, sans-serif; }
.ys-serif { font-family: 'DM Serif Display', Georgia, serif; }

.ys-glass { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4); }

.ys-card {
  background: white;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02), 0 2px 8px rgba(0,0,0,0.02);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.ys-card:hover {
  border-color: rgba(14,124,123,0.12);
  box-shadow: 0 2px 6px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04);
  transform: translateY(-1px);
}

.ys-reveal { animation: ysReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes ysReveal { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.ys-scroll::-webkit-scrollbar { width: 4px; }
.ys-scroll::-webkit-scrollbar-track { background: transparent; }
.ys-scroll::-webkit-scrollbar-thumb { background: rgba(14,124,123,0.1); border-radius: 10px; }
.ys-scroll::-webkit-scrollbar-thumb:hover { background: rgba(14,124,123,0.2); }

.ys-input {
  height: 40px;
  padding: 0 16px 0 42px;
  border-radius: 12px;
  border: 1.5px solid #E2E8F0;
  background: #F8F9FB;
  font-size: 13px;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: #1A2B3C;
  outline: none;
  width: 100%;
  transition: all 0.2s ease;
}
.ys-input:focus {
  background: white;
  border-color: #0E7C7B;
  box-shadow: 0 0 0 3px rgba(14,124,123,0.08);
}
.ys-input::placeholder { color: #9CA3AF; }

.ys-badge-score {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.ys-action-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'DM Sans', system-ui, sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
}

.ys-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  background: transparent;
  color: #9CA3AF;
}
.ys-icon-btn:hover { background: #E8F4F3; color: #0E7C7B; }

.ys-skill-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  background: linear-gradient(135deg, #E8F4F3, #d5edeb);
  color: #0A5E5D;
  transition: transform 0.15s ease;
}
.ys-skill-pill:hover { transform: scale(1.05); }
`

/* ─── Helpers ──────────────────────────────────────────────────── */

const STORAGE_KEY = 'yemma_search_filters'

const loadFiltersFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) { console.error(e) }
  return null
}

const saveFiltersToStorage = (filters, query) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, query })) }
  catch (e) { console.error(e) }
}

const CANDIDATES_PER_PAGE = 25

/* ─── CandidateCard ────────────────────────────────────────────── */

function CandidateCard({ candidate, onCandidateClick, profilePhotos = {}, index = 0 }) {
  const [showExpertReview, setShowExpertReview] = useState(false)
  const [photoError, setPhotoError] = useState(false)

  const fullName = candidate.full_name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidat'
  const defaultAvatar = generateAvatarFromFullName(fullName)

  let photoUrl = buildPhotoUrl(candidate.photo_url, documentApi)
  if (!photoUrl && profilePhotos[candidate.candidate_id]) photoUrl = profilePhotos[candidate.candidate_id]
  const displayPhoto = (photoUrl && !photoError) ? photoUrl : defaultAvatar

  useEffect(() => {
    if (candidate.photo_url || profilePhotos[candidate.candidate_id]) setPhotoError(false)
  }, [candidate.photo_url, profilePhotos, candidate.candidate_id])

  const getStatus = () => {
    const status = candidate.status || 'VALIDATED'
    const isValidated = status === 'VALIDATED' || candidate.is_verified === true
    const display = getDisplayScore(candidate)
    if (isValidated && display) {
      const color = getScoreColor(display.value, display.scale)
      return { label: display.label, color, hasScore: true }
    }
    if (isValidated) return { label: 'N/A', color: 'bg-gray-400', hasScore: false }
    if (status === 'SUBMITTED' || status === 'IN_REVIEW') return { label: 'En cours', color: 'bg-amber-400', hasScore: false }
    return { label: 'Nouveau', color: 'bg-gray-400', hasScore: false }
  }
  const status = getStatus()

  const topSkills = (() => {
    if (!candidate.skills?.length) return []
    return candidate.skills.slice(0, 4).map(s => typeof s === 'object' ? s.name : s)
  })()

  const experience = candidate.total_experience || candidate.years_of_experience || 0

  const availabilityText = (() => {
    if (!candidate.availability) return null
    const map = { immediate: 'Immédiate', within_1_month: '< 1 mois', within_2_months: '< 2 mois', within_3_months: '< 3 mois', after_3_months: '> 3 mois' }
    return map[candidate.availability] || candidate.availability
  })()

  const hasReport = (candidate.admin_report && Object.keys(candidate.admin_report).length > 0) || candidate.admin_score != null

  return (
    <>
      <div
        className="ys-card group cursor-pointer ys-reveal"
        style={{ animationDelay: `${index * 0.03}s` }}
        onClick={() => onCandidateClick(candidate.candidate_id)}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            {/* Avatar + score */}
            <div className="relative shrink-0">
              <img
                src={displayPhoto}
                alt={fullName}
                className="w-14 h-14 rounded-xl object-cover ring-1 ring-gray-100 shadow-sm group-hover:ring-[#0E7C7B]/20 transition-all duration-300"
                key={`${candidate.candidate_id}-${photoUrl || 'default'}`}
                onError={(e) => { if (e.target.src !== defaultAvatar) { setPhotoError(true); e.target.src = defaultAvatar } }}
                onLoad={() => setPhotoError(false)}
              />
              <div
                className={`absolute -top-1.5 -right-1.5 ys-badge-score ${status.color} text-white shadow-sm`}
                title="Score d'évaluation (0–100)"
              >
                {status.label}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-[14px] text-gray-800 truncate group-hover:text-[#0E7C7B] transition-colors leading-tight">
                    {fullName}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mt-0.5 leading-snug">
                    {candidate.profile_title || candidate.title || candidate.main_job || 'Non spécifié'}
                  </p>
                </div>

                {/* Actions — desktop */}
                <div className="hidden sm:flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onCandidateClick(candidate.candidate_id)}
                    className="ys-action-btn text-white shadow-sm shadow-[#0E7C7B]/15 hover:shadow-[#0E7C7B]/25 hover:translate-y-[-1px]"
                    style={{ background: 'linear-gradient(135deg, #0E7C7B, #0A5E5D)' }}
                  >
                    <Eye className="h-3.5 w-3.5" /> Voir
                  </button>
                  {hasReport && (
                    <button
                      onClick={() => setShowExpertReview(true)}
                      className="ys-action-btn bg-[#F8F9FB] text-gray-600 border border-gray-100 hover:border-[#0E7C7B]/20 hover:bg-[#E8F4F3] hover:text-[#0E7C7B]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Avis
                    </button>
                  )}
                  <button className="ys-icon-btn" title="Télécharger CV">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button className="ys-icon-btn" title="Contacter">
                    <Mail className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5">
                {experience > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                    <Briefcase className="h-3 w-3 text-gray-300" />
                    {experience} an{experience > 1 ? 's' : ''}
                  </span>
                )}
                {candidate.location && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 truncate max-w-[140px]">
                    <MapPin className="h-3 w-3 text-gray-300 shrink-0" />
                    {candidate.location}
                  </span>
                )}
                {availabilityText && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                    <Calendar className="h-3 w-3 text-gray-300" />
                    {availabilityText}
                  </span>
                )}
              </div>

              {/* Skills */}
              {topSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {topSkills.map((skill, i) => (
                    <span key={i} className="ys-skill-pill">{skill}</span>
                  ))}
                  {candidate.skills?.length > 4 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-gray-400 bg-gray-50">
                      +{candidate.skills.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Actions — mobile */}
              <div className="flex sm:hidden items-center gap-1.5 mt-3 pt-3 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onCandidateClick(candidate.candidate_id)}
                  className="ys-action-btn text-white flex-1 justify-center shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #0E7C7B, #0A5E5D)' }}
                >
                  <Eye className="h-3.5 w-3.5" /> Voir le profil
                </button>
                {hasReport && (
                  <button onClick={() => setShowExpertReview(true)} className="ys-icon-btn border border-gray-100">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                )}
                <button className="ys-icon-btn border border-gray-100" title="CV"><Download className="h-3.5 w-3.5" /></button>
                <button className="ys-icon-btn border border-gray-100" title="Mail"><Mail className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showExpertReview && (
        <ExpertReviewDialog candidate={candidate} open={showExpertReview} onOpenChange={setShowExpertReview} />
      )}
    </>
  )
}

/* ─── Main SearchTab ───────────────────────────────────────────── */

export function SearchTab() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(CANDIDATES_PER_PAGE)
  const [profilePhotos, setProfilePhotos] = useState({})

  const savedState = loadFiltersFromStorage()
  const defaultFilters = {
    job_title: '',
    skills: [],
    min_experience: 0,
    max_experience: null,
    experience_ranges: [],
    availability: [],
    min_salary: null,
    max_salary: null,
    location: '',
    education_levels: [],
    min_admin_score: null,
    contract_types: [],
    sector: '',
    languages: {},
  }

  const [query, setQuery] = useState(savedState?.query || '')
  const [filters, setFilters] = useState(savedState?.filters || defaultFilters)
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)

  useEffect(() => {
    const check = () => { if (window.innerWidth < 1024) setSidebarOpen(false) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadProfilePhotos = useCallback(async (candidatesData) => {
    const photosMap = {}
    const withoutPhoto = candidatesData.filter(c => !c.photo_url || !buildPhotoUrl(c.photo_url, documentApi))
    if (!withoutPhoto.length) return
    const promises = withoutPhoto.slice(0, 20).map(async (candidate) => {
      try {
        const docs = await documentApi.getCandidateDocuments(candidate.candidate_id)
        const photoDoc = docs.filter(d => (d.document_type === 'PROFILE_PHOTO' || d.document_type === 'OTHER') && !d.deleted_at)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        if (photoDoc) photosMap[candidate.candidate_id] = documentApi.getDocumentServeUrl(photoDoc.id)
      } catch {}
    })
    await Promise.all(promises)
    setProfilePhotos(prev => ({ ...prev, ...photosMap }))
  }, [])

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      const req = {
        query: query || undefined,
        job_title: filters.job_title || undefined,
        skills: filters.skills?.length > 0 ? filters.skills : undefined,
        min_experience: filters.min_experience > 0 ? filters.min_experience : undefined,
        max_experience: filters.max_experience || undefined,
        location: filters.location || undefined,
        availability: filters.availability?.length > 0 ? filters.availability : undefined,
        education_levels: filters.education_levels?.length > 0 ? filters.education_levels : undefined,
        min_admin_score: filters.min_admin_score || undefined,
        contract_types: filters.contract_types?.length > 0 ? filters.contract_types : undefined,
        sector: filters.sector || undefined,
        min_salary: filters.min_salary || undefined,
        max_salary: filters.max_salary || undefined,
        page,
        size,
      }
      const response = await searchApiService.postSearch(req)
      const candidates = response.results || []
      setResults(candidates)
      setTotal(response.total || 0)
      if (candidates.length > 0) loadProfilePhotos(candidates).catch(() => {})
    } catch (e) { console.error(e); setResults([]); setTotal(0) }
    finally { setLoading(false) }
  }, [query, filters, page, size, loadProfilePhotos])

  useEffect(() => {
    const t = setTimeout(() => performSearch(), 300)
    return () => clearTimeout(t)
  }, [query, filters, page, performSearch])

  useEffect(() => {
    const t = setInterval(() => performSearch(), 30000)
    return () => clearInterval(t)
  }, [performSearch])

  useEffect(() => { saveFiltersToStorage(filters, query) }, [filters, query])

  const handleFilterChange = (f) => { setFilters(f); setPage(1); saveFiltersToStorage(f, query) }
  const handleQueryChange = (q) => { setQuery(q); setPage(1); saveFiltersToStorage(filters, q) }
  const handleCandidateClick = (id) => {
    const n = typeof id === 'number' ? id : parseInt(id, 10)
    if (!isNaN(n) && n > 0) navigate(`/candidates/${n}`)
  }

  const getActiveFiltersCount = () => {
    let c = 0
    if (query) c++
    if (filters.job_title) c++
    if (filters.skills?.length) c += filters.skills.length
    if (filters.min_experience > 0) c++
    if (filters.max_experience) c++
    if (filters.experience_ranges?.length) c++
    if (filters.availability?.length) c++
    if (filters.min_salary || filters.max_salary) c++
    if (filters.location) c++
    if (filters.education_levels?.length) c++
    if (filters.min_admin_score) c++
    if (filters.contract_types?.length) c++
    if (filters.sector) c++
    return c
  }

  const totalPages = Math.ceil(total / size)
  const activeCount = getActiveFiltersCount()

  const handleResetFilters = () => {
    setFilters(defaultFilters)
    setQuery('')
    setPage(1)
    saveFiltersToStorage(defaultFilters, '')
  }

  return (
    <div className="ys-root h-full flex flex-1 relative bg-[#F8F9FB]">
      <style>{STYLES}</style>

      {/* ═══ SIDEBAR FILTERS — Desktop ═══ */}
      <div className={`hidden lg:block ${sidebarOpen ? 'w-[280px]' : 'w-0'} transition-all duration-300 overflow-hidden shrink-0`}>
        {sidebarOpen && (
          <AdvancedSearchFilters filters={filters} facets={{}} onFilterChange={handleFilterChange} onClose={() => setSidebarOpen(false)} />
        )}
      </div>

      {/* ═══ SIDEBAR FILTERS — Mobile ═══ */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[300px] max-w-[90vw] shadow-2xl lg:hidden overflow-hidden flex flex-col">
            <AdvancedSearchFilters filters={filters} facets={{}} onFilterChange={handleFilterChange} onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ─── Search Header ─── */}
        <div className="ys-glass border-b border-gray-200/50 shrink-0 z-10">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Filter toggle */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`h-10 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 transition-all duration-200 border ${
                    sidebarOpen
                      ? 'bg-[#0E7C7B] text-white border-[#0E7C7B] shadow-sm shadow-[#0E7C7B]/15'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#0E7C7B]/30 hover:text-[#0E7C7B]'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Filtres</span>
                  {activeCount > 0 && (
                    <span className={`h-5 min-w-[20px] px-1 flex items-center justify-center rounded-md text-[10px] font-bold ${
                      sidebarOpen ? 'bg-white/20 text-white' : 'bg-[#0E7C7B] text-white'
                    }`}>
                      {activeCount}
                    </span>
                  )}
                </button>

                {/* Search input */}
                <div className="flex-1 min-w-0 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, poste, compétences…"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    className="ys-input"
                  />
                  {query && (
                    <button onClick={() => handleQueryChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Right controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => performSearch()}
                  disabled={loading}
                  className="h-10 px-3.5 rounded-xl text-xs font-medium text-gray-500 hover:text-[#0E7C7B] hover:bg-[#E8F4F3] flex items-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>

                {/* Result count */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F9FB] border border-gray-100">
                  <Users className="h-3 w-3 text-gray-300" />
                  <span className="text-xs font-bold text-gray-700 tabular-nums">{total}</span>
                  <span className="text-[10px] text-gray-400 hidden sm:inline">candidat{total !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Results Zone ─── */}
        <div className="flex-1 overflow-y-auto ys-scroll">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <CandidateSkeleton key={i} />)}
              </div>
            ) : results.length === 0 ? (
              /* Empty state */
              <div className="ys-card p-12 text-center ys-reveal">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8F4F3] to-[#d5edeb] flex items-center justify-center mx-auto mb-5">
                  <Search className="h-7 w-7 text-[#0E7C7B]/50" />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">Aucun candidat trouvé</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Modifiez vos critères de recherche ou réinitialisez les filtres pour élargir les résultats.
                </p>
                {activeCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-5 text-xs font-semibold text-[#0E7C7B] hover:underline"
                  >
                    Réinitialiser tous les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Results list */}
                <div className="space-y-2.5">
                  {results.map((candidate, i) => (
                    <CandidateCard
                      key={candidate.candidate_id}
                      candidate={candidate}
                      onCandidateClick={handleCandidateClick}
                      profilePhotos={profilePhotos}
                      index={i}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {total > size && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-5 border-t border-gray-100">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#0E7C7B] hover:border-[#0E7C7B]/20 hover:bg-[#E8F4F3] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = []
                        const maxVisible = 5
                        let start = Math.max(1, page - Math.floor(maxVisible / 2))
                        let end = Math.min(totalPages, start + maxVisible - 1)
                        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)

                        if (start > 1) {
                          pages.push(
                            <button key={1} onClick={() => setPage(1)} className="h-9 w-9 rounded-lg text-xs font-semibold text-gray-500 hover:bg-[#E8F4F3] hover:text-[#0E7C7B] transition-all">1</button>
                          )
                          if (start > 2) pages.push(<span key="dots-start" className="text-gray-300 text-xs px-0.5">…</span>)
                        }

                        for (let i = start; i <= end; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setPage(i)}
                              className={`h-9 w-9 rounded-lg text-xs font-semibold transition-all ${
                                i === page
                                  ? 'bg-gradient-to-br from-[#0E7C7B] to-[#0A5E5D] text-white shadow-sm shadow-[#0E7C7B]/15'
                                  : 'text-gray-500 hover:bg-[#E8F4F3] hover:text-[#0E7C7B]'
                              }`}
                            >
                              {i}
                            </button>
                          )
                        }

                        if (end < totalPages) {
                          if (end < totalPages - 1) pages.push(<span key="dots-end" className="text-gray-300 text-xs px-0.5">…</span>)
                          pages.push(
                            <button key={totalPages} onClick={() => setPage(totalPages)} className="h-9 w-9 rounded-lg text-xs font-semibold text-gray-500 hover:bg-[#E8F4F3] hover:text-[#0E7C7B] transition-all">{totalPages}</button>
                          )
                        }

                        return pages
                      })()}
                    </div>

                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="h-9 w-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#0E7C7B] hover:border-[#0E7C7B]/20 hover:bg-[#E8F4F3] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:hover:border-gray-200 transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
