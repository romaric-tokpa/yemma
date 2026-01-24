import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Filter, ArrowLeft, Sparkles, RefreshCw, Briefcase, Calendar, MapPin
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { AdvancedSearchFilters } from '../components/search/AdvancedSearchFilters'
import { Badge } from '../components/ui/badge'
import { Card } from '../components/ui/card'
import { CandidateSkeleton } from '../components/search/CandidateSkeleton'
import { DemoExpertReviewDialog } from '../components/search/DemoExpertReviewDialog'
import { generateAvatarFromFullName } from '@/utils/photoUtils'
import { MOCK_CANDIDATES } from '../data/mockCandidates'

// Les données mockées (1200+ profils) sont importées depuis mockCandidates.js
// Elles couvrent tous les secteurs d'activité avec des profils variés et réalistes

// Générer les initiales pour l'avatar local
const getInitials = (fullName) => {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return (parts[0]?.[0] || 'C').toUpperCase()
}

const CANDIDATES_PER_PAGE = 25

export default function DemoCvtheque() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 // lg breakpoint de Tailwind
    }
    return true
  })
  
  // Filtres complets comme dans la vraie CVthèque
  const [filters, setFilters] = useState({
    sectors: [],
    main_jobs: [],
    min_experience: 0,
    max_experience: null,
    min_admin_score: undefined,
    skills: [],
    contract_types: [],
    locations: [],
    experience_ranges: [],
    availability: [],
    education_levels: [],
    location: '',
    min_salary: null,
    max_salary: null,
    job_title: '',
  })

  // Ajuster l'état de la sidebar selon la taille de l'écran au montage
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    checkScreenSize()
  }, [])

  // Filtrer les candidats selon les critères
  const filteredCandidates = useMemo(() => {
    let filtered = [...MOCK_CANDIDATES]

    // Recherche textuelle
    if (query.trim()) {
      const queryLower = query.toLowerCase()
      filtered = filtered.filter(candidate => 
        candidate.full_name.toLowerCase().includes(queryLower) ||
        candidate.title.toLowerCase().includes(queryLower) ||
        candidate.summary.toLowerCase().includes(queryLower) ||
        candidate.skills.some(skill => skill.name.toLowerCase().includes(queryLower))
      )
    }

    // Filtre par secteur
    if (filters.sectors.length > 0) {
      filtered = filtered.filter(candidate => 
        filters.sectors.includes(candidate.sector)
      )
    }

    // Filtre par expérience minimum
    if (filters.min_experience > 0) {
      filtered = filtered.filter(candidate => 
        candidate.years_of_experience >= filters.min_experience
      )
    }

    // Filtre par expérience maximum
    if (filters.max_experience !== null) {
      filtered = filtered.filter(candidate => 
        candidate.years_of_experience <= filters.max_experience
      )
    }

    // Filtre par score minimum
    if (filters.min_admin_score !== undefined && filters.min_admin_score > 0) {
      filtered = filtered.filter(candidate => 
        candidate.admin_score >= filters.min_admin_score
      )
    }

    // Filtre par compétences
    if (filters.skills.length > 0) {
      filtered = filtered.filter(candidate => 
        filters.skills.some(skill => 
          candidate.skills.some(c => 
            c.name.toLowerCase().includes(skill.toLowerCase())
          )
        )
      )
    }

    // Filtre par disponibilité
    if (filters.availability.length > 0) {
      filtered = filtered.filter(candidate => 
        filters.availability.includes(candidate.availability)
      )
    }

    return filtered
  }, [query, filters])

  // Pagination : calculer les candidats à afficher pour la page actuelle
  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * CANDIDATES_PER_PAGE
    const endIndex = startIndex + CANDIDATES_PER_PAGE
    return filteredCandidates.slice(startIndex, endIndex)
  }, [filteredCandidates, currentPage])

  const totalPages = Math.ceil(filteredCandidates.length / CANDIDATES_PER_PAGE)

  // Réinitialiser à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [query, filters])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const performSearch = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 300)
  }, [])

  const handleCandidateClick = (candidateId) => {
    navigate(`/demo/candidates/${candidateId}`)
  }

  // Générer des facettes mockées pour les filtres
  const facets = useMemo(() => {
    const sectors = [...new Set(MOCK_CANDIDATES.map(c => c.sector))]
    const mainJobs = [...new Set(MOCK_CANDIDATES.map(c => c.main_job))]
    const locations = [...new Set(MOCK_CANDIDATES.map(c => c.location))]
    
    return {
      sectors: sectors.map(s => ({ value: s, count: MOCK_CANDIDATES.filter(c => c.sector === s).length })),
      main_jobs: mainJobs.map(j => ({ value: j, count: MOCK_CANDIDATES.filter(c => c.main_job === j).length })),
      locations: locations.map(l => ({ value: l, count: MOCK_CANDIDATES.filter(c => c.location === l).length })),
      contract_types: [
        { value: 'CDI', count: Math.floor(MOCK_CANDIDATES.length * 0.6) },
        { value: 'CDD', count: Math.floor(MOCK_CANDIDATES.length * 0.2) },
        { value: 'FREELANCE', count: Math.floor(MOCK_CANDIDATES.length * 0.15) },
        { value: 'STAGE', count: Math.floor(MOCK_CANDIDATES.length * 0.05) }
      ]
    }
  }, [])

  const getActiveFiltersCount = () => {
    let count = 0
    if (query) count++
    if (filters.job_title) count++
    if (filters.skills.length > 0) count += filters.skills.length
    if (filters.min_experience > 0) count++
    if (filters.max_experience) count++
    if (filters.experience_ranges.length > 0) count++
    if (filters.availability.length > 0) count++
    if (filters.min_salary || filters.max_salary) count++
    if (filters.location) count++
    if (filters.education_levels.length > 0) count++
    if (filters.min_admin_score) count++
    if (filters.contract_types.length > 0) count++
    if (filters.sector) count++
    return count
  }

  return (
    <div className="h-screen bg-gray-light flex flex-1 relative">
      {/* Header avec badge démo - Compact */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-gray-700 h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-5 w-px bg-gray-300" />
            <div>
              <h1 className="text-sm font-bold">
                <span style={{ color: '#226D68' }}>Yemma</span>
                <span style={{ color: '#e76f51' }}>-Solutions</span>
              </h1>
              <p className="text-xs text-gray-500">Version Démo</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Mode Démo
          </Badge>
        </div>
      </div>

      {/* Sidebar des filtres - Desktop: fixe, Mobile/Tablette: drawer */}
      <div className={`hidden lg:block ${sidebarOpen ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 mt-12`}>
        {sidebarOpen && (
          <AdvancedSearchFilters
            filters={filters}
            facets={facets}
            onFilterChange={handleFilterChange}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Mobile/Tablette: Drawer overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden mt-12 animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] sm:max-w-[85vw] bg-white shadow-xl lg:hidden transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col animate-in slide-in-from-left mt-12">
            <AdvancedSearchFilters
              filters={filters}
              facets={facets}
              onFilterChange={handleFilterChange}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 mt-12">
        {/* Header - Responsive */}
        <div className="bg-white border-b shadow-sm relative z-50">
          <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4">
              {/* Section gauche : Filtres et titre */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0 overflow-hidden">
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0"
                  >
                    <Filter className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Filtres</span>
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="ml-1 flex-shrink-0">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                )}
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-anthracite font-heading truncate min-w-0">
                  CVthèque
                </h1>
              </div>
              
              {/* Section droite : Actualiser et compteur - Ne pas tronquer */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => performSearch()}
                  disabled={loading}
                  className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 px-1.5 sm:px-2 h-8"
                  title="Actualiser"
                >
                  <RefreshCw className={`h-4 w-4 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
                <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
                  {filteredCandidates.length > 0 ? (
                    <>
                      <span className="hidden sm:inline">
                        {filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''} trouvé{filteredCandidates.length > 1 ? 's' : ''}
                        {filteredCandidates.length > CANDIDATES_PER_PAGE && (
                          <span className="text-gray-500 ml-1">
                            (Page {currentPage}/{totalPages})
                          </span>
                        )}
                      </span>
                      <span className="sm:hidden">
                        {filteredCandidates.length}
                      </span>
                    </>
                  ) : (
                    <span>0 candidat</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone de résultats */}
        <div className="flex-1 overflow-y-auto bg-gray-light">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <CandidateSkeleton key={index} />
                ))}
              </div>
            ) : filteredCandidates.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center">
                <p className="text-sm sm:text-base text-gray-600">Aucun candidat trouvé</p>
              </Card>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {paginatedCandidates.map((candidate) => (
                    <DemoCandidateCard
                      key={candidate.candidate_id}
                      candidate={candidate}
                      onCandidateClick={handleCandidateClick}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {filteredCandidates.length > CANDIDATES_PER_PAGE && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="border-[#226D68] text-[#226D68] hover:bg-[#226D68]/10 w-full sm:w-auto"
                    >
                      Précédent
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-700">
                        Page {currentPage} de {totalPages}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({filteredCandidates.length} candidat{filteredCandidates.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="border-[#226D68] text-[#226D68] hover:bg-[#226D68]/10 w-full sm:w-auto"
                    >
                      Suivant
                    </Button>
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

function DemoCandidateCard({ candidate, onCandidateClick }) {
  const [showExpertReview, setShowExpertReview] = useState(false)
  
  const fullName = candidate.full_name || 
    `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 
    'Candidat'
  const defaultAvatar = generateAvatarFromFullName(fullName)
  const displayPhoto = defaultAvatar
  
  // Gérer l'erreur de chargement de l'image
  const [photoError, setPhotoError] = useState(false)
  
  // Déterminer le statut et le score
  const getStatus = () => {
    const isValidated = candidate.status === 'VALIDATED' || candidate.is_verified === true
    let adminScore = candidate.admin_score
    
    if (isValidated && adminScore !== null && adminScore !== undefined) {
      const score = typeof adminScore === 'number' ? adminScore.toFixed(1) : parseFloat(adminScore).toFixed(1)
      const scoreNum = typeof adminScore === 'number' ? adminScore : parseFloat(adminScore) || 0
      
      if (scoreNum >= 4.5) return { label: `${score}/5`, color: 'bg-[#226D68]' }
      if (scoreNum >= 4.0) return { label: `${score}/5`, color: 'bg-blue-500' }
      if (scoreNum >= 3.5) return { label: `${score}/5`, color: 'bg-yellow-500' }
      if (scoreNum >= 2.5) return { label: `${score}/5`, color: 'bg-[#e76f51]' }
      return { label: `${score}/5`, color: 'bg-red-500' }
    }
    
    return { label: 'N/A', color: 'bg-gray-500' }
  }
  
  const status = getStatus()
  
  // Récupérer les compétences principales
  const getTopSkills = () => {
    if (!candidate.skills || candidate.skills.length === 0) return []
    const skills = candidate.skills.map(skill => typeof skill === 'object' ? skill.name : skill)
    return skills.slice(0, 3)
  }
  
  const topSkills = getTopSkills()
  
  // Formatage de l'expérience
  const experience = candidate.total_experience || candidate.years_of_experience || 0
  
  // Formatage de la disponibilité
  const getAvailabilityText = () => {
    if (!candidate.availability) return 'Non spécifiée'
    const availabilityMap = {
      'immediate': 'Immédiate',
      'within_1_month': 'Dans moins de 1 mois',
      'within_2_months': 'Dans moins de 2 mois',
      'within_3_months': 'Dans moins de 3 mois',
      'after_3_months': 'Après 3 mois'
    }
    return availabilityMap[candidate.availability] || candidate.availability
  }
  
  return (
    <>
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Photo et badge */}
            <div className="relative flex-shrink-0 flex items-center gap-3 sm:block">
              <img
                src={displayPhoto}
                alt={fullName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  if (e.target.src !== defaultAvatar) {
                    setPhotoError(true)
                    e.target.src = defaultAvatar
                  }
                }}
                onLoad={() => {
                  if (photoError) {
                    setPhotoError(false)
                  }
                }}
              />
              <div className={`absolute -top-1 -right-1 sm:-top-1 sm:-right-1 ${status.color} text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow-md`}>
                {status.label}
              </div>
            </div>
            
            {/* Informations principales */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 lg:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 truncate">{fullName}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2 line-clamp-2">
                    {candidate.profile_title || candidate.title || candidate.main_job || 'Non spécifié'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 mb-2">
                    {experience > 0 && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">{experience} an{experience > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {candidate.location && (
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="truncate">{candidate.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{getAvailabilityText()}</span>
                    </div>
                  </div>
                  {topSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {topSkills.map((skill, index) => (
                        <Badge
                          key={index}
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1.5 sm:px-2 py-0.5"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Actions - Responsive */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCandidateClick(candidate.candidate_id)}
                      className="flex-1 sm:flex-none text-xs sm:text-sm font-medium transition-colors px-3 py-2 sm:py-1.5 border rounded whitespace-nowrap"
                      style={{ color: '#226D68', borderColor: '#226D68' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#1a5a55' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#226D68' }}
                    >
                      Voir Profil
                    </button>
                    {((candidate.admin_report && Object.keys(candidate.admin_report || {}).length > 0) || 
                      (candidate.admin_score !== null && candidate.admin_score !== undefined)) && (
                      <button
                        onClick={() => setShowExpertReview(true)}
                        className="hidden md:flex text-xs sm:text-sm font-medium text-blue-deep hover:text-blue-deep/80 transition-colors border border-blue-deep rounded px-3 py-2 sm:py-1.5 whitespace-nowrap"
                      >
                        Avis expert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {showExpertReview && (
        <DemoExpertReviewDialog
          candidate={candidate}
          open={showExpertReview}
          onOpenChange={setShowExpertReview}
        />
      )}
    </>
  )
}
