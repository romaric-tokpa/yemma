import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X, Sparkles, TrendingUp, Users, Menu, List, Grid3x3 } from 'lucide-react'
import { searchApiService } from '../services/api'
import { ProSearchSidebar } from '../components/search/ProSearchSidebar'
import { ProCandidateList } from '../components/search/ProCandidateList'
import { ProCandidateKanban } from '../components/search/ProCandidateKanban'
import { SearchAutocomplete } from '../components/search/SearchAutocomplete'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

export function ProSearchPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(20)
  
  // Filtres
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    min_experience: 0,
    experience_ranges: [],
    skills: [],
    location: '',
    job_title: '',
    availability: [],
    education_levels: [],
    salary_ranges: [],
    languages: {},
  })
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState('list') // 'list' ou 'kanban'
  const hasActiveFilters = 
    filters.min_experience > 0 || 
    filters.experience_ranges.length > 0 ||
    filters.skills.length > 0 || 
    filters.location ||
    filters.job_title ||
    filters.availability.length > 0 ||
    filters.education_levels.length > 0 ||
    filters.salary_ranges.length > 0 ||
    Object.keys(filters.languages || {}).length > 0

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      const requestData = {
        query: query || undefined,
        min_experience: filters.min_experience > 0 ? filters.min_experience : undefined,
        experience_ranges: filters.experience_ranges && filters.experience_ranges.length > 0 
          ? filters.experience_ranges 
          : undefined,
        skills: filters.skills.length > 0 ? filters.skills : undefined,
        location: filters.location || undefined,
        job_title: filters.job_title || undefined,
        availability: filters.availability && filters.availability.length > 0 
          ? filters.availability 
          : undefined,
        education_levels: filters.education_levels && filters.education_levels.length > 0 
          ? filters.education_levels 
          : undefined,
        salary_ranges: filters.salary_ranges && filters.salary_ranges.length > 0 
          ? filters.salary_ranges 
          : undefined,
        languages: filters.languages && Object.keys(filters.languages).length > 0 
          ? filters.languages 
          : undefined,
        page,
        size,
      }
      
      const response = await searchApiService.postSearch(requestData)
      setResults(response.results || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [query, filters, page, size])

  useEffect(() => {
    // Debounce pour éviter trop de requêtes
    const timeoutId = setTimeout(() => {
      performSearch()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [query, filters, page, performSearch])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleQueryChange = (newQuery) => {
    setQuery(newQuery)
    setPage(1)
  }

  const handleCandidateClick = (candidateId) => {
    if (!candidateId) {
      console.error('Candidate ID is missing')
      return
    }
    
    // Convertir en nombre pour valider
    const idNum = typeof candidateId === 'number' ? candidateId : parseInt(candidateId, 10)
    
    if (isNaN(idNum) || idNum <= 0) {
      console.error('Invalid candidate ID:', candidateId)
      return
    }
    
    console.log('Navigating to candidate profile:', idNum)
    navigate(`/candidates/${idNum}`)
  }

  return (
    <div className="min-h-screen bg-gray-light flex flex-col">
      {/* Header avec gradient vert émeraude */}
      <div className="bg-gradient-to-r from-green-emerald to-green-emerald/90 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold font-heading mb-2">Recherche de Candidats</h1>
              <p className="text-white/80">Trouvez les meilleurs talents pour votre entreprise</p>
            </div>
            
            {/* Bouton pour afficher/masquer la sidebar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-white/10"
            >
              {sidebarOpen ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Masquer filtres
                </>
              ) : (
                <>
                  <Menu className="h-4 w-4 mr-2" />
                  Afficher filtres
                </>
              )}
            </Button>
          </div>

          {/* Barre de recherche principale */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70 z-10" />
            <input
              type="text"
              placeholder="Rechercher des candidats par compétences, métier, secteur..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
            />
            {query && (
              <button
                onClick={() => handleQueryChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Statistiques et filtres actifs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              {total > 0 && (
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 border border-white/20">
                  <Users className="h-5 w-5 text-white" />
                  <span className="text-sm font-semibold text-white">
                    {total} candidat{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Filtres actifs
                </Badge>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange({ 
                  min_experience: 0, 
                  experience_ranges: [],
                  skills: [], 
                  location: '',
                  job_title: '',
                  availability: [],
                  education_levels: [],
                  salary_ranges: [],
                  languages: {},
                })}
                className="text-white hover:bg-white/10 text-sm"
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal avec sidebar et résultats */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar des filtres */}
        {sidebarOpen && (
          <div className="w-80 border-r bg-white shadow-sm overflow-y-auto">
            <ProSearchSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Zone de résultats */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-light">
          {/* Barre d'outils avec toggle vue */}
          <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {total > 0 && (
                <span>
                  Affichage de {((page - 1) * size) + 1} à {Math.min(page * size, total)} sur {total} résultat{total > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {/* Toggle vue Liste/Kanban */}
            <div className="flex items-center gap-2 bg-gray-light rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-8 px-3 ${
                  viewMode === 'list' 
                    ? 'bg-green-emerald text-white hover:bg-green-emerald/90' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-4 w-4 mr-1.5" />
                Liste
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className={`h-8 px-3 ${
                  viewMode === 'kanban' 
                    ? 'bg-green-emerald text-white hover:bg-green-emerald/90' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid3x3 className="h-4 w-4 mr-1.5" />
                Kanban
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className={`max-w-7xl mx-auto px-6 py-6 ${viewMode === 'kanban' ? '' : ''}`}>
              {viewMode === 'list' ? (
                <ProCandidateList
                  results={results}
                  loading={loading}
                  onCandidateClick={handleCandidateClick}
                />
              ) : (
                <ProCandidateKanban
                  results={results}
                  loading={loading}
                  onCandidateClick={handleCandidateClick}
                />
              )}

              {/* Pagination */}
              {!loading && total > size && (
                <div className="mt-8 p-6 border-t border-border bg-white rounded-[12px] shadow-sm">
                  <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="shrink-0 border-blue-deep text-blue-deep hover:bg-blue-deep/10"
                    >
                      Précédent
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-anthracite font-medium">
                        Page {page} sur {Math.ceil(total / size)}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-xs text-muted-foreground">
                        {((page - 1) * size) + 1} - {Math.min(page * size, total)} sur {total}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      disabled={page >= Math.ceil(total / size)}
                      onClick={() => setPage(page + 1)}
                      className="shrink-0 border-blue-deep text-blue-deep hover:bg-blue-deep/10"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
