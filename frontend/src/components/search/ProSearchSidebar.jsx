import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Checkbox } from '../ui/checkbox'
import { Separator } from '../ui/separator'
import { MultiSelect } from '../ui/multi-select'
import { Badge } from '../ui/badge'

const experienceRanges = [
  { label: "Moins de 1 an", min: 0, max: 1 },
  { label: "1-2 ans", min: 1, max: 2 },
  { label: "3-4 ans", min: 3, max: 4 },
  { label: "5-10 ans", min: 5, max: 10 },
  { label: "11-15 ans", min: 11, max: 15 },
  { label: "Plus de 15 ans", min: 15, max: null },
]

const availabilityOptions = [
  { value: "immediate", label: "Immédiate" },
  { value: "within_1_month", label: "Dans moins de 1 mois" },
  { value: "within_2_months", label: "Dans moins de 2 mois" },
  { value: "within_3_months", label: "Dans moins de 3 mois" },
  { value: "after_3_months", label: "Après 3 mois" },
]

const educationLevels = [
  { value: "BAC", label: "BAC ou équivalent" },
  { value: "BTS", label: "BTS ou équivalent" },
  { value: "LICENCE", label: "Licence ou équivalent" },
  { value: "MAITRISE", label: "Maîtrise ou équivalent" },
  { value: "MASTER", label: "Master ou équivalent" },
  { value: "DOCTORAT", label: "Doctorat ou équivalent" },
]

const salaryRanges = [
  { value: "0-500k", label: "0 - 500 000 FCFA" },
  { value: "500k-1m", label: "500 000 - 1 000 000 FCFA" },
  { value: "1m-2m", label: "1 000 000 - 2 000 000 FCFA" },
  { value: "2m-3m", label: "2 000 000 - 3 000 000 FCFA" },
  { value: "3m-5m", label: "3 000 000 - 5 000 000 FCFA" },
  { value: "5m+", label: "Plus de 5 000 000 FCFA" },
]

const languageLevels = [
  { value: "notions", label: "≥ Notions" },
  { value: "courant", label: "≥ Courant" },
  { value: "professionnel", label: "≥ Professionnel" },
  { value: "natif", label: "Natif ou bilingue" },
]

const languages = [
  "Français", "Anglais", "Espagnol", "Allemand", "Italien", 
  "Portugais", "Chinois", "Arabe", "Russe"
]

