import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Download, FileText, User, Briefcase, MapPin, Star, CheckCircle2, 
  Mail, Phone, Calendar, Globe, Award, GraduationCap, Target, TrendingUp, Sparkles
} from 'lucide-react'
import { candidateApi, paymentApiService, auditApiService, documentApi, authApiService, searchApiService } from '../services/api'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardContent } from '../components/ui/card'
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

// Fonction pour calculer le score global moyen
const calculateAverageScore = (adminReport) => {
  if (!adminReport) return null
  
  const scores = []
  if (adminReport.overall_score !== undefined) scores.push(adminReport.overall_score)
  if (adminReport.technical_skills_rating !== undefined) scores.push(adminReport.technical_skills_rating)
  if (adminReport.soft_skills_rating !== undefined) scores.push(adminReport.soft_skills_rating)
  if (adminReport.communication_rating !== undefined) scores.push(adminReport.communication_rating)
  if (adminReport.motivation_rating !== undefined) scores.push(adminReport.motivation_rating)
  
  if (scores.length === 0) return null
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
  return average.toFixed(1)
}

// Fonction pour obtenir la couleur du badge selon le score
const getScoreBadgeColor = (score) => {
  if (score >= 4.5) return 'bg-green-emerald text-white'
  if (score >= 3.5) return 'bg-primary text-white'
  if (score >= 2.5) return 'bg-yellow-500 text-white'
  return 'bg-orange-500 text-white'
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
    // Valider que candidateId est un nombre valide (déclaré avant try-catch)
    const candidateIdNum = parseInt(candidateId, 10)
    if (isNaN(candidateIdNum) || candidateIdNum <= 0) {
      console.error('Invalid candidate ID:', candidateId)
      setCandidate(null)
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      
      console.log('Loading candidate profile for ID:', candidateIdNum)
      
      // Utiliser l'endpoint du service search qui permet aux recruteurs d'accéder aux profils
      // Cet endpoint gère automatiquement les quotas et les logs d'accès
      const data = await searchApiService.getCandidateProfile(candidateIdNum)
      console.log('Candidate profile loaded:', data)
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
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        candidateId: candidateIdNum,
      })
      
      // Si l'erreur est 404, le candidat n'existe pas
      if (error.response?.status === 404) {
        console.warn(`Candidate ${candidateIdNum} not found (404)`)
        setCandidate(null)
      } else if (error.response?.status === 403) {
        console.warn(`Access forbidden for candidate ${candidateIdNum} (403)`)
        setCandidate(null)
      } else {
        // Pour les autres erreurs, on affiche aussi la page "non trouvé"
        // pour éviter une page d'erreur confuse pour l'utilisateur
        console.warn(`Failed to load candidate ${candidateIdNum}:`, error.response?.status || error.message)
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
  const averageScore = calculateAverageScore(candidate.admin_report)
  const overallScore = candidate.admin_report?.overall_score

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-green-emerald to-green-emerald/90 text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/company/search')} 
            className="mb-6 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la recherche
          </Button>
          
          {/* Profil Header avec photo et infos */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Photo de profil avec badge de score */}
            <div className="flex-shrink-0 relative">
              <div className="relative">
                <img
                  src={displayPhoto}
                  alt={fullName}
                  className="w-40 h-40 rounded-full object-cover border-4 border-white/30 shadow-xl"
                  onError={(e) => {
                    if (e.target.src !== defaultAvatar) {
                      e.target.src = defaultAvatar
                    }
                  }}
                />
                {candidate.status === 'VALIDATED' && (
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-lg z-10">
                    <CheckCircle2 className="h-5 w-5 text-green-emerald" />
                  </div>
                )}
                
                {/* Badge de score en overlay sur la photo (comme LinkedIn) */}
                {(overallScore || averageScore) && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white rounded-full px-3 py-1.5 shadow-xl flex items-center gap-1.5 border-2 border-white z-10">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-sm font-bold whitespace-nowrap">
                      {(overallScore || averageScore)}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Informations principales */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-4xl font-bold font-heading text-white">{fullName}</h1>
              </div>
              
              {candidate.profile_title && (
                <p className="text-xl text-white/90 mb-6 font-medium">{candidate.profile_title}</p>
              )}
              
              {/* Informations de contact en grille */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {location && (
                  <div className="flex items-center gap-2 text-white/80">
                    <MapPin className="h-5 w-5 flex-shrink-0" />
                    <span>{location}</span>
                  </div>
                )}
                {candidate.total_experience !== undefined && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Briefcase className="h-5 w-5 flex-shrink-0" />
                    <span>{candidate.total_experience} an{candidate.total_experience > 1 ? 's' : ''} d'expérience</span>
                  </div>
                )}
                {candidate.job_preferences?.availability && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Calendar className="h-5 w-5 flex-shrink-0" />
                    <span>Disponibilité: {candidate.job_preferences.availability}</span>
                  </div>
                )}
                {candidate.job_preferences?.mobility && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Globe className="h-5 w-5 flex-shrink-0" />
                    <span>Mobilité: {candidate.job_preferences.mobility}</span>
                  </div>
                )}
                {candidate.email && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Mail className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{candidate.email}</span>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Phone className="h-5 w-5 flex-shrink-0" />
                    <span>{candidate.phone}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {canDownloadDossier && (
                <Button 
                  onClick={handleDownloadDossier}
                  className="bg-white text-green-emerald hover:bg-white/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le dossier
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Avis Expert en avant - Card mise en évidence */}
        {candidate.admin_report && (
          <Card className="mb-8 border-l-4 border-l-green-emerald shadow-lg bg-gradient-to-r from-white to-green-emerald/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-emerald/10 rounded-lg">
                  <Sparkles className="h-6 w-6 text-green-emerald" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-anthracite font-heading">Avis de l'Expert</h2>
                  <p className="text-sm text-muted-foreground">Évaluation professionnelle du profil</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {candidate.admin_report.overall_score !== undefined && (
                  <div className="bg-gradient-to-br from-green-emerald/10 to-green-emerald/5 rounded-lg p-4 border border-green-emerald/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Note globale</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(candidate.admin_report.overall_score)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-bold text-xl text-gray-anthracite">
                        {candidate.admin_report.overall_score.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                )}
                
                {candidate.admin_report.technical_skills_rating !== undefined && (
                  <div className="bg-blue-deep/5 rounded-lg p-4 border border-blue-deep/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Compétences techniques</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
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
                      </div>
                      <span className="ml-2 font-bold text-lg text-gray-anthracite">
                        {candidate.admin_report.technical_skills_rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {candidate.admin_report.soft_skills_rating !== undefined && (
                  <div className="bg-blue-deep/5 rounded-lg p-4 border border-blue-deep/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Compétences comportementales</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
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
                      </div>
                      <span className="ml-2 font-bold text-lg text-gray-anthracite">
                        {candidate.admin_report.soft_skills_rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {candidate.admin_report.communication_rating !== undefined && (
                  <div className="bg-blue-deep/5 rounded-lg p-4 border border-blue-deep/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Communication</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
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
                      </div>
                      <span className="ml-2 font-bold text-lg text-gray-anthracite">
                        {candidate.admin_report.communication_rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {candidate.admin_report.motivation_rating !== undefined && (
                  <div className="bg-blue-deep/5 rounded-lg p-4 border border-blue-deep/20">
                    <p className="text-sm text-muted-foreground mb-2 font-medium">Motivation</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
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
                      </div>
                      <span className="ml-2 font-bold text-lg text-gray-anthracite">
                        {candidate.admin_report.motivation_rating}/5
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {candidate.admin_report.soft_skills_tags && candidate.admin_report.soft_skills_tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Tags de compétences comportementales</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.admin_report.soft_skills_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-emerald/10 text-green-emerald border-green-emerald/20">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {candidate.admin_report.summary && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-anthracite mb-2">Résumé de l'évaluation</p>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{candidate.admin_report.summary}</p>
                </div>
              )}

              {(candidate.admin_report.interview_notes || candidate.admin_report.recommendations) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                  {candidate.admin_report.interview_notes && (
                    <div>
                      <p className="text-sm font-semibold text-gray-anthracite mb-2">Notes d'entretien</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{candidate.admin_report.interview_notes}</p>
                    </div>
                  )}
                  {candidate.admin_report.recommendations && (
                    <div>
                      <p className="text-sm font-semibold text-gray-anthracite mb-2">Recommandations</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{candidate.admin_report.recommendations}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs pour le reste du contenu */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-white mb-6">
            <TabsTrigger value="profile" className="data-[state=active]:bg-green-emerald data-[state=active]:text-white">
              Profil complet
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-green-emerald data-[state=active]:text-white">
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            {/* Résumé professionnel */}
            {candidate.professional_summary && (
              <Card className="p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-gray-anthracite font-heading">Résumé professionnel</h3>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{candidate.professional_summary}</p>
              </Card>
            )}

            {/* Informations personnelles */}
            <Card className="p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-anthracite font-heading">Informations personnelles</h3>
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
              <Card className="p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-anthracite font-heading">
                  <Briefcase className="h-6 w-6 text-green-emerald" />
                  Expériences professionnelles
                </h3>
                <div className="space-y-6">
                  {candidate.experiences.map((exp) => {
                    const defaultCompanyLogo = generateCompanyLogoUrl(exp.company_name)
                    const displayCompanyLogo = exp.company_logo_url || defaultCompanyLogo
                    
                    return (
                      <div key={exp.id} className="border-l-4 border-l-green-emerald pl-6 pb-6 last:pb-0 relative">
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-green-emerald rounded-full border-2 border-white"></div>
                        <div className="flex items-start gap-4">
                          <img
                            src={displayCompanyLogo}
                            alt={exp.company_name}
                            className="w-16 h-16 rounded-lg object-cover border-2 border-primary/20 flex-shrink-0 shadow-sm"
                            onError={(e) => {
                              if (e.target.src !== defaultCompanyLogo) {
                                e.target.src = defaultCompanyLogo
                              }
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-anthracite mb-1">{exp.position}</h4>
                            <p className="text-muted-foreground font-medium mb-2">{exp.company_name}</p>
                            <p className="text-sm text-muted-foreground mb-3">
                              {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                              {exp.end_date 
                                ? ` - ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                                : exp.is_current ? ' - Actuellement' : ''}
                            </p>
                            {exp.description && (
                              <div 
                                className="text-foreground mt-3 text-sm rich-text-content leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: exp.description }}
                              />
                            )}
                            {exp.achievements && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <h5 className="text-sm font-semibold mb-2 text-gray-anthracite">Réalisations majeures :</h5>
                                <div 
                                  className="text-foreground text-sm rich-text-content leading-relaxed"
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
              <Card className="p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-anthracite font-heading">
                  <GraduationCap className="h-6 w-6 text-blue-deep" />
                  Formations
                </h3>
                <div className="space-y-4">
                  {candidate.educations.map((edu) => (
                    <div key={edu.id} className="border-l-4 border-l-blue-deep pl-4 py-2">
                      <h4 className="font-semibold text-gray-anthracite">{edu.diploma}</h4>
                      <p className="text-muted-foreground">{edu.institution}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {edu.start_year && `${edu.start_year} - `}{edu.graduation_year}
                        </p>
                        {edu.level && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Badge variant="outline" className="border-blue-deep text-blue-deep">{edu.level}</Badge>
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
              <Card className="p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-anthracite font-heading">
                  <Award className="h-6 w-6 text-gold-soft" />
                  Certifications
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.certifications.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <h4 className="font-semibold text-gray-anthracite mb-1">{cert.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{cert.issuer} • {cert.year}</p>
                      {cert.verification_url && (
                        <a 
                          href={cert.verification_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-green-emerald hover:underline mt-2 inline-block font-medium"
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
              <Card className="p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 text-gray-anthracite font-heading">Compétences</h3>
                <div className="space-y-6">
                  {['TECHNICAL', 'SOFT', 'TOOL'].map((skillType) => {
                    const skillsOfType = candidate.skills.filter(s => s.skill_type === skillType)
                    if (skillsOfType.length === 0) return null
                    
                    return (
                      <div key={skillType}>
                        <label className="text-sm font-semibold text-gray-anthracite mb-3 block">
                          {skillType === 'TECHNICAL' ? 'Compétences techniques' :
                           skillType === 'SOFT' ? 'Compétences comportementales' :
                           'Outils & Logiciels'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {skillsOfType.map((skill) => (
                            <Badge 
                              key={skill.id} 
                              variant={skillType === 'TECHNICAL' ? 'secondary' : 'outline'}
                              className={skillType === 'TECHNICAL' ? 'bg-blue-deep/10 text-blue-deep border-blue-deep/20' : ''}
                            >
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
              <Card className="p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-anthracite font-heading">
                  <Target className="h-6 w-6 text-green-emerald" />
                  Recherche d'emploi
                </h3>
                <div className="space-y-6">
                  {candidate.job_preferences.desired_positions && candidate.job_preferences.desired_positions.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-gray-anthracite mb-3 block">Postes recherchés</label>
                      <div className="flex flex-wrap gap-2">
                        {candidate.job_preferences.desired_positions.map((pos, index) => (
                          <Badge key={index} className="bg-green-emerald/10 text-green-emerald border-green-emerald/20">{pos}</Badge>
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
                        <label className="text-sm font-semibold text-gray-anthracite mb-3 block">Secteurs ciblés</label>
                        <div className="flex flex-wrap gap-2">
                          {candidate.job_preferences.target_sectors.map((sector, index) => (
                            <Badge key={index} variant="outline" className="border-blue-deep text-blue-deep">{sector}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            {documents.length > 0 ? (
              <>
                {subscription?.plan?.plan_type === 'FREEMIUM' ? (
                  <BlurredDocuments documents={documents} subscription={subscription} />
                ) : (
                  <Card className="p-6 shadow-sm">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-anthracite font-heading">Documents justificatifs</h3>
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-gray-anthracite">{doc.document_type}</p>
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
              <Card className="p-6 shadow-sm">
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
