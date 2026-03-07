import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Briefcase, MapPin, Building2, Loader2, ArrowLeft, ArrowRight, UserPlus,
  Calendar, FileText, DollarSign, Clock, Layers, Share2, BadgeCheck,
  Globe, Mail, ExternalLink,
} from 'lucide-react'
import { candidateApi, authApiService } from '@/services/api'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SEO } from '@/components/seo/SEO'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PublicFooter from '@/components/layout/PublicFooter'
import { Toast } from '@/components/common/Toast'

const STYLES = `
.jo { font-family: 'DM Sans', system-ui, sans-serif; }
.jo-serif { font-family: 'DM Serif Display', Georgia, serif; }

.jo-card {
  border-radius: 20px; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02);
  background: white;
}

.jo-header { position: relative; overflow: hidden; }
.jo-header::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%);
  pointer-events: none;
}

.jo-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 10px;
  background: white; border: 1px solid #F0F0F0;
  font-size: 12px; font-weight: 600; color: #374151;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.jo-section {
  padding: 24px 28px; border-bottom: 1px solid #F3F4F6;
}
.jo-section:last-child { border-bottom: none; }

.jo-section-title {
  font-size: 11px; font-weight: 800; color: #0E7C7B;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
}
.jo-section-title::before {
  content: ''; width: 3px; height: 14px; border-radius: 2px;
  background: linear-gradient(to bottom, #0E7C7B, #F28C28);
}

/* Rich HTML content rendering */
.jo-prose {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 14px; line-height: 1.8; color: #374151;
}
.jo-prose h1 {
  font-size: 20px; font-weight: 700; line-height: 1.3;
  margin: 20px 0 8px; color: #111827;
  font-family: 'DM Serif Display', Georgia, serif;
}
.jo-prose h2 {
  font-size: 17px; font-weight: 700; line-height: 1.35;
  margin: 18px 0 6px; color: #1F2937;
  font-family: 'DM Serif Display', Georgia, serif;
}
.jo-prose h3 {
  font-size: 15px; font-weight: 700; line-height: 1.4;
  margin: 14px 0 4px; color: #374151;
}
.jo-prose p { margin: 6px 0; }
.jo-prose strong, .jo-prose b { font-weight: 700; color: #1F2937; }
.jo-prose em, .jo-prose i { font-style: italic; }
.jo-prose u { text-decoration: underline; text-underline-offset: 2px; }
.jo-prose s, .jo-prose strike { text-decoration: line-through; color: #9CA3AF; }
.jo-prose ul { padding-left: 22px; margin: 10px 0; list-style-type: disc; }
.jo-prose ol { padding-left: 22px; margin: 10px 0; list-style-type: decimal; }
.jo-prose ul ul { list-style-type: circle; }
.jo-prose ul ul ul { list-style-type: square; }
.jo-prose li { margin-bottom: 4px; display: list-item; line-height: 1.7; }
.jo-prose a {
  color: #0E7C7B; text-decoration: underline;
  text-underline-offset: 2px; font-weight: 500;
}
.jo-prose a:hover { color: #0A5E5D; }
.jo-prose blockquote {
  border-left: 3px solid #0E7C7B; margin: 14px 0; padding: 10px 18px;
  background: rgba(14,124,123,0.03); color: #4B5563;
  font-style: italic; border-radius: 0 10px 10px 0;
}
.jo-prose hr {
  border: none; height: 1px; margin: 20px 0;
  background: linear-gradient(to right, transparent, #D1D5DB, transparent);
}

.jo-reveal { animation: joReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes joReveal { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`

function formatDateLong(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}