export function ProSearchSidebar({ filters, onFilterChange, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    experience: false,
    availability: false,
    education: false,
    salary: false,
    languages: false,
    skills: false,
    location: false,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleExperienceRangeChange = (range, checked) => {
    const currentRanges = filters.experience_ranges || []
    let newRanges
    if (checked) {
      newRanges = [...currentRanges, range]
    } else {
      newRanges = currentRanges.filter(r => r.min !== range.min || r.max !== range.max)
    }
    onFilterChange({ ...filters, experience_ranges: newRanges })
  }

  const handleAvailabilityChange = (value, checked) => {
    const current = filters.availability || []
    let newAvailability
    if (checked) {
      newAvailability = [...current, value]
    } else {
      newAvailability = current.filter(a => a !== value)
    }
    onFilterChange({ ...filters, availability: newAvailability })
  }

  const handleEducationChange = (value, checked) => {
    const current = filters.education_levels || []
    let newLevels
    if (checked) {
      newLevels = [...current, value]
    } else {
      newLevels = current.filter(l => l !== value)
    }
    onFilterChange({ ...filters, education_levels: newLevels })
  }

  const handleSalaryChange = (value, checked) => {
    const current = filters.salary_ranges || []
    let newRanges
    if (checked) {
      newRanges = [...current, value]
    } else {
      newRanges = current.filter(r => r !== value)
    }
    onFilterChange({ ...filters, salary_ranges: newRanges })
  }

  const handleLanguageChange = (language, level, checked) => {
    const current = filters.languages || {}
    const newLanguages = { ...current }
    
    if (checked) {
      newLanguages[language] = level
    } else {
      delete newLanguages[language]
    }
    
    onFilterChange({ ...filters, languages: newLanguages })
  }

  const handleSkillsChange = (selectedSkills) => {
    onFilterChange({ ...filters, skills: selectedSkills })
  }

  const handleLocationChange = (e) => {
    onFilterChange({ ...filters, location: e.target.value })
  }

  const handleJobTitleChange = (e) => {
    onFilterChange({ ...filters, job_title: e.target.value })
  }

  const clearFilters = () => {
    onFilterChange({
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
  }

  // Options de compétences généralistes (tous secteurs)
  const skillOptions = [
    // IT & Digital
    "Python", "JavaScript", "React", "Node.js", "Java", "C++", "TypeScript",
    "Vue.js", "Angular", "Docker", "Kubernetes", "AWS", "Azure", "MongoDB",
    "PostgreSQL", "MySQL", "Redis", "ElasticSearch", "Git", "CI/CD",
    "Excel", "PowerPoint", "Word", "Google Workspace",
    // RH & Management
    "Gestion d'équipe", "Recrutement", "Formation", "Paie", "Droit du travail",
    "GPEC", "Évaluation", "Communication", "Négociation", "Leadership",
    // Marketing & Communication
    "Marketing digital", "SEO", "SEM", "Social Media", "Community Management",
    "Graphisme", "Photoshop", "Illustrator", "Publicité", "Événementiel",
    "Relations presse", "Content Marketing", "Email Marketing",
    // Finance & Comptabilité
    "Comptabilité", "Fiscalité", "Audit", "Contrôle de gestion", "Finance",
    "SAP", "Sage", "Ciel", "Analyse financière", "Gestion de trésorerie",
    // Commerce & Vente
    "Vente", "Négociation commerciale", "CRM", "Force de vente",
    "E-commerce", "Prospection", "Relation client", "Technique de vente",
    // Logistique & Supply Chain
    "Logistique", "Supply Chain", "Transport", "Stock management", "Warehouse",
    "Procurement", "Achats", "Planification", "Optimisation",
    // Ingénierie & Technique
    "AutoCAD", "SolidWorks", "CAO", "BIM", "Génie civil", "Génie mécanique",
    "Électricité", "Plomberie", "Chauffage", "Climatisation", "Maintenance",
    // Santé & Social
    "Soins infirmiers", "Médecine", "Pharmacie", "Kinésithérapie", "Psychologie",
    "Travail social", "Éducation", "Formation professionnelle",
    // Langues
    "Français", "Anglais", "Espagnol", "Allemand", "Italien", "Chinois",
    "Arabe", "Portugais", "Russe",
    // Autres
    "Analyse de données", "Reporting", "Project Management", "Agile", "Scrum",
    "Qualité", "HACCP", "ISO", "Sécurité", "Ressources humaines", "Administration"
  ]

  const hasActiveFilters = 
    (filters.min_experience || 0) > 0 ||
    (filters.experience_ranges || []).length > 0 ||
    (filters.skills || []).length > 0 ||
    (filters.location || '') ||
    (filters.job_title || '') ||
    (filters.availability || []).length > 0 ||
    (filters.education_levels || []).length > 0 ||
    (filters.salary_ranges || []).length > 0 ||
    Object.keys(filters.languages || {}).length > 0

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-card z-10">
        <h2 className="text-lg font-semibold">Filtres</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Poste recherché */}
          <div>
            <Label className="mb-2 block">Poste recherché</Label>
            <Input
              type="text"
              value={filters.job_title || ''}
              onChange={handleJobTitleChange}
              placeholder="Ex: Ingénieur, Développeur..."
              className="mt-1"
            />
          </div>

          <Separator />

          {/* Expérience - Tranches */}
          <div>
            <button
              onClick={() => toggleSection('experience')}
              className="flex items-center justify-between w-full mb-2"
            >
              <Label className="cursor-pointer font-semibold">Expérience</Label>
              {expandedSections.experience ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedSections.experience && (
              <div className="space-y-2 mt-2">
                {experienceRanges.map((range) => {
                  const checked = (filters.experience_ranges || []).some(
                    r => r.min === range.min && r.max === range.max
                  )
                  return (
                    <div key={`${range.min}-${range.max}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exp-${range.min}-${range.max}`}
                        checked={checked}
                        onCheckedChange={(checked) => handleExperienceRangeChange(range, checked)}
                      />
                      <label
                        htmlFor={`exp-${range.min}-${range.max}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {range.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Disponibilité */}
          <div>
            <button
              onClick={() => toggleSection('availability')}
              className="flex items-center justify-between w-full mb-2"
            >
              <Label className="cursor-pointer font-semibold">Disponibilité</Label>
              {expandedSections.availability ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedSections.availability && (
              <div className="space-y-2 mt-2">
                {availabilityOptions.map((option) => {
                  const checked = (filters.availability || []).includes(option.value)
                  return (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`avail-${option.value}`}
                        checked={checked}
                        onCheckedChange={(checked) => handleAvailabilityChange(option.value, checked)}
                      />
                      <label
                        htmlFor={`avail-${option.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Niveau d'étude */}
          <div>
            <button
              onClick={() => toggleSection('education')}
              className="flex items-center justify-between w-full mb-2"
            >
              <Label className="cursor-pointer font-semibold">Niveau d'étude</Label>
              {expandedSections.education ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedSections.education && (
              <div className="space-y-2 mt-2">
                {educationLevels.map((level) => {
                  const checked = (filters.education_levels || []).includes(level.value)
                  return (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edu-${level.value}`}
                        checked={checked}
                        onCheckedChange={(checked) => handleEducationChange(level.value, checked)}
                      />
                      <label
                        htmlFor={`edu-${level.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {level.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Tarification / Prétentions salariales */}
          <div>
            <button
              onClick={() => toggleSection('salary')}
              className="flex items-center justify-between w-full mb-2"
            >
              <Label className="cursor-pointer font-semibold">Prétentions salariales</Label>
              {expandedSections.salary ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedSections.salary && (
              <div className="space-y-2 mt-2">
                {salaryRanges.map((range) => {
                  const checked = (filters.salary_ranges || []).includes(range.value)
                  return (
                    <div key={range.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`salary-${range.value}`}
                        checked={checked}
                        onCheckedChange={(checked) => handleSalaryChange(range.value, checked)}
                      />
                      <label
                        htmlFor={`salary-${range.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {range.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Langues */}
          <div>
            <button
              onClick={() => toggleSection('languages')}
              className="flex items-center justify-between w-full mb-2"
            >
              <Label className="cursor-pointer font-semibold">Langues</Label>
              {expandedSections.languages ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedSections.languages && (
              <div className="space-y-3 mt-2">
                {languages.map((language) => (
                  <div key={language} className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">{language}</Label>
                    <div className="space-y-1 pl-2">
                      {languageLevels.map((level) => {
                        const currentLanguageLevel = (filters.languages || {})[language]
                        const checked = currentLanguageLevel === level.value
                        return (
                          <div key={level.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`lang-${language}-${level.value}`}
                              checked={checked}
                              onCheckedChange={(checked) => handleLanguageChange(language, level.value, checked)}
                            />
                            <label
                              htmlFor={`lang-${language}-${level.value}`}
                              className="text-xs font-normal cursor-pointer"
                            >
                              {level.label}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Compétences */}
          <div>
            <button
              onClick={() => toggleSection('skills')}
              className="flex items-center justify-between w-full mb-2"
            >
              <Label className="cursor-pointer font-semibold">Compétences</Label>
              {expandedSections.skills ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedSections.skills && (
              <div className="mt-2 space-y-2">
                <Input
                  type="text"
                  placeholder="Tapez une compétence et appuyez sur Entrée..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newSkill = e.target.value.trim()
                      const currentSkills = filters.skills || []
                      if (!currentSkills.includes(newSkill)) {
                        handleSkillsChange([...currentSkills, newSkill])
                      }
                      e.target.value = ''
                    }
                  }}
                />
                {/* Suggestions de compétences courantes */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Suggestions :</Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {skillOptions
                      .filter(opt => !(filters.skills || []).includes(opt))
                      .slice(0, 12)
                      .map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 text-xs"
                          onClick={() => {
                            const currentSkills = filters.skills || []
                            if (!currentSkills.includes(skill)) {
                              handleSkillsChange([...currentSkills, skill])
                            }
                          }}
                        >
                          + {skill}
                        </Badge>
                      ))}
                  </div>
                </div>
                {/* Compétences sélectionnées */}
                {(filters.skills || []).length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Compétences ajoutées :</Label>
                    <div className="flex flex-wrap gap-2">
                      {(filters.skills || []).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/10 hover:border-destructive text-xs"
                          onClick={() => {
                            const currentSkills = filters.skills || []
                            handleSkillsChange(currentSkills.filter((_, i) => i !== index))
                          }}
                        >
                          {skill}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Localisation */}
          <div>
            <button
              onClick={() => toggleSection('location')}
              className="flex items-center justify-between w-full mb-2"
            >
              <Label className="cursor-pointer font-semibold">Lieu</Label>
              {expandedSections.location ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedSections.location && (
              <div className="mt-2">
                <Input
                  type="text"
                  value={filters.location || ''}
                  onChange={handleLocationChange}
                  placeholder="Ex: Abidjan, Paris, Côte d'Ivoire..."
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2 bg-card">
        {hasActiveFilters && (
          <Badge variant="secondary" className="w-full justify-center py-1.5">
            Filtres actifs
          </Badge>
        )}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  )
}
