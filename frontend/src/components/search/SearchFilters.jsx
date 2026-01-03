import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { ScrollArea } from '../ui/scroll-area'

export function SearchFilters({ filters, facets, onFilterChange, onClose }) {
  const handleSectorToggle = (sector) => {
    const newSectors = filters.sectors.includes(sector)
      ? filters.sectors.filter(s => s !== sector)
      : [...filters.sectors, sector]
    onFilterChange({ ...filters, sectors: newSectors })
  }

  const handleJobToggle = (job) => {
    const newJobs = filters.main_jobs.includes(job)
      ? filters.main_jobs.filter(j => j !== job)
      : [...filters.main_jobs, job]
    onFilterChange({ ...filters, main_jobs: newJobs })
  }

  const handleSkillToggle = (skill) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill]
    onFilterChange({ ...filters, skills: newSkills })
  }

  const handleContractTypeToggle = (type) => {
    const newTypes = filters.contract_types.includes(type)
      ? filters.contract_types.filter(t => t !== type)
      : [...filters.contract_types, type]
    onFilterChange({ ...filters, contract_types: newTypes })
  }

  const handleLocationToggle = (location) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter(l => l !== location)
      : [...filters.locations, location]
    onFilterChange({ ...filters, locations: newLocations })
  }

  const clearFilters = () => {
    onFilterChange({
      sectors: [],
      main_jobs: [],
      min_experience: undefined,
      max_experience: undefined,
      min_admin_score: undefined,
      skills: [],
      contract_types: [],
      locations: [],
    })
  }

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
          {/* Score Admin */}
          <div>
            <Label>Score Admin Minimum</Label>
            <Input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={filters.min_admin_score || ''}
              onChange={(e) => onFilterChange({
                ...filters,
                min_admin_score: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              placeholder="0.0"
              className="mt-1"
            />
          </div>

          {/* Expérience */}
          <div>
            <Label>Années d'expérience</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                min="0"
                value={filters.min_experience || ''}
                onChange={(e) => onFilterChange({
                  ...filters,
                  min_experience: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="Min"
              />
              <Input
                type="number"
                min="0"
                value={filters.max_experience || ''}
                onChange={(e) => onFilterChange({
                  ...filters,
                  max_experience: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="Max"
              />
            </div>
          </div>

          {/* Secteurs */}
          {facets.sectors && facets.sectors.length > 0 && (
            <div>
              <Label>Secteurs</Label>
              <div className="mt-2 space-y-2">
                {facets.sectors.slice(0, 10).map((facet) => (
                  <div key={facet.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.sectors.includes(facet.value)}
                      onCheckedChange={() => handleSectorToggle(facet.value)}
                    />
                    <label className="text-sm cursor-pointer flex-1">
                      {facet.value} ({facet.count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Métiers */}
          {facets.main_jobs && facets.main_jobs.length > 0 && (
            <div>
              <Label>Métiers</Label>
              <div className="mt-2 space-y-2">
                {facets.main_jobs.slice(0, 10).map((facet) => (
                  <div key={facet.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.main_jobs.includes(facet.value)}
                      onCheckedChange={() => handleJobToggle(facet.value)}
                    />
                    <label className="text-sm cursor-pointer flex-1">
                      {facet.value} ({facet.count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Types de contrat */}
          {facets.contract_types && facets.contract_types.length > 0 && (
            <div>
              <Label>Types de contrat</Label>
              <div className="mt-2 space-y-2">
                {facets.contract_types.slice(0, 10).map((facet) => (
                  <div key={facet.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.contract_types.includes(facet.value)}
                      onCheckedChange={() => handleContractTypeToggle(facet.value)}
                    />
                    <label className="text-sm cursor-pointer flex-1">
                      {facet.value} ({facet.count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Localisations */}
          {facets.locations && facets.locations.length > 0 && (
            <div>
              <Label>Localisations</Label>
              <div className="mt-2 space-y-2">
                {facets.locations.slice(0, 10).map((facet) => (
                  <div key={facet.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={filters.locations.includes(facet.value)}
                      onCheckedChange={() => handleLocationToggle(facet.value)}
                    />
                    <label className="text-sm cursor-pointer flex-1">
                      {facet.value} ({facet.count})
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
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

