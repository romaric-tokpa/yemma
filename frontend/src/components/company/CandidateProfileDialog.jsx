/**
 * Popup plein écran pour afficher le profil d'un candidat
 */
import { useState, useEffect } from 'react'
import {
  X, Loader2, Mail, Phone, MapPin, Briefcase, GraduationCap, Award,
  Target, Star, CheckCircle2, FileText, Download, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { searchApiService, candidateApi, documentApi } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
}

const generateCompanyLogoUrl = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Co')}&size=80&background=e8f4f3&color=226D68&bold=true`

const formatSkillLevel = (level) => ({ BEGINNER: 'Déb.', INTERMEDIATE: 'Int.', ADVANCED: 'Avancé', EXPERT: 'Exp.' }[level] || level)
const formatAvailability = (v) => ({ immediate: 'Immédiate', '1_week': 'Sous 1 semaine', '2_weeks': 'Sous 2 semaines', '1_month': 'Sous 1 mois', '2_months': 'Sous 2 mois', '3_months': 'Sous 3 mois', negotiable: 'À négocier' }[v] || v)
const formatRemotePreference = (v) => ({ onsite: 'Sur site', hybrid: 'Hybride', remote: 'Télétravail', flexible: 'Flexible' }[v] || v)

const hasJobPreferences = (jp) => jp && ((jp.desired_positions?.length > 0) || jp.contract_type || (jp.contract_types?.length > 0) || jp.target_sectors?.length > 0 || jp.availability || jp.salary_min != null || jp.salary_max != null)

function normalizeProfileToCandidate(profile) {
  if (!profile) return null
  return {
    ...profile,
    first_name: profile.first_name,
    last_name: profile.last_name,
    experiences: profile.experiences || [],
    educations: profile.educations || [],
    skills: profile.skills || [],
    certifications: profile.certifications || [],
    job_preferences: profile.job_preferences,
  }
}

const DOC_TYPE_LABELS = {
  CV: 'CV',
  DIPLOMA: 'Diplôme',
  CERTIFICATE: 'Certificat',
  ATTESTATION: 'Attestation',
  RECOMMENDATION_LETTER: 'Lettre de recommandation',
  OTHER: 'Autre',
}

