import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Download, FileText, MapPin, Star, CheckCircle2, 
  Mail, Phone, Calendar, Briefcase, GraduationCap, Award, Target,
  RefreshCw, Sparkles, Code, Users, Wrench, Eye
} from 'lucide-react'
import { paymentApiService, documentApi, authApiService, searchApiService } from '../services/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { BlurredDocuments } from '../components/search/BlurredDocuments'

const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
}

const generateCompanyLogoUrl = (companyName) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName || 'Co')}&size=80&background=e8f4f3&color=226D68&bold=true`
}

const getScoreColor = (score) => {
  if (score >= 4.5) return 'bg-[#226D68]'
  if (score >= 3.5) return 'bg-[#226D68]/80'
  if (score >= 2.5) return 'bg-[#e76f51]/80'
  return 'bg-[#e76f51]'
}

const formatSkillLevel = (level) => {
  const map = { BEGINNER: 'Déb.', INTERMEDIATE: 'Int.', ADVANCED: 'Avancé', EXPERT: 'Exp.' }
  return map[level] || level
}

const formatAvailability = (v) => {
  const map = { immediate: 'Immédiate', '1_week': 'Sous 1 semaine', '2_weeks': 'Sous 2 semaines', '1_month': 'Sous 1 mois', '2_months': 'Sous 2 mois', '3_months': 'Sous 3 mois', negotiable: 'À négocier' }
  return map[v] || v
}

const formatRemotePreference = (v) => {
  const map = { onsite: 'Sur site uniquement', hybrid: 'Hybride', remote: 'Télétravail complet', flexible: 'Flexible' }
  return map[v] || v
}

const hasJobPreferences = (jp) => {
  if (!jp) return false
  return (jp.desired_positions?.length > 0) || jp.contract_type || (jp.contract_types?.length > 0) ||
    (jp.target_sectors?.length > 0) || jp.desired_location || jp.preferred_locations || jp.mobility ||
    jp.remote_preference || jp.willing_to_relocate || jp.availability ||
    (jp.salary_min != null) || (jp.salary_max != null) || (jp.salary_expectations != null)
}

export default function CandidateDetailPage() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [companyId, setCompanyId] = useState(null)
  const [userRoles, setUserRoles] = useState([])
  const [photoError, setPhotoError] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)

  const isAdmin = userRoles.includes('ROLE_ADMIN') || userRoles.includes('ROLE_SUPER_ADMIN')
  const searchBackUrl = isAdmin ? '/admin/cvtheque' : '/company/dashboard?tab=search'

  useEffect(() => {
    loadUserAndCompany()
    loadCandidate()
    loadDocuments()
  }, [candidateId])

  useEffect(() => {
    if (candidate?.photo_url) {
      let url = candidate.photo_url
      if (url?.startsWith('/')) {
        const match = url.match(/\/api\/v1\/documents\/serve\/(\d+)/)
        if (match) url = documentApi.getDocumentServeUrl(parseInt(match[1]))
      }
      if (url && !url.includes('ui-avatars.com') && url.trim()) {
        setPhotoUrl(url)
        setPhotoError(false)
      } else setPhotoUrl(null)
    } else setPhotoUrl(null)
  }, [candidate?.photo_url])

  const loadUserAndCompany = async () => {
    try {
      const user = await authApiService.getCurrentUser()
      setUserRoles(user.roles || [])
      if (user.company_id) {
        setCompanyId(user.company_id)
        const sub = await paymentApiService.getSubscription(user.company_id)
        setSubscription(sub)
      }
    } catch (e) { console.error(e) }
  }

  const loadCandidate = async () => {
    const id = parseInt(candidateId, 10)
    if (isNaN(id) || id <= 0) {
      setCandidate(null)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await searchApiService.getCandidateProfile(id)
      setCandidate(data)
    } catch (e) {
      if (e.response?.status === 404 || e.response?.status === 403) setCandidate(null)
      else setCandidate(null)
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    try {
      const data = await documentApi.getCandidateDocuments(candidateId)
      const active = (data || []).filter(d => !d.deleted_at && d.document_type !== 'PROFILE_PHOTO' && d.document_type !== 'COMPANY_LOGO')
      setDocuments(active)
    } catch (e) {
      setDocuments([])
    }
  }

  const handleDownloadDossier = () => {
    if (!subscription?.plan?.document_access) {
      alert('L\'accès aux documents nécessite un abonnement Enterprise.')
      return
    }
    alert('Téléchargement du dossier complet...')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#226D68] border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-[#2C2C2C]/70">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-3 text-[#9ca3af]" />
          <h2 className="text-lg font-semibold text-[#2C2C2C] mb-2">Candidat non trouvé</h2>
          <p className="text-sm text-[#2C2C2C]/70 mb-4">Ce profil n'existe pas ou n'est plus disponible.</p>
          <Button onClick={() => navigate(searchBackUrl)} className="bg-[#226D68] hover:bg-[#1a5a55]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la CVthèque
          </Button>
        </Card>
      </div>
    )
  }

  const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidat'
  const defaultAvatar = generateAvatarUrl(candidate.first_name, candidate.last_name)
  const displayPhoto = (photoUrl && !photoError && !photoUrl.includes('ui-avatars.com')) ? photoUrl : defaultAvatar
  const canDownloadDossier = subscription?.plan?.document_access === true
  const location = [candidate.city, candidate.country].filter(Boolean).join(', ') || null
  const report = candidate.admin_report || {}
  const overallScore = report.overall_score
  const hasReport = report && Object.keys(report).length > 0

  const scoreItems = [
    { key: 'technical_skills_rating', label: 'Techniques' },
    { key: 'soft_skills_rating', label: 'Soft skills' },
    { key: 'communication_rating', label: 'Communication' },
    { key: 'motivation_rating', label: 'Motivation' },
  ].filter(i => report[i.key] !== undefined)

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Barre top compacte */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#e5e7eb] px-4 py-2.5 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(searchBackUrl)} className="text-[#2C2C2C] hover:bg-[#F4F6F8] -ml-1">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Retour</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { loadCandidate(); loadDocuments(); }} disabled={loading} className="text-[#2C2C2C] hover:bg-[#F4F6F8]">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {/* Header profil compact */}
        <Card className="overflow-hidden border border-[#e5e7eb] shadow-sm mb-4">
          <div className="bg-gradient-to-r from-[#226D68] to-[#1a5a55] px-4 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src={displayPhoto}
                  alt={fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/40 shadow-lg"
                  onError={(e) => {
                    if (!photoError) { setPhotoError(true); e.target.src = defaultAvatar }
                    else e.target.src = defaultAvatar
                  }}
                />
                {candidate.status === 'VALIDATED' && (
                  <div className="absolute -top-0.5 -right-0.5 bg-white rounded-full p-1 shadow">
                    <CheckCircle2 className="h-4 w-4 text-[#226D68]" />
                  </div>
                )}
                {overallScore && (
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${getScoreColor(overallScore)} text-white rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1 border-2 border-white shadow`}>
                    <Star className="h-3 w-3 fill-current" />
                    {overallScore.toFixed(1)}/5
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left text-white min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{fullName}</h1>
                {candidate.profile_title && <p className="text-white/90 text-sm sm:text-base mt-0.5">{candidate.profile_title}</p>}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-3 text-sm text-white/85">
                  {location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>}
                  {candidate.total_experience != null && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{candidate.total_experience} an{candidate.total_experience > 1 ? 's' : ''} d'exp.</span>}
                  {candidate.job_preferences?.availability && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{candidate.job_preferences.availability}</span>}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  {candidate.email && (
                    <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-xs">
                      <Mail className="h-3.5 w-3.5" />{candidate.email}
                    </a>
                  )}
                  {candidate.phone && (
                    <a href={`tel:${candidate.phone}`} className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-xs">
                      <Phone className="h-3.5 w-3.5" />{candidate.phone}
                    </a>
                  )}
                </div>
                {canDownloadDossier && (
                  <Button size="sm" onClick={handleDownloadDossier} className="mt-3 bg-white text-[#226D68] hover:bg-white/90 h-8 text-xs">
                    <Download className="h-3.5 w-3.5 mr-1.5" />Télécharger le dossier
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-4">
            {/* Avis Expert compact */}
            {hasReport && (
              <Card className="border border-[#e5e7eb] border-l-4 border-l-[#226D68] overflow-hidden">
                <CardHeader className="py-3 px-4 bg-[#E8F4F3]/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#226D68]" />
                    <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Avis de l'expert</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {overallScore !== undefined && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#226D68]/10 border border-[#226D68]/20">
                        <Star className="h-3.5 w-3.5 text-[#226D68] fill-current" />
                        <span className="text-xs font-semibold text-[#2C2C2C]">Globale: {overallScore.toFixed(1)}/5</span>
                      </div>
                    )}
                    {scoreItems.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1 px-2 py-1 rounded bg-[#F4F6F8] text-xs">
                        <span className="text-[#9ca3af]">{label}:</span>
                        <span className="font-medium text-[#2C2C2C]">{report[key]}/5</span>
                      </div>
                    ))}
                  </div>
                  {report.soft_skills_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {report.soft_skills_tags.map((tag, i) => (
                        <Badge key={i} className="text-[10px] h-5 px-1.5 bg-[#E8F4F3] text-[#226D68] border-0">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  {report.summary && <p className="text-sm text-[#2C2C2C] leading-relaxed mb-0">{report.summary}</p>}
                  {(report.interview_notes || report.recommendations) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#e5e7eb]">
                      {report.interview_notes && <div><p className="text-[10px] font-semibold text-[#9ca3af] uppercase mb-1">Notes d'entretien</p><p className="text-xs text-[#2C2C2C] whitespace-pre-wrap">{report.interview_notes}</p></div>}
                      {report.recommendations && <div><p className="text-[10px] font-semibold text-[#9ca3af] uppercase mb-1">Recommandations</p><p className="text-xs text-[#2C2C2C] whitespace-pre-wrap">{report.recommendations}</p></div>}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Résumé */}
            {candidate.professional_summary && (
              <Card className="border border-[#e5e7eb] overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-[#F4F6F8]/50">
                  <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Résumé professionnel</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm text-[#2C2C2C] leading-relaxed whitespace-pre-wrap">{candidate.professional_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Expériences */}
            {candidate.experiences?.length > 0 && (
              <Card className="border border-[#e5e7eb] overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-[#F4F6F8]/50 flex flex-row items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#226D68]" />
                  <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Expériences</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-4">
                    {candidate.experiences.map((exp) => {
                      const logo = exp.company_logo_url || generateCompanyLogoUrl(exp.company_name)
                      return (
                        <div key={exp.id} className="flex gap-3 border-l-2 border-[#226D68]/40 pl-3">
                          <img src={logo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#e5e7eb]" onError={(e) => e.target.src = generateCompanyLogoUrl('')} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-[#2C2C2C]">{exp.position}</p>
                            <p className="text-xs text-[#9ca3af]">{exp.company_name}</p>
                            <p className="text-[10px] text-[#9ca3af] mt-0.5">
                              {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                              {exp.end_date ? ` – ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}` : exp.is_current ? ' – En poste' : ''}
                            </p>
                            {exp.description && <div className="text-xs text-[#2C2C2C] mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.description }} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formations */}
            {candidate.educations?.length > 0 && (
              <Card className="border border-[#e5e7eb] overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-[#F4F6F8]/50 flex flex-row items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[#226D68]" />
                  <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Formations</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2">
                    {candidate.educations.map((edu) => (
                      <div key={edu.id} className="border-l-2 border-[#226D68]/30 pl-2.5 py-1">
                        <p className="font-medium text-sm text-[#2C2C2C]">{edu.diploma}</p>
                        <p className="text-xs text-[#9ca3af]">{edu.institution} {edu.graduation_year && `• ${edu.graduation_year}`}</p>
                        {edu.level && <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1 border-[#226D68]/30 text-[#226D68]">{edu.level}</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-4">
            {/* Compétences */}
            {candidate.skills?.length > 0 && (
              <Card className="border border-[#e5e7eb] overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-[#F4F6F8]/50">
                  <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Compétences</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {(() => {
                    const technical = candidate.skills.filter(s => s.skill_type === 'TECHNICAL')
                    const soft = candidate.skills.filter(s => s.skill_type === 'SOFT')
                    const tool = candidate.skills.filter(s => s.skill_type === 'TOOL')
                    const SkillList = ({ items, icon: Icon, color }) => (
                      items.length > 0 && (
                        <div className="mb-3 last:mb-0">
                          <p className="text-[10px] font-semibold text-[#9ca3af] uppercase mb-1.5 flex items-center gap-1"><Icon className="h-3 w-3" />{items.length}</p>
                          <div className="flex flex-wrap gap-1">
                            {items.map((s) => (
                              <Badge key={s.id} className={`text-[10px] h-5 px-1.5 ${color}`}>
                                {s.name}{s.level && ` • ${formatSkillLevel(s.level)}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    )
                    return (
                      <div>
                        <SkillList items={technical} icon={Code} color="bg-[#E8F4F3] text-[#226D68] border-0" />
                        <SkillList items={soft} icon={Users} color="bg-[#FDF2F0] text-[#e76f51] border-0" />
                        <SkillList items={tool} icon={Wrench} color="bg-[#F4F6F8] text-[#2C2C2C] border border-[#e5e7eb]" />
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Préférences emploi - toutes les infos */}
            {hasJobPreferences(candidate.job_preferences) && (
              <Card className="border border-[#e5e7eb] overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-[#F4F6F8]/50 flex flex-row items-center gap-2">
                  <Target className="h-4 w-4 text-[#226D68]" />
                  <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Recherche d'emploi</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  {candidate.job_preferences.desired_positions?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase mb-1">Poste(s) recherché(s)</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.job_preferences.desired_positions.map((pos, i) => (
                          <Badge key={i} className="text-[10px] h-5 bg-[#E8F4F3] text-[#226D68] border-0">{pos}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(candidate.job_preferences.contract_types?.length > 0 || candidate.job_preferences.contract_type) && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase mb-1">Type(s) de contrat</p>
                      <div className="flex flex-wrap gap-1">
                        {(candidate.job_preferences.contract_types?.length > 0 ? candidate.job_preferences.contract_types : [candidate.job_preferences.contract_type]).map((t, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] h-5 border-[#226D68]/30 text-[#226D68]">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {candidate.job_preferences.target_sectors?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#9ca3af] uppercase mb-1">Secteurs ciblés</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.job_preferences.target_sectors.map((s, i) => (
                          <Badge key={i} className="text-[10px] h-5 bg-[#FDF2F0] text-[#e76f51] border-0">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1 text-xs">
                    {candidate.job_preferences.desired_location && <p><span className="text-[#9ca3af]">Lieu souhaité:</span> {candidate.job_preferences.desired_location}</p>}
                    {candidate.job_preferences.preferred_locations && (
                      <p><span className="text-[#9ca3af]">Zones préférées:</span> {candidate.job_preferences.preferred_locations}</p>
                    )}
                    {candidate.job_preferences.mobility && <p><span className="text-[#9ca3af]">Mobilité:</span> {candidate.job_preferences.mobility}</p>}
                    {candidate.job_preferences.remote_preference && (
                      <p><span className="text-[#9ca3af]">Télétravail:</span> {formatRemotePreference(candidate.job_preferences.remote_preference)}</p>
                    )}
                    {candidate.job_preferences.willing_to_relocate != null && (
                      <p><span className="text-[#9ca3af]">Prêt à déménager:</span> {candidate.job_preferences.willing_to_relocate ? 'Oui' : 'Non'}</p>
                    )}
                    {candidate.job_preferences.availability && (
                      <p><span className="text-[#9ca3af]">Disponibilité:</span> {formatAvailability(candidate.job_preferences.availability)}</p>
                    )}
                    {(() => {
                      const sm = candidate.job_preferences.salary_min
                      const sx = candidate.job_preferences.salary_max
                      const hasMin = sm != null && sm > 0
                      const hasMax = sx != null && sx > 0
                      if (!hasMin && !hasMax) return null
                      let label = ''
                      if (hasMin && hasMax) label = `${(sm / 1000).toFixed(0)}k – ${(sx / 1000).toFixed(0)}k`
                      else if (hasMin) label = `À partir de ${(sm / 1000).toFixed(0)}k`
                      else label = `Jusqu'à ${(sx / 1000).toFixed(0)}k`
                      return <p><span className="text-[#9ca3af]">Salaire:</span> {label} FCFA/mois</p>
                    })()}
                    {candidate.job_preferences.salary_expectations != null && candidate.job_preferences.salary_expectations > 0 && (candidate.job_preferences.salary_min == null || candidate.job_preferences.salary_min === 0) && (candidate.job_preferences.salary_max == null || candidate.job_preferences.salary_max === 0) && (
                      <p><span className="text-[#9ca3af]">Salaire:</span> {(candidate.job_preferences.salary_expectations / 1000).toFixed(0)}k FCFA/mois</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Infos perso */}
            {(candidate.sector || candidate.main_job || candidate.nationality || candidate.date_of_birth) && (
              <Card className="border border-[#e5e7eb] overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-[#F4F6F8]/50">
                  <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Informations</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-1 text-xs">
                  {candidate.sector && <p><span className="text-[#9ca3af]">Secteur:</span> {candidate.sector}</p>}
                  {candidate.main_job && <p><span className="text-[#9ca3af]">Métier:</span> {candidate.main_job}</p>}
                  {candidate.nationality && <p><span className="text-[#9ca3af]">Nationalité:</span> {candidate.nationality}</p>}
                  {candidate.date_of_birth && <p><span className="text-[#9ca3af]">Naissance:</span> {new Date(candidate.date_of_birth).toLocaleDateString('fr-FR')}</p>}
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {candidate.certifications?.length > 0 && (
              <Card className="border border-[#e5e7eb] overflow-hidden">
                <CardHeader className="py-2.5 px-4 bg-[#F4F6F8]/50 flex flex-row items-center gap-2">
                  <Award className="h-4 w-4 text-[#226D68]" />
                  <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2">
                    {candidate.certifications.map((cert) => (
                      <div key={cert.id} className="text-xs">
                        <p className="font-medium text-[#2C2C2C]">{cert.title}</p>
                        <p className="text-[#9ca3af]">{cert.issuer} • {cert.year}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            <Card className="border border-[#e5e7eb] overflow-hidden">
              <CardHeader className="py-2.5 px-4 bg-[#F4F6F8]/50 flex flex-row items-center gap-2">
                <FileText className="h-4 w-4 text-[#226D68]" />
                <CardTitle className="text-sm font-semibold text-[#2C2C2C]">Documents</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {subscription?.plan?.plan_type === 'FREEMIUM' ? (
                  <BlurredDocuments documents={documents} subscription={subscription} />
                ) : documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const serveUrl = documentApi.getDocumentServeUrl(doc.id)
                      const labels = { CV: 'CV', ATTESTATION: 'Attestation', CERTIFICATE: 'Certificat', DIPLOMA: 'Diplôme', OTHER: 'Autre' }
                      return (
                        <div key={doc.id} className="flex items-center justify-between gap-2 p-2 rounded-md border border-[#e5e7eb] hover:bg-[#F4F6F8]/50 group">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-[#2C2C2C] truncate">{doc.original_filename}</p>
                            <Badge variant="outline" className="text-[10px] h-4 px-1 mt-0.5 border-[#226D68]/30 text-[#226D68]">{labels[doc.document_type] || doc.document_type}</Badge>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(serveUrl, '_blank')}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { const a = document.createElement('a'); a.href = serveUrl; a.download = doc.original_filename || `doc_${doc.id}`; a.click(); }}><Download className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#9ca3af] py-2">Aucun document</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
