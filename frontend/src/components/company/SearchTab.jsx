import { useState, useEffect, useCallback } from 'react'
import { generateAvatarUrl, buildPhotoUrl } from '@/utils/photoUtils'
import { useNavigate } from 'react-router-dom'
import { Search, Download, Mail, MapPin, Briefcase, Calendar, Filter, RefreshCw } from 'lucide-react'
import { searchApiService, documentApi } from '../../services/api'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
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
    <div className="h-full bg-[#F4F6F8] flex flex-1 relative">
      {/* Sidebar des filtres */}
      <div className={`hidden lg:block ${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-200 overflow-hidden border-r border-[#e5e7eb] shrink-0`}>
        {sidebarOpen && (
          <AdvancedSearchFilters
            filters={filters}
            facets={{}}
            onFilterChange={handleFilterChange}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[90vw] bg-white shadow-xl lg:hidden overflow-hidden flex flex-col border-r border-[#e5e7eb]">
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
        {/* Header compact */}
        <div className="bg-white border-b border-[#e5e7eb] shrink-0">
          <div className="px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className={`h-8 text-xs flex items-center gap-1.5 shrink-0 ${
                    sidebarOpen
                      ? 'bg-[#E8F4F3] text-[#226D68] border-[#226D68]/30 hover:bg-[#E8F4F3]'
                      : 'border-[#e5e7eb] text-[#2C2C2C] hover:bg-[#F4F6F8]'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filtres
                  {getActiveFiltersCount() > 0 && (
                    <Badge className="h-5 px-1.5 text-[10px] bg-[#226D68] text-white ml-0.5">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
                <div className="flex-1 min-w-0 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                  <Input
                    type="text"
                    placeholder="Rechercher par nom, poste, compétences..."
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    className="h-8 pl-9 text-sm border-[#e5e7eb] bg-[#F4F6F8]/50 focus:bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => performSearch()}
                  disabled={loading}
                  className="h-8 text-xs text-[#2C2C2C] hover:bg-[#F4F6F8]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                <span className="text-xs text-[#9ca3af] whitespace-nowrap">
                  {total} résultat{total !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone de résultats */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <CandidateSkeleton key={index} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <Card className="border-[#e5e7eb] shadow-none p-10 text-center">
                <p className="text-sm text-[#2C2C2C] font-medium">Aucun candidat trouvé</p>
                <p className="text-xs text-[#9ca3af] mt-1">Modifiez vos critères ou réinitialisez les filtres</p>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                {results.map((candidate) => (
                  <CandidateCard
                    key={candidate.candidate_id}
                    candidate={candidate}
                    onCandidateClick={handleCandidateClick}
                    profilePhotos={profilePhotos}
                  />
                ))}
              </div>

              {total > size && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-[#e5e7eb]">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="h-8 text-xs border-[#d1d5db] text-[#2C2C2C] hover:bg-[#F4F6F8]"
                  >
                    Précédent
                  </Button>
                  <span className="text-xs text-[#9ca3af]">
                    Page {page} / {Math.ceil(total / size)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= Math.ceil(total / size)}
                    onClick={() => setPage(page + 1)}
                    className="h-8 text-xs border-[#d1d5db] text-[#2C2C2C] hover:bg-[#F4F6F8]"
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
      <Card className="bg-white border border-[#e5e7eb] rounded-lg shadow-none hover:border-[#226D68]/30 transition-colors">
        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* Photo et badge */}
            <div className="relative flex-shrink-0">
              <img
                src={displayPhoto}
                alt={fullName}
                className="w-12 h-12 rounded-lg object-cover border border-[#e5e7eb]"
                key={`${candidate.candidate_id}-${photoUrl || 'default'}`}
                onError={(e) => {
                  if (e.target.src !== defaultAvatar) {
                    setPhotoError(true)
                    e.target.src = defaultAvatar
                  }
                }}
                onLoad={() => setPhotoError(false)}
              />
              <div 
                className={`absolute -top-0.5 -right-0.5 ${status.color} text-white text-[10px] font-semibold px-1.5 py-0.5 rounded cursor-help`}
                title="Score d'évaluation expert (0–5)"
              >
                {status.label}
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-[#2C2C2C] truncate">{fullName}</h3>
              <p className="text-xs text-[#9ca3af] truncate mt-0.5">
                {candidate.profile_title || candidate.title || candidate.main_job || 'Non spécifié'}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-[#9ca3af]">
                {experience > 0 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {experience} an{experience > 1 ? 's' : ''}
                  </span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1 truncate max-w-[120px]">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {candidate.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {getAvailabilityText()}
                </span>
              </div>
              {topSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {topSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8F4F3] text-[#226D68]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onCandidateClick(candidate.candidate_id)}
                className="h-8 px-3 text-xs font-medium bg-[#226D68] text-white rounded-md hover:bg-[#1a5a55] transition-colors"
              >
                Voir
              </button>
              {((candidate.admin_report && Object.keys(candidate.admin_report).length > 0) ||
                (candidate.admin_score != null)) && (
                <button
                  onClick={() => setShowExpertReview(true)}
                  className="h-8 px-2 text-xs font-medium text-[#2C2C2C] border border-[#e5e7eb] rounded-md hover:bg-[#F4F6F8]"
                >
                  Avis
                </button>
              )}
              <button
                className="h-8 w-8 flex items-center justify-center text-[#9ca3af] hover:text-[#226D68] hover:bg-[#E8F4F3] rounded-md transition-colors"
                title="Télécharger CV"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                className="h-8 w-8 flex items-center justify-center text-[#9ca3af] hover:text-[#226D68] hover:bg-[#E8F4F3] rounded-md transition-colors"
                title="Contact"
              >
                <Mail className="h-3.5 w-3.5" />
              </button>
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
