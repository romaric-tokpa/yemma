/**
 * Profil Candidat — Redesign Yemma Solutions
 * Aesthetic: Luxury editorial × modern recruitment dashboard
 */
import { useState, useEffect, useRef } from 'react'
import {
  X, Loader2, Mail, Phone, MapPin, Briefcase, GraduationCap, Award,
  Target, Star, CheckCircle2, FileText, Download, ExternalLink, ChevronLeft, ChevronRight,
  BarChart3, MessageSquare, Calendar, Sparkles, Clock, Globe
} from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { searchApiService, candidateApi, documentApi } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDisplayScore, getValidationScore, getDecisionLabel, getDecisionBadgeStyle } from '@/utils/validationScore'

/* ─── Helpers ──────────────────────────────────────────────────── */

const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=0E7C7B&color=fff&bold=true&font-size=0.4`
}

const generateCompanyLogoUrl = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Co')}&size=80&background=E8F4F3&color=0E7C7B&bold=true&font-size=0.35`

const formatSkillLevel = (level) => ({ BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé', EXPERT: 'Expert' }[level] || level)
const formatAvailability = (v) => ({ immediate: 'Immédiate', '1_week': '1 semaine', '2_weeks': '2 semaines', '1_month': '1 mois', '2_months': '2 mois', '3_months': '3 mois', negotiable: 'À négocier' }[v] || v)
const formatRemotePreference = (v) => ({ onsite: 'Sur site', hybrid: 'Hybride', remote: 'Télétravail', flexible: 'Flexible' }[v] || v)
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : ''
const hasJobPreferences = (jp) => jp && ((jp.desired_positions?.length > 0) || jp.contract_type || (jp.contract_types?.length > 0) || jp.target_sectors?.length > 0 || jp.availability || jp.salary_min != null || jp.salary_max != null)

const CRITERIA_BY_ID = {
  tech_1: 'Compétences clés', tech_2: 'Résolution de problèmes', tech_3: 'Connaissance sectorielle', tech_4: 'Outils & méthodes',
  exp_1: 'Pertinence expérience', exp_2: 'Réalisations', exp_3: 'Progression',
  soft_1: 'Communication', soft_2: "Esprit d'équipe", soft_3: 'Leadership', soft_4: 'Adaptabilité',
  mot_1: 'Motivation', mot_2: 'Adéquation culturelle', mot_3: 'Projet professionnel',
  pot_1: "Apprentissage", pot_2: "Potentiel d'évolution",
}
const RATING_COLORS = { 1: '#EF4444', 2: '#F59E0B', 3: '#3B82F6', 4: '#0E7C7B', 5: '#10B981' }
const RATING_LABELS = { 1: 'Insuffisant', 2: 'À développer', 3: 'Satisfaisant', 4: 'Bon', 5: 'Excellent' }

const DOC_TYPE_LABELS = { CV: 'CV', DIPLOMA: 'Diplôme', CERTIFICATE: 'Certificat', ATTESTATION: 'Attestation', RECOMMENDATION_LETTER: 'Recommandation', OTHER: 'Autre' }

function normalizeProfileToCandidate(profile) {
  if (!profile) return null
  return { ...profile, experiences: profile.experiences || [], educations: profile.educations || [], skills: profile.skills || [], certifications: profile.certifications || [], job_preferences: profile.job_preferences }
}

/* ─── Score Gauge ──────────────────────────────────────────────── */

function ScoreRing({ value, max = 100, size = 72, stroke = 5 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - pct)
  const color = pct >= 0.8 ? '#10B981' : pct >= 0.6 ? '#0E7C7B' : pct >= 0.4 ? '#3B82F6' : pct >= 0.2 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gray-100" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color, lineHeight: 1 }}>{Math.round(value)}</span>
        <span className="text-[9px] text-gray-400 -mt-0.5">/{max}</span>
      </div>
    </div>
  )
}

/* ─── Criteria Bar ─────────────────────────────────────────────── */

function CriteriaBar({ label, value, comment }) {
  const color = RATING_COLORS[value] || '#E2E8F0'
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-gray-600 truncate pr-2">{label}</span>
        <span className="text-[10px] font-semibold shrink-0" style={{ color }}>{RATING_LABELS[value]}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${(value / 5) * 100}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }} />
      </div>
      {comment && <p className="text-[10px] text-gray-400 italic mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">{comment}</p>}
    </div>
  )
}

