/**
 * AdvancedSearchFilters — Redesign Yemma Solutions
 * Aesthetic: Refined sidebar with subtle sections, elegant toggles
 */
import { useState, useEffect, useMemo } from 'react'
import {
  X, ChevronDown, ChevronUp, SlidersHorizontal,
  MapPin, Briefcase, GraduationCap, DollarSign, Star,
  Clock, Sparkles, XCircle, Save, TrendingUp,
  Building2, Calendar
} from 'lucide-react'
import { Checkbox } from '../ui/checkbox'
import { ScrollArea } from '../ui/scroll-area'
import { Slider } from '../ui/slider'

/* ─── Styles ───────────────────────────────────────────────────── */

const FILTER_STYLES = `.yf-root { font-family: 'DM Sans', system-ui, sans-serif; } .yf-scroll::-webkit-scrollbar { width: 3px; } .yf-scroll::-webkit-scrollbar-track { background: transparent; } .yf-scroll::-webkit-scrollbar-thumb { background: rgba(14,124,123,0.1); border-radius: 10px; } .yf-section-btn { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 8px 10px; border-radius: 10px; border: none; background: transparent; cursor: pointer; transition: background 0.15s ease; font-family: 'DM Sans', system-ui, sans-serif; } .yf-section-btn:hover { background: #F8F9FB; } .yf-check-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 9px; cursor: pointer; transition: all 0.15s ease; border: 1px solid transparent; } .yf-check-item:hover { background: #F8F9FB; border-color: #E2E8F0; } .yf-check-item[data-active="true"] { background: #E8F4F3; border-color: rgba(14,124,123,0.12); } .yf-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 8px; font-size: 10px; font-weight: 600; background: linear-gradient(135deg, #E8F4F3, #d5edeb); color: #0A5E5D; cursor: pointer; transition: all 0.15s ease; } .yf-tag:hover { background: linear-gradient(135deg, #FEF3F0, #fde8e2); color: #c4563a; } .yf-input { height: 34px; padding: 0 12px; border-radius: 9px; border: 1.5px solid #E2E8F0; background: #F8F9FB; font-size: 12px; color: #1A2B3C; outline: none; width: 100%; transition: all 0.2s ease; font-family: 'DM Sans', system-ui, sans-serif; } .yf-input:focus { background: white; border-color: #0E7C7B; box-shadow: 0 0 0 3px rgba(14,124,123,0.06); } .yf-input::placeholder { color: #9CA3AF; }`

/* ─── Constants ────────────────────────────────────────────────── */

const EXPERIENCE_RANGES = [
  { label: 'Débutant', sub: '< 1 an', min: 0, max: 1 },
  { label: 'Junior', sub: '1-3 ans', min: 1, max: 3 },
  { label: 'Confirmé', sub: '3-5 ans', min: 3, max: 5 },
  { label: 'Senior', sub: '5-10 ans', min: 5, max: 10 },
  { label: 'Expert', sub: '10+ ans', min: 10, max: null },
]

const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immédiate', icon: Clock },
  { value: 'within_1_month', label: 'Sous 1 mois', icon: TrendingUp },
  { value: 'within_2_months', label: 'Sous 2 mois', icon: Calendar },
  { value: 'within_3_months', label: 'Sous 3 mois', icon: Calendar },
  { value: 'after_3_months', label: 'Après 3 mois', icon: Clock },
]

const EDUCATION_LEVELS = [
  { value: 'BAC', label: 'Baccalauréat' },
  { value: 'BAC_PLUS_2', label: 'Bac+2 (BTS/DUT)' },
  { value: 'BAC_PLUS_3', label: 'Bac+3 (Licence)' },
  { value: 'BAC_PLUS_4', label: 'Bac+4 (Maîtrise)' },
  { value: 'BAC_PLUS_5', label: 'Bac+5 (Master)' },
  { value: 'DOCTORAT', label: 'Doctorat' },
]

const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
  { value: 'TEMPORAIRE', label: 'Temporaire' },
]

const POPULAR_SKILLS = [
  'Python', 'JavaScript', 'React', 'Node.js', 'Java', 'TypeScript', 'Vue.js',
  'Angular', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'MongoDB', 'PostgreSQL',
  'MySQL', 'Redis', 'Git', 'CI/CD', 'Agile', 'Scrum', 'Project Management',
  'Marketing digital', 'SEO', 'SEM', 'Social Media', 'Graphisme', 'Photoshop',
  'Comptabilité', 'Fiscalité', 'Audit', 'SAP', 'Sage', 'Vente', 'CRM',
  'Gestion d\'équipe', 'Recrutement', 'Formation', 'Leadership', 'Communication'
]

