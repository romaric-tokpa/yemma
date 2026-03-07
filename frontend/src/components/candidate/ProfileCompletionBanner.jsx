/**
 * Todo list de complétion du profil — Affichée en bas de la barre de complétion
 * Liste type todo : tâches réalisées barrées, suivantes à compléter.
 */
import { useNavigate } from 'react-router-dom'
import { Image as ImageIcon, User, FileText, Briefcase, GraduationCap, Code, Search, ChevronRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEM_ORDER = ['photo', 'identity', 'summary', 'experiences', 'educations', 'skills', 'preferences', 'cv']

const ITEM_CONFIG = {
  photo: { key: 'photo', label: 'Photo de profil', icon: ImageIcon },
  identity: { key: 'identity', label: 'Identité', icon: User },
  summary: { key: 'summary', label: 'Description (300 car.)', icon: FileText },
  experiences: { key: 'experiences', label: 'Expérience', icon: Briefcase },
  educations: { key: 'educations', label: 'Formation', icon: GraduationCap },
  skills: { key: 'skills', label: 'Compétences', icon: Code },
  preferences: { key: 'preferences', label: 'Préférences', icon: Search },
  cv: { key: 'cv', label: 'CV', icon: FileText },
}

function computeTodoItems(profile, documents = [], hasProfilePhoto = false) {
  const items = []
  const hasCv = documents?.some(d => d.document_type === 'CV')
  const prefs = profile?.job_preferences
  const techSkills = profile?.skills?.filter(s => s.skill_type === 'TECHNICAL') || []

  for (const key of ITEM_ORDER) {
    let done = false
    switch (key) {
      case 'photo': done = hasProfilePhoto; break
      case 'identity': done = !!(profile?.first_name && profile?.last_name && profile?.email); break
      case 'summary': done = !!(profile?.professional_summary && profile.professional_summary.length >= 300); break
      case 'experiences': done = !!(profile?.experiences?.length); break
      case 'educations': done = !!(profile?.educations?.length); break
      case 'skills': done = techSkills.length > 0; break
      case 'preferences': done = !!(prefs?.desired_positions?.length && prefs?.contract_types?.length && prefs?.availability); break
      case 'cv': done = !!hasCv; break
      default: break
    }
    items.push({ key, done })
  }
  return items
}

export default function ProfileCompletionBanner({
  profile,
  documents = [],
  hasProfilePhoto = false,
  completionPercentage = 0,
  profileStatus = 'DRAFT',
  onOpenPreferences,
  onOpenDocumentDialog,
  onOpenPhotoUpload,
}) {
  const navigate = useNavigate()
  const todoItems = computeTodoItems(profile, documents, hasProfilePhoto)
  const doneCount = todoItems.filter((i) => i.done).length
  const pendingItems = todoItems.filter((i) => !i.done)
  const show = completionPercentage < 100 && profileStatus === 'DRAFT'

  const handleAction = (key) => {
    switch (key) {
      case 'photo':
        onOpenPhotoUpload?.() || navigate('/candidate/dashboard/profile?edit=1')
        break
      case 'identity':
      case 'summary':
        navigate('/candidate/dashboard/profile?edit=1')
        break
      case 'experiences':
        navigate('/candidate/dashboard/experiences')
        break
      case 'educations':
        navigate('/candidate/dashboard/educations')
        break
      case 'skills':
        navigate('/candidate/dashboard/skills')
        break
      case 'preferences':
        onOpenPreferences?.()
        break
      case 'cv':
        onOpenDocumentDialog?.()
        break
      default:
        navigate('/candidate/dashboard/profile?edit=1')
    }
  }

  if (!show || pendingItems.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs font-medium text-[#6b7280] mb-2">
        {doneCount}/{todoItems.length} complété{pendingItems.length > 0 ? ` · ${pendingItems.length} à faire` : ''}
      </p>
      <ul className="space-y-1">
        {pendingItems.map(({ key }) => {
          const config = ITEM_CONFIG[key]
          if (!config) return null
          const Icon = config.icon
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => handleAction(key)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm',
                  'text-[#2C2C2C] hover:bg-[#E8F4F3]/60 transition-colors'
                )}
              >
                <Circle className="h-4 w-4 text-[#226D68]/70 shrink-0" strokeWidth={2} />
                <Icon className="h-3.5 w-3.5 text-[#226D68] shrink-0" />
                <span className="flex-1 truncate">{config.label}</span>
                <ChevronRight className="h-3 w-3 text-[#6b7280] shrink-0" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
