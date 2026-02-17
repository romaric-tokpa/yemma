import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Briefcase, MapPin, FileText, Loader2, ArrowLeft, ArrowRight, UserPlus, Calendar,
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
import { formatDate } from '@/utils/dateUtils'

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

  /** Redirection vers l'espace candidat pour postuler (seule voie de candidature) */
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar variant="dark" />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-[#226D68]" />
        </main>
        <PublicFooter />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicNavbar variant="dark" />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <Briefcase className="h-16 w-16 text-[#6b7280] mb-4" />
          <h1 className="text-xl font-bold text-[#2C2C2C] mb-2">Offre introuvable</h1>
          <p className="text-[#6b7280] mb-6 text-center">Cette offre n&apos;existe pas ou a été supprimée.</p>
          <Button variant="outline" onClick={() => navigate('/offres')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux offres
          </Button>
        </main>
        <PublicFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`${job.title} | Offres d'emploi | Yemma Solutions`}
        description={job.description?.replace(/<[^>]*>/g, '').slice(0, 160) || `Offre d'emploi ${job.title} - ${job.company_name || ''}`}
        keywords={`${job.title}, ${job.location}, ${job.contract_type}, offres emploi, recrutement`}
        canonical={`/offres/${job.id}`}
      />
      <PublicNavbar variant="dark" />

      <main
        className="flex-1 py-8 md:py-12"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0), linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          backgroundSize: '24px 24px, 100% 100%',
        }}
      >
        <div className="max-w-3xl mx-auto min-w-0 px-3 xs:px-4 sm:px-6">
          {/* Lien retour */}
          <Link
            to="/offres"
            className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#226D68] mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux offres
          </Link>

          {/* Carte détail offre */}
          <article className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* En-tête */}
            <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-b from-[#F8FAFC] to-white">
              <div className="flex items-start gap-4">
                {job.company_logo_url ? (
                  <div className="h-14 w-14 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={job.company_logo_url}
                      alt={job.company_name || ''}
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-xl border border-[#226D68]/20 bg-[#E8F4F3]/50 flex items-center justify-center shrink-0">
                    <Briefcase className="h-7 w-7 text-[#226D68]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] leading-tight break-words">
                    {job.title}
                  </h1>
                  {job.company_name && (
                    <p className="text-sm text-[#6b7280] mt-1 font-medium">{job.company_name}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F4F3]/80 text-[#226D68] text-xs font-medium">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {job.location}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-[#2C2C2C] text-xs font-medium">
                      {job.contract_type}
                    </span>
                    {job.salary_range && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">
                        <span className="font-semibold shrink-0">FCFA</span>
                        <span className="break-words">{job.salary_range}</span>
                      </span>
                    )}
                    {job.sector && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-xs font-medium">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        {job.sector}
                      </span>
                    )}
                    {job.created_at && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        Publié le {formatDate(job.created_at)}
                      </span>
                    )}
                    {job.expires_at && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        Expire le {formatDate(job.expires_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="px-4 sm:px-6 py-6 space-y-6">
              {job.description && (
                <div
                  className="job-offer-description rich-text-content text-[#2C2C2C] [&_p]:text-[#4b5563] [&_p]:leading-relaxed [&_p]:mb-3 [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h4]:font-bold [&_h1]:uppercase [&_h2]:uppercase [&_h3]:uppercase [&_h4]:uppercase [&_h1]:tracking-wide [&_h2]:tracking-wide [&_h3]:tracking-wide [&_h4]:tracking-wide [&_h1]:text-xs [&_h2]:text-xs [&_h3]:text-xs [&_h4]:text-xs [&_h1]:mb-3 [&_h2]:mb-3 [&_h3]:mb-3 [&_h4]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-[#4b5563] [&_li]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              )}
              {job.requirements && (
                <div className="rounded-xl border border-gray-100 bg-[#F8FAFC]/60 p-4 sm:p-5">
                  <h4 className="font-bold text-[#2C2C2C] text-sm uppercase tracking-wide mb-3">Prérequis</h4>
                  <p className="text-sm text-[#4b5563] leading-relaxed whitespace-pre-wrap break-words">{job.requirements}</p>
                </div>
              )}
            </div>

            {/* Pied avec CTA - candidature uniquement depuis l'espace candidat */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <Link to="/offres">
                <Button variant="outline">Retour aux offres</Button>
              </Link>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <p className="text-sm text-[#6b7280] self-center sm:mr-2">
                  Pour postuler, accédez à votre espace candidat.
                </p>
                <Button
                  className="bg-[#226D68] hover:bg-[#1a5a55] text-white font-semibold h-11 px-6"
                  onClick={goToApplyInDashboard}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isAuthenticated ? 'Postuler depuis mon espace candidat' : 'Se connecter pour postuler'}
                </Button>
              </div>
            </div>
          </article>
        </div>
      </main>

      <PublicFooter />

      {/* Modal : Créer un compte pour postuler */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-xl">
          <div className="bg-gradient-to-b from-[#E8F4F3] to-white pt-8 pb-6 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#226D68]/20 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-7 w-7 text-[#226D68]" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#2C2C2C]">
                Créez votre compte
              </DialogTitle>
              <DialogDescription className="text-[#6b7280] mt-2 text-sm leading-relaxed">
                Inscrivez-vous pour accéder à votre espace candidat et postuler à cette offre.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6 flex flex-col gap-3">
            <Button
              className="w-full h-11 bg-[#e76f51] hover:bg-[#d45a3f] text-white font-semibold rounded-lg"
              onClick={goToRegister}
            >
              Créer mon compte
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full h-11 rounded-lg border-[#226D68] text-[#226D68] hover:bg-[#E8F4F3]" onClick={goToLogin}>
              J&apos;ai déjà un compte
            </Button>
            <button
              type="button"
              className="text-sm text-[#6b7280] hover:text-[#2C2C2C] pt-1"
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
