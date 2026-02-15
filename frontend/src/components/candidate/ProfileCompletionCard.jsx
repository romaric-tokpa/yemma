/**
 * Widget progression — Pourcentage de complétion du profil
 * Cercle SVG + liste des éléments manquants.
 */
import { cn } from '@/lib/utils'

const DEFAULT_MISSING_ITEMS = [
  { key: 'identity', label: 'Identité complète' },
  { key: 'summary', label: 'Description professionnelle (min 300 car.)' },
  { key: 'experiences', label: 'Au moins une expérience' },
  { key: 'educations', label: 'Au moins une formation' },
  { key: 'skills', label: 'Compétences techniques' },
  { key: 'preferences', label: 'Préférences emploi' },
  { key: 'cv', label: 'CV uploadé' },
]

function computeMissingItems(profile, documents = []) {
  const missing = []
  if (!profile?.first_name || !profile?.last_name || !profile?.email) missing.push({ key: 'identity', label: 'Identité complète' })
  if (!profile?.professional_summary || profile.professional_summary?.length < 300) missing.push({ key: 'summary', label: 'Description professionnelle (min 300 car.)' })
  if (!profile?.experiences?.length) missing.push({ key: 'experiences', label: 'Au moins une expérience' })
  if (!profile?.educations?.length) missing.push({ key: 'educations', label: 'Au moins une formation' })
  const techSkills = profile?.skills?.filter(s => s.skill_type === 'TECHNICAL') || []
  if (techSkills.length === 0) missing.push({ key: 'skills', label: 'Compétences techniques' })
  const prefs = profile?.job_preferences
  if (!prefs?.desired_positions?.length || !prefs?.contract_types?.length || !prefs?.availability) missing.push({ key: 'preferences', label: 'Préférences emploi' })
  const hasCv = documents?.some(d => d.document_type === 'CV')
  if (!hasCv) missing.push({ key: 'cv', label: 'CV uploadé' })
  return missing.length ? missing : []
}

export default function ProfileCompletionCard({ completion = 0, missingItems, profile, documents }) {
  const missing = missingItems ?? computeMissingItems(profile, documents)
  const percent = Math.round(Number(completion) || 0)
  const isComplete = percent >= 100

  return (
    <div
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
    >
      <div className="flex gap-6">
        {/* Cercle de progression */}
        <div className="flex-shrink-0 relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#226D68"
              strokeWidth="3"
              strokeDasharray={`${percent}, 100`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#226D68] font-heading">
            {percent}%
          </span>
        </div>

        {/* Liste des éléments manquants */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-[#2C2C2C] mb-2">Complétion du profil</h3>
          {isComplete ? (
            <p className="text-sm text-[#226D68] font-medium">Profil complet !</p>
          ) : missing.length > 0 ? (
            <ul className="space-y-1.5">
              {missing.map((item) => (
                <li key={item.key} className="flex items-center gap-2 text-sm text-[#6b7280]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {item.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#6b7280]">Vérifiez les champs obligatoires.</p>
          )}
        </div>
      </div>
    </div>
  )
}
