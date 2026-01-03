import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X } from 'lucide-react'
import { searchApiService, authApiService, paymentApiService } from '../services/api'
import { SearchFilters } from '../components/search/SearchFilters'
import { CandidateCard } from '../components/search/CandidateCard'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export function SearchPage() {
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r bg-white`}>
        {sidebarOpen && (
          <SearchFilters
            filters={filters}
            facets={facets}
            onFilterChange={handleFilterChange}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
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
            
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher des candidats..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                Rechercher
              </Button>
            </form>
          </div>
          
          {total > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {total} candidat{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Recherche en cours...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">Aucun résultat trouvé</p>
              <p className="text-sm mt-2">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((candidate) => (
                <CandidateCard
                  key={candidate.candidate_id}
                  candidate={candidate}
                  onClick={() => handleCandidateClick(candidate.candidate_id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > size && (
            <div className="mt-8 flex justify-center gap-2">
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

