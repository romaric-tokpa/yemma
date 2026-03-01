/**
 * Page dédiée à la grille d'évaluation du candidat.
 * Accessible via /admin/review/:candidateId/evaluation
 */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import EvaluationForm from '@/components/admin/EvaluationForm'
import { candidateApi } from '@/services/api'
import AdminLayout from '@/components/admin/AdminLayout'
import { ROUTES } from '@/constants/routes'
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2, RefreshCw, Star, Briefcase, MapPin, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

const generateAvatarUrl = (firstName, lastName) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=226D68&color=fff&bold=true`
}

const STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  IN_REVIEW: 'En cours',
  VALIDATED: 'Validé',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
}

const STATUS_STYLES = {
  DRAFT: 'bg-gray-100 text-[#6b7280] border-gray-200',
  SUBMITTED: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  VALIDATED: 'bg-[#226D68]/15 text-[#1a5a55] border-[#226D68]/30',
  REJECTED: 'bg-[#e76f51]/15 text-[#c04a2f] border-[#e76f51]/30',
  ARCHIVED: 'bg-gray-100 text-[#6b7280] border-gray-200',
}

export default function AdminEvaluationPage() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [candidateData, setCandidateData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCandidateData = async () => {
    if (!candidateId) return
    try {
      setLoading(true)
      setError(null)
      const profile = await candidateApi.getProfile(candidateId)
      setCandidateData(profile)
    } catch (err) {
      let errorMessage = 'Erreur lors du chargement des données du candidat'
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') errorMessage = 'Erreur réseau.'
      else if (err.response?.status === 401) errorMessage = 'Session expirée. Reconnectez-vous.'
      else if (err.response?.status === 403) errorMessage = 'Accès refusé.'
      else if (err.response?.status === 404) errorMessage = `Profil non trouvé (ID ${candidateId}).`
      else if (err.response?.data?.detail) errorMessage = err.response.data.detail
      else if (err.message) errorMessage = err.message
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidateData()
  }, [candidateId])

  const handleValidationSuccess = async () => {
    await new Promise(r => setTimeout(r, 1000))
    await fetchCandidateData()
  }

  const fullName = candidateData ? `${candidateData.first_name || ''} ${candidateData.last_name || ''}`.trim() || 'Candidat' : ''
  const displayPhoto = candidateData ? generateAvatarUrl(candidateData.first_name, candidateData.last_name) : ''
  const candidateLocation = candidateData ? [candidateData.city, candidateData.country].filter(Boolean).join(', ') : ''

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-10 h-10 animate-spin text-[#226D68]" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-red-800">Erreur de chargement</h2>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="sm" onClick={fetchCandidateData} className="border-red-300 text-red-700 hover:bg-red-100">
                  <RefreshCw className="w-4 h-4 mr-2" />Réessayer
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/validation')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />Retour
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-b from-[#F9FAFB] via-white to-[#F4F6F8]/50">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6" aria-label="Fil d'Ariane">
            <Link
              to={ROUTES.ADMIN_REVIEW(candidateId)}
              className="p-2 rounded-lg text-[#6b7280] hover:text-[#226D68] hover:bg-[#E8F4F3] transition-colors shrink-0"
              aria-label="Retour au profil"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <ol className="flex items-center gap-2 text-sm min-w-0 flex-wrap">
              <li>
                <Link to="/admin/validation" className="text-[#6b7280] hover:text-[#226D68] transition-colors">
                  Validation
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li>
                <Link to={ROUTES.ADMIN_REVIEW(candidateId)} className="text-[#6b7280] hover:text-[#226D68] transition-colors truncate max-w-[140px] sm:max-w-none inline-block">
                  {fullName}
                </Link>
              </li>
              <li className="text-gray-300">/</li>
              <li className="font-semibold text-[#2C2C2C] truncate">Évaluation</li>
            </ol>
          </nav>

          {/* Carte candidat — contexte pour l'évaluateur */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-[#226D68]/20 bg-[#226D68]/10 shrink-0">
                  <img src={displayPhoto} alt={fullName} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#2C2C2C] truncate">{fullName}</h2>
                  {candidateData?.profile_title && (
                    <p className="text-sm text-[#226D68] font-medium mt-0.5 truncate">{candidateData.profile_title}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-[#6b7280]">
                    {candidateData?.total_experience != null && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        {candidateData.total_experience} an{candidateData.total_experience > 1 ? 's' : ''} d&apos;expérience
                      </span>
                    )}
                    {candidateLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {candidateLocation}
                      </span>
                    )}
                    {candidateData?.admin_score != null && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#226D68]/10 text-[#1a5a55] font-medium">
                        <Star className="h-3 w-3 fill-current" />
                        {candidateData.admin_score}/5
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${STATUS_STYLES[candidateData?.status] || STATUS_STYLES.DRAFT}`}>
                  {STATUS_LABELS[candidateData?.status] || candidateData?.status}
                </span>
                <Button asChild variant="outline" size="sm" className="h-8 text-xs border-[#226D68]/30 text-[#226D68] hover:bg-[#E8F4F3]">
                  <Link to={ROUTES.ADMIN_REVIEW(candidateId)}>
                    <User className="h-3.5 w-3.5 mr-1.5" />
                    Voir le profil
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Grille d'évaluation */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#226D68]/8 to-[#226D68]/4">
              <h1 className="flex items-center gap-3 text-lg sm:text-xl font-bold text-[#2C2C2C]">
                <div className="w-10 h-10 rounded-xl bg-[#226D68]/15 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[#226D68]" strokeWidth={2} />
                </div>
                {candidateData?.status === 'VALIDATED' ? 'Mise à jour de l\'évaluation' : 'Grille d\'évaluation'}
              </h1>
              <p className="text-sm text-[#6b7280] mt-1">
                {candidateData?.status === 'VALIDATED'
                  ? 'Modifiez les critères et le résumé si nécessaire.'
                  : 'Évaluez le profil et validez ou rejetez le candidat.'}
              </p>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              <EvaluationForm
                candidateId={candidateId}
                candidateData={candidateData}
                onSuccess={handleValidationSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