/* ─── Skill Pill ───────────────────────────────────────────────── */

function SkillPill({ skill, variant = 'technical' }) {
  const styles = {
    technical: 'bg-gradient-to-r from-[#E8F4F3] to-[#d5edeb] text-[#0A5E5D] border-[#0E7C7B]/10',
    soft: 'bg-gradient-to-r from-[#FEF3F0] to-[#fde8e2] text-[#c4563a] border-[#e76f51]/10',
    tool: 'bg-gradient-to-r from-[#F1F5F9] to-[#e8edf3] text-[#334155] border-gray-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[variant]} transition-transform hover:scale-105`}>
      {skill.name}
      {skill.level && (
        <span className="opacity-60 text-[9px] font-medium">· {formatSkillLevel(skill.level)}</span>
      )}
    </span>
  )
}

/* ─── Timeline Dot ─────────────────────────────────────────────── */

function TimelineDot({ active }) {
  return (
    <div className="relative flex flex-col items-center shrink-0">
      <div className={`w-3 h-3 rounded-full border-2 ${active ? 'bg-[#0E7C7B] border-[#0E7C7B] shadow-[0_0_0_3px_rgba(14,124,123,0.15)]' : 'bg-white border-gray-300'}`} />
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────────── */

export function CandidateProfileDialog({ candidateId, candidateIds = [], jobId, companyId, open, onOpenChange, onNavigate }) {
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    if (open && candidateId) {
      setLoading(true)
      setCandidate(null)
      setDocuments([])
      setPhotoError(false)
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
            setDocuments((docs || []).filter((d) => !d.deleted_at && d.document_type !== 'PROFILE_PHOTO' && d.document_type !== 'COMPANY_LOGO'))
          } catch { setDocuments([]) }
        } catch (err) {
          console.error('Load error:', err?.response?.status, err?.message)
          setCandidate(null)
        } finally { setLoading(false) }
      }
      load()
    }
  }, [open, candidateId, jobId, companyId])

  // Photo handling
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
  const displayScore = getDisplayScore(candidate)

  // Navigation
  const ids = candidateIds?.length > 0 ? candidateIds : []
  const currentIndex = ids.indexOf(candidateId)
  const prevId = currentIndex > 0 ? ids[currentIndex - 1] : null
  const nextId = currentIndex >= 0 && currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null
  const canNavigate = ids.length > 1 && onNavigate
  const positionLabel = ids.length > 1 ? `${currentIndex + 1} / ${ids.length}` : null

  // Evaluation
  const { decision } = getValidationScore(candidate)
  const hasReport = report && (report.total_score_100 != null || report.overall_score != null || report.decision || report.global_comment || report.summary || (report.ratings && Object.keys(report.ratings).length > 0))
  const evalRatings = report.ratings || {}
  const evalComments = report.comments || {}
  const globalComment = report.global_comment || report.globalComment
  const summary = report.summary
  const totalScore100 = report.total_score_100 ?? (report.overall_score != null ? report.overall_score * 20 : null)

  // Skills breakdown
  const technicalSkills = candidate?.skills?.filter(s => s.skill_type === 'TECHNICAL') || []
  const softSkills = candidate?.skills?.filter(s => s.skill_type === 'SOFT') || []
  const toolSkills = candidate?.skills?.filter(s => s.skill_type === 'TOOL') || []

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md animate-in fade-in-0 duration-200" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 w-screen h-screen bg-[#F8F9FB] overflow-hidden animate-in slide-in-from-bottom duration-300"
            onPointerDownOutside={(e) => e.preventDefault()}
            aria-describedby={undefined}
          >
            {/* ═══ INLINE STYLES ═══ */}
            <style>{`.ym-serif { font-family: 'DM Serif Display', Georgia, serif; } .ym-sans { font-family: 'DM Sans', system-ui, sans-serif; } .ym-glass { background: rgba(255,255,255,0.72); backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4); } .ym-card { background: white; border-radius: 16px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02); transition: box-shadow 0.3s ease, transform 0.3s ease; } .ym-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04); } .ym-reveal { animation: ymReveal 0.5s ease both; } .ym-reveal-1 { animation-delay: 0.05s; } .ym-reveal-2 { animation-delay: 0.1s; } .ym-reveal-3 { animation-delay: 0.15s; } .ym-reveal-4 { animation-delay: 0.2s; } .ym-reveal-5 { animation-delay: 0.25s; } @keyframes ymReveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } @keyframes ymPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } } .ym-dot-pulse { animation: ymPulse 2s ease-in-out infinite; } .ym-scrollbar::-webkit-scrollbar { width: 5px; } .ym-scrollbar::-webkit-scrollbar-track { background: transparent; } .ym-scrollbar::-webkit-scrollbar-thumb { background: rgba(14,124,123,0.15); border-radius: 10px; } .ym-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(14,124,123,0.3); } .ym-pattern { background-image: radial-gradient(circle at 1px 1px, rgba(14,124,123,0.04) 1px, transparent 0); background-size: 24px 24px; }`}</style>

            {/* ═══ TOP BAR ═══ */}
            <div className="ym-glass sticky top-0 z-20 border-b border-gray-200/60">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {canNavigate ? (
                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => prevId != null && onNavigate(prevId)}
                        disabled={prevId == null}
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#0E7C7B] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {positionLabel && (
                        <span className="text-[11px] font-semibold text-gray-400 tabular-nums px-1 select-none">{positionLabel}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => nextId != null && onNavigate(nextId)}
                        disabled={nextId == null}
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-[#0E7C7B] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#0E7C7B] ym-dot-pulse" />
                      <span className="ym-sans text-xs font-medium text-gray-400 tracking-wide uppercase">Profil candidat</span>
                    </div>
                  )}
                </div>

                <DialogPrimitive.Title className="sr-only">Profil candidat</DialogPrimitive.Title>

                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* ═══ BODY ═══ */}
            <div ref={contentRef} className="h-[calc(100vh-56px)] overflow-y-auto ym-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0E7C7B]/10 to-[#F28C28]/10 flex items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-[#0E7C7B]" />
                    </div>
                  </div>
                  <p className="ym-sans text-sm text-gray-400 mt-4 font-medium">Chargement du profil…</p>
                </div>
              ) : !candidate ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <X className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-gray-400 ym-sans mb-4">Profil non trouvé</p>
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Fermer</Button>
                </div>
              ) : (
                <div className="ym-sans">
                  {/* ═══ HERO HEADER ═══ */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0A5E5D] via-[#0E7C7B] to-[#12918F]" />
                    <div className="absolute inset-0 ym-pattern opacity-30" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#F28C28]/8 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-20">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="ym-reveal relative shrink-0 group">
                          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 blur-sm" />
                          <img
                            src={displayPhoto}
                            alt={fullName}
                            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-2xl ring-2 ring-white/20 transition-transform duration-300 group-hover:scale-[1.03]"
                            onError={(e) => { setPhotoError(true); e.target.src = defaultAvatar }}
                          />
                          {candidate.status === 'VALIDATED' && (
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center">
                              <CheckCircle2 className="h-4.5 w-4.5 text-[#10B981]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 ym-reveal ym-reveal-1">
                          <h1 className="ym-serif text-2xl sm:text-3xl text-white leading-tight tracking-tight">
                            {fullName}
                          </h1>
                          {candidate.profile_title && (
                            <p className="text-white/70 text-sm sm:text-base mt-1 font-light">{candidate.profile_title}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-4">
                            {location && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-sm">
                                <MapPin className="h-3 w-3" />{location}
                              </span>
                            )}
                            {candidate.total_experience != null && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-sm">
                                <Briefcase className="h-3 w-3" />{candidate.total_experience} an{candidate.total_experience > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            {candidate.email && (
                              <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors">
                                <Mail className="h-3 w-3" />{candidate.email}
                              </a>
                            )}
                            {candidate.phone && (
                              <a href={`tel:${candidate.phone}`} className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors">
                                <Phone className="h-3 w-3" />{candidate.phone}
                              </a>
                            )}
                          </div>
                        </div>

                        {displayScore != null && (
                          <div className="ym-reveal ym-reveal-2 shrink-0 hidden sm:block">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                              <ScoreRing value={displayScore.value * (displayScore.scale === '5' ? 20 : 1)} size={80} stroke={5} />
                              <p className="text-center text-[10px] font-semibold text-white/60 mt-2 uppercase tracking-wider">Score</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ═══ CONTENT ZONE (overlapping cards) ═══ */}
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 pb-12 relative z-10">
                    {documents.length > 0 && (
                      <div className="ym-card ym-reveal ym-reveal-2 p-3 mb-4 flex items-center gap-3 overflow-x-auto">
                        <FileText className="h-4 w-4 text-[#0E7C7B] shrink-0" />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {documents.map((doc) => {
                            const typeLabel = DOC_TYPE_LABELS[doc.document_type] || 'Doc'
                            const serveUrl = documentApi.getDocumentServeUrl(doc.id)
                            const filename = doc.original_filename || doc.originalFilename || `Document ${doc.id}`
                            return (
                              <div key={doc.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8F9FB] hover:bg-[#E8F4F3] border border-transparent hover:border-[#0E7C7B]/10 transition-all group shrink-0">
                                <span className="text-[10px] font-bold text-[#0E7C7B] bg-[#E8F4F3] px-1.5 py-0.5 rounded uppercase">{typeLabel}</span>
                                <span className="text-[11px] font-medium text-gray-600 truncate max-w-[120px]" title={filename}>{filename}</span>
                                <button type="button" onClick={() => window.open(serveUrl, '_blank')} className="h-5 w-5 flex items-center justify-center rounded text-gray-300 hover:text-[#0E7C7B] transition-colors" title="Ouvrir">
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                                <button type="button" onClick={() => { const a = document.createElement('a'); a.href = serveUrl; a.download = filename; a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }} className="h-5 w-5 flex items-center justify-center rounded text-gray-300 hover:text-[#0E7C7B] transition-colors" title="Télécharger">
                                  <Download className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* ─── LEFT COLUMN (8 cols) ─── */}
                      <div className="lg:col-span-8 space-y-4">
                        {candidate.professional_summary && (
                          <div className="ym-card ym-reveal ym-reveal-2 p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
                              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Résumé</h2>
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed rich-text-content" dangerouslySetInnerHTML={{ __html: candidate.professional_summary }} />
                          </div>
                        )}

                        {candidate.experiences?.length > 0 && (
                          <div className="ym-card ym-reveal ym-reveal-3 p-6">
                            <div className="flex items-center gap-2 mb-5">
                              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
                              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Parcours professionnel</h2>
                              <span className="text-[10px] font-semibold text-gray-300 ml-auto">{candidate.experiences.length} poste{candidate.experiences.length > 1 ? 's' : ''}</span>
                            </div>

                            <div className="relative">
                              <div className="absolute left-[5px] top-3 bottom-3 w-[1.5px] bg-gradient-to-b from-[#0E7C7B]/30 via-[#0E7C7B]/10 to-transparent" />

                              <div className="space-y-5">
                                {candidate.experiences.map((exp, idx) => (
                                  <div key={exp.id} className="flex gap-4 group">
                                    <TimelineDot active={idx === 0 || exp.is_current} />
                                    <div className="flex-1 min-w-0 pb-1">
                                      <div className="flex items-start gap-3">
                                        <img
                                          src={exp.company_logo_url || generateCompanyLogoUrl(exp.company_name)}
                                          alt=""
                                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-100 shadow-sm"
                                          onError={(e) => e.target.src = generateCompanyLogoUrl('')}
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-sm text-gray-800 leading-snug">{exp.position}</p>
                                          <p className="text-xs text-[#0E7C7B] font-medium mt-0.5">{exp.company_name}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                              <Calendar className="h-2.5 w-2.5" />
                                              {formatDate(exp.start_date)}
                                              {exp.end_date ? ` – ${formatDate(exp.end_date)}` : exp.is_current ? (
                                                <span className="inline-flex items-center gap-0.5 ml-1 text-[#10B981] font-semibold">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /> En poste
                                                </span>
                                              ) : ''}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {exp.description && (
                                        <div className="text-xs text-gray-500 mt-2.5 ml-[52px] leading-relaxed rich-text-content" dangerouslySetInnerHTML={{ __html: exp.description }} />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {candidate.educations?.length > 0 && (
                          <div className="ym-card ym-reveal ym-reveal-4 p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
                              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Formation</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {candidate.educations.map((edu) => (
                                <div key={edu.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F9FB] hover:bg-[#E8F4F3]/50 transition-colors group">
                                  <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 group-hover:border-[#0E7C7B]/20 transition-colors">
                                    <GraduationCap className="h-4 w-4 text-[#0E7C7B]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-gray-800 leading-snug">{edu.diploma}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{edu.institution}</p>
                                    {edu.graduation_year && (
                                      <span className="text-[10px] text-gray-400">{edu.graduation_year}</span>
                                    )}
                                    {edu.level && (
                                      <span className="ml-1.5 text-[9px] font-semibold text-[#0E7C7B] bg-[#E8F4F3] px-1.5 py-0.5 rounded-full">{edu.level}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ─── RIGHT COLUMN (4 cols) ─── */}
                      <div className="lg:col-span-4 space-y-4">
                        {hasReport && (
                          <div className="ym-card ym-reveal ym-reveal-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-[#0E7C7B] to-[#0A5E5D] px-5 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-[#F28C28]" />
                                  <h3 className="text-sm font-bold text-white">Évaluation Yemma</h3>
                                </div>
                                {totalScore100 != null && (
                                  <ScoreRing value={totalScore100} size={56} stroke={4} />
                                )}
                              </div>
                              {decision && (
                                <div className="mt-3">
                                  <Badge className={`text-xs font-semibold border bg-white/90 text-[#0A5E5D] border-white/20`}>
                                    {getDecisionLabel(decision)}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="p-5 space-y-4">
                              {(globalComment || summary) && (
                                <div>
                                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    <MessageSquare className="h-3 w-3" />Avis global
                                  </p>
                                  <p className="text-xs text-gray-600 leading-relaxed italic border-l-2 border-[#F28C28]/40 pl-3">
                                    {globalComment || summary}
                                  </p>
                                </div>
                              )}

                              {Object.keys(evalRatings).length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Critères détaillés</p>
                                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto ym-scrollbar pr-1">
                                    {Object.entries(evalRatings).map(([id, val]) => {
                                      if (val == null || val < 1) return null
                                      return <CriteriaBar key={id} label={CRITERIA_BY_ID[id] || id} value={val} comment={evalComments[id]} />
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {candidate.skills?.length > 0 && (
                          <div className="ym-card ym-reveal ym-reveal-3 p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
                              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Compétences</h3>
                            </div>

                            {technicalSkills.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Techniques</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {technicalSkills.map((s) => <SkillPill key={s.id} skill={s} variant="technical" />)}
                                </div>
                              </div>
                            )}
                            {softSkills.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Soft Skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {softSkills.map((s) => <SkillPill key={s.id} skill={s} variant="soft" />)}
                                </div>
                              </div>
                            )}
                            {toolSkills.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Outils</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {toolSkills.map((s) => <SkillPill key={s.id} skill={s} variant="tool" />)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {hasJobPreferences(candidate.job_preferences) && (
                          <div className="ym-card ym-reveal ym-reveal-4 p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
                              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Recherche</h3>
                            </div>

                            <div className="space-y-3">
                              {candidate.job_preferences.desired_positions?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Postes visés</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {candidate.job_preferences.desired_positions.map((pos, i) => (
                                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F4F3] text-[11px] font-semibold text-[#0E7C7B]">
                                        <Target className="h-2.5 w-2.5" />{pos}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {candidate.job_preferences.availability && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-gray-500">Disponibilité :</span>
                                  <span className="font-semibold text-gray-700">{formatAvailability(candidate.job_preferences.availability)}</span>
                                </div>
                              )}
                              {candidate.job_preferences.remote_preference && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Globe className="h-3.5 w-3.5 text-gray-400" />
                                  <span className="text-gray-500">Mode :</span>
                                  <span className="font-semibold text-gray-700">{formatRemotePreference(candidate.job_preferences.remote_preference)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {candidate.certifications?.length > 0 && (
                          <div className="ym-card ym-reveal ym-reveal-5 p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
                              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Certifications</h3>
                            </div>
                            <div className="space-y-2.5">
                              {candidate.certifications.map((cert) => (
                                <div key={cert.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F8F9FB] hover:bg-[#FFF8F0] transition-colors group">
                                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 group-hover:border-[#F28C28]/20 transition-colors">
                                    <Award className="h-3.5 w-3.5 text-[#F28C28]" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-xs text-gray-800">{cert.title}</p>
                                    <p className="text-[10px] text-gray-500">{cert.issuer}{cert.year ? ` · ${cert.year}` : ''}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </DialogPrimitive.Root>
  )
}
