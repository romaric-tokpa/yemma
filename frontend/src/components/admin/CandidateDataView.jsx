/**
 * Affichage des données du profil candidat pour l'admin.
 * Identité, expériences, formations, certifications, compétences, préférences.
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  User, Mail, MapPin, Briefcase, GraduationCap, Award, Code, Target,
  ChevronDown, ChevronUp, Phone,
} from 'lucide-react'

export default function CandidateDataView({ data }) {
  const [expandedExp, setExpandedExp] = useState({})

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-[#6b7280]">
        Aucune donnée disponible
      </div>
    )
  }

  const toggleExp = (id) => setExpandedExp((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-6">
      {/* Identité & profil */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
          <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
            <User className="h-5 w-5 text-[#226D68]" />
            Identité & profil
          </h3>
        </div>
        <div className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-0.5">Prénom</p>
              <p className="text-sm font-medium text-[#2C2C2C]">{data.first_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-0.5">Nom</p>
              <p className="text-sm font-medium text-[#2C2C2C]">{data.last_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-0.5">Date de naissance</p>
              <p className="text-sm text-[#2C2C2C]">
                {data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-0.5">Nationalité</p>
              <p className="text-sm text-[#2C2C2C]">{data.nationality || '—'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#2C2C2C]">
            {data.email && (
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#226D68]" />
                {data.email}
              </span>
            )}
            {data.phone && (
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#226D68]" />
                {data.phone}
              </span>
            )}
          </div>

          {(data.city || data.country || data.address) && (
            <div className="flex items-center gap-2 text-sm text-[#2C2C2C]">
              <MapPin className="h-4 w-4 text-[#226D68] shrink-0" />
              {[data.city, data.country].filter(Boolean).join(', ')}
              {data.address && ` · ${data.address}`}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-0.5">Titre du profil</p>
            <p className="text-sm font-semibold text-[#2C2C2C]">{data.profile_title || '—'}</p>
          </div>

          {data.professional_summary && (
            <div>
              <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-1.5">Résumé professionnel</p>
              <div
                className="text-sm text-[#2C2C2C] whitespace-pre-wrap max-h-40 overflow-y-auto rounded-lg border border-gray-100 p-4 bg-[#F4F6F8]/50 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.professional_summary }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs font-medium text-[#6b7280] mb-0.5">Secteur</p>
              <p className="text-sm text-[#2C2C2C]">{data.sector || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6b7280] mb-0.5">Métier principal</p>
              <p className="text-sm text-[#2C2C2C]">{data.main_job || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6b7280] mb-0.5">Expérience</p>
              <p className="text-sm text-[#2C2C2C]">{data.total_experience ?? 0} an(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={data.status === 'VALIDATED' ? 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30' : 'bg-gray-100 text-[#6b7280] border-gray-200'}>
                {data.status || 'DRAFT'}
              </Badge>
              {data.completion_percentage != null && (
                <span className="text-xs text-[#6b7280]">{data.completion_percentage.toFixed(0)}%</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expériences */}
      {data.experiences?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
              <Briefcase className="h-5 w-5 text-[#226D68]" />
              Expériences professionnelles
            </h3>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {data.experiences.map((exp, index) => {
              const defaultLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(exp.company_name || 'Co')}&size=80&background=226D68&color=fff&bold=true`
              const logo = exp.company_logo_url || defaultLogo
              const expKey = exp.id || index
              const isExpanded = expandedExp[expKey]
              const hasLongContent = (exp.description?.length > 150 || exp.achievements?.length > 150)

              return (
                <div key={expKey} className="rounded-xl border border-gray-100 p-4 hover:border-[#226D68]/20 transition-colors">
                  <div className="flex gap-4">
                    <img
                      src={logo}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover border border-gray-100 shrink-0"
                      onError={(e) => { if (e.target.src !== defaultLogo) e.target.src = defaultLogo }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#2C2C2C]">{exp.position}</span>
                        <span className="text-[#6b7280]">·</span>
                        <span className="text-sm text-[#6b7280]">{exp.company_name}</span>
                        {exp.contract_type && (
                          <Badge variant="outline" className="text-xs border-[#226D68]/30 text-[#1a5a55]">
                            {exp.contract_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#6b7280] mt-0.5">
                        {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                        {' – '}
                        {exp.is_current ? 'En cours' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—'}
                        {exp.company_sector && ` · ${exp.company_sector}`}
                      </p>
                      {(exp.description || exp.achievements) && (
                        <div className="mt-3 text-sm text-[#2C2C2C]">
                          {exp.description && (
                            <div className={`rich-text-content ${!isExpanded && hasLongContent ? 'line-clamp-3' : ''}`} dangerouslySetInnerHTML={{ __html: exp.description }} />
                          )}
                          {exp.achievements && (
                            <div className={`mt-2 pt-2 border-t border-gray-100 ${!isExpanded && exp.description && hasLongContent ? 'line-clamp-2' : ''}`}>
                              <p className="text-xs font-medium text-[#6b7280] mb-1">Réalisations</p>
                              <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: exp.achievements }} />
                            </div>
                          )}
                          {hasLongContent && (
                            <button type="button" onClick={() => toggleExp(expKey)} className="text-xs text-[#226D68] hover:underline mt-2 flex items-center gap-1 font-medium">
                              {isExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Réduire</> : <><ChevronDown className="h-3.5 w-3.5" /> Lire plus</>}
                            </button>
                          )}
                          {exp.has_document && (
                            <Badge variant="outline" className="mt-2 text-xs border-[#226D68]/20 text-[#1a5a55]">Document joint</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Formations */}
      {data.educations?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
              <GraduationCap className="h-5 w-5 text-[#226D68]" />
              Formations & diplômes
            </h3>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {data.educations.map((edu, index) => (
              <div key={edu.id || index} className="flex justify-between items-start gap-4 py-3 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <p className="font-medium text-[#2C2C2C]">{edu.diploma}</p>
                  <p className="text-sm text-[#6b7280]">{edu.institution}{edu.country ? ` · ${edu.country}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-[#6b7280]">{edu.graduation_year}</span>
                  {edu.level && <Badge variant="outline" className="text-xs border-[#226D68]/20">{edu.level}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
              <Award className="h-5 w-5 text-[#226D68]" />
              Certifications
            </h3>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {data.certifications.map((cert, index) => (
              <div key={cert.id || index} className="flex justify-between items-start gap-4 py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-[#2C2C2C]">{cert.title}</p>
                  <p className="text-sm text-[#6b7280]">{cert.issuer} · {cert.year}</p>
                  {cert.expiration_date && (
                    <p className="text-xs text-[#6b7280] mt-0.5">Expire le {new Date(cert.expiration_date).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                {cert.verification_url && (
                  <a href={cert.verification_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#226D68] hover:underline shrink-0">
                    Vérifier
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compétences */}
      {data.skills?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
              <Code className="h-5 w-5 text-[#226D68]" />
              Compétences
            </h3>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {['TECHNICAL', 'SOFT', 'TOOL'].map((type) => {
              const skills = data.skills.filter((s) => s.skill_type === type)
              if (skills.length === 0) return null
              const label = type === 'TECHNICAL' ? 'Techniques' : type === 'SOFT' ? 'Comportementales' : 'Outils & logiciels'
              return (
                <div key={type}>
                  <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wider mb-2">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <Badge key={skill.id || idx} variant="outline" className="bg-[#E8F4F3]/50 border-[#226D68]/20 text-[#1a5a55] font-normal">
                        {skill.name}
                        {skill.level && ` · ${skill.level}`}
                        {skill.years_of_practice != null && skill.years_of_practice > 0 && ` · ${skill.years_of_practice} an(s)`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Préférences */}
      {data.job_preferences && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-[#F4F6F8]/50">
            <h3 className="flex items-center gap-2 text-base font-semibold text-[#2C2C2C]">
              <Target className="h-5 w-5 text-[#226D68]" />
              Recherche d&apos;emploi
            </h3>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {data.job_preferences.desired_positions?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#6b7280] mb-2">Postes recherchés</p>
                <div className="flex flex-wrap gap-2">
                  {data.job_preferences.desired_positions.map((pos, i) => (
                    <Badge key={i} className="bg-[#226D68]/10 text-[#1a5a55] border-[#226D68]/20">{pos}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-[#6b7280] mb-0.5">Type(s) de contrat</p>
                <p className="text-sm text-[#2C2C2C]">
                  {data.job_preferences.contract_types?.length
                    ? data.job_preferences.contract_types.join(', ')
                    : data.job_preferences.contract_type || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] mb-0.5">Localisation</p>
                <p className="text-sm text-[#2C2C2C]">{data.job_preferences.desired_location || data.job_preferences.preferred_locations || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] mb-0.5">Disponibilité</p>
                <p className="text-sm text-[#2C2C2C]">{data.job_preferences.availability || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] mb-0.5">Salaire</p>
                <p className="text-sm text-[#2C2C2C]">
                  {data.job_preferences.salary_min != null || data.job_preferences.salary_max != null
                    ? [data.job_preferences.salary_min, data.job_preferences.salary_max].filter(Boolean).join(' – ') + ' CFA/mois'
                    : data.job_preferences.salary_expectations != null
                      ? `${data.job_preferences.salary_expectations} (attendu)`
                      : '—'}
                </p>
              </div>
              {data.job_preferences.mobility && (
                <div>
                  <p className="text-xs font-medium text-[#6b7280] mb-0.5">Mobilité</p>
                  <p className="text-sm text-[#2C2C2C]">{data.job_preferences.mobility}</p>
                </div>
              )}
            </div>
            {data.job_preferences.target_sectors?.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-[#6b7280] mb-2">Secteurs ciblés</p>
                <div className="flex flex-wrap gap-2">
                  {data.job_preferences.target_sectors.map((sector, i) => (
                    <Badge key={i} variant="outline" className="border-[#226D68]/20 text-[#1a5a55]">{sector}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
