import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, Edit, FileText, CheckCircle2, Clock, XCircle, 
  Briefcase, GraduationCap, Award, Code, MapPin, Star,
  Plus, Trash2, Eye
} from 'lucide-react'
import { candidateApi } from '../services/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

export default function CandidateDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [experiences, setExperiences] = useState([])
  const [educations, setEducations] = useState([])
  const [certifications, setCertifications] = useState([])
  const [skills, setSkills] = useState([])
  const [jobPreferences, setJobPreferences] = useState(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await candidateApi.getMyProfile()
      setProfile(profileData)
      
      // Charger les relations si disponibles
      if (profileData.id) {
        try {
          const [exps, edus, certs, skls, prefs] = await Promise.all([
            candidateApi.getExperiences(profileData.id).catch(() => []),
            candidateApi.getEducations(profileData.id).catch(() => []),
            candidateApi.getCertifications(profileData.id).catch(() => []),
            candidateApi.getSkills(profileData.id).catch(() => []),
            candidateApi.getJobPreferences(profileData.id).catch(() => null),
          ])
          
          setExperiences(exps || [])
          setEducations(edus || [])
          setCertifications(certs || [])
          setSkills(skls || [])
          setJobPreferences(prefs)
        } catch (error) {
          console.error('Error loading relations:', error)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      if (error.response?.status === 404) {
        // Profil n'existe pas, rediriger vers onboarding
        navigate('/onboarding')
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      DRAFT: { label: 'Brouillon', variant: 'secondary', icon: Edit },
      SUBMITTED: { label: 'Soumis', variant: 'default', icon: Clock },
      IN_REVIEW: { label: 'En cours de validation', variant: 'default', icon: Clock },
      VALIDATED: { label: 'Validé', variant: 'default', icon: CheckCircle2, className: 'bg-green-500' },
      REJECTED: { label: 'Refusé', variant: 'destructive', icon: XCircle },
      ARCHIVED: { label: 'Archivé', variant: 'secondary', icon: FileText },
    }
    
    const config = statusConfig[status] || statusConfig.DRAFT
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const handleDeleteExperience = async (experienceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette expérience ?')) return
    
    try {
      await candidateApi.deleteExperience(profile.id, experienceId)
      setExperiences(experiences.filter(exp => exp.id !== experienceId))
    } catch (error) {
      console.error('Error deleting experience:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteEducation = async (educationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return
    
    try {
      await candidateApi.deleteEducation(profile.id, educationId)
      setEducations(educations.filter(edu => edu.id !== educationId))
    } catch (error) {
      console.error('Error deleting education:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteCertification = async (certificationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette certification ?')) return
    
    try {
      await candidateApi.deleteCertification(profile.id, certificationId)
      setCertifications(certifications.filter(cert => cert.id !== certificationId))
    } catch (error) {
      console.error('Error deleting certification:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) return
    
    try {
      await candidateApi.deleteSkill(profile.id, skillId)
      setSkills(skills.filter(skill => skill.id !== skillId))
    } catch (error) {
      console.error('Error deleting skill:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Profil non trouvé</p>
          <Button onClick={() => navigate('/onboarding')}>
            Créer mon profil
          </Button>
        </div>
      </div>
    )
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Candidat'
  const completionPercentage = profile.completion_percentage || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
              <p className="text-gray-600">Gérez votre profil professionnel</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/onboarding')}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              {profile.status === 'DRAFT' && (
                <Button onClick={async () => {
                  try {
                    await candidateApi.submitProfile(profile.id)
                    alert('Profil soumis avec succès !')
                    loadProfile()
                  } catch (error) {
                    alert('Erreur lors de la soumission: ' + (error.response?.data?.detail || error.message))
                  }
                }}>
                  Soumettre pour validation
                </Button>
              )}
            </div>
          </div>

          {/* Statut et progression */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Statut du profil</p>
                  {getStatusBadge(profile.status)}
                </div>
                {profile.admin_score && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="font-semibold">{profile.admin_score.toFixed(1)}/5</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Complétion du profil</p>
                <p className="text-2xl font-bold">{Math.round(completionPercentage)}%</p>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="experiences">Expériences</TabsTrigger>
            <TabsTrigger value="educations">Formations</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="skills">Compétences</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations personnelles */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-semibold">Informations personnelles</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium">{fullName}</p>
                  </div>
                  {profile.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  )}
                  {profile.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  )}
                  {profile.city && (
                    <div>
                      <p className="text-sm text-gray-500">Localisation</p>
                      <p className="font-medium">{profile.city}{profile.country ? `, ${profile.country}` : ''}</p>
                    </div>
                  )}
                  {profile.profile_title && (
                    <div>
                      <p className="text-sm text-gray-500">Titre du profil</p>
                      <p className="font-medium">{profile.profile_title}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Statistiques */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <h3 className="text-lg font-semibold">Statistiques</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expériences</span>
                    <span className="font-semibold">{experiences.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Formations</span>
                    <span className="font-semibold">{educations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Certifications</span>
                    <span className="font-semibold">{certifications.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Compétences</span>
                    <span className="font-semibold">{skills.length}</span>
                  </div>
                  {profile.total_experience !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Années d'expérience</span>
                      <span className="font-semibold">{profile.total_experience}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Résumé professionnel */}
              {profile.professional_summary && (
                <Card className="p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">Résumé professionnel</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.professional_summary}</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Expériences */}
          <TabsContent value="experiences" className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Expériences professionnelles</h3>
                <Button onClick={() => navigate('/onboarding')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              {experiences.length > 0 ? (
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{exp.position}</h4>
                          <p className="text-gray-600">{exp.company_name}</p>
                          {exp.company_sector && (
                            <p className="text-sm text-gray-500">{exp.company_sector}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            {exp.end_date 
                              ? ` - ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                              : exp.is_current ? ' - Actuellement' : ''}
                          </p>
                          {exp.description && (
                            <p className="text-gray-700 mt-2">{exp.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExperience(exp.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune expérience enregistrée</p>
                  <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                    Ajouter une expérience
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Formations */}
          <TabsContent value="educations" className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Formations & Diplômes</h3>
                <Button onClick={() => navigate('/onboarding')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              {educations.length > 0 ? (
                <div className="space-y-4">
                  {educations.map((edu) => (
                    <div key={edu.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{edu.diploma}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                          {edu.country && (
                            <p className="text-sm text-gray-500">{edu.country}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            {edu.start_year && `${edu.start_year} - `}{edu.graduation_year}
                            {edu.level && ` • ${edu.level}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEducation(edu.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune formation enregistrée</p>
                  <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                    Ajouter une formation
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Certifications */}
          <TabsContent value="certifications" className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Certifications</h3>
                <Button onClick={() => navigate('/onboarding')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              {certifications.length > 0 ? (
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{cert.title}</h4>
                          <p className="text-gray-600">{cert.issuer}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {cert.year}
                            {cert.expiration_date && ` • Expire le ${new Date(cert.expiration_date).toLocaleDateString('fr-FR')}`}
                          </p>
                          {cert.verification_url && (
                            <a 
                              href={cert.verification_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                              Lien de vérification
                            </a>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCertification(cert.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune certification enregistrée</p>
                  <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                    Ajouter une certification
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Compétences */}
          <TabsContent value="skills" className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Compétences</h3>
                <Button onClick={() => navigate('/onboarding')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
              {skills.length > 0 ? (
                <div className="space-y-4">
                  {/* Grouper par type */}
                  {['TECHNICAL', 'SOFT', 'TOOL'].map((type) => {
                    const typeSkills = skills.filter(s => s.skill_type === type)
                    if (typeSkills.length === 0) return null
                    
                    return (
                      <div key={type} className="mb-6">
                        <h4 className="font-semibold mb-3 text-gray-700">
                          {type === 'TECHNICAL' ? 'Techniques' : type === 'SOFT' ? 'Soft Skills' : 'Outils'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {typeSkills.map((skill) => (
                            <div
                              key={skill.id}
                              className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2"
                            >
                              <span className="font-medium">{skill.name}</span>
                              {skill.level && (
                                <Badge variant="secondary" className="ml-2">
                                  {skill.level}
                                </Badge>
                              )}
                              {skill.years_of_practice && (
                                <span className="text-sm text-gray-500">
                                  ({skill.years_of_practice} an{skill.years_of_practice > 1 ? 's' : ''})
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-2"
                                onClick={() => handleDeleteSkill(skill.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune compétence enregistrée</p>
                  <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                    Ajouter une compétence
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Préférences */}
          <TabsContent value="preferences" className="mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Préférences d'emploi</h3>
              {jobPreferences ? (
                <div className="space-y-4">
                  {jobPreferences.desired_positions && jobPreferences.desired_positions.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Postes recherchés</p>
                      <div className="flex flex-wrap gap-2">
                        {jobPreferences.desired_positions.map((pos, idx) => (
                          <Badge key={idx} variant="secondary">{pos}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobPreferences.contract_type && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Type de contrat</p>
                      <p className="font-medium">{jobPreferences.contract_type}</p>
                    </div>
                  )}
                  {jobPreferences.target_sectors && jobPreferences.target_sectors.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Secteurs ciblés</p>
                      <div className="flex flex-wrap gap-2">
                        {jobPreferences.target_sectors.map((sector, idx) => (
                          <Badge key={idx} variant="secondary">{sector}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {jobPreferences.desired_location && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Localisation souhaitée</p>
                      <p className="font-medium">{jobPreferences.desired_location}</p>
                    </div>
                  )}
                  {jobPreferences.mobility && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Mobilité</p>
                      <p className="font-medium">{jobPreferences.mobility}</p>
                    </div>
                  )}
                  {jobPreferences.availability && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Disponibilité</p>
                      <p className="font-medium">{jobPreferences.availability}</p>
                    </div>
                  )}
                  {jobPreferences.salary_expectations && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Prétentions salariales</p>
                      <p className="font-medium">{jobPreferences.salary_expectations} €</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune préférence enregistrée</p>
                  <Button className="mt-4" onClick={() => navigate('/onboarding')}>
                    Définir mes préférences
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

