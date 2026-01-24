import { useState, useEffect, useCallback } from 'react'
import { generateAvatarUrl, buildPhotoUrl } from '@/utils/photoUtils'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Download, Mail, Star, MapPin, Briefcase, GraduationCap, Calendar, X, Filter, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { searchApiService, documentApi } from '../../services/api'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { CandidateSkeleton } from '../search/CandidateSkeleton'
import { ExpertReviewDialog } from '../search/ExpertReviewDialog'
import { AdvancedSearchFilters } from '../search/AdvancedSearchFilters'
import { generateAvatarFromFullName } from '@/utils/photoUtils'

// Générer les initiales pour l'avatar local
const getInitials = (fullName) => {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return (parts[0]?.[0] || 'C').toUpperCase()
}


// Clé pour localStorage
const STORAGE_KEY = 'yemma_search_filters'

// Fonction pour charger les filtres depuis localStorage
const loadFiltersFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading filters from storage:', error)
  }
  return null
}

// Fonction pour sauvegarder les filtres dans localStorage
const saveFiltersToStorage = (filters, query) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, query }))
  } catch (error) {
    console.error('Error saving filters to storage:', error)
  }
}

const CANDIDATES_PER_PAGE = 25

export function SearchTab() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(CANDIDATES_PER_PAGE)
  const [profilePhotos, setProfilePhotos] = useState({}) // Cache pour les URLs de photos par candidate_id
  
  // Charger les filtres sauvegardés ou utiliser les valeurs par défaut
  const savedState = loadFiltersFromStorage()
  const defaultFilters = {
    job_title: '',
    skills: [],
    min_experience: 0,
    max_experience: null,
    experience_ranges: [],
    availability: [],
    salary_min: null,
    salary_max: null,
    location: '',
    education_levels: [],
    min_admin_score: null,
    contract_types: [],
    sector: '',
    languages: {},
  }
  
  // Filtres
  const [query, setQuery] = useState(savedState?.query || '')
  const [filters, setFilters] = useState(savedState?.filters || defaultFilters)
  // Sidebar ouverte par défaut sur desktop (lg breakpoint), fermée sur mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 // lg breakpoint de Tailwind
    }
    return true // Par défaut ouvert si on ne peut pas détecter
  })
  
  // Ajuster l'état de la sidebar selon la taille de l'écran au montage
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        // Sur mobile/tablette, fermer la sidebar au chargement
        setSidebarOpen(false)
      }
    }
    
    checkScreenSize()
    // Écouter les changements de taille d'écran
    const handleResize = () => {
      // Ne pas forcer la fermeture/ouverture lors du resize, laisser l'utilisateur contrôler
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Exécuter seulement au montage

  // Fonction pour charger les photos de profil depuis les documents
  const loadProfilePhotos = useCallback(async (candidatesData) => {
    const photosMap = {}
    
    // Pour chaque candidat sans photo_url, chercher dans les documents
    const candidatesWithoutPhoto = candidatesData.filter(c => !c.photo_url || !buildPhotoUrl(c.photo_url, documentApi))
    
    if (candidatesWithoutPhoto.length === 0) {
      return
    }
    
    console.log(`SearchTab: Loading photos for ${candidatesWithoutPhoto.length} candidates without photo_url`)
    
    // Charger les photos en parallèle (avec limite pour éviter trop de requêtes)
    const photoPromises = candidatesWithoutPhoto.slice(0, 20).map(async (candidate) => {
      try {
        const docs = await documentApi.getCandidateDocuments(candidate.candidate_id)
        const photoDoc = docs
          .filter(doc => 
            (doc.document_type === 'PROFILE_PHOTO' || doc.document_type === 'OTHER') &&
            !doc.deleted_at
          )
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
        
        if (photoDoc) {
          const serveUrl = documentApi.getDocumentServeUrl(photoDoc.id)
          photosMap[candidate.candidate_id] = serveUrl
          console.log(`SearchTab: Found photo for candidate ${candidate.candidate_id}:`, serveUrl)
        }
      } catch (error) {
        console.warn(`SearchTab: Error loading photo for candidate ${candidate.candidate_id}:`, error)
      }
    })
    
    await Promise.all(photoPromises)
    
    // Mettre à jour le cache des photos
    setProfilePhotos(prev => ({ ...prev, ...photosMap }))
  }, [])

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      // Construire la requête avec tous les filtres
      const requestData = {
        query: query || undefined,
        job_title: filters.job_title || undefined,
        skills: filters.skills?.length > 0 ? filters.skills : undefined,
        min_experience: filters.min_experience > 0 ? filters.min_experience : undefined,
        max_experience: filters.max_experience || undefined,
        location: filters.location || undefined,
        availability: filters.availability && filters.availability.length > 0
          ? filters.availability
          : undefined,
        education_levels: filters.education_levels && filters.education_levels.length > 0
          ? filters.education_levels
          : undefined,
        min_admin_score: filters.min_admin_score || undefined,
        contract_types: filters.contract_types && filters.contract_types.length > 0
          ? filters.contract_types
          : undefined,
        sector: filters.sector || undefined,
        min_salary: filters.min_salary || undefined,
        max_salary: filters.max_salary || undefined,
        page,
        size,
      }
      
      const response = await searchApiService.postSearch(requestData)
      const candidates = response.results || []
      setResults(candidates)
      setTotal(response.total || 0)
      
      // Charger les photos pour les candidats sans photo_url
      if (candidates.length > 0) {
        loadProfilePhotos(candidates).catch(err => {
          console.warn('SearchTab: Error loading profile photos:', err)
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [query, filters, page, size, loadProfilePhotos])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [query, filters, page, performSearch])
  
  // Rafraîchir automatiquement les résultats toutes les 30 secondes pour voir les nouveaux profils validés
  useEffect(() => {
    const intervalId = setInterval(() => {
      performSearch()
    }, 30000) // Rafraîchir toutes les 30 secondes
    
    return () => clearInterval(intervalId)
  }, [performSearch])

  // Sauvegarder les filtres automatiquement quand ils changent
  useEffect(() => {
    saveFiltersToStorage(filters, query)
  }, [filters, query])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
    // Sauvegarder les filtres dans localStorage
    saveFiltersToStorage(newFilters, query)
  }

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery)
    setPage(1)
    // Sauvegarder la requête dans localStorage
    saveFiltersToStorage(filters, newQuery)
  }

  const handleCandidateClick = (candidateId) => {
    if (!candidateId) {
      console.error('Candidate ID is missing')
      return
    }
    
    const idNum = typeof candidateId === 'number' ? candidateId : parseInt(candidateId, 10)
    
    if (isNaN(idNum) || idNum <= 0) {
      console.error('Invalid candidate ID:', candidateId)
      return
    }
    
    navigate(`/candidates/${idNum}`)
  }

  const sectors = [
    'IT & Digital', 'RH & Management', 'Marketing & Communication',
    'Finance & Comptabilité', 'Commerce & Vente', 'Logistique & Supply Chain',
    'Ingénierie & Technique', 'Santé & Social', 'Autres'
  ]

  const experienceOptions = [
    { label: "Moins de 1 an", value: "0-1" },
    { label: "1-2 ans", value: "1-2" },
    { label: "3-4 ans", value: "3-4" },
    { label: "5-10 ans", value: "5-10" },
    { label: "11-15 ans", value: "11-15" },
    { label: "Plus de 15 ans", value: "15+" },
  ]

  const availabilityOptions = [
    { label: "Immédiate", value: "immediate" },
    { label: "Dans moins de 1 mois", value: "within_1_month" },
    { label: "Dans moins de 2 mois", value: "within_2_months" },
    { label: "Dans moins de 3 mois", value: "within_3_months" },
    { label: "Après 3 mois", value: "after_3_months" },
  ]

  const contractTypeOptions = [
    { label: "CDI", value: "CDI" },
    { label: "CDD", value: "CDD" },
    { label: "Stage", value: "STAGE" },
    { label: "Freelance", value: "FREELANCE" },
    { label: "Temps partiel", value: "TEMPS_PARTIEL" },
    { label: "Contrat temporaire", value: "TEMPORAIRE" },
  ]

  const educationLevelOptions = [
    { label: "Bac", value: "BAC" },
    { label: "Bac+2", value: "BAC_PLUS_2" },
    { label: "Bac+3", value: "BAC_PLUS_3" },
    { label: "Bac+4", value: "BAC_PLUS_4" },
    { label: "Bac+5", value: "BAC_PLUS_5" },
    { label: "Doctorat", value: "DOCTORAT" },
  ]


  const handleClearFilters = () => {
    setFilters(defaultFilters)
    setQuery('')
    setPage(1)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (query) count++
    if (filters.job_title) count++
    if (filters.skills.length > 0) count += filters.skills.length
    if (filters.min_experience > 0) count++
    if (filters.max_experience) count++
    if (filters.experience_ranges.length > 0) count++
    if (filters.availability.length > 0) count++
    if (filters.salary_min || filters.salary_max) count++
    if (filters.location) count++
    if (filters.education_levels.length > 0) count++
    if (filters.min_admin_score) count++
    if (filters.contract_types.length > 0) count++
    if (filters.sector) count++
    return count
  }

  return (
    <div className="h-full bg-gray-light flex flex-1 relative">
      {/* Sidebar des filtres - Desktop: fixe, Mobile/Tablette: drawer */}
      {/* Desktop: Sidebar fixe */}
      <div className={`hidden lg:block ${sidebarOpen ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200`}>
        {sidebarOpen && (
          <AdvancedSearchFilters
            filters={filters}
            facets={{}}
            onFilterChange={handleFilterChange}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Mobile/Tablette: Drawer overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] sm:max-w-[85vw] bg-white shadow-xl lg:hidden transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col animate-in slide-in-from-left">
            <AdvancedSearchFilters
              filters={filters}
              facets={{}}
              onFilterChange={handleFilterChange}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - Responsive */}
        <div className="bg-white border-b shadow-sm">
          <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtres</span>
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                )}
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-anthracite font-heading truncate">
                  CVthèque
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => performSearch()}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </Button>
                <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  {total > 0 && (
                    <span className="hidden sm:inline">
                      {total} candidat{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="sm:hidden">{total}</span>
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
          ) : results.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <p className="text-sm sm:text-base text-gray-600">Aucun candidat trouvé</p>
            </Card>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {results.map((candidate) => (
                  <CandidateCard
                    key={candidate.candidate_id}
                    candidate={candidate}
                    onCandidateClick={handleCandidateClick}
                    profilePhotos={profilePhotos}
                  />
                ))}
              </div>

              {/* Pagination - Responsive */}
              {total > size && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="border-blue-deep text-blue-deep hover:bg-blue-deep/10 w-full sm:w-auto"
                  >
                    Précédent
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-700">
                      Page {page} de {Math.ceil(total / size)}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    disabled={page >= Math.ceil(total / size)}
                    onClick={() => setPage(page + 1)}
                    className="border-blue-deep text-blue-deep hover:bg-blue-deep/10 w-full sm:w-auto"
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

function CandidateCard({ candidate, onCandidateClick, profilePhotos = {} }) {
  const [showExpertReview, setShowExpertReview] = useState(false)
  
  const fullName = candidate.full_name || 
    `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 
    'Candidat'
  const initials = getInitials(fullName)
  const defaultAvatar = generateAvatarFromFullName(fullName)
  
  // Construire l'URL complète de la photo
  // D'abord essayer depuis photo_url du candidat
  let photoUrl = buildPhotoUrl(candidate.photo_url, documentApi)
  
  // Si pas de photo_url, essayer depuis le cache des photos chargées depuis les documents
  if (!photoUrl && profilePhotos[candidate.candidate_id]) {
    photoUrl = profilePhotos[candidate.candidate_id]
  }
  
  const displayPhoto = photoUrl || defaultAvatar
  
  // Gérer l'erreur de chargement de l'image
  const [photoError, setPhotoError] = useState(false)
  
  // Si photo_url change, réinitialiser l'erreur
  useEffect(() => {
    if (candidate.photo_url || profilePhotos[candidate.candidate_id]) {
      setPhotoError(false)
    }
  }, [candidate.photo_url, profilePhotos, candidate.candidate_id])
  
  // Déterminer le statut et le score
  const getStatus = () => {
    // Vérifier le statut - les profils dans la CVthèque doivent être VALIDATED
    const status = candidate.status || 'VALIDATED'
    const isValidated = status === 'VALIDATED' || candidate.is_verified === true
    
    // Récupérer le score admin depuis différentes sources possibles
    let adminScore = null
    if (candidate.admin_score !== null && candidate.admin_score !== undefined) {
      adminScore = candidate.admin_score
    } else if (candidate.admin_report?.overall_score !== null && candidate.admin_report?.overall_score !== undefined) {
      adminScore = candidate.admin_report.overall_score
    }
    
    // Si le profil est validé, toujours afficher le score au lieu de "Validé"
    if (isValidated) {
      // Si on a un score (même 0), l'afficher
      if (adminScore !== null && adminScore !== undefined) {
        const score = typeof adminScore === 'number' ? adminScore.toFixed(1) : parseFloat(adminScore).toFixed(1)
        const scoreNum = typeof adminScore === 'number' ? adminScore : parseFloat(adminScore) || 0
        
        // Déterminer la couleur selon le score
        if (scoreNum >= 4.5) return { label: `${score}/5`, color: 'bg-[#226D68]' }
        if (scoreNum >= 4.0) return { label: `${score}/5`, color: 'bg-blue-500' }
        if (scoreNum >= 3.5) return { label: `${score}/5`, color: 'bg-yellow-500' }
        if (scoreNum >= 2.5) return { label: `${score}/5`, color: 'bg-[#e76f51]' }
        // Même pour les scores faibles, afficher le score
        return { label: `${score}/5`, color: 'bg-red-500' }
      }
      // Si le profil est validé mais n'a vraiment pas de score (cas rare), afficher "N/A"
      // Mais normalement tous les profils validés devraient avoir un score
      return { label: 'N/A', color: 'bg-gray-500' }
    }
    
    // Si le profil n'est pas validé (ne devrait pas arriver dans la CVthèque)
    if (status === 'SUBMITTED' || status === 'IN_REVIEW') {
      return { label: 'En validation', color: 'bg-yellow-500' }
    }
    
    return { label: 'Nouveau', color: 'bg-gray-500' }
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
                key={`${candidate.candidate_id}-${photoUrl || 'default'}`}
                onError={(e) => {
                  // Si l'image échoue, utiliser l'avatar par défaut
                  if (e.target.src !== defaultAvatar) {
                    console.warn('SearchTab: Photo failed to load for candidate', candidate.candidate_id, 'URL was:', e.target.src)
                    setPhotoError(true)
                    e.target.src = defaultAvatar
                  }
                }}
                onLoad={() => {
                  // Si l'image se charge avec succès, réinitialiser l'erreur
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
                    {((candidate.admin_report && Object.keys(candidate.admin_report).length > 0) || 
                      (candidate.admin_score !== null && candidate.admin_score !== undefined)) && (
                      <button
                        onClick={() => setShowExpertReview(true)}
                        className="hidden md:flex text-xs sm:text-sm font-medium text-blue-deep hover:text-blue-deep/80 transition-colors border border-blue-deep rounded px-3 py-2 sm:py-1.5 whitespace-nowrap"
                      >
                        Avis expert
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 justify-between sm:justify-start">
                    {((candidate.admin_report && Object.keys(candidate.admin_report).length > 0) || 
                      (candidate.admin_score !== null && candidate.admin_score !== undefined)) && (
                      <button
                        onClick={() => setShowExpertReview(true)}
                        className="md:hidden flex-1 text-xs font-medium text-blue-deep hover:text-blue-deep/80 transition-colors border border-blue-deep rounded px-2 py-1.5 whitespace-nowrap"
                      >
                        Avis expert
                      </button>
                    )}
                    <button
                      className="p-2 text-gray-600 hover:text-blue-deep hover:bg-gray-50 rounded transition-colors"
                      title="Télécharger CV"
                      aria-label="Télécharger CV"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-blue-deep hover:bg-gray-50 rounded transition-colors"
                      title="Envoyer un email"
                      aria-label="Envoyer un email"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-yellow-500 hover:bg-gray-50 rounded transition-colors"
                      title="Ajouter aux favoris"
                      aria-label="Ajouter aux favoris"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {showExpertReview && (
        <ExpertReviewDialog
          candidate={candidate}
          open={showExpertReview}
          onOpenChange={setShowExpertReview}
        />
      )}
    </>
  )
}