export function CandidateProfileDialog({ candidateId, candidateIds = [], jobId, companyId, open, onOpenChange, onNavigate }) {
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [photoError, setPhotoError] = useState(false)

  useEffect(() => {
    if (open && candidateId) {
      setLoading(true)
      setCandidate(null)
      setDocuments([])
      const load = async () => {
        const cId = Number(companyId)
        const jId = jobId != null ? Number(jobId) : null
        const useCompanyEndpoint = cId > 0 && jId > 0
        try {
          if (useCompanyEndpoint) {
            const data = await candidateApi.companyGetCandidateProfile(cId, jId, candidateId)
            setCandidate(normalizeProfileToCandidate(data))
          } else {
            try {
              const data = await searchApiService.getCandidateProfile(candidateId)
              setCandidate(data)
            } catch {
              const profile = await candidateApi.getProfile(candidateId)
              setCandidate(normalizeProfileToCandidate(profile))
            }
          }
          try {
            const docs = await documentApi.getCandidateDocuments(candidateId)
            const filtered = (docs || []).filter((d) => !d.deleted_at && d.document_type !== 'PROFILE_PHOTO' && d.document_type !== 'COMPANY_LOGO')
            setDocuments(filtered)
          } catch {
            setDocuments([])
          }
        } catch (err) {
          console.error('CandidateProfileDialog load error:', err?.response?.status, err?.message)
          setCandidate(null)
        } finally {
          setLoading(false)
        }
      }
      load()
    }
  }, [open, candidateId, jobId, companyId])

  let photoUrl = candidate?.photo_url
  if (photoUrl?.startsWith('/')) {
    const match = photoUrl.match(/\/api\/v1\/documents\/serve\/(\d+)/)
    if (match) photoUrl = documentApi.getDocumentServeUrl(parseInt(match[1]))
  }
  const defaultAvatar = generateAvatarUrl(candidate?.first_name, candidate?.last_name)
  const displayPhoto = (photoUrl && !photoError && !photoUrl.includes('ui-avatars.com')) ? photoUrl : defaultAvatar
  const fullName = `${candidate?.first_name || ''} ${candidate?.last_name || ''}`.trim() || 'Candidat'
  const location = [candidate?.city, candidate?.country].filter(Boolean).join(', ') || null
  const report = candidate?.admin_report || {}
  const overallScore = report.overall_score

  const ids = candidateIds && candidateIds.length > 0 ? candidateIds : []
  const currentIndex = ids.indexOf(candidateId)
  const prevId = currentIndex > 0 ? ids[currentIndex - 1] : null
  const nextId = currentIndex >= 0 && currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null
  const canNavigate = ids.length > 1 && onNavigate

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {open && (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 w-screen h-screen max-w-none max-h-none translate-x-0 translate-y-0 rounded-none border-0 bg-white overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          {/* Barre fixe en haut */}
          <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
            <div className="w-20 flex items-center gap-1 shrink-0">
              {canNavigate && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => prevId != null && onNavigate(prevId)}
                    disabled={prevId == null}
                    className="h-9 w-9 p-0 rounded-lg border-gray-200"
                    title="Profil précédent"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nextId != null && onNavigate(nextId)}
                    disabled={nextId == null}
                    className="h-9 w-9 p-0 rounded-lg border-gray-200"
                    title="Profil suivant"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
            <DialogPrimitive.Title className="flex-1 text-lg font-semibold text-[#2C2C2C] truncate text-center">Profil candidat</DialogPrimitive.Title>
            <div className="w-20 flex justify-end shrink-0">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-[#226D68] mb-4" />
                <p className="text-sm text-[#6b7280]">Chargement du profil…</p>
              </div>
            ) : !candidate ? (
              <div className="text-center py-24">
                <p className="text-[#6b7280] mb-4">Profil non trouvé.</p>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
              </div>
            ) : (
              <>
                {/* Header profil */}
                <Card className="overflow-hidden border border-gray-200 shadow-sm mb-6">
                  <div className="bg-gradient-to-r from-[#226D68] to-[#1a5a55] px-6 py-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      <div className="flex flex-col items-center shrink-0">
                        <img
                          src={displayPhoto}
                          alt={fullName}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/40 shadow-lg"
                          onError={(e) => { setPhotoError(true); e.target.src = defaultAvatar }}
                        />
                        {overallScore != null && (
                          <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-lg bg-orange-500/90 text-white text-sm font-semibold">
                            <Star className="h-3.5 w-3.5 fill-current" /> {overallScore.toFixed(1)}/5
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left text-white min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold truncate text-white">{fullName}</h1>
                        {candidate.profile_title && <p className="text-white/90 text-sm mt-0.5">{candidate.profile_title}</p>}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-3 text-sm text-white/85">
                          {location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{location}</span>}
                          {candidate.total_experience != null && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{candidate.total_experience} an{candidate.total_experience > 1 ? 's' : ''} d&apos;exp.</span>}
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                          {candidate.email && <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-xs"><Mail className="h-3.5 w-3.5" />{candidate.email}</a>}
                          {candidate.phone && <a href={`tel:${candidate.phone}`} className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-xs"><Phone className="h-3.5 w-3.5" />{candidate.phone}</a>}
                        </div>
                        {candidate.status === 'VALIDATED' && (
                          <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg bg-white/20 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Profil vérifié
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {documents.length > 0 && (
                      <Card className="border border-gray-200">
                        <CardHeader className="py-2 px-4 bg-[#F8FAFC]/50 flex flex-row items-center gap-2"><FileText className="h-3.5 w-3.5 text-[#226D68] shrink-0" /><CardTitle className="text-xs font-semibold">Documents</CardTitle></CardHeader>
                        <CardContent className="p-3 pt-1">
                          <div className="flex flex-wrap gap-1.5">
                            {documents.map((doc) => {
                              const typeLabel = DOC_TYPE_LABELS[doc.document_type] || doc.document_type || 'Doc'
                              const serveUrl = documentApi.getDocumentServeUrl(doc.id)
                              const filename = doc.original_filename || `Document ${doc.id}`
                              return (
                                <div key={doc.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F8FAFC] border border-gray-100 text-xs">
                                  <span className="truncate max-w-[140px]" title={filename}>{filename}</span>
                                  <span className="text-[10px] text-[#6b7280] shrink-0">({typeLabel})</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 text-[#6b7280] hover:text-[#226D68]" onClick={() => window.open(serveUrl, '_blank')} title="Ouvrir"><ExternalLink className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0 text-[#6b7280] hover:text-[#226D68]" onClick={() => { const a = document.createElement('a'); a.href = serveUrl; a.download = filename; a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }} title="Télécharger"><Download className="h-3 w-3" /></Button>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {candidate.professional_summary && (
                      <Card className="border border-gray-200">
                        <CardHeader className="py-2.5 px-4 bg-[#F8FAFC]/50"><CardTitle className="text-sm font-semibold">Résumé professionnel</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2"><div className="text-sm text-[#2C2C2C] leading-relaxed rich-text-content" dangerouslySetInnerHTML={{ __html: candidate.professional_summary }} /></CardContent>
                      </Card>
                    )}

                    {candidate.experiences?.length > 0 && (
                      <Card className="border border-gray-200">
                        <CardHeader className="py-2.5 px-4 bg-[#F8FAFC]/50 flex items-center gap-2"><Briefcase className="h-4 w-4 text-[#226D68]" /><CardTitle className="text-sm font-semibold">Expériences</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2 space-y-4">
                          {candidate.experiences.map((exp) => (
                            <div key={exp.id} className="flex gap-3 border-l-2 border-[#226D68]/40 pl-3">
                              <img src={exp.company_logo_url || generateCompanyLogoUrl(exp.company_name)} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={(e) => e.target.src = generateCompanyLogoUrl('')} />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-sm text-[#2C2C2C]">{exp.position}</p>
                                <p className="text-xs text-[#6b7280]">{exp.company_name}</p>
                                <p className="text-[10px] text-[#6b7280] mt-0.5">
                                  {new Date(exp.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                  {exp.end_date ? ` – ${new Date(exp.end_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}` : exp.is_current ? ' – En poste' : ''}
                                </p>
                                {exp.description && <div className="text-xs text-[#2C2C2C] mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.description }} />}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {candidate.educations?.length > 0 && (
                      <Card className="border border-gray-200">
                        <CardHeader className="py-2.5 px-4 bg-[#F8FAFC]/50 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[#226D68]" /><CardTitle className="text-sm font-semibold">Formations</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2 space-y-2">
                          {candidate.educations.map((edu) => (
                            <div key={edu.id} className="border-l-2 border-[#226D68]/30 pl-2.5 py-1">
                              <p className="font-medium text-sm text-[#2C2C2C]">{edu.diploma}</p>
                              <p className="text-xs text-[#6b7280]">{edu.institution} {edu.graduation_year && `• ${edu.graduation_year}`}</p>
                              {edu.level && <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1 border-[#226D68]/30 text-[#226D68]">{edu.level}</Badge>}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-4">
                    {candidate.skills?.length > 0 && (
                      <Card className="border border-gray-200">
                        <CardHeader className="py-2.5 px-4 bg-[#F8FAFC]/50"><CardTitle className="text-sm font-semibold">Compétences</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2">
                          {(() => {
                            const technical = candidate.skills.filter(s => s.skill_type === 'TECHNICAL')
                            const soft = candidate.skills.filter(s => s.skill_type === 'SOFT')
                            const tool = candidate.skills.filter(s => s.skill_type === 'TOOL')
                            const SkillList = ({ items, color }) => items.length > 0 && (
                              <div className="mb-3 last:mb-0">
                                <div className="flex flex-wrap gap-1">
                                  {items.map((s) => <Badge key={s.id} className={`text-[10px] h-5 px-1.5 ${color}`}>{s.name}{s.level && ` • ${formatSkillLevel(s.level)}`}</Badge>)}
                                </div>
                              </div>
                            )
                            return (
                              <div>
                                <SkillList items={technical} color="bg-[#E8F4F3] text-[#226D68] border-0" />
                                <SkillList items={soft} color="bg-[#FDF2F0] text-[#e76f51] border-0" />
                                <SkillList items={tool} color="bg-[#F4F6F8] text-[#2C2C2C] border border-gray-200" />
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    )}

                    {hasJobPreferences(candidate.job_preferences) && (
                      <Card className="border border-gray-200">
                        <CardHeader className="py-2.5 px-4 bg-[#F8FAFC]/50 flex items-center gap-2"><Target className="h-4 w-4 text-[#226D68]" /><CardTitle className="text-sm font-semibold">Recherche d&apos;emploi</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2 space-y-3 text-xs">
                          {candidate.job_preferences.desired_positions?.length > 0 && (
                            <div><p className="text-[10px] font-semibold text-[#6b7280] uppercase mb-1">Poste(s)</p><div className="flex flex-wrap gap-1">{candidate.job_preferences.desired_positions.map((pos, i) => <Badge key={i} className="text-[10px] h-5 bg-[#E8F4F3] text-[#226D68] border-0">{pos}</Badge>)}</div></div>
                          )}
                          {candidate.job_preferences.availability && <p><span className="text-[#6b7280]">Disponibilité:</span> {formatAvailability(candidate.job_preferences.availability)}</p>}
                          {candidate.job_preferences.remote_preference && <p><span className="text-[#6b7280]">Télétravail:</span> {formatRemotePreference(candidate.job_preferences.remote_preference)}</p>}
                        </CardContent>
                      </Card>
                    )}

                    {candidate.certifications?.length > 0 && (
                      <Card className="border border-gray-200">
                        <CardHeader className="py-2.5 px-4 bg-[#F8FAFC]/50 flex items-center gap-2"><Award className="h-4 w-4 text-[#226D68]" /><CardTitle className="text-sm font-semibold">Certifications</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-2 space-y-2">
                          {candidate.certifications.map((cert) => (
                            <div key={cert.id} className="text-xs"><p className="font-medium text-[#2C2C2C]">{cert.title}</p><p className="text-[#6b7280]">{cert.issuer} • {cert.year}</p></div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  )
}