/* ─── FilterSection ────────────────────────────────────────────── */

function FilterSection({ id, title, icon: Icon, badge, expanded, onToggle, children }) {
  return (
    <div>
      <button className="yf-section-btn" onClick={() => onToggle(id)}>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-6 h-6 rounded-md bg-[#F8F9FB] flex items-center justify-center shrink-0">
              <Icon className="h-3 w-3 text-gray-400" />
            </div>
          )}
          <span className="text-[12px] font-semibold text-gray-700">{title}</span>
          {badge > 0 && (
            <span className="h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded-md text-[9px] font-bold bg-[#0E7C7B] text-white">
              {badge}
            </span>
          )}
        </div>
        <div className="w-5 h-5 rounded-md flex items-center justify-center">
          {expanded ? <ChevronUp className="h-3 w-3 text-gray-400" /> : <ChevronDown className="h-3 w-3 text-gray-400" />}
        </div>
      </button>
      {expanded && <div className="mt-1 ml-2 pl-6 border-l border-gray-100 space-y-1.5 pb-1">{children}</div>}
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────────── */

export function AdvancedSearchFilters({ filters, facets = {}, onFilterChange, onClose, onSavePreset }) {
  const [sections, setSections] = useState({
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

  const activeCount = useMemo(() => {
    let c = 0
    if (filters.min_experience > 0) c++
    if (filters.max_experience) c++
    if (filters.experience_ranges?.length) c += filters.experience_ranges.length
    if (filters.availability?.length) c += filters.availability.length
    if (filters.education_levels?.length) c += filters.education_levels.length
    if (filters.contract_types?.length) c += filters.contract_types.length
    if (filters.skills?.length) c += filters.skills.length
    if (filters.location) c++
    if (filters.min_salary || filters.max_salary) c++
    if (filters.min_admin_score) c++
    if (filters.job_title) c++
    return c
  }, [filters])

  useEffect(() => {
    if (skillSearch.trim().length > 1) {
      setSkillSuggestions(
        POPULAR_SKILLS.filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()) && !filters.skills?.includes(s)).slice(0, 6)
      )
    } else setSkillSuggestions([])
  }, [skillSearch, filters.skills])

  const toggle = (id) => setSections(p => ({ ...p, [id]: !p[id] }))

  const toggleList = (field, value) => {
    const cur = filters[field] || []
    const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]
    onFilterChange({ ...filters, [field]: next })
  }

  const toggleExpRange = (range) => {
    const cur = filters.experience_ranges || []
    const exists = cur.some(r => r.min === range.min && r.max === range.max)
    onFilterChange({ ...filters, experience_ranges: exists ? cur.filter(r => r.min !== range.min || r.max !== range.max) : [...cur, range] })
  }

  const addSkill = (s) => {
    const cur = filters.skills || []
    if (!cur.includes(s)) onFilterChange({ ...filters, skills: [...cur, s] })
    setSkillSearch('')
    setSkillSuggestions([])
  }

  const removeSkill = (s) => onFilterChange({ ...filters, skills: (filters.skills || []).filter(x => x !== s) })

  const clearAll = () => onFilterChange({
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

  return (
    <div className="yf-root h-full flex flex-col bg-white border-r border-gray-100">
      <style>{FILTER_STYLES}</style>

      {/* ═══ Header ═══ */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0E7C7B] to-[#0A5E5D] flex items-center justify-center">
            <SlidersHorizontal className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-gray-800 leading-tight">Filtres</h2>
            {activeCount > 0 && (
              <p className="text-[10px] text-gray-400">{activeCount} actif{activeCount > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ═══ Active filter tags ═══ */}
      {activeCount > 0 && (
        <div className="px-4 py-2.5 border-b border-gray-50 bg-[#FAFBFC]">
          <div className="flex flex-wrap gap-1.5">
            {filters.skills?.map((s, i) => (
              <span key={i} className="yf-tag" onClick={() => removeSkill(s)}>
                {s} <XCircle className="h-2.5 w-2.5" />
              </span>
            ))}
            {filters.location && (
              <span className="yf-tag" onClick={() => onFilterChange({ ...filters, location: '' })}>
                <MapPin className="h-2.5 w-2.5" /> {filters.location} <XCircle className="h-2.5 w-2.5" />
              </span>
            )}
            {filters.job_title && (
              <span className="yf-tag" onClick={() => onFilterChange({ ...filters, job_title: '' })}>
                {filters.job_title} <XCircle className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        </div>
      )}

      {/* ═══ Filter sections ═══ */}
      <ScrollArea className="flex-1 yf-scroll">
        <div className="px-3 py-3 space-y-1">
          {/* Job title */}
          <div className="px-2.5 pb-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Poste recherché</label>
            <input
              type="text"
              placeholder="Ex: Développeur Full Stack…"
              value={filters.job_title || ''}
              onChange={(e) => onFilterChange({ ...filters, job_title: e.target.value })}
              className="yf-input"
            />
          </div>

          <div className="h-px bg-gray-100 mx-2" />

          {/* Experience */}
          <FilterSection
            id="experience"
            title="Expérience"
            icon={Briefcase}
            badge={filters.experience_ranges?.length || (filters.min_experience > 0 ? 1 : 0)}
            expanded={sections.experience}
            onToggle={toggle}
          >
            <div className="space-y-2.5 pr-1">
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 mb-2 font-medium">
                  <span>Min: {filters.min_experience || 0} an{(filters.min_experience || 0) > 1 ? 's' : ''}</span>
                  <span>Max: {filters.max_experience || '∞'}</span>
                </div>
                <Slider
                  value={[filters.min_experience || 0, filters.max_experience || 30]}
                  onValueChange={([min, max]) => onFilterChange({ ...filters, min_experience: min, max_experience: max === 30 ? null : max })}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Ou par tranche :</p>
              {EXPERIENCE_RANGES.map((r) => {
                const active = filters.experience_ranges?.some(x => x.min === r.min && x.max === r.max)
                return (
                  <label key={`${r.min}-${r.max}`} className="yf-check-item" data-active={active}>
                    <Checkbox checked={active} onCheckedChange={() => toggleExpRange(r)} />
                    <div className="flex-1">
                      <span className="text-[12px] font-medium text-gray-700">{r.label}</span>
                      <span className="text-[10px] text-gray-400 ml-1.5">{r.sub}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </FilterSection>

          <div className="h-px bg-gray-100 mx-2" />

          {/* Availability */}
          <FilterSection
            id="availability"
            title="Disponibilité"
            icon={Clock}
            badge={filters.availability?.length}
            expanded={sections.availability}
            onToggle={toggle}
          >
            <div className="space-y-1 pr-1">
              {AVAILABILITY_OPTIONS.map((o) => {
                const active = filters.availability?.includes(o.value)
                return (
                  <label key={o.value} className="yf-check-item" data-active={active}>
                    <Checkbox checked={active} onCheckedChange={() => toggleList('availability', o.value)} />
                    <span className="text-[12px] font-medium text-gray-700 flex-1">{o.label}</span>
                  </label>
                )
              })}
            </div>
          </FilterSection>

          <div className="h-px bg-gray-100 mx-2" />

          {/* Education */}
          <FilterSection
            id="education"
            title="Niveau d'éducation"
            icon={GraduationCap}
            badge={filters.education_levels?.length}
            expanded={sections.education}
            onToggle={toggle}
          >
            <div className="space-y-1 pr-1">
              {EDUCATION_LEVELS.map((l) => {
                const active = filters.education_levels?.includes(l.value)
                return (
                  <label key={l.value} className="yf-check-item" data-active={active}>
                    <Checkbox checked={active} onCheckedChange={() => toggleList('education_levels', l.value)} />
                    <span className="text-[12px] font-medium text-gray-700 flex-1">{l.label}</span>
                  </label>
                )
              })}
            </div>
          </FilterSection>

          <div className="h-px bg-gray-100 mx-2" />

          {/* Contract */}
          <FilterSection
            id="contract"
            title="Type de contrat"
            icon={Building2}
            badge={filters.contract_types?.length}
            expanded={sections.contract}
            onToggle={toggle}
          >
            <div className="grid grid-cols-2 gap-1.5 pr-1">
              {CONTRACT_TYPES.map((t) => {
                const active = filters.contract_types?.includes(t.value)
                return (
                  <button
                    key={t.value}
                    onClick={() => toggleList('contract_types', t.value)}
                    className={`text-[11px] font-semibold py-2 px-2.5 rounded-lg border transition-all text-center ${
                      active
                        ? 'bg-[#0E7C7B] text-white border-[#0E7C7B] shadow-sm shadow-[#0E7C7B]/15'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#0E7C7B]/30 hover:text-[#0E7C7B]'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>

          <div className="h-px bg-gray-100 mx-2" />

          {/* Skills */}
          <FilterSection
            id="skills"
            title="Compétences"
            icon={Sparkles}
            badge={filters.skills?.length}
            expanded={sections.skills}
            onToggle={toggle}
          >
            <div className="space-y-2.5 pr-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="yf-input"
                />
                {skillSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden">
                    {skillSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => addSkill(s)}
                        className="w-full text-left px-3 py-2 text-[12px] text-gray-600 hover:bg-[#E8F4F3] hover:text-[#0E7C7B] transition-colors flex items-center gap-2"
                      >
                        <span className="text-[#0E7C7B] font-bold">+</span> {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filters.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.skills.map((s, i) => (
                    <span key={i} className="yf-tag" onClick={() => removeSkill(s)}>
                      {s} <XCircle className="h-2.5 w-2.5" />
                    </span>
                  ))}
                </div>
              )}

              <div>
                <p className="text-[10px] text-gray-400 font-medium mb-1.5">Suggestions :</p>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_SKILLS.slice(0, 8)
                    .filter(s => !filters.skills?.includes(s))
                    .map((s) => (
                      <button
                        key={s}
                        onClick={() => addSkill(s)}
                        className="text-[10px] font-medium text-gray-400 px-2 py-1 rounded-md border border-gray-100 hover:border-[#0E7C7B]/20 hover:text-[#0E7C7B] hover:bg-[#E8F4F3] transition-all"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </FilterSection>

          <div className="h-px bg-gray-100 mx-2" />

          {/* Location */}
          <FilterSection
            id="location"
            title="Localisation"
            icon={MapPin}
            badge={filters.location ? 1 : 0}
            expanded={sections.location}
            onToggle={toggle}
          >
            <input
              type="text"
              placeholder="Ex: Abidjan, Paris…"
              value={filters.location || ''}
              onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
              className="yf-input mr-1"
            />
          </FilterSection>

          <div className="h-px bg-gray-100 mx-2" />

          {/* Salary */}
          <FilterSection
            id="salary"
            title="Prétentions salariales"
            icon={DollarSign}
            badge={(filters.min_salary || filters.max_salary) ? 1 : 0}
            expanded={sections.salary}
            onToggle={toggle}
          >
            <div className="space-y-2.5 pr-1">
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>{filters.min_salary ? `${(filters.min_salary / 1000).toFixed(0)}k` : '0'} FCFA</span>
                <span>{filters.max_salary ? `${(filters.max_salary / 1000).toFixed(0)}k` : '∞'} FCFA</span>
              </div>
              <Slider
                value={[filters.min_salary || 0, filters.max_salary || 10000000]}
                onValueChange={([min, max]) => onFilterChange({ ...filters, min_salary: min, max_salary: max === 10000000 ? null : max })}
                max={10000000}
                step={100000}
                className="w-full"
              />
            </div>
          </FilterSection>

          <div className="h-px bg-gray-100 mx-2" />

          {/* Score */}
          <FilterSection
            id="score"
            title="Score évaluation"
            icon={Star}
            badge={filters.min_admin_score ? 1 : 0}
            expanded={sections.score}
            onToggle={toggle}
          >
            <div className="space-y-2.5 pr-1">
              <p className="text-[10px] text-gray-400">Note minimum de l'expert</p>
              <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                <span>{filters.min_admin_score?.toFixed(1) || '0.0'} / 5.0</span>
              </div>
              <Slider
                value={[filters.min_admin_score || 0]}
                onValueChange={([v]) => onFilterChange({ ...filters, min_admin_score: v === 0 ? undefined : v })}
                max={5}
                step={0.1}
                className="w-full"
              />
              <div className="flex gap-1.5">
                {[0, 3, 4, 4.5, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => onFilterChange({ ...filters, min_admin_score: s === 0 ? undefined : s })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                      filters.min_admin_score === s || (s === 0 && !filters.min_admin_score)
                        ? 'bg-[#0E7C7B] text-white border-[#0E7C7B]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#0E7C7B]/30'
                    }`}
                  >
                    {s === 0 ? 'Tous' : `${s}+`}
                  </button>
                ))}
              </div>
            </div>
          </FilterSection>
        </div>
      </ScrollArea>

      {/* ═══ Footer ═══ */}
      <div className="px-4 py-3 border-t border-gray-100 bg-[#FAFBFC] space-y-2 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={clearAll}
            disabled={activeCount === 0}
            className="flex-1 h-9 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 disabled:opacity-30 disabled:hover:text-gray-500 disabled:hover:border-gray-200 disabled:hover:bg-transparent transition-all"
          >
            <XCircle className="h-3 w-3" /> Réinitialiser
          </button>
          {onSavePreset && (
            <button
              onClick={() => onSavePreset(filters)}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:text-[#0E7C7B] hover:border-[#0E7C7B]/20 hover:bg-[#E8F4F3] transition-all"
              title="Sauvegarder"
            >
              <Save className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {activeCount > 0 && (
          <p className="text-[10px] text-center text-gray-400">
            {activeCount} filtre{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
