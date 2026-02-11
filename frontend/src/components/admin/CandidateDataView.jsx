import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, MapPin, Briefcase, GraduationCap, Award, Code, Target, ChevronDown, ChevronUp } from 'lucide-react'

export default function CandidateDataView({ data }) {
  const [expandedExp, setExpandedExp] = useState({})

  if (!data) {
    return <div className="text-sm text-muted-foreground">Aucune donnée disponible</div>
  }

  const toggleExp = (id) => {
    setExpandedExp((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-4">
      {/* Bloc Identité + Contact + Localisation + Profil pro + Statut */}
      <Card className="rounded-lg border border-border">
        <CardHeader className="py-3 px-4 border-b border-border bg-[#226D68]/5">
          <CardTitle className="text-sm font-heading font-semibold text-gray-anthracite flex items-center gap-2">
            <User className="h-4 w-4 text-[#226D68]" />
            Identité &amp; profil
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block">Prénom</label>
              <p className="text-sm font-medium text-gray-anthracite">{data.first_name || '—'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block">Nom</label>
              <p className="text-sm font-medium text-gray-anthracite">{data.last_name || '—'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block">Date de naissance</label>
              <p className="text-sm text-gray-anthracite">
                {data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block">Nationalité</label>
              <p className="text-sm text-gray-anthracite">{data.nationality || '—'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-anthracite">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              {data.email || '—'}
            </span>
            {data.phone && (
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground">·</span>
                {data.phone}
              </span>
            )}
          </div>

          {(data.city || data.country) && (
            <div className="flex items-center gap-1.5 text-sm text-gray-anthracite">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {[data.city, data.country].filter(Boolean).join(', ')}
              {data.address && ` · ${data.address}`}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Titre du profil</label>
            <p className="text-sm font-medium text-gray-anthracite">{data.profile_title || '—'}</p>
          </div>
          {data.professional_summary && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Résumé professionnel</label>
              <div
                className="text-sm text-gray-anthracite whitespace-pre-wrap max-h-32 overflow-y-auto rounded border border-border/50 p-2 bg-muted/30"
                dangerouslySetInnerHTML={{ __html: data.professional_summary }}
              />
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block">Secteur</label>
              <p className="text-sm text-gray-anthracite">{data.sector || '—'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block">Métier principal</label>
              <p className="text-sm text-gray-anthracite">{data.main_job || '—'}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block">Expérience totale</label>
              <p className="text-sm text-gray-anthracite">{data.total_experience ?? 0} an(s)</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <Badge className={data.status === 'VALIDATED' ? 'bg-[#226D68] text-white' : 'bg-muted text-gray-anthracite'}>
              {data.status || 'DRAFT'}
            </Badge>
            {data.completion_percentage != null && (
              <span className="text-xs text-muted-foreground">{data.completion_percentage.toFixed(0)}% complété</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expériences - compactes */}
      {data.experiences && data.experiences.length > 0 && (
        <Card className="rounded-lg border border-border">
          <CardHeader className="py-3 px-4 border-b border-border bg-[#226D68]/5">
            <CardTitle className="text-sm font-heading font-semibold text-gray-anthracite flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#226D68]" />
              Expériences professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.experiences.map((exp, index) => {
              const defaultCompanyLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(exp.company_name || 'Company')}&size=80&background=random&color=fff&bold=true`
              const displayCompanyLogo = exp.company_logo_url || defaultCompanyLogo
              const expKey = exp.id || index
              const isExpanded = expandedExp[expKey]

              return (
                <div key={expKey} className="rounded-lg border border-border bg-white p-3 space-y-2">
                  <div className="flex gap-3 items-start">
                    <img
                      src={displayCompanyLogo}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
                      onError={(e) => { if (e.target.src !== defaultCompanyLogo) e.target.src = defaultCompanyLogo }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-sm text-gray-anthracite">{exp.position}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-sm text-muted-foreground">{exp.company_name}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                          {' – '}
                          {exp.is_current ? 'En cours' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '—'}
                        </span>
                        {exp.contract_type && (
                          <Badge variant="outline" className="text-xs border-[#226D68]/30 text-[#1a5a55]">
                            {exp.contract_type}
                          </Badge>
                        )}
                      </div>
                      {exp.company_sector && (
                        <p className="text-xs text-muted-foreground mt-0.5">{exp.company_sector}</p>
                      )}
                    </div>
                  </div>
                  {(exp.description || exp.achievements) && (
                    <div className="text-sm text-gray-anthracite pl-0 sm:pl-[60px]">
                      {exp.description && (
                        <div className={isExpanded ? '' : 'line-clamp-3'}>
                          <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: exp.description }} />
                        </div>
                      )}
                      {exp.achievements && (isExpanded || !exp.description) && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <label className="text-xs text-muted-foreground block mb-1">Réalisations</label>
                          <div className={`rich-text-content text-sm ${!isExpanded && exp.description ? 'line-clamp-2' : ''}`} dangerouslySetInnerHTML={{ __html: exp.achievements }} />
                        </div>
                      )}
                      {((exp.description && exp.description.length > 100) || (exp.achievements && exp.achievements.length > 100)) && (
                        <button type="button" onClick={() => toggleExp(expKey)} className="text-xs text-[#226D68] hover:underline mt-1 flex items-center gap-0.5">
                          {isExpanded ? <>Réduire <ChevronUp className="h-3 w-3" /></> : <>Lire plus <ChevronDown className="h-3 w-3" /></>}
                        </button>
                      )}
                      {exp.has_document && (
                        <Badge variant="outline" className="mt-2 text-xs border-[#226D68]/20">Document justificatif</Badge>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Formations - compactes */}
      {data.educations && data.educations.length > 0 && (
        <Card className="rounded-lg border border-border">
          <CardHeader className="py-3 px-4 border-b border-border bg-[#226D68]/5">
            <CardTitle className="text-sm font-heading font-semibold text-gray-anthracite flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#226D68]" />
              Formations &amp; diplômes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data.educations.map((edu, index) => (
              <div key={edu.id || index} className="flex justify-between items-start gap-2 py-2 border-b border-border/50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-anthracite">{edu.diploma}</p>
                  <p className="text-xs text-muted-foreground">{edu.institution}{edu.country ? ` · ${edu.country}` : ''}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{edu.graduation_year}</span>
                  <Badge variant="outline" className="text-xs border-[#226D68]/20">{edu.level}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications - compactes */}
      {data.certifications && data.certifications.length > 0 && (
        <Card className="rounded-lg border border-border">
          <CardHeader className="py-3 px-4 border-b border-border bg-[#226D68]/5">
            <CardTitle className="text-sm font-heading font-semibold text-gray-anthracite flex items-center gap-2">
              <Award className="h-4 w-4 text-[#226D68]" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data.certifications.map((cert, index) => (
              <div key={cert.id || index} className="flex justify-between items-start gap-2 py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-anthracite">{cert.title}</p>
                  <p className="text-xs text-muted-foreground">{cert.issuer} · {cert.year}</p>
                  {cert.expiration_date && (
                    <p className="text-xs text-muted-foreground">Expire le {new Date(cert.expiration_date).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
                {cert.verification_url && (
                  <a href={cert.verification_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#226D68] hover:underline flex-shrink-0">
                    Vérifier
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Compétences - badges compacts */}
      {data.skills && data.skills.length > 0 && (
        <Card className="rounded-lg border border-border">
          <CardHeader className="py-3 px-4 border-b border-border bg-[#226D68]/5">
            <CardTitle className="text-sm font-heading font-semibold text-gray-anthracite flex items-center gap-2">
              <Code className="h-4 w-4 text-[#226D68]" />
              Compétences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {['TECHNICAL', 'SOFT', 'TOOL'].map((skillType) => {
              const skillsOfType = data.skills.filter((s) => s.skill_type === skillType)
              if (skillsOfType.length === 0) return null
              const label = skillType === 'TECHNICAL' ? 'Techniques' : skillType === 'SOFT' ? 'Comportementales' : 'Outils & logiciels'
              return (
                <div key={skillType}>
                  <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsOfType.map((skill, idx) => (
                      <Badge
                        key={skill.id || idx}
                        variant="outline"
                        className="text-xs bg-[#226D68]/5 border-[#226D68]/20 text-gray-anthracite"
                      >
                        {skill.name}
                        {skill.level && ` · ${skill.level}`}
                        {skill.years_of_practice != null && skill.years_of_practice > 0 && ` · ${skill.years_of_practice} an(s)`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Préférences - une card, grille serrée */}
      {data.job_preferences && (
        <Card className="rounded-lg border border-border">
          <CardHeader className="py-3 px-4 border-b border-border bg-[#226D68]/5">
            <CardTitle className="text-sm font-heading font-semibold text-gray-anthracite flex items-center gap-2">
              <Target className="h-4 w-4 text-[#226D68]" />
              Recherche d&apos;emploi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {data.job_preferences.desired_positions?.length > 0 && (
              <div className="mb-3">
                <label className="text-xs text-muted-foreground block mb-1">Postes recherchés</label>
                <div className="flex flex-wrap gap-1.5">
                  {data.job_preferences.desired_positions.map((pos, index) => (
                    <Badge key={index} className="text-xs bg-[#226D68]/10 text-[#1a5a55] border-[#226D68]/20">
                      {pos}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block">Type(s) de contrat</label>
                <p className="text-sm text-gray-anthracite">
                  {data.job_preferences.contract_types?.length
                    ? data.job_preferences.contract_types.join(', ')
                    : data.job_preferences.contract_type || '—'}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block">Localisation</label>
                <p className="text-sm text-gray-anthracite">{data.job_preferences.desired_location || data.job_preferences.preferred_locations || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block">Disponibilité</label>
                <p className="text-sm text-gray-anthracite">{data.job_preferences.availability || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block">Salaire (min–max)</label>
                <p className="text-sm text-gray-anthracite">
                  {data.job_preferences.salary_min != null || data.job_preferences.salary_max != null
                    ? [data.job_preferences.salary_min, data.job_preferences.salary_max].filter(Boolean).join(' – ') + ' (CFA/mois)'
                    : data.job_preferences.salary_expectations != null
                      ? `${data.job_preferences.salary_expectations} (attendu)`
                      : '—'}
                </p>
              </div>
              {data.job_preferences.mobility && (
                <div>
                  <label className="text-xs text-muted-foreground block">Mobilité</label>
                  <p className="text-sm text-gray-anthracite">{data.job_preferences.mobility}</p>
                </div>
              )}
            </div>
            {data.job_preferences.target_sectors?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <label className="text-xs text-muted-foreground block mb-1">Secteurs ciblés</label>
                <div className="flex flex-wrap gap-1.5">
                  {data.job_preferences.target_sectors.map((sector, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-[#226D68]/20">
                      {sector}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