export default function JobOfferDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [toast, setToast] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          await authApiService.getCurrentUser()
          setIsAuthenticated(true)
        }
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (!id) return
    const loadJob = async () => {
      try {
        setLoading(true)
        const data = await candidateApi.getJob(id)
        setJob(data)
      } catch {
        setJob(null)
        setToast({ message: 'Offre introuvable.', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    loadJob()
  }, [id])

  const goToApplyInDashboard = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }
    navigate(`/candidate/dashboard/offres/${id}`)
  }

  const goToRegister = () => {
    setShowLoginModal(false)
    if (job?.id) {
      candidateApi.trackJobRegisterClick(job.id)
    }
    const redirect = `/candidate/dashboard/offres/${id}`
    navigate(`${ROUTES.REGISTER_CANDIDAT}?redirect=${encodeURIComponent(redirect)}`)
  }

  const goToLogin = () => {
    setShowLoginModal(false)
    const redirect = `/candidate/dashboard/offres/${id}`
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: job?.title, url })
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setToast({ message: 'Lien copié dans le presse-papier', type: 'success' })
    }
  }

  const appMode = job?.external_application_url ? 'external_url' : job?.application_email ? 'email' : 'internal'

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col jo">
        <style>{STYLES}</style>
        <PublicNavbar variant="dark" />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E7C7B]" />
        </main>
        <PublicFooter />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col jo">
        <style>{STYLES}</style>
        <PublicNavbar variant="dark" />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
            <Briefcase className="h-7 w-7 text-gray-300" />
          </div>
          <h1 className="jo-serif text-xl text-gray-800 mb-2">Offre introuvable</h1>
          <p className="text-sm text-gray-400 mb-6 text-center">Cette offre n&apos;existe pas ou a été supprimée.</p>
          <Link
            to="/offres"
            className="h-10 px-5 rounded-xl text-xs font-semibold text-[#0E7C7B] hover:bg-[#E8F4F3] inline-flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Retour aux offres
          </Link>
        </main>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col jo">
      <style>{STYLES}</style>
      <SEO
        title={`${job.title} | Offres d'emploi | Yemma Solutions`}
        description={job.description?.replace(/<[^>]*>/g, '').slice(0, 160) || `Offre d'emploi ${job.title} - ${job.company_name || ''}`}
        keywords={`${job.title}, ${job.location}, ${job.contract_type}, offres emploi, recrutement`}
        canonical={`/offres/${job.id}`}
      />
      <PublicNavbar variant="dark" />

      <main className="flex-1 py-8 md:py-12" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)' }}>
        <div className="max-w-3xl mx-auto px-3 xs:px-4 sm:px-6">

          <Link
            to="/offres"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#0E7C7B] mb-6 transition-colors jo-reveal"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour aux offres
          </Link>

          <article className="jo-card jo-reveal" style={{ animationDelay: '0.05s' }}>

            {/* ── Header ── */}
            <div className="jo-header" style={{ background: 'linear-gradient(135deg, #0A4F4E 0%, #0E7C7B 40%, #12908F 100%)' }}>
              <div className="px-6 sm:px-7 pt-8 pb-7">
                <div className="flex items-start gap-4 sm:gap-5">
                  {job.company_logo_url ? (
                    <img
                      src={job.company_logo_url}
                      alt={job.company_name || ''}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-xl shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/10">
                      <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white/50" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="jo-serif text-xl sm:text-2xl text-white font-bold leading-tight">
                      {job.title}
                    </h1>
                    {job.company_name && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-white/80 text-sm font-medium">{job.company_name}</span>
                        <BadgeCheck className="h-4 w-4 text-emerald-300/80" />
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {job.location && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/90 text-[11px] font-semibold">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </span>
                      )}
                      {job.contract_type && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/90 text-[11px] font-semibold">
                          <Briefcase className="h-3 w-3" /> {job.contract_type}
                        </span>
                      )}
                      {job.sector && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/90 text-[11px] font-semibold">
                          <Layers className="h-3 w-3" /> {job.sector}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Info badges ── */}
            <div className="px-6 sm:px-7 py-5 bg-[#FAFBFC] border-b border-gray-100">
              <div className="flex flex-wrap gap-2.5">
                {job.salary_range && (
                  <div className="jo-badge">
                    <DollarSign className="h-3.5 w-3.5 text-[#F28C28]" />
                    <span>{job.salary_range}</span>
                  </div>
                )}
                {job.created_at && (
                  <div className="jo-badge">
                    <Calendar className="h-3.5 w-3.5 text-[#0E7C7B]" />
                    <span>Publiée le {formatDateLong(job.created_at)}</span>
                  </div>
                )}
                {job.expires_at && (
                  <div className="jo-badge">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <span>Expire le {formatDateLong(job.expires_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Description ── */}
            {job.description && (
              <div className="jo-section">
                <div className="jo-section-title">Description du poste</div>
                <div className="jo-prose" dangerouslySetInnerHTML={{ __html: job.description }} />
              </div>
            )}

            {/* ── Prérequis ── */}
            {job.requirements && (
              <div className="jo-section">
                <div className="jo-section-title">Prérequis & qualifications</div>
                <div className="jo-prose" dangerouslySetInnerHTML={{ __html: job.requirements }} />
              </div>
            )}

            {/* ── Candidature ── */}
            <div className="jo-section bg-[#FAFBFC]">
              <div className="jo-section-title">Candidature</div>

              {appMode === 'internal' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Postuler via Yemma Solutions</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Accédez à votre espace candidat pour soumettre votre candidature</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={goToApplyInDashboard}
                    className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all"
                    style={{ background: 'linear-gradient(135deg, #0E7C7B, #0A5E5D)' }}
                  >
                    <FileText className="h-4 w-4" />
                    {isAuthenticated ? 'Postuler depuis mon espace' : 'Se connecter pour postuler'}
                  </button>
                </div>
              )}

              {appMode === 'external_url' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-gray-100">
                    <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700">Candidature externe</p>
                      <p className="text-[11px] text-[#0E7C7B] mt-0.5 truncate font-medium">{job.external_application_url}</p>
                    </div>
                  </div>
                  <a
                    href={job.external_application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all"
                    style={{ background: 'linear-gradient(135deg, #0E7C7B, #0A5E5D)' }}
                  >
                    <Globe className="h-4 w-4" />
                    Postuler sur le site externe
                  </a>
                </div>
              )}

              {appMode === 'email' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-gray-100">
                    <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700">Candidature par email</p>
                      <p className="text-[11px] text-[#0E7C7B] mt-0.5 truncate font-medium">{job.application_email}</p>
                    </div>
                  </div>
                  <a
                    href={`mailto:${job.application_email}?subject=Candidature : ${encodeURIComponent(job.title)}`}
                    className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all"
                    style={{ background: 'linear-gradient(135deg, #0E7C7B, #0A5E5D)' }}
                  >
                    <Mail className="h-4 w-4" />
                    Envoyer ma candidature par email
                  </a>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-6 sm:px-7 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-semibold">Offre active</span>
                {job.created_at && (
                  <>
                    <span>·</span>
                    <span>Publiée le {formatDateLong(job.created_at)}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-[#0E7C7B] hover:bg-[#E8F4F3] transition-all"
                title="Partager cette offre"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>

          {/* Retour aux offres */}
          <div className="mt-6 text-center jo-reveal" style={{ animationDelay: '0.1s' }}>
            <Link
              to="/offres"
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[#0E7C7B] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voir toutes les offres
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />

      {/* Modal : Créer un compte pour postuler */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-xl">
          <div className="bg-gradient-to-b from-[#E8F4F3] to-white pt-8 pb-6 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#0E7C7B]/10 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-7 w-7 text-[#0E7C7B]" />
            </div>
            <DialogHeader>
              <DialogTitle className="jo-serif text-xl text-gray-800">
                Créez votre compte
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-2 text-sm leading-relaxed">
                Inscrivez-vous pour accéder à votre espace candidat et postuler à cette offre.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6 flex flex-col gap-3">
            <button
              type="button"
              className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px]"
              style={{ background: 'linear-gradient(135deg, #F28C28, #E07B1F)' }}
              onClick={goToRegister}
            >
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="w-full h-11 rounded-xl text-sm font-semibold border-2 border-[#0E7C7B] text-[#0E7C7B] hover:bg-[#E8F4F3] transition-all"
              onClick={goToLogin}
            >
              J&apos;ai déjà un compte
            </button>
            <button
              type="button"
              className="text-xs text-gray-400 hover:text-gray-600 pt-1 transition-colors"
              onClick={() => setShowLoginModal(false)}
            >
              Annuler
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
