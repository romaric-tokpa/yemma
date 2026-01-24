import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  X, ChevronDown, ChevronUp, Search, SlidersHorizontal, 
  MapPin, Briefcase, GraduationCap, DollarSign, Star,
  Clock, Languages, Sparkles, Filter, XCircle, Save, Download, Upload,
  TrendingUp, Award, Users, Building2, Calendar
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Slider } from '../ui/slider'
import { Card, CardContent } from '../ui/card'
// Tooltip simple sans dépendance externe
const SimpleTooltip = ({ children, content }) => {
  const [show, setShow] = useState(false)
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

// Constantes pour les options de filtre
const EXPERIENCE_RANGES = [
  { label: "Débutant (< 1 an)", min: 0, max: 1 },
  { label: "Junior (1-3 ans)", min: 1, max: 3 },
  { label: "Confirmé (3-5 ans)", min: 3, max: 5 },
  { label: "Senior (5-10 ans)", min: 5, max: 10 },
  { label: "Expert (10+ ans)", min: 10, max: null },
]

const AVAILABILITY_OPTIONS = [
  { value: "immediate", label: "Immédiate", icon: Clock },
  { value: "within_1_month", label: "Sous 1 mois", icon: TrendingUp },
  { value: "within_2_months", label: "Sous 2 mois", icon: Calendar },
  { value: "within_3_months", label: "Sous 3 mois", icon: Calendar },
  { value: "after_3_months", label: "Après 3 mois", icon: Clock },
]

const EDUCATION_LEVELS = [
  { value: "BAC", label: "Baccalauréat", icon: GraduationCap },
  { value: "BAC_PLUS_2", label: "Bac+2 (BTS/DUT)", icon: GraduationCap },
  { value: "BAC_PLUS_3", label: "Bac+3 (Licence)", icon: GraduationCap },
  { value: "BAC_PLUS_4", label: "Bac+4 (Maîtrise)", icon: GraduationCap },
  { value: "BAC_PLUS_5", label: "Bac+5 (Master)", icon: Award },
  { value: "DOCTORAT", label: "Doctorat", icon: Award },
]

const CONTRACT_TYPES = [
  { value: "CDI", label: "CDI", icon: Building2 },
  { value: "CDD", label: "CDD", icon: Briefcase },
  { value: "STAGE", label: "Stage", icon: Users },
  { value: "FREELANCE", label: "Freelance", icon: Sparkles },
  { value: "TEMPS_PARTIEL", label: "Temps partiel", icon: Clock },
  { value: "TEMPORAIRE", label: "Temporaire", icon: Briefcase },
]

// Compétences populaires pour l'autocomplétion
const POPULAR_SKILLS = [
  "Python", "JavaScript", "React", "Node.js", "Java", "TypeScript", "Vue.js",
  "Angular", "Docker", "Kubernetes", "AWS", "Azure", "MongoDB", "PostgreSQL",
  "MySQL", "Redis", "Git", "CI/CD", "Agile", "Scrum", "Project Management",
  "Marketing digital", "SEO", "SEM", "Social Media", "Graphisme", "Photoshop",
  "Comptabilité", "Fiscalité", "Audit", "SAP", "Sage", "Vente", "CRM",
  "Gestion d'équipe", "Recrutement", "Formation", "Leadership", "Communication"
]

const STORAGE_KEY = 'yemma_advanced_filters'

export function AdvancedSearchFilters({ 
  filters, 
  facets = {}, 
  onFilterChange, 
  onClose,
  onSavePreset,
  savedPresets = []
}) {
  const [expandedSections, setExpandedSections] = useState({
    experience: true,
    availability: false,
    education: false,
    contract: false,
    skills: false,
    location: false,
    salary: false,
    score: false,
  })

  const [skillSearch, setSkillSearch] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])

  // Calculer les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.min_experience > 0) count++
    if (filters.max_experience) count++
    if (filters.experience_ranges?.length > 0) count += filters.experience_ranges.length
    if (filters.availability?.length > 0) count += filters.availability.length
    if (filters.education_levels?.length > 0) count += filters.education_levels.length
    if (filters.contract_types?.length > 0) count += filters.contract_types.length
    if (filters.skills?.length > 0) count += filters.skills.length
    if (filters.location) count++
    if (filters.min_salary || filters.max_salary) count++
    if (filters.min_admin_score) count++
    if (filters.job_title) count++
    return count
  }, [filters])

  // Autocomplétion des compétences
  useEffect(() => {
    if (skillSearch.trim().length > 1) {
      const filtered = POPULAR_SKILLS.filter(skill =>
        skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !filters.skills?.includes(skill)
      ).slice(0, 8)
      setSkillSuggestions(filtered)
    } else {
      setSkillSuggestions([])
    }
  }, [skillSearch, filters.skills])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleExperienceRangeToggle = (range) => {
    const current = filters.experience_ranges || []
    const exists = current.some(r => r.min === range.min && r.max === range.max)
    const newRanges = exists
      ? current.filter(r => r.min !== range.min || r.max !== range.max)
      : [...current, range]
    onFilterChange({ ...filters, experience_ranges: newRanges })
  }

  const handleAvailabilityToggle = (value) => {
    const current = filters.availability || []
    const newAvailability = current.includes(value)
      ? current.filter(a => a !== value)
      : [...current, value]
    onFilterChange({ ...filters, availability: newAvailability })
  }

  const handleEducationToggle = (value) => {
    const current = filters.education_levels || []
    const newLevels = current.includes(value)
      ? current.filter(l => l !== value)
      : [...current, value]
    onFilterChange({ ...filters, education_levels: newLevels })
  }

  const handleContractToggle = (value) => {
    const current = filters.contract_types || []
    const newTypes = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value]
    onFilterChange({ ...filters, contract_types: newTypes })
  }

  const handleAddSkill = (skill) => {
    const current = filters.skills || []
    if (!current.includes(skill)) {
      onFilterChange({ ...filters, skills: [...current, skill] })
    }
    setSkillSearch('')
    setSkillSuggestions([])
  }

  const handleRemoveSkill = (skillToRemove) => {
    const current = filters.skills || []
    onFilterChange({ ...filters, skills: current.filter(s => s !== skillToRemove) })
  }

  const handleExperienceSlider = ([min, max]) => {
    onFilterChange({ 
      ...filters, 
      min_experience: min,
      max_experience: max === 30 ? null : max
    })
  }

  const handleSalarySlider = ([min, max]) => {
    onFilterChange({ 
      ...filters, 
      min_salary: min,
      max_salary: max === 10000000 ? null : max
    })
  }

  const handleScoreSlider = ([value]) => {
    onFilterChange({ 
      ...filters, 
      min_admin_score: value === 0 ? undefined : value
    })
  }

  const clearAllFilters = () => {
    onFilterChange({
      min_experience: 0,
      max_experience: null,
      experience_ranges: [],
      availability: [],
      education_levels: [],
      contract_types: [],
      skills: [],
      location: '',
      min_salary: null,
      max_salary: null,
      min_admin_score: undefined,
      job_title: '',
    })
  }

  const FilterSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children, 
    badge,
    defaultExpanded = false 
  }) => {
    const isExpanded = expandedSections[id] ?? defaultExpanded
    return (
      <div className="space-y-2">
        <button
          onClick={() => toggleSection(id)}
          className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-gray-500 group-hover:text-[#226D68] transition-colors" />}
            <Label className="font-semibold text-sm cursor-pointer">{title}</Label>
            {badge && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {badge}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="pl-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-blue-deep/5 to-[#226D68]/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-[#226D68] flex-shrink-0" />
          <h2 className="font-bold text-sm sm:text-base md:text-lg text-gray-900 truncate">Filtres avancés</h2>
          {activeFiltersCount > 0 && (
            <Badge className="bg-[#226D68] text-white flex-shrink-0">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtres actifs - Tags */}
      {activeFiltersCount > 0 && (
        <div className="p-2 sm:p-3 border-b bg-gray-50">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {filters.skills?.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                {skill}
                <XCircle 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => handleRemoveSkill(skill)}
                />
              </Badge>
            ))}
            {filters.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {filters.location}
                <XCircle 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => onFilterChange({ ...filters, location: '' })}
                />
              </Badge>
            )}
            {filters.job_title && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.job_title}
                <XCircle 
                  className="h-3 w-3 cursor-pointer hover:text-red-500" 
                  onClick={() => onFilterChange({ ...filters, job_title: '' })}
                />
              </Badge>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Recherche de poste */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              Poste recherché
            </Label>
            <Input
              type="text"
              placeholder="Ex: Développeur Full Stack..."
              value={filters.job_title || ''}
              onChange={(e) => onFilterChange({ ...filters, job_title: e.target.value })}
              className="h-9"
            />
          </div>

          <Separator />

          {/* Expérience */}
          <FilterSection
            id="experience"
            title="Expérience"
            icon={Briefcase}
            badge={filters.experience_ranges?.length || (filters.min_experience > 0 ? 1 : 0)}
            defaultExpanded={true}
          >
            {/* Slider pour plage d'expérience */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Min: {filters.min_experience || 0} an{filters.min_experience > 1 ? 's' : ''}</span>
                  <span>Max: {filters.max_experience || '∞'} an{filters.max_experience > 1 ? 's' : ''}</span>
                </div>
                <Slider
                  value={[filters.min_experience || 0, filters.max_experience || 30]}
                  onValueChange={handleExperienceSlider}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="text-xs text-gray-500 mb-2">Ou sélectionnez des tranches :</div>
              <div className="space-y-2">
                {EXPERIENCE_RANGES.map((range) => {
                  const isSelected = filters.experience_ranges?.some(
                    r => r.min === range.min && r.max === range.max
                  )
                  return (
                    <label
                      key={`${range.min}-${range.max}`}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleExperienceRangeToggle(range)}
                      />
                      <span className="text-sm">{range.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </FilterSection>

          <Separator />

          {/* Disponibilité */}
          <FilterSection
            id="availability"
            title="Disponibilité"
            icon={Clock}
            badge={filters.availability?.length}
          >
            <div className="space-y-2">
              {AVAILABILITY_OPTIONS.map((option) => {
                const isSelected = filters.availability?.includes(option.value)
                const Icon = option.icon
                return (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer p-2 rounded-lg border border-gray-200 hover:border-[#226D68] hover:bg-[#226D68]/5 transition-all"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleAvailabilityToggle(option.value)}
                    />
                    {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                    <span className="text-sm flex-1">{option.label}</span>
                  </label>
                )
              })}
            </div>
          </FilterSection>

          <Separator />

          {/* Niveau d'éducation */}
          <FilterSection
            id="education"
            title="Niveau d'éducation"
            icon={GraduationCap}
            badge={filters.education_levels?.length}
          >
            <div className="space-y-2">
              {EDUCATION_LEVELS.map((level) => {
                const isSelected = filters.education_levels?.includes(level.value)
                const Icon = level.icon
                return (
                  <label
                    key={level.value}
                    className="flex items-center gap-3 cursor-pointer p-2 rounded-lg border border-gray-200 hover:border-[#226D68] hover:bg-[#226D68]/5 transition-all"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleEducationToggle(level.value)}
                    />
                    {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                    <span className="text-sm flex-1">{level.label}</span>
                  </label>
                )
              })}
            </div>
          </FilterSection>

          <Separator />

          {/* Type de contrat */}
          <FilterSection
            id="contract"
            title="Type de contrat"
            icon={Briefcase}
            badge={filters.contract_types?.length}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONTRACT_TYPES.map((type) => {
                const isSelected = filters.contract_types?.includes(type.value)
                const Icon = type.icon
                return (
                  <label
                    key={type.value}
                    className={`flex flex-col items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-[#226D68] bg-[#226D68]/10' 
                        : 'border-gray-200 hover:border-[#226D68]/50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleContractToggle(type.value)}
                      className="mb-1"
                    />
                    {Icon && <Icon className="h-4 w-4 text-gray-500" />}
                    <span className="text-xs text-center font-medium">{type.label}</span>
                  </label>
                )
              })}
            </div>
          </FilterSection>

          <Separator />

          {/* Compétences */}
          <FilterSection
            id="skills"
            title="Compétences"
            icon={Sparkles}
            badge={filters.skills?.length}
          >
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Rechercher une compétence..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="h-9"
                />
                {skillSuggestions.length > 0 && (
                  <Card className="absolute z-50 w-full mt-1 shadow-lg border">
                    <CardContent className="p-2">
                      <div className="space-y-1">
                        {skillSuggestions.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => handleAddSkill(skill)}
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {filters.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.skills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:border-red-300"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      {skill}
                      <XCircle className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500">
                Suggestions populaires :
              </div>
              <div className="flex flex-wrap gap-1">
                {POPULAR_SKILLS.slice(0, 6)
                  .filter(skill => !filters.skills?.includes(skill))
                  .map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="cursor-pointer hover:bg-[#226D68]/10 hover:border-[#226D68]"
                      onClick={() => handleAddSkill(skill)}
                    >
                      + {skill}
                    </Badge>
                  ))}
              </div>
            </div>
          </FilterSection>

          <Separator />

          {/* Localisation */}
          <FilterSection
            id="location"
            title="Localisation"
            icon={MapPin}
            badge={filters.location ? 1 : 0}
          >
            <Input
              type="text"
              placeholder="Ex: Abidjan, Paris, Côte d'Ivoire..."
              value={filters.location || ''}
              onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
              className="h-9"
            />
          </FilterSection>

          <Separator />

          {/* Prétentions salariales */}
          <FilterSection
            id="salary"
            title="Prétentions salariales"
            icon={DollarSign}
            badge={(filters.min_salary || filters.max_salary) ? 1 : 0}
          >
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Min: {filters.min_salary ? `${(filters.min_salary / 1000).toFixed(0)}k` : '0'} FCFA</span>
                  <span>Max: {filters.max_salary ? `${(filters.max_salary / 1000).toFixed(0)}k` : '∞'} FCFA</span>
                </div>
                <Slider
                  value={[filters.min_salary || 0, filters.max_salary || 10000000]}
                  onValueChange={handleSalarySlider}
                  max={10000000}
                  step={100000}
                  className="w-full"
                />
              </div>
            </div>
          </FilterSection>

          <Separator />

          {/* Score expert */}
          <FilterSection
            id="score"
            title="Score expert minimum"
            icon={Star}
            badge={filters.min_admin_score ? 1 : 0}
          >
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Score: {filters.min_admin_score?.toFixed(1) || '0.0'}/5.0</span>
                </div>
                <Slider
                  value={[filters.min_admin_score || 0]}
                  onValueChange={handleScoreSlider}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                {[0, 3, 4, 4.5, 5].map((score) => (
                  <Button
                    key={score}
                    variant={filters.min_admin_score === score ? "default" : "outline"}
                    size="sm"
                    onClick={() => onFilterChange({ ...filters, min_admin_score: score === 0 ? undefined : score })}
                    className="flex-1"
                  >
                    {score === 0 ? 'Tous' : `${score}+`}
                  </Button>
                ))}
              </div>
            </div>
          </FilterSection>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 sm:p-4 border-t bg-gray-50 space-y-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-xs sm:text-sm"
            onClick={clearAllFilters}
            disabled={activeFiltersCount === 0}
          >
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Réinitialiser
          </Button>
          {onSavePreset && (
            <SimpleTooltip content="Sauvegarder cette configuration">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onSavePreset(filters)}
              >
                <Save className="h-4 w-4" />
              </Button>
            </SimpleTooltip>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <div className="text-xs text-center text-gray-500">
            {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}
