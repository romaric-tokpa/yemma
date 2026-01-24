import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Search, X, ChevronDown, ArrowLeft, 
  LayoutDashboard, Settings, UserCircle, 
  FileText, ShoppingBag, Store, List, 
  ShoppingCart, Mail, Bell, CheckCircle2,
  Edit2, Lightbulb, Star, MoreVertical,
  Grid3x3, List as ListIcon
} from 'lucide-react'
import { searchApiService } from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Checkbox } from '../components/ui/checkbox'
import { Badge } from '../components/ui/badge'

export default function ProSearchPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(20)
  
  // Filtres
  const [query, setQuery] = useState('php')
  const [filters, setFilters] = useState({
    contract_types: [],
    folders: [],
    job_title: '',
    region: '',
    mobility: '',
    availability: [],
    experience: [],
    education: [],
    pricing: [],
    english_level: [],
    remote_work: [],
    work_time: [],
    freshness: [],
    administrative: [],
  })
  
  const [expandedFilters, setExpandedFilters] = useState({
    experience: false,
    education: false,
    pricing: false,
    english_level: false,
    remote_work: false,
    work_time: false,
    freshness: false,
    administrative: false,
  })

  const availabilityOptions = [
    { value: 'immediate', label: 'Immédiate', count: 13954 },
    { value: '1_month', label: 'Dans 1 mois', count: 225 },
    { value: '2_months', label: 'Dans 2 mois', count: 388 },
    { value: '3_months', label: 'Dans 3 mois', count: 382 },
  ]

  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      const requestData = {
        query: query || undefined,
        page,
        size,
      }
      
      const response = await searchApiService.postSearch(requestData)
      setResults(response.results || [])
      setTotal(response.total || 15520) // Valeur par défaut pour l'exemple
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [query, page, size])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [query, filters, page, performSearch])

  const handleAvailabilityChange = (value, checked) => {
    const current = filters.availability || []
    let newAvailability
    if (checked) {
      newAvailability = [...current, value]
    } else {
      newAvailability = current.filter(a => a !== value)
    }
    setFilters({ ...filters, availability: newAvailability })
  }

  const toggleFilterSection = (section) => {
    setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleCandidateClick = (candidateId) => {
    if (!candidateId) return
    const idNum = typeof candidateId === 'number' ? candidateId : parseInt(candidateId, 10)
    if (isNaN(idNum) || idNum <= 0) return
    navigate(`/candidates/${idNum}`)
  }

  // Données de démonstration pour les profils
  const mockCandidates = [
    {
      id: 1,
      name: 'Sofien Benrhouma',
      title: 'PHP Team Leader',
      tjm: 250,
      salary: 45000,
      skills: ['Android', 'Angular'],
      experience: '5-10 ans',
      location: 'Nabeul',
      seen: true,
    },
    {
      id: 2,
      name: 'Jean Dupont',
      title: 'Développeur Full-Stack',
      tjm: 590,
      salary: 35000,
      skills: ['PHP', 'Laravel'],
      experience: '11-15 ans',
      location: 'Cachan (94)',
      seen: false,
    },
    {
      id: 3,
      name: 'Marie Martin',
      title: 'Chef de Projet',
      tjm: 520,
      salary: 43000,
      skills: ['JAVA/J2EE'],
      experience: '1-2 ans',
      location: 'Paris (75)',
      seen: false,
    },
    {
      id: 4,
      name: 'Amadou Diallo',
      title: 'Développeur Senior',
      tjm: 650,
      salary: null,
      skills: ['React', 'Node.js', 'TypeScript'],
      experience: '+ de 15 ans',
      location: 'Dakar',
      seen: false,
    },
    {
      id: 5,
      name: 'Fatou Traoré',
      title: 'Product Manager',
      tjm: 580,
      salary: 50000,
      skills: ['Agile', 'Scrum'],
      experience: '5-10 ans',
      location: 'Tunis',
      seen: false,
    },
  ]

  const displayResults = results.length > 0 ? results : mockCandidates

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left Sidebar - Navigation (Dark Blue) */}
      <aside className="w-64 bg-blue-deep text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-blue-deep/50">
          <div className="bg-white rounded-lg px-3 py-2 inline-block">
            <span className="text-blue-deep font-bold text-sm">Yemma-Solutions</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4">
          <Link to="/company/dashboard" className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-blue-deep/80 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm">Mon dashboard</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Link>
          <Link to="/company/dashboard?tab=account" className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-blue-deep/80 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Mon compte</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Link>
          <Link to="/search" className="flex items-center gap-3 px-4 py-3 bg-blue-deep/80 text-white font-medium">
            <UserCircle className="w-5 h-5" />
            <span className="text-sm">CVthèque</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Link>
          <Link to="/company/dashboard?tab=offers" className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-blue-deep/80 hover:text-white transition-colors">
            <FileText className="w-5 h-5" />
            <span className="text-sm">Mes offres</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Link>
          <Link to="/marketplace" className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-blue-deep/80 hover:text-white transition-colors">
            <Store className="w-5 h-5" />
            <span className="text-sm">Place de marché</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Link>
          <Link to="/resources" className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-blue-deep/80 hover:text-white transition-colors">
            <List className="w-5 h-5" />
            <span className="text-sm">Ressources</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Link>
        </nav>

        {/* Footer Logo */}
        <div className="p-4 border-t border-blue-deep/50">
          <span className="text-white/60 text-xs">Yemma-Solutions</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar (Dark Blue) */}
        <header className="bg-blue-deep text-white px-6 py-4 border-b border-blue-deep/50">
          <div className="flex items-center justify-between mb-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5 text-white/70" />
              <span className="text-sm font-medium">CVthèque</span>
            </div>

            {/* Utility Icons */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-white/80" />
                <span className="absolute -top-2 -right-2 bg-[#226D68] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              </div>
              <Mail className="w-5 h-5 text-white/80" />
              <Bell className="w-5 h-5 text-white/80" />
              <div className="w-8 h-8 bg-white rounded-full border-2 border-blue-deep flex items-center justify-center">
                <span className="text-blue-deep text-xs font-bold">HR</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3">
            <select className="bg-blue-deep/80 border border-white/20 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
              <option>Tous les contrats</option>
            </select>
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
            />
            <select className="bg-blue-deep/80 border border-white/20 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
              <option>Mes dossiers</option>
            </select>
            <select className="bg-blue-deep/80 border border-white/20 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
              <option>Poste</option>
            </select>
            <select className="bg-blue-deep/80 border border-white/20 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
              <option>Région/Pays</option>
            </select>
            <select className="bg-blue-deep/80 border border-white/20 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30">
              <option>Mobilité</option>
            </select>
            <Button className="bg-blue-deep/90 hover:bg-blue-deep border border-white/20 text-white px-6 py-2">
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
            <div className="flex flex-col items-center">
              <span className="text-xs text-white/80">{total} profils</span>
            </div>
            <div className="flex gap-1">
              <button className="w-8 h-8 bg-blue-deep/80 hover:bg-blue-deep/90 border border-white/20 rounded flex items-center justify-center">
                <X className="w-4 h-4 text-white/80" />
              </button>
              <button className="w-8 h-8 bg-blue-deep/80 hover:bg-blue-deep/90 border border-white/20 rounded flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white/80" />
              </button>
              <button className="w-8 h-8 bg-blue-deep/80 hover:bg-blue-deep/90 border border-white/20 rounded flex items-center justify-center">
                <Star className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - Filters + Results */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Filter Panel (White) */}
          <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              {/* Disponibilité */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Disponibilité</h3>
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-2">
                  {availabilityOptions.map((option) => {
                    const checked = filters.availability?.includes(option.value) || false
                    return (
                      <div key={option.value} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`avail-${option.value}`}
                            checked={checked}
                            onCheckedChange={(checked) => handleAvailabilityChange(option.value, checked)}
                          />
                          <label htmlFor={`avail-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                            {option.label}
                          </label>
                        </div>
                        <span className="text-xs text-[#226D68] font-medium">{option.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Other Filter Sections */}
              {[
                { key: 'experience', label: 'Expérience' },
                { key: 'education', label: 'Niveau d\'études' },
                { key: 'pricing', label: 'Tarification' },
                { key: 'english_level', label: 'Niveau d\'anglais' },
                { key: 'remote_work', label: 'Télétravail' },
                { key: 'work_time', label: 'Temps de travail' },
                { key: 'freshness', label: 'Fraîcheur' },
                { key: 'administrative', label: 'Administratif' },
              ].map((section) => (
                <div key={section.key} className="mb-4">
                  <button
                    onClick={() => toggleFilterSection(section.key)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-sm font-medium text-gray-700">{section.label}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedFilters[section.key] ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </aside>

          {/* Right Results Area (White) */}
          <main className="flex-1 overflow-y-auto bg-white">
            {/* Results Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">Profils</span>
                <Badge className="bg-blue-deep text-white">300+</Badge>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Grid3x3 className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded bg-gray-100">
                  <ListIcon className="w-4 h-4 text-blue-deep" />
                </button>
                <select className="text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-deep/20">
                  <option>Pertinence</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Table Header */}
            <div className="bg-blue-deep text-white px-6 py-3">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium">
                <div className="col-span-1"></div>
                <div className="col-span-3">NOM – TITRE DU CV</div>
                <div className="col-span-1">TJM</div>
                <div className="col-span-1">SALAIRE</div>
                <div className="col-span-2">COMPÉTENCES</div>
                <div className="col-span-2">EXPÉRIENCE</div>
                <div className="col-span-2">RÉSIDENCE</div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-100">
              {displayResults.map((candidate) => (
                <div
                  key={candidate.id || candidate.candidate_id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleCandidateClick(candidate.id || candidate.candidate_id)}
                >
                  <div className="col-span-1 flex items-center">
                    <Checkbox />
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {candidate.name || candidate.full_name || 'Candidat'}
                        </span>
                        {candidate.seen && (
                          <CheckCircle2 className="w-4 h-4 text-[#226D68]" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {candidate.title || candidate.main_job || 'Titre non spécifié'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center">
                    {candidate.tjm && (
                      <Badge className="bg-[#226D68] text-white text-xs font-medium px-2 py-1 rounded-full">
                        {candidate.tjm} €
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center">
                    {candidate.salary ? (
                      <Badge className="bg-[#e76f51] text-white text-xs font-medium px-2 py-1 rounded-full">
                        {candidate.salary.toLocaleString('fr-FR').replace(/\s/g, ' ')} €
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center gap-1 flex-wrap">
                    {candidate.skills?.slice(0, 2).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-deep border-blue-200 px-2 py-0.5 rounded">
                        {typeof skill === 'string' ? skill : skill.name}
                      </Badge>
                    ))}
                    {candidate.skills?.length > 2 && (
                      <span className="text-xs text-blue-deep font-medium">+{candidate.skills.length - 2}</span>
                    )}
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-gray-700">
                      {candidate.experience || (candidate.years_of_experience ? `${candidate.years_of_experience} ans` : 'Non spécifié')}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-gray-700">
                      {candidate.location || 'Non spécifié'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
