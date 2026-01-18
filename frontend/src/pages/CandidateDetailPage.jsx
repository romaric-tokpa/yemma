import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Download, FileText, User, Briefcase, MapPin, Star, CheckCircle2, 
  Mail, Phone, Calendar, Globe, Award, GraduationCap, Target
} from 'lucide-react'
import { candidateApi, paymentApiService, auditApiService, documentApi, authApiService, searchApiService } from '../services/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { BlurredDocuments } from '../components/search/BlurredDocuments'

// Générer un avatar par défaut basé sur les initiales
const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random&color=fff&bold=true`
}

// Générer un logo d'entreprise par défaut
const generateCompanyLogoUrl = (companyName) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Company')}&size=100&background=random&color=fff&bold=true`
}

export function CandidateDetailPage() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [quotaAllowed, setQuotaAllowed] = useState(false)
  const [companyId, setCompanyId] = useState(null)

  useEffect(() => {
    loadUserAndCompany()
    loadCandidate()
    loadDocuments()
  }, [candidateId])

  const loadUserAndCompany = async () => {
    try {
      const user = await authApiService.getCurrentUser()
      if (user.company_id) {
        setCompanyId(user.company_id)
        loadSubscription(user.company_id)
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadCandidate = async () => {
    try {
      setLoading(true)
      // Utiliser l'endpoint du service search qui permet aux recruteurs d'accéder aux profils
      // Cet endpoint gère automatiquement les quotas et les logs d'accès
      const data = await searchApiService.getCandidateProfile(candidateId)
      setCandidate(data)
      
      // Si les relations ne sont pas incluses, les charger séparément
      // Note: Normalement, l'endpoint du service search devrait retourner toutes les relations
      if (data.id && (!data.experiences || !data.educations || !data.certifications || !data.skills)) {
        try {
          // Si les relations ne sont pas présentes, on ne peut pas les charger directement
          // car le service candidate ne permet pas aux recruteurs d'y accéder
          // L'endpoint du service search devrait normalement inclure toutes ces données
          console.warn('Relations manquantes dans la réponse du service search')
        } catch (error) {
          console.error('Error loading relations:', error)
        }
      }
    } catch (error) {
      console.error('Error loading candidate:', error)
      // Si l'erreur est 404, le candidat n'existe pas
      if (error.response?.status === 404) {
        setCandidate(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    try {
      const data = await documentApi.getCandidateDocuments(candidateId)
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const loadSubscription = async (currentCompanyId) => {
    if (!currentCompanyId) return

    try {
      const sub = await paymentApiService.getSubscription(currentCompanyId)
      setSubscription(sub)
      
      const quota = await paymentApiService.checkQuota(currentCompanyId)
      setQuotaAllowed(quota.allowed)
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const handleViewProfile = async () => {
    if (!companyId) return

    const quota = await paymentApiService.checkQuota(companyId)
    
    if (!quota.allowed) {
      alert('Votre quota de consultations est épuisé. Veuillez mettre à jour votre abonnement.')
      return
    }

    try {
      await paymentApiService.useQuota(companyId)
      
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      await auditApiService.logAccess({
        recruiter_id: user.id,
        recruiter_email: user.email,
        recruiter_name: user.name,
        company_id: companyId,
        company_name: subscription?.plan?.name || 'Unknown',
        candidate_id: parseInt(candidateId),
        candidate_email: candidate?.email,
        candidate_name: `${candidate?.first_name || ''} ${candidate?.last_name || ''}`.trim(),
        access_type: 'profile_view',
      })
    } catch (error) {
      console.error('Error using quota:', error)
    }
  }

  const handleDownloadDossier = async () => {
    if (!subscription || !subscription.plan?.document_access) {
      alert('L\'accès aux documents nécessite un abonnement Enterprise.')
      return
    }

    // TODO: Implémenter le téléchargement du dossier complet
    alert('Téléchargement du dossier complet...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du profil candidat...</p>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center max-w-md p-6">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Candidat non trouvé</h2>
          <p className="text-muted-foreground mb-6">
            Le profil candidat que vous recherchez n'existe pas ou n'est plus disponible.
          </p>
          <Button onClick={() => navigate('/company/search')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la recherche
          </Button>
        </div>
      </div>
    )
  }

  const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidat'
  const defaultAvatar = generateAvatarUrl(candidate.first_name, candidate.last_name)
  const displayPhoto = candidate.photo_url || defaultAvatar
  const canDownloadDossier = subscription?.plan?.document_access === true
  const location = [candidate.city, candidate.country].filter(Boolean).join(', ') || 'Non spécifié'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header avec photo */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/company/search')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la recherche
          </Button>
          
          <div className="flex items-start gap-6 mb-6">
            {/* Photo de profil */}
            <div className="flex-shrink-0">
              <img
                src={displayPhoto}
                alt={fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                onError={(e) => {
                  if (e.target.src !== defaultAvatar) {
                    e.target.src = defaultAvatar
                  }
                }}
              />
            </div>
            
            {/* Informations principales */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{fullName}</h1>
                {candidate.status === 'VALIDATED' && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
                {candidate.admin_score && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{candidate.admin_score.toFixed(1)}/5</span>
                  </div>
                )}
              </div>
              
              {candidate.profile_title && (
                <p className="text-lg text-muted-foreground mb-4">{candidate.profile_title}</p>
              )}
              
              {/* Informations de contact et localisation */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                  </div>
                )}
                {candidate.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{candidate.email}</span>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
                {candidate.total_experience !== undefined && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{candidate.total_experience} an{candidate.total_experience > 1 ? 's' : ''} d'expérience</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              {canDownloadDossier && (
                <Button onClick={handleDownloadDossier}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le dossier
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="expert">Avis Expert</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            {/* Résumé professionnel */}
            {candidate.professional_summary && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-3">Résumé professionnel</h3>
                <p className="text-foreground whitespace-pre-wrap">{candidate.professional_summary}</p>
              </Card>
            )}

            {/* Informations personnelles */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {candidate.date_of_birth && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4" />
                      Date de naissance
                    </label>
                    <p className="text-sm">{new Date(candidate.date_of_birth).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                {candidate.nationality && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1">
                      <Globe className="h-4 w-4" />
                      Nationalité
                    </label>
                    <p className="text-sm">{candidate.nationality}</p>
                  </div>
                )}
                {candidate.sector && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1">Secteur</label>
                    <p className="text-sm">{candidate.sector}</p>
                  </div>
                )}
                {candidate.main_job && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1">Métier principal</label>
                    <p className="text-sm">{candidate.main_job}</p>
                  </div>
                )}
                {candidate.address && (
                  <div className="col-span-2 md:col-span-3">
                    <label className="text-sm font-medium text-muted-foreground mb-1">Adresse</label>
                    <p className="text-sm">{candidate.address}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Expériences professionnelles */}
            {candidate.experiences && candidate.experiences.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Expériences professionnelles
                </h3>
                <div className="space-y-6">
                  {candidate.experiences.map((exp) => {
                    const defaultCompanyLogo = generateCompanyLogoUrl(exp.company_name)
                    const displayCompanyLogo = exp.company_logo_url || defaultCompanyLogo
                    
                    return (
                      <div key={exp.id} className="border-l-4 border-primary pl-4 pb-4 last:pb-0">
                        <div className="flex items-start gap-4">
                          <img
                            src={displayCompanyLogo}
                            alt={exp.company_name}
                            className="w-16 h-16 rounded-lg object-cover border-2 border-primary/20 flex-shrink-0"
                            onError={(e) => {
                              if (e.target.src !== defaultCompanyLogo) {
                                e.target.src = defaultCompanyLogo
                              }
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{exp.position}</h4>
                            <p className="text-muted-foreground font-medium">{exp.company_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                              {exp.end_date 
                                ? ` - ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                                : exp.is_current ? ' - Actuellement' : ''}
                            </p>
                            {exp.description && (
                              <div 
                                className="text-foreground mt-3 text-sm rich-text-content"
                                dangerouslySetInnerHTML={{ __html: exp.description }}
                              />
                            )}
                            {exp.achievements && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium mb-2">Réalisations majeures :</h5>
                                <div 
                                  className="text-foreground text-sm rich-text-content"
                                  dangerouslySetInnerHTML={{ __html: exp.achievements }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Formations */}
            {candidate.educations && candidate.educations.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Formations
                </h3>
                <div className="space-y-4">
                  {candidate.educations.map((edu) => (
                    <div key={edu.id} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold">{edu.diploma}</h4>
                      <p className="text-muted-foreground">{edu.institution}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {edu.start_year && `${edu.start_year} - `}{edu.graduation_year}
                        </p>
                        {edu.level && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Badge variant="outline">{edu.level}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Certifications */}
            {candidate.certifications && candidate.certifications.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.certifications.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{cert.title}</h4>
                      <p className="text-sm text-muted-foreground">{cert.issuer} • {cert.year}</p>
                      {cert.verification_url && (
                        <a 
                          href={cert.verification_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          Vérifier
                        </a>
                      )}
                      {cert.expiration_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Expire le: {new Date(cert.expiration_date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Compétences */}
            {candidate.skills && candidate.skills.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Compétences</h3>
                <div className="space-y-4">
                  {['TECHNICAL', 'SOFT', 'TOOL'].map((skillType) => {
                    const skillsOfType = candidate.skills.filter(s => s.skill_type === skillType)
                    if (skillsOfType.length === 0) return null
                    
                    return (
                      <div key={skillType}>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          {skillType === 'TECHNICAL' ? 'Compétences techniques' :
                           skillType === 'SOFT' ? 'Compétences comportementales' :
                           'Outils & Logiciels'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {skillsOfType.map((skill) => (
                            <Badge key={skill.id} variant={skillType === 'TECHNICAL' ? 'secondary' : 'outline'}>
                              {skill.name}
                              {skill.level && ` (${skill.level})`}
                              {skill.years_of_practice && ` - ${skill.years_of_practice} ans`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {/* Préférences de recherche d'emploi */}
            {candidate.job_preferences && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recherche d'emploi
                </h3>
                <div className="space-y-4">
                  {candidate.job_preferences.desired_positions && candidate.job_preferences.desired_positions.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Postes recherchés</label>
                      <div className="flex flex-wrap gap-2">
                        {candidate.job_preferences.desired_positions.map((pos, index) => (
                          <Badge key={index}>{pos}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {candidate.job_preferences.contract_type && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Type de contrat</label>
                        <p className="text-sm">{candidate.job_preferences.contract_type}</p>
                      </div>
                    )}
                    {candidate.job_preferences.desired_location && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Localisation souhaitée</label>
                        <p className="text-sm">{candidate.job_preferences.desired_location}</p>
                      </div>
                    )}
                    {candidate.job_preferences.availability && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Disponibilité</label>
                        <p className="text-sm">{candidate.job_preferences.availability}</p>
                      </div>
                    )}
                    {(candidate.job_preferences.salary_min || candidate.job_preferences.salary_max || candidate.job_preferences.salary_expectations) && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Prétentions salariales</label>
                        <p className="text-sm">
                          {candidate.job_preferences.salary_min && candidate.job_preferences.salary_max
                            ? `${(candidate.job_preferences.salary_min / 1000).toFixed(0)}k - ${(candidate.job_preferences.salary_max / 1000).toFixed(0)}k FCFA/mois`
                            : candidate.job_preferences.salary_expectations
                            ? `${(candidate.job_preferences.salary_expectations / 1000).toFixed(0)}k FCFA/mois`
                            : 'Non spécifié'}
                        </p>
                      </div>
                    )}
                    {candidate.job_preferences.mobility && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Mobilité</label>
                        <p className="text-sm">{candidate.job_preferences.mobility}</p>
                      </div>
                    )}
                    {candidate.job_preferences.target_sectors && candidate.job_preferences.target_sectors.length > 0 && (
                      <div className="col-span-2 md:col-span-3">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Secteurs ciblés</label>
                        <div className="flex flex-wrap gap-2">
                          {candidate.job_preferences.target_sectors.map((sector, index) => (
                            <Badge key={index} variant="outline">{sector}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expert" className="mt-6">
            <Card className="p-6">
              {candidate.admin_report ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Avis de l'Expert</h3>
                  
                  {candidate.admin_report.overall_score !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Note globale</p>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-6 w-6 ${
                              i < Math.round(candidate.admin_report.overall_score)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-semibold text-lg">
                          {candidate.admin_report.overall_score.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {candidate.admin_report.technical_skills_rating !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Compétences techniques</p>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < candidate.admin_report.technical_skills_rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-semibold">
                          {candidate.admin_report.technical_skills_rating}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {candidate.admin_report.soft_skills_rating !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Compétences comportementales</p>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < candidate.admin_report.soft_skills_rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-semibold">
                          {candidate.admin_report.soft_skills_rating}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {candidate.admin_report.communication_rating !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Communication</p>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < candidate.admin_report.communication_rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-semibold">
                          {candidate.admin_report.communication_rating}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {candidate.admin_report.motivation_rating !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Motivation</p>
                      <div className="flex items-center gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < candidate.admin_report.motivation_rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 font-semibold">
                          {candidate.admin_report.motivation_rating}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {candidate.admin_report.soft_skills_tags && candidate.admin_report.soft_skills_tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tags de compétences comportementales</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.admin_report.soft_skills_tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.admin_report.summary && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Résumé de l'évaluation</p>
                      <p className="text-foreground whitespace-pre-wrap">{candidate.admin_report.summary}</p>
                    </div>
                  )}

                  {candidate.admin_report.interview_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Notes d'entretien</p>
                      <p className="text-foreground whitespace-pre-wrap">{candidate.admin_report.interview_notes}</p>
                    </div>
                  )}

                  {candidate.admin_report.recommendations && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Recommandations</p>
                      <p className="text-foreground whitespace-pre-wrap">{candidate.admin_report.recommendations}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun avis expert disponible</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            {documents.length > 0 ? (
              <>
                {subscription?.plan?.plan_type === 'FREEMIUM' ? (
                  <BlurredDocuments documents={documents} subscription={subscription} />
                ) : (
                  <Card className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Documents justificatifs</h3>
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.document_type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const { url } = await documentApi.getDocumentViewUrl(doc.id)
                                  window.open(url, '_blank')
                                } catch (error) {
                                  console.error('Error viewing document:', error)
                                }
                              }}
                            >
                              Voir
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-6">
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun document disponible</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
