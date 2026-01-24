import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X } from 'lucide-react'
import { searchApiService, authApiService, paymentApiService } from '../services/api'
import { SearchFilters } from '../components/search/SearchFilters'
import { CandidateCard } from '../components/search/CandidateCard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function SearchPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [facets, setFacets] = useState({})
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(20)
  
  // Filtres
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    sectors: [],
    main_jobs: [],
    min_experience: undefined,
    max_experience: undefined,
    min_admin_score: undefined,
    skills: [],
    contract_types: [],
    locations: [],
  })
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const user = await authApiService.getCurrentUser()
      if (user.company_id) {
        const sub = await paymentApiService.getSubscription(user.company_id)
        setSubscription(sub)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const performSearch = async () => {
    setLoading(true)
    try {
      const response = await searchApiService.searchCandidates({
        query,
        ...filters,
        page,
        size,
      })
      setResults(response.results || [])
      setFacets(response.facets || {})
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    performSearch()
  }, [page, filters])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    performSearch()
  }

  const handleCandidateClick = (candidateId) => {
    navigate(`/candidates/${candidateId}`)
  }

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sidebar - Desktop: fixe, Mobile: drawer */}
      {/* Desktop: Sidebar fixe */}
      <div className={`hidden lg:block ${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r bg-white`}>
        {sidebarOpen && (
          <SearchFilters
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
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw] sm:max-w-[85vw] bg-white shadow-xl lg:hidden transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col">
            <SearchFilters
              filters={filters}
              facets={facets}
              onFilterChange={handleFilterChange}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - Responsive */}
        <div className="bg-white border-b p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {!sidebarOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtres</span>
                </Button>
              )}
              
              <form onSubmit={handleSearch} className="flex-1 flex gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher des candidats..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8 sm:pl-10 text-sm sm:text-base"
                  />
                </div>
                <Button type="submit" disabled={loading} className="flex-shrink-0 text-xs sm:text-sm">
                  <span className="hidden sm:inline">Rechercher</span>
                  <span className="sm:hidden">
                    <Search className="h-4 w-4" />
                  </span>
                </Button>
              </form>
            </div>
          </div>
          
          {total > 0 && (
            <div className="mt-2 text-xs sm:text-sm text-gray-600">
              {total} candidat{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Results - Responsive */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#226D68] mx-auto mb-2"></div>
                <div className="text-sm sm:text-base text-gray-500">Recherche en cours...</div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <Search className="h-10 w-10 sm:h-12 sm:w-12 mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-semibold">Aucun résultat trouvé</p>
              <p className="text-xs sm:text-sm mt-2 text-center">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {results.map((candidate) => (
                  <CandidateCard
                    key={candidate.candidate_id}
                    candidate={candidate}
                    onClick={() => handleCandidateClick(candidate.candidate_id)}
                  />
                ))}
              </div>

              {/* Pagination - Responsive */}
              {total > size && (
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Précédent
                  </Button>
                  <span className="flex items-center px-3 sm:px-4 text-xs sm:text-sm text-gray-600">
                    Page {page} sur {Math.ceil(total / size)}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= Math.ceil(total / size)}
                    onClick={() => setPage(page + 1)}
                    className="w-full sm:w-auto text-xs sm:text-sm"
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
  )
}

