import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Slider } from '../ui/slider'
import { MultiSelect } from '../ui/multi-select'

export function ProSearchSidebar({ filters, onFilterChange, onClose }) {
  const handleExperienceChange = (value) => {
    onFilterChange({
      ...filters,
      min_experience: value[0]
    })
  }

  const handleSkillsChange = (selectedSkills) => {
    onFilterChange({
      ...filters,
      skills: selectedSkills
    })
  }

  const handleLocationChange = (e) => {
    onFilterChange({
      ...filters,
      location: e.target.value
    })
  }

  const clearFilters = () => {
    onFilterChange({
      min_experience: 0,
      skills: [],
      location: '',
    })
  }

  // Options de compétences (peut être récupéré depuis l'API)
  const skillOptions = [
    "Python",
    "JavaScript",
    "React",
    "Node.js",
    "Java",
    "C++",
    "TypeScript",
    "Vue.js",
    "Angular",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "ElasticSearch",
    "Git",
    "CI/CD"
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filtres</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Slider pour années d'expérience */}
          <div>
            <Label className="mb-2 block">
              Années d'expérience minimum: {filters.min_experience} ans
            </Label>
            <Slider
              value={[filters.min_experience || 0]}
              onValueChange={handleExperienceChange}
              min={0}
              max={20}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>20+</span>
            </div>
          </div>

          {/* Multi-select pour compétences */}
          <div>
            <Label>Compétences</Label>
            <MultiSelect
              options={skillOptions}
              selected={filters.skills || []}
              onChange={handleSkillsChange}
              placeholder="Sélectionner des compétences..."
              className="mt-2"
            />
          </div>

          {/* Localisation */}
          <div>
            <Label>Localisation</Label>
            <Input
              type="text"
              value={filters.location || ''}
              onChange={handleLocationChange}
              placeholder="Paris, France"
              className="mt-1"
            />
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  )
}

