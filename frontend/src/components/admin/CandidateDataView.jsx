import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function CandidateDataView({ data }) {
  if (!data) {
    return <div className="text-muted-foreground">Aucune donnée disponible</div>
  }

  // Les données viennent directement de l'API Candidate Service (format backend)
  // Format: { first_name, last_name, email, experiences: [...], educations: [...], etc. }

  return (
    <div className="space-y-6">
      {/* Profil Général */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Général</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Prénom</label>
              <p className="text-sm font-medium">{data.first_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom</label>
              <p className="text-sm font-medium">{data.last_name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date de naissance</label>
              <p className="text-sm">
                {data.date_of_birth 
                  ? new Date(data.date_of_birth).toLocaleDateString('fr-FR')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nationalité</label>
              <p className="text-sm">{data.nationality || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{data.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
              <p className="text-sm">{data.phone || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Adresse</label>
              <p className="text-sm">{data.address || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ville</label>
              <p className="text-sm">{data.city || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Pays</label>
              <p className="text-sm">{data.country || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Titre du profil</label>
              <p className="text-sm font-medium">{data.profile_title || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-muted-foreground">Résumé professionnel</label>
              <p className="text-sm whitespace-pre-wrap">{data.professional_summary || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Secteur</label>
              <p className="text-sm">{data.sector || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Métier principal</label>
              <p className="text-sm">{data.main_job || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Expérience totale</label>
              <p className="text-sm">{data.total_experience || 0} ans</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <Badge variant={data.status === 'VALIDATED' ? 'default' : 'secondary'}>
                {data.status || 'DRAFT'}
              </Badge>
            </div>
            {data.completion_percentage !== undefined && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Complétion</label>
                <p className="text-sm">{data.completion_percentage.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expériences Professionnelles */}
      {data.experiences && data.experiences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expériences Professionnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.experiences.map((exp, index) => (
              <div key={exp.id || index} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{exp.position}</h4>
                    <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                    {exp.company_sector && (
                      <p className="text-xs text-muted-foreground">{exp.company_sector}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <p>
                      {new Date(exp.start_date).toLocaleDateString('fr-FR')} - {
                        exp.is_current 
                          ? 'En cours' 
                          : exp.end_date 
                            ? new Date(exp.end_date).toLocaleDateString('fr-FR')
                            : 'N/A'
                      }
                    </p>
                    {exp.contract_type && (
                      <Badge variant="outline" className="mt-1">{exp.contract_type}</Badge>
                    )}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-sm whitespace-pre-wrap">{exp.description}</p>
                )}
                {exp.achievements && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Réalisations:</label>
                    <p className="text-sm whitespace-pre-wrap">{exp.achievements}</p>
                  </div>
                )}
                {exp.has_document && (
                  <Badge variant="outline">Document justificatif disponible</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Formations */}
      {data.educations && data.educations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Formations & Diplômes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.educations.map((edu, index) => (
              <div key={edu.id || index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{edu.diploma}</h4>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    {edu.country && (
                      <p className="text-xs text-muted-foreground">{edu.country}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <p>{edu.graduation_year}</p>
                    <Badge variant="outline" className="mt-1">{edu.level}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.certifications.map((cert, index) => (
              <div key={cert.id || index} className="border rounded-lg p-4">
                <h4 className="font-medium">{cert.title}</h4>
                <p className="text-sm text-muted-foreground">{cert.issuer} - {cert.year}</p>
                {cert.verification_url && (
                  <a 
                    href={cert.verification_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-primary hover:underline"
                  >
                    Vérifier
                  </a>
                )}
                {cert.expiration_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expire le: {new Date(cert.expiration_date).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Compétences */}
      {data.skills && data.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compétences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['TECHNICAL', 'SOFT', 'TOOL'].map((skillType) => {
              const skillsOfType = data.skills.filter(s => s.skill_type === skillType)
              if (skillsOfType.length === 0) return null
              
              return (
                <div key={skillType}>
                  <label className="text-sm font-medium text-muted-foreground">
                    {skillType === 'TECHNICAL' ? 'Compétences techniques' :
                     skillType === 'SOFT' ? 'Compétences comportementales' :
                     'Outils & Logiciels'}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillsOfType.map((skill, index) => (
                      <Badge key={skill.id || index} variant={skillType === 'TECHNICAL' ? 'secondary' : 'outline'}>
                        {skill.name}
                        {skill.level && ` (${skill.level})`}
                        {skill.years_of_practice && ` - ${skill.years_of_practice} ans`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Recherche d'emploi */}
      {data.job_preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Recherche d'Emploi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.job_preferences.desired_positions && data.job_preferences.desired_positions.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Postes recherchés</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.job_preferences.desired_positions.map((pos, index) => (
                    <Badge key={index}>{pos}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type de contrat</label>
                <p className="text-sm">{data.job_preferences.contract_type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Localisation</label>
                <p className="text-sm">{data.job_preferences.desired_location || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Disponibilité</label>
                <p className="text-sm">{data.job_preferences.availability || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Prétentions salariales</label>
                <p className="text-sm">
                  {data.job_preferences.salary_expectations 
                    ? `${data.job_preferences.salary_expectations} €/an` 
                    : 'N/A'}
                </p>
              </div>
              {data.job_preferences.mobility && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobilité</label>
                  <p className="text-sm">{data.job_preferences.mobility}</p>
                </div>
              )}
              {data.job_preferences.target_sectors && data.job_preferences.target_sectors.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Secteurs ciblés</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {data.job_preferences.target_sectors.map((sector, index) => (
                      <Badge key={index} variant="outline">{sector}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

