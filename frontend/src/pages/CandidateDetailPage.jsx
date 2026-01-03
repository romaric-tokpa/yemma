import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText, User, Briefcase, MapPin, Star, CheckCircle2 } from 'lucide-react'
import { candidateApi, paymentApiService, auditApiService, documentApi, authApiService } from '../services/api'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { BlurredDocuments } from '../components/search/BlurredDocuments'

export function CandidateDetailPage() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [quotaAllowed, setQuotaAllowed] = useState(false)
  const [companyId, setCompanyId] = useState(null) // À récupérer depuis le contexte/auth

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
      // Le backend retourne maintenant les relations dans la réponse
      const data = await candidateApi.getProfile(candidateId)
      setCandidate(data)
      
      // Si les relations ne sont pas incluses, les charger séparément
      if (data.id && (!data.experiences || !data.educations)) {
        try {
          const [exps, edus, certs, skls] = await Promise.all([
            candidateApi.getExperiences(data.id).catch(() => []),
            candidateApi.getEducations(data.id).catch(() => []),
            candidateApi.getCertifications(data.id).catch(() => []),
            candidateApi.getSkills(data.id).catch(() => []),
          ])
          
          setCandidate(prev => ({
            ...prev,
            experiences: exps || [],
            educations: edus || [],
            certifications: certs || [],
            skills: skls || [],
          }))
        } catch (error) {
          console.error('Error loading relations:', error)
        }
      }
    } catch (error) {
      console.error('Error loading candidate:', error)
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
      
      // Vérifier le quota
      const quota = await paymentApiService.checkQuota(currentCompanyId)
      setQuotaAllowed(quota.allowed)
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  const handleViewProfile = async () => {
    if (!companyId) return

    // Vérifier le quota
    const quota = await paymentApiService.checkQuota(companyId)
    
    if (!quota.allowed) {
      alert('Votre quota de consultations est épuisé. Veuillez mettre à jour votre abonnement.')
      return
    }

    // Utiliser le quota
    try {
      await paymentApiService.useQuota(companyId)
      
      // Enregistrer l'accès dans l'audit
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Candidat non trouvé</p>
          <Button onClick={() => navigate('/search')}>Retour à la recherche</Button>
        </div>
      </div>
    )
  }

  const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidat'
  const canDownloadDossier = subscription?.plan?.document_access === true

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/search')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la recherche
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{fullName}</h1>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Vérifié
                </Badge>
                {candidate.admin_score && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="font-semibold">{candidate.admin_score.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {candidate.profile_title && (
                <p className="text-lg text-gray-600">{candidate.profile_title}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              {canDownloadDossier && (
                <Button onClick={handleDownloadDossier}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le dossier complet
                </Button>
              )}
              <Button onClick={handleViewProfile} disabled={!quotaAllowed}>
                Voir le profil complet
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="expert">Avis de l'Expert</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="p-6">
              <div className="space-y-6">
                {candidate.professional_summary && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Résumé professionnel</h3>
                    <p className="text-gray-700">{candidate.professional_summary}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {candidate.sector && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Secteur</p>
                        <p className="font-medium">{candidate.sector}</p>
                      </div>
                    </div>
                  )}
                  
                  {candidate.main_job && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Métier</p>
                        <p className="font-medium">{candidate.main_job}</p>
                      </div>
                    </div>
                  )}

                  {candidate.total_experience !== undefined && (
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Expérience</p>
                        <p className="font-medium">
                          {candidate.total_experience} an{candidate.total_experience > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expériences */}
                {candidate.experiences && candidate.experiences.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Expériences professionnelles</h3>
                    <div className="space-y-3">
                      {candidate.experiences.map((exp) => (
                        <div key={exp.id} className="border-l-2 border-primary pl-4">
                          <h4 className="font-semibold">{exp.position}</h4>
                          <p className="text-gray-600">{exp.company_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            {exp.end_date 
                              ? ` - ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                              : exp.is_current ? ' - Actuellement' : ''}
                          </p>
                          {exp.description && (
                            <p className="text-gray-700 mt-2 text-sm">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formations */}
                {candidate.educations && candidate.educations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Formations</h3>
                    <div className="space-y-3">
                      {candidate.educations.map((edu) => (
                        <div key={edu.id} className="border-l-2 border-blue-500 pl-4">
                          <h4 className="font-semibold">{edu.diploma}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                          <p className="text-sm text-gray-500">
                            {edu.start_year && `${edu.start_year} - `}{edu.graduation_year}
                            {edu.level && ` • ${edu.level}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compétences */}
                {candidate.skills && candidate.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Compétences</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary">
                          {typeof skill === 'object' ? skill.name : skill}
                          {typeof skill === 'object' && skill.level && (
                            <span className="ml-1 text-xs">({skill.level})</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="expert" className="mt-6">
            <Card className="p-6">
              {candidate.admin_report ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Avis de l'Expert</h3>
                  <div className="prose max-w-none">
                    {candidate.admin_report.overall_rating && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Note globale</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < candidate.admin_report.overall_rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 font-semibold">
                            {candidate.admin_report.overall_rating}/5
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {candidate.admin_report.technical_skills_rating && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Compétences techniques</p>
                        <div className="flex items-center gap-1">
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

                    {candidate.admin_report.interview_notes && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Notes d'entretien</p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {candidate.admin_report.interview_notes}
                        </p>
                      </div>
                    )}

                    {candidate.admin_report.recommendations && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Recommandations</p>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {candidate.admin_report.recommendations}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun avis expert disponible</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            {documents.length > 0 ? (
              <>
                {/* Afficher les documents floutés si Freemium */}
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
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium">{doc.document_type}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(doc.uploaded_at).toLocaleDateString()}
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
                <div className="text-center text-gray-500 py-8">
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

