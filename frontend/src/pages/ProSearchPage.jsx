import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X } from 'lucide-react'
import { searchApiService } from '../services/api'
import { ProSearchSidebar } from '../components/search/ProSearchSidebar'
import { ProCandidateList } from '../components/search/ProCandidateList'
import { SearchAutocomplete } from '../components/search/SearchAutocomplete'
import { Button } from '../components/ui/button'

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
    skills: [],
    location: '',
  })
  
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      const response = await searchApiService.postSearch({
        query: query || undefined,
        min_experience: filters.min_experience > 0 ? filters.min_experience : undefined,
        skills: filters.skills.length > 0 ? filters.skills : undefined,
        location: filters.location || undefined,
        page,
        size,
      })
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
    navigate(`/candidates/${candidateId}`)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r bg-white`}>
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
        <div className="bg-white border-b p-4">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            )}
            
            <div className="flex-1">
              <SearchAutocomplete
                value={query}
                onChange={handleQueryChange}
                placeholder="Rechercher des candidats..."
              />
            </div>
          </div>
          
          {total > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {total} candidat{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          <ProCandidateList
            results={results}
            loading={loading}
            onCandidateClick={handleCandidateClick}
          />

          {/* Pagination */}
          {!loading && total > size && (
            <div className="p-6 flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Précédent
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {page} sur {Math.ceil(total / size)}
              </span>
              <Button
                variant="outline"
                disabled={page >= Math.ceil(total / size)}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

