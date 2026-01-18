import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X, Sparkles, TrendingUp, Users } from 'lucide-react'
import { searchApiService } from '../services/api'
import { ProSearchSidebar } from '../components/search/ProSearchSidebar'
import { ProCandidateList } from '../components/search/ProCandidateList'
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
    if (candidateId) {
      navigate(`/candidates/${candidateId}`)
    } else {
      console.error('Candidate ID is missing')
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r bg-card`}>
        {sidebarOpen && (
          <ProSearchSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header avec barre de recherche */}
        <div className="bg-card border-b p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            {!sidebarOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            )}
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <SearchAutocomplete
                value={query}
                onChange={handleQueryChange}
                placeholder="Rechercher des candidats par compétences, métier, secteur..."
              />
            </div>
          </div>
          
          {/* Statistiques et filtres actifs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              {total > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-2 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {total} candidat{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {hasActiveFilters && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
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
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto bg-background">
          <ProCandidateList
            results={results}
            loading={loading}
            onCandidateClick={handleCandidateClick}
          />

          {/* Pagination */}
          {!loading && total > size && (
            <div className="p-6 border-t bg-card">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="shrink-0"
                >
                  Précédent
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
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
                  className="shrink-0"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

